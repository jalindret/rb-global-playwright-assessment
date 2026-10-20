import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
export class LocationsPage {
  constructor(readonly page: Page) {}
  get heading() {
    return this.page.getByRole("heading", { name: "Locations", exact: true });
  }
  get countryLists() {
    return this.page
      .locator("ul[aria-label]")
      .filter({ has: this.page.locator('a[href^="/lp/"]') });
  }
  country(name: string) {
    return this.page.getByRole("list", { name, exact: true });
  }
  async open() {
    await this.page.goto("/lp", { waitUntil: "domcontentloaded" });
    await expect(this.heading).toBeVisible();
  }
  async assertIntro() {
    await expect(
      this.page.getByText(
        /Ritchie Bros\. currently offers over 60 permanent auction sites and local yards/,
      ),
    ).toBeVisible();
    await expect(
      this.page.getByText(/satellite.*\*|\*.*satellite/i),
    ).toBeVisible();
  }
  async countries() {
    await this.countryLists.first().scrollIntoViewIfNeeded();
    // Scope headings to the same group containers as the actual country lists.
    return this.countryLists.evaluateAll((lists) =>
      lists.map((list) => {
        const heading = list.previousElementSibling;
        if (heading?.tagName !== "H4")
          throw new Error("Country h4 missing above list");
        const name = heading.textContent?.trim();
        if (!name) throw new Error("Country heading is empty");
        return name;
      }),
    );
  }
  async sites(country: string) {
    return this.country(country).getByRole("link").allTextContents();
  }
  async allSites() {
    return this.countryLists.getByRole("link").allTextContents();
  }
  /** Validate country headings and their order above the location lists. */
  async assertCountryGroups(): Promise<void> {
    const countries = await this.countries();
    expect(countries.slice(0, 2)).toEqual(["United States", "Canada"]);
    expect(countries).toEqual(
      expect.arrayContaining([
        "United States",
        "Canada",
        "Australia",
        "United Kingdom",
        "Netherlands",
        "UAE",
      ]),
    );
    console.log("Country groups:", countries.length);
  }

  /** Check the assignment threshold and named sites for one country. */
  async assertCountrySites(
    country: string,
    minimum: number,
    required: readonly string[],
  ): Promise<void> {
    const sites = await this.sites(country);
    expect(sites.length).toBeGreaterThan(minimum);
    expect(sites.map((site) => site.replace(/\*/g, "").trim())).toEqual(
      expect.arrayContaining([...required]),
    );
    console.log(country, "locations:", sites.length);
  }

  /** Count every site and verify the satellite asterisk convention. */
  async assertSiteClassification(): Promise<void> {
    const sites = (await this.allSites()).map((site) => site.trim());
    const satellite = sites.filter((site) => site.endsWith("*")).length;
    const permanent = sites.length - satellite;
    expect(satellite).toBeGreaterThan(15);
    expect(permanent).toBeGreaterThan(25);
    expect(sites.length).toBeGreaterThan(60);
    for (const name of ["San Antonio*", "Calgary, AB*", "Phoenix", "Edmonton"])
      expect(sites).toContain(name);
    console.log({ satellite, permanent, total: sites.length });
  }

  async openEdmonton() {
    const link = this.country("Canada").getByRole("link", {
      name: "Edmonton",
      exact: true,
    });
    await expect(link).toHaveText("Edmonton");
    await link.click();
    await expect(this.page).toHaveURL(/\/lp\/edmonton-ab(?:[/?#]|$)/);
    await expect(
      this.page.getByRole("heading", { name: "Edmonton", exact: true }),
    ).toBeVisible();
  }
  async representatives() {
    await this.page
      .getByRole("tab", { name: "Local representatives", exact: true })
      .click();
    await expect(
      this.page.getByText("Search for representatives", { exact: true }),
    ).toBeVisible();
  }
  async auctionSites() {
    await this.page
      .getByRole("tab", { name: "Auction sites", exact: true })
      .click();
    await expect(
      this.page.getByPlaceholder("address, city or country"),
    ).toBeVisible();
  }
  /** No yard has been chosen in a fresh context, so no representative results should appear. */
  async assertEmptyRepresentativeSearch(): Promise<void> {
    await this.representatives();
    const panel = this.page
      .getByRole("tabpanel")
      .filter({ hasText: "Search for representatives" });
    await expect(
      panel.getByText(
        "No results. Search for your location representative, or select a location below",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(panel.locator('a[href^="mailto:"]')).toHaveCount(0);
  }
}
