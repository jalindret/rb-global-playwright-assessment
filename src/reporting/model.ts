import { z } from "zod";
export const verdictSchema = z.enum(["PASS", "FAIL", "BLOCKED"]);
export const testEvidenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  project: z.string().min(1),
  file: z.string(),
  line: z.number().int(),
  verdict: verdictSchema,
  durationMs: z.number().nonnegative(),
  attempts: z.number().int().positive(),
  requirementIds: z.array(z.string()),
  errors: z.array(z.string()),
  steps: z.array(
    z.object({
      title: z.string(),
      verdict: verdictSchema,
      durationMs: z.number().nonnegative(),
    }),
  ),
  attachments: z.array(
    z.object({
      name: z.string(),
      href: z
        .string()
        .regex(/^evidence\/[a-f0-9]{20}\/\d+\.(?:png|zip|json|txt)$/),
    }),
  ),
});
export const criterionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  source: z.string(),
});
export const evidenceSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  runnerStatus: z.enum(["passed", "failed", "timedout", "interrupted"]),
  tests: z.array(testEvidenceSchema),
  criteria: z
    .array(criterionSchema)
    .min(1)
    .refine(
      (criteria) =>
        new Set(criteria.map((row) => row.id)).size === criteria.length,
      "Duplicate requirement IDs",
    ),
  environmentNote: z.string(),
});
export type Verdict = z.infer<typeof verdictSchema>;
export type TestEvidence = z.infer<typeof testEvidenceSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export interface RequirementResult {
  id: string;
  text: string;
  source: string;
  verdict: Verdict;
  basis: string;
  tests: TestEvidence[];
}
export function requirementResults(evidence: Evidence): RequirementResult[] {
  return evidence.criteria.map((criterion) => {
    const tests = evidence.tests.filter((test) =>
      test.requirementIds.includes(criterion.id),
    );
    const exactStep = tests
      .flatMap((test) => test.steps)
      .filter((step) => step.title.startsWith(criterion.id + " "));
    let verdict: Verdict = "BLOCKED";
    let basis =
      "Not executed in this selected run; no passing proof is claimed.";
    if (exactStep.length) {
      verdict = exactStep.some((step) => step.verdict === "FAIL")
        ? "FAIL"
        : exactStep.every((step) => step.verdict === "PASS")
          ? "PASS"
          : "BLOCKED";
      basis =
        "Verdict derives from the named requirement step(s) recorded by Playwright.";
    } else if (tests.length && tests.every((test) => test.verdict === "PASS")) {
      verdict = "PASS";
      basis =
        "The mapped scenario completed successfully, including its assertions. This is shared scenario evidence, not a separate test count per criterion.";
    } else if (tests.length) {
      basis =
        "The mapped scenario did not pass. Individual criterion proof cannot be isolated from this grouped result; review the failure evidence.";
    }
    return { ...criterion, verdict, basis, tests };
  });
}
export function overallVerdict(evidence: Evidence): Verdict {
  if (
    evidence.runnerStatus === "failed" ||
    evidence.tests.some((test) => test.verdict === "FAIL")
  )
    return "FAIL";
  if (
    evidence.runnerStatus !== "passed" ||
    requirementResults(evidence).some((row) => row.verdict !== "PASS")
  )
    return "BLOCKED";
  return "PASS";
}
/** Public-site evidence only; strip ANSI, URL queries and common secret-shaped values. */
export function sanitize(text: string): string {
  return text
    .replace(new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g"), "")
    .replace(/https?:\/\/[^\s<>"']+/g, (raw) => {
      try {
        const url = new URL(raw);
        return url.origin + url.pathname;
      } catch {
        return "[invalid URL]";
      }
    })
    .replace(
      /((?:password|token|authorization|secret|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi,
      "$1[redacted]",
    )
    .slice(0, 1400);
}
