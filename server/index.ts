import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db.js";
import { seedStructure } from "./seed.js";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { handleStripeWebhook } from "./stripeWebhook.js";
import { env, isProd } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// Webhook Stripe : corps brut, AVANT express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mkapms-web", env: env.NODE_ENV });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext }),
);

// Sert le frontend compilé en production
if (isProd) {
  const clientDir = path.resolve(__dirname, "public");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

async function bootstrap() {
  if (env.DATABASE_URL && process.env.AUTO_MIGRATE !== "false") {
    try {
      const folder = path.resolve(process.cwd(), "drizzle");
      await migrate(db, { migrationsFolder: folder });
      console.log("[MKA.P-MS] migrations appliquées");
    } catch (err) {
      console.error("[MKA.P-MS] échec migrations:", (err as Error).message);
    }
    // Synchronise la structure (modules, rôles, permissions, devises) à chaque
    // démarrage — 100 % idempotent. Garantit que le RBAC suit le code déployé.
    if (process.env.AUTO_SEED !== "false") {
      try {
        await seedStructure();
      } catch (err) {
        console.error("[MKA.P-MS] échec seed structure:", (err as Error).message);
      }
    }
  }
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[MKA.P-MS] serveur démarré sur le port ${env.PORT} (${env.NODE_ENV})`);
  });
}

bootstrap();
