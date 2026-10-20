export type DisplayedTotal =
  | { readonly kind: "exact"; readonly value: number }
  | { readonly kind: "abbreviated"; readonly value: number };
/** Parse displayed counts, keeping rounded header totals distinct from exact footer totals. */
export function parseDisplayedTotal(text: string): DisplayedTotal {
  const integer = "(?:\\d{1,3}(?:,\\d{3})+|\\d+)";
  const footer = new RegExp(
    `^\\s*(${integer})\\s*[-–]\\s*(${integer})\\s+of\\s+(${integer})\\s*$`,
    "i",
  ).exec(text);
  if (footer) {
    const start = Number(footer[1]?.replaceAll(",", ""));
    const end = Number(footer[2]?.replaceAll(",", ""));
    const total = Number(footer[3]?.replaceAll(",", ""));
    if (
      ![start, end, total].every(Number.isSafeInteger) ||
      start < 1 ||
      end < start ||
      end > total
    )
      throw new Error(`Invalid displayed pagination range: ${text}`);
    return { kind: "exact", value: total };
  }
  const header = new RegExp(
    `^\\s*(${integer}|\\d+(?:\\.\\d+)?[km])\\s+results?(?:\\s+for\\s+.+)?\\s*$`,
    "i",
  ).exec(text);
  const token = header?.[1]?.toLowerCase();
  if (!token)
    throw new Error(`Cannot parse displayed inventory total: ${text}`);
  const suffix = token.at(-1);
  const multiplier = suffix === "k" ? 1000 : suffix === "m" ? 1_000_000 : 1;
  const value = Number(token.replace(/[km,]/g, "")) * multiplier;
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`Invalid displayed inventory total: ${text}`);
  return { kind: multiplier === 1 ? "exact" : "abbreviated", value };
}
