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
**Domain expertise**: Password manager architecture, KDBX format, TOTP/HOTP, WebAuthn, browser extension protocols, key derivation (Argon2/AES-KDF), WebCrypto API.
**Responsibilities**:
- GitHub milestone health check
- **Keep CLAUDE.md in sync** every milestone review — branch name, deps status, test counts, E2E spec list, phase checklist ↔ closed GitHub issues. Stale docs defeat the whole point.
- Fix CI/CD failures
- Code quality review — understand WHAT code does before touching it
- Priority: correctness > security > UX > performance > features
**NEVER delete**:
- OTP/TOTP/HOTP (core 2FA feature)
- Autofill logic
- Key derivation / crypto
- KDBX format handling
- Browser extension protocol
**OK to delete**: Electron IPC, native modules, desktop file system, hardware key drivers

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
