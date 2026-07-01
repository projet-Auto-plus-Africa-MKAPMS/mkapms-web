import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { env } from "./env.js";
import * as schema from "./schema.js";

const { Pool } = pkg;

// SSL requis pour les connexions via proxy public Railway, inutile en interne.
const needsSsl =
  /proxy\.rlwy\.net|\.railway\.app|sslmode=require/.test(env.DATABASE_URL) &&
  !/railway\.internal/.test(env.DATABASE_URL);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[db] pool error:", err.message);
});

export const db = drizzle(pool, { schema });
export { schema };
