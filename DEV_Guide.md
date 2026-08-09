# Xerox Developer Guide & Architecture Reference

Xerox is a local-first, privacy-focused Bookmark Manager + Password Manager with **real browser autofill** powered by a Chrome/Edge Manifest V3 extension.

---

## 1. Project Architecture

```text
xerox-vault/
├── src/                          ← React Web Application
│   ├── components/               ← Dark SaaS UI components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BookmarkList.tsx
│   │   ├── PasswordList.tsx
│   │   ├── PasswordModal.tsx
│   │   ├── PasswordGeneratorModal.tsx
│   │   ├── MasterPasswordModal.tsx
│   │   ├── ExtensionGuideModal.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── SettingsView.tsx
│   │   ├── SecurityAuditView.tsx   ← Local password health & breach pattern audit
│   │   ├── FileVaultView.tsx       ← Encrypted file & document local vault
│   │   ├── TotpAuthenticatorView.tsx ← 2FA TOTP live authenticator generator
│   │   ├── ErrorBoundary.tsx     ← Robust runtime crash protector with emergency export
│   │   └── Toast.tsx
│   ├── lib/
│   │   ├── crypto.ts             ← WebCrypto PBKDF2 + AES-GCM & Password Generator
│   │   ├── db.ts                 ← IndexedDB local database manager
│   │   ├── sampleData.ts         ← Initial categories and sample bookmarks
│   │   └── extensionExporter.ts  ← JSZip exporter for unpacked extension package
│   ├── types.ts                  ← TypeScript definitions
│   ├── App.tsx                   ← State manager & vault lock orchestrator
│   └── main.tsx                  ← PWA service worker registration & error boundary
├── extension/                    ← Manifest V3 Chrome/Edge Browser Extension
│   ├── manifest.json             ← Permissions & scripts declarations
│   ├── background/
│   │   └── service-worker.js     ← Lock state manager & credential provider
│   ├── content/
│   │   ├── field-detector.js     ← DOM login form inspector & MutationObserver
│   │   ├── autofill.js           ← DOM input setter & native event dispatcher
│   │   └── content-script.js     ← Extension content orchestrator & badge UI
│   └── vault/
│       ├── credential-matcher.js ← Strict origin/domain parser & security rules
│       └── secure-storage.js     ← WebCrypto decoder for extension worker
├── public/
│   ├── manifest.json             ← PWA manifest
│   ├── sw.js                     ← Service Worker for 100% offline caching
│   ├── robots.txt                ← SEO Crawler rules
│   ├── sitemap.xml               ← XML Sitemap
│   └── favicon.svg               ← Custom brand icon
├── SECURITY.md                   ← Zero-knowledge threat model & vulnerability reporting
├── CONTRIBUTING.md               ← Contribution guidelines for open source
├── LICENSE                       ← MIT Open Source License
├── DEV_Guide.md                  ← Developer reference
└── README.md                     ← Project overview & branding
```

---

## 2. Local-First Security & Cryptography Specification

* **Key Derivation (PBKDF2)**:
  * Algorithm: `PBKDF2` with `SHA-256`.
  * Iterations: `100,000`.
  * Salt: 16 bytes generated via `crypto.getRandomValues()`.
* **Symmetric Vault Encryption (AES-GCM)**:
  * Key Length: 256 bits.
  * Initialization Vector (IV): 12 random bytes per encryption operation.
  * Data payload ciphertext is Base64 encoded and stored in IndexedDB.
* **Master Password Verification**:
  * Master password is **never stored** anywhere.
  * A verifier token is encrypted with the derived key. Verification checks if this token decrypts cleanly.
* **Zero Backend**:
  * All cryptographic keys and decrypted items reside exclusively in client JS memory during an active unlocked session.
  * Locking or auto-lock timeout clears the memory references.

---

## 3. Extension Autofill Security & Domain Matching

1. **Origin Verification**:
   * Uses browser `URL` API to extract standard hostnames (`github.com`).
   * Strict subdomain matching rejects phishing or malicious hosts (`github.com.attacker.com`).
2. **Minimal Secret Exposure**:
   * Content scripts never receive the full vault.
   * Only the single credential approved by the user is transmitted to the current tab upon explicit authorization.
3. **Framework Compatibility**:
   * React, Vue, Angular, and plain HTML forms often track input state via prototype property setters. `XeroxAutofill.setInputValue()` triggers native property setters followed by `input`, `change`, and `blur` events.

---

## 4. Development & Deployment Instructions

### Running the Web Application
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Loading Extension in Chrome / Edge (Free Sideloading)
1. Click **Extension** in Xerox top bar -> **Download Extension (.zip)**.
2. Extract the downloaded zip file to a directory.
3. Open `chrome://extensions` or `edge://extensions`.
4. Enable **Developer Mode** in top right.
5. Click **Load unpacked** and choose the extracted directory.
6. Pin Xerox 🔐 extension to your toolbar!

### Deploying Web App to Vercel
1. Push repository to GitHub.
2. Link project in Vercel.
3. Build Command: `npm run build`
4. Output Directory: `dist`
