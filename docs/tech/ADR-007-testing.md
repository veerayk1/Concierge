# ADR-007: Testing Strategy & Toolchain

## Status: Accepted
## Date: 2026-03-15
## Decision Makers: Architecture Team

## Context

The Concierge RULEBOOK mandates zero tolerance for production issues and defines strict quality gates:

- **95% minimum line coverage**, 92% minimum branch coverage, 100% coverage on new code (Rule 14).
- **Mutation testing score of 80%+** to verify tests actually catch regressions, not just execute code paths (Rule 14).
- **WCAG 2.2 AA accessibility compliance** with zero violations as a PR blocker (Rule 13).
- **Cross-browser E2E testing** across all 12 user personas (Rule 14).
- **SAST on every PR**, DAST on every release (Rule 20).
- **Integration tests** for every API endpoint, database query, and third-party service interaction (Rule 15).

Concierge is a multi-tenant, role-aware platform where a bug in tenant isolation or permission checking could expose one property's data to another — a catastrophic failure for a condo management system handling resident personal information under PIPEDA. The testing strategy must catch logic errors, visual regressions, accessibility violations, and security flaws before they reach production.

Additionally, we maintain a design system with specific visual specifications (white backgrounds, exact spacing tokens, spring-physics animations). Visual regression testing is needed to prevent unintended style drift across 20+ Radix-based components.

## Decision

We adopt the following testing toolchain:

| Layer | Tool | Purpose |
|-------|------|---------|
| **Unit & Integration** | Vitest 3.x | Fast TypeScript-native test runner for logic, API routes, utilities, hooks |
| **E2E** | Playwright (latest) | Cross-browser end-to-end testing with network interception and parallel execution |
| **Component Development** | Storybook 8.x | Isolated component development, documentation, and interaction testing |
| **Visual Regression** | Chromatic (Storybook addon) | Automated screenshot comparison to catch unintended visual changes |
| **Accessibility** | axe-core (via @axe-core/playwright + Storybook a11y addon) | Automated WCAG 2.2 AA violation detection |
| **Load Testing** | k6 | Performance testing under concurrent load |

## Rationale

### Vitest 3.x over Jest

Vitest is 10-20x faster than Jest for our stack because it runs on Vite's native ESM transform pipeline. Key advantages:

- **Native ESM**: No CommonJS interop layer. Our entire codebase is ESM (TypeScript 5.6+ with `verbatimModuleSyntax`), and Jest's ESM support still requires experimental flags and `--experimental-vm-modules`.
- **TypeScript-native**: Vitest transforms TypeScript via Vite's esbuild integration — no `ts-jest` configuration, no separate TypeScript compilation step.
- **Vite-powered HMR**: In watch mode, only re-runs tests affected by changed files, using the same dependency graph Vite uses for the dev server.
- **Jest-compatible API**: `describe`, `it`, `expect`, `vi.fn()`, `vi.mock()` — migration from Jest (if ever needed) requires minimal changes.
- **Built-in coverage**: Uses V8 coverage provider directly, no `istanbul` instrumentation overhead.
- **In-source testing**: Supports `if (import.meta.vitest)` blocks for co-locating tests with implementation during development.

We configure Vitest with the following coverage thresholds (enforced in CI):

```typescript
// vitest.config.ts coverage settings
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 95,
    branches: 92,
    functions: 90,
    statements: 95,
  },
  exclude: ['**/*.stories.tsx', '**/*.test.ts', '**/types/**'],
}
```

### Playwright over Cypress

Playwright is the superior choice for our cross-browser, multi-role E2E testing requirements:

- **Cross-browser**: Tests run on Chromium, Firefox, and WebKit (Safari). Cypress only supports Chromium and Firefox — WebKit is experimental. Our RULEBOOK requires cross-browser testing including Safari, which is critical because many condo board members use macOS.
- **Better TypeScript support**: First-class TypeScript types, auto-completion, and type-safe selectors out of the box.
- **Network interception**: `page.route()` enables precise API mocking for isolated E2E tests. We can simulate specific multi-tenant scenarios (e.g., staff member attempts cross-property access) without backend state setup.
- **Parallel execution**: Playwright runs test files in parallel by default across worker processes. Our 12-persona E2E suite would take 3-4x longer in Cypress's sequential runner.
- **Multiple browser contexts**: A single test can open multiple authenticated sessions (e.g., admin and resident simultaneously) to verify real-time features (Socket.io event propagation, notification delivery).
- **axe-core integration**: `@axe-core/playwright` runs accessibility audits within E2E flows, catching violations in real user journeys — not just isolated components.
- **Trace viewer**: Built-in trace recording with screenshots, DOM snapshots, and network logs at each step — invaluable for debugging flaky tests.

### Storybook 8.x for Component Development and Testing

Storybook serves three purposes:

1. **Isolated development**: Each Radix + Tailwind component is developed in isolation with props documented via `argTypes`. Developers see every state (default, hover, focus, disabled, error, loading, empty) without navigating through the full application.
2. **Interaction testing**: Storybook's `play` functions execute user interactions (click, type, keyboard navigation) and assert outcomes — effectively unit tests for UI behavior.
3. **Accessibility addon**: The `@storybook/addon-a11y` runs axe-core on every story, surfacing WCAG violations during development before code reaches CI.

### Chromatic for Visual Regression

Chromatic captures screenshots of every Storybook story on every PR and diffs them against the baseline. This catches:

- Unintended spacing/padding changes from Tailwind utility modifications.
- Color token drift (e.g., someone changes `--color-primary-600` and it affects 40 components).
- Font rendering differences after dependency upgrades.
- Layout shifts from Radix component version updates.

Without visual regression testing, maintaining visual consistency across 20+ Radix components styled with Tailwind utilities would rely entirely on manual review — not sustainable with a 2,243-line design system.

### axe-core for Accessibility

axe-core runs at two levels:

1. **Storybook addon**: Catches violations during component development (fast feedback loop).
2. **Playwright integration**: Catches violations in real user flows (full page context, dynamic content, focus management).

This dual-layer approach ensures WCAG 2.2 AA compliance is verified both in isolation and in context. CI blocks any PR with accessibility violations (zero-tolerance policy per RULEBOOK Rule 13).

### k6 for Load Testing

k6 validates performance under concurrent load — critical for a multi-tenant platform where a single building may have 500+ units generating simultaneous API calls during peak hours (morning package deliveries, evening amenity bookings). k6 scripts model realistic traffic patterns per property size tier.

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **Jest** | 10-20x slower, ESM support still experimental, requires `ts-jest` config layer |
| **Cypress** | No WebKit/Safari support, sequential execution, weaker TypeScript types, no multi-context |
| **Testing Library only (no E2E)** | Insufficient — RULEBOOK requires cross-browser E2E for all 12 personas |
| **No visual regression** | Unacceptable risk of visual drift across 20+ styled components and a 2,243-line design system |
| **Percy (visual regression)** | More expensive than Chromatic, less integrated with Storybook workflow |
| **Selenium** | Slower, heavier, less developer-friendly API compared to Playwright |

## Consequences

### Positive
- 95%+ test coverage enforced automatically — regressions caught before merge.
- Mutation testing (80%+ score) ensures tests are meaningful, not just line-hitting boilerplate.
- Cross-browser E2E on Chromium, Firefox, and WebKit covers the actual browsers our users run.
- Visual regression prevents design system drift without manual screenshot reviews.
- Accessibility testing at two layers (component and page) ensures WCAG 2.2 AA compliance throughout.
- Parallel Playwright execution keeps CI fast even as the E2E suite grows with 12 persona test matrices.

### Negative
- Four testing tools (Vitest, Playwright, Storybook, Chromatic) require team familiarity with multiple APIs and configurations.
- Chromatic adds a recurring cost (usage-based pricing per snapshot). Mitigated by only running on PR branches, not every push.
- Writing Storybook stories for every component adds development overhead (~15-20% more time per component). Justified by the quality gate requirements and the reusable component documentation it produces.
- Playwright E2E tests are inherently slower than unit tests; the 12-persona matrix could grow to 200+ E2E scenarios. Mitigated by parallel execution and selective test suites per module.

### Risks
- Flaky E2E tests can erode team confidence in the test suite. Mitigation: enforce Playwright best practices (use `data-testid` attributes, avoid timing-based assertions, use `waitFor` patterns), and quarantine flaky tests with a maximum 48-hour fix SLA.
- Chromatic baseline management requires discipline — approved visual changes must be intentional, not rubber-stamped. Mitigation: visual regression reviews are part of the PR review checklist.
- Storybook version upgrades can break addons. Mitigation: pin Storybook and addon versions, upgrade on a scheduled cadence (quarterly).

## Related ADRs
- [ADR-006-styling.md](ADR-006-styling.md) — Radix + Tailwind components are the primary subjects of Storybook stories and Chromatic visual regression
- [ADR-001-framework.md](ADR-001-framework.md) — Next.js 15 App Router testing patterns (RSC testing, API route testing)
- [ADR-008-hosting.md](ADR-008-hosting.md) — CI/CD pipeline integrates all testing tools in the PR and deployment flow
