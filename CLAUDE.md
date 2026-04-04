# NeoKeeWeb

Modern KeePass web client. Forked from [keeweb](https://github.com/keeweb/keeweb), rewritten as a TypeScript monorepo.

## Quick Reference

```bash
bun install              # Install all workspace dependencies
bun run dev              # Dev server (core web app)
bun run build            # Build all packages
bun run test             # Test all packages
bun run test:db          # Test database package only
bun run test:core        # Test core web app only
bun run test:extension   # Test browser extension only
```

## Monorepo Structure

```
packages/
  core/       @neokeeweb/core       Web-based password manager UI (JS -> TS migration in progress)
  db/         @neokeeweb/db         KDBX4 database library (TypeScript, already mature)
  extension/  @neokeeweb/extension  Browser extension for autofill (TypeScript, Preact)
```

## Architecture Decisions

- **Web-only**: No Electron/desktop. PWA-first approach.
- **KDBX4 only**: Dropped KDBX3 (Salsa20 + AES-KDF). Only ChaCha20 + Argon2id.
- **Bun workspace**: Monorepo with `bun` as package manager and runtime.
- **TypeScript everywhere**: `packages/db` and `packages/extension` are already TS. `packages/core` is being migrated from JS.

## Key Dependencies

| Package | Core deps |
|---------|-----------|
| db | `@xmldom/xmldom`, `fflate` (gzip) |
| core | `kdbxweb` (-> `@neokeeweb/db`), `jquery`, `morphdom`, `handlebars`, `argon2-browser` |
| extension | `preact`, `tweetnacl` (NaCl crypto) |

## Crypto

- **AES-256-CBC**: Database encryption via WebCrypto
- **ChaCha20**: Database encryption + inner stream cipher (KDBX4)
- **Argon2id**: Key derivation (pluggable, user must provide impl)
- **SHA-256/512**: Key hashing, HMAC
- **tweetnacl**: Extension <-> app encrypted communication

## Development Rules

- Commit directly to `main`. PRs only when explicitly requested.
- Always run tests before committing.
- Never add npm packages without checking if Bun built-ins or existing deps cover it.
- All new code must be TypeScript with strict mode.

## Phase 1 Checklist

See milestone: https://github.com/gynet/neokeeweb/milestone/1

- [x] Merge 3 repos into monorepo
- [x] Strip Electron/desktop code (#1 closed)
- [x] Drop KDBX3, keep KDBX4 only (#3 closed)
- [x] Strip OAuth providers, keep WebDAV + IndexedDB (#8 closed)
- [x] Modernize build: Grunt -> Bun + Webpack (#5 closed)
- [x] CI/CD with GitHub Actions (#7 closed)
- [x] Playwright E2E framework (config + spec stubs)
- [x] keepass-rs interop tests (607 tests passing)
- [x] Remove dead desktop/plugin/YubiKey code (33 files, -1500 lines)
- [ ] Remove legacy deps (#6 — jquery, lodash, baron, pikaday, bourbon still in package.json)
- [ ] TypeScript migration for packages/core (#2 — Phase A done: 21 files, 5 models migrated)
- [ ] E2E test scenarios (#4 — database open tests added, more needed)
