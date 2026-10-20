import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  evidenceSchema,
  overallVerdict,
  requirementResults,
  type Evidence,
  type TestEvidence,
  type Verdict,
} from "./model";
export const sectionTitles = [
  "Executive Summary",
  "Repository / Story Context",
  "Execution / Runtime Evidence",
  "Acceptance Criteria Validation",
  "Developer Test Evidence",
  "Independent QE Evidence",
  "Implementation Evidence",
  "QE Evidence / Artifact References",
  "Coverage Gap Analysis",
  "Technical Evidence",
  "Product Defect Summary",
  "Final / Overall Verdict",
  "Report Integrity",
] as const;
export function escapeHtml(value: string | number): string {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}
const provenanceSchema = z.object({
  cssSha256: z.string(),
  source: z.string(),
  verification: z.string(),
});
function template(root: string) {
  const css = readFileSync(
    join(root, "src/reporting/templates/hawkeye.css"),
    "utf8",
  );
  const parsed: unknown = JSON.parse(
    readFileSync(join(root, "src/reporting/templates/provenance.json"), "utf8"),
  );
  const provenance = provenanceSchema.parse(parsed);
  if (createHash("sha256").update(css).digest("hex") !== provenance.cssSha256)
    throw new Error("Locked Hawkeye CSS fingerprint mismatch");
  return { css, provenance };
}
function badge(verdict: Verdict) {
  return `<span class="badge badge-${verdict === "PASS" ? "pass" : verdict === "FAIL" ? "fail" : "partial"}">${verdict}</span>`;
}
function card(title: string, body: string) {
  return `<div class="card"><div class="card-header"><span class="card-title">${escapeHtml(title)}</span></div><div class="card-body">${body}</div></div>`;
}
function table(headers: string[], rows: string[][]) {
  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function testRows(tests: TestEvidence[]) {
  if (!tests.length)
    return '<p class="text-muted">No checks from this layer were selected.</p>';
  return table(
    ["Check", "Result", "Duration", "Evidence"],
    tests.map((test) => [
      `<a href="#test-${escapeHtml(test.id)}">${escapeHtml(test.title)}</a>`,
      badge(test.verdict),
      `${(test.durationMs / 1000).toFixed(2)} s`,
      test.attachments
        .map((a) => `<a href="${escapeHtml(a.href)}">${escapeHtml(a.name)}</a>`)
        .join(" · ") || "See recorded test details",
    ]),
  );
}
export function renderHawkeye(input: unknown, root: string): string {
  const evidence = evidenceSchema.parse(input);
  const rows = requirementResults(evidence);
  const verdict = overallVerdict(evidence);
  const { css, provenance } = template(root);
  const local = evidence.tests.filter(
    (test) => test.project !== "ui" && test.project !== "api",
  );
  const live = evidence.tests.filter(
    (test) => test.project === "ui" || test.project === "api",
  );
  const failing = evidence.tests.filter((test) => test.verdict === "FAIL");
  const counts = (value: Verdict) =>
    rows.filter((row) => row.verdict === value).length;
  const sections: string[] = [];
  sections.push(
    `<div class="tiles">${[
      ["Requirements", rows.length, "blue"],
      ["Passed", counts("PASS"), "green"],
      ["Failed", counts("FAIL"), "red"],
      ["Blocked", counts("BLOCKED"), "gray"],
      ["Local Checks", local.length, "blue"],
      ["Live Checks", live.length, "blue"],
      ["Failed Checks", failing.length, "red"],
    ]
      .map(
        ([label, value, color]) =>
          `<div class="tile"><div class="tile-label">${escapeHtml(String(label))}</div><div class="tile-value ${String(color)}">${escapeHtml(String(value))}</div></div>`,
      )
      .join(
        "",
      )}</div><p class="text-muted mt8">Assignment verdict: ${verdict}. Check counts are separate from requirement counts. No product-defect classification is inferred from a test failure.</p>`,
  );
  sections.push(
    card(
      "RB Global assessment",
      table(
        ["Item", "Recorded context"],
        [
          [
            "Application",
            "Ritchie Bros. public locations, Edmonton yard and inventory",
          ],
          ["Run", escapeHtml(evidence.runId)],
          [
            "Scope",
            "Read-only external UI/API validation; no accounts, bids or seller-form submissions",
          ],
          ["Environment", escapeHtml(evidence.environmentNote)],
          [
            "Source control",
            "No hosted CI or deployment verification is claimed by this report.",
          ],
        ],
      ),
    ),
  );
  sections.push(
    card(
      "Observed execution",
      table(
        ["Started", "Finished", "Runner status", "Checks"],
        [
          [
            escapeHtml(evidence.startedAt),
            escapeHtml(evidence.finishedAt),
            escapeHtml(evidence.runnerStatus),
            String(evidence.tests.length),
          ],
        ],
      ),
    ) +
      evidence.tests
        .map(
          (test) =>
            `<div class="card" id="test-${escapeHtml(test.id)}"><div class="card-header">${badge(test.verdict)}<span class="card-title">${escapeHtml(test.title)}</span></div><div class="card-body"><p>${escapeHtml(test.project)} · ${escapeHtml(test.file)}:${test.line} · Attempts: ${test.attempts}</p>${test.errors.map((error) => `<pre>${escapeHtml(error)}</pre>`).join("")}${
              test.steps.length
                ? table(
                    ["Named step", "Verdict"],
                    test.steps.map((step) => [
                      escapeHtml(step.title),
                      badge(step.verdict),
                    ]),
                  )
                : "<p>No individually named requirement steps recorded; use scenario assertions.</p>"
            }${test.attachments.map((a) => `<p><a href="${escapeHtml(a.href)}">${escapeHtml(a.name)}</a></p>`).join("")}</div></div>`,
        )
        .join(""),
  );
  sections.push(
    rows
      .map(
        (row) =>
          `<div class="req-row${row.verdict === "PASS" ? "" : row.verdict === "FAIL" ? " fail" : " blocked"}"><div class="req-row-header"><span class="req-id">${escapeHtml(row.id)}</span><span class="req-source">${escapeHtml(row.source)}</span>${badge(row.verdict).replace("<span ", '<span style="margin-left:auto;" ')}</div><div class="req-text">${escapeHtml(row.text)}</div><div class="card-body"><p>${escapeHtml(row.basis)}</p><p>${row.tests.map((test) => `<a href="#test-${escapeHtml(test.id)}">${escapeHtml(test.title)}</a>`).join(" · ") || "No completed mapped test evidence."}</p></div></div>`,
      )
      .join(""),
  );
  sections.push(
    card(
      "Evidence boundary",
      "<p>Ritchie Bros. application developer tests were not supplied or executed. The following are local framework/parser/reporting checks, not the vendor's backend test suite.</p>" +
        testRows(local),
    ),
  );
  sections.push(
    card(
      "External QE checks",
      "<p>These are automated checks of the live public application. No separate human or second-engineer review is claimed.</p>" +
        testRows(live),
    ),
  );
  sections.push(
    card(
      "Framework implementation",
      table(
        ["Module", "Purpose"],
        [
          ["src/pages/", "Scoped page objects and shared site notices"],
          ["src/api/", "HTTP access and validated payload models"],
          [
            "src/reporting/",
            "Shared evidence model, renderer, Playwright reporter and template checks",
          ],
          ["tests/", "Executable contract, API, UI and reporting checks"],
        ],
      ),
    ),
  );
  sections.push(
    card(
      "Local report artifacts",
      table(
        ["Artifact", "Purpose"],
        [
          [
            `<a href="qe-evidence.json">qe-evidence.json</a>`,
            "Authoritative sanitized evidence for this run",
          ],
          [
            `<a href="template-assertion.json">template-assertion.json</a>`,
            "CSS and component contract validation",
          ],
          [
            `<a href="hawkeye-report.html">hawkeye-report.html</a>`,
            "This report",
          ],
          [
            "evidence/",
            "Copied test attachments when present; linked from individual checks",
          ],
        ],
      ),
    ),
  );
  sections.push(
    card(
      "Coverage status",
      table(
        ["Requirement outcome", "Count"],
        [
          ["PASS", String(counts("PASS"))],
          ["FAIL", String(counts("FAIL"))],
          ["BLOCKED / no isolated proof", String(counts("BLOCKED"))],
        ],
      ),
    ) +
      card(
        "Scope limits",
        "<p>A focused run can pass its selected checks while leaving the assignment BLOCKED because other requirements were not executed. Grouped failures do not automatically fail every associated criterion. Missing developer/hosted CI evidence is not invented.</p>",
      ),
  );
  sections.push(
    card(
      "Data and execution model",
      "<p>Yards are read from Next.js page JSON; inventory uses POST /api/search. UI totals come from displayed text, and all rendered carousel cards include off-screen cards. Evidence is collected from this run's test results, not historical success counts. URL queries, raw request headers and response bodies are not collected by Hawkeye.</p>",
    ),
  );
  sections.push(
    card(
      "Failure review",
      failing.length
        ? `<p>${failing.length} failed check(s) require investigation. These are execution findings, not automatically confirmed product defects.</p>${testRows(failing)}`
        : "<p>No failed checks were recorded in this selected run. This does not establish absence of defects outside the tested scope.</p>",
    ),
  );
  sections.push(
    card(
      "Overall assessment",
      `${badge(verdict)}<p>${counts("PASS")} of ${rows.length} supplied criteria have passing proof in this run; ${counts("BLOCKED")} lack complete or isolated proof. Runner status: ${escapeHtml(evidence.runnerStatus)}.</p>`,
    ),
  );
  sections.push(
    card(
      "Template provenance",
      `<p>Styles preserved from ${escapeHtml(provenance.source)}.</p><p>${escapeHtml(provenance.verification)}</p><p>Report contract: 13 populated sections, seven summary tiles and the original header, verdict, requirement-row, card, table and footer components. See the separate template assertion artifact; a structural check does not claim automated visual approval.</p>`,
    ),
  );
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Hawkeye QE Report — RB Global</title><style>${css}</style></head><body><div class="header"><div class="header-eyebrow">Hawkeye QE Report</div><div class="header-title">RB Global — Test Automation Assessment</div><div class="header-subtitle">Acceptance Criteria and Execution Evidence</div><div class="header-meta"><span><strong>Run:</strong> ${escapeHtml(evidence.runId)}</span><span><strong>Checks:</strong> ${evidence.tests.length}</span><span><strong>Finished:</strong> ${escapeHtml(evidence.finishedAt)}</span></div></div><div class="verdict-banner ${verdict.toLowerCase()}"><span class="verdict-badge ${verdict.toLowerCase()}">${verdict}</span><span class="verdict-label ${verdict.toLowerCase()}">${counts("PASS")}/${rows.length} criteria with passing evidence</span></div><div class="content">${sections.map((body, index) => `<div class="section"><div class="section-title">${sectionTitles[index]}</div>${body}</div>`).join("")}</div><div class="footer"><strong>Hawkeye QE Report</strong> · RB Global · Generated from qe-evidence.json · ${escapeHtml(evidence.finishedAt)}</div></body></html>`;
}
export function assertTemplate(html: string, root: string, evidence: Evidence) {
  const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1];
  const original = template(root).css;
  if (css !== original)
    throw new Error("Hawkeye CSS differs from the locked source");
  const titles = [
    ...html.matchAll(/<div class="section-title">([^<]+)<\/div>/g),
  ].map((match) => match[1]);
  if (JSON.stringify(titles) !== JSON.stringify(sectionTitles))
    throw new Error("Hawkeye section contract differs");
  if ((html.match(/class="tile"/g) ?? []).length !== 7)
    throw new Error("Hawkeye must contain seven tiles");
  if (
    (html.match(/class="req-row(?: fail| blocked)?"/g) ?? []).length !==
    evidence.criteria.length
  )
    throw new Error("Requirement row count mismatch");
  for (const component of [
    "header",
    "header-meta",
    "verdict-banner",
    "verdict-badge",
    "content",
    "card",
    "card-header",
    "card-body",
    "footer",
  ])
    if (!html.includes(`class="${component}`))
      throw new Error(`Hawkeye component missing: ${component}`);
  if (/<script|Recommendations|<section\b/.test(html))
    throw new Error("Unexpected script or noncanonical report content");
  return {
    status: "PASS",
    cssSha256: createHash("sha256").update(original).digest("hex"),
    sections: 13,
    tiles: 7,
    requirementRows: evidence.criteria.length,
    visualReview: "Not asserted by this structural validator",
  };
}
