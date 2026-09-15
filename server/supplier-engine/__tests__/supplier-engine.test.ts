/**
 * Supplier Engine — LOT 1 du Plan Maître Fournisseurs : tests réels, base de
 * données réelle. Couvre le registre, l'onboarding, le Connector Engine
 * (avec et sans secret réel), l'Universal Mapping Engine et l'audit.
 *
 * Lancement : `npx tsx server/supplier-engine/__tests__/supplier-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { partners } from "../../modules/operations.js";
import {
  supplierAuditLog,
  supplierConnections,
  supplierContacts,
  supplierMappings,
  supplierOnboardingSteps,
  supplierProfiles,
} from "../schema.js";
import * as supplier from "../service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ACTOR_ID = 4; // compte PDG de test, déjà utilisé par les autres suites du dépôt.
const NOM_PARTENAIRE_FOURNISSEUR = "Test Supplier Engine — Pièces SARL";
const NOM_PARTENAIRE_INCOMPATIBLE = "Test Supplier Engine — Garage incompatible";

async function nettoyer() {
  const testPartners = await db
    .select({ id: partners.id })
    .from(partners)
    .where(eq(partners.name, NOM_PARTENAIRE_FOURNISSEUR));
  const testPartnersIncompatibles = await db
    .select({ id: partners.id })
    .from(partners)
    .where(eq(partners.name, NOM_PARTENAIRE_INCOMPATIBLE));

  for (const p of [...testPartners, ...testPartnersIncompatibles]) {
    const profils = await db.select({ id: supplierProfiles.id }).from(supplierProfiles).where(eq(supplierProfiles.partnerId, p.id));
    for (const profil of profils) {
      await db.delete(supplierAuditLog).where(eq(supplierAuditLog.supplierProfileId, profil.id));
      await db.delete(supplierOnboardingSteps).where(eq(supplierOnboardingSteps.supplierProfileId, profil.id));
      await db.delete(supplierConnections).where(eq(supplierConnections.supplierProfileId, profil.id));
      await db.delete(supplierMappings).where(eq(supplierMappings.supplierProfileId, profil.id));
      await db.delete(supplierContacts).where(eq(supplierContacts.supplierProfileId, profil.id));
      await db.delete(supplierProfiles).where(eq(supplierProfiles.id, profil.id));
    }
    await db.delete(partners).where(eq(partners.id, p.id));
  }
}

async function main() {
  await nettoyer();

  // ── 0. Partenaires de test ────────────────────────────────────────────
  const [partenaireFournisseur] = await db
    .insert(partners)
    .values({ name: NOM_PARTENAIRE_FOURNISSEUR, type: "fournisseur_pieces", country: "FR", active: true })
    .returning();
  const [partenaireIncompatible] = await db
    .insert(partners)
    .values({ name: NOM_PARTENAIRE_INCOMPATIBLE, type: "garage", country: "FR", active: true })
    .returning();

  // ── 1. Registre : refus si le partenaire n'est ni fournisseur ni transporteur ──
  await assert.rejects(
    () =>
      supplier.creerFournisseur({
        partnerId: partenaireIncompatible.id,
        supplierType: "pieces",
        companyLegalName: "X",
        countryCode: "FR",
        createdBy: ACTOR_ID,
      }),
    /ni un fournisseur ni un transporteur/i,
  );
  verif("1. un partenaire de type garage ne peut pas devenir profil fournisseur", true);

  const profil = await supplier.creerFournisseur({
    partnerId: partenaireFournisseur.id,
    supplierType: "pieces",
    companyLegalName: "Pièces SARL (raison sociale complète)",
    registrationNumber: "12345678900012",
    countryCode: "FR",
    createdBy: ACTOR_ID,
  });
  verif("1. création réelle en base au-dessus du partenaire", profil.id > 0 && profil.status === "brouillon");
  verif("1. référence unique générée", profil.reference.startsWith("SUP-"));

  // ── 2. Onboarding : activation refusée avant contrat + KYB ────────────
  await assert.rejects(() => supplier.activerFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID }), /contrat signé/i);
  verif("2. activation refusée avant contrat signé", true);

  await supplier.verifierEntreprise({ supplierProfileId: profil.id, decision: "refuse", actorId: ACTOR_ID, note: "pièce manquante" });
  await assert.rejects(() => supplier.validerParDirection({ supplierProfileId: profil.id, actorId: ACTOR_ID }), /KYB/i);
  verif("2. validation Direction refusée tant que le KYB n'est pas vérifié", true);

  await supplier.verifierEntreprise({ supplierProfileId: profil.id, decision: "verifie", actorId: ACTOR_ID });
  const apresVerif = await supplier.obtenirFournisseurDetail(profil.id);
  verif("2. KYB vérifié réellement enregistré", apresVerif.profil.kybStatus === "verifie");

  const apresValidation = await supplier.validerParDirection({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  verif("2. validation Direction déplace le statut", apresValidation.status === "valide_direction");

  const apresContrat = await supplier.enregistrerContratSigne({ supplierProfileId: profil.id, contractTermsId: 999999, actorId: ACTOR_ID });
  verif("2. contrat signé déplace le statut", apresContrat.status === "contrat_signe");

  // ── 3. Territoires : code invalide rejeté sans bloquer les valides ────
  const territoires = await supplier.definirTerritoires({
    supplierProfileId: profil.id,
    allowed: ["FR", "ZZ"],
    excluded: [],
    actorId: ACTOR_ID,
  });
  verif("3. code pays valide conservé", territoires.allowed.includes("FR"));
  verif("3. code pays inconnu rejeté sans bloquer le reste", territoires.rejetes.includes("ZZ") && !territoires.allowed.includes("ZZ"));

  // ── 4. Connector Engine : honnêteté sans secret réel ──────────────────
  const connexionApi = await supplier.enregistrerConnexion({
    supplierProfileId: profil.id,
    method: "api_rest",
    actorId: ACTOR_ID,
  });
  verif("4. connecteur à secret manquant reste not_connected", connexionApi.status === "not_connected");

  const testApi = await supplier.testerConnexion(connexionApi.id, ACTOR_ID);
  verif("4. test honnête : jamais un succès fabriqué sans secret réel", testApi.ok === false && /NOT_CONNECTED/.test(testApi.motif));

  const connexionManuelle = await supplier.enregistrerConnexion({
    supplierProfileId: profil.id,
    method: "manuel",
    actorId: ACTOR_ID,
  });
  verif("4. connecteur manuel configuré sans secret", connexionManuelle.status === "configured");

  const testManuel = await supplier.testerConnexion(connexionManuelle.id, ACTOR_ID);
  verif("4. connecteur manuel réellement testable sans clé externe", testManuel.ok === true);

  await assert.rejects(
    () => supplier.enregistrerConnexion({ supplierProfileId: profil.id, method: "telepathie", actorId: ACTOR_ID }),
    /méthode de connexion inconnue/i,
  );
  verif("4. méthode de connexion inconnue refusée", true);

  // ── 5. Activation : maintenant réellement possible ────────────────────
  const actif = await supplier.activerFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  verif("5. activation réussie une fois toutes les conditions réunies", actif.status === "actif");

  // ── 6. Universal Mapping Engine : versionné, jamais écrasé ────────────
  const mappingV1 = await supplier.definirMapping({
    supplierProfileId: profil.id,
    entityType: "piece",
    regles: [{ canonicalField: "referenceOem", supplierField: "oem_ref" }],
    actorId: ACTOR_ID,
  });
  verif("6. premier mapping en version 1", mappingV1.version === 1);

  const mappingV2 = await supplier.definirMapping({
    supplierProfileId: profil.id,
    entityType: "piece",
    regles: [
      { canonicalField: "referenceOem", supplierField: "ref_oem_v2" },
      { canonicalField: "prixFournisseur", supplierField: "prix_ht" },
    ],
    actorId: ACTOR_ID,
  });
  verif("6. nouvelle sauvegarde incrémente la version sans écraser", mappingV2.version === 2);

  const detailMapping = await supplier.obtenirFournisseurDetail(profil.id);
  verif("6. seule la dernière version de mapping est active", detailMapping.mappings.every((m) => m.version === 2));

  await assert.rejects(
    () =>
      supplier.definirMapping({
        supplierProfileId: profil.id,
        entityType: "piece",
        regles: [{ canonicalField: "champ_invente", supplierField: "x" }],
        actorId: ACTOR_ID,
      }),
    /champ.*canonique.*inconnu/i,
  );
  verif("6. champ canonique inventé refusé", true);

  // ── 7. Cycle de vie : suspension réversible, désactivation terminale ──
  const suspendu = await supplier.suspendreFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID, reason: "contrôle en cours" });
  verif("7. suspension réelle", suspendu.status === "suspendu");

  const reactive = await supplier.reactiverFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  verif("7. réactivation depuis suspendu", reactive.status === "actif");

  const desactive = await supplier.desactiverFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  verif("7. désactivation réelle", desactive.status === "desactive");

  await assert.rejects(() => supplier.desactiverFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID }), /déjà désactivé/i);
  verif("7. désactivation déjà faite refusée deux fois", true);

  // ── 8. Audit : chaque décision est journalisée ─────────────────────────
  const journal = await supplier.journalAudit(profil.id);
  const actionsAttendues = [
    "supplier.created",
    "supplier.kyb_verified",
    "supplier.validated_by_direction",
    "supplier.contract_signed",
    "supplier.territories_set",
    "supplier.connection_configured",
    "supplier.connection_tested",
    "supplier.mapping_saved",
    "supplier.activated",
    "supplier.suspended",
    "supplier.reactivated",
    "supplier.deactivated",
  ];
  const actionsJournalisees = new Set(journal.map((j) => j.action));
  verif(
    "8. chaque décision du cycle de vie est journalisée",
    actionsAttendues.every((a) => actionsJournalisees.has(a)),
  );

  // ── 9. MOS : health / feed / dashboard répondent réellement ───────────
  const health = await supplier.healthStatus();
  verif("9. healthStatus répond avec au moins ce fournisseur de test", health.metrics.total >= 1);
  const feed = await supplier.controlCenterFeed();
  verif("9. controlCenterFeed déclare staging (non validé en production)", feed.status === "staging");
  const dash = await supplier.dashboard();
  verif("9. dashboard expose des métriques business réelles", typeof dash.businessMetrics.fournisseurs_desactive === "number");

  // ── 10. Router : branché dans l'appRouter ─────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const supplierKeys = Object.keys(procs).filter((k) => k.startsWith("supplierEngine."));
  for (const sub of [
    "supplierEngine.meta",
    "supplierEngine.healthStatus",
    "supplierEngine.creer",
    "supplierEngine.validerParDirection",
    "supplierEngine.enregistrerConnexion",
    "supplierEngine.testerConnexion",
    "supplierEngine.definirMapping",
    "supplierEngine.activer",
    "supplierEngine.desactiver",
  ]) {
    verif(`10. routeur expose « ${sub} »`, supplierKeys.includes(sub));
  }

  await nettoyer();

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
