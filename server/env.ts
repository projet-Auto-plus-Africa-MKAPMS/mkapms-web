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
  STRIPE_SECRET_KEY: get("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: get("STRIPE_WEBHOOK_SECRET"),
  PUBLIC_URL: get("PUBLIC_URL", "http://localhost:5173"),
};

export const isProd = env.NODE_ENV === "production";
