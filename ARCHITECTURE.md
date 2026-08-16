# Xerox - Full Technical Architecture, Logic & Security Documentation 🔐

Welcome to the comprehensive technical documentation for **Xerox**, an enterprise-grade, zero-knowledge, local-first password manager, 2FA TOTP authenticator, smart bookmark manager, and Chrome/Edge Manifest V3 browser extension.

This document contains everything a developer needs to understand the end-to-end codebase, cryptographic specifications, extension messaging contracts, security boundaries, rate-limiting rules, and execution flows.

---

## 📐 Table of Contents

1. [High-Level Architectural Overview](#1-high-level-architectural-overview)
2. [Data Layer & Vault Storage Architecture](#2-data-layer--vault-storage-architecture)
3. [Cryptographic Security Specifications](#3-cryptographic-security-specifications)
4. [Manifest V3 Browser Extension Architecture](#4-manifest-v3-browser-extension-architecture)
5. [Real-World Autofill Pipeline & Field Detection Engine](#5-real-world-autofill-pipeline--field-detection-engine)
6. [Web App <-> Extension Synchronization Security Bridge](#6-web-app---extension-synchronization-security-bridge)
7. [Security Boundaries, Origin Protection & Rate-Limiting](#7-security-boundaries-origin-protection--rate-limiting)
8. [2FA TOTP Engine Specifications](#8-2fa-totp-engine-specifications)
9. [Biometric WebAuthn Unlock Specification](#9-biometric-webauthn-unlock-specification)
10. [Client-Side Encrypted Google Drive Sync](#10-client-side-encrypted-google-drive-sync)
11. [Developer Setup, Building & Automated Validation](#11-developer-setup-building--automated-validation)

---

## 1. High-Level Architectural Overview

Xerox is built on a **Zero-Knowledge, Local-First Architecture**. There are no centralized auth servers, remote databases, analytics trackers, or third-party cloud data dependencies.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Xerox System Architecture                         │
└─────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────────────────────────────┐     ┌──────────────────────────────┐
 │     Xerox Web Application (SPA)     │     │ Chrome / Edge Browser        │
 │     (React 18 + TypeScript + Vite)   │     │ Extension (Manifest V3)      │
 └──────────────────┬───────────────────┘     └──────────────┬───────────────┘
                    │                                        │
                    │ postMessage Bridge                     │ Chrome Storage &
                    │ (isTrustedXeroxOrigin)                 │ Tab Messaging
                    ▼                                        ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                      Background Service Worker                            │
 │     (Session storage rehydration, lock policy, origin verification)       │
 └──────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                   Local Storage & Crypto Subsystem                        │
 │  - WebCrypto API (AES-GCM 256-bit + PBKDF2 100k iterations)               │
 │  - IndexedDB (XeroxLocalVaultDB) & chrome.storage.local                  │
 │  - WebAuthn Biometrics (Touch ID / Face ID / Windows Hello)               │
 └───────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Design Rules:
1. **Zero Retention:** Encryption keys and decrypted vault data exist *only* in volatile application memory while unlocked.
2. **Tab Independence:** Once vault payloads are synchronized to `chrome.storage.local`, the extension functions completely offline without requiring the Xerox Web Vault tab to stay open.
3. **Hardware Acceleration & Fallback:** WebCrypto API is primary. If running on a non-secure HTTP local origin (e.g. `http://192.168.x.x:3000`), execution falls back to NodeJS/CryptoJS fallback engines seamlessly.

---

## 2. Data Layer & Vault Storage Architecture

### A. Web Vault Storage (`IndexedDB: XeroxLocalVaultDB`)
The web application manages local persistence via IndexedDB (`src/lib/db.ts`):

- **`vault_meta` Store:** Stores `EncryptedVaultData` (`cipherText`, `iv`, `salt`, `version`, `updatedAt`) and password verifier tokens.
- **`bookmarks` Store:** Stores unencrypted bookmark metadata (`id`, `title`, `url`, `category`, `isFavorite`, `customIcon`).
- **`categories` Store:** Stores category hierarchy metadata (`id`, `name`, `color`, `parentId`, `isDefault`).
- **`encrypted_files` Store:** Stores encrypted user document blobs (PDFs, images, binary files).
- **`settings` Store:** Stores user preferences (`autoLockMinutes`, `requireConfirmationForAutofill`).

### B. Extension Storage Architecture (`chrome.storage`)
The extension utilizes Chrome's storage APIs strategically for security and lifespan control:

- **`chrome.storage.local` (Persistent at Rest):**
  - Holds `{ vaultMeta, encryptedVault }` payload synced from the Web App.
  - Holds `isUnlocked` boolean flag for basic UI state.
  - **Contains ZERO plaintext passwords or decrypted vault arrays.**
- **`chrome.storage.session` (Ephemeral In-Memory):**
  - Holds `{ decryptedVault, isUnlocked, unlockedAt, autoLockMinutes }`.
  - Automatically wiped by Chromium whenever the browser shuts down.
  - Rehydrates the Background Service Worker when it wakes up from MV3 idle suspension (~30s inactivity).

---

## 3. Cryptographic Security Specifications

All cryptographic routines are implemented in [`src/lib/crypto.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/src/lib/crypto.ts) and [`extension/vault/secure-storage.js`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/extension/vault/secure-storage.js).

### A. Key Derivation Function (KDF)
- **Algorithm:** PBKDF2 (Password-Based Key Derivation Function 2)
- **Hash Function:** SHA-256
- **Iterations:** `100,000`
- **Salt Length:** 16 bytes (128 bits) randomly generated via `window.crypto.getRandomValues()`

### B. Symmetric Cipher Specification
- **Algorithm:** AES-GCM (Galois/Counter Mode) 256-bit
- **Initialization Vector (IV):** 12 bytes (96 bits) unique per encryption operation
- **Authentication Tag:** 128-bit GCM tag automatically validated by WebCrypto `crypto.subtle.decrypt`

### C. Password Verification Token
To verify a master password without storing a plaintext hash:
$$\text{VerifierToken} = \text{AES-GCM-Encrypt}_{K_{\text{derived}}}(\text{"XEROX\_VERIFY\_TOKEN\_2026"}, \text{IV}_{0})$$
If decryption of `VerifierToken` matches `"XEROX_VERIFY_TOKEN_2026"`, the master password is verified.

---

## 4. Manifest V3 Browser Extension Architecture

The extension files are located in `extension/`:

```text
extension/
├── manifest.json              # MV3 configuration & permissions
├── background/
│   └── service-worker.js      # Core background message handler & session manager
├── content/
│   ├── field-detector.js      # Input classification & dynamic DOM observer
│   ├── autofill.js            # Input value setter & event dispatcher
│   └── content-script.js      # Shadow DOM UI modals, postMessage bridge & messaging
├── popup/
│   ├── popup.html             # Extension popup markup
│   ├── popup.css              # Custom styling
│   └── popup.js               # Extension popup controller
└── vault/
    ├── credential-matcher.js  # Deterministic domain matching engine
    ├── secure-storage.js      # AES-GCM decryption engine
    └── totp-generator.js      # 2FA code computation
```

### Manifest V3 Declarations (`manifest.json`):
- `permissions`: `["activeTab", "storage", "scripting"]`
- `host_permissions`: `["<all_urls>"]`
- `background`: `{ "service_worker": "background/service-worker.js", "type": "module" }`
- `content_scripts`: run at `document_idle` with `all_frames: true` to detect login forms inside iframe elements.

---

## 5. Real-World Autofill Pipeline & Field Detection Engine

Real browser autofill requires overriding framework-controlled inputs (React, Angular, Vue, Svelte) and firing complete hardware-like DOM event sequences.

```text
User Focuses Input or Clicks Badge
                │
                ▼
1. Field Detector (findLoginFields)
   - Multi-signal scoring: autocomplete, type, name, id, placeholder, aria-label
   - Scopes search relative to focused input's form/modal context
                │
                ▼
2. Extension Service Worker Query (GET_MATCHING_CREDENTIALS)
   - Evaluates domain matching: pageHost === credHost || pageHost.endsWith('.' + credHost)
                │
                ▼
3. Origin Authorization (AUTHORIZE_AUTOFILL)
   - Re-verifies page origin in background before releasing target credential
                │
                ▼
4. Native Prototype Descriptor Injection (fillCredentials)
   - Retrieves HTMLInputElement.prototype property descriptor setter
   - Fires focus -> click -> set value -> keydown -> keypress -> input (InputEvent) -> keyup -> change -> blur
```

### React State Change Event Sequence:
Standard assignment (`input.value = "val"`) fails in React because React tracks property values using internal fiber descriptors. Xerox bypasses this:
```js
const proto = Object.getPrototypeOf(inputElement);
const descriptor = Object.getOwnPropertyDescriptor(proto, 'value') || 
                   Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
descriptor.set.call(inputElement, value);

inputElement.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
inputElement.dispatchEvent(new Event('keydown', { bubbles: true, composed: true }));
inputElement.dispatchEvent(new Event('keypress', { bubbles: true, composed: true }));
inputElement.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: value }));
inputElement.dispatchEvent(new Event('keyup', { bubbles: true, composed: true }));
inputElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
inputElement.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
```

---

## 6. Web App <-> Extension Synchronization Security Bridge

The Xerox Web Application communicates with the extension content script via `window.postMessage`.

### Origin Security Guard (`isTrustedXeroxOrigin`):
To prevent malicious external websites from forging vault payloads:

```js
const TRUSTED_XEROX_ORIGINS = [
  'https://xerox-orcin.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8089',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8089'
];

function isTrustedXeroxOrigin() {
  const origin = (window.location.origin || '').toLowerCase();
  const host = (window.location.hostname || '').toLowerCase();
  if (TRUSTED_XEROX_ORIGINS.includes(origin)) return true;
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return false;
}
```

If `!isTrustedXeroxOrigin()`, all `XEROX_SYNC_VAULT` messages are dropped immediately.

---

## 7. Security Boundaries, Origin Protection & Rate-Limiting

### A. Phishing & Wrong Domain Protection
Credential matching rules in [`extension/vault/credential-matcher.js`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/extension/vault/credential-matcher.js) strictly enforce:
- Exact Match: `github.com` === `github.com` $\rightarrow$ **ALLOWED**
- Subdomain Match: `login.github.com` ends with `.github.com` $\rightarrow$ **ALLOWED**
- Attacker Suffix: `github.com.attacker.com` ends with `.attacker.com` $\rightarrow$ **REJECTED**
- Attacker Prefix: `attacker-github.com` $\rightarrow$ **REJECTED**

All fuzzy substring (`includes()`) logic has been purged to prevent domain spoofing.

### B. Master Password Rate-Limiting & Exponential Backoff
To prevent brute-force attacks on the unlock modal ([`src/components/MasterPasswordModal.tsx`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/src/components/MasterPasswordModal.tsx)):

- **Failed Attempt 1–2:** Standard inline error message.
- **Failed Attempt 3:** **5-second lockout timer**.
- **Failed Attempt 4:** **15-second lockout timer**.
- **Failed Attempt 5+:** **60-second lockout timer**.

During lockout, the submit button and password inputs are disabled.

### C. HaveIBeenPwned API Rate Limiting Header
When querying HaveIBeenPwned to check for breached passwords, `checkPasswordBreached` attaches the required padding header:
```javascript
const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
  headers: { 'Add-Padding': 'true' },
});
```

---

## 8. 2FA TOTP Engine Specifications

- **Algorithm:** HMAC-SHA1 pseudo-random TOTP computation ([`extension/vault/totp-generator.js`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/extension/vault/totp-generator.js) & [`src/lib/totp.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/src/lib/totp.ts)).
- **Time Block Step:** 30 seconds ($\text{epoch} = \lfloor \text{Date.now()} / 1000 / 30 \rfloor$).
- **Code Length:** 6 digits, zero-padded.
- **Extension Clipboard Integration:** When a credential with `totpSecret` is authorized and autofilled, the extension service worker automatically computes the code and writes it to `navigator.clipboard`.

---

## 9. Biometric WebAuthn Unlock Specification

Implemented in [`src/lib/webauthn.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/src/lib/webauthn.ts):

- **Supported Authenticators:** Platform Authenticators (Apple Touch ID, Face ID, Windows Hello, Android Biometrics).
- **RP Resolution:** `PublicKeyCredentialCreationOptions` omits hardcoded `rp.id` so Chromium automatically binds to the effective origin (`localhost`, `xerox-orcin.vercel.app`).
- **Raw ID Serializer:** Uses RFC-compliant Base64URL ArrayBuffer encoders (`bufferToBase64Url` & `base64UrlToBuffer`) to preserve binary byte buffers across `navigator.credentials.create()` and `navigator.credentials.get()`.
- **Auto-Prompting:** Upon opening `MasterPasswordModal`, if biometrics are configured, the OS biometric prompt triggers automatically after 150ms.

---

## 10. Client-Side Encrypted Google Drive Sync

Implemented in [`src/lib/googleDriveSync.ts`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/src/lib/googleDriveSync.ts):

- **Target File:** `xerox_vault_encrypted_backup.json` stored in the user's private Google Drive.
- **Zero-Knowledge Guarantee:** The Google Drive API endpoint receives ONLY the AES-GCM encrypted ciphertext payload (`encryptedVault`). Google NEVER receives plaintext credentials or master passwords.

---

## 11. Developer Setup, Building & Automated Validation

### Development Environment Setup
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production web bundle
npm run build
```

### Running the Automated Extension Validation Pass
We maintain a 31-point end-to-end automated Playwright browser test suite ([`real_world_validation.cjs`](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/real_world_validation.cjs)) that tests the extension in a real Chromium browser instance:

```bash
# Execute automated 31-point real-world validation pass
node real_world_validation.cjs
```

#### Test Suite Checklist (31 / 31 Checks):
- ✅ MV3 Background Service Worker active
- ✅ Origin allowlist postMessage sync bridge verification
- ✅ Attacker origin rejection (`attacker.com`, `unrelated-app.vercel.app`, `xerox-phishing.org`)
- ✅ Web Vault tab closure & offline operation
- ✅ Standard HTML login form field detection & event sequence
- ✅ React synthetic state update retention
- ✅ `MutationObserver` dynamic SPA modal detection
- ✅ Username-first step 1 & step 2 autofill
- ✅ Account picker privacy (zero password leakage in summary objects)
- ✅ Phishing domain rejection (`github.com.attacker.com` denied)
- ✅ Service worker suspension rehydration via `chrome.storage.session`
- ✅ Browser restart session storage clearance & lock policy
- ✅ Incorrect master password & invalid ID error boundaries
