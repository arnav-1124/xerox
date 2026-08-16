/**
 * Core Vault Application Service & State Machine
 * Owns business logic for vault initialization, locking/unlocking state, and item manipulation using 2-tier VEK/KEK envelope encryption.
 * P1 Implementation: Multi-authenticator WebAuthn PRF key unwrapping, zero master password storage.
 */

import { VaultState, VaultSettings } from '../../types';
import { VaultItem } from '../../domain/vault/VaultItem';
import { VaultEnvelopeV2, isVaultEnvelopeV2, WebAuthnProtection } from '../../domain/vault/VaultEnvelope';
import { IVaultRepository, defaultVaultRepository } from '../../infrastructure/storage/VaultRepository';
import { ICryptoService, defaultCryptoService } from '../../infrastructure/crypto/CryptoService';
import { authenticateWebAuthnCredential } from '../../lib/webauthn';

const RECOVERY_STORAGE_KEY = 'xerox_local_recovery_kit';

export class VaultService {
  private state: VaultState = 'uninitialized';
  private decryptedVault: VaultItem[] = [];
  private currentMasterPassword: string | null = null;
  private currentVEK: Uint8Array | null = null;

  constructor(
    private vaultRepo: IVaultRepository = defaultVaultRepository,
    private cryptoService: ICryptoService = defaultCryptoService
  ) {}

  getState(): VaultState {
    return this.state;
  }

  getDecryptedItems(): VaultItem[] {
    return [...this.decryptedVault];
  }

  getActiveVEK(): Uint8Array | null {
    return this.currentVEK ? new Uint8Array(this.currentVEK) : null;
  }

  async checkHasVault(): Promise<boolean> {
    const rawVault = await this.vaultRepo.getVault();
    const hasData = !!(rawVault && (rawVault.cipherText || (rawVault as any).encryptedVault));
    if (!hasData) {
      this.state = 'uninitialized';
    } else if (this.state === 'uninitialized') {
      this.state = 'locked';
    }
    return hasData;
  }

  async unlock(masterPassword: string): Promise<boolean> {
    this.state = 'unlocking';
    try {
      const rawVault = await this.vaultRepo.getVault();
      if (!rawVault) {
        this.state = 'uninitialized';
        throw new Error('No vault stored on device');
      }

      let decryptedRaw: any[] = [];
      let vekBytes: Uint8Array;

      if (isVaultEnvelopeV2(rawVault)) {
        const envelope = rawVault as VaultEnvelopeV2;
        vekBytes = await this.cryptoService.unwrapVEK(
          envelope.passwordProtection.wrappedVEK,
          envelope.passwordProtection.wrapIv,
          envelope.passwordProtection.salt,
          masterPassword
        );

        decryptedRaw = await this.cryptoService.decryptPayloadWithVEK(
          envelope.encryptedVault.cipherText,
          envelope.encryptedVault.iv,
          vekBytes
        );
      } else {
        const legacy = rawVault as any;
        decryptedRaw = await this.cryptoService.decrypt(
          legacy.cipherText,
          legacy.iv,
          legacy.salt,
          masterPassword
        );

        const recoveryBytes = new Uint8Array(32);
        if (typeof window !== 'undefined' && window.crypto) {
          window.crypto.getRandomValues(recoveryBytes);
        } else {
          for (let i = 0; i < 32; i++) recoveryBytes[i] = Math.floor(Math.random() * 256);
        }
        const recHex = Array.from(recoveryBytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        vekBytes = this.cryptoService.generateVEK();
        const encryptedVault = await this.cryptoService.encryptPayloadWithVEK(decryptedRaw, vekBytes);
        const pwdWrap = await this.cryptoService.wrapVEK(vekBytes, masterPassword);
        const recWrap = await this.cryptoService.wrapVEK(vekBytes, recHex);

        const v2Envelope: VaultEnvelopeV2 = {
          formatVersion: 2,
          cryptoVersion: 2,
          encryptedVault,
          passwordProtection: {
            salt: pwdWrap.salt,
            iterations: 100000,
            wrappedVEK: pwdWrap.wrappedVEK,
            wrapIv: pwdWrap.wrapIv,
          },
          recoveryProtection: {
            salt: recWrap.salt,
            iterations: 100000,
            wrappedVEK: recWrap.wrappedVEK,
            wrapIv: recWrap.wrapIv,
          },
          createdAt: legacy.updatedAt || Date.now(),
          updatedAt: Date.now(),
        };

        await this.vaultRepo.saveVault(v2Envelope as any);
        try {
          localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify({
            recoveryKeyHex: this.cryptoService.formatRecoveryKey(recHex),
            createdAt: Date.now(),
            confirmedSaved: false,
          }));
        } catch (e) {}
      }

      if (!Array.isArray(decryptedRaw)) {
        throw new Error('Invalid vault payload format');
      }

      this.decryptedVault = this.normalizeVaultItems(decryptedRaw);
      this.currentMasterPassword = masterPassword;
      this.currentVEK = vekBytes;
      this.state = 'unlocked';
      return true;
    } catch (err) {
      this.state = 'locked';
      return false;
    }
  }

  async unlockWithRecoveryKey(recoveryKeyInput: string): Promise<boolean> {
    this.state = 'unlocking';
    try {
      const rawVault = await this.vaultRepo.getVault();
      if (!rawVault || !isVaultEnvelopeV2(rawVault)) {
        this.state = 'locked';
        throw new Error('Invalid or unmigrated vault');
      }

      const cleanKey = this.cryptoService.parseRecoveryKey(recoveryKeyInput);
      const envelope = rawVault as VaultEnvelopeV2;

      const vekBytes = await this.cryptoService.unwrapVEK(
        envelope.recoveryProtection.wrappedVEK,
        envelope.recoveryProtection.wrapIv,
        envelope.recoveryProtection.salt,
        cleanKey
      );

      const decryptedRaw = await this.cryptoService.decryptPayloadWithVEK(
        envelope.encryptedVault.cipherText,
        envelope.encryptedVault.iv,
        vekBytes
      );

      if (!Array.isArray(decryptedRaw)) {
        throw new Error('Invalid vault payload format');
      }

      this.decryptedVault = this.normalizeVaultItems(decryptedRaw);
      this.currentVEK = vekBytes;
      this.currentMasterPassword = null;
      this.state = 'unlocked';
      return true;
    } catch {
      this.state = 'locked';
      return false;
    }
  }

  async unlockWithBiometrics(protection: WebAuthnProtection): Promise<boolean> {
    this.state = 'unlocking';
    try {
      const rawVault = await this.vaultRepo.getVault();
      if (!rawVault || !isVaultEnvelopeV2(rawVault)) {
        this.state = 'locked';
        throw new Error('Invalid or unmigrated vault');
      }

      const envelope = rawVault as VaultEnvelopeV2;
      const vekBytes = await authenticateWebAuthnCredential(protection);

      const decryptedRaw = await this.cryptoService.decryptPayloadWithVEK(
        envelope.encryptedVault.cipherText,
        envelope.encryptedVault.iv,
        vekBytes
      );

      if (!Array.isArray(decryptedRaw)) {
        throw new Error('Invalid vault payload format');
      }

      this.decryptedVault = this.normalizeVaultItems(decryptedRaw);
      this.currentVEK = vekBytes;
      this.currentMasterPassword = null;
      this.state = 'unlocked';
      return true;
    } catch {
      this.state = 'locked';
      return false;
    }
  }

  async addBiometricAuthenticator(protection: WebAuthnProtection): Promise<boolean> {
    if (this.state !== 'unlocked' || !this.currentVEK) {
      throw new Error('Vault must be unlocked to add biometric authenticator');
    }

    const rawVault = await this.vaultRepo.getVault();
    if (!rawVault || !isVaultEnvelopeV2(rawVault)) {
      throw new Error('Vault is not in V2 envelope format');
    }

    const envelope = rawVault as VaultEnvelopeV2;
    const existing = envelope.webauthnProtections || [];
    const updatedList = [...existing.filter((p) => p.credentialId !== protection.credentialId), protection];

    const updatedEnvelope: VaultEnvelopeV2 = {
      ...envelope,
      webauthnProtections: updatedList,
      updatedAt: Date.now(),
    };

    await this.vaultRepo.saveVault(updatedEnvelope as any);
    return true;
  }

  async removeBiometricAuthenticator(credentialId: string): Promise<boolean> {
    if (this.state !== 'unlocked') {
      throw new Error('Vault must be unlocked to remove biometric authenticator');
    }

    const rawVault = await this.vaultRepo.getVault();
    if (!rawVault || !isVaultEnvelopeV2(rawVault)) {
      throw new Error('Vault is not in V2 envelope format');
    }

    const envelope = rawVault as VaultEnvelopeV2;
    const existing = envelope.webauthnProtections || [];
    const updatedList = existing.filter((p) => p.credentialId !== credentialId);

    const updatedEnvelope: VaultEnvelopeV2 = {
      ...envelope,
      webauthnProtections: updatedList,
      updatedAt: Date.now(),
    };

    await this.vaultRepo.saveVault(updatedEnvelope as any);
    return true;
  }

  async getBiometricAuthenticators(): Promise<WebAuthnProtection[]> {
    const rawVault = await this.vaultRepo.getVault();
    if (!rawVault || !isVaultEnvelopeV2(rawVault)) return [];
    return (rawVault as VaultEnvelopeV2).webauthnProtections || [];
  }

  async changeMasterPassword(oldPassword: string, newPassword: string): Promise<boolean> {
    if (this.state !== 'unlocked' || !this.currentVEK) {
      throw new Error('Vault must be unlocked to change master password');
    }

    const rawVault = await this.vaultRepo.getVault();
    if (!rawVault || !isVaultEnvelopeV2(rawVault)) {
      throw new Error('Vault is not in V2 envelope format');
    }

    const envelope = rawVault as VaultEnvelopeV2;
    await this.cryptoService.unwrapVEK(
      envelope.passwordProtection.wrappedVEK,
      envelope.passwordProtection.wrapIv,
      envelope.passwordProtection.salt,
      oldPassword
    );

    const pwdWrap = await this.cryptoService.wrapVEK(this.currentVEK, newPassword);

    const updatedEnvelope: VaultEnvelopeV2 = {
      ...envelope,
      passwordProtection: {
        salt: pwdWrap.salt,
        iterations: 100000,
        wrappedVEK: pwdWrap.wrappedVEK,
        wrapIv: pwdWrap.wrapIv,
      },
      updatedAt: Date.now(),
    };

    await this.vaultRepo.saveVault(updatedEnvelope as any);
    this.currentMasterPassword = newPassword;
    return true;
  }

  async resetMasterPasswordWithRecoveryKey(recoveryKeyInput: string, newMasterPassword: string): Promise<boolean> {
    const rawVault = await this.vaultRepo.getVault();
    if (!rawVault || !isVaultEnvelopeV2(rawVault)) {
      throw new Error('Vault is not in V2 envelope format');
    }

    const cleanKey = this.cryptoService.parseRecoveryKey(recoveryKeyInput);
    const envelope = rawVault as VaultEnvelopeV2;

    const vekBytes = await this.cryptoService.unwrapVEK(
      envelope.recoveryProtection.wrappedVEK,
      envelope.recoveryProtection.wrapIv,
      envelope.recoveryProtection.salt,
      cleanKey
    );

    const pwdWrap = await this.cryptoService.wrapVEK(vekBytes, newMasterPassword);

    const updatedEnvelope: VaultEnvelopeV2 = {
      ...envelope,
      passwordProtection: {
        salt: pwdWrap.salt,
        iterations: 100000,
        wrappedVEK: pwdWrap.wrappedVEK,
        wrapIv: pwdWrap.wrapIv,
      },
      updatedAt: Date.now(),
    };

    await this.vaultRepo.saveVault(updatedEnvelope as any);
    this.currentVEK = vekBytes;
    this.currentMasterPassword = newMasterPassword;
    this.state = 'unlocked';
    return true;
  }

  async regenerateRecoveryKey(): Promise<string> {
    if (this.state !== 'unlocked' || !this.currentVEK) {
      throw new Error('Vault must be unlocked to regenerate recovery key');
    }

    const rawVault = await this.vaultRepo.getVault();
    if (!rawVault || !isVaultEnvelopeV2(rawVault)) {
      throw new Error('Vault is not in V2 envelope format');
    }

    const bytes = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    const recHex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const recWrap = await this.cryptoService.wrapVEK(this.currentVEK, recHex);
    const envelope = rawVault as VaultEnvelopeV2;

    const updatedEnvelope: VaultEnvelopeV2 = {
      ...envelope,
      recoveryProtection: {
        salt: recWrap.salt,
        iterations: 100000,
        wrappedVEK: recWrap.wrappedVEK,
        wrapIv: recWrap.wrapIv,
      },
      updatedAt: Date.now(),
    };

    await this.vaultRepo.saveVault(updatedEnvelope as any);

    const formattedKey = this.cryptoService.formatRecoveryKey(recHex);
    try {
      localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify({
        recoveryKeyHex: formattedKey,
        createdAt: Date.now(),
        confirmedSaved: false,
      }));
    } catch (e) {}

    return formattedKey;
  }

  async lock(): Promise<void> {
    this.state = 'locking';
    this.decryptedVault = [];
    this.currentMasterPassword = null;
    this.currentVEK = null;
    this.state = 'locked';
  }

  async createVault(masterPassword: string, initialItems: VaultItem[] = []): Promise<{ success: boolean; recoveryKey: string }> {
    this.state = 'unlocking';
    try {
      const vekBytes = this.cryptoService.generateVEK();
      const encryptedVault = await this.cryptoService.encryptPayloadWithVEK(initialItems, vekBytes);

      const bytes = new Uint8Array(32);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      const recHex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      const pwdWrap = await this.cryptoService.wrapVEK(vekBytes, masterPassword);
      const recWrap = await this.cryptoService.wrapVEK(vekBytes, recHex);

      const v2Envelope: VaultEnvelopeV2 = {
        formatVersion: 2,
        cryptoVersion: 2,
        encryptedVault,
        passwordProtection: {
          salt: pwdWrap.salt,
          iterations: 100000,
          wrappedVEK: pwdWrap.wrappedVEK,
          wrapIv: pwdWrap.wrapIv,
        },
        recoveryProtection: {
          salt: recWrap.salt,
          iterations: 100000,
          wrappedVEK: recWrap.wrappedVEK,
          wrapIv: recWrap.wrapIv,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.vaultRepo.saveVault(v2Envelope as any);
      this.decryptedVault = initialItems;
      this.currentMasterPassword = masterPassword;
      this.currentVEK = vekBytes;
      this.state = 'unlocked';

      const formattedKey = this.cryptoService.formatRecoveryKey(recHex);
      try {
        localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify({
          recoveryKeyHex: formattedKey,
          createdAt: Date.now(),
          confirmedSaved: false,
        }));
      } catch (e) {}

      return { success: true, recoveryKey: formattedKey };
    } catch (e) {
      this.state = 'error';
      return { success: false, recoveryKey: '' };
    }
  }

  async saveItem(item: VaultItem): Promise<boolean> {
    if (this.state !== 'unlocked' || !this.currentVEK) {
      throw new Error('Vault is locked');
    }

    const idx = this.decryptedVault.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.decryptedVault[idx] = item;
    } else {
      this.decryptedVault.push(item);
    }

    return await this.persistDecryptedVault();
  }

  async deleteItem(id: string): Promise<boolean> {
    if (this.state !== 'unlocked' || !this.currentVEK) {
      throw new Error('Vault is locked');
    }

    this.decryptedVault = this.decryptedVault.filter((i) => i.id !== id);
    return await this.persistDecryptedVault();
  }

  private async persistDecryptedVault(): Promise<boolean> {
    if (!this.currentVEK) return false;
    try {
      const rawVault = await this.vaultRepo.getVault();
      if (!rawVault || !isVaultEnvelopeV2(rawVault)) return false;

      const encryptedVault = await this.cryptoService.encryptPayloadWithVEK(
        this.decryptedVault,
        this.currentVEK
      );

      const envelope: VaultEnvelopeV2 = {
        ...(rawVault as VaultEnvelopeV2),
        encryptedVault,
        updatedAt: Date.now(),
      };

      await this.vaultRepo.saveVault(envelope as any);
      return true;
    } catch (e) {
      return false;
    }
  }

  private normalizeVaultItems(items: any[]): VaultItem[] {
    return items.map((item) => {
      if (item.type && item.payload) return item as VaultItem;

      if (item.entryType === 'note') {
        return {
          id: item.id,
          type: 'secure-note',
          title: item.websiteName || 'Untitled Note',
          categoryId: item.category || 'Notes',
          tags: item.tags || [],
          isFavorite: !!item.isFavorite,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
          payload: { content: item.notes || '' },
        };
      }

      if (item.entryType === 'card' || item.cardDetails) {
        return {
          id: item.id,
          type: 'credit-card',
          title: item.websiteName || 'Credit Card',
          categoryId: item.category || 'Financials',
          tags: item.tags || [],
          isFavorite: !!item.isFavorite,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
          payload: {
            cardNumber: item.cardDetails?.cardNumber || item.password || '',
            cardholderName: item.cardDetails?.cardholderName || item.username || '',
            expiryMonth: item.cardDetails?.expiryMonth || '',
            expiryYear: item.cardDetails?.expiryYear || '',
            cvv: item.cardDetails?.cvv || '',
            notes: item.notes,
          },
        };
      }

      return {
        id: item.id,
        type: 'login',
        title: item.websiteName || 'Login Item',
        categoryId: item.category || 'General',
        tags: item.tags || [],
        isFavorite: !!item.isFavorite,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
        payload: {
          websiteUrl: item.websiteUrl || '',
          username: item.username || '',
          password: item.password || '',
          notes: item.notes,
          totpSecret: item.totpSecret,
          history: item.history,
        },
      };
    });
  }
}

export const defaultVaultService = new VaultService();
