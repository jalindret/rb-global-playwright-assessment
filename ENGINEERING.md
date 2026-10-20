# Engineering practices

## Design and quality controls

| Practice                       | Implementation                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Strong TypeScript types        | Strict compiler options; no explicit `any` in our TypeScript; typed ESLint also checks unsafe assignments, calls and returns        |
| Validate external data         | Zod parses `unknown` at HTTP boundaries; output types are inferred from the same schemas                                            |
| Model meaningful states        | Category quantities distinguish reported values from absent values; count-only searches have a separate response type               |
| Purposeful abstractions        | Three page objects, one API client, one shared notice component and Playwright fixtures; no inheritance hierarchy or object factory |
| Separate intent from mechanics | Specs describe scenarios; page objects own selectors/actions; client owns HTTP/JSON parsing                                         |
| Small, readable specs          | API specs are split by endpoint; country scenarios are separate data-driven tests; reusable UI checks live in page objects          |
| Clean dependencies             | Exact direct versions, lockfile, `npm ci`, no extra assertion/HTTP/reporting libraries beyond the existing Zod and Playwright stack |
| Enforced quality               | Type checking, ESLint, Prettier and requirement mapping in `check`; `verify` adds all tests                                         |
| Source-control practices       | Husky, lint-staged and Conventional Commits; independent GitHub workflow included                                                   |
| Useful failure evidence        | Retained failure traces, screenshots, sanitized context and Hawkeye results                                                         |
| Concise documentation          | README for setup/design, this guide for changes, Hawkeye reference and execution record                                             |

The project is intentionally limited to the assignment. Test-data builders would add little value to these read-only flows: tests do not create complex entities. Frozen inventory snapshots, shared sessions and generalized retry frameworks would make this live-site assessment harder to trust.

## Extending the framework

1. Add a browser action or reusable UI assertion to the relevant page object. Prefer observed test IDs and accessible roles; keep structural selectors scoped and documented.
2. Add HTTP operations to `AuctionClient`, with runtime response validation in `schemas.ts`. Use `unknown` for untrusted input rather than casting it to a desired type.
3. Add a small scenario to the matching spec. Keep business expectations visible; do not extract one-use expressions into vague utility functions.
4. Retain the appropriate requirement tags. Change `requirements.json` only when the supplied acceptance criteria change.
5. Add local checks for meaningful parser/contract behavior, then run `npm run verify` before submission.

Assignment constants belong beside their expectations. Centralize data only when it is truly reused or configurable; do not move every literal into a constants file. Optional fields are appropriate when the real contract permits absence; use a union when absence changes valid operations.

## Failure investigation

Use the assertion error, named step, Playwright report and retained trace. Reproduce the affected scenario before editing. Distinguish changed markup, response contracts, live data, environment problems and confirmed product defects. Do not lower thresholds, silently skip checks or substitute mocks to make live acceptance tests pass. Human-verification blocks require an external resolution.

Hawkeye is isolated from test-domain code. Its renderer, evidence model and adapter remain because the requested report needs reproducible JSON evidence, template checks and truthful verdicts. It introduces no alternative test runner or custom test DSL. Focused runs do not borrow results from earlier runs.

## Scope limits

Hosted CI, branch protection and the standard Playwright-managed browser must be validated in the destination environment. This is an external functional assessment, not a claim of application unit coverage, accessibility certification, security auditing or load testing. Extra negative cases do not redefine the supplied acceptance criteria.
