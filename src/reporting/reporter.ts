import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { z } from "zod";
import {
  criterionSchema,
  sanitize,
  type Evidence,
  type TestEvidence,
  type Verdict,
} from "./model";
import { writeReport } from "./artifacts";
function steps(items: TestStep[]): TestEvidence["steps"] {
  return items.flatMap((step) => [
    ...(step.category === "test.step"
      ? [
          {
            title: sanitize(step.title),
            verdict: (step.error ? "FAIL" : "PASS") as Verdict,
            durationMs: step.duration,
          },
        ]
      : []),
    ...steps(step.steps),
  ]);
}
/** Playwright adapter: no presentation code or fabricated criterion-level success. */
export default class HawkeyeReporter implements Reporter {
  private root = "";
  private startedAt = new Date().toISOString();
  private runId = "";
  private tests = new Map<string, TestEvidence>();
  onBegin(config: FullConfig): void {
    if (!config.configFile)
      throw new Error("Hawkeye requires a project configuration file");
    this.root = dirname(config.configFile);
    this.startedAt = new Date().toISOString();
    this.runId = this.startedAt.replace(/[^A-Za-z0-9]/g, "-");
  }
  onTestEnd(test: TestCase, result: TestResult): void {
    const id = createHash("sha256").update(test.id).digest("hex").slice(0, 20);
    const directory = join(
      this.root,
      "reports/hawkeye",
      this.runId,
      "evidence",
      id,
    );
    const attachments: TestEvidence["attachments"] = [];
    for (const [index, attachment] of result.attachments.entries()) {
      if (!["trace", "screenshot", "failure-context"].includes(attachment.name))
        continue;
      const extension =
        attachment.contentType === "application/zip"
          ? ".zip"
          : attachment.contentType === "image/png"
            ? ".png"
            : attachment.name === "failure-context"
              ? ".json"
              : ".txt";
      const name = `${index}${extension}`;
      if (attachment.path && existsSync(attachment.path)) {
        const source = realpathSync(attachment.path);
        if (!source.startsWith(realpathSync(this.root) + sep)) continue;
        mkdirSync(directory, { recursive: true });
        copyFileSync(source, join(directory, name));
      } else if (attachment.name === "failure-context" && attachment.body) {
        mkdirSync(directory, { recursive: true });
        writeFileSync(
          join(directory, name),
          sanitize(attachment.body.toString("utf8")),
        );
      } else continue;
      attachments.push({
        name: sanitize(attachment.name),
        href: `evidence/${id}/${name}`,
      });
    }
    const previous = this.tests.get(test.id);
    const sourceFile = relative(this.root, test.location.file)
      .split(sep)
      .join("/");
    if (isAbsolute(sourceFile) || sourceFile.startsWith("../"))
      throw new Error("Test source is outside the project");
    const verdict: Verdict =
      result.status === "passed" && !previous
        ? "PASS"
        : result.status === "skipped" || result.status === "interrupted"
          ? "BLOCKED"
          : "FAIL";
    this.tests.set(test.id, {
      id,
      title: sanitize(test.title),
      project: test.parent.project()?.name ?? "unknown",
      file: sourceFile,
      line: test.location.line,
      verdict,
      durationMs: (previous?.durationMs ?? 0) + result.duration,
      attempts: result.retry + 1,
      requirementIds: test.tags
        .filter((tag) => /^@[SA]\d\.\d+$/.test(tag))
        .map((tag) => tag.slice(1)),
      errors: result.errors.map((error) =>
        sanitize(error.message ?? "Unspecified runner error"),
      ),
      steps: steps(result.steps),
      attachments,
    });
  }
  onEnd(result: FullResult): Promise<{ status: "failed" } | void> {
    try {
      if (this.tests.size === 0 && result.status === "passed")
        return Promise.resolve();
      const parsed: unknown = JSON.parse(
        readFileSync(join(this.root, "requirements.json"), "utf8"),
      );
      const criteria = z
        .object({ criteria: z.array(criterionSchema).min(1) })
        .parse(parsed).criteria;
      const evidence: Evidence = {
        schemaVersion: 1,
        runId: this.runId,
        startedAt: this.startedAt,
        finishedAt: new Date().toISOString(),
        runnerStatus: result.status,
        tests: [...this.tests.values()],
        criteria,
        environmentNote: sanitize(
          process.env.HAWKEYE_ENVIRONMENT_NOTE ??
            "Configured Playwright environment; no separate hosted CI verification is implied.",
        ),
      };
      const report = writeReport(evidence, this.root);
      console.log(`Hawkeye report: ${report}`);
      return Promise.resolve();
    } catch (error: unknown) {
      console.error(
        `Hawkeye generation failed: ${sanitize(error instanceof Error ? error.message : String(error))}`,
      );
      return Promise.resolve({ status: "failed" });
    }
  }
}
