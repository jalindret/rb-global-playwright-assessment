# RB Global test automation

Read-only Playwright and TypeScript checks for the Ritchie Bros. locations directory, Edmonton yard and inventory search. Tests use the public live site; they do not create accounts, bid or submit the seller form.

## Setup

Use Node.js 24 (see `.nvmrc`) and npm. Clone this repository or extract the source ZIP, open a terminal in the directory containing `package.json`, then run:

```bash
npm ci
npx playwright install chromium
npm run verify
```

Linux CI can use `npx playwright install --with-deps chromium`. No credentials or environment file are required. Internet access to the application, npm registry and Playwright browser download host is required.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run verify` | Type checking, linting, formatting, requirement mapping and every test |
| `npm test` | Live UI and API tests, preceded by static checks |
| `npm run test:ui` / `npm run test:api` | Run one live layer |
| `npm run test:headed` | Run UI tests with visible browser windows |
| `npm run test:contracts` | Local payload and displayed-total checks |
| `npm run test:reporting` | Local Hawkeye checks |
| `npm run test:smoke` | Directory API and Edmonton navigation |
| `npm run check` | Static checks without calling the live site |
| `npm run report` | Open Playwright HTML results |
| `npm run hawkeye` | Regenerate Hawkeye from recorded evidence |

For one scenario:

```bash
npx playwright test "tests/ui/yard.spec.ts" --project=ui --workers=1
```

Direct Playwright commands do not run the static gate.

## Structure and design

| Path | Responsibility |
| --- | --- |
| `tests/ui/` | Short user scenarios and business expectations |
| `tests/api/` | Directory, yard and search API scenarios |
| `tests/contracts/` | Local tests for parsing and invalid response data |
| `src/pages/` | Locators, browser actions and reusable UI assertions |
| `src/api/` | HTTP client and Zod response schemas |
| `src/fixtures.ts` | Isolated, test-scoped page objects and API client |
| `src/domain/` | Displayed inventory-total parser |
| `src/reporting/`, `tests/reporting/` | Self-contained Hawkeye integration and checks |
| `requirements.json` | Supplied criteria and their test tags |

Specs express intent; page objects own browser details. The API client validates external JSON as `unknown` before returning schema-inferred types. Separate methods model search pages and count-only responses. A discriminated union represents reported versus absent category quantities; an absent quantity is never treated as zero.

Fixtures create the page objects and API client requested by each test. The framework uses direct composition without a base-page hierarchy, service container or global mutable test state.

## Assumptions

- Thresholds, required city names and the Edmonton address come from the assignment. Changing inventory totals, dates and quantities are read at runtime.
- Directory and yard API data come from the pages’ `__NEXT_DATA__` JSON. Inventory uses `POST /api/search`.
- Search totals come from displayed pagination text, not lot-card counts. All carousel category cards are checked, including off-screen cards.
- API event checks permit an empty schedule as specified; the UI event criterion independently requires at least one event.
- One worker, isolated contexts and no retries keep execution predictable and limit live-site traffic. Specific region and cookie notices are handled by a shared component.
- The assignment omits 1.8; its numbering is preserved. Requirement mapping is traceability, not application code coverage.

## Reports and maintenance

Playwright HTML is generated in `playwright-report/`; execution JSON, failure traces and screenshots are written to `test-results/`.

Hawkeye runs automatically alongside the Playwright reporters. Its HTML and evidence JSON are generated in `reports/hawkeye/<run-id>/`; `reports/hawkeye/latest.json` identifies the latest run. Keep the run directory together so evidence links work.

Open the latest Playwright report:

```bash
npm run report
```

Open a retained trace using its actual file path:

```bash
npx playwright show-trace "path/to/trace.zip"
```

Regenerate Hawkeye from existing execution evidence:

```bash
npm run hawkeye
```

This command rebuilds the report without rerunning tests. Execution evidence must already exist.

Inspect the error and evidence before changing a selector or expectation. See [HAWKEYE.md](HAWKEYE.md) for report provenance and verdict rules, [ENGINEERING.md](ENGINEERING.md) for maintenance guidance, and [VALIDATION.md](VALIDATION.md) for the execution record.

Generated reports, screenshots, traces and historical execution JSON are excluded from the source package. New reports are generated when tests run. Review diagnostic artifacts before sharing them publicly.

## Engineering quality

Dependencies are pinned and installed with `npm ci`. TypeScript uses strict compiler settings. Typed ESLint rejects explicit `any`, unsafe typed operations and unhandled promises. Prettier checks consistent formatting.

`npm run check` runs dependency-pin checks, type checking, linting, formatting checks and requirement mapping. `npm run verify` runs those checks followed by the complete test suite.

In a Git checkout, `npm ci` installs Husky hooks through the `prepare` script. To enable the hooks after extracting the source ZIP, install dependencies, then run:

```bash
git init
npm run prepare
```

Hooks check staged files, types, Conventional Commits and the pre-push static gate.

Example commit message:

```text
test: validate search page-size boundary
```

## GitHub Actions

The included workflow runs `npm run verify` on pushes to `main`, pull requests and manual dispatch. It installs dependencies and Chromium, runs the quality checks and tests, and uploads Playwright and Hawkeye artifacts, including when tests fail.

Nightly scheduling is not yet configured.

Normal HTTPS verification is enabled. `CHROMIUM_EXECUTABLE_PATH` optionally selects an existing Chromium installation; normally leave it unset.
