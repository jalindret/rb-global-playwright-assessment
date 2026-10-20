import { readFileSync } from "node:fs";
const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
for (const [name, version] of Object.entries({
  ...manifest.dependencies,
  ...manifest.devDependencies,
})) {
  if (
    typeof version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)
  ) {
    throw new Error(`${name} must have an exact dependency version`);
  }
}
console.log("All direct dependency versions are pinned.");
