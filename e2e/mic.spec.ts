import { expect, test } from "@playwright/test";

// On macOS, headless Chromium waits on an OS microphone permission that never appears, so
// getUserMedia never resolves even with fake-device flags. These tests run on Linux (CI).
test.skip(process.platform === "darwin", "fake microphone capture needs Linux; runs in GitHub Actions");

test("/test records fake-mic speech and detects a voice (not digital silence)", async ({ page }) => {
  await page.goto("/test");
  const row = page.locator("div.rounded-2xl", { hasText: "Record 4 s and play back" });
  await row.getByRole("button", { name: "Run" }).click();
  await expect(row).toContainText(/Voice detected|Very quiet/, { timeout: 20_000 });
  await expect(row).not.toContainText("Digital silence");
});

test("Settings microphone test hears the learner", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("lingoarena-v1", JSON.stringify({ configured: true, name: "E2E", native: "en", target: "es", settingsAt: 1 })));
  await page.goto("/");
  await page.getByRole("button", { name: /settings/i }).first().click();
  const micTest = page.locator("label:has-text('Microphone') + div").getByRole("button", { name: "Test" });
  await micTest.click();
  await expect(page.getByRole("status").filter({ hasText: /Working|Very quiet/ })).toBeVisible({ timeout: 15_000 });
});
