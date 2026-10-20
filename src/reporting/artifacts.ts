import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceSchema, type Evidence } from "./model";
import { assertTemplate, renderHawkeye } from "./renderer";
function atomicWrite(path: string, text: string): void {
  const temp = path + ".tmp";
  writeFileSync(temp, text);
  renameSync(temp, path);
}
/** One immutable evidence record drives HTML and the template assertion. Latest updates last. */
export function writeReport(evidence: Evidence, root: string): string {
  const validated = evidenceSchema.parse(evidence);
  if (!/^[A-Za-z0-9_-]+$/.test(validated.runId))
    throw new Error("Unsafe Hawkeye run identifier");
  const directory = join(root, "reports/hawkeye", validated.runId);
  mkdirSync(directory, { recursive: true });
  const html = renderHawkeye(validated, root);
  const assertion = assertTemplate(html, root, validated);
  atomicWrite(
    join(directory, "qe-evidence.json"),
    JSON.stringify(validated, null, 2) + "\n",
  );
  atomicWrite(join(directory, "hawkeye-report.html"), html);
  atomicWrite(
    join(directory, "template-assertion.json"),
    JSON.stringify(assertion, null, 2) + "\n",
  );
  // Re-read the written JSON before advancing the pointer; no stale summary reuse.
  const stored: unknown = JSON.parse(
    readFileSync(join(directory, "qe-evidence.json"), "utf8"),
  );
  evidenceSchema.parse(stored);
  atomicWrite(
    join(root, "reports/hawkeye/latest.json"),
    JSON.stringify(
      {
        runId: validated.runId,
        report: `${validated.runId}/hawkeye-report.html`,
        evidence: `${validated.runId}/qe-evidence.json`,
      },
      null,
      2,
    ) + "\n",
  );
  return join(directory, "hawkeye-report.html");
}
