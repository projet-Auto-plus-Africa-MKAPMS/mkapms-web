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
import {
  googleFileTokens,
  refreshVerificationTokens,
  verificationStatus,
} from "./site-verification/index.js";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { verifyToken } from "./auth.js";
import { handleStripeWebhook } from "./stripeWebhook.js";
import { getStripe } from "./lib/stripe.js";
import {
  injectAnnonceSeo,
  robotsTxt,
  sitemapXml,
  sitemapStatic,
  sitemapAnnonces,
  sitemapGarages,
  sitemapAvis,
  sitemapPages,
  sitemapBlog,
} from "./seo.js";
import { aiAnswersFeed } from "./visibility-os/geo-engine.js";
import { domainMiddleware, domainHandler, domainsListHandler } from "./domain.js";
import { publicWriteGate } from "./resilience/gate.js";
import { apiV1 } from "./intelligences/api-v1.js";
import { env, isProd } from "./env.js";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_STARTED_AT = new Date().toISOString();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(domainMiddleware);
app.use(cookieParser());

// Webhook Stripe : corps brut, AVANT express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

// ─── ÉTAT DE SANTÉ STRIPE ─────────────────────────────────────────
// Endpoint public de vérification de la configuration Stripe.
// Retourne le mode (test / live), les clés configurées (masquées),
// et si le webhook secret est présent. Ne divulgue AUCUNE valeur secrète.
app.get("/api/stripe/health", async (_req, res) => {
  const configured = !!env.STRIPE_SECRET_KEY;
  const mask = (s: string) => (s ? `${s.slice(0, 8)}…${s.slice(-4)}` : null);
  const mode: "live" | "test" | "unconfigured" = !configured
    ? "unconfigured"
    : env.STRIPE_SECRET_KEY.startsWith("sk_live_")
      ? "live"
      : "test";
  let account: { id: string; charges_enabled: boolean; details_submitted: boolean } | null = null;
  const stripe = getStripe();
  if (stripe) {
    try {
      const acc = await stripe.accounts.retrieve();
      account = {
        id: acc.id,
        charges_enabled: acc.charges_enabled,
        details_submitted: acc.details_submitted,
      };
    } catch {
      // Compte inaccessible avec cette clé — non bloquant.
    }
  }
  res.json({
    configured,
    mode,
    secret_key: mask(env.STRIPE_SECRET_KEY),
    publishable_key: mask(env.STRIPE_PUBLISHABLE_KEY),
    webhook_secret_present: !!env.STRIPE_WEBHOOK_SECRET,
    account,
    ready_for_live_transactions: mode === "live" && !!account?.charges_enabled,
  });
});
// ──────────────────────────────────────────────────────────────────

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

/** Vrai si le fichier est un HEIC/HEVC iPhone (non décodable par sharp). */
function isHeicBuffer(buffer: Buffer): boolean {
  // Conteneur ISO-BMFF : ....ftyp<major_brand>
  if (buffer.length < 12 || buffer.toString("latin1", 4, 8) !== "ftyp") return false;
  const brand = buffer.toString("latin1", 8, 12);
  return ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(brand);
}

/**
 * `sharp` est distribué avec un libvips sans décodeur HEVC (contrainte de
 * brevet) : une photo iPhone en HEIC le fait échouer. `heic-decode` fournit ce
 * décodeur en JavaScript pur — la photo est acceptée telle qu'elle sort du
 * téléphone, sans demander à l'utilisateur de changer ses réglages.
 */
async function decodeHeic(buffer: Buffer): Promise<Buffer> {
  const { default: heicDecode } = await import("heic-decode");
  const { width, height, data } = await heicDecode({ buffer });
  return sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
    raw: { width, height, channels: 4 },
  })
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

async function processImage(buffer: Buffer): Promise<string> {
  const render = (input: Buffer, opts?: { tolerant?: boolean }) =>
    sharp(input, opts?.tolerant ? { failOn: "none" } : undefined)
      .rotate() // auto-rotation EXIF (photos mobile)
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

  let jpeg: Buffer;
  try {
    jpeg = await render(buffer);
  } catch (err) {
    if (isHeicBuffer(buffer)) {
      try {
        return `data:image/jpeg;base64,${(await decodeHeic(buffer)).toString("base64")}`;
      } catch (heicErr) {
        throw new Error(`photo iPhone (HEIC) illisible (${(heicErr as Error).message})`);
      }
    }
    // Seconde tentative tolérante : récupère les images légèrement tronquées
    // ou aux métadonnées invalides plutôt que de perdre la photo.
    try {
      jpeg = await render(buffer, { tolerant: true });
    } catch {
      throw new Error(`image illisible (${(err as Error).message})`);
    }
  }
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
    // Chaque fichier est traité isolément : une seule photo illisible ne doit
    // plus faire échouer tout l'envoi (l'utilisateur perdait la totalité de sa
    // sélection à cause d'un unique fichier).
    const settled = await Promise.allSettled(
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

    const results = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const errors = settled.flatMap((r, i) =>
      r.status === "rejected"
        ? [{ originalName: files[i].originalname, error: (r.reason as Error).message }]
        : [],
    );

    for (const e of errors) console.error(`[upload] ${e.originalName}: ${e.error}`);

    if (!results.length) {
      return res.status(422).json({
        error: `Aucune photo n'a pu être traitée — ${errors.map((e) => `${e.originalName} : ${e.error}`).join(" ; ")}`,
        errors,
      });
    }
    return res.json({ files: results, errors });
  });
});

// Endpoint domaine — renvoie le contexte (fr/pro/site) au client React
app.get("/api/domain", domainHandler);
// Endpoint liste des domaines actifs (pour sélecteurs dynamiques et admin)
app.get("/api/domains", domainsListHandler);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "mkapms-web", env: env.NODE_ENV });
});

// Version réelle du build en cours d'exécution — sert au client pour détecter
// une mise à jour déployée (comparaison du commit). Aucune valeur codée en dur.
let PKG_VERSION = "";
try {
  const raw = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  PKG_VERSION = (JSON.parse(raw) as { version?: string }).version ?? "";
} catch {
  PKG_VERSION = "";
}
const SERVER_COMMIT = (process.env.RAILWAY_GIT_COMMIT_SHA ?? "").slice(0, 7);
app.get("/api/version", (_req, res) => {
  res.json({
    version: PKG_VERSION,
    commit: SERVER_COMMIT,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID ?? null,
    startedAt: SERVER_STARTED_AT,
  });
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

// Point 127 — API interne versionnée des capacités MKA.P-MS Intelligences.
// Les moteurs et les applications demandent une capacité, jamais un fournisseur.
app.use("/api/v1", publicWriteGate, apiV1);

app.use(
  "/api/trpc",
  // Point 73 — fermeture au public réellement appliquée (l'administration passe).
  publicWriteGate,
  createExpressMiddleware({ router: appRouter, createContext }),
);

// Référencement Google (Partie 6) — disponibles en prod comme en dev.
app.get("/robots.txt", robotsTxt);
app.get("/sitemap.xml", sitemapXml);
app.get("/sitemap-static.xml", sitemapStatic);
app.get("/sitemap-annonces-:page.xml", sitemapAnnonces);
app.get("/sitemap-garages.xml", sitemapGarages);
app.get("/sitemap-avis.xml", sitemapAvis);
app.get("/sitemap-pages-:page.xml", sitemapPages);
app.get("/sitemap-blog.xml", sitemapBlog);
// Visibilité assistants / GEO — feed texte question/réponse découvrable par les assistants conversationnels
app.get("/assistants-ia.txt", aiAnswersFeed);

// Flux produit Merchant Center (points 95-96). Public par nécessité : Google
// doit pouvoir le lire. Il ne contient que des fiches réellement complètes et
// disponibles, et jamais un véhicule — exclu des fiches gratuites.
app.get("/feeds/produits.xml", async (_req, res) => {
  try {
    const { buildFeedXml } = await import("./product-engine/service.js");
    res.type("application/xml").send(await buildFeedXml());
  } catch {
    res.status(503).type("text/plain").send("Flux produit indisponible");
  }
});

// IndexNow — fichier de vérification de clé (requis pour la soumission).
if (env.INDEXNOW_KEY) {
  app.get(`/${env.INDEXNOW_KEY}.txt`, (_req, res) => {
    res.type("text/plain").send(env.INDEXNOW_KEY);
  });
}

// Vérification de propriété Google (Search Console, Merchant Center) par jeton
// en variable d'environnement : évite de dépendre d'un fichier déposé dans le
// dépôt, qui n'était pas publié et renvoyait 404 à Google.
// Les jetons acceptés viennent de la variable d'hébergeur et du jeton collé par
// le PDG dans la plateforme : la liste est donc relue à chaque requête.
app.get("/google:jeton.html", (req, res, next) => {
  const jeton = req.params.jeton;
  if (!googleFileTokens().includes(jeton)) return next();
  res.type("html").send(`google-site-verification: google${jeton}.html`);
});

// Application Android — vérification des liens (App Links). Sans empreinte de
// signature déclarée, on ne publie pas un fichier faux : Google doit lire un
// refus explicite plutôt qu'une association invalide.
app.get("/.well-known/assetlinks.json", (_req, res) => {
  const fingerprints = env.ANDROID_APP_FINGERPRINTS.split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => f.length > 0);

  if (fingerprints.length === 0) {
    return res.status(404).json({
      error: "assetlinks_non_configure",
      message:
        "Empreinte de signature Android absente : renseigner ANDROID_APP_FINGERPRINTS (Play Console → Intégrité de l'app → certificat de signature).",
    });
  }

  return res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: env.ANDROID_APP_ID,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
});

// Sert le frontend compilé en production
if (isProd) {
  const clientDir = path.resolve(__dirname, "public");
  const indexPath = path.join(clientDir, "index.html");
  app.use(express.static(clientDir, { index: false }));
  // Fichiers déposés directement dans « public/ » à la racine du dépôt
  // (vérifications Google, ads.txt…). Servis après le client compilé pour ne
  // jamais masquer un asset de build.
  app.use(express.static(path.resolve(process.cwd(), "public"), { index: false }));
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
    // Auto-correctif colonnes users (migration 0052) — idempotent IF NOT EXISTS
    // company_siren, has_vat, vat_number peuvent manquer si la migration Drizzle
    // a échoué ou n'a pas encore tourné. Sans elles, le login plante.
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_siren varchar(16)`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_vat boolean NOT NULL DEFAULT false`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS vat_number varchar(32)`);
      console.log("[MKA.P-MS] colonnes users (company_siren, has_vat, vat_number) vérifiées");
    } catch (err) {
      console.error("[MKA.P-MS] échec correctif colonnes users:", (err as Error).message);
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
    // Jetons de vérification de propriété saisis par le PDG : chargés une fois
    // au démarrage pour que les balises soient rendues dès la première requête.
    try {
      await refreshVerificationTokens();
    } catch (err) {
      console.error(
        "[MKA.P-MS] jetons de vérification non chargés:",
        (err as Error).message,
      );
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
    // Moteur de Redirection — connecte toute la plateforme : insère les règles
    // par défaut manquantes (univers, sous-sections, services, boutons/CTA).
    // Idempotent, non destructif : ne réécrase jamais une règle du PDG.
    try {
      const { ensureDefaultRules } = await import("./redirection-engine/index.js");
      const r = await ensureDefaultRules();
      console.log(`[MKA.P-MS] Redirection: ${r.inserted} règle(s) ajoutée(s), ${r.existing} déjà présente(s)`);
    } catch (err) {
      console.error("[MKA.P-MS] échec seed règles de redirection:", (err as Error).message);
    }
    // Pro Portal Engine — amorce le catalogue des métiers et des services
    // activables à la carte. Idempotent : n'écrase jamais une entrée existante,
    // de sorte qu'un métier ajouté en base survive à un redéploiement.
    try {
      const { seedProPortal } = await import("./pro-portal/index.js");
      const r = await seedProPortal();
      console.log(`[MKA.P-MS] Portail Pro: ${r.professions} métier(s), ${r.modules} service(s) ajouté(s)`);
    } catch (err) {
      console.error("[MKA.P-MS] échec seed Portail Pro:", (err as Error).message);
    }
    // Pro Account Engine — amorce les règles légales pays/métier. Idempotent :
    // une règle déjà en base fait autorité et n'est jamais réécrite.
    try {
      const { seedProAccountRules } = await import("./pro-account/index.js");
      const r = await seedProAccountRules();
      console.log(`[MKA.P-MS] Compte Pro: ${r.rules} règle(s) pays/métier ajoutée(s)`);
    } catch (err) {
      console.error("[MKA.P-MS] échec seed Compte Pro:", (err as Error).message);
    }
    // Payment Orchestrator — amorce le registre des prestataires. Idempotent :
    // un prestataire déjà configuré en base n'est jamais réécrit.
    try {
      const { seedProviders } = await import("./payment-orchestrator/index.js");
      const r = await seedProviders();
      console.log(`[MKA.P-MS] Orchestrateur paiement: ${r.inserted} prestataire(s) ajouté(s)`);
    } catch (err) {
      console.error("[MKA.P-MS] échec seed Orchestrateur paiement:", (err as Error).message);
    }
    // Vérifie que le prestataire accepte réellement nos identifiants. Une clé
    // invalide bloque TOUS les encaissements : la direction doit l'apprendre
    // au démarrage, pas par un client bloqué devant son panier.
    try {
      const { checkStripeKey } = await import("./lib/stripe.js");
      const s = await checkStripeKey(true);
      if (!s.configured) {
        console.warn("[MKA.P-MS] Paiement: aucune clé Stripe configurée — mode simulation.");
      } else if (!s.valid || !s.canCharge) {
        console.error(`[MKA.P-MS] Paiement INDISPONIBLE — ${s.reason}`);
        const { raiseAlert } = await import("./smart-engine/services/alert-engine.js");
        await raiseAlert({
          category: "paiement",
          level: "critical",
          title: "Paiements bloqués — identifiants prestataire refusés",
          description: s.reason,
          signature: "payment_provider_auth:stripe",
          lastOccurredAt: new Date(),
        });
      } else {
        console.log(`[MKA.P-MS] Paiement: clé Stripe ${s.kind} (${s.mode}) opérationnelle.`);
      }
    } catch (err) {
      console.error("[MKA.P-MS] échec vérification clé Stripe:", (err as Error).message);
    }
    // Système Intelligent — travail autonome périodique (lecture seule) : il
    // analyse les données réelles et PROPOSE des solutions/alertes que le PDG
    // valide ensuite. Aucune décision humaine n'est appliquée automatiquement.
    // Idempotent (propositions dédupliquées par signature), jamais bloquant.
    async function smartAutoWork() {
      try {
        const { generateOptimizations } = await import("./smart-engine/services/auto-optimization.js");
        const opt = await generateOptimizations();
        const { runAlertScan } = await import("./smart-engine/services/alert-engine.js");
        const alerts = await runAlertScan();
        // Partie 16 — Évolution autonome : dépose des propositions en
        // préproduction (statut brouillon). Jamais appliquées seules.
        const { generateEvolutionProposals } = await import("./smart-engine/services/autonomous-evolution.js");
        const evo = await generateEvolutionProposals();
        console.log(`[smart] travail autonome: ${opt.created} optimisation(s), ${alerts?.created ?? 0} alerte(s), ${evo.created} proposition(s) d'évolution`);
      } catch (err) {
        console.error("[smart] travail autonome échoué:", (err as Error).message);
      }
    }
    void smartAutoWork();
    setInterval(() => void smartAutoWork(), 6 * 60 * 60 * 1000);
  }
  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[MKA.P-MS] serveur démarré sur le port ${env.PORT} (${env.NODE_ENV})`);
    // Récapitulatif des vérifications de propriété du site actives.
    const seoActive = verificationStatus()
      .filter((s) => s.jetonsMasques.length > 0)
      .map((s) => `${s.label} (${s.depuisPlateforme ? "plateforme" : "hébergeur"})`);
    if (seoActive.length === 0) {
      console.warn(
        "[MKA.P-MS] Vérification propriété du site : aucun jeton. Le PDG peut le coller dans Indexation & visibilité → Propriété du site.",
      );
    } else {
      console.log(
        `[MKA.P-MS] Vérification propriété active (${seoActive.length}) : ${seoActive.join(" · ")}`,
      );
    }
    // Récapitulatif Digital Asset Links (Play Console).
    const androidFingerprints = env.ANDROID_APP_FINGERPRINTS.split(",").filter((f) => f.trim().length > 0);
    if (androidFingerprints.length === 0) {
      console.warn(
        `[MKA.P-MS] Play Console : ANDROID_APP_FINGERPRINTS absent — /.well-known/assetlinks.json répondra 404 (app ${env.ANDROID_APP_ID}). Voir docs/GOOGLE_PLAY_CONSOLE.md.`,
      );
    } else {
      console.log(
        `[MKA.P-MS] Play Console actif : ${androidFingerprints.length} empreinte(s) SHA-256 déclarée(s) pour ${env.ANDROID_APP_ID}.`,
      );
    }
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

  // Scheduler OS — exécute les tâches planifiées dues (rappels, renouvellements…)
  async function schedulerTick() {
    try {
      const { tick } = await import("./scheduler-os/index.js");
      const r = await tick();
      if (r.processed > 0 || r.failed > 0) {
        console.log(`[scheduler] ${r.processed} tâche(s) exécutée(s), ${r.failed} échec(s)`);
      }
    } catch (e) {
      console.error("[scheduler]", (e as Error).message);
    }
  }
  void schedulerTick();
  setInterval(() => void schedulerTick(), 60 * 1000);

  // Supervision continue des moteurs — le registre ne se rafraîchissait qu'au
  // démarrage : un moteur rétabli restait affiché en panne jusqu'au
  // redéploiement suivant. Les moteurs vivent désormais sans intervention.
  async function enginesTick() {
    try {
      const { superviseEngines } = await import("./engine-registry/bootstrap.js");
      await superviseEngines();
    } catch (e) {
      console.error("[engines]", (e as Error).message);
    }
  }
  setInterval(() => void enginesTick(), 5 * 60 * 1000);

  // Point 106 — reprise des événements publiés mais non remis. Sans cette
  // passe, un abonné momentanément en panne perdrait définitivement ce qui
  // s'est produit pendant sa panne.
  async function eventBusTick() {
    try {
      const { dispatchPending } = await import("./event-bus/service.js");
      await dispatchPending({ limit: 100, trigger: "auto" });
    } catch (e) {
      console.error("[event-bus]", (e as Error).message);
    }
  }
  setTimeout(() => void eventBusTick(), 45 * 1000);
  setInterval(() => void eventBusTick(), 5 * 60 * 1000);

  // Points 108-113 — contrôle continu. « Testé » ne vaut que daté : sans passe
  // automatique, la preuve vieillit et l'audit d'activation resterait vert sur
  // un contrôle d'il y a trois semaines.
  async function continuousTestTick() {
    try {
      const { runTests } = await import("./continuous-test/service.js");
      const r = await runTests({ trigger: "auto" });
      if (r.echecs > 0) {
        console.error(
          `[continuous-test] campagne #${r.runId} : ${r.echecs} échec(s), ${r.regressions} régression(s).`,
        );
      }
    } catch (e) {
      console.error("[continuous-test]", (e as Error).message);
    }
  }
  setTimeout(() => void continuousTestTick(), 3 * 60 * 1000);
  setInterval(() => void continuousTestTick(), 6 * 3600 * 1000);

  // Points 116-117-118 — l'agent code en mode observation. Il relève le code
  // réellement déployé, apprend ce qui a changé depuis le relevé précédent, et
  // retient les corrections des autres agents par classe d'anomalie. Il n'écrit
  // rien : observer d'abord, proposer ensuite.
  async function codeGraphTick() {
    try {
      const { ingest, apprendre } = await import("./code-graph/service.js");
      const r = await ingest();
      if (!r.ok) console.error("[code-graph]", r.motif);
      else if (r.observations > 0) console.log(`[code-graph] ${r.motif}`);
      const l = await apprendre();
      if (l.nouvelles > 0)
        console.log(`[code-graph] ${l.nouvelles} leçon(s) apprise(s), ${l.renforcees} renforcée(s).`);
    } catch (e) {
      console.error("[code-graph]", (e as Error).message);
    }
  }
  setTimeout(() => void codeGraphTick(), 90 * 1000);
  setInterval(() => void codeGraphTick(), 12 * 3600 * 1000);

  // Points 119-120-121 — l'état d'achèvement est recalculé tout seul : « ce qui
  // reste à faire » ne dépend pas de quelqu'un qui pense à cliquer, et ne peut
  // pas vieillir sans que le contrôle continu le dise.
  async function completionTick() {
    try {
      const { evaluer } = await import("./completion/service.js");
      const r = await evaluer({ trigger: "planifie" });
      console.log(
        `[completion] ${r.termines}/${r.domaines} domaine(s) TERMINÉ, avancement ${r.avancement} %, ${r.resteAFaire.length} tâche(s) restante(s).`,
      );
    } catch (e) {
      console.error("[completion]", (e as Error).message);
    }
  }
  setTimeout(() => void completionTick(), 150 * 1000);
  setInterval(() => void completionTick(), 24 * 3600 * 1000);

  // Intelligence financière — analyse autonome : une anomalie financière ne
  // doit jamais rester silencieuse, même si personne ne consulte le tableau.
  async function financeTick() {
    try {
      const { analyzeFinances } = await import("./financial-intelligence/index.js");
      const r = await analyzeFinances();
      if (r.nouvelles > 0) {
        console.log(`[finance] ${r.nouvelles} nouvelle(s) anomalie(s) financière(s)`);
      }
    } catch (e) {
      console.error("[finance]", (e as Error).message);
    }
  }
  setInterval(() => void financeTick(), 60 * 60 * 1000);

  // Comptabilité interne — rapprochement automatique : un paiement encaissé
  // sans écriture, c'est de l'argent en banque absent des comptes. Les
  // écritures créées restent « à valider » : aucune validation automatique.
  async function reconcileTick() {
    try {
      const { reconcilePayments } = await import("./accounting-internal/index.js");
      const r = await reconcilePayments();
      if (r.rapproches > 0 || r.ecarts > 0) {
        console.log(`[compta] ${r.rapproches} paiement(s) rapproché(s), ${r.ecarts} écart(s)`);
      }
    } catch (e) {
      console.error("[compta]", (e as Error).message);
    }
  }
  setInterval(() => void reconcileTick(), 60 * 60 * 1000);

  // Auction Engine — clôture des enchères échues. Sans ce cycle, une enchère
  // terminée resterait « en cours » sans jamais désigner de gagnant.
  async function auctionTick() {
    try {
      const { closeExpiredAuctions } = await import("./auction-engine/index.js");
      const closed = await closeExpiredAuctions();
      if (closed.length > 0) {
        console.log(`[encheres] ${closed.length} enchère(s) clôturée(s)`);
      }
    } catch (e) {
      console.error("[encheres]", (e as Error).message);
    }
  }
  setInterval(() => void auctionTick(), 60 * 1000);

  // Partner Engine — détection des zones où la demande dépasse l'offre. Le
  // cycle ne fait que mesurer et ouvrir des opportunités : la préparation des
  // actions d'acquisition (page SEO, contenus, campagne) reste une décision
  // humaine, et rien n'est publié automatiquement.
  async function partnerTick() {
    try {
      const { detectOpportunities } = await import("./partner-engine/service.js");
      const r = await detectOpportunities(30);
      if (r.created > 0) {
        console.log(`[partenaires] ${r.created} opportunité(s) ouverte(s), ${r.updated} mise(s) à jour`);
      }
    } catch (e) {
      console.error("[partenaires]", (e as Error).message);
    }
  }
  setTimeout(() => void partnerTick(), 5 * 60 * 1000);
  setInterval(() => void partnerTick(), 6 * 60 * 60 * 1000);

  // Rapport quotidien de la direction (point 39) — il n'était calculé qu'à
  // l'ouverture de l'écran : aucune trace et rien de remis si personne ne le
  // consultait. Il est désormais archivé et remis chaque soir avant 23 h. Le
  // cycle est idempotent : un rapport déjà remis n'est pas renvoyé.
  async function dailyReportDeliveryTick() {
    try {
      const { dailyReportTick } = await import("./smart-engine/services/daily-report-delivery.js");
      const r = await dailyReportTick();
      if (r) {
        console.log(
          `[rapport] rapport du ${r.date} : ${r.status}, ${r.anomalies} anomalie(s) dont ${r.critiques} critique(s)`,
        );
      }
    } catch (e) {
      console.error("[rapport]", (e as Error).message);
    }
  }
  setTimeout(() => void dailyReportDeliveryTick(), 10 * 60 * 1000);
  setInterval(() => void dailyReportDeliveryTick(), 30 * 60 * 1000);
}

bootstrap();
