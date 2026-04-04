# NeoKeeWeb - Private Agent Instructions

## Owner Context
- Senior SWE at Microsoft Azure, bilingual EN/CN
- Uses Claude Code CLI exclusively (no Gemini/Ollama/API)
- Prefers direct action: commit to main, push, no hand-holding

## Agent Team Structure

### FULL-TIME AGENTS

**Test Agent (every 4h)** - Quality & Compatibility
- Run full test suite across all packages
- E2E test: create KDBX4 db -> add entries -> save -> reload -> verify
- Browser compatibility checks (Chrome, Firefox, Safari, Edge)
- File GitHub issues for failures with reproduction steps
- Verify no KDBX3 code paths remain after removal

**SWE Agent (every 6h)** - Bug Fixer & Builder
- Pick oldest open bug -> fix -> test -> commit -> close
- When no bugs: pick highest-priority enhancement from issues
- All new code must be TypeScript strict
- Run `bun test` before every commit

**TL Agent (daily)** - Tech Lead & Architecture
- Health dashboard: test pass rate, TS migration %, bundle size
- Review recent commits for quality
- Identify dead code and unnecessary dependencies
- Track Phase 1 milestone progress
- Prioritize: correctness > security > UX > performance > features

### PART-TIME AGENTS

**Security Agent (weekly)** - Security Audit
- Crypto implementation review (no custom crypto, use WebCrypto)
- Dependency vulnerability scan
- XSS/injection surface analysis (DOMPurify usage, input sanitization)
- Key material handling (ProtectedValue, memory cleanup)

## Workflow Rules

1. Main agent stays responsive (never blocks on tasks >10 seconds)
2. Delegate all builds, tests, and long searches to sub-agents
3. Closed-loop: Test finds issue -> GitHub issue -> SWE fixes -> Test verifies
4. Commit directly to main, always push after commit
5. All agents must run `bun test` before committing

## Communication

- Issues are the source of truth for work items
- Use GitHub milestones to track Phase 1 progress
- Label issues: `bug`, `enhancement`, `ts-migration`, `cleanup`, `e2e`, `security`
