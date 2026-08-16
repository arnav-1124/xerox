# Security Policy & Cryptographic Threat Model 🛡️

## 1. Zero-Knowledge 2-Tier Envelope Encryption

Xerox employs a local-first **2-tier Envelope Encryption Model** (VEK / KEK):

- **Vault Encryption Key (VEK):** Random 256-bit AES key (`crypto.getRandomValues()`). The VEK encrypts the vault payload on your client device using AES-GCM 256-bit encryption.
- **Key Encryption Keys (KEK & RKEK):** Derived via PBKDF2 (SHA-256, 100,000 iterations). Your Master Password and 256-bit Emergency Recovery Key independently unwrap the same VEK.
- **SEC-01 Purge:** Insecure legacy XOR master password storage has been completely purged. Plaintext master passwords are never stored anywhere in local storage or IndexedDB.

---

## 2. Security Controls & Defensive Mechanisms

- **Genuine Offline Recovery Kit:** Entering your 256-bit Emergency Recovery Key (`XXXX-XXXX-XXXX-XXXX-...`) derives an RKEK that unwraps the VEK to restore local vault access and set a new Master Password without re-encrypting the vault payload.
- **Rate-Limiting & Lockout Policy:** Failed master password attempts trigger exponential backoff (3 attempts $\rightarrow$ 5s delay, 4 attempts $\rightarrow$ 15s delay, 5+ attempts $\rightarrow$ 60s lockout) to prevent brute-force attacks.
- **Origin Guarding:** Extension synchronization postMessages are strictly filtered against an explicit origin allowlist (`TRUSTED_XEROX_ORIGINS`).
- **k-Anonymity Leak Checks:** HaveIBeenPwned API checks use SHA-1 5-character prefix queries with `Add-Padding: true` headers. Plaintext passwords are never sent over the network.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability within Xerox, please report it responsibly:

1. **Do not** open a public GitHub issue for sensitive security vulnerabilities.
2. Send an email to the repository maintainers or create a private security advisory on GitHub.
3. Include a detailed description of the vulnerability, steps to reproduce, and potential impact.

We take security reports extremely seriously and will work promptly to verify and resolve disclosures.
