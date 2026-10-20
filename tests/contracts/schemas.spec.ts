import { test, expect } from "@playwright/test";
import {
  categorySchema,
  directorySchema,
  parseSearchCount,
  parseSearchPage,
} from "../../src/api/schemas";

test("Category variants distinguish a reported zero from an absent quantity", () => {
  const reported = categorySchema.parse({
    categoryLocalized: "Excavators",
    totalAssets: 0,
  });
  expect(reported.quantityKind).toBe("reported");
  expect(reported).toHaveProperty("totalAssets", 0);
  expect(categorySchema.parse({ categoryLocalized: "Excavators" })).toEqual({
    categoryLocalized: "Excavators",
    quantityKind: "unreported",
  });
});

for (const quantity of [-1, "12", null]) {
  test(`Category rejects invalid reported quantity: ${String(quantity)}`, () => {
    expect(
      categorySchema.safeParse({
        categoryLocalized: "Excavators",
        totalAssets: quantity,
      }).success,
    ).toBe(false);
  });
}

test("Search page rejects missing records and blank descriptions", () => {
  expect(() =>
    parseSearchPage({ results: { totalAmount: 10, returnedAmount: 1 } }),
  ).toThrow();
  expect(() =>
    parseSearchPage({
      results: {
        totalAmount: 10,
        returnedAmount: 1,
        records: [{ assetDescription: " " }],
      },
    }),
  ).toThrow();
});

test("Count-only and record-bearing responses have distinct shapes", () => {
  const count = parseSearchCount({
    results: { totalAmount: 10, returnedAmount: 0 },
  });
  expect(count.results.returnedAmount).toBe(0);
  expect(count.results).not.toHaveProperty("records");
  const page = parseSearchPage({
    results: {
      totalAmount: 10,
      returnedAmount: 1,
      records: [{ assetDescription: "Excavator" }],
    },
  });
  expect(page.results.records).toHaveLength(1);
  expect(() =>
    parseSearchCount({
      results: { totalAmount: 10, returnedAmount: 0, records: [] },
    }),
  ).toThrow();
});

test("Directory rejects unsupported site types", () => {
  expect(
    directorySchema.safeParse({
      yards: [
        {
          name: "Edmonton",
          type: "Unknown",
          address: { country: "Canada", countryCode: "CAN" },
        },
      ],
    }).success,
  ).toBe(false);
});

test("Search rejects a returned count greater than total hits", () => {
  expect(() =>
    parseSearchPage({
      results: {
        totalAmount: 0,
        returnedAmount: 1,
        records: [{ assetDescription: "Excavator" }],
      },
    }),
  ).toThrow();
});
