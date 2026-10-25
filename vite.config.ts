/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // The Whisper worker dynamically imports Transformers.js, which needs an ES module worker.
  worker: { format: "es" },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    // lingo_current/ is an old copy of the app kept in the repo; its tests target removed behaviour.
    exclude: [...configDefaults.exclude, "lingo_current/**"],
  },
});
