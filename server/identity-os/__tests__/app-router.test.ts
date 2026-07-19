/**
 * Smoke test — assemblage complet de l'appRouter avec Identity OS branché.
 * Vérifie qu'aucun namespace n'est cassé côté serveur.
 */
import { appRouter } from "../../router.js";

const procs = (appRouter as any)._def?.procedures ?? {};
const identityKeys = Object.keys(procs)
  .filter((k) => k.startsWith("identity."))
  .sort();

if (identityKeys.length === 0) {
  console.error("❌ identity.* absent de l'appRouter");
  process.exit(1);
}

console.log(`✅ appRouter — identity.* branché (${identityKeys.length} procédures)`);
identityKeys.forEach((k) => console.log("   -", k));

// Sanity : le namespace `auth.*` legacy doit rester intact (non régression).
const authKeys = Object.keys(procs).filter((k) => k.startsWith("auth."));
if (authKeys.length === 0) {
  console.error("❌ Régression : auth.* legacy a disparu");
  process.exit(2);
}
console.log(`✅ auth.* legacy conservé (${authKeys.length} procédures)`);

// Compte total des procédures — utile pour détecter une chute massive.
console.log(`ℹ️  Total procédures appRouter : ${Object.keys(procs).length}`);
