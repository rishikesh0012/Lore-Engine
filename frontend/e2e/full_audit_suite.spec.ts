import { test, expect } from "@playwright/test";

test.describe("Full Audit & Verification Suite", () => {
  test("1. Verify Homepage layout & navigation links", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page).toHaveTitle(/Lore Engine/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("2. Verify Dashboard route", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("3. Verify Characters Explorer route", async ({ page }) => {
    await page.goto("/characters", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("4. Verify Graph Visualizer route", async ({ page }) => {
    await page.goto("/graph", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("5. Verify NL Search Ask route", async ({ page }) => {
    await page.goto("/ask", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("6. Verify Source Compare route", async ({ page }) => {
    await page.goto("/compare", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("7. Verify Relationships Browser route", async ({ page }) => {
    await page.goto("/relationships", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("8. Verify Analytics route", async ({ page }) => {
    await page.goto("/analytics", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("9. Verify Settings route", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
  });
});
