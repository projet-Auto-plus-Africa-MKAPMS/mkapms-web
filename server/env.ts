// Chargement et validation des variables d'environnement.
function get(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  NODE_ENV: get("NODE_ENV", "development"),
  PORT: parseInt(get("PORT", "8080"), 10),
  DATABASE_URL: get("DATABASE_URL"),
  JWT_SECRET: get("JWT_SECRET", "dev-insecure-secret-change-me"),
  GOOGLE_CLIENT_ID: get("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: get("GOOGLE_CLIENT_SECRET"),
  // ─── Stripe (Payment Engine) ─────────────────────────────────────
  // Auto-injectées par Emergent (onglet "Payments") en préview et en prod.
  // - Test  : sk_test_… / pk_test_…  (aucun débit réel)
  // - Live  : sk_live_… / pk_live_…  (basculement auto après KYC validé)
  STRIPE_SECRET_KEY: get("STRIPE_SECRET_KEY"),
  STRIPE_PUBLISHABLE_KEY: get("STRIPE_PUBLISHABLE_KEY"),
  STRIPE_WEBHOOK_SECRET: get("STRIPE_WEBHOOK_SECRET"),
  STRIPE_ACCOUNT_ID: get("STRIPE_ACCOUNT_ID"),
  STRIPE_MODE: get("STRIPE_MODE", "test"), // "test" | "live"
  // ─────────────────────────────────────────────────────────────────
  PUBLIC_URL: get("PUBLIC_URL", "http://localhost:5173"),
  INDEXNOW_KEY: get("INDEXNOW_KEY"),
  // Google Search Console API (clics, impressions, position réels) — Phase 21.
  // Non branchée tant que la clé n'est pas fournie ; le tableau de bord
  // affiche alors uniquement les métriques mesurées en interne.
  GOOGLE_SEARCH_CONSOLE_KEY: get("GOOGLE_SEARCH_CONSOLE_KEY"),
  // Vérification de propriété Google (Search Console, Merchant Center).
  // Plusieurs jetons possibles, séparés par une virgule, sous la forme
  // « google<jeton>.html », « google<jeton> » ou « <jeton> » : permet de
  // vérifier un domaine sans déposer de fichier dans le dépôt.
  GOOGLE_SITE_VERIFICATION: get("GOOGLE_SITE_VERIFICATION"),
  // ─── Application Android (Play Store) ────────────────────────────
  // Identifiant du paquet et empreintes SHA-256 du certificat de signature,
  // séparées par une virgule. Tant que l'empreinte n'est pas fournie,
  // /.well-known/assetlinks.json n'invente rien : il répond « non configuré ».
  ANDROID_APP_ID: get("ANDROID_APP_ID", "com.mkapms.app"),
  ANDROID_APP_FINGERPRINTS: get("ANDROID_APP_FINGERPRINTS"),
  // ─── SEO Verification OS — autres moteurs de recherche & réseaux ─────
  // Complète GOOGLE_SITE_VERIFICATION (méthode fichier + meta) avec les
  // autres plateformes. Chaque valeur : coller UNIQUEMENT le content=
  // fourni par la plateforme. Vide → aucune balise émise.
  BING_SITE_VERIFICATION: get("BING_SITE_VERIFICATION"),
  YANDEX_VERIFICATION: get("YANDEX_VERIFICATION"),
  FACEBOOK_DOMAIN_VERIFICATION: get("FACEBOOK_DOMAIN_VERIFICATION"),
  PINTEREST_SITE_VERIFICATION: get("PINTEREST_SITE_VERIFICATION"),
};

export const isProd = env.NODE_ENV === "production";
export const isStripeLive = env.STRIPE_MODE === "live" && env.STRIPE_SECRET_KEY.startsWith("sk_live_");
