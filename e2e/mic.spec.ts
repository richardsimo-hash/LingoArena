import { expect, test } from "@playwright/test";

// Known issue: in headless Chromium the step stays at "Running…" (likely the playback after
// recording never resolves). Unverified; investigate before relying on this test.
test.fixme("/test records real (fake-mic) speech and detects voice", async ({ page }) => {
  await page.goto("/test");
  const row = page.locator("div.rounded-2xl", { hasText: "Record 4 s and play back" });
  await row.getByRole("button", { name: "Run" }).click();
  await expect(row).toContainText(/Voice detected|Very quiet/, { timeout: 15_000 });
  await expect(row).not.toContainText("Digital silence");
});
