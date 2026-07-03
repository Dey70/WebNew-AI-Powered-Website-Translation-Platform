const { test, expect } = require("@playwright/test");

test("widget replaces text with the translated response from /api/translate", async ({ page }) => {
  await page.route("**/api/translate", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.api_key).toBe("test-key");
    expect(body.targetLanguage).toBe("french");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { translatedText: "Bienvenue sur mon site internet" },
      }),
    });
  });

  await page.goto("/widget-demo.html");
  await page.waitForFunction(() => window.WebNewTranslate);
  await page.evaluate(() => window.WebNewTranslate.setLanguage("french"));
  await expect(page.locator("#target")).toHaveText("Bienvenue sur mon site internet");
});

test("widget leaves text unchanged when the API returns an explicit failure", async ({ page }) => {
  await page.route("**/api/translate", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: "invalid_api_key", message: "bad key" }),
    });
  });

  await page.goto("/widget-demo.html");
  await page.waitForFunction(() => window.WebNewTranslate);
  await page.evaluate(() => window.WebNewTranslate.setLanguage("french"));
  await page.waitForTimeout(300);
  await expect(page.locator("#target")).toHaveText("Welcome to my website");
});
