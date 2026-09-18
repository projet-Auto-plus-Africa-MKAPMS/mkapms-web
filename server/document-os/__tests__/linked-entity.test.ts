/**
 * Document OS — rattachement à l'objet métier réel (règle maître
 * documentaire #10) : tests réels, base réelle.
 *
 * recordEdition() est le chemin réellement emprunté par les écrans qui
 * tracent une édition A4 (imprimerFeuille/telechargerCSV côté client) — avant
 * ce lot, aucun document tracé par ce chemin ne portait jamais de
 * linkedEntityType/linkedEntityId, même quand l'écran appelant connaissait
 * déjà l'entité réelle (annonce, enchère...).
 *
 * Lancement : `npx tsx server/document-os/__tests__/linked-entity.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { docDocuments, recordEdition } from "../index.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  // ── 1. Avec entité fournie : réellement enregistrée sur le document ────
  const avecEntite = await recordEdition({
    typeCode: "attestation",
    canal: "impression",
    ecran: "/vente/attestation-vente/42",
    titre: "Attestation de cession",
    linkedEntityType: "annonce",
    linkedEntityId: 42,
  });
  verif("1. recordEdition avec entité : ok", avecEntite.ok === true);
  const [rowAvec] = await db.select().from(docDocuments).where(eq(docDocuments.reference, avecEntite.reference!)).limit(1);
  verif("1. linkedEntityType réellement stocké", rowAvec?.linkedEntityType === "annonce");
  verif("1. linkedEntityId réellement stocké", rowAvec?.linkedEntityId === 42);

  // ── 2. Sans entité (rapport agrégé légitime) : jamais une valeur inventée ──
  const sansEntite = await recordEdition({
    typeCode: "rapport_tva",
    canal: "fichier",
    ecran: "/comptabilite/tva",
    titre: "Rapport TVA mensuel",
  });
  verif("2. recordEdition sans entité : ok quand même", sansEntite.ok === true);
  const [rowSans] = await db.select().from(docDocuments).where(eq(docDocuments.reference, sansEntite.reference!)).limit(1);
  verif("2. aucune entité inventée : linkedEntityType null", rowSans?.linkedEntityType === null);
  verif("2. aucune entité inventée : linkedEntityId null", rowSans?.linkedEntityId === null);

  // Nettoyage.
  for (const ref of [avecEntite.reference, sansEntite.reference]) {
    if (ref) await db.delete(docDocuments).where(eq(docDocuments.reference, ref));
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
