/**
 * Vault Envelope V2 Schema Specification
 * Formalizes 2-tier Envelope Encryption (VEK + KEK) and versioned storage schemas.
 */

export interface WrappedKeyProtection {
  salt: string;
  iterations: number;
  wrappedVEK: string; // Base64 AES-GCM ciphertext of 256-bit VEK
  wrapIv: string;     // Base64 12-byte IV used to wrap VEK
}

export interface VaultEnvelopeV2 {
  formatVersion: 2;
  cryptoVersion: 2;
  encryptedVault: {
    cipherText: string;
    iv: string;
  };
  passwordProtection: WrappedKeyProtection;
  recoveryProtection: WrappedKeyProtection;
  createdAt: number;
  updatedAt: number;
}

export function isVaultEnvelopeV2(obj: any): obj is VaultEnvelopeV2 {
  if (!obj || typeof obj !== 'object') return false;
  const hasV2Format = obj.formatVersion === 2 || obj.cryptoVersion === 2 || obj.version === 2;
  const hasEnvelopeStructure = !!(obj.encryptedVault && obj.passwordProtection && obj.recoveryProtection);
  return hasV2Format && hasEnvelopeStructure;
}
