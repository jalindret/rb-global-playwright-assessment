import { test, expect } from "../../src/fixtures";

test(
  "S2: Edmonton directory link opens the correct yard",
  { tag: ["@ui", "@smoke", "@S2.1", "@S2.2"] },
  async ({ locations }) => {
    await locations.open();
    await locations.openEdmonton();
  },
);

test(
  "Negative: country groups do not misclassify known yards",
  { tag: ["@ui", "@negative"] },
  async ({ locations }) => {
    await locations.open();
    expect(await locations.sites("United States")).not.toContain("Edmonton");
    expect(await locations.sites("Canada")).not.toContain("Phoenix");
  },
);

test(
  "Negative: switching tabs does not lose the auction-sites view",
  { tag: ["@ui", "@negative", "@S1.9"] },
  async ({ locations }) => {
    await locations.open();
    const before = await locations.allSites();
    await locations.representatives();
    await locations.auctionSites();
    expect(await locations.allSites()).toEqual(before);
  },
);

test(
  "Negative: representative search starts empty until a location is selected",
  { tag: ["@negative", "@ui"] },
  async ({ locations }) => {
    await locations.open();
    await locations.assertEmptyRepresentativeSearch();
  },
);
