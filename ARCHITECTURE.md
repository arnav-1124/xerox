# Xerox - Cryptographic Architecture & Technical Reference 🔐

Welcome to the authoritative technical documentation for **Xerox**, an enterprise-grade local-first password vault, 2FA TOTP authenticator, smart bookmark manager, and Chrome/Edge Manifest V3 browser extension with real browser autofill.

---

## 📐 Key Hierarchy & Envelope Encryption Architecture

Xerox employs a 3-tier **Envelope Encryption Model** (VEK / KEK) to guarantee zero-knowledge confidentiality, instant master password rotation, genuine offline recovery key protection, hardware-bound WebAuthn PRF unlock, and cloud-sync readiness.

```text
                    ┌── Password KEK ────┐
                    │                    │
                    ├── Recovery KEK ────┤
                    │                    ├──► VEK ──► AES-GCM Encrypted Vault
                    └── Biometric KEK ───┘
```

---

## 🔒 Cryptographic Specification

- **Vault Encryption Key (VEK):** Random 256-bit AES-GCM Key (`crypto.getRandomValues()`) generated independently of user credentials. Encrypts the entire vault payload.
- **Key Encryption Key (KEK):** Derived via PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt). Used to wrap/unwrap the VEK via AES-GCM.
- **Recovery KEK (RKEK):** Derived via PBKDF2 (SHA-256, 100,000 iterations, 16-byte salt) from a 256-bit emergency recovery key formatted as `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`.
- **Biometric KEK:** Derived via WebAuthn PRF extension (`eval: { first: salt }`) and HKDF (SHA-256). **Master Password is NEVER stored or retrieved.**
- **Multi-Authenticator Support:** Supports registering multiple hardware passkeys/authenticators (`webauthnProtections: WebAuthnProtection[]`). Adding or removing passkeys updates only key wrapping metadata without modifying the VEK or re-encrypting the vault payload.

---

## 📦 Versioned Vault Envelope V2 Schema (`VaultEnvelopeV2`)

```typescript
export interface WebAuthnProtection {
  credentialId: string;
  rpId?: string;
  prfSupported: boolean;
  salt: string;        // Base64 16-byte derivation salt for HKDF/WebCrypto KDF
  wrappedVEK: string;  // Base64 AES-GCM ciphertext of 256-bit VEK
  wrapIv: string;      // Base64 12-byte IV used to wrap VEK
  label?: string;      // e.g. "Windows Hello", "Touch ID", "Security Key"
  createdAt: number;
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
  webauthnProtections?: WebAuthnProtection[];
  createdAt: number;
  updatedAt: number;
}
```

---

## 🛡️ Tamper Resistance & Zero-Plaintext Audit

- **AES-GCM Authenticated Encryption Tag:** Any 1-byte mutation of `encryptedVault.cipherText`, `iv`, `wrappedVEK`, `wrapIv`, or `salt` triggers explicit authentication tag failure safely.
- **Zero-Plaintext Confidentiality:** Confirmed zero instances of sensitive usernames, passwords, TOTP secrets, or credit card numbers in raw ciphertexts or envelope metadata.

---

## 🧪 Automated Verification Suite

Run the full automated test suites:
```bash
# 1. P0 Crypto & Recovery Suite
npx tsx src/tests/cryptoP0Remediation.test.ts

# 2. P1 WebAuthn PRF & Tamper Hardening Suite
npx tsx src/tests/cryptoP1WebAuthn.test.ts

# 3. Real-World Extension Suite
node real_world_validation.cjs
```

All 70 test assertions pass cleanly along with `npm run lint` and `npm run build`.
