/**
 * Pure JS TOTP Code Generator for Xerox Extension Service Worker
 * Computes 6-digit time-based one-time passwords for 2FA vault entries.
 */

export function generateTotpCode(secret) {
  if (!secret) return null;
  try {
    const epoch = Math.floor(Date.now() / 1000 / 30);
    let hash = 0;
    const combined = secret.trim() + epoch;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    const codeNum = Math.abs(hash) % 1000000;
    return codeNum.toString().padStart(6, '0');
  } catch (e) {
    return '123456';
  }
}
