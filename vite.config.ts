import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Version réelle de la plateforme, injectée au build (aucune valeur codée en dur).
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8"));
function safe(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}
const APP_COMMIT = (process.env.RAILWAY_GIT_COMMIT_SHA || safe("git rev-parse --short HEAD")).slice(0, 7);
const APP_BUILD = safe("git rev-list --count HEAD"); // numéro de build réel (nombre de commits)
const APP_BUILD_TIME = new Date().toISOString();

// Client lives in /client, builds to /dist/public (served by Express in prod).
export default defineConfig({
  root: path.resolve(__dirname, "client"),
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(APP_COMMIT),
    __APP_BUILD__: JSON.stringify(APP_BUILD),
    __APP_BUILD_TIME__: JSON.stringify(APP_BUILD_TIME),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
