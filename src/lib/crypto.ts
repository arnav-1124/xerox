import CryptoJS from 'crypto-js';

/**
 * WebCrypto API encryption wrapper (PBKDF2 + AES-GCM) with pure JS fallback (CryptoJS).
 * Works across both Secure Contexts (HTTPS/localhost) and Non-Secure Local Origins (e.g., http://192.168.x.x:3000).
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_SIZE = 16;
const IV_SIZE = 12;

function isSubtleCryptoAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined'
  );
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.getRandomValues === 'function'
  ) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM Key from Master Password and Salt
export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  if (!isSubtleCryptoAvailable()) {
    throw new Error('WebCrypto API subtle is not available in this environment.');
  }
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext data object using Master Password (Legacy V1 Direct KDF)
export async function encryptVaultData(
  data: any,
  masterPassword: string,
  existingSalt?: string
): Promise<{ cipherText: string; iv: string; salt: string }> {
  const salt = existingSalt
    ? new Uint8Array(base64ToArrayBuffer(existingSalt))
    : getRandomBytes(SALT_SIZE);

  const iv = getRandomBytes(IV_SIZE);

  if (isSubtleCryptoAvailable()) {
    try {
      const key = await deriveKey(masterPassword, salt);
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      return {
        cipherText: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv.buffer),
        salt: arrayBufferToBase64(salt.buffer),
      };
    } catch (e) {
      console.warn('WebCrypto failed, using CryptoJS fallback:', e);
    }
  }

  // Fallback to CryptoJS for non-secure HTTP origins
  const saltHex = CryptoJS.enc.Hex.parse(
    Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
  );
  const ivHex = CryptoJS.enc.Hex.parse(
    Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('')
  );

  const derivedKey = CryptoJS.PBKDF2(masterPassword, saltHex, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), derivedKey, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    cipherText: 'cjs:' + encrypted.toString(),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
  };
}

// Decrypt vault data using Master Password and encrypted payload (Legacy V1 Direct KDF)
export async function decryptVaultData(
  cipherText: string,
  ivBase64: string,
  saltBase64: string,
  masterPassword: string
): Promise<any> {
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  if (!cipherText.startsWith('cjs:') && isSubtleCryptoAvailable()) {
    try {
      const cipherBuffer = base64ToArrayBuffer(cipherText);
      const key = await deriveKey(masterPassword, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBuffer
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (webCryptoErr) {
      console.warn('WebCrypto decryption failed, trying CryptoJS fallback:', webCryptoErr);
    }
  }

  // Fallback to CryptoJS
  const rawCipherText = cipherText.startsWith('cjs:') ? cipherText.slice(4) : cipherText;
  try {
    const saltHex = CryptoJS.enc.Hex.parse(
      Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
    );
    const ivHex = CryptoJS.enc.Hex.parse(
      Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('')
    );

    const derivedKey = CryptoJS.PBKDF2(masterPassword, saltHex, {
      keySize: 256 / 32,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });

    const decrypted = CryptoJS.AES.decrypt(rawCipherText, derivedKey, {
      iv: ivHex,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
    if (!jsonStr) {
      throw new Error('Invalid master password');
    }
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid master password or corrupted vault data.');
  }
}

// === ENVELOPE ENCRYPTION PRIMITIVES (VEK + KEK) ===

export function generateVEK(): Uint8Array {
  return getRandomBytes(32); // Random 256-bit AES Key
}

export function formatRecoveryKey(hex: string): string {
  const clean = hex.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join('-') || clean;
}

export function parseRecoveryKey(formatted: string): string {
  return formatted.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
}

export async function wrapVEK(
  vekBytes: Uint8Array,
  kekPassphrase: string,
  existingSalt?: string
): Promise<{ wrappedVEK: string; wrapIv: string; salt: string }> {
  const salt = existingSalt
    ? new Uint8Array(base64ToArrayBuffer(existingSalt))
    : getRandomBytes(SALT_SIZE);
  const wrapIv = getRandomBytes(IV_SIZE);

  if (isSubtleCryptoAvailable()) {
    const kek = await deriveKey(kekPassphrase, salt);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: wrapIv },
      kek,
      vekBytes
    );
    return {
      wrappedVEK: arrayBufferToBase64(encryptedBuffer),
      wrapIv: arrayBufferToBase64(wrapIv.buffer),
      salt: arrayBufferToBase64(salt.buffer),
    };
  }

  // CryptoJS Fallback
  const saltHex = CryptoJS.enc.Hex.parse(Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join(''));
  const ivHex = CryptoJS.enc.Hex.parse(Array.from(wrapIv).map((b) => b.toString(16).padStart(2, '0')).join(''));
  const derivedKey = CryptoJS.PBKDF2(kekPassphrase, saltHex, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });

  const vekHex = Array.from(vekBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Hex.parse(vekHex), derivedKey, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    wrappedVEK: 'cjs:' + encrypted.toString(),
    wrapIv: arrayBufferToBase64(wrapIv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
  };
}

export async function unwrapVEK(
  wrappedVEKBase64: string,
  wrapIvBase64: string,
  saltBase64: string,
  kekPassphrase: string
): Promise<Uint8Array> {
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const wrapIv = new Uint8Array(base64ToArrayBuffer(wrapIvBase64));

  if (!wrappedVEKBase64.startsWith('cjs:') && isSubtleCryptoAvailable()) {
    try {
      const cipherBuffer = base64ToArrayBuffer(wrappedVEKBase64);
      const kek = await deriveKey(kekPassphrase, salt);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: wrapIv },
        kek,
        cipherBuffer
      );
      return new Uint8Array(decryptedBuffer);
    } catch (e) {
      throw new Error('Invalid passphrase or recovery key.');
    }
  }

  // CryptoJS Fallback
  const rawCipherText = wrappedVEKBase64.startsWith('cjs:') ? wrappedVEKBase64.slice(4) : wrappedVEKBase64;
  try {
    const saltHex = CryptoJS.enc.Hex.parse(Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join(''));
    const ivHex = CryptoJS.enc.Hex.parse(Array.from(wrapIv).map((b) => b.toString(16).padStart(2, '0')).join(''));
    const derivedKey = CryptoJS.PBKDF2(kekPassphrase, saltHex, {
      keySize: 256 / 32,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });
    const decrypted = CryptoJS.AES.decrypt(rawCipherText, derivedKey, {
      iv: ivHex,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const hex = decrypted.toString(CryptoJS.enc.Hex);
    if (!hex || hex.length !== 64) throw new Error('Invalid passphrase');
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  } catch {
    throw new Error('Invalid passphrase or recovery key.');
  }
}

export async function encryptPayloadWithVEK(
  data: any,
  vekBytes: Uint8Array
): Promise<{ cipherText: string; iv: string }> {
  const iv = getRandomBytes(IV_SIZE);
  if (isSubtleCryptoAvailable()) {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      vekBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(data));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encoded
    );
    return {
      cipherText: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv.buffer),
    };
  }

  // CryptoJS Fallback
  const vekHex = Array.from(vekBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const keyObj = CryptoJS.enc.Hex.parse(vekHex);
  const ivHex = CryptoJS.enc.Hex.parse(Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join(''));
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), keyObj, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return {
    cipherText: 'cjs:' + encrypted.toString(),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

export async function decryptPayloadWithVEK(
  cipherText: string,
  ivBase64: string,
  vekBytes: Uint8Array
): Promise<any> {
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  if (!cipherText.startsWith('cjs:') && isSubtleCryptoAvailable()) {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      vekBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const cipherBuffer = base64ToArrayBuffer(cipherText);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      cipherBuffer
    );
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  }

  // CryptoJS Fallback
  const rawText = cipherText.startsWith('cjs:') ? cipherText.slice(4) : cipherText;
  const vekHex = Array.from(vekBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const keyObj = CryptoJS.enc.Hex.parse(vekHex);
  const ivHex = CryptoJS.enc.Hex.parse(Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join(''));
  const decrypted = CryptoJS.AES.decrypt(rawText, keyObj, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
  if (!jsonStr) throw new Error('Failed to decrypt vault with VEK');
  return JSON.parse(jsonStr);
}

export interface DerivedKeyBundle {
  cryptoKey: CryptoKey | null;     // WebCrypto derived key
  fallbackKeyHex: string | null;   // CryptoJS derived key hex representation
  saltBase64: string;              // Salt used to derive the key
}

export async function deriveKeyBundle(masterPassword: string, saltBase64: string): Promise<DerivedKeyBundle> {
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  let cryptoKey: CryptoKey | null = null;
  let fallbackKeyHex: string | null = null;

  if (isSubtleCryptoAvailable()) {
    try {
      cryptoKey = await deriveKey(masterPassword, salt);
    } catch (e) {
      console.warn('WebCrypto key derivation failed:', e);
    }
  }

  const saltHex = CryptoJS.enc.Hex.parse(
    Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
  );
  const derivedKey = CryptoJS.PBKDF2(masterPassword, saltHex, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  fallbackKeyHex = derivedKey.toString(CryptoJS.enc.Hex);

  return {
    cryptoKey,
    fallbackKeyHex,
    saltBase64,
  };
}

export async function encryptVaultDataWithKey(
  data: any,
  keyBundle: DerivedKeyBundle
): Promise<{ cipherText: string; iv: string; salt: string }> {
  const salt = new Uint8Array(base64ToArrayBuffer(keyBundle.saltBase64));
  const iv = getRandomBytes(IV_SIZE);

  if (keyBundle.cryptoKey && isSubtleCryptoAvailable()) {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyBundle.cryptoKey,
        encodedData
      );

      return {
        cipherText: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv.buffer),
        salt: keyBundle.saltBase64,
      };
    } catch (e) {
      console.warn('WebCrypto encryption with key bundle failed, using CryptoJS fallback:', e);
    }
  }

  if (!keyBundle.fallbackKeyHex) {
    throw new Error('Cryptographic fallback key is missing in key bundle');
  }

  const derivedKey = CryptoJS.enc.Hex.parse(keyBundle.fallbackKeyHex);
  const ivHex = CryptoJS.enc.Hex.parse(
    Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('')
  );

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), derivedKey, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    cipherText: 'cjs:' + encrypted.toString(),
    iv: arrayBufferToBase64(iv.buffer),
    salt: keyBundle.saltBase64,
  };
}

export async function decryptVaultDataWithKey(
  cipherText: string,
  ivBase64: string,
  saltBase64: string,
  keyBundle: DerivedKeyBundle
): Promise<any> {
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  if (!cipherText.startsWith('cjs:') && keyBundle.cryptoKey && isSubtleCryptoAvailable()) {
    try {
      const cipherBuffer = base64ToArrayBuffer(cipherText);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyBundle.cryptoKey,
        cipherBuffer
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (webCryptoErr) {
      console.warn('WebCrypto decryption with key bundle failed, trying CryptoJS:', webCryptoErr);
    }
  }

  if (!keyBundle.fallbackKeyHex) {
    throw new Error('Cryptographic fallback key is missing in key bundle');
  }

  const derivedKey = CryptoJS.enc.Hex.parse(keyBundle.fallbackKeyHex);
  const rawCipherText = cipherText.startsWith('cjs:') ? cipherText.slice(4) : cipherText;
  const ivHex = CryptoJS.enc.Hex.parse(
    Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('')
  );

  const decrypted = CryptoJS.AES.decrypt(rawCipherText, derivedKey, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
  if (!jsonStr) {
    throw new Error('Invalid key or corrupted data.');
  }

  return JSON.parse(jsonStr);
}

// Generate verification token hash
export async function createPasswordVerifier(masterPassword: string, saltBase64: string): Promise<string> {
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

  if (isSubtleCryptoAvailable()) {
    try {
      const key = await deriveKey(masterPassword, salt);
      const iv = new Uint8Array(12);
      const encoder = new TextEncoder();
      const tokenBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode('XEROX_VERIFY_TOKEN_2026')
      );

      return arrayBufferToBase64(tokenBuffer);
    } catch (e) {
      console.warn('WebCrypto verifier creation failed, using CryptoJS fallback:', e);
    }
  }

  // CryptoJS Fallback
  const saltHex = CryptoJS.enc.Hex.parse(
    Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
  );
  const ivHex = CryptoJS.enc.Hex.parse('000000000000000000000000');

  const derivedKey = CryptoJS.PBKDF2(masterPassword, saltHex, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });

  const encrypted = CryptoJS.AES.encrypt('XEROX_VERIFY_TOKEN_2026', derivedKey, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return 'cjs:' + encrypted.toString();
}

export async function verifyMasterPassword(
  masterPassword: string,
  saltBase64: string,
  verifierBase64: string
): Promise<boolean> {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

    if (!verifierBase64.startsWith('cjs:') && isSubtleCryptoAvailable()) {
      try {
        const iv = new Uint8Array(12);
        const cipherBuffer = base64ToArrayBuffer(verifierBase64);
        const key = await deriveKey(masterPassword, salt);

        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          cipherBuffer
        );

        const decoder = new TextDecoder();
        const str = decoder.decode(decryptedBuffer);
        if (str === 'XEROX_VERIFY_TOKEN_2026' || str.startsWith('XEROX_VERIFY_TOKEN')) {
          return true;
        }
      } catch {
        // Fall through to CryptoJS
      }
    }

    const rawVerifier = verifierBase64.startsWith('cjs:') ? verifierBase64.slice(4) : verifierBase64;
    const saltHex = CryptoJS.enc.Hex.parse(
      Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
    );
    const ivHex = CryptoJS.enc.Hex.parse('000000000000000000000000');

    const derivedKey = CryptoJS.PBKDF2(masterPassword, saltHex, {
      keySize: 256 / 32,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });

    const decrypted = CryptoJS.AES.decrypt(rawVerifier, derivedKey, {
      iv: ivHex,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const str = decrypted.toString(CryptoJS.enc.Utf8);
    return str.startsWith('XEROX_VERIFY_TOKEN');
  } catch {
    return false;
  }
}

// Secure Random Password Generator using crypto.getRandomValues() or fallback
export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar?: boolean;
}

export function generateSecurePassword(
  optionsOrLength: PasswordGeneratorOptions | number = 16,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSymbols = true,
  excludeSimilar = false
): string {
  let opts: PasswordGeneratorOptions;

  if (typeof optionsOrLength === 'number') {
    opts = {
      length: optionsOrLength,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeSimilar,
    };
  } else {
    opts = optionsOrLength;
  }

  let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowercase = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (opts.excludeSimilar) {
    uppercase = uppercase.replace(/[IO]/g, '');
    lowercase = lowercase.replace(/[lI10oO]/g, '');
    numbers = numbers.replace(/[01]/g, '');
  }

  let charset = '';
  if (opts.includeUppercase) charset += uppercase;
  if (opts.includeLowercase) charset += lowercase;
  if (opts.includeNumbers) charset += numbers;
  if (opts.includeSymbols) charset += symbols;

  if (!charset) {
    charset = lowercase + numbers;
  }

  const length = opts.length || 16;
  const randomValues = new Uint32Array(length);
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.getRandomValues === 'function'
  ) {
    window.crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 4294967296);
    }
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

// Check if password has been exposed in public breaches using k-Anonymity SHA-1 prefix
export async function checkPasswordBreached(password: string): Promise<{ breached: boolean; count: number }> {
  if (!password) return { breached: false, count: 0 };
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    let hashHex = '';

    if (isSubtleCryptoAvailable()) {
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    } else {
      hashHex = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex).toUpperCase();
    }

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (!res.ok) return { breached: false, count: 0 };

    const text = await res.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [lineSuffix, countStr] = line.split(':');
      if (lineSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) || 1 };
      }
    }

    return { breached: false, count: 0 };
  } catch (err) {
    // Network offline or CORS blocked fallback
    return { breached: false, count: 0 };
  }
}

// Encrypt a single item payload for secure zero-knowledge sharing via URL/snippet
export async function encryptSharePayload(payloadObj: any, passphrase: string): Promise<string> {
  const jsonStr = JSON.stringify(payloadObj);
  const encrypted = CryptoJS.AES.encrypt(jsonStr, passphrase).toString();
  return encodeURIComponent(encrypted);
}

export function decryptSharePayload(encodedEncryptedStr: string, passphrase: string): any | null {
  try {
    const rawEncrypted = decodeURIComponent(encodedEncryptedStr);
    const decryptedBytes = CryptoJS.AES.decrypt(rawEncrypted, passphrase);
    const decryptedStr = decryptedBytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) return null;
    return JSON.parse(decryptedStr);
  } catch (err) {
    return null;
  }
}

// Calculate Password Entropy and Strength Rating
export function calculatePasswordStrength(password: string): {
  score: number;
  label: 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
} {
  if (!password) {
    return { score: 0, label: 'Weak', color: '#ef4444' };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  const entropy = password.length * Math.log2(poolSize || 1);

  if (entropy < 40) {
    return { score: 25, label: 'Weak', color: '#ef4444' };
  } else if (entropy < 60) {
    return { score: 50, label: 'Fair', color: '#f59e0b' };
  } else if (entropy < 80) {
    return { score: 75, label: 'Strong', color: '#10b981' };
  } else {
    return { score: 100, label: 'Very Strong', color: '#06b6d4' };
  }
}
