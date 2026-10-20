# Hawkeye in this framework

Hawkeye generates an assessment report from Playwright execution results. Its shared renderer uses an existing reference stylesheet with a locked SHA-256 fingerprint. The report has thirteen sections, seven summary tiles, requirement rows and links to recorded test evidence. Reference HTML and stylesheet fingerprints are retained in `src/reporting/templates/provenance.json`; the reference report itself is not included.

## Generated artifacts

Each executed run creates a separate directory under `reports/hawkeye/`:

| File                      | Meaning                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `hawkeye-report.html`     | Self-contained report; open directly in a browser                    |
| `qe-evidence.json`        | Authoritative, sanitized test evidence and supplied requirement text |
| `template-assertion.json` | Locked-CSS, component, section and row-count checks                  |
| `evidence/`               | Retained trace, screenshot or failure-context files when present     |

The latest pointer is updated only after report generation and validation succeed. Collection-only commands do not replace the latest report with an empty run. Historical runs are not used to fill missing evidence in a later run. Relative evidence links remain portable when the complete run directory is copied.

## Verdict rules

- A passing mapped scenario provides passing evidence for its associated criteria.
- A named requirement step can isolate a passing or failing criterion.
- If a grouped scenario fails without an individual requirement step, its associated criteria are BLOCKED pending investigation, rather than all being falsely labelled FAIL.
- Unselected, skipped or unexecuted requirements remain BLOCKED.
- A failed check makes the overall run FAIL. A fully passing focused run can still leave the assignment BLOCKED when some criteria were not executed.
- A retry-recovered check is retained as requiring review; it does not silently establish a clean PASS.
- Test failures are not automatically classified as confirmed product defects.

The Developer Test Evidence section explicitly states that Ritchie Bros. developer tests were not supplied. It separately lists local framework/parser/reporting checks. Independent QE Evidence lists the automated external UI/API checks and does not claim a separate human reviewer.

## Commands

```bash
npm run verify
npm run test:reporting
npm run hawkeye
```

The final command compiles the reporting modules and regenerates the latest HTML from the existing evidence JSON. It does not visit the website or manufacture fresh test results.

## Integrity and evidence handling

All dynamic report text is HTML-escaped. Attachment links are restricted to generated local evidence paths. Only known trace, screenshot and sanitized failure-context attachments are copied. The summary omits raw headers and response bodies. Playwright trace files can contain detailed browser/network data; review diagnostic artifacts before sharing them publicly. Failed generation returns a failed runner status.

`template-assertion.json` validates the exact locked stylesheet, thirteen section headings, seven tiles, component presence and requirement-row count. It does not claim automatic visual approval. Generated reports are excluded from the source package. Visually review a generated report if its presentation changes.

Nine reporting tests cover structure, missing evidence, grouped-failure semantics, named requirement failures, HTML injection, CSS drift, sanitization, unsafe links/empty inventories, and a real nested Playwright adapter run. That controlled adapter fixture deliberately creates a pass, failure and skip to test reporting; those are not Ritchie Bros. defects or skipped assessment tests.
