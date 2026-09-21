// Static SPA build for cPanel hosting (Apache + PHP only — no Node server).
//   bun run build:cpanel
// Output: dist-cpanel/  (index.html + assets)  -> upload beside cpanel/api/
import { defineConfig } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Subfolder deploys need an absolute base so deep SPA routes still resolve
  // assets:  VITE_BASE=/bdwineiplat/ bun run build:cpanel
  base: process.env.VITE_BASE ?? "/",
  root: path.resolve(import.meta.dirname, "spa"),
  publicDir: path.resolve(import.meta.dirname, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-cpanel"),
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
  },
});
