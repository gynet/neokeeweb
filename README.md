# NeoKeeWeb

Modern, web-only KeePass client. TypeScript monorepo.

Demo: https://gynet.github.io/neokeeweb/

Forked from [KeeWeb](https://github.com/keeweb/keeweb) (12.9k stars, stalled since 2021). Rebuilt with a focus on simplicity, security, and maintainability.

## What Changed from KeeWeb

| | KeeWeb | NeoKeeWeb |
|---|---|---|
| Platform | Electron + Web | **Web only** |
| Language | JavaScript (Babel) | **TypeScript (strict)** |
| DB Format | KDBX3 + KDBX4 | **KDBX4 only** (ChaCha20 + Argon2id) |
| Build | Grunt + Webpack | **Bun + Webpack** |
| Repos | 3 separate repos | **1 monorepo** |
| Extension | Chrome/Firefox/Edge/Safari | **Chrome/Firefox/Edge** |
| Dependencies | ~80 packages | **~20 packages** |
| Desktop | Electron v13, native modules | **Removed** |
| Storage | Dropbox, GDrive, OneDrive, WebDAV | **WebDAV + IndexedDB** (OAuth providers removed) |

## Quick Start

```bash
git clone https://github.com/gynet/neokeeweb.git
cd neokeeweb
bun install
bun test        # Run all tests
bun run dev     # Start web app dev server
```

## Monorepo Structure

```
packages/
  core/         @neokeeweb/core        Web password manager UI
  db/           @neokeeweb/db          KDBX4 database library
  extension/    @neokeeweb/extension   Browser autofill extension (Chrome/Firefox/Edge)
```

### `@neokeeweb/db`

TypeScript library for reading/writing KeePass KDBX4 files.

- **Encryption**: AES-256-CBC, ChaCha20 (via WebCrypto)
- **KDF**: Argon2id (pluggable, WASM-based)
- **Integrity**: HMAC-SHA-256 block transform
- **Compression**: GZip (fflate)
- **Dependencies**: `@xmldom/xmldom`, `fflate` — that's it

```typescript
import { Kdbx, Credentials } from '@neokeeweb/db';

const credentials = new Credentials(password);
const db = Kdbx.create(credentials, 'My Database');
const group = db.createGroup(db.getDefaultGroup(), 'Social');
const entry = db.createEntry(group);
entry.fields.set('Title', 'GitHub');
entry.fields.set('UserName', 'user@example.com');
const data = await db.save();
```

### `@neokeeweb/core`

Web-based password manager UI. PWA-ready.

- Custom MV* framework with Handlebars templates
- SCSS styling with FontAwesome icons
- Storage: WebDAV + browser IndexedDB (see [Storage](#storage) below)
- Browser extension integration via encrypted protocol

### `@neokeeweb/extension`

Browser extension for autofill. Manifest V3.

- Smart autofill (username + password detection)
- TOTP support
- End-to-end encrypted communication (tweetnacl NaCl box)
- Targets: Chrome, Firefox, Edge

## Development

```bash
# Individual packages
bun run test:db          # Database library tests
bun run test:core        # Core app tests
bun run test:extension   # Extension tests

# Build
bun run build            # Build all packages

# Extension development
cd packages/extension
bun run watch-chrome     # Watch mode for Chrome
bun run watch-firefox    # Watch mode for Firefox
```

## Storage

NeoKeeWeb supports two storage backends:

| Backend | Protocol | Auth | Use Case |
|---------|----------|------|----------|
| **WebDAV** | HTTPS | Basic Auth | Self-hosted (Nextcloud, Synology, any WebDAV server) |
| **IndexedDB** | Browser API | None | Local browser storage, offline access |

**Why no Google Drive / Dropbox / OneDrive?**

The upstream KeeWeb OAuth apps are broken:
- **Google Drive**: Blocked by Google — requires Tier 3 CASA security audit for `drive` scope. The app was never re-verified.
- **OneDrive**: Uses deprecated OAuth v1 endpoint. Fails for personal Microsoft accounts.
- **Dropbox**: Works upstream but requires maintaining a registered Dropbox app with their review process.

Maintaining OAuth apps for 3 cloud providers is a significant ongoing burden (security audits, scope reviews, API changes). WebDAV is a universal protocol that works with all major cloud storage providers that support it — including Nextcloud, ownCloud, Synology, and many others.

Cloud provider support may return in Phase 2 with user-provided OAuth credentials.

## Security

- **KDBX4 only** — no legacy crypto (Salsa20, AES-KDF removed)
- **ChaCha20** stream cipher for database encryption
- **Argon2id** key derivation (memory-hard, GPU-resistant)
- **WebCrypto API** for all standard crypto operations
- **DOMPurify** for XSS prevention
- **tweetnacl** for extension-app encrypted communication
- Passwords stored as `ProtectedValue` (XOR-encrypted in memory)

## Roadmap

### Phase 1: Foundation (current) — [milestone](https://github.com/gynet/neokeeweb/milestone/1)
- [x] Merge 3 repos into monorepo
- [x] Strip Electron/desktop code (#1)
- [x] Drop KDBX3 support, keep KDBX4 only (#3)
- [x] Modernize build: Grunt -> Bun + Webpack (#5)
- [x] Strip OAuth storage providers, keep WebDAV + IndexedDB (#8)
- [x] CI/CD with GitHub Actions (#7)
- [x] Playwright E2E framework (config + spec stubs)
- [x] keepass-rs interop tests (607 tests passing)
- [x] Remove dead desktop/plugin/YubiKey code (-1500 lines)
- [ ] Remove legacy dependencies (#6 — jquery, lodash, baron, etc.)
- [ ] Complete TypeScript migration for packages/core (#2)
- [ ] E2E test scenarios (#4)

### Phase 2: Features (planned) — [milestone](https://github.com/gynet/neokeeweb/milestone/2)
- Passkey support (store + WebAuthn PRF unlock)
- Cloud storage with user-provided OAuth credentials (BYOK)
- UX improvements
- See [GitHub Issues](https://github.com/gynet/neokeeweb/issues)

## License

[MIT](LICENSE)

## Credits

Built on the shoulders of [KeeWeb](https://github.com/keeweb/keeweb) by Antelle and [kdbxweb](https://github.com/keeweb/kdbxweb). Original work licensed under MIT.
