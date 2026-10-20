# Validation and known limitations

## Latest reviewed live runs

Two supplied Windows execution bundles were reviewed: the 18 October run and the 19 October 2026 evening run (Vancouver time). Each recorded 48 tests: 35 passed, 13 failed, zero skipped and zero flaky results.

| Layer                                      | Passed | Failed |
| ------------------------------------------ | ------ | ------ |
| Local contracts and displayed-total parser | 19     | 0      |
| Hawkeye reporting                          | 9      | 0      |
| Live API                                   | 7      | 0      |
| Live UI                                    | 0      | 13     |

All thirteen failed UI traces show HTTP 403 Access Denied on the initial directory, search or Edmonton yard request. The application controls were absent because an access-denied page was returned. The business assertions could not complete; these results do not establish thirteen application feature defects.

Manual browsing and one isolated headed directory test succeeded. That result has not established a reliable workaround for the full suite. The underlying tests, selectors, acceptance thresholds and retry settings have been preserved.

## Earlier execution

A full run on 17 October recorded 48 passing tests and 32 passing requirement verdicts in a different environment. UI validation there used Chromium 153 with Playwright 1.61.1 and temporary trust for the execution proxy's specific certificate. Those temporary settings are not shipped. The normal configuration verifies HTTPS certificates and defaults to Playwright-managed Chromium. The earlier success is historical, not a claim that the latest Windows runs passed.

## Submission preparation

The source-only package excludes dependencies, Git history, generated reports, screenshots, traces, raw diagnostic JSON, temporary configurations and nested ZIPs. Runtime TypeScript and test files are preserved byte-for-byte from the supplied working project. Reporting provenance wording and documentation were prepared for this public submission; the locked stylesheet is unchanged.

Submission preparation completed a clean `npm ci`, all static checks (types, lint, formatting, dependency pins and requirement mapping), and all 28 local contract/reporting tests successfully. Live tests are not rerun as part of source cleanup. Run `npm run verify` to produce a new complete execution record; report any access blocks honestly.

## CI and report handling

The included GitHub Actions workflow runs the full verification and uploads runtime artifacts, including on test failure. Hosted execution and nightly scheduling have not yet been validated. Website access restrictions may also affect hosted runners.

Reports are generated on demand. `npm run hawkeye` rebuilds a report only after execution evidence exists. Requirement mapping checks associations with all 32 supplied criteria; it is not execution proof or application code coverage. Review browser traces before sharing them publicly because they can include network and browser data.
