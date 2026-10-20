import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["./src/reporting/reporter.ts"],
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  use: {
    baseURL: "https://www.rbauction.com",
    locale: "en-US",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...(process.env.HTTPS_PROXY
      ? { proxy: { server: process.env.HTTPS_PROXY } }
      : {}),
  },
  projects: [
    { name: "reporting", testMatch: "**/reporting/*.spec.ts" },
    { name: "contracts", testMatch: "**/contracts/*.spec.ts" },
    { name: "api", testMatch: "**/api/*.spec.ts" },
    {
      name: "ui",
      testMatch: "**/ui/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.CHROMIUM_EXECUTABLE_PATH
          ? {
              executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
              args: ["--no-sandbox"],
            }
          : {},
      },
    },
  ],
});
