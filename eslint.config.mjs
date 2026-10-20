import js from "@eslint/js";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".git/**",
      "validation/**",
      "build/**",
      "reports/**",
      "local-validation.config.ts",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        console: "readonly",
        module: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    plugins: { playwright },
    rules: {
      "playwright/no-wait-for-timeout": "error",
      "playwright/no-force-option": "error",
      "playwright/no-element-handle": "error",
      "playwright/no-page-pause": "error",
    },
  },
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ...playwright.configs["flat/recommended"],
    files: ["tests/**/*.spec.ts"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/no-wait-for-timeout": "error",
      "playwright/no-force-option": "error",
      "playwright/no-focused-test": "error",
      "playwright/no-skipped-test": "error",
      // Domain assertion helpers and schema parsers contain assertions outside the spec body.
      "playwright/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "assertUpcomingEvents",
            "assertIntro",
            "assertCountryGroups",
            "assertCountrySites",
            "assertSiteClassification",
            "assertDetails",
            "assertAboutYard",
            "assertEvents",
            "assertCategories",
            "assertSellerForm",
            "assertRepresentatives",
            "assertResults",
            "assertNoPreviousPage",
            "openEdmonton",
            "assertEmptyRepresentativeSearch",
          ],
        },
      ],
    },
  },
);
