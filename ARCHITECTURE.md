# Xerox - Cryptographic Architecture & Technical Reference 🔐

Welcome to the authoritative technical documentation for **Xerox**, an enterprise-grade local-first password vault, 2FA TOTP authenticator, smart bookmark manager, and Chrome/Edge Manifest V3 browser extension with real browser autofill.

---

## 📐 Key Hierarchy & Envelope Encryption Architecture

Xerox employs a 2-tier **Envelope Encryption Model** (VEK / KEK) to guarantee zero-knowledge confidentiality, instant master password rotation, genuine offline recovery key protection, and cloud-sync readiness.

```text
                  Master Password                   Emergency Recovery Key
                         │                                    │
                         ▼                                    ▼
               PBKDF2 (SHA-256, 100k)                PBKDF2 (SHA-256, 100k)
                         │                                    │
                         ▼                                    ▼
                Key Encryption Key                   Recovery Key Encryption Key
                     (KEK)                                (RKEK)
                         │                                    │
                         ▼                                    ▼
               unwrap(wrappedVEK_kek)               unwrap(wrappedVEK_rkek)
                         │                                    │
                         └─────────────────┬──────────────────┘
                                           │
                                           ▼
                               Vault Encryption Key (VEK)
                                   (Random 256-bit)
                                           │
                                           ▼
                                 AES-GCM 256-bit Ciphertext
```

---

## 🔒 Cryptographic Specification

- **Vault Encryption Key (VEK):** Random 256-bit AES-GCM Key (`crypto.getRandomValues()`) generated independently of user credentials. Encrypts the entire vault payload.
- **Key Encryption Key (KEK):** Derived via PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt). Used to wrap/unwrap the VEK via AES-GCM.
- **Recovery KEK (RKEK):** Derived via PBKDF2 (SHA-256, 100,000 iterations, 16-byte salt) from a 256-bit emergency recovery key formatted as `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`.
- **Master Password Rotation:** Unwraps the VEK using the old KEK, derives a new Password KEK with a fresh salt, and re-wraps the *same* VEK. The vault payload ciphertext remains untouched!

---

## 📦 Versioned Vault Envelope V2 Schema (`VaultEnvelopeV2`)

```typescript
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
```

---

## 🛡️ SEC-01 & WebAuthn Status

In accordance with P0 security remediation rules:
- All legacy XOR master password storage has been completely purged from local storage.
- WebAuthn biometric unlock is temporarily disabled and will be re-enabled using hardware-bound WebCrypto key wrapping (`SubtleCrypto` / PRF) in a dedicated follow-up phase.

---

## 🧪 Automated Verification Suite

Run the P0 crypto test suite:
```bash
npx tsx src/tests/cryptoP0Remediation.test.ts
```

All 19 crypto & recovery unit tests pass along with `npm run lint`, `npm run build`, and `node real_world_validation.cjs` (31/31 extension tests).
