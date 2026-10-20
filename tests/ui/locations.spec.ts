import { test } from "../../src/fixtures";

test(
  "S1: directory heading, introduction and satellite explanation",
  {
    tag: ["@ui", "@S1.1", "@S1.2"],
  },
  async ({ locations }) => {
    await locations.open();
    await locations.assertIntro();
  },
);

test(
  "S1.3: country headings appear above their site lists",
  {
    tag: ["@ui", "@S1.3"],
  },
  async ({ locations }) => {
    await locations.open();
    await locations.assertCountryGroups();
  },
);

for (const country of [
  {
    name: "United States",
    minimum: 20,
    required: ["Phoenix", "Salt Lake City", "Houston", "Las Vegas", "Atlanta"],
    requirement: "@S1.4",
  },
  {
    name: "Canada",
    minimum: 10,
    required: ["Edmonton", "Montreal", "Toronto", "Regina", "Saskatoon"],
    requirement: "@S1.5",
  },
]) {
  test(
    `${country.requirement.slice(1)}: ${country.name} locations meet the assignment`,
    {
      tag: ["@ui", country.requirement],
    },
    async ({ locations }) => {
      await locations.open();
      await locations.assertCountrySites(
        country.name,
        country.minimum,
        country.required,
      );
    },
  );
}

test(
  "S1: satellite and permanent sites have the correct counts and markers",
  {
    tag: ["@ui", "@S1.6", "@S1.7"],
  },
  async ({ locations }) => {
    await locations.open();
    await locations.assertSiteClassification();
  },
);
