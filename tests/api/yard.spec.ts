import { assertUpcomingEvents } from "../../src/api/yard-assertions";
import { test, expect } from "../../src/fixtures";

test(
  "A2: Edmonton details, scheduled events and equipment categories",
  {
    tag: ["@api", "@A2.1", "@A2.2", "@A2.3", "@A2.4"],
  },
  async ({ auctionApi }) => {
    // Schemas validate phone/hours, event names/dates and reported category quantities.
    const data = await auctionApi.yard();

    await test.step("A2.2 Edmonton address and contact details", () => {
      expect(data.yardDetails.name).toBe("Edmonton");
      expect(data.yardDetails.address).toMatchObject({
        addressLine1: "1500 Sparrow Drive",
        city: "Nisku",
        zipPostalCode: "T9E 8H6",
      });
    });

    await test.step("A2.3 Upcoming events, when scheduled", () => {
      assertUpcomingEvents(data.upcomingEvents);
    });

    await test.step("A2.4 Flattened equipment categories", () => {
      const categories = data.itemsInYard.flatMap((group) => group.categories);
      expect(categories.length).toBeGreaterThan(5);
      expect(
        categories.map((category) => category.categoryLocalized),
      ).toContain("Excavators");
      console.log("Flattened equipment categories:", categories.length);
    });
  },
);
