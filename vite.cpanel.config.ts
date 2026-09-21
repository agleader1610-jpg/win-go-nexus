// Static SPA build for cPanel hosting (Apache + PHP, no Node server).
// Output: dist-cpanel/  ->  upload next to the PHP api/ folder.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    spa: { enabled: true },
  },
  vite: {
    base: "./",
    build: { outDir: "dist-cpanel" },
  },
});
