import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  readFileSync(new URL("../requirements.json", import.meta.url), "utf8"),
);
const collected = JSON.parse(
  execFileSync(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/playwright/cli.js", import.meta.url),
      ),
      "test",
      "--list",
      "--reporter=json",
    ],
    { cwd: root, encoding: "utf8" },
  ),
);
const covered = new Set();
function walk(suite) {
  for (const spec of suite.specs ?? [])
    for (const tag of spec.tags ?? []) covered.add(tag.replace(/^@/, ""));
  for (const child of suite.suites ?? []) walk(child);
}
for (const suite of collected.suites) walk(suite);
const missing = manifest.requiredIds.filter((id) => !covered.has(id));
if (missing.length)
  throw new Error(
    `Requirements missing from collected tests: ${missing.join(", ")}`,
  );
console.log(
  `All ${manifest.requiredIds.length} assignment requirements are mapped to collected tests. This checks traceability, not execution success.`,
);
