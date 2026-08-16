/**
 * WebAuthn Biometric Vault Unlock Helper
 * Provides Touch ID / Face ID / Windows Hello passwordless authentication for Xerox Web Vault.
 */

const BIOMETRIC_STORAGE_KEY = 'xerox_biometric_credential';

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

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
    throw new Error('WebAuthn biometrics are not supported on this browser or environment.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  // Omit rp.id to let browser automatically resolve current origin domain
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge,
    rp: {
      name: 'Xerox Password Vault',
    },
    user: {
      id: userId,
      name: 'xerox_user',
      displayName: 'Xerox Vault Owner',
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
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

  const rawIdBase64Url = bufferToBase64Url(credential.rawId);

  // Encrypt master password with key derived from raw credential ID
  const enc = new TextEncoder();
  const encodedPwd = enc.encode(masterPassword);
  
  let keyVal = 0;
  for (let i = 0; i < rawIdBase64Url.length; i++) {
    keyVal = (keyVal << 5) - keyVal + rawIdBase64Url.charCodeAt(i);
    keyVal |= 0;
  }

  const encryptedChars: number[] = [];
  for (let i = 0; i < encodedPwd.length; i++) {
    encryptedChars.push(encodedPwd[i] ^ (Math.abs(keyVal + i) % 256));
  }

  const payload = {
    credentialId: rawIdBase64Url,
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
  const credIdBase64Url = config.credentialId;
  const rawIdBuffer = base64UrlToBuffer(credIdBase64Url);

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge,
    allowCredentials: [
      {
        id: rawIdBuffer,
        type: 'public-key',
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
  for (let i = 0; i < credIdBase64Url.length; i++) {
    keyVal = (keyVal << 5) - keyVal + credIdBase64Url.charCodeAt(i);
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
