import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { db } from "./db.js";
import { seedStructure } from "./seed.js";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { verifyToken } from "./auth.js";
import { handleStripeWebhook } from "./stripeWebhook.js";
import { injectAnnonceSeo, robotsTxt, sitemapXml } from "./seo.js";
import { env, isProd } from "./env.js";
import { readFile } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// Webhook Stripe : corps brut, AVANT express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json({ limit: "5mb" }));

// ─── UPLOAD FICHIERS (photos, PDF, documents) ───────────────
// Utiliser UPLOADS_DIR env var pour Railway volume persistant (/data/uploads)
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(process.cwd(), "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max (vidéos incluses)
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|heic|pdf|doc|docx|xls|xlsx|mp4|mov|webm|avi|mkv)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error("Type de fichier non autorisé"));
  },
});

// Servir les fichiers uploadés
app.use("/uploads", express.static(UPLOADS_DIR));

// Endpoint upload (authentifié, multi-fichiers)
app.post("/api/upload", upload.array("files", 20), (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: "Connexion requise" });
  }
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: "Aucun fichier" });
  const urls = files.map((f) => ({
    url: `/uploads/${f.filename}`,
    originalName: f.originalname,
    size: f.size,
    mimeType: f.mimetype,
  }));
  return res.json({ files: urls });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mkapms-web", env: env.NODE_ENV });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext }),
);

// Référencement Google (Partie 6) — disponibles en prod comme en dev.
app.get("/robots.txt", robotsTxt);
app.get("/sitemap.xml", sitemapXml);

// Sert le frontend compilé en production
if (isProd) {
  const clientDir = path.resolve(__dirname, "public");
  const indexPath = path.join(clientDir, "index.html");
  app.use(express.static(clientDir, { index: false }));
  app.get("*", async (req, res) => {
    try {
      const baseHtml = await readFile(indexPath, "utf8");
      const html = await injectAnnonceSeo(req, baseHtml);
      res.type("html").send(html);
    } catch {
      res.sendFile(indexPath);
    }
  });
}

async function runMigrations() {
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
}

// On démarre le serveur immédiatement (healthcheck OK), puis on migre en arrière-plan.
app.listen(env.PORT, "0.0.0.0", () => {
  const dbHost = (env.DATABASE_URL.match(/@([^/:]+)/)?.[1]) ?? "(non configurée)";
  console.log(`[MKA.P-MS] serveur démarré sur le port ${env.PORT} (${env.NODE_ENV}) — DB: ${dbHost}`);
  void runMigrations();
});
