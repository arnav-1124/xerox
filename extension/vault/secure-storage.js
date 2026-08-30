/**
 * WebCrypto implementation for Chrome Extension
 */

const PBKDF2_ITERATIONS = 100000;

function base64ToArrayBuffer(base64) {
  if (!base64) return new ArrayBuffer(0);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function deriveKeyGcm(masterPassword, saltUint8) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey('raw', enc.encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltUint8, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, passwordKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function deriveKeyCbc(masterPassword, saltUint8) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey('raw', enc.encode(masterPassword), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltUint8, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, passwordKey, { name: 'AES-CBC', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function decryptVault(cipherText, ivBase64, saltBase64, masterPassword) {
  if (!cipherText || !ivBase64 || !saltBase64) {
    throw new Error('Incomplete vault payload. Please open Lokker Web Vault tab to sync.');
  }

  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const rawCipher = cipherText.startsWith('cjs:') ? cipherText.slice(4) : cipherText;
  const cipherBuffer = base64ToArrayBuffer(rawCipher);

  let lastError = null;

  // Try 1: WebCrypto AES-GCM
  try {
    const keyGcm = await deriveKeyGcm(masterPassword, salt);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyGcm, cipherBuffer);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  } catch (e1) {
    lastError = e1;
  }

  // Try 2: WebCrypto AES-CBC
  try {
    const keyCbc = await deriveKeyCbc(masterPassword, salt);
    const decryptedCbc = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, keyCbc, cipherBuffer);
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedCbc));
  } catch (e2) {
    lastError = e2;
  }

  throw new Error('Incorrect master password or corrupted vault.');
}
