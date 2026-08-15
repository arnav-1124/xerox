/**
 * WebAuthn Biometric Vault Unlock Helper
 * Provides TouchID / FaceID / Windows Hello passwordless authentication for Xerox Web Vault.
 */

const BIOMETRIC_STORAGE_KEY = 'xerox_biometric_credential';

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

export function isBiometricsConfigured(): boolean {
  try {
    return !!localStorage.getItem(BIOMETRIC_STORAGE_KEY);
  } catch (e) {
    return false;
  }
}

export function clearBiometricsConfig(): void {
  try {
    localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
  } catch (e) {}
}

export async function registerBiometrics(masterPassword: string): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn biometrics are not supported on this browser or device.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge,
    rp: {
      name: 'Xerox Local Password Vault',
      id: window.location.hostname || 'localhost',
    },
    user: {
      id: userId,
      name: 'vault_user',
      displayName: 'Xerox Vault Master',
    },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Touch ID, Face ID, Windows Hello
      userVerification: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Biometric registration was cancelled.');
  }

  // Simple obfuscated encryption using credential ID hash for local storage
  const credId = credential.id;
  const enc = new TextEncoder();
  const encodedPwd = enc.encode(masterPassword);
  
  let keyVal = 0;
  for (let i = 0; i < credId.length; i++) {
    keyVal = (keyVal << 5) - keyVal + credId.charCodeAt(i);
    keyVal |= 0;
  }

  const encryptedChars: number[] = [];
  for (let i = 0; i < encodedPwd.length; i++) {
    encryptedChars.push(encodedPwd[i] ^ (Math.abs(keyVal + i) % 256));
  }

  const payload = {
    credentialId: credId,
    wrapped: btoa(String.fromCharCode(...encryptedChars)),
    registeredAt: Date.now(),
  };

  localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(payload));
  return true;
}

export async function authenticateBiometrics(): Promise<string> {
  if (!isWebAuthnSupported() || !isBiometricsConfigured()) {
    throw new Error('Biometric authentication is not configured.');
  }

  const rawConfig = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
  if (!rawConfig) throw new Error('Biometric credential not found.');

  const config = JSON.parse(rawConfig);
  const rawId = config.credentialId;

  // Convert raw ID to Uint8Array for rawId matching
  const rawIdBytes = new Uint8Array(rawId.length);
  for (let i = 0; i < rawId.length; i++) {
    rawIdBytes[i] = rawId.charCodeAt(i);
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge,
    allowCredentials: [
      {
        id: rawIdBytes,
        type: 'public-key',
        transports: ['internal'],
      },
    ],
    userVerification: 'preferred',
    timeout: 60000,
  };

  const assertion = (await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error('Biometric authentication failed or was cancelled.');
  }

  // Decrypt wrapped master password
  let keyVal = 0;
  for (let i = 0; i < rawId.length; i++) {
    keyVal = (keyVal << 5) - keyVal + rawId.charCodeAt(i);
    keyVal |= 0;
  }

  const binaryWrapped = atob(config.wrapped);
  const decryptedBytes = new Uint8Array(binaryWrapped.length);
  for (let i = 0; i < binaryWrapped.length; i++) {
    decryptedBytes[i] = binaryWrapped.charCodeAt(i) ^ (Math.abs(keyVal + i) % 256);
  }

  const dec = new TextDecoder();
  return dec.decode(decryptedBytes);
}
