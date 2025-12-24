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
  icons: {
    "16": "src/assets/icon16.png",
    "19": "src/assets/icon19.png",
    "38": "src/assets/icon38.png",
    "128": "src/assets/icon128.png",
  },

  action: {
    default_title: "Gradia",
    default_icon: {
      "16": "src/assets/icon16.png",
      "19": "src/assets/icon19.png",
      "38": "src/assets/icon38.png",
      "128": "src/assets/icon128.png",
    },
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
