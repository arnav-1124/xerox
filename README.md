# Xerox - Secure Local-First Password Manager & Bookmarks 🔐

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.html)
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
* **2FA TOTP Live Authenticator**: Built-in 6-digit Time-based One-Time Password generator with live countdown timers and extension clipboard auto-copy.
* **Biometric WebAuthn Unlock**: Native Apple Touch ID, Face ID, and Windows Hello passwordless vault unlock.
* **Local Password Health Audit**: Deep offline audit checking passwords against weak patterns, dictionary words, and HaveIBeenPwned K-Anonymity breach detection.
* **Manifest V3 Browser Extension**: Real Chrome/Edge browser extension for automatic login form detection and secure credential autofill.
* **Secure Payment & Notes Vault**: Store credit cards, secure notes, and sensitive personal items with encrypted fields.
* **Smart Bookmark Manager**: Organize website links with favicons, categories, tags, descriptions, and favorite toggles.

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

## 📖 Technical Architecture & Developer Docs

For detailed end-to-end technical documentation covering the cryptographic specifications, extension messaging contracts, field detection engine, rate-limiting rules, and automated Playwright validation suite, see:

👉 **[TECHNICAL ARCHITECTURE & DEVELOPER GUIDE (ARCHITECTURE.md)](ARCHITECTURE.md)**

---

## 🌐 Custom Domains & Hosting

* **Custom Domains**: Google does **not** provide free top-level domains (`.com`, `.net`), but you can purchase a domain from any registrar (Namecheap, Porkbun, Squarespace) for ~$10/year and link it for **free** to your Vercel deployment (`xerox-orcin.vercel.app`).
* **Free Hosting Subdomains**: Vercel (`*.vercel.app`) provides free HTTPS SSL certificates, global CDN edge hosting, and automatic continuous deployment from GitHub out of the box.

---

## 📜 License & Trademark Guidelines

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE) - see the [LICENSE](LICENSE) file for details.

### 🛡️ Trademark Policy
"Xerox", "Xerox Vault", and associated logos are trademarks of the Xerox project. While the source code is open and customizable, you **cannot** use the name "Xerox", its logos, or designs in a commercial or rebranded deployment without prior written permission. Any modified or rebranded fork must be clearly named differently and cannot claim endorsement by the original project.
