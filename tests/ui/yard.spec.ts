import { test } from "../../src/fixtures";

test(
  "S3: Edmonton details, events, all carousel categories and seller form",
  { tag: ["@ui", "@S3.1", "@S3.2", "@S3.3", "@S3.4", "@S3.5"] },
  async ({ yard }) => {
    await yard.open();

    await test.step("S3.1 Address, office hours and telephone", () =>
      yard.assertDetails());

    await test.step("S3.2 Event cards, names and date ranges", () =>
      yard.assertEvents());

    await test.step("S3.3 About this yard", () => yard.assertAboutYard());

    await test.step("S3.4 All carousel categories including off-screen cards", () =>
      yard.assertCategories());

    await test.step("S3.5 Seller form and phone; no submission", () =>
      yard.assertSellerForm());
  },
);

test(
  "S3.6: representatives contain region and contact information",
  { tag: ["@ui", "@S3.6"] },
  async ({ yard }) => {
    await yard.open();

    await test.step("S3.6 Representative region and contact", () =>
      yard.assertRepresentatives());
  },
);
