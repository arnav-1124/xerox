import CryptoJS from 'crypto-js';
import { DerivedKeyBundle } from '../types';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  getRandomBytes,
} from './crypto';

const IV_SIZE = 12;

/**
 * Native Browser Compression using Compression Streams API (GZIP format).
 */
export async function compressBlob(blob: Blob): Promise<Blob> {
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
  return await new Response(stream).blob();
}

/**
 * Native Browser Decompression using Decompression Streams API (GZIP format).
 */
export async function decompressBlob(blob: Blob): Promise<Blob> {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).blob();
}

/**
 * Compresses a file and encrypts the resulting buffer using AES-GCM (WebCrypto)
 * or falls back to CryptoJS in non-secure local origins.
 */
export async function compressAndEncryptFile(
  file: Blob,
  keyBundle: DerivedKeyBundle
): Promise<{ encryptedBlob: Blob; iv: string; salt: string; compressedSize: number }> {
  // 1. Compress the file using GZIP
  const compressedBlob = await compressBlob(file);
  const arrayBuffer = await compressedBlob.arrayBuffer();

  // 2. Generate random initialization vector
  const iv = getRandomBytes(IV_SIZE);

  // 3. Encrypt data
  if (keyBundle.cryptoKey && typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyBundle.cryptoKey,
        arrayBuffer
      );

      return {
        encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
        iv: arrayBufferToBase64(iv.buffer),
        salt: keyBundle.saltBase64,
        compressedSize: compressedBlob.size,
      };
    } catch (e) {
      console.warn('WebCrypto file encryption failed, falling back to CryptoJS:', e);
    }
  }

  // Fallback to CryptoJS
  if (!keyBundle.fallbackKeyHex) {
    throw new Error('No cryptographic key available for encryption.');
  }

  const base64Str = arrayBufferToBase64(arrayBuffer);
  const keyObj = CryptoJS.enc.Hex.parse(keyBundle.fallbackKeyHex);
  const ivHex = CryptoJS.enc.Hex.parse(
    Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('')
  );

  const encrypted = CryptoJS.AES.encrypt(base64Str, keyObj, {
    iv: ivHex,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const encryptedStr = 'cjs:' + encrypted.toString();
  return {
    encryptedBlob: new Blob([encryptedStr], { type: 'text/plain' }),
    iv: arrayBufferToBase64(iv.buffer),
    salt: keyBundle.saltBase64,
    compressedSize: compressedBlob.size,
  };
}

/**
 * Decrypts a file block and decompresses it back to the original payload file.
 */
export async function decryptAndDecompressFile(
  data: Blob | string,
  ivBase64: string,
  saltBase64: string,
  keyBundle: DerivedKeyBundle
): Promise<Blob> {
  let cipherBuffer: ArrayBuffer | null = null;
  let cipherTextStr = '';

  if (data instanceof Blob) {
    if (data.type === 'text/plain') {
      cipherTextStr = await data.text();
    } else {
      cipherBuffer = await data.arrayBuffer();
    }
  } else {
    cipherTextStr = data;
  }

  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

  // Check if payload is in CryptoJS format
  if (cipherTextStr && cipherTextStr.startsWith('cjs:')) {
    if (!keyBundle.fallbackKeyHex) {
      throw new Error('No cryptographic key available for decryption.');
    }

    const rawText = cipherTextStr.slice(4);
    const keyObj = CryptoJS.enc.Hex.parse(keyBundle.fallbackKeyHex);
    const ivHex = CryptoJS.enc.Hex.parse(
      Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('')
    );

    const decrypted = CryptoJS.AES.decrypt(rawText, keyObj, {
      iv: ivHex,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const base64Str = decrypted.toString(CryptoJS.enc.Utf8);
    if (!base64Str) {
      throw new Error('CryptoJS file decryption failed: invalid key or corrupted data.');
    }

    const compressedBuffer = base64ToArrayBuffer(base64Str);
    return await decompressBlob(new Blob([compressedBuffer]));
  }

  // WebCrypto decryption
  if (keyBundle.cryptoKey && typeof crypto !== 'undefined' && crypto.subtle && cipherBuffer) {
    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyBundle.cryptoKey,
        cipherBuffer
      );

      return await decompressBlob(new Blob([decryptedBuffer]));
    } catch (e) {
      console.warn('WebCrypto file decryption failed, attempting CryptoJS parsing:', e);
    }
  }

  // Fallback in case a binary blob contains CryptoJS text (e.g. converted blob)
  if (cipherBuffer) {
    const textDecoder = new TextDecoder();
    try {
      const text = textDecoder.decode(cipherBuffer);
      if (text.startsWith('cjs:')) {
        return await decryptAndDecompressFile(text, ivBase64, saltBase64, keyBundle);
      }
    } catch {}
  }

  throw new Error('Failed to decrypt and restore file: invalid key or unsupported format.');
}
