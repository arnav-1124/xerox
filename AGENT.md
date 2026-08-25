# Xerox AI Developer Guide (AGENT.md) 🔐

Welcome, AI Developer / Agent! This file is the single source of truth and comprehensive developer blueprint for the **Xerox** project. 

No matter when you are reading this file, or what AI model you are, you should read this document first to understand the codebase, the architectural constraints, the security configurations, the project vision, and the next steps.

## ⚠️ CRITICAL AGENT DIRECTIVES & GUARDRAILS (STRICT RULES)

Every AI agent working on this codebase **MUST** follow these strict rules:
1. **Incremental MD Updates**: Never forget to update all crucial markdown files (`AGENT.md`, `walkthrough.md`, `task.md`, `ARCHITECTURE.md`, `DEV_Guide.md`) on an incremental basis whenever changes are introduced.
2. **Read Latest Sources**: For any implementation of technologies or dependencies, **do NOT rely on your pre-training knowledge**. Always read the latest official documentation or fetch external source files to verify current API versions and compatibility (e.g., React, WebRTC, Tauri, Pako, JSZip, etc.).
3. **Keep it Simple & Smooth**: The interface and technical flows must be completely clear, self-explanatory, and simple to follow for non-technical users. Avoid abstract lists; provide visual onboarding steps, flows, interactive routes, and explanations.

---

## 🌟 Vision, Mission, & Branding

### Motto
> **"Absolute Privacy. Zero Retention."**

### Mission
To provide a secure, enterprise-grade, local-first credentials and bookmark manager that empowers users to own 100% of their cryptographic keys and data, removing reliance on centralized, hackable cloud databases.

### Future Vision
To become the leading decentralized security hub for individual developers, power users, and privacy advocates—combining password management, biometric security, document vaulting, and smart bookmark organization into a unified, zero-overhead client application.

### Why Xerox is Better than Competitors (Bitwarden, 1Password, etc.)
1. **Zero Server Trust (Local-First)**: Competitors store your encrypted vaults on their servers. Xerox stores all keys and vaults locally in your browser's IndexedDB. Your master password never touches the internet.
2. **Zero Hosting Cost**: Users sync their data via their own **Google Drive** accounts. You don't need to pay for databases or backends, and users retain complete ownership of their storage.
3. **Passkey-First (WebAuthn PRF)**: Xerox uses the cutting-edge WebAuthn PRF (Pseudo-Random Function) extension. It derives encryption keys directly from your biometric hardware (Touch ID/Face ID/Windows Hello) without storing your master password in memory.
4. **All-in-One Utility**: It replaces two separate applications (a password manager and a bookmark organizer) with a single, highly performant, unified client interface.

---

## 🛠️ Currently Implemented Features

Xerox is fully featured and production-ready:
* **Envelope Encryption Model**: Leverages a 3-tier envelope model. A random 256-bit AES-GCM Vault Encryption Key (VEK) encrypts the vault. The VEK is wrapped by Key Encryption Keys (KEK) derived via PBKDF2 (from master password or recovery key) or biometric WebAuthn PRF.
* **Biometric Unlock**: Supports registering multiple hardware passkeys using WebAuthn PRF to wrap/unwrap the VEK.
* **Zero-Knowledge Cloud Sync**: Built-in dynamic integration with **Google Drive API** in [googleDriveSync.ts](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/src/lib/googleDriveSync.ts). The client encrypts the payload before syncing, keeping it 100% zero-knowledge.
* **Data Importers/Exporters**: Supports importing credentials from Chrome, Bitwarden, and 1Password CSVs, and importing/exporting encrypted and raw JSON backups.
* **2FA TOTP Authenticator**: Built-in 2FA generator with automatic 30-second token cycles and copy-to-clipboard actions.
* **Smart Bookmark Manager**: Group bookmarks by custom categories, tag them, add descriptions, and organize them with sub-folders and custom colors.
* **Chrome/Edge Extension**: Manifest V3 extension in `/extension` that coordinates with the web app via custom messaging to detect login forms and perform autofill.
* **Local Security Audits**: Performs password audits using dictionary attacks, length audits, and the HaveIBeenPwned API (via K-Anonymity privacy hashes).
* **Command Palette**: Pressing `Ctrl + K` or `Cmd + K` opens a quick-search utility overlay across all passwords and bookmarks.
* **DuckDuckGo Email Protection**: Programmatic generation of private `@duck.com` email aliases via Vercel serverless proxy endpoint `/api/duck-alias` (to bypass CORS and bot detection).
* **WebRTC Local Device Sync**: A local-first peer-to-peer sync using browser `RTCPeerConnection` APIs, supporting Vanilla ICE for single QR Code scans/manual copy-paste, and room pin connections over public WebSocket signaling servers.
* **Decentralized IPFS Backup**: Client-side encrypted backup pinning to the decentralized web (IPFS) via a secure serverless Vercel function proxy `/api/ipfs-backup` and resilient HTTP gateway fallback polling.
* **Document Vault Compression & Encryption**: Securely compresses user-uploaded documents, PDFs, and images using the browser's native `CompressionStream` (GZIP format) before encrypting them with AES-256-GCM. Preserves full backward compatibility for raw plaintext files.

---

## 🔒 SaaS-Level Security & Code Protection

To prevent plagiarism, unauthorized hosting, and leakage of source code, the project is configured with robust guardrails:

### 1. GNU AGPL-3.0 Licensing (Anti-Proprietary Copyleft)
The project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** (see [LICENSE](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/LICENSE)). 
* If anyone copies your code, modifies it, and hosts it as a network service (SaaS), they are **legally required to open-source their entire project's source code** under the same license. This prevents commercial SaaS hijacking.

### 2. Trademark & Brand Protection
Under Section 7(e) of the AGPL-3.0, we have appended explicit terms to protect the **"Xerox"** brand name and logos.
* Anyone can fork the code, but they **cannot** use the name "Xerox", "Xerox Vault", or associated logos in their deployments or commercial applications. They must completely rebrand.

### 3. Hardened Production Builds (No Sourcemaps)
To make reverse-engineering and cloning the web interface difficult, [vite.config.ts](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/vite.config.ts) is configured with:
```typescript
build: {
  sourcemap: false,
}
```
This blocks Vite/Rollup from generating `.map` files, ensuring only fully minified, obfuscated, and chunked JavaScript reaches production.

### 4. Smart Service Worker Caching & Vercel Fallback Routing
To solve caching issues on new deployments, we've designed:
* **Network-First Navigation** in the service worker [sw.js](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/public/sw.js) for `/` and `/index.html`. Browsers always fetch the latest HTML with updated asset hashes when online, preventing white-screen freezes.
* **Strict Rewrite Exclusions** in [vercel.json](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/vercel.json). Vercel only rewrites clean navigation paths (e.g., `/vault`, `/settings`) to `/index.html` and returns a standard `404 Not Found` for missing static files (like old `.js` or `.css` chunks), preventing MIME type mismatch errors.

---

## 📈 SaaS-Level SEO Architecture

Xerox is optimized for visibility, search rankings, and performance:
1. **Semantic HTML5 Structure**: Strict hierarchy containing a single `<h1>` per page, structural section tags, and descriptive link text.
2. **Metadata & Open Graph**: Comprehensive headers in [index.html](file:///c:/Users/Arnav112/OneDrive/Desktop/google-ai-studio/xerox/index.html) including title tags, descriptions, canonical links, keywords, robots directions, and full Open Graph / Twitter Card social cards.
3. **Structured Schema Markup (JSON-LD)**: Rich schema definitions declaring Xerox as a secure `SoftwareApplication` (category `SecurityApplication`), enabling Google Rich Results.
4. **Performance Preconnects**: DNS/resource preconnecting to Google Fonts to speed up render times.
5. **Assets**: Custom `manifest.json`, `robots.txt`, and `sitemap.xml` are located in `/public`.

---

## 🚀 Future Backlog & Roadmap

For any future developers (human or AI), here are the recommended next steps to build on top of Xerox's local-first architecture:

1. **WebRTC Local Peer-to-Peer Sync (DONE)**: Direct local network sync between your computer's browser and phone's browser using WebRTC, with QR Code camera scan and broker room PIN options.
2. **Browser Native Autofill Integration (Credential Management API)**: Integrate the Web Credential Management API to allow browsers to save and suggest Xerox passwords natively.
3. **Disposable/Masked Email Aliases (DONE)**: Fully integrated DuckDuckGo Email Protection for random alias generation inside the password generator.
4. **IndexedDB Backup Shard System (DONE)**: Encrypted backup files locally and automatically uploaded to Web3/decentralized storage (IPFS) using client-side AES-256-GCM.
5. **PDF/Image File Vault Compression (DONE)**: Automatically compress PDFs, images, and files in the client using native CompressionStream before AES-GCM encryption.
