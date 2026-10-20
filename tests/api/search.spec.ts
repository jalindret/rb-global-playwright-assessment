import { test, expect } from "../../src/fixtures";

test(
  "A3: Edmonton search returns the full total and named lots",
  {
    tag: ["@api", "@A3.1", "@A3.2", "@A3.3", "@A3.4"],
  },
  async ({ auctionApi }) => {
    const { results } = await auctionApi.search("Edmonton");
    expect(results.totalAmount).toBeGreaterThan(0);
    expect(results.records.length).toBeGreaterThan(0);
    console.log(
      "API inventory total:",
      results.totalAmount,
      "First five titles:",
      results.records.slice(0, 5).map((record) => record.assetDescription),
    );
  },
);

for (const malformed of ["{", "["]) {
  test(
    `Negative: malformed JSON ${malformed} returns HTTP 400`,
    {
      tag: ["@api", "@negative"],
    },
    async ({ request }) => {
      const response = await request.post("/api/search", {
        // Buffer sends the invalid bytes unchanged; a string would be JSON-serialized.
        data: Buffer.from(malformed),
        headers: { "content-type": "application/json" },
      });
      expect(response.status()).toBe(400);
      expect(await response.text()).toMatch(/invalid json/i);
    },
  );
}

test(
  "Boundary: size zero preserves the total and omits records",
  {
    tag: ["@api", "@boundary"],
  },
  async ({ auctionApi }) => {
    const { results } = await auctionApi.searchCount("Edmonton");
    expect(results.totalAmount).toBeGreaterThan(0);
    expect(results.returnedAmount).toBe(0);
  },
);

test(
  "Boundary: size one returns one lot and the full hit count",
  {
    tag: ["@api", "@boundary"],
  },
  async ({ auctionApi }) => {
    const { results } = await auctionApi.search("Edmonton", 1);
    expect(results.records).toHaveLength(1);
    expect(results.totalAmount).toBeGreaterThan(1);
  },
);
