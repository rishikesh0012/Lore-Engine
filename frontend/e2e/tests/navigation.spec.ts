import { test, expect } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

const routes = [
  { path: "/", title: "Lore Engine" },
  { path: "/dashboard", title: "Dashboard" },
  { path: "/graph", title: "Knowledge Graph" },
  { path: "/characters", title: "Characters" },
  { path: "/ask", title: "GraphRAG Search" },
  { path: "/compare", title: "Source Comparison" },
  { path: "/relationships", title: "Relationships" },
  { path: "/analytics", title: "Analytics" },
  { path: "/settings", title: "Settings" },
];

test.describe("Full Application Navigation & Page Verification", () => {
  for (const route of routes) {
    test(`Verify route ${route.path} loads cleanly`, async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.navigateTo(route.path);

      // Verify page body is visible
      await expect(page.locator("body")).toBeVisible();

      // Capture screenshot after loading page
      const pageName = route.path === "/" ? "home" : route.path.replace("/", "");
      await basePage.captureScreenshot(`page_${pageName}`);

      // Verify no console errors or 4xx/5xx network failures
      await basePage.verifyNoConsoleErrors();
      await basePage.verifyNoFailedRequests();
    });
  }

  test("Verify 404 error page handles unknown routes", async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.navigateTo("/unknown-route-12345");
    await expect(page.locator("body")).toContainText("404");
    await basePage.captureScreenshot("page_404_error");
  });
});
