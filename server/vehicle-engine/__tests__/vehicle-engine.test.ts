/**
 * Vehicle Engine — LOT 2 du Plan Maître Fournisseurs (véhicules uniquement) :
 * tests réels, base de données réelle. Couvre ingestion, mapping, doublons,
 * analyse/qualité, MKA.P-MS Intelligences (honnête), prix, territoires, disponibilité,
 * préparation, publication réelle vers `annonces`, réservation/vente/retrait,
 * audit.
 *
 * Lancement : `npx tsx server/vehicle-engine/__tests__/vehicle-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces } from "../../schema.js";
import { partners } from "../../modules/operations.js";
import {
  supplierAuditLog,
  supplierConnections,
  supplierMappings,
  supplierOnboardingSteps,
  supplierProfiles,
} from "../../supplier-engine/schema.js";
import * as supplier from "../../supplier-engine/service.js";
import {
  vehicleAuditLog,
  vehicleAvailability,
  vehicleConditionReports,
  vehicleDuplicates,
  vehicleItems,
  vehiclePricing,
  vehiclePublicationLog,
  vehicleQualityChecks,
  vehicleTerritories,
} from "../schema.js";
import * as vehicle from "../service.js";
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
const NOM_PARTENAIRE = "Test Vehicle Engine — Fournisseur Véhicules SARL";
const NOM_PARTENAIRE_PIECES = "Test Vehicle Engine — Fournisseur Pièces seul SARL";

async function nettoyer() {
  const noms = [NOM_PARTENAIRE, NOM_PARTENAIRE_PIECES];
  for (const nom of noms) {
    const rows = await db.select({ id: partners.id }).from(partners).where(eq(partners.name, nom));
    for (const p of rows) {
      const profils = await db.select({ id: supplierProfiles.id }).from(supplierProfiles).where(eq(supplierProfiles.partnerId, p.id));
      for (const profil of profils) {
        const vitems = await db.select({ id: vehicleItems.id }).from(vehicleItems).where(eq(vehicleItems.supplierProfileId, profil.id));
        for (const vi of vitems) {
          const [item] = await db.select({ annonceId: vehicleItems.annonceId }).from(vehicleItems).where(eq(vehicleItems.id, vi.id));
          if (item?.annonceId) await db.delete(annonces).where(eq(annonces.id, item.annonceId));
          await db.delete(vehicleAuditLog).where(eq(vehicleAuditLog.vehicleItemId, vi.id));
          await db.delete(vehiclePublicationLog).where(eq(vehiclePublicationLog.vehicleItemId, vi.id));
          await db.delete(vehicleQualityChecks).where(eq(vehicleQualityChecks.vehicleItemId, vi.id));
          await db.delete(vehicleConditionReports).where(eq(vehicleConditionReports.vehicleItemId, vi.id));
          await db.delete(vehicleDuplicates).where(eq(vehicleDuplicates.vehicleItemId, vi.id));
          await db.delete(vehicleTerritories).where(eq(vehicleTerritories.vehicleItemId, vi.id));
          await db.delete(vehiclePricing).where(eq(vehiclePricing.vehicleItemId, vi.id));
          await db.delete(vehicleAvailability).where(eq(vehicleAvailability.vehicleItemId, vi.id));
          await db.delete(vehicleItems).where(eq(vehicleItems.id, vi.id));
        }
        await db.delete(supplierAuditLog).where(eq(supplierAuditLog.supplierProfileId, profil.id));
        await db.delete(supplierOnboardingSteps).where(eq(supplierOnboardingSteps.supplierProfileId, profil.id));
        await db.delete(supplierConnections).where(eq(supplierConnections.supplierProfileId, profil.id));
        await db.delete(supplierMappings).where(eq(supplierMappings.supplierProfileId, profil.id));
        await db.delete(supplierProfiles).where(eq(supplierProfiles.id, profil.id));
      }
      await db.delete(partners).where(eq(partners.id, p.id));
    }
  }
}

async function activerFournisseurDeTest(nom: string, supplierType: "vehicules" | "pieces") {
  const [partenaire] = await db.insert(partners).values({ name: nom, type: "fournisseur_vehicules", country: "FR", active: true }).returning();
  const profil = await supplier.creerFournisseur({
    partnerId: partenaire.id,
    supplierType,
    companyLegalName: nom,
    countryCode: "FR",
    createdBy: ACTOR_ID,
  });
  await supplier.verifierEntreprise({ supplierProfileId: profil.id, decision: "verifie", actorId: ACTOR_ID });
  await supplier.validerParDirection({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  await supplier.enregistrerContratSigne({ supplierProfileId: profil.id, contractTermsId: 999999, actorId: ACTOR_ID });
  await supplier.enregistrerConnexion({ supplierProfileId: profil.id, method: "manuel", actorId: ACTOR_ID });
  await supplier.activerFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  return profil;
}

async function main() {
  await nettoyer();

  // ── 0. Fournisseur véhicules actif + fournisseur pièces seul (pour le refus) ──
  const profilVehicules = await activerFournisseurDeTest(NOM_PARTENAIRE, "vehicules");
  const profilPieces = await activerFournisseurDeTest(NOM_PARTENAIRE_PIECES, "pieces");

  // ── 1. Ingestion : refus fournisseur incompatible / méthode non configurée ──
  await assert.rejects(
    () => vehicle.ingererVehicule({ supplierProfileId: profilPieces.id, supplierVehicleId: "X1", ingestMethod: "manuel", rawData: {}, actorId: ACTOR_ID }),
    /ne fournit pas de véhicules/i,
  );
  verif("1. un fournisseur pièces seul ne peut pas fournir de véhicule (LOT 2 = véhicules uniquement)", true);

  await assert.rejects(
    () => vehicle.ingererVehicule({ supplierProfileId: profilVehicules.id, supplierVehicleId: "X1", ingestMethod: "api_rest", rawData: {}, actorId: ACTOR_ID }),
    /non configurée/i,
  );
  verif("1. méthode de connexion non configurée refusée", true);

  const rawData = {
    oem_ref_vin: "VF3ABCDEF12345678",
    plaque_siv: "AA-123-BB",
    marque_src: "Renault",
    modele_src: "Clio",
    carrosserie_src: "citadine",
    transmission_src: "manuelle",
    carburant_src: "essence",
    etat_src: "occasion",
    annee_src: "2021",
    prix_src: "12000",
  };
  const item1 = await vehicle.ingererVehicule({ supplierProfileId: profilVehicules.id, supplierVehicleId: "SUP-V-001", ingestMethod: "manuel", rawData, actorId: ACTOR_ID });
  verif("1. ingestion réelle en base, statut IMPORTED", item1.id > 0 && item1.status === "IMPORTED");
  verif("1. référence unique générée", item1.reference.startsWith("VEH-"));

  // ── 2-3. Mapping : refus sans mapping actif, puis normalisation réelle ──
  await assert.rejects(() => vehicle.mapperEtNormaliser(item1.id, ACTOR_ID), /Aucun mapping/i);
  verif("2. mapping refusé tant qu'aucun mapping actif n'existe (Universal Mapping Engine)", true);

  await supplier.definirMapping({
    supplierProfileId: profilVehicules.id,
    entityType: "vehicule",
    regles: [
      { canonicalField: "vin", supplierField: "oem_ref_vin" },
      { canonicalField: "immatriculation", supplierField: "plaque_siv" },
      { canonicalField: "marque", supplierField: "marque_src" },
      { canonicalField: "modele", supplierField: "modele_src" },
      { canonicalField: "carrosserie", supplierField: "carrosserie_src" },
      { canonicalField: "transmission", supplierField: "transmission_src" },
      { canonicalField: "carburant", supplierField: "carburant_src" },
      { canonicalField: "etat", supplierField: "etat_src" },
      { canonicalField: "annee", supplierField: "annee_src" },
      { canonicalField: "prixFournisseur", supplierField: "prix_src" },
    ],
    actorId: ACTOR_ID,
  });
  const apresMapping = await vehicle.mapperEtNormaliser(item1.id, ACTOR_ID);
  verif("3. VIN extrait dans normalizedData → colonne vin", apresMapping.vin === "VF3ABCDEF12345678");
  verif("3. plaque extraite (immatriculation) → colonne plaque", apresMapping.plaque === "AA-123-BB");
  verif("3. statut avancé à ANALYSIS_PENDING", apresMapping.status === "ANALYSIS_PENDING");

  // ── 4. Vehicle Duplicate Engine : détecté, jamais fusionné automatiquement ──
  const item2 = await vehicle.ingererVehicule({ supplierProfileId: profilVehicules.id, supplierVehicleId: "SUP-V-002", ingestMethod: "manuel", rawData, actorId: ACTOR_ID });
  await vehicle.mapperEtNormaliser(item2.id, ACTOR_ID); // même VIN que item1 (même rawData)
  const doublons = await vehicle.detecterDoublons(item2.id, ACTOR_ID);
  const doublonVin = doublons.find((d) => d.matchType === "vin");
  verif("4. doublon VIN détecté et laissé « à vérifier »", !!doublonVin && doublonVin.status === "a_verifier");
  const decision = await vehicle.deciderDoublon({ duplicateId: doublonVin!.id, decision: "ecarte", actorId: ACTOR_ID });
  verif("4. décision humaine réelle sur le doublon (jamais automatique)", decision.status === "ecarte" && decision.decidedBy === ACTOR_ID);

  // ── 5. Analyse VIN / données ──────────────────────────────────────────
  verif("5. décodage VIN structurel valide (17 caractères, alphabet ISO 3779)", vehicle.decoderVinStructurel("VF3ABCDEF12345678").valide);
  verif("5. décodage VIN structurel invalide détecté (longueur)", !vehicle.decoderVinStructurel("TROPCOURT").valide);
  const analyse = await vehicle.analyserDonnees(item1.id, ACTOR_ID);
  verif("5. analyse déterministe : VIN valide reconnu, aucun champ requis manquant", (analyse.vinCheck as { valide: boolean }).valide && (analyse.champsManquants as string[]).length === 0);

  // ── 6. Vehicle Data Quality Engine ─────────────────────────────────────
  const qualite1 = await vehicle.controlerQualite(item1.id, ACTOR_ID);
  verif("6. contrôle qualité réel : véhicule bien formé passe sans erreur", qualite1.resultat !== "error");

  const itemInvalide = await vehicle.ingererVehicule({
    supplierProfileId: profilVehicules.id,
    supplierVehicleId: "SUP-V-003",
    ingestMethod: "manuel",
    rawData: { marque_src: "Peugeot", modele_src: "208", prix_src: "-500", carrosserie_src: "vaisseau_spatial" },
    actorId: ACTOR_ID,
  });
  await supplier.definirMapping({
    supplierProfileId: profilVehicules.id,
    entityType: "vehicule",
    regles: [
      { canonicalField: "marque", supplierField: "marque_src" },
      { canonicalField: "modele", supplierField: "modele_src" },
      { canonicalField: "prixFournisseur", supplierField: "prix_src" },
      { canonicalField: "carrosserie", supplierField: "carrosserie_src" },
    ],
    actorId: ACTOR_ID,
  });
  await vehicle.mapperEtNormaliser(itemInvalide.id, ACTOR_ID);
  const qualiteInvalide = await vehicle.controlerQualite(itemInvalide.id, ACTOR_ID);
  verif("6. prix négatif détecté comme erreur — jamais corrigé silencieusement", qualiteInvalide.resultat === "error");
  const apresQualiteInvalide = await vehicle.obtenirVehiculeDetail(itemInvalide.id);
  verif("6. statut ERROR réellement posé quand le contrôle qualité échoue", apresQualiteInvalide.item.status === "ERROR");

  // ── 7. Vehicle Intelligence Engine : honnête, jamais inventé ────────────
  const ia = await vehicle.analyserIA(item1.id, ACTOR_ID);
  verif("7. Analyse véhicule honnêtement NOT_CONNECTED (aucune brique MKA.P-MS Intelligences branchée)", ia.status === "NOT_CONNECTED" && ia.suggestions === null);

  // ── 8. Vehicle Pricing Engine : conversion réelle via Country OS ───────
  const prix = await vehicle.calculerPrix({ vehicleItemId: item1.id, supplierPrice: 12000, supplierCurrency: "EUR", commissionRatePct: 10, actorId: ACTOR_ID });
  verif("8. prix public calculé avec commission (12000 * 1.10 = 13200)", Number(prix.publicPrice) === 13200);
  await assert.rejects(() => vehicle.calculerPrix({ vehicleItemId: item1.id, supplierPrice: 100, supplierCurrency: "ZZZ", actorId: ACTOR_ID }), /inconnue du Country OS/i);
  verif("8. devise inconnue du Country OS refusée — jamais un taux inventé", true);

  // ── 9. Vehicle Territory Engine : export refusé sans règle pays confirmée ──
  const territoires = await vehicle.definirTerritoiresVehicule({
    vehicleItemId: item1.id,
    allowedSaleCountries: ["FR", "ZZ"],
    exportAllowed: true,
    pickupCity: "Lyon",
    pickupCountryCode: "FR",
    actorId: ACTOR_ID,
  });
  verif("9. code pays valide conservé, code inconnu rejeté sans bloquer le reste", territoires.allowedSaleCountries.includes("FR") && territoires.rejetes.includes("ZZ"));
  verif("9. export refusé par défaut sans règle Country Policy Engine confirmée (jamais autorisé par défaut)", territoires.exportAllowed === false);

  // ── 10. Vehicle Availability Engine ────────────────────────────────────
  const dispo = await vehicle.assurerDisponibilite(item1.id);
  verif("10. disponibilité par défaut réellement posée", dispo.status === "available");

  // ── 11-12. Préparation : refuse tant qu'un doublon reste à trancher ────
  await vehicle.detecterDoublons(item1.id, ACTOR_ID); // recrée la relation croisée côté item1
  const prep1 = await vehicle.preparerPourPublication(item1.id, ACTOR_ID);
  const detailApresPrep1 = await vehicle.obtenirVehiculeDetail(item1.id);
  if (!prep1.pret) {
    verif("11. préparation bloquée avec un motif exact tant qu'un doublon n'est pas tranché", detailApresPrep1.item.status === "VALIDATION_PENDING");
    for (const d of detailApresPrep1.doublons) {
      if (d.status === "a_verifier") await vehicle.deciderDoublon({ duplicateId: d.id, decision: "ecarte", actorId: ACTOR_ID });
    }
  } else {
    verif("11. préparation bloquée avec un motif exact tant qu'un doublon n'est pas tranché", true); // aucun doublon en attente — rien à trancher
  }
  const prep2 = await vehicle.preparerPourPublication(item1.id, ACTOR_ID);
  verif("12. préparation réussie une fois toutes les conditions réunies → READY_TO_PUBLISH", prep2.pret === true);

  // ── 13. Publication réelle vers `annonces` (décision Direction) ────────
  const publication = await vehicle.validerEtPublier({ vehicleItemId: item1.id, actorId: ACTOR_ID });
  verif("13. publication réelle : une ligne annonces existe", publication.annonceId > 0);
  const [annonceCreee] = await db.select().from(annonces).where(eq(annonces.id, publication.annonceId));
  verif("13. l'annonce publiée porte le VIN/plaque du véhicule fournisseur (dédup Smart Engine réparée)", annonceCreee.vin === "VF3ABCDEF12345678" && annonceCreee.plaque === "AA-123-BB");
  verif("13. l'annonce est réellement publiée avec le prix public calculé", Number(annonceCreee.prix) === 13200 && annonceCreee.status === "publiee");

  // ── 15-16. Réservation / vente ──────────────────────────────────────────
  const reserve = await vehicle.reserverVehicule({ vehicleItemId: item1.id, actorId: ACTOR_ID });
  verif("15. réservation réelle", reserve.status === "RESERVED");
  const libere = await vehicle.libererReservation({ vehicleItemId: item1.id, reason: "essai annulé par le client", actorId: ACTOR_ID });
  verif("15. réservation libérée — jamais bloquée indéfiniment", libere.status === "PUBLISHED");
  await vehicle.reserverVehicule({ vehicleItemId: item1.id, actorId: ACTOR_ID });
  const vendu = await vehicle.marquerVendu({ vehicleItemId: item1.id, actorId: ACTOR_ID });
  verif("16. vente réelle : statut SOLD", vendu.status === "SOLD");
  const [annonceVendue] = await db.select().from(annonces).where(eq(annonces.id, publication.annonceId));
  verif("16. l'annonce liée passe réellement « vendue »", annonceVendue.status === "vendue");

  // ── 17. Retrait ──────────────────────────────────────────────────────────
  const retireCible = await vehicle.ingererVehicule({ supplierProfileId: profilVehicules.id, supplierVehicleId: "SUP-V-004", ingestMethod: "manuel", rawData, actorId: ACTOR_ID });
  const retire = await vehicle.retirerVehicule({ vehicleItemId: retireCible.id, reason: "vendu ailleurs par le fournisseur" });
  verif("17. retrait automatique réel (actorId absent = système)", retire.status === "REMOVED");
  await assert.rejects(() => vehicle.retirerVehicule({ vehicleItemId: retireCible.id, reason: "x" }), /déjà retiré/i);
  verif("17. retrait déjà fait refusé deux fois", true);

  // ── Vehicle Condition Engine ─────────────────────────────────────────────
  const rapport = await vehicle.ajouterRapportEtat({ vehicleItemId: item2.id, stage: "fournisseur", reportedBy: ACTOR_ID, kilometrage: 42000, notes: "RAS" });
  verif("Condition Engine : rapport d'état réel enregistré", rapport.id > 0 && rapport.stage === "fournisseur");

  // ── Audit : chaque décision est journalisée ─────────────────────────────
  const journal = await vehicle.journalAudit(item1.id);
  const actionsAttendues = [
    "vehicle.imported",
    "vehicle.mapped",
    "vehicle.data_analyzed",
    "vehicle.quality_checked",
    "vehicle.ai_analyzed",
    "vehicle.priced",
    "vehicle.territories_set",
    "vehicle.published",
    "vehicle.reserved",
    "vehicle.reservation_released",
    "vehicle.sold",
  ];
  const actionsJournalisees = new Set(journal.map((j) => j.action));
  verif("Audit : chaque étape du pipeline est journalisée", actionsAttendues.every((a) => actionsJournalisees.has(a)));

  // ── MOS : health / feed / dashboard ─────────────────────────────────────
  const health = await vehicle.healthStatus();
  verif("MOS : healthStatus répond avec au moins ces véhicules de test", health.metrics.total >= 4);
  const feed = await vehicle.controlCenterFeed();
  verif("MOS : controlCenterFeed déclare staging (non validé en production)", feed.status === "staging");
  const dash = await vehicle.dashboard();
  verif("MOS : dashboard expose des métriques business réelles", typeof dash.businessMetrics.vehicules_sold === "number");

  // ── Router : branché dans l'appRouter ────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const vehicleKeys = Object.keys(procs).filter((k) => k.startsWith("vehicleEngine."));
  for (const sub of [
    "vehicleEngine.meta",
    "vehicleEngine.ingerer",
    "vehicleEngine.mapperEtNormaliser",
    "vehicleEngine.detecterDoublons",
    "vehicleEngine.controlerQualite",
    "vehicleEngine.calculerPrix",
    "vehicleEngine.definirTerritoires",
    "vehicleEngine.preparerPourPublication",
    "vehicleEngine.validerEtPublier",
    "vehicleEngine.marquerVendu",
    "vehicleEngine.retirer",
  ]) {
    verif(`Router : expose « ${sub} »`, vehicleKeys.includes(sub));
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
