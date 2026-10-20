import type { Page } from "@playwright/test";

/** First-visit presentation controls shared by all public pages. */
export class SiteNotices {
  constructor(private readonly page: Page) {}
  async register(): Promise<void> {
    const page = this.page;
    await page.addLocatorHandler(
      page.getByRole("heading", {
        name: "Confirm your language and region",
        exact: true,
      }),
      async () => {
        await page
          .getByRole("heading", {
            name: "Confirm your language and region",
            exact: true,
          })
          .locator("xpath=../..")
          .locator("button")
          .filter({ has: page.getByTestId("CloseIcon") })
          .click();
      },
    );
    await page.addLocatorHandler(
      page.getByRole("button", { name: "I understand", exact: true }),
      async () => {
        await page
          .getByRole("button", { name: "I understand", exact: true })
          .click();
      },
    );
  }
}
