import { test } from "../../src/fixtures";

test(
  "S4: Edmonton inventory displays a positive total and named lots",
  { tag: ["@ui", "@S4.1", "@S4.2"] },
  async ({ inventory }) => {
    await test.step("S4.1 Open Edmonton inventory", () => inventory.open());

    await test.step("S4.2 Displayed total and first-page lot details", () =>
      inventory.assertResults());
  },
);

test(
  "Negative: previous page is unavailable on the first results page",
  { tag: ["@ui", "@negative"] },
  async ({ inventory }) => {
    await test.step("S4.1 Open Edmonton inventory", () => inventory.open());

    await inventory.assertNoPreviousPage();
  },
);
