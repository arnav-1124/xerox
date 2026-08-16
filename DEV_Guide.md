# Xerox Developer Guide & Technical Architecture

Xerox is an enterprise-grade, local-first password vault, 2FA TOTP authenticator, smart bookmark manager, and Chrome/Edge Manifest V3 browser extension with **real browser autofill**.

---

## 1. Codebase Structure & Architecture

```text
src/
├── domain/                  # Pure Domain Entities & Types (Zero framework/storage dependencies)
│   ├── vault/               # VaultItem, VaultItemType, VaultEnvelopeV2
│   ├── bookmarks/           # Bookmark domain entity
│   ├── categories/          # Category entity & tree structure
│   ├── security/            # PasswordHealth, LocalRecoveryKit domain models
│   └── shared/              # Common types & VaultState enum
│
├── infrastructure/          # Low-Level Storage, Crypto & Hardware Adapters
│   ├── storage/             # VaultRepository, BookmarkRepository, CategoryRepository (IndexedDB)
│   ├── crypto/              # CryptoService (WebCrypto AES-GCM 256-bit + PBKDF2 100k + VEK/KEK envelope)
│   ├── webauthn/            # WebAuthnService (Platform Authenticators)
│   ├── google-drive/        # GoogleDriveService (Encrypted cloud backup)
│   └── extension/           # Extension Messaging Contracts
│
├── application/             # Core Use Cases & Application Services
│   ├── vault/               # VaultService (State machine, unlock, recovery, password rotation) & VaultMigrationService
│   ├── bookmarks/           # BookmarkService
│   ├── categories/          # CategoryService
│   ├── security/            # SecurityService & PasswordHealthService
│   └── import-export/       # ImportExportService (Multi-format parsers & preview)
│
├── hooks/                   # Custom React Hooks
├── tests/                   # P0 Cryptographic & Migration Test Suite
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

# 5. Execute 31-point real-world extension validation suite
npm run test:extension

# 6. Build production web bundle
npm run build
```

---

## 3. Cryptographic Specification

- **VEK:** Random 256-bit AES-GCM Key (`crypto.getRandomValues()`).
- **KEK / RKEK:** PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt).
- **Cipher:** AES-GCM 256-bit with unique 12-byte IV per encryption.
- **HaveIBeenPwned API:** SHA-1 k-Anonymity 5-character prefix search with `Add-Padding: true` headers.
