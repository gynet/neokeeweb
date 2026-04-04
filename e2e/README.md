# E2E Tests

End-to-end tests using [Playwright](https://playwright.dev/).

## Run

```bash
bun run test:e2e          # Run all E2E tests (headless)
bunx playwright test --ui # Interactive UI mode
```

## Add new tests

Create `*.spec.ts` files under `e2e/`. Group by package: `e2e/core/`, `e2e/extension/`, etc.

Tests use `baseURL: http://localhost:8085` -- the dev server starts automatically via the `webServer` config in `playwright.config.ts`.
