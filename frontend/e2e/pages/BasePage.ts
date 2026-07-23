import { Page, expect } from "@playwright/test";

export class BasePage {
  readonly page: Page;
  readonly consoleErrors: string[] = [];
  readonly failedRequests: string[] = [];

  constructor(page: Page) {
    this.page = page;

    // Monitor browser console errors
    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("ERR_CONNECTION_REFUSED") && !text.includes("Failed to fetch") && !text.includes("localhost:8000")) {
          this.consoleErrors.push(text);
        }
      }
    });

    // Monitor failed HTTP network requests (4xx / 5xx)
    this.page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().includes("localhost:8000")) {
        this.failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });
  }

  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async verifyNoConsoleErrors() {
    expect(this.consoleErrors, `Console errors found: ${this.consoleErrors.join(", ")}`).toHaveLength(0);
  }

  async verifyNoFailedRequests() {
    expect(this.failedRequests, `Failed network requests found: ${this.failedRequests.join(", ")}`).toHaveLength(0);
  }

  async captureScreenshot(name: string) {
    await this.page.screenshot({ path: `playwright-report/screenshots/${name}.png`, fullPage: true });
  }
}
