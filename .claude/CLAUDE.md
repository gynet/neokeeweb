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
**Responsibilities**:
- GitHub milestone health check (`gh issue list --milestone`)
- Fix CI/CD failures (`gh run view --log-failed`)
- Close completed issues with summary comments
- Update CLAUDE.md and README.md
- Code quality review of recent commits
- Priority: correctness > security > UX > performance > features

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

## Workflow Rules

1. **Main agent never blocks** — all agents use `run_in_background: true`
2. **Closed-loop**: SDET finds bug → GitHub issue → SWE fixes → SDET verifies
3. **Commit directly to master**, push immediately
4. **All agents must run `bun test` before committing**
5. **Worktree agents** get merged to master by main agent after completion
6. **File GitHub issues** for anything non-trivial found during work
7. **Monitor usage** — pause at ~90% subscription, resume after reset

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
- [x] Remove dead code and legacy deps
- [x] CI/CD with GitHub Actions
- [x] Playwright E2E framework
- [x] keepass-rs interop tests
- [ ] TypeScript migration (core)
- [ ] E2E test scenarios

## Phase 2 Goals (Planned)

- Passkey support (store + WebAuthn PRF unlock) — Issue #9
- Cloud storage with user-provided OAuth (BYOK model)
