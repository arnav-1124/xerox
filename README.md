# Lokker — Local-First Password Vault 🔐

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Privacy: Zero-Knowledge](https://img.shields.io/badge/Privacy-100%25%20Local-emerald)](https://github.com/)

**Lokker** is a local-first, zero-knowledge encrypted password vault, 2FA TOTP authenticator, payment card store, and smart bookmark manager built with **absolute local-first privacy** and a **Manifest V3 browser extension** for real form autofill.

---

## 🌟 Brand Vision & Mission

> **"Your Passwords. Your Device. Your Control."**
> Lokker believes your passwords belong to you and only you. There is no central password database, no remote tracking, no analytics, and zero data retention. All encryption keys and vault data reside strictly in your device's secure local IndexedDB storage.

---

## ✨ Core Features

* **Zero-Knowledge Encryption**: AES-GCM 256-bit encryption backed by PBKDF2 (100,000 iterations). Your master password never leaves your device.
* **3-Tier Key Envelope Architecture**: Vault Encryption Key (VEK) wrapped independently by Password KEK, Recovery KEK, and WebAuthn PRF KEK.
* **Encrypted File & Document Vault**: Locally store and encrypt confidential PDFs, documents, and keys in IndexedDB without cloud retention.
* **2FA TOTP Live Authenticator**: Built-in 6-digit Time-based One-Time Password generator with live countdown timers and extension clipboard auto-copy.
* **Biometric WebAuthn PRF Unlock**: Hardware-bound passwordless vault unlock via Apple Touch ID, Face ID, Windows Hello, or FIDO2 keys.
* **Local Password Health Audit**: Offline audit checking passwords against weak patterns, reuse, and HaveIBeenPwned k-Anonymity breach detection.
* **Manifest V3 Browser Extension**: Real Chrome/Edge browser extension for automatic login form detection and secure credential autofill with Shadow DOM isolation.
* **Multi-Format Import & Export**: Import from Chrome, Bitwarden, 1Password, Firefox, and CSV with a pre-import conflict preview.
* **Smart Bookmark Manager**: Organize website links with categories, tags, descriptions, and favorite toggles.

---

## 🧩 Browser Extension Installation

To install the Lokker extension locally:
1. Open the Lokker Web App and click **Extension** in the navigation or visit `/download`.
2. Click **Download Extension (.zip)**.
3. Unzip the downloaded file on your computer.
4. Open `chrome://extensions` (or `edge://extensions`) in your browser.
5. Enable **Developer Mode** (top right toggle).
6. Click **Load unpacked** and select the unzipped folder.
7. Pin the **Lokker 🔐** icon to your toolbar.

---

## 📖 Technical Architecture & Developer Docs

For detailed end-to-end technical documentation covering the cryptographic specifications, extension messaging contracts, field detection engine, and automated validation suite, see:

👉 **[TECHNICAL ARCHITECTURE (ARCHITECTURE.md)](ARCHITECTURE.md)**

---

## 📜 License & Trademark Guidelines

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE) - see the [LICENSE](LICENSE) file for details.
