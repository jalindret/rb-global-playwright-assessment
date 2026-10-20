import { SiteNotices } from "./pages/components/site-notices";
import { test as base } from "@playwright/test";
import { LocationsPage } from "./pages/locations-page";
import { YardPage } from "./pages/yard-page";
import { SearchPage } from "./pages/search-page";
import { AuctionClient } from "./api/auction-client";
type Fixtures = {
  locations: LocationsPage;
  yard: YardPage;
  inventory: SearchPage;
  auctionApi: AuctionClient;
};
export const test = base.extend<Fixtures>({
  page: async ({ page }, use, testInfo) => {
    await new SiteNotices(page).register();
    await use(page);
    if (testInfo.status !== testInfo.expectedStatus) {
      const current = new URL(page.url());
      await testInfo.attach("failure-context", {
        body: JSON.stringify(
          {
            project: testInfo.project.name,
            test: testInfo.title,
            url: current.origin + current.pathname,
            expectedStatus: testInfo.expectedStatus,
            actualStatus: testInfo.status,
            retry: testInfo.retry,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
    }
  },
  locations: async ({ page }, use) => {
    await use(new LocationsPage(page));
  },
  yard: async ({ page }, use) => {
    await use(new YardPage(page));
  },
  inventory: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  auctionApi: async ({ request }, use) => {
    await use(new AuctionClient(request));
  },
});
export { expect } from "@playwright/test";
