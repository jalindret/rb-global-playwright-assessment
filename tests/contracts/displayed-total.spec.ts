import { test, expect } from "@playwright/test";
import { parseDisplayedTotal } from "../../src/domain/displayed-total";
for (const [text, kind, value] of [
  ["1-60 of 2290", "exact", 2290],
  ["1–60 of 2,290", "exact", 2290],
  ['2.2k results for "Edmonton"', "abbreviated", 2200],
  ["1.1m results", "abbreviated", 1100000],
  ["0 results", "exact", 0],
] as const) {
  test(`Displayed total parses ${text}`, () => {
    expect(parseDisplayedTotal(text)).toEqual({ kind, value });
  });
}
for (const text of [
  "",
  "Lots available",
  "-2 results",
  "1-60 of 2,29",
  "60-1 of 100",
  "1-60 of 20",
]) {
  test(`Displayed total rejects invalid input: ${JSON.stringify(text)}`, () => {
    expect(() => parseDisplayedTotal(text)).toThrow();
  });
}
