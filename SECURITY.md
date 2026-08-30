# Security Policy & Cryptographic Threat Model 🛡️

## 1. Zero-Knowledge 3-Tier Envelope Encryption

Lokker employs a local-first **3-tier Envelope Encryption Model** (VEK / KEK):

- **Vault Encryption Key (VEK):** Random 256-bit AES key (`crypto.getRandomValues()`). The VEK encrypts the vault payload on your client device using AES-GCM 256-bit encryption.
- **Key Encryption Keys (KEK, RKEK, Biometric KEK):** Derived via PBKDF2 (SHA-256, 100,000 iterations) or WebAuthn PRF extension (`eval: { first: salt }`) + HKDF.
- **Zero Master Password Storage:** WebAuthn biometrics derive a `Biometric KEK` directly from hardware authenticator PRF evaluation. Your Master Password is **never stored, encrypted, XORed, or retrieved**.

---

## 2. Security Controls & Defensive Mechanisms

- **Hardware Passkey Support:** Register multiple passkeys (`Touch ID`, `Windows Hello`, `YubiKey`). Adding or removing passkeys updates only key wrapping metadata without modifying the VEK or re-encrypting the vault payload.
- **Genuine Offline Recovery Kit:** Entering your 256-bit Emergency Recovery Key (`XXXX-XXXX-XXXX-XXXX-...`) derives an RKEK that unwraps the VEK to restore local vault access and set a new Master Password without re-encrypting the vault payload.
- **AES-GCM Tamper Resistance:** Ciphertexts, IVs, salts, and wrapped VEKs are protected by 128-bit GCM authentication tags. Any byte tampering triggers safe authentication rejection.
- **Rate-Limiting & Lockout Policy:** Failed master password attempts trigger exponential backoff (3 attempts $\rightarrow$ 5s delay, 4 attempts $\rightarrow$ 15s delay, 5+ attempts $\rightarrow$ 60s lockout) to prevent brute-force attacks.
- **Origin Guarding:** Extension synchronization postMessages are strictly filtered against an explicit origin allowlist.
- **k-Anonymity Leak Checks:** HaveIBeenPwned API checks use SHA-1 5-character prefix queries with `Add-Padding: true` headers. Plaintext passwords are never sent over the network.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability within Lokker, please report it responsibly:

1. **Do not** open a public GitHub issue for sensitive security vulnerabilities.
2. Send an email to the repository maintainers or create a private security advisory on GitHub.
3. Include a detailed description of the vulnerability, steps to reproduce, and potential impact.

We take security reports extremely seriously and will work promptly to verify and resolve disclosures.
