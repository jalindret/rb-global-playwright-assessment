# RB Global test automation

Read-only Playwright and TypeScript checks for the Ritchie Bros. locations directory, Edmonton yard and inventory search. Tests use the public live site; they do not create accounts, bid or submit the seller form.

## Setup

Use Node.js 24 (see `.nvmrc`) and npm. Clone this repository or extract the source ZIP, open a terminal in the directory containing `package.json`, then run:

```bash
npm ci
npx playwright install chromium
npm run verify
```

Linux CI can use `npx playwright install --with-deps chromium`. No credentials or environment file are required. Internet access to the application and browser download host is required.

## Commands

| Command                                | Purpose                                                                |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `npm run verify`                       | Type checking, linting, formatting, requirement mapping and every test |
| `npm test`                             | Live UI and API tests, preceded by static checks                       |
| `npm run test:ui` / `npm run test:api` | Run one live layer                                                     |
| `npm run test:headed`                  | Run UI tests with visible browser windows                              |
| `npm run test:contracts`               | Local payload and displayed-total checks                               |
| `npm run test:reporting`               | Local Hawkeye checks                                                   |
| `npm run test:smoke`                   | Directory API and Edmonton navigation                                  |
| `npm run check`                        | Static checks without calling the live site                            |
| `npm run report`                       | Open Playwright HTML results                                           |
| `npm run hawkeye`                      | Regenerate Hawkeye from recorded evidence                              |

For one scenario: `npx playwright test tests/ui/yard.spec.ts --project=ui --workers=1`. Direct Playwright commands do not run the static gate.

## Structure and design

| Path                                 | Responsibility                                       |
| ------------------------------------ | ---------------------------------------------------- |
| `tests/ui/`                          | Short user scenarios and business expectations       |
| `tests/api/`                         | Directory, yard and search API scenarios             |
| `tests/contracts/`                   | Local tests for parsing and invalid response data    |
| `src/pages/`                         | Locators, browser actions and reusable UI assertions |
| `src/api/`                           | HTTP client and Zod response schemas                 |
| `src/fixtures.ts`                    | Isolated, test-scoped page objects and API client    |
| `src/domain/`                        | Displayed inventory-total parser                     |
| `src/reporting/`, `tests/reporting/` | Self-contained Hawkeye integration and checks        |
| `requirements.json`                  | Supplied criteria and their test tags                |

Specs express intent; page objects own browser details. The API client validates external JSON as `unknown` before returning schema-inferred types. Separate methods model search pages and count-only responses. A discriminated union represents reported versus absent category quantities; an absent quantity is never treated as zero. There is no base-page hierarchy, service container or global mutable test state.

## Assumptions

- Thresholds, required city names and the Edmonton address come from the assignment. Changing inventory totals, dates and quantities are read at runtime.
- Directory and yard API data come from the pages' `__NEXT_DATA__` JSON. Inventory uses `POST /api/search`.
- Search totals come from displayed pagination text, not lot-card counts. All carousel category cards are checked, including off-screen cards.
- API event checks permit an empty schedule as specified; the UI event criterion independently requires at least one event.
- One worker, isolated contexts and no retries keep failures visible and limit live-site traffic. Specific region/cookie notices are handled by a shared component.
- The assignment omits 1.8; its numbering is preserved. Requirement mapping is traceability, not application code coverage.

## Reports and maintenance

Playwright HTML is in `playwright-report/`; failure traces/screenshots are in `test-results/`. Hawkeye HTML and evidence JSON are in `reports/hawkeye/<run-id>/`; `latest.json` identifies the latest run. Keep the run directory together so evidence links work. See [HAWKEYE.md](HAWKEYE.md) for provenance and verdict rules.

Open a failure trace with `npx playwright show-trace path/to/trace.zip`. Inspect the error and evidence before changing a selector or expectation. Do not hide failures with sleeps, skips or retries. See [ENGINEERING.md](ENGINEERING.md) for quality practices and extension guidance; [VALIDATION.md](VALIDATION.md) records actual validation and limitations.

Dependencies are pinned and installed with `npm ci`. ESLint rejects explicit `any` and unsafe typed operations; TypeScript is strict. The ZIP excludes dependencies, caches and Git history. To enable the included Husky hooks after extraction, run `git init` followed by `npm run prepare`. Hooks check staged files, types, Conventional Commits and the pre-push static gate. Example: `test: validate search page-size boundary`.

The included GitHub Actions workflow runs `verify` and uploads results when the project is hosted. Hosted execution and nightly scheduling have not yet been validated. Normal HTTPS verification is enabled. `CHROMIUM_EXECUTABLE_PATH` optionally selects an existing Chromium; normally leave it unset.

## Current live-site limitation

The latest reviewed Windows runs completed with 35 passing checks and 13 UI failures. The traces show HTTP 403 Access Denied on the directory, search and yard pages before UI acceptance assertions could run. These are access-blocked executions, not 13 confirmed feature defects. An isolated headed directory test passed, but a reliable full-suite workaround has not been established. Tests and acceptance thresholds remain unchanged.

For a visible-browser UI run, use `npm run test:headed`. The source package excludes generated reports, screenshots, traces and historical execution JSON. New reports are created locally when tests run. See [VALIDATION.md](VALIDATION.md) for the execution record.
