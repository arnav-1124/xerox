# Xerox - Secure Local-First Password Manager & Bookmarks 🔐

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Privacy: Zero-Knowledge](https://img.shields.io/badge/Privacy-100%25%20Local-emerald)](https://github.com/)

**Xerox** is an enterprise-grade, zero-knowledge encrypted password vault, 2FA TOTP authenticator, payment card store, and smart bookmark manager built with **absolute local-first privacy** and a **Manifest V3 browser extension** for real form autofill.

---

## 🌟 Brand Vision & Mission

> **"Absolute Privacy. Zero Retention."**
> Xerox believes your passwords and bookmarks belong to you and only you. There are no cloud servers, no remote tracking, no analytics, and zero data retention. All encryption keys and vault data reside strictly in your device's secure local IndexedDB storage.

---

## ✨ Core Features

* **Zero-Knowledge Encryption**: AES-GCM 256-bit encryption backed by PBKDF2 (100,000 iterations). Your master password never leaves your device.
* **Encrypted File & Document Vault**: Locally store and encrypt confidential PDFs, passports, and keys in IndexedDB without cloud retention.
* **2FA TOTP Live Authenticator**: Built-in 6-digit Time-based One-Time Password generator with live countdown timers and secret vaulting.
* **Local Password Health Audit**: Deep offline audit checking passwords against weak patterns, dictionary words, and reuse detection.
* **Manifest V3 Browser Extension**: Real Chrome/Edge browser extension for automatic login form detection and secure credential autofill.
* **Secure Payment & Notes Vault**: Store credit cards, secure notes, and sensitive personal items with encrypted fields.
* **Smart Bookmark Manager**: Organize website links with favicons, categories, tags, descriptions, and favorite toggles.
* **Password Generator & Auto-Lock Shield**: Cryptographically secure random passwords and configurable inactivity auto-lock.

---

## 🧩 Browser Extension & Chrome Web Store Note

Google charges a **one-time $5 developer registration fee** to publish extensions on the Chrome Web Store. 

To bypass this fee and install Xerox instantly for free:
1. Open the Xerox Web App and click **Extension** in the top navigation.
2. Click **Download Extension (.zip)**.
3. Unzip the downloaded file on your computer.
4. Open `chrome://extensions` (or `edge://extensions`) in your browser.
5. Enable **Developer Mode** (top right toggle).
6. Click **Load unpacked** and select the unzipped folder.
7. Pin the **Xerox 🔐** icon to your toolbar!

---

## 🌐 Custom Domains & Hosting

* **Custom Domains**: Google does **not** provide free top-level domains (`.com`, `.net`), but you can purchase a domain from any registrar (Namecheap, Porkbun, Squarespace) for ~$10/year and link it for **free** to your Vercel deployment (`xerox-orcin.vercel.app`).
* **Free Hosting Subdomains**: Vercel (`*.vercel.app`) provides free HTTPS SSL certificates, global CDN edge hosting, and automatic continuous deployment from GitHub out of the box.

---

## 🔒 Security & Compliance

See [SECURITY.md](SECURITY.md) for our full cryptographic threat model and vulnerability disclosure policy.

---

## 📜 License

Distributed under the [MIT License](LICENSE).
