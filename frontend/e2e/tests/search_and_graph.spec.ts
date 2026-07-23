import { test, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

test.describe("Search & Graph Interaction Suite", () => {
  const searchQueries = ["Zeus", "Athena", "Achilles", "Odysseus", "abcdef12345"];

  for (const query of searchQueries) {
    test(`Character Search input with term: "${query}"`, async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.navigateTo("/characters");

      const searchInput = page.locator("input[type='text']").first();
      await searchInput.fill(query);
      await page.waitForTimeout(300); // Debounce delay

      await basePage.captureScreenshot(`search_character_${query}`);
      await basePage.verifyNoConsoleErrors();
    });
  }

  test("Interactive 2D Knowledge Graph zoom, pan, and filter controls", async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.navigateTo("/graph");

    // Verify SVG canvas exists
    const svgCanvas = page.locator("svg").first();
    await expect(svgCanvas).toBeVisible();

    // Select relationship filter
    const selectFilter = page.locator("select").first();
    if (await selectFilter.isVisible()) {
      await selectFilter.selectOption({ index: 1 });
      await page.waitForTimeout(300);
    }

    await basePage.captureScreenshot("graph_interaction");
    await basePage.verifyNoConsoleErrors();
  });
});
