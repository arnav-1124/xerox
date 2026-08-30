# Lokker AI Developer Guide (AGENT.md) 🔐

Welcome, AI Developer / Agent! This file is the single source of truth and comprehensive developer blueprint for the **Lokker** project. 

No matter when you are reading this file, or what AI model you are, you should read this document first to understand the codebase, the architectural constraints, the security configurations, the project vision, and the next steps.

## ⚠️ CRITICAL AGENT DIRECTIVES & GUARDRAILS (STRICT RULES)

Every AI agent working on this codebase **MUST** follow these strict rules:
1. **Incremental MD Updates**: Never forget to update all crucial markdown files (`AGENT.md`, `walkthrough.md`, `task.md`, `ARCHITECTURE.md`, `DEV_Guide.md`) on an incremental basis whenever changes are introduced.
2. **Read Latest Sources**: For any implementation of technologies or dependencies, **do NOT rely on your pre-training knowledge**. Always read the latest official documentation or fetch external source files to verify current API versions and compatibility (e.g., React, WebRTC, Tauri, Pako, JSZip, etc.).
3. **Keep it Simple & Smooth**: The interface and technical flows must be completely clear, self-explanatory, and simple to follow for non-technical users. Avoid abstract lists; provide visual onboarding steps, flows, interactive routes, and explanations.
4. **Strict Border-Radius Limit**: Components, modals, cards, inputs, and buttons should maintain controlled border radiuses (`rounded-lg` or `rounded-[4px]`). Keep visual elements restrained and calm.
5. **Theme Color Policy**: Maintain Lokker's clean dark/light theme, using warm amber (`amber-500`/`orange-500`) for safety alerts or key security indicators, and emerald (`emerald-500`/`emerald-600`) for successes and active counts.

---

## 🌟 Vision, Mission, & Branding

### Motto
> **"Your Passwords. Your Device. Your Control."**

### Mission
To provide a secure, enterprise-grade, local-first credentials and bookmark manager that empowers users to own 100% of their cryptographic keys and data, removing reliance on centralized, hackable cloud databases.

### Future Vision
To become the leading decentralized security hub for individual developers, power users, and privacy advocates—combining password management, biometric security, document vaulting, and smart bookmark organization into a unified, zero-overhead client application.

### Why Lokker is Different
1. **Zero Server Trust (Local-First)**: Stored keys and vaults reside locally in your browser's IndexedDB. Your master password never touches the internet.
2. **Zero Hosting Cost**: Users own their storage. No centralized database fees or vendor lock-in.
3. **Passkey-First (WebAuthn PRF)**: Lokker uses the cutting-edge WebAuthn PRF (Pseudo-Random Function) extension to derive encryption keys directly from hardware passkeys without caching master passwords in memory.
4. **All-in-One Utility**: Replaces separate applications (password manager + bookmark organizer + 2FA authenticator + file vault) with a single, highly performant client interface.

---

## 🛠️ Currently Implemented Features

Lokker is fully featured and production-ready:
* **Envelope Encryption Model**: Leverages a 3-tier envelope model. A random 256-bit AES-GCM Vault Encryption Key (VEK) encrypts the vault. The VEK is wrapped by Key Encryption Keys (KEK) derived via PBKDF2 (from master password or recovery key) or biometric WebAuthn PRF.
* **Biometric Unlock**: Supports registering multiple hardware passkeys using WebAuthn PRF to wrap/unwrap the VEK.
* **Zero-Knowledge Cloud Sync**: Built-in dynamic integration with Google Drive API in `googleDriveSync.ts`. The client encrypts the payload before syncing, keeping it 100% zero-knowledge.
* **Data Importers/Exporters**: Supports importing credentials from Chrome, Bitwarden, 1Password, and Firefox CSVs, and importing/exporting encrypted and raw JSON backups.
* **2FA TOTP Authenticator**: Built-in 2FA generator with automatic 30-second token cycles and copy-to-clipboard actions.
* **Smart Bookmark Manager**: Group bookmarks by custom categories, tag them, add descriptions, and organize them with sub-folders and custom colors.
* **Chrome/Edge Extension**: Manifest V3 extension in `/extension` that coordinates with the web app via custom messaging to detect login forms and perform autofill.
* **Local Security Audits**: Performs password audits using dictionary attacks, length audits, and the HaveIBeenPwned API (via K-Anonymity privacy hashes).
* **Command Palette**: Pressing `Ctrl + K` or `Cmd + K` opens a quick-search utility overlay across all passwords and bookmarks.
* **DuckDuckGo Email Protection**: Programmatic generation of private `@duck.com` email aliases via Vercel serverless proxy endpoint `/api/duck-alias`.
* **WebRTC Local Device Sync**: A local-first peer-to-peer sync using browser `RTCPeerConnection` APIs, supporting Vanilla ICE for single QR Code scans and room PIN connections.
* **Decentralized IPFS Backup**: Client-side encrypted backup pinning to IPFS via a secure serverless Vercel function proxy `/api/ipfs-backup`.
* **Document Vault Compression & Encryption**: Securely compresses user-uploaded documents, PDFs, and images using `CompressionStream` (GZIP format) before encrypting with AES-256-GCM.

---

## 🔒 SaaS-Level Security & Code Protection

The project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** (see [LICENSE](LICENSE)).

### Hardened Production Builds (No Sourcemaps)
Configured in `vite.config.ts` with `sourcemap: false` to ensure production builds are clean and secure.

### Smart Service Worker Caching & Vercel Fallback Routing
* **Network-First Navigation** in `sw.js` for `/` and `/index.html`.
* **Strict Rewrite Exclusions** in `vercel.json` to prevent MIME type mismatch errors on missing assets.

---

## 📈 SaaS-Level SEO Architecture

Lokker is optimized for visibility, search rankings, and performance:
1. **Semantic HTML5 Structure**: Strict hierarchy containing a single `<h1>` per page, structural section tags, and descriptive link text.
2. **Metadata & Open Graph**: Comprehensive headers in `index.html` including title tags, descriptions, canonical links, keywords, and full Open Graph / Twitter Card social cards.
3. **Structured Schema Markup (JSON-LD)**: Rich schema definitions declaring Lokker as a secure `SoftwareApplication` (category `SecurityApplication`).
4. **Performance Preconnects**: DNS/resource preconnecting to Google Fonts.
5. **Assets**: Custom `manifest.json`, `robots.txt`, and `sitemap.xml` located in `/public`.
