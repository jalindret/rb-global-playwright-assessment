import { tmpdir } from "node:os";
import { test, expect } from "@playwright/test";
import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import {
  evidenceSchema,
  overallVerdict,
  requirementResults,
  sanitize,
  type Evidence,
  type TestEvidence,
} from "../../src/reporting/model";
import { renderHawkeye, assertTemplate } from "../../src/reporting/renderer";
const root = process.cwd();
function check(overrides: Partial<TestEvidence> = {}): TestEvidence {
  return {
    id: "test1",
    title: "Example check",
    project: "ui",
    file: "tests/ui/example.spec.ts",
    line: 1,
    verdict: "PASS",
    durationMs: 1,
    attempts: 1,
    requirementIds: ["S1.1"],
    errors: [],
    steps: [],
    attachments: [],
    ...overrides,
  };
}
function record(tests: TestEvidence[] = [check()]): Evidence {
  return {
    schemaVersion: 1,
    runId: "fixture-run",
    startedAt: "2026-10-15T00:00:00.000Z",
    finishedAt: "2026-10-15T00:00:01.000Z",
    runnerStatus: "passed",
    tests,
    criteria: [
      {
        id: "S1.1",
        text: "Example requirement",
        source: "Controlled reporting fixture",
      },
    ],
    environmentNote: "Controlled fixture; not a website execution",
  };
}

test("Hawkeye preserves locked CSS, thirteen sections and seven summary tiles", () => {
  const evidence = record();
  const html = renderHawkeye(evidence, root);
  expect(assertTemplate(html, root, evidence)).toMatchObject({
    status: "PASS",
    sections: 13,
    tiles: 7,
    requirementRows: 1,
  });
});

test("Missing selected requirement stays BLOCKED rather than inheriting a historical pass", () => {
  expect(overallVerdict(record([]))).toBe("BLOCKED");
  expect(requirementResults(record([]))[0]).toHaveProperty(
    "verdict",
    "BLOCKED",
  );
});

test("Grouped scenario failure does not falsely fail every associated criterion", () => {
  const evidence = record([
    check({ verdict: "FAIL", errors: ["Controlled fixture failure"] }),
  ]);
  expect(requirementResults(evidence)[0]).toHaveProperty("verdict", "BLOCKED");
  expect(overallVerdict(evidence)).toBe("FAIL");
});

test("Named requirement steps isolate passing and failing proof", () => {
  const evidence = record([
    check({
      verdict: "FAIL",
      steps: [
        { title: "S1.1 Example assertion", verdict: "FAIL", durationMs: 2 },
      ],
    }),
  ]);
  expect(requirementResults(evidence)[0]).toHaveProperty("verdict", "FAIL");
});

test("HTML escapes untrusted titles and does not execute embedded markup", () => {
  const html = renderHawkeye(
    record([check({ title: "<script>alert(1)</script>" })]),
    root,
  );
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
});

test("Template validation rejects CSS drift", () => {
  const evidence = record();
  const html = renderHawkeye(evidence, root).replace(
    "background: #f4f5f7",
    "background: #000000",
  );
  expect(() => assertTemplate(html, root, evidence)).toThrow(/CSS/);
});

test("Evidence sanitization removes URL queries and secret-shaped values", () => {
  expect(
    sanitize("https://example.test/search?token=private password=private"),
  ).toBe("https://example.test/search password=[redacted]");
});

test("Playwright adapter records real passed, failed and skipped fixture results", async ({}, testInfo) => {
  const fixture = mkdtempSync(join(tmpdir(), "rb-hawkeye-fixture-"));
  mkdirSync(join(fixture, "src/reporting/templates"), { recursive: true });
  for (const name of ["hawkeye.css", "provenance.json"])
    copyFileSync(
      join(root, "src/reporting/templates", name),
      join(fixture, "src/reporting/templates", name),
    );
  writeFileSync(
    join(fixture, "requirements.json"),
    JSON.stringify({
      criteria: [1, 2, 3].map((n) => ({
        id: `S1.${n}`,
        text: `Controlled requirement ${n}`,
        source: "Reporter fixture",
      })),
    }),
  );
  writeFileSync(
    join(fixture, "playwright.config.cjs"),
    `module.exports={testDir:'.',testMatch:'fixture.spec.cjs',workers:1,retries:0,outputDir:${JSON.stringify(join(fixture, "artifacts"))},reporter:[[${JSON.stringify(join(root, "src/reporting/reporter.ts"))}]],projects:[{name:'fixture'}]};`,
  );
  writeFileSync(
    join(fixture, "fixture.spec.cjs"),
    `const {test,expect}=require(${JSON.stringify(join(root, "node_modules/@playwright/test"))});
  test('pass fixture',{tag:'@S1.1'},()=>expect(1).toBe(1));
  test('fail fixture',{tag:'@S1.2'},()=>expect(1).toBe(2));
  test.skip('skip fixture',{tag:'@S1.3'},()=>{});`,
  );
  const childEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !/^(?:PW_|PLAYWRIGHT_|TEST_WORKER_INDEX$|TEST_PARALLEL_INDEX$)/.test(
          key,
        ),
    ),
  );
  const child = spawnSync(
    process.execPath,
    [
      join(root, "node_modules/playwright/cli.js"),
      "test",
      "--config",
      join(fixture, "playwright.config.cjs"),
    ],
    { cwd: fixture, encoding: "utf8", timeout: 25000, env: childEnvironment },
  );
  expect(child.status, child.stderr + child.stdout).toBe(1);
  expect(child.stdout + child.stderr).toContain("Hawkeye report:");
  const latest: unknown = JSON.parse(
    readFileSync(join(fixture, "reports/hawkeye/latest.json"), "utf8"),
  );
  expect(latest).toHaveProperty("runId");
  const directory = readdirSync(join(fixture, "reports/hawkeye"), {
    withFileTypes: true,
  }).find((entry) => entry.isDirectory());
  expect(directory).toBeDefined();
  const evidenceFile = join(
    fixture,
    "reports/hawkeye",
    directory?.name ?? "missing",
    "qe-evidence.json",
  );
  const parsed: unknown = JSON.parse(readFileSync(evidenceFile, "utf8"));
  const evidence = evidenceSchema.parse(parsed);
  expect(evidence.tests.map((result) => result.verdict).sort()).toEqual([
    "BLOCKED",
    "FAIL",
    "PASS",
  ]);
  expect(overallVerdict(evidence)).toBe("FAIL");
  expect(
    readFileSync(join(dirname(evidenceFile), "hawkeye-report.html"), "utf8"),
  ).toContain("Product Defect Summary");
  rmSync(fixture, { recursive: true, force: true });
  await testInfo.attach("controlled-reporter-result", {
    body: JSON.stringify({
      passed: 1,
      failed: 1,
      skipped: 1,
      scope: "Controlled fixture only; not application failures",
    }),
    contentType: "application/json",
  });
});

test("Evidence rejects unsafe attachment links and empty requirement inventories", () => {
  expect(evidenceSchema.safeParse({ ...record(), criteria: [] }).success).toBe(
    false,
  );
  expect(
    evidenceSchema.safeParse(
      record([
        check({
          attachments: [{ name: "trace", href: "javascript:alert(1)" }],
        }),
      ]),
    ).success,
  ).toBe(false);
});
