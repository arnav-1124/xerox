/**
 * Coherent Cryptography Service Abstraction
 * Wraps WebCrypto AES-GCM 256-bit + PBKDF2 + VEK Envelope primitives behind a unified contract.
 */

import {
  encryptVaultData,
  decryptVaultData,
  createPasswordVerifier,
  verifyMasterPassword,
  checkPasswordBreached,
  calculatePasswordStrength,
  generateSecurePassword,
  encryptSharePayload,
  decryptSharePayload,
  deriveKeyBundle,
  encryptVaultDataWithKey,
  decryptVaultDataWithKey,
  generateVEK,
  wrapVEK,
  unwrapVEK,
  encryptPayloadWithVEK,
  decryptPayloadWithVEK,
  formatRecoveryKey,
  parseRecoveryKey,
  DerivedKeyBundle,
} from '../../lib/crypto';

export interface ICryptoService {
  encrypt(data: any, masterPassword: string, salt?: string): Promise<{ cipherText: string; iv: string; salt: string }>;
  decrypt(cipherText: string, iv: string, salt: string, masterPassword: string): Promise<any>;
  generateVEK(): Uint8Array;
  wrapVEK(vekBytes: Uint8Array, kekPassphrase: string, existingSalt?: string): Promise<{ wrappedVEK: string; wrapIv: string; salt: string }>;
  unwrapVEK(wrappedVEKBase64: string, wrapIvBase64: string, saltBase64: string, kekPassphrase: string): Promise<Uint8Array>;
  encryptPayloadWithVEK(data: any, vekBytes: Uint8Array): Promise<{ cipherText: string; iv: string }>;
  decryptPayloadWithVEK(cipherText: string, ivBase64: string, vekBytes: Uint8Array): Promise<any>;
  formatRecoveryKey(hex: string): string;
  parseRecoveryKey(formatted: string): string;
  createVerifier(masterPassword: string, salt: string): Promise<string>;
  verifyMaster(masterPassword: string, salt: string, verifier: string): Promise<boolean>;
  checkBreached(password: string): Promise<{ breached: boolean; count: number }>;
  calculateStrength(password: string): { score: number; label: 'Weak' | 'Fair' | 'Strong' | 'Very Strong'; color: string };
  generatePassword(optionsOrLength?: any): string;
  encryptSharePayload(payload: any, passphrase: string): Promise<string>;
  decryptSharePayload(encoded: string, passphrase: string): any;
  deriveKeyBundle(masterPassword: string, salt: string): Promise<DerivedKeyBundle>;
  encryptWithKey(data: any, keyBundle: DerivedKeyBundle): Promise<{ cipherText: string; iv: string; salt: string }>;
  decryptWithKey(cipherText: string, iv: string, salt: string, keyBundle: DerivedKeyBundle): Promise<any>;
}

export class WebCryptoService implements ICryptoService {
  async encrypt(data: any, masterPassword: string, salt?: string) {
    return await encryptVaultData(data, masterPassword, salt);
  }

  async decrypt(cipherText: string, iv: string, salt: string, masterPassword: string) {
    return await decryptVaultData(cipherText, iv, salt, masterPassword);
  }

  generateVEK(): Uint8Array {
    return generateVEK();
  }

  async wrapVEK(vekBytes: Uint8Array, kekPassphrase: string, existingSalt?: string) {
    return await wrapVEK(vekBytes, kekPassphrase, existingSalt);
  }

  async unwrapVEK(wrappedVEKBase64: string, wrapIvBase64: string, saltBase64: string, kekPassphrase: string) {
    return await unwrapVEK(wrappedVEKBase64, wrapIvBase64, saltBase64, kekPassphrase);
  }

  async encryptPayloadWithVEK(data: any, vekBytes: Uint8Array) {
    return await encryptPayloadWithVEK(data, vekBytes);
  }

  async decryptPayloadWithVEK(cipherText: string, ivBase64: string, vekBytes: Uint8Array) {
    return await decryptPayloadWithVEK(cipherText, ivBase64, vekBytes);
  }

  formatRecoveryKey(hex: string) {
    return formatRecoveryKey(hex);
  }

  parseRecoveryKey(formatted: string) {
    return parseRecoveryKey(formatted);
  }

  async createVerifier(masterPassword: string, salt: string) {
    return await createPasswordVerifier(masterPassword, salt);
  }

  async verifyMaster(masterPassword: string, salt: string, verifier: string) {
    return await verifyMasterPassword(masterPassword, salt, verifier);
  }

  async checkBreached(password: string) {
    return await checkPasswordBreached(password);
  }

  calculateStrength(password: string) {
    return calculatePasswordStrength(password);
  }

  generatePassword(optionsOrLength?: any) {
    return generateSecurePassword(optionsOrLength);
  }

  async encryptSharePayload(payload: any, passphrase: string) {
    return await encryptSharePayload(payload, passphrase);
  }

  decryptSharePayload(encoded: string, passphrase: string) {
    return decryptSharePayload(encoded, passphrase);
  }

  async deriveKeyBundle(masterPassword: string, salt: string) {
    return await deriveKeyBundle(masterPassword, salt);
  }

  async encryptWithKey(data: any, keyBundle: DerivedKeyBundle) {
    return await encryptVaultDataWithKey(data, keyBundle);
  }

  async decryptWithKey(cipherText: string, iv: string, salt: string, keyBundle: DerivedKeyBundle) {
    return await decryptVaultDataWithKey(cipherText, iv, salt, keyBundle);
  }
}

export const defaultCryptoService: ICryptoService = new WebCryptoService();
