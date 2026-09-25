/**
 * Mémoires propres (entreprise/décisions/apprentissage) et passages de
 * pipeline réels : prouve que seedFondations()/seedPipelines() écrivent
 * réellement en base, que l'écriture est idempotente (un second appel ne
 * duplique rien), et que le compteur "erreurs et solutions" (memoire.ts,
 * volumeFedere) compte désormais correctement les passages réels au lieu de
 * comparer à un statut "reussi" qui n'a jamais existé.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/fondations.test.ts`
 */
import assert from "node:assert/strict";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { inMemoire } from "../schema.js";
import { rsPipelineRuns } from "../../resilience/schema.js";
import { FONDATIONS, seedFondations, seedPipelines } from "../fondations.js";
import { etat } from "../memoire.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function nettoyer() {
  const cles = FONDATIONS.map((f) => f.cle);
  await db.delete(inMemoire).where(
    and(
      inArray(inMemoire.categorie, ["entreprise", "decisions", "apprentissage"] as const),
      inArray(inMemoire.cle, cles),
    ),
  );
  await db.delete(rsPipelineRuns).where(inArray(rsPipelineRuns.originRef, ["pr-453", "pr-454"]));
}

async function main() {
  await nettoyer();

  const premierMemoire = await seedFondations();
  verif("1. seedFondations() écrit bien les 9 fondations la première fois", premierMemoire.nouvelles === 9);

  const secondMemoire = await seedFondations();
  verif("2. seedFondations() est idempotent : rien de nouveau au second appel", secondMemoire.nouvelles === 0);

  const [ligneEntreprise] = await db
    .select()
    .from(inMemoire)
    .where(and(eq(inMemoire.categorie, "entreprise"), eq(inMemoire.cle, "isolation-shop-plateforme-principale")))
    .limit(1);
  verif("3. la fondation « entreprise » est bien lisible et non vide", !!ligneEntreprise && ligneEntreprise.contenu.length > 50);

  const premierPipeline = await seedPipelines();
  verif("4. seedPipelines() enregistre les 2 passages réels la première fois", premierPipeline.nouveaux === 2);

  const secondPipeline = await seedPipelines();
  verif("5. seedPipelines() est idempotent : rien de nouveau au second appel", secondPipeline.nouveaux === 0);

  const [passage453] = await db
    .select()
    .from(rsPipelineRuns)
    .where(eq(rsPipelineRuns.originRef, "pr-453"))
    .limit(1);
  verif("6. le passage pr-453 a bien atteint le statut « surveille » (production + monitoring réels)", passage453?.status === "surveille");
  verif("7. le passage pr-453 porte bien les 11 étapes réellement franchies", passage453?.steps.length === 11);

  const etats = await etat();
  const erreurs = etats.find((e) => e.code === "erreurs");
  verif("8. la mémoire « erreurs et solutions » (fédérée) compte désormais au moins 2 passages réels", (erreurs?.volume ?? 0) >= 2);
  verif("9. aucun des deux passages réels n'est compté comme bloqué (tous deux allés jusqu'en production surveillée)", erreurs?.motif?.includes("dont 0 bloqué") ?? false);

  const decisions = etats.find((e) => e.code === "decisions");
  const entreprise = etats.find((e) => e.code === "entreprise");
  const apprentissage = etats.find((e) => e.code === "apprentissage");
  verif("10. « Mémoire décisions » n'est plus à zéro", (decisions?.volume ?? 0) >= 3);
  verif("11. « Mémoire entreprise » n'est plus à zéro", (entreprise?.volume ?? 0) >= 3);
  verif("12. « Mémoire apprentissage » n'est plus à zéro", (apprentissage?.volume ?? 0) >= 3);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
