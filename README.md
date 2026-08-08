# Xerox - Local-First Bookmark & Password Manager with Real Browser Autofill 🔐

Xerox is a personal **Bookmark Manager + Password Vault** built with a dark SaaS user interface, local WebCrypto AES-GCM 256-bit encryption, and a **real Chrome/Edge Manifest V3 browser extension** for login autofill.

---

## ✨ Features

* **Local-First Privacy**: No cloud database, no user accounts, no external tracking. All data stays strictly on your device in IndexedDB.
* **AES-GCM 256-bit WebCrypto Encryption**: PBKDF2 key derivation (100,000 iterations) and AES-GCM encryption for password vault entries.
* **Real Chrome/Edge Browser Extension**: Manifest V3 extension that detects login forms on websites like GitHub, Gmail, or Notion, providing true autofill.
* **Smart Domain Matching**: Safe origin checks prevent phishing and credential leakage across untrusted subdomains.
* **Bookmark Manager**: Organize website links with favicons, categories, descriptions, and favorite toggles.
* **Password Generator**: Cryptographically secure random password generation with custom length, symbols, and entropy strength meter.
* **Instant Command Palette (`Cmd + K`)**: Quick local search across bookmarks and credentials.
* **Encrypted Backups**: Export and import your encrypted vault payload as a JSON file.

---

## 🧩 How to Install the Browser Extension

1. Open the Xerox Web Application.
2. Click **Extension** in the header or sidebar, then click **Download Extension (.zip)**.
3. Unzip `xerox-browser-extension-mv3.zip` on your computer.
4. Open `chrome://extensions` in Google Chrome (or `edge://extensions` in Microsoft Edge).
5. Enable **Developer Mode** (toggle in top right).
6. Click **Load unpacked** and select the unzipped extension directory.
7. Pin the **Xerox 🔐** icon to your browser toolbar!

---

## 🔒 Security Architecture

* **Master Password**: Never sent to any server or stored on disk.
* **Auto-Lock**: Locks vault after inactivity (configurable to 5m, 15m, 30m, 1h, or manual).
* **Content Script Boundaries**: Content scripts on webpages never receive your full vault; only authorized credentials for the specific domain are returned upon user approval.

---

## 🛠️ Built With

* **Frontend**: React 19, Tailwind CSS, Lucide Icons, Motion.
* **Storage**: Browser IndexedDB & WebCrypto API (`crypto.subtle`).
* **Extension**: Manifest V3 (Service Worker, Content Script, Field Detector, WebCrypto).
