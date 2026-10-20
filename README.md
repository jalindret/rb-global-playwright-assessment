# RB Global test automation

Read-only Playwright and TypeScript checks for the Ritchie Bros. locations directory, Edmonton yard and inventory search. Tests use the public live site; they do not create accounts, bid or submit the seller form.

## Setup

Use Node.js 24 (see `.nvmrc`) and npm. Clone the repository, then run:

```bash
git clone https://github.com/jalindret/rb-global-playwright-assessment.git
cd rb-global-playwright-assessment
npm ci
npx playwright install chromium
npm run verify
```

If using the source ZIP, extract it and run the installation and verification commands from the directory containing `package.json`.

Linux CI can use `npx playwright install --with-deps chromium`. No credentials or environment file are required. Internet access to the application, npm registry and Playwright browser download host is required.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run verify` | Run static checks and the complete test suite |
| `npm test` | Run live UI and API tests, preceded by static checks |
| `npm run test:ui` | Run UI tests headless, preceded by static checks |
| `npm run test:headed` | Run UI tests with visible browser windows, preceded by static checks |
| `npm run test:api` | Run API tests, preceded by static checks |
| `npm run test:contracts` | Run local response-contract and displayed-total checks |
| `npm run test:reporting` | Run local Hawkeye reporting checks |
| `npm run test:smoke` | Run the directory API and Edmonton navigation checks |
| `npm run test:list` | List tests without executing them |
| `npm run check` | Check dependency pins, types, lint, formatting and requirement mapping |
| `npm run format` | Apply Prettier formatting |
| `npm run report` | Open the latest Playwright HTML report |
| `npm run hawkeye` | Regenerate Hawkeye from existing execution evidence |

To run the Edmonton yard UI scenarios with a visible browser:

```bash
npx playwright test "tests/ui/yard.spec.ts" --project=ui --headed --workers=1
```

Direct Playwright commands do not run the static gate. Use `npm run verify` for complete validation before submission.

## Structure and design

| Path | Responsibility |
| --- | --- |
| `playwright.config.ts` | Test projects, browser configuration, timeouts and reporters |
| `tests/ui/` | Browser scenarios and business expectations |
| `tests/api/` | Directory, yard and search API scenarios |
| `tests/contracts/` | Local tests for response validation and displayed-total parsing |
| `tests/reporting/` | Local tests for Hawkeye evidence and report generation |
| `src/pages/` | Locators, browser actions and reusable UI assertions |
| `src/api/` | HTTP client, Zod response schemas and yard assertion helper |
| `src/fixtures.ts` | Isolated, test-scoped page objects and API client |
| `src/domain/` | Displayed inventory-total parser |
| `src/reporting/` | Hawkeye evidence collection, verdicts and HTML rendering |
| `scripts/` | Dependency-pin and requirement-mapping checks |
| `requirements.json` | Supplied acceptance criteria and requirement IDs |
| `.github/workflows/quality.yml` | GitHub Actions verification and artifact upload |

Specs express test intent; page objects own browser details. Fixtures create only the objects requested by each test.

The API client treats external JSON as `unknown` and validates it with Zod before returning schema-inferred types. Search pages and count-only responses have separate return types. A discriminated union distinguishes reported category quantities from absent quantities; an absent quantity is never treated as zero.

TypeScript uses strict compiler settings. Typed ESLint rejects explicit `any`, unsafe typed operations, unhandled promises and unused variables. Playwright lint rules reject fixed waits, forced actions, focused tests and skipped tests in the normal suite.

## Test scope

The suite contains 48 tests:

| Layer | Tests |
| --- | ---: |
| UI | 13 |
| API | 7 |
| Local contracts and displayed-total parser | 19 |
| Hawkeye reporting | 9 |
| Total | 48 |

The tests map to all 32 supplied acceptance criteria. Requirement tags connect scenarios to those criteria, and named steps provide more specific evidence where applicable.

Requirement mapping checks traceability. It does not establish execution success or application code coverage. The assignment omits criterion 1.8; its numbering is preserved.

## Assumptions and live data

- Thresholds, required city names and the Edmonton address come from the assignment.
- Changing inventory totals, event dates and equipment quantities are read at runtime.
- Directory and yard API data come from the pages’ `__NEXT_DATA__` JSON. Inventory uses `POST /api/search`.
- UI inventory totals come from displayed pagination text, not the number of lot cards.
- Equipment-category checks include off-screen carousel cards present in the DOM.
- API event checks permit an empty schedule as specified. The UI event criterion independently requires at least one event.
- One worker limits traffic to the production site. Isolated contexts prevent tests from sharing browser state.
- Automatic retries are disabled so failures remain visible.
- A shared component handles the observed region and cookie notices. Human-verification challenges are not bypassed.

## Reports and failure investigation

Playwright HTML reports are generated in `playwright-report/`. JSON results, failure screenshots and retained failure traces are written to `test-results/`.

Open the latest Playwright report:

```bash
npm run report
```

Open a retained trace using the path printed in the test output:

```bash
npx playwright show-trace "path/to/trace.zip"
```

Hawkeye runs automatically alongside the Playwright reporters. Each execution writes its HTML report, evidence JSON and template assertion under `reports/hawkeye/<run-id>/`. The file `reports/hawkeye/latest.json` identifies the latest generated run.

Keep the complete Hawkeye run directory together so relative evidence links work. `npm run hawkeye` regenerates the report from recorded evidence; it does not rerun tests or create new execution results. Execution evidence must exist before using that command.

Inspect the error, screenshot and trace before changing a selector or expectation. Distinguish access restrictions, environment problems, changed application behavior and confirmed product defects. Do not hide failures by lowering thresholds or adding unconditional skips.

Generated reports and diagnostic artifacts are excluded from the source repository. Browser traces can contain detailed network and browser data; review them before sharing publicly.

See [HAWKEYE.md](HAWKEYE.md) for report provenance and verdict rules, [ENGINEERING.md](ENGINEERING.md) for maintenance guidance, and [VALIDATION.md](VALIDATION.md) for the validation record.

## GitHub Actions

The workflow runs `npm run verify` on pushes to `main`, pull requests and manual dispatch. It installs dependencies and Chromium, performs the quality checks, executes the tests and uploads Playwright and Hawkeye artifacts, including when tests fail.

The first hosted run completed with:

| Check | Result |
| --- | --- |
| Dependency pins, TypeScript, ESLint and Prettier | Passed |
| Mapping of all 32 acceptance criteria | Passed |
| Local contract and reporting tests | 28 passed |
| API tests | 7 passed |
| UI tests | 13 failed |
| Hawkeye generation and template assertion | Passed |
| Report artifact upload | Completed |

The overall workflow correctly reported failure because the UI tests failed. Artifacts are retained for seven days.

Nightly scheduling is not yet configured.

## Current live-site limitation

The latest reviewed Windows and GitHub Actions runs each completed with 35 passing tests and 13 UI failures. All thirteen failed UI traces in each run show HTTP 403 Access Denied responses on the directory, search or yard pages before feature validation could complete.

These are access-blocked executions, not thirteen confirmed feature defects. The evidence does not establish the precise blocking rule.

An isolated headed directory test passed locally, but a reliable full-suite workaround has not been established. Tests, selectors, acceptance thresholds and retry settings remain unchanged.

For a visible-browser UI run:

```bash
npm run test:headed
```

Normal HTTPS verification is enabled. `CHROMIUM_EXECUTABLE_PATH` optionally selects an existing Chromium installation; normally leave it unset.

## Dependencies and Git hooks

Direct dependency versions are pinned, and `package-lock.json` is committed. Use `npm ci` for reproducible installation.

In a Git checkout, `npm ci` installs Husky hooks through the `prepare` script:

- Pre-commit checks and formats staged files, then runs type checking.
- Commit-message validation enforces Conventional Commits.
- Pre-push runs the static gate.

For an extracted source ZIP, initialize Git and enable the hooks after installing dependencies:

```bash
git init
npm run prepare
```

Example commit message:

```text
test: validate search page-size boundary
```

Local hooks are bypassable; the GitHub Actions workflow provides an independent verification run. Branch protection and required status checks must be configured separately.
