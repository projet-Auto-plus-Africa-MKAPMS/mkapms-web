// Applique les migrations Drizzle générées dans /drizzle.
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./db.js";

async function main() {
  console.log("[migrate] application des migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] terminé.");
  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] échec:", err);
  process.exit(1);
});
