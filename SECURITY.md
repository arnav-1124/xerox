# Security Policy

## Zero-Knowledge Threat Model

Xerox is designed as a **local-first, zero-knowledge** password and bookmark manager. 

- **Master Password Security**: Your master password never leaves your browser device. It is processed locally using WebCrypto PBKDF2 (100,000 iterations) to derive a 256-bit AES-GCM encryption key.
- **Data Encryption**: All vault entries (passwords, secure notes, payment cards, TOTP secrets, and uploaded encrypted files) are encrypted on your client device using AES-GCM 256-bit encryption before being stored in browser IndexedDB or exported as encrypted JSON backups.
- **No Telemetry / No Cloud Retention**: Xerox operates with absolute zero server-side retention. There is no central database storing user credentials or master password hashes.

---

## Reporting a Vulnerability

If you discover a security vulnerability within Xerox, please report it responsibly:

1. **Do not** open a public GitHub issue for sensitive security vulnerabilities.
2. Send an email to the repository maintainer or open a private advisory on GitHub.
3. Include a detailed description of the vulnerability, steps to reproduce, and potential impact.

We take security reports extremely seriously and will work promptly to verify and patch valid disclosures.
