/**
 * Lossless Transactional Vault Migration Service (V1 -> V2 Envelope)
 */

import { VaultEnvelopeV2, isVaultEnvelopeV2 } from '../../domain/vault/VaultEnvelope';
import { getVaultMeta, saveVaultMeta } from '../../lib/db';
import { decryptVaultData, generateVEK, wrapVEK, encryptPayloadWithVEK, parseRecoveryKey } from '../../lib/crypto';

export class VaultMigrationService {
  /**
   * Migrate legacy V1 direct-KDF payload to V2 envelope format lossless.
   * If migration fails, legacy V1 metadata remains completely untouched.
   */
  async migrateV1ToV2(
    masterPassword: string,
    recoveryKeyHex: string
  ): Promise<{ envelope: VaultEnvelopeV2; vekBytes: Uint8Array }> {
    const meta = await getVaultMeta();
    if (!meta || !meta.encryptedVault || !meta.encryptedVault.cipherText) {
      throw new Error('No vault data to migrate');
    }

    const legacy = meta.encryptedVault;
    if (isVaultEnvelopeV2(legacy)) {
      throw new Error('Vault is already version 2 envelope format');
    }

    // 1. Decrypt legacy V1 payload using existing master password
    const decryptedItems = await decryptVaultData(
      legacy.cipherText,
      legacy.iv,
      legacy.salt,
      masterPassword
    );

    if (!Array.isArray(decryptedItems)) {
      throw new Error('Legacy V1 decryption failed: Invalid payload');
    }

    // 2. Generate new random 256-bit VEK
    const vekBytes = generateVEK();

    // 3. Encrypt payload with random VEK
    const encryptedVault = await encryptPayloadWithVEK(decryptedItems, vekBytes);

    // 4. Wrap VEK under Password KEK
    const pwdWrap = await wrapVEK(vekBytes, masterPassword);

    // 5. Wrap VEK under Recovery KEK
    const cleanRecoveryKey = parseRecoveryKey(recoveryKeyHex);
    const recWrap = await wrapVEK(vekBytes, cleanRecoveryKey);

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

    // 6. Transactional commit
    await saveVaultMeta({
      isInitialized: true,
      salt: pwdWrap.salt,
      encryptedVault: v2Envelope as any,
    });

    return { envelope: v2Envelope, vekBytes };
  }
}

export const defaultVaultMigrationService = new VaultMigrationService();
