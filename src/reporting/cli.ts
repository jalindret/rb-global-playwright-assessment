import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { evidenceSchema } from "./model";
import { writeReport } from "./artifacts";
const root = process.cwd();
const pointer: unknown = JSON.parse(
  readFileSync(join(root, "reports/hawkeye/latest.json"), "utf8"),
);
const latest = z
  .object({ runId: z.string().regex(/^[A-Za-z0-9_-]+$/) })
  .parse(pointer);
const path = resolve(root, "reports/hawkeye", latest.runId, "qe-evidence.json");
const input: unknown = JSON.parse(readFileSync(path, "utf8"));
const evidence = evidenceSchema.parse(input);
if (evidence.runId !== latest.runId)
  throw new Error("Latest report and evidence run identifiers differ");
console.log(
  `Hawkeye report regenerated from recorded evidence: ${writeReport(evidence, root)}`,
);
