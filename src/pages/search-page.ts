import { parseDisplayedTotal } from "../domain/displayed-total";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
export class SearchPage {
  constructor(readonly page: Page) {}
  get cards() {
    return this.page.locator('[data-testid^="searchResultItemCard-"]');
  }
  async open() {
    await this.page.goto("/search?freeText=Edmonton", {
      waitUntil: "domcontentloaded",
    });
    await expect(this.page.getByTestId("search input")).toHaveValue("Edmonton");
    await expect(this.page.getByTestId("search-count-header")).toContainText(
      "Edmonton",
    );
  }
  async assertResults() {
    await expect(this.cards.first()).toBeVisible();
    // Footer supplies the exact displayed total; never derive it from card count.
    const totalText = this.page.locator("#items-per-page");
    await expect(totalText).toHaveText(/\d+\s*[-–]\s*\d+\s+of\s+[\d,]+/);
    const text = await totalText.innerText();
    const total = parseDisplayedTotal(text).value;
    expect(total).toBeGreaterThan(0);
    const titles: string[] = [];
    for (const card of await this.cards.all()) {
      const title = card.getByTestId("item-card-title-link");
      await expect(title).toHaveText(/\S/);
      titles.push((await title.innerText()).trim());
      for (const location of await card.locator("p[title]").all())
        await expect(
          location,
          "Displayed lot location must contain text",
        ).toHaveText(/\S/);
      for (const date of await card.getByTestId("end-date-section").all()) {
        await expect(date).toHaveText(/\S/);
        await expect(date).not.toHaveText(/^Closing:\s*$/);
      }
    }
    console.log(
      "Displayed inventory total:",
      total,
      "First five titles:",
      titles.slice(0, 5),
    );
  }
  async assertNoPreviousPage() {
    await expect(
      this.page.getByRole("button", {
        name: "Go to previous page",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      this.page.getByRole("button", { name: "page 1", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
}
