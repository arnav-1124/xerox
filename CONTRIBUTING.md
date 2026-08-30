# Contributing to Lokker

Thank you for your interest in contributing to Lokker! We welcome contributions from developers, security auditors, and privacy advocates who share our vision of a local-first, zero-knowledge digital vault.

---

## Code of Conduct

By participating in this project, you agree to abide by our core principles:
1. **Uncompromising Privacy**: Never introduce telemetry, tracking, or remote storage of user secrets.
2. **Code Quality**: Maintain strict TypeScript type safety and robust error handling.
3. **Respectful Collaboration**: Constructive code review and polite discussions are required.

---

## Development Workflow

1. **Fork & Clone** the repository.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
4. **Build & Test**:
   ```bash
   npm run build
   npx tsc --noEmit
   ```

---

## Submitting Pull Requests

1. Create a descriptive branch (e.g., `fix/extension-autofill-edge` or `feat/biometric-unlock`).
2. Ensure all TypeScript linter checks pass.
3. Submit a Pull Request explaining the security or functional improvements introduced.
