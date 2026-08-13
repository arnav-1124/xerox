/**
 * Pure Web Crypto RFC 6238 TOTP Authenticator Generator
 * Converts Base32 Secret Key into 6-digit 2FA OTP codes with 30-second cycle.
 */

// Base32 decoder
function base32ToBytes(base32Str: string): Uint8Array {
  const base32Hex = base32Str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < base32Hex.length; i++) {
    const val = alphabet.indexOf(base32Hex.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

/**
 * Generate 6-digit TOTP code for given base32 secret and time (ms)
 */
export async function generateTOTP(
  secret: string,
  timestampMs = Date.now() + ((typeof window !== 'undefined' && (window as any).clockSkewOffset) || 0)
): Promise<string> {
  try {
    const cleanSecret = secret.trim().replace(/\s+/g, '');
    if (!cleanSecret) return '';

    const keyBytes = base32ToBytes(cleanSecret);
    if (keyBytes.length === 0) return '';

    // Time counter (30-second step)
    const epochSeconds = Math.floor(timestampMs / 1000);
    const timeCounter = Math.floor(epochSeconds / 30);

    // Convert time counter to 8-byte big endian Uint8Array
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(timeCounter), false);

    // Import key for Web Crypto HMAC-SHA1
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    // HMAC signature
    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const hmacBytes = new Uint8Array(signature);

    // Dynamic Truncation
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  } catch (err) {
    console.error('Failed to generate TOTP code', err);
    return 'INVALID';
  }
}

/**
 * Seconds remaining in current 30s TOTP window
 */
export function getTOTPTimeRemaining(
  timestampMs = Date.now() + ((typeof window !== 'undefined' && (window as any).clockSkewOffset) || 0)
): number {
  const epochSeconds = Math.floor(timestampMs / 1000);
  return 30 - (epochSeconds % 30);
}
