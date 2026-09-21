// Static SPA build for cPanel hosting (Apache + PHP, no Node server).
// Run:  bunx vite build --config vite.cpanel.config.ts
// Static site lands in dist/client/ -> upload beside the PHP api/ folder.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    spa: { enabled: true },
  },
});
