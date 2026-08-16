/**
 * WebAuthn Biometric Vault Helper
 * SEC-01 REMEDIATION: The insecure legacy XOR master password storage in localStorage has been completely purged.
 * Biometric authentication will be re-enabled using WebCrypto hardware key wrapping in the dedicated WebAuthn PRF phase.
 */

const BIOMETRIC_STORAGE_KEY = 'xerox_biometric_credential';

export function isWebAuthnSupported(): boolean {
  return false; // Temporarily disabled until dedicated WebAuthn PRF redesign phase
}

export function isBiometricsConfigured(): boolean {
  return false;
}

export function clearBiometricsConfig(): void {
  try {
    localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
  } catch (e) {}
}

export async function registerBiometrics(_masterPassword: string): Promise<boolean> {
  clearBiometricsConfig();
  throw new Error('Biometric unlock is temporarily disabled for security remediation. Please unlock with your Master Password or Recovery Key.');
}

export async function authenticateBiometrics(): Promise<string> {
  clearBiometricsConfig();
  throw new Error('Biometric unlock is temporarily disabled for security remediation. Please unlock with your Master Password or Recovery Key.');
}
