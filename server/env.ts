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
};

export const isProd = env.NODE_ENV === "production";
export const isStripeLive = env.STRIPE_MODE === "live" && env.STRIPE_SECRET_KEY.startsWith("sk_live_");
