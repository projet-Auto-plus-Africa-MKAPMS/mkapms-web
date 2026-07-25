import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import multer from "multer";
import sharp from "sharp";
import { db } from "./db.js";
import { annonces, users, notifications } from "./schema.js";
import { sql, and, lt, eq } from "drizzle-orm";
import { sendEmail, emailAnnonceExpiree } from "./services/email.js";
import { seedStructure } from "./seed.js";
import { bootstrapEngines } from "./engine-registry/bootstrap.js";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { verifyToken } from "./auth.js";
import { handleStripeWebhook } from "./stripeWebhook.js";
import { injectAnnonceSeo, robotsTxt, sitemapXml } from "./seo.js";
import { domainMiddleware, domainHandler, domainsListHandler } from "./domain.js";
import { env, isProd } from "./env.js";
import { readFile } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(domainMiddleware);
app.use(cookieParser());

// Webhook Stripe : corps brut, AVANT express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json({ limit: "50mb" }));

// ─── UPLOAD FICHIERS (photos, PDF, documents) ───────────────
// Les images sont converties en JPEG via sharp, compressées, puis stockées
// en data URI base64. Zéro dépendance au système de fichiers → les photos
// survivent aux redéploiements Railway (plus de disparition).
// Tous les formats mobiles (HEIC, HEIF, AVIF, WebP) sont convertis en JPEG.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExt = /\.(jpg|jpeg|png|gif|webp|heic|heif|avif|pdf|doc|docx|xls|xlsx|mp4|mov|webm|avi|mkv|3gp|m4v)$/i;
    const allowedMime = /^(image|video|application\/pdf|application\/msword|application\/vnd|application\/octet-stream)/i;
    const ext = path.extname(file.originalname);
    if (allowedExt.test(ext) || allowedMime.test(file.mimetype)) cb(null, true);
    else cb(new Error(`Type de fichier non autorisé: ${file.originalname} (${file.mimetype})`));
  },
});

async function processImage(buffer: Buffer): Promise<string> {
  const jpeg = await sharp(buffer)
    .rotate() // auto-rotation EXIF (photos mobile)
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

// Endpoint upload (authentifié, multi-fichiers)
app.post("/api/upload", (req, res) => {
  upload.array("files", 20)(req, res, async (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError
        ? (err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (max 50 MB)" : `Erreur upload: ${err.message}`)
        : (err.message || "Erreur lors de l'upload");
      return res.status(400).json({ error: msg });
    }
    const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ error: "Connexion requise — veuillez vous reconnecter" });
    }
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: "Aucun fichier reçu" });
    try {
      const results = await Promise.all(
        files.map(async (f) => {
          const isImage = /^image\//i.test(f.mimetype) || /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(f.originalname);
          if (isImage) {
            const dataUri = await processImage(f.buffer);
            return { url: dataUri, originalName: f.originalname, size: f.size, mimeType: "image/jpeg" };
          }
          // Non-image (PDF, vidéo) : base64 brut
          const b64 = `data:${f.mimetype};base64,${f.buffer.toString("base64")}`;
          return { url: b64, originalName: f.originalname, size: f.size, mimeType: f.mimetype };
        }),
      );
      return res.json({ files: results });
    } catch (e: any) {
      console.error("[upload] processing error:", e.message);
      return res.status(500).json({ error: "Erreur lors du traitement des photos. Réessayez." });
    }
  });
});

// Endpoint domaine — renvoie le contexte (fr/pro/site) au client React
app.get("/api/domain", domainHandler);
// Endpoint liste des domaines actifs (pour sélecteurs dynamiques et admin)
app.get("/api/domains", domainsListHandler);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mkapms-web", env: env.NODE_ENV });
});

/**
 * Health check DB — vérifie que les colonnes critiques sont présentes.
 * Objectif : détecter en 1 requête tout futur décalage entre le code
 * déployé et le schéma appliqué (racine du bug « annonces invisibles »).
 * Public en lecture — ne divulgue aucune donnée.
 */
app.get("/api/health/db", async (_req, res) => {
  const critical: Record<string, string[]> = {
    annonces: [
      "id", "titre", "prix", "status", "type", "categorie", "categorie_annonce",
      "vendeur_type", "owner_id", "published_at", "created_at",
      "garanties", "points_forts", "equipements", "imperfections",
    ],
  };
  const problems: Array<{ table: string; missing: string[] }> = [];
  try {
    for (const [table, cols] of Object.entries(critical)) {
      const rows = await db.execute(
        sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=${table}`,
      );
      const present = new Set((rows.rows as Array<{ column_name: string }>).map((r) => r.column_name));
      const missing = cols.filter((c) => !present.has(c));
      if (missing.length) problems.push({ table, missing });
    }
    if (problems.length > 0) {
      return res.status(503).json({ status: "degraded", problems });
    }
    return res.json({ status: "ok", tablesChecked: Object.keys(critical) });
  } catch (err) {
    return res.status(500).json({ status: "down", message: (err as Error).message });
  }
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

async function bootstrap() {
  if (env.DATABASE_URL && process.env.AUTO_MIGRATE !== "false") {
    try {
      const folder = path.resolve(process.cwd(), "drizzle");
      await migrate(db, { migrationsFolder: folder });
      console.log("[MKA.P-MS] migrations appliquées");
    } catch (err) {
      // FAIL-FAST — Une migration échouée en production laissait auparavant
      // le serveur démarrer avec un schéma incohérent (colonnes manquantes
      // → toutes les requêtes annonces cassées, invisibles côté public).
      // On refuse désormais de démarrer avec la DB dans cet état, sauf si
      // AUTO_MIGRATE_STRICT est explicitement mis à "false" (mode secours).
      console.error("[MKA.P-MS] échec migrations:", (err as Error).message);
      if (process.env.AUTO_MIGRATE_STRICT !== "false") {
        console.error("[MKA.P-MS] arrêt du démarrage pour préserver la cohérence des données.");
        console.error("[MKA.P-MS] pour forcer un démarrage en mode secours: AUTO_MIGRATE_STRICT=false");
        process.exit(1);
      }
    }
    // Vérification post-migration — s'assure que les colonnes critiques
    // d'annonces existent réellement. Auto-correctif si absentes.
    try {
      const { sql: rawSql } = await import("drizzle-orm");
      const critical = ["garanties", "points_forts", "equipements", "imperfections"];
      for (const col of critical) {
        await db.execute(rawSql`ALTER TABLE annonces ADD COLUMN IF NOT EXISTS ${rawSql.identifier(col)} jsonb DEFAULT '[]'::jsonb`);
      }
      console.log("[MKA.P-MS] colonnes annonces vérifiées");
    } catch (err) {
      console.error("[MKA.P-MS] échec vérification colonnes annonces:", (err as Error).message);
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
    // Auto-enregistrement des moteurs (Core, Smart, Permission, Redirection…)
    // dans le registre : vérification de contrat, dépendances et santé.
    // Ne bloque jamais le démarrage (erreurs journalisées).
    try {
      await bootstrapEngines();
      console.log("[MKA.P-MS] moteurs enregistrés dans le registre");
    } catch (err) {
      console.error("[MKA.P-MS] échec bootstrap moteurs:", (err as Error).message);
    }
    // Document OS — templates par défaut FR (facture, devis, contrat, ...)
    // avec le logo officiel MKA.P-MS intégré. Idempotent.
    try {
      const { ensureDefaultTemplates } = await import("./document-os/templates.js");
      const r = await ensureDefaultTemplates();
      console.log(`[MKA.P-MS] Document OS: templates prêts (${r.inserted} synchronisés, ${r.skipped} sautés)`);
    } catch (err) {
      console.error("[MKA.P-MS] échec seed templates Document OS:", (err as Error).message);
    }
  }
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[MKA.P-MS] serveur démarré sur le port ${env.PORT} (${env.NODE_ENV})`);
  });

  // Auto-expiration des annonces (vérification toutes les heures)
  async function expireAnnonces() {
    try {
      const now = new Date();
      // Récupérer les annonces à expirer AVANT de les marquer (pour envoi email)
      const toExpire = await db.select({ id: annonces.id, titre: annonces.titre, ownerId: annonces.ownerId })
        .from(annonces)
        .where(and(eq(annonces.status, "publiee"), lt(annonces.expiresAt, now)));

      if (toExpire.length === 0) return;

      await db.update(annonces)
        .set({ status: "expiree" })
        .where(and(eq(annonces.status, "publiee"), lt(annonces.expiresAt, now)));

      // Notifications expiration (email + in-app)
      for (const a of toExpire) {
        try {
          const [owner] = await db.select().from(users).where(eq(users.id, a.ownerId)).limit(1);
          if (owner?.email) {
            const { subject, html } = emailAnnonceExpiree(a.titre || "Annonce", a.id);
            sendEmail(owner.email, subject, html);
          }
          await db.insert(notifications).values({
            userId: a.ownerId,
            type: "annonce",
            title: `Annonce expir\u00e9e : ${a.titre || "Annonce"}`,
            body: "Prolongez-la depuis Mes annonces pour la remettre en ligne.",
            url: `/compte`,
          });
        } catch (_) { /* non-bloquant */ }
      }
      console.log(`[expireAnnonces] ${toExpire.length} annonce(s) expirée(s)`);
    } catch (e) {
      console.error("[expireAnnonces]", e);
    }
  }
  expireAnnonces();
  setInterval(expireAnnonces, 60 * 60 * 1000);
}

bootstrap();
