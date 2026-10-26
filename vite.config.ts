/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Also expose the public Supabase keys created by the Vercel integration (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).
  envPrefix: ["VITE_", "NEXT_PUBLIC_SUPABASE_"],
  build: {
    rollupOptions: {
      output: {
        // Long-lived chunks: React and the course content rarely change, so returning learners
        // keep them cached across app releases.
        manualChunks(id) {
          if (id.includes("/node_modules/react") || id.includes("/node_modules/scheduler")) return "react";
          if (id.includes("/src/lib/lingo/curriculum/")) return "course";
          return undefined;
        },
      },
    },
  },
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
