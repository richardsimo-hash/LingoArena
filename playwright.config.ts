import { defineConfig } from "@playwright/test";

/** End-to-end tests in real Chromium with a fake microphone that plays e2e/fixtures/speech.wav. */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  webServer: { command: "npx vite build && npx vite preview --port 4174 --strictPort", port: 4174, reuseExistingServer: true, timeout: 120_000 },
  use: {
    baseURL: "http://localhost:4174",
    permissions: ["microphone"],
    launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-audio-capture=e2e/fixtures/speech.wav", "--autoplay-policy=no-user-gesture-required"] },
  },
});
