import { defineConfig } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";

const manifest = defineManifest({
  manifest_version: 3,
  name: "Gradia",
  version: "0.1.0",
  description:
    "A lightweight Chrome extension screensaver built with React, Vite, and Canvas.",
  author: { email: "minagishl@icloud.com" },
  permissions: ["storage"],
  action: {
    default_title: "Gradia",
    default_popup: "src/popup.html",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    minify: "terser",
    rollupOptions: {
      input: {
        background: "src/background.ts",
        popup: "src/popup.html",
        screensaver: "src/main.html",
      },
    },
  },
  optimizeDeps: {
    include: ["lucide-react"],
    exclude: ["lucide-react/icons"],
  },
});
