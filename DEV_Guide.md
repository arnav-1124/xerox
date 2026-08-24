# Xerox Developer Guide & Technical Architecture

Xerox is an enterprise-grade, local-first password vault, 2FA TOTP authenticator, smart bookmark manager, and Chrome/Edge Manifest V3 browser extension with **real browser autofill**.

---

## 1. Codebase Structure & Architecture

```text
src/
├── domain/                  # Pure Domain Entities & Types (Zero framework/storage dependencies)
│   ├── vault/               # VaultItem, VaultItemType, VaultEnvelopeV2, WebAuthnProtection
│   ├── bookmarks/           # Bookmark domain entity
│   ├── categories/          # Category entity & tree structure
│   ├── security/            # PasswordHealth, LocalRecoveryKit domain models
│   └── shared/              # Common types & VaultState enum
│
├── infrastructure/          # Low-Level Storage, Crypto & Hardware Adapters
│   ├── storage/             # VaultRepository, BookmarkRepository, CategoryRepository (IndexedDB)
│   ├── crypto/              # CryptoService (WebCrypto AES-GCM 256-bit + PBKDF2 100k + VEK/KEK envelope)
│   ├── webauthn/            # WebAuthnService (Hardware PRF Extension + HKDF Biometric KEK)
│   ├── google-drive/        # GoogleDriveService (Encrypted cloud backup)
│   └── extension/           # Extension Messaging Contracts
│
├── application/             # Core Use Cases & Application Services
│   ├── vault/               # VaultService (State machine, unlock, recovery, password rotation, passkeys)
│   ├── bookmarks/           # BookmarkService
│   ├── categories/          # CategoryService
│   ├── security/            # SecurityService & PasswordHealthService
│   └── import-export/       # ImportExportService (Multi-format parsers & preview)
│
├── hooks/                   # Custom React Hooks
├── tests/                   # P0 & P1 Cryptographic, WebAuthn PRF & Tamper Test Suites
└── components/              # UI Render Components
```

---

## 2. Essential Commands

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. TypeScript type check
npm run lint

# 4. Run P0 Crypto & Recovery Unit Test Suite
npx tsx src/tests/cryptoP0Remediation.test.ts

# 5. Run P1 WebAuthn PRF & Tamper Hardening Suite
npx tsx src/tests/cryptoP1WebAuthn.test.ts

# 6. Run WebRTC Local P2P Sync & Merge Suite
npx tsx src/tests/webrtc.test.ts

# 7. Run DuckDuckGo API Endpoint Suite
npx tsx src/tests/duckAlias.test.ts

# 8. Execute 31-point real-world extension validation suite
npm run test:extension

# 9. Build production web bundle
npm run build
```

---

## 3. Cryptographic Specification

- **VEK:** Random 256-bit AES-GCM Key (`crypto.getRandomValues()`).
- **KEK / RKEK / Biometric KEK:** Derived via PBKDF2 (SHA-256, 100,000 iterations) or WebAuthn PRF extension + HKDF (SHA-256).
- **Cipher:** AES-GCM 256-bit with unique 12-byte IV per encryption.
- **HaveIBeenPwned API:** SHA-1 k-Anonymity 5-character prefix search with `Add-Padding: true` headers.
