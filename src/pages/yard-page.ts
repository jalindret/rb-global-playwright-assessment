import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
export class YardPage {
  constructor(readonly page: Page) {}
  get details() {
    return this.page.locator("#auction-site-tabpanel-details");
  }
  get categories() {
    return this.details.locator('a[href*="/cp/"][href*="freeText=Edmonton"]');
  }
  get events() {
    return this.details
      .locator('[data-testid^="auction-card-"]')
      .filter({ has: this.page.locator("h5") });
  }
  async open() {
    await this.page.goto("/lp/edmonton-ab", { waitUntil: "domcontentloaded" });
    await expect(
      this.page.getByRole("heading", { name: "Edmonton", exact: true }),
    ).toBeVisible();
  }
  async assertDetails() {
    await expect(
      this.details.getByText("1500 Sparrow Drive, Nisku, AB, Canada, T9E 8H6", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.details.getByText(/Mon - Fri,.*\d{1,2}:\d{2}.*-.*\d{1,2}:\d{2}/),
    ).toBeVisible();
    await expect(
      this.details.getByTestId("contact-phone-link"),
    ).toHaveAttribute("href", /^tel:\+?[\d(). -]+$/);
  }
  /** Verify the weekday drop-off, inspection and pick-up information. */
  async assertAboutYard(): Promise<void> {
    await expect(
      this.details.getByRole("heading", {
        name: "About this yard",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.details.getByText(
        /yard is open weekdays for equipment drop-off, inspection and pick-up/,
      ),
    ).toBeVisible();
  }
  async assertEvents() {
    await expect(
      this.details.getByRole("heading", {
        name: "Auction events",
        exact: true,
      }),
    ).toBeVisible();
    await expect(this.events.first()).toBeVisible();
    const count = await this.events.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (const card of await this.events.all()) {
      await expect(card.locator("h5")).toHaveText(/\S/);
      await expect(
        card.locator('[data-testid^="auction-card-date-range-"]'),
      ).toHaveText(/[A-Za-z]{3}\s+\d{1,2}\s*[-–]\s*(?:[A-Za-z]{3}\s+)?\d{1,2}/);
    }
    console.log("Auction events:", count);
  }
  async assertCategories() {
    await expect(
      this.details.getByRole("heading", { name: "Items in yard", exact: true }),
    ).toBeVisible();
    // Query every DOM card, including off-screen carousel slides; no :visible filter.
    await expect
      .poll(() => this.categories.count(), {
        message: "S3.4 equipment carousel must load more than five cards",
      })
      .toBeGreaterThan(5);
    const cards = await this.categories.all();
    expect(cards.length).toBeGreaterThan(5);
    const names: string[] = [];
    for (const card of cards) {
      const heading = card.locator("h6");
      await expect(heading).toHaveText(/\S/);
      names.push((await heading.innerText()).trim());
      await expect(card.locator("p")).toHaveText(/^[\d,]+ items?$/);
    }
    expect(names).toContain("Excavators");
    expect(
      names.some((n) =>
        [
          "Harvesting Equipment",
          "Agricultural Tractors",
          "Sprayers",
          "Excavator Attachments",
        ].includes(n),
      ),
    ).toBe(true);
    console.log("Items-in-yard categories:", names.length);
  }
  async assertSellerForm() {
    const form = this.details.getByTestId("seller-form-body");
    await expect(
      form.getByRole("heading", { name: "Become a seller", exact: true }),
    ).toBeVisible();
    await expect(form.locator('a[href^="tel:"]')).toHaveText(/\d/);
    await expect(form.locator("form")).toBeVisible();
  }
  async assertRepresentatives() {
    await this.page
      .getByRole("tab", { name: "Representatives", exact: true })
      .click();
    const panel = this.page.locator(
      "#auction-site-tabpanel-local_representative",
    );
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("heading", { level: 4 }).first(),
    ).toBeVisible();
    // Select the smallest card ancestor containing a name and its contact information.
    const first = panel.locator("h4").first().locator("xpath=../../..");
    await expect(first.locator("h6").first()).toHaveText(/\S/);
    await expect(
      first.locator('a[href^="tel:"], a[href^="mailto:"]').first(),
    ).toBeVisible();
  }
}
