/**
 * Document OS — registre des entités juridiques : tests réels, base réelle.
 *
 * Couvre la clarification explicite de la direction : MKA.P-MS est une
 * identité internationale d'origine guinéenne, la France est une entité
 * locale d'exploitation parmi d'autres — jamais un repli mondial par
 * défaut. Vérifie qu'aucun document ne peut afficher silencieusement une
 * identité française sans qu'une entité juridique explicite l'ait demandé,
 * et qu'un document juridiquement engageant reste bloqué en brouillon sans
 * entité réelle (règle #5).
 *
 * Lancement : `npx tsx server/document-os/__tests__/legal-entities.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { docDocuments, docLegalEntities } from "../index.js";
import {
  CHAMP_A_COMPLETER,
  createDocument,
  ensureDefaultLegalEntities,
  renderDocumentPourEntite,
  resolveLegalEntity,
  signDocument,
  updateDocumentStatus,
} from "../index.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const TEMPLATE_TEST = "<div>{{issuer_name}} — {{issuer_address}} — {{issuer_legal_line}} — origine {{brand_origin}}</div>";

async function main() {
  await ensureDefaultLegalEntities();

  // ── 1. Guinée est l'entité d'origine, ses champs légaux restent NULL (jamais inventés) ──
  const guinee = await resolveLegalEntity("guinee");
  verif("1. entité guinee existe", guinee !== null);
  verif("1. guinee est bien marquée entité d'origine", guinee?.isOriginEntity === true);
  verif("1. guinee n'a aucune donnée légale inventée (legalName null)", guinee?.legalName === null);
  verif("1. guinee n'a aucune donnée légale inventée (registrationNumber null)", guinee?.registrationNumber === null);

  // ── 2. France reste une entité locale, PAS l'entité d'origine ──────────
  const france = await resolveLegalEntity("france");
  verif("2. entité france existe", france !== null);
  verif("2. france n'est jamais l'entité d'origine", france?.isOriginEntity === false);

  // ── 3. Sans entité résolue : jamais un repli silencieux vers la France ──
  const rendSansEntite = await renderDocumentPourEntite(TEMPLATE_TEST, {}, null);
  verif("3. sans entité : issuer_name = [À COMPLÉTER], jamais 'MKA.P-MS SAS'", rendSansEntite.includes(`${CHAMP_A_COMPLETER} —`) && !rendSansEntite.includes("MKA.P-MS SAS"));
  verif("3. sans entité : aucune adresse française par défaut", !rendSansEntite.includes("Champs-Élysées"));

  // ── 4. Entité Guinée résolue : libellés RCCM/NIF, jamais SIRET/TVA ──────
  const rendGuinee = await renderDocumentPourEntite(TEMPLATE_TEST, {}, "guinee");
  verif("4. entité guinee : libellé RCCM/NIF utilisé", rendGuinee.includes("RCCM") && rendGuinee.includes("NIF"));
  verif("4. entité guinee : jamais le libellé français SIRET/TVA", !rendGuinee.includes("SIRET") && !rendGuinee.includes("TVA"));
  verif("4. entité guinee : données non fournies affichées [À COMPLÉTER], jamais inventées", rendGuinee.includes(CHAMP_A_COMPLETER));
  verif("4. brand_origin toujours République de Guinée, quelle que soit l'entité opérationnelle", rendGuinee.includes("République de Guinée"));

  // ── 5. Entité France résolue : libellés SIRET/TVA, données réelles du registre ──
  const rendFrance = await renderDocumentPourEntite(TEMPLATE_TEST, {}, "france");
  verif("5. entité france : libellé SIRET/TVA utilisé", rendFrance.includes("SIRET") && rendFrance.includes("TVA"));
  verif("5. entité france : nom légal du registre utilisé", rendFrance.includes("MKA.P-MS SAS"));
  verif("5. brand_origin reste République de Guinée même pour un document France (identité mondiale inchangée)", rendFrance.includes("République de Guinée"));

  // ── 6. Document engageant sans entité : bloqué en brouillon, jamais émis silencieusement ──
  const docSansEntite = await createDocument({ typeCode: "facture", amountTtc: 100, currency: "EUR" });
  const apresEmission = await updateDocumentStatus(docSansEntite.id, "emis");
  verif("6. facture sans entité : reste en brouillon (bloquée, règle #5)", apresEmission?.status === "brouillon");
  const apresSignature = await signDocument(docSansEntite.id, { name: "Test" });
  verif("6. facture sans entité : signature bloquée aussi", apresSignature?.status === "brouillon");

  // ── 7. Document engageant AVEC entité : l'émission fonctionne réellement ──
  const docAvecEntite = await createDocument({ typeCode: "facture", amountTtc: 100, currency: "EUR", legalEntityCode: "guinee" });
  const emis = await updateDocumentStatus(docAvecEntite.id, "emis");
  verif("7. facture avec entité guinee : émission réussie", emis?.status === "emis");

  // ── 8. Document non engageant (pas de montant, pas dans la liste contractuelle) : jamais bloqué ──
  const docInstitutionnel = await createDocument({ typeCode: "rapport_expertise" });
  const emisInstitutionnel = await updateDocumentStatus(docInstitutionnel.id, "emis");
  verif("8. document sans montant, non contractuel : émission libre, aucune entité requise", emisInstitutionnel?.status === "emis");

  // Nettoyage des documents de test.
  for (const id of [docSansEntite.id, docAvecEntite.id, docInstitutionnel.id]) {
    await db.delete(docDocuments).where(eq(docDocuments.id, id));
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
