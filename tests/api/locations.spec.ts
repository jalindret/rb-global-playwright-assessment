import { test, expect } from "../../src/fixtures";

test(
  "A1: directory contains named, classified yards across countries",
  {
    tag: [
      "@api",
      "@smoke",
      "@A1.1",
      "@A1.2",
      "@A1.3",
      "@A1.4",
      "@A1.5",
      "@A1.6",
    ],
  },
  async ({ auctionApi }) => {
    // The client validates every name, country and site type before returning.
    const { yards } = await auctionApi.directory();
    expect(yards.length).toBeGreaterThan(60);
    expect(yards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Edmonton",
          address: expect.objectContaining({ country: "Canada" }),
        }),
        expect.objectContaining({
          name: "Phoenix",
          address: expect.objectContaining({ country: "United States" }),
        }),
      ]),
    );
    const satellite = yards.filter((yard) => yard.type === "Satellite").length;
    const permanent = yards.filter((yard) => yard.type === "Permanent").length;
    expect(satellite).toBeGreaterThan(15);
    expect(permanent).toBeGreaterThan(25);
    const countries = [...new Set(yards.map((yard) => yard.address.country))];
    expect(countries.length).toBeGreaterThan(8);
    expect(countries).toEqual(
      expect.arrayContaining(["United States", "Canada"]),
    );
    console.log({
      yards: yards.length,
      satellite,
      permanent,
      countries: countries.length,
    });
  },
);
