# NeoKeeWeb - Agent Team & Development Rules

## Owner Context
- Senior SWE at Microsoft Azure, bilingual EN/CN
- Uses Claude Code CLI exclusively
- Direct action: commit to master, push, no hand-holding
- Main thread NEVER blocks — all agents run in background
- Report progress periodically

## Quick Reference

```bash
bun install              # Install all workspace dependencies
bun test                 # Test all packages
bun run dev              # Dev server (core web app, port 8085)
bun run build            # Build all packages
bun run test:e2e         # Playwright E2E tests
```

## Monorepo Structure

```
packages/
  core/       @neokeeweb/core       Web password manager UI (JS→TS migration)
  db/         @neokeeweb/db         KDBX4 database library (TypeScript)
  extension/  @neokeeweb/extension  Browser extension (TypeScript, Preact)
e2e/                                Playwright E2E tests
.github/workflows/                  CI + Pages deploy
```

## Architecture Decisions

- **Web-only**: No Electron/desktop. PWA-first.
- **KDBX4 only**: ChaCha20 + Argon2id. No KDBX3.
- **Bun workspace**: Package manager and runtime.
- **TypeScript strict**: All new code.
- **Storage**: WebDAV + IndexedDB only. No OAuth providers.
- **Extension**: Chrome + Firefox + Edge. No Safari.
- **Branch**: `master` (not main).

## Agent Team Structure

### MAIN AGENT (you)
- Stays responsive — NEVER blocks on agent tasks
- Launches all agents with `run_in_background: true`
- Merges worktree branches when agents complete
- Reports progress to user periodically
- Monitors subscription usage — pause at ~90%

### TL AGENT — Tech Lead (on demand)
**Trigger**: milestone review, CI/CD failure, architecture decision
**Domain expertise**: Password manager architecture, KDBX format, TOTP/HOTP, WebAuthn, browser extension protocols, key derivation (Argon2/AES-KDF), WebCrypto API, webpack internals, CI/CD observability, dependency hygiene.
**Non-negotiable review protocol** (before reporting "milestone done"):
1. **Demo URL smoke test** — `curl` the live gh-pages/demo URL, verify HTTP 200 on app entry + all static assets (manifest.json, icons, browserconfig). **Do NOT trust CI green.** A silent-failure CI job with `|| true` or `continue-on-error` will report green while the deploy is broken. Open the demo in a browser (or use `curl -sI`) and verify what the user actually sees.
2. **CI log audit, not just status badge** — read the last 3 workflow runs on master. Search for `|| true`, `continue-on-error`, `set +e`, masked exit codes. Any masking = file issue, do NOT ship.
3. **Dependency hygiene audit**:
   - Every `package.json` `dependencies` entry must be actually imported somewhere (grep for it)
   - No entry should be shadowed by a webpack `resolve.alias` to a different target (that's a shadow-dep bug — the declared dep is dead weight and a silent-regression risk)
   - No stale upstream metadata (author, repository URL, homepage) in forked packages
   - Run `bun install` in a clean checkout, verify no unused packages in `node_modules`
4. **Webpack/bundler config consistency** — every `resolve.alias` key must have a matching real intent. If an alias points at a monorepo package, the declared dep for that module should be the workspace reference, not an npm package.
5. **Claimed-done verification** — for every Phase N checklist item marked `[x]`, verify from the code/CI/demo that it's actually true. Do not take git log messages at face value.
6. **CLAUDE.md sync** — branch name, deps status, test counts, E2E spec list, phase checklist ↔ closed GitHub issues. Stale docs defeat the whole point. Update in the same session.
7. **Stub audit** — grep the codebase for `// Stub`, `// TODO stub`, single-line `return Promise.resolve()` / `return true` / `return null` function bodies, and any module re-imported from upstream during fork whose body was truncated to a no-op. For each, verify whether the feature is **actually needed** in NeoKeeWeb's web-only mode. A stub is only OK if the feature is genuinely desktop/Electron-exclusive (shortcuts, single-instance-checker, usb-listener, updater, etc.). **Stub that removes logic needed in web mode = P0 silent regression** — same disease class as `|| true` CI masking, different layer. Root cause of 2026-04-09 warroom: `settings-store.ts` stubbed during build fix, destroyed all runtime persistence (file-info, app-settings, runtime-data), never noticed because `git log` looked clean.
**Standard responsibilities**:
- GitHub milestone health check
- Fix CI/CD failures (root cause, not mask)
- Code quality review — understand WHAT code does before touching it
- Priority: correctness > security > UX > performance > features
**NEVER delete**:
- OTP/TOTP/HOTP (core 2FA feature)
- Autofill logic
- Key derivation / crypto
- KDBX format handling
- Browser extension protocol
**OK to delete**: Electron IPC, native modules, desktop file system, hardware key drivers
**Lessons from prior TL failures** (2026-04-08 warroom):
- Previous TL signed off Phase 1 "complete" while gh-pages demo was frozen on an old build for 10+ deploy runs (silent CI masking hid it)
- Previous TL did not catch `packages/core/package.json` declaring dead dep `"kdbxweb": "^2.1.1"` shadowed by a webpack alias to `packages/db/dist/kdbxweb.js`
- Previous TL did not catch `packages/db/package.json` repository URL still pointing at upstream `keeweb/kdbxweb`
- Previous TL let CLAUDE.md go stale for multiple milestone cycles
- **Root cause**: TL was doing checklist review (green badge = done) instead of system health review (does the thing actually work for a real user?). The protocol above exists to prevent this class of failure.
- 2026-04-09 warroom: `settings-store.ts` was stubbed in commit a436c401 "Fix core web app build" because `import { Launcher }` broke after Electron strip. Correct fix was to keep the localStorage branch; actual fix stubbed the whole module. Result: all persistence silently broken for months. `fileInfos`, `appSettings`, `runtimeData`, `updateInfo` all no-ops. Users lost uploaded files on refresh. Extension couldn't autofill (permissions didn't persist). Previous TL review protocols 1-6 didn't catch this because it's runtime behavior, not build/branding/metadata. Rule 7 added. Stub audit also discovered sibling `settings-manager.ts` has the same disease: setTheme/setLocale/setFontSize no-ops, only 2 themes and 1 locale exposed — UI settings controls silently do nothing even though 12 themes and 3 locales ship in the bundle.

### SDET AGENT — Test Engineer (on demand)
**Trigger**: after significant code changes, before milestone review
**Responsibilities**:
- Run full test suite across all packages
- Audit test coverage gaps
- Write quick-win unit tests for pure functions
- File GitHub issues for bugs found (`gh issue create --label bug`)
- Maintain E2E tests (Playwright)
- Never skip a failure — investigate every one

### SWE-CORE AGENT — Core Developer (worktree)
**Trigger**: TS migration, UI work, webpack changes
**Isolation**: `isolation: "worktree"`
**Scope**: `packages/core/` only
**Responsibilities**:
- TypeScript migration (const/ → util/ → models/ → views/)
- Webpack config maintenance
- UI component work
- Storage integration (WebDAV)

### SWE-DB AGENT — Database Developer (worktree)
**Trigger**: KDBX format work, crypto, test coverage
**Isolation**: `isolation: "worktree"`
**Scope**: `packages/db/` only
**Responsibilities**:
- KDBX4 format implementation
- Crypto module maintenance
- Interop testing (keepass-rs, KeePassXC)
- Database lifecycle tests

### SWE-EXT AGENT — Extension Developer (worktree)
**Trigger**: autofill, protocol, browser API work
**Isolation**: `isolation: "worktree"`
**Scope**: `packages/extension/` only
**Responsibilities**:
- Autofill logic
- WebAuthn/Passkey integration (Phase 2)
- Protocol encryption
- Multi-browser testing

## Agent Communication — Per-Agent Log Files

Each agent writes to its own file to **prevent write conflicts**.

**Before launching**, main agent creates the directory:
```bash
mkdir -p /tmp/neokeeweb-agents/
```

**Each agent writes to**: `/tmp/neokeeweb-agents/{role}.log`
```
/tmp/neokeeweb-agents/
├── tl.log
├── sdet.log
├── swe-core.log
├── swe-db.log
└── swe-ext.log
```

**File format** (each agent's own file):
```
STATUS: IN_PROGRESS
[14:30] Starting TS migration Phase B
[14:35] Migrated 5 files
[14:40] ALERT: changed AppSettings interface, SWE-DB check imports
[15:01] All done, 12 files migrated
STATUS: DONE
```

**ALERT prefix** = cross-agent notification. TL reads all logs to coordinate.

**Main agent checks progress**: `head -1 /tmp/neokeeweb-agents/*.log`
**Cleanup after all done**: `rm -rf /tmp/neokeeweb-agents/`

## Workflow Rules

1. **Main agent never blocks** — all agents use `run_in_background: true`
2. **All agents write to the bus file** at start, milestones, blockers, and completion
3. **Closed-loop**: SDET finds bug → GitHub issue → SWE fixes → SDET verifies
4. **Commit directly to master**, push immediately
5. **All agents must run `bun test` before committing**
6. **Worktree agents** get merged to master by main agent after completion
7. **File GitHub issues** for anything non-trivial found during work
8. **Monitor usage** — pause at ~90% subscription, resume after reset

## Launching the Team

```
# TL: project health check
Agent(description="TL: milestone review", run_in_background=true)

# SDET: test everything
Agent(description="SDET: full test audit", run_in_background=true)

# 3 SWE agents in parallel worktrees
Agent(description="SWE-Core: [task]", isolation="worktree", run_in_background=true)
Agent(description="SWE-DB: [task]", isolation="worktree", run_in_background=true)
Agent(description="SWE-Ext: [task]", isolation="worktree", run_in_background=true)
```

## Phase 1 Goals (Current)

See: https://github.com/gynet/neokeeweb/milestone/1

- [x] Merge 3 repos into monorepo
- [x] Strip Electron/desktop code
- [x] Drop KDBX3, keep KDBX4 only
- [x] Strip OAuth providers (WebDAV + IndexedDB only)
- [x] Modernize build (Grunt → Bun + Webpack)
- [x] Remove dead desktop/plugin/YubiKey code (-1500 lines)
- [x] CI/CD with GitHub Actions
- [x] Playwright E2E framework
- [x] keepass-rs interop tests
- [x] Legacy deps cleaned (#6 — lodash + bourbon removed; baron + pikaday kept as feature-backing; jquery kept, view layer)
- [x] TypeScript migration for core (#2 — 58 → 0 @ts-nocheck files)
- [ ] E2E test scenarios (#4 — roundtrip + clipboard + import + NaCl + OTP done; UI-only scenarios remaining)

**Current test counts**: db 509 pass + 12 skip · core 284 pass · extension 128 pass · E2E specs in `e2e/core/`: app, clipboard, database-lifecycle, database-open, database-roundtrip, features, import, otp, smoke

## Phase 2 Goals (Planned)

See: https://github.com/gynet/neokeeweb/milestone/2

- Passkey support (store + WebAuthn PRF unlock) — Issue #9
- Cloud storage with user-provided OAuth (BYOK model)
- UX improvements
