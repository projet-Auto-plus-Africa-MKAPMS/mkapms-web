/**
 * Parts Engine — LOT 3 du Plan Maître Fournisseurs (pièces automobiles
 * uniquement) : tests réels, base de données réelle. Couvre ingestion,
 * mapping, identification OEM/canonique multi-fournisseurs, OEM/
 * Cross-Reference Engine, compatibilité, qualité, MKA.P-MS AI (honnête), prix, stock
 * (réservation/libération/rupture), territoires, préparation, publication
 * réelle vers `parts_catalog`/`parts_stock`/`parts_compatibility`, retrait,
 * audit.
 *
 * Lancement : `npx tsx server/parts-engine/__tests__/parts-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { partsCatalog, partsCompatibility, partsShops, partsStock } from "../../schema.js";
import { partners } from "../../modules/operations.js";
import { supplierAuditLog, supplierConnections, supplierMappings, supplierOnboardingSteps, supplierProfiles } from "../../supplier-engine/schema.js";
import * as supplier from "../../supplier-engine/service.js";
import {
  partsAuditLog,
  partsCanonical,
  partsCompatibilityChecks,
  partsOemCrossReferences,
  partsPricing,
  partsPublicationLog,
  partsQualityChecks,
  partsStockLedger,
  partsStockReservations,
  partsSupplierItems,
  partsSupplierShopLinks,
  partsTerritories,
} from "../schema.js";
import * as parts from "../service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ACTOR_ID = 4;
const NOM_PARTENAIRE = "Test Parts Engine — Fournisseur Pièces SARL";
const NOM_PARTENAIRE_VEHICULES = "Test Parts Engine — Fournisseur Véhicules seul SARL";
const REF_OEM = "OEM-1234567-TEST";

async function nettoyer() {
  for (const nom of [NOM_PARTENAIRE, NOM_PARTENAIRE_VEHICULES]) {
    const rows = await db.select({ id: partners.id }).from(partners).where(eq(partners.name, nom));
    for (const p of rows) {
      const profils = await db.select({ id: supplierProfiles.id }).from(supplierProfiles).where(eq(supplierProfiles.partnerId, p.id));
      for (const profil of profils) {
        const items = await db.select({ id: partsSupplierItems.id }).from(partsSupplierItems).where(eq(partsSupplierItems.supplierProfileId, profil.id));
        for (const it of items) {
          const [item] = await db.select({ catalogId: partsSupplierItems.catalogId }).from(partsSupplierItems).where(eq(partsSupplierItems.id, it.id));
          if (item?.catalogId) {
            await db.delete(partsCompatibility).where(eq(partsCompatibility.catalogId, item.catalogId));
            await db.delete(partsStock).where(eq(partsStock.catalogId, item.catalogId));
            await db.delete(partsCatalog).where(eq(partsCatalog.id, item.catalogId));
          }
          await db.delete(partsAuditLog).where(eq(partsAuditLog.supplierItemId, it.id));
          await db.delete(partsPublicationLog).where(eq(partsPublicationLog.supplierItemId, it.id));
          await db.delete(partsQualityChecks).where(eq(partsQualityChecks.supplierItemId, it.id));
          await db.delete(partsCompatibilityChecks).where(eq(partsCompatibilityChecks.supplierItemId, it.id));
          await db.delete(partsStockReservations).where(eq(partsStockReservations.supplierItemId, it.id));
          await db.delete(partsStockLedger).where(eq(partsStockLedger.supplierItemId, it.id));
          await db.delete(partsTerritories).where(eq(partsTerritories.supplierItemId, it.id));
          await db.delete(partsPricing).where(eq(partsPricing.supplierItemId, it.id));
          await db.delete(partsSupplierItems).where(eq(partsSupplierItems.id, it.id));
        }
        const shopLink = await db.select().from(partsSupplierShopLinks).where(eq(partsSupplierShopLinks.supplierProfileId, profil.id));
        for (const sl of shopLink) {
          await db.delete(partsSupplierShopLinks).where(eq(partsSupplierShopLinks.id, sl.id));
          await db.delete(partsShops).where(eq(partsShops.id, sl.shopId));
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
  await db.delete(partsCanonical).where(eq(partsCanonical.referenceOem, REF_OEM));
  await db.delete(partsOemCrossReferences).where(eq(partsOemCrossReferences.referenceOem, REF_OEM));
}

async function activerFournisseurDeTest(nom: string, supplierType: "pieces" | "vehicules") {
  const [partenaire] = await db.insert(partners).values({ name: nom, type: "fournisseur_pieces", country: "FR", active: true }).returning();
  const profil = await supplier.creerFournisseur({ partnerId: partenaire.id, supplierType, companyLegalName: nom, countryCode: "FR", createdBy: ACTOR_ID });
  await supplier.verifierEntreprise({ supplierProfileId: profil.id, decision: "verifie", actorId: ACTOR_ID });
  await supplier.validerParDirection({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  await supplier.enregistrerContratSigne({ supplierProfileId: profil.id, contractTermsId: 999999, actorId: ACTOR_ID });
  await supplier.enregistrerConnexion({ supplierProfileId: profil.id, method: "manuel", actorId: ACTOR_ID });
  await supplier.activerFournisseur({ supplierProfileId: profil.id, actorId: ACTOR_ID });
  return profil;
}

const RAW_PIECE = {
  ref_fournisseur: "SUP-PIE-001",
  oem_src: REF_OEM,
  aftermarket_src: "BOSCH-0986AB1234",
  ean_src: "5901234123457",
  marque_src: "Bosch",
  fabricant_src: "Bosch GmbH",
  categorie_src: "Freinage",
  nom_src: "Plaquettes de frein avant",
  prix_src: "45.90",
};

async function main() {
  await nettoyer();

  const profilPieces = await activerFournisseurDeTest(NOM_PARTENAIRE, "pieces");
  const profilVehicules = await activerFournisseurDeTest(NOM_PARTENAIRE_VEHICULES, "vehicules");

  // ── 1. Ingestion : refus fournisseur incompatible / méthode non configurée ──
  await assert.rejects(
    () => parts.ingererPiece({ supplierProfileId: profilVehicules.id, supplierPartId: "X1", ingestMethod: "manuel", rawData: {}, actorId: ACTOR_ID }),
    /ne fournit pas de pièces/i,
  );
  verif("1. un fournisseur véhicules seul ne peut pas fournir de pièce (LOT 3 = pièces uniquement)", true);

  await assert.rejects(
    () => parts.ingererPiece({ supplierProfileId: profilPieces.id, supplierPartId: "X1", ingestMethod: "api_rest", rawData: {}, actorId: ACTOR_ID }),
    /non configurée/i,
  );
  verif("1. méthode de connexion non configurée refusée (API indisponible)", true);

  const item1 = await parts.ingererPiece({ supplierProfileId: profilPieces.id, supplierPartId: "SUP-PIE-001", ingestMethod: "manuel", rawData: RAW_PIECE, actorId: ACTOR_ID });
  verif("1. ingestion réelle en base, statut IMPORTED", item1.id > 0 && item1.status === "IMPORTED");
  verif("1. référence unique générée", item1.reference.startsWith("PIE-"));

  // ── 2-3. Mapping ────────────────────────────────────────────────────
  await assert.rejects(() => parts.mapperEtNormaliser(item1.id, ACTOR_ID), /Aucun mapping/i);
  verif("2. mapping refusé tant qu'aucun mapping actif n'existe", true);

  await supplier.definirMapping({
    supplierProfileId: profilPieces.id,
    entityType: "piece",
    regles: [
      { canonicalField: "referenceOem", supplierField: "oem_src" },
      { canonicalField: "referenceAftermarket", supplierField: "aftermarket_src" },
      { canonicalField: "eanGtin", supplierField: "ean_src" },
      { canonicalField: "marquePiece", supplierField: "marque_src" },
      { canonicalField: "fabricant", supplierField: "fabricant_src" },
      { canonicalField: "categorie", supplierField: "categorie_src" },
      { canonicalField: "nomPiece", supplierField: "nom_src" },
      { canonicalField: "prixFournisseur", supplierField: "prix_src" },
    ],
    actorId: ACTOR_ID,
  });
  const apresMapping = await parts.mapperEtNormaliser(item1.id, ACTOR_ID);
  verif("3. référence OEM extraite dans normalizedData → colonne referenceOem", apresMapping.referenceOem === REF_OEM);
  verif("3. EAN extrait → colonne ean", apresMapping.ean === "5901234123457");
  verif("3. statut avancé à ANALYSIS_PENDING", apresMapping.status === "ANALYSIS_PENDING");

  // ── 4-5. Identification pièce/OEM + pièce canonique (multi-fournisseurs) ──
  const identif1 = await parts.identifierPieceEtCanonique(item1.id, ACTOR_ID);
  verif("4. nouvelle pièce canonique créée (aucune correspondance existante)", identif1.matchStatus === "nouvelle_piece" && identif1.canonicalPartId! > 0);

  const item2 = await parts.ingererPiece({ supplierProfileId: profilPieces.id, supplierPartId: "SUP-PIE-002", ingestMethod: "manuel", rawData: RAW_PIECE, actorId: ACTOR_ID });
  await parts.mapperEtNormaliser(item2.id, ACTOR_ID);
  const identif2 = await parts.identifierPieceEtCanonique(item2.id, ACTOR_ID);
  verif("4. MULTI-FOURNISSEURS : même référence OEM → correspondance canonique trouvée, jamais fusionnée automatiquement", identif2.matchStatus === "a_verifier" && identif2.canonicalPartId === identif1.canonicalPartId);

  const decision = await parts.deciderCorrespondanceCanonique({ supplierItemId: item2.id, decision: "confirme", actorId: ACTOR_ID });
  verif("4. décision humaine réelle : correspondance confirmée", decision.canonicalMatchStatus === "confirme" && decision.canonicalPartId === identif1.canonicalPartId);

  // ── OEM / Cross-Reference Engine ────────────────────────────────────
  const equivalence = await parts.declarerEquivalence({ referenceOem: REF_OEM, referenceAlternative: "VALEO-987654", marqueAlternative: "Valeo", sourceType: "fournisseur", confidencePct: 70, actorId: ACTOR_ID });
  verif("OEM/Cross-Reference : équivalence déclarée « à vérifier », jamais appliquée sans preuve", equivalence.status === "a_verifier");
  const vide = await parts.rechercherEquivalences(REF_OEM);
  verif("OEM/Cross-Reference : équivalence non confirmée absente des résultats", vide.length === 0);
  await parts.deciderEquivalence({ crossReferenceId: equivalence.id, decision: "confirme", actorId: ACTOR_ID });
  const confirmees = await parts.rechercherEquivalences(REF_OEM);
  verif("OEM/Cross-Reference : équivalence confirmée retrouvée après décision humaine", confirmees.length === 1 && confirmees[0].referenceAlternative === "VALEO-987654");

  // ── Parts Compatibility Engine ───────────────────────────────────────
  const compatIncomplete = await parts.analyserCompatibilite({ supplierItemId: item1.id, marque: "Renault", actorId: ACTOR_ID });
  verif("Compatibilité : donnée incomplète (pas de modèle/années) → MANUAL_VALIDATION_REQUIRED, jamais « compatible » par ressemblance", compatIncomplete.matchLevel === "MANUAL_VALIDATION_REQUIRED");

  const compatDeclaree = await parts.analyserCompatibilite({ supplierItemId: item1.id, marque: "Renault", modele: "Clio", anneeDebut: 2015, anneeFin: 2020, codeMoteur: "K9K", actorId: ACTOR_ID });
  verif("Compatibilité : déclaration fournisseur complète → LIKELY_COMPATIBLE (probable, non vérifiée)", compatDeclaree.matchLevel === "LIKELY_COMPATIBLE");

  const compatValidee = await parts.validerCompatibilite({ checkId: compatDeclaree.id, decision: "VERIFIED_COMPATIBLE", actorId: ACTOR_ID });
  verif("Compatibilité : validation humaine → VERIFIED_COMPATIBLE (compatibilité correcte)", compatValidee.matchLevel === "VERIFIED_COMPATIBLE");

  const compatIncompatible = await parts.analyserCompatibilite({ supplierItemId: item1.id, marque: "Peugeot", modele: "208", anneeDebut: 2018, anneeFin: 2022, actorId: ACTOR_ID });
  const compatEcartee = await parts.validerCompatibilite({ checkId: compatIncompatible.id, decision: "INCOMPATIBLE", actorId: ACTOR_ID });
  verif("Compatibilité : décision humaine → INCOMPATIBLE (incompatibilité)", compatEcartee.matchLevel === "INCOMPATIBLE");

  // ── 6. Parts Data Quality Engine ─────────────────────────────────────
  const qualite1 = await parts.controlerQualite(item1.id, ACTOR_ID);
  verif("6. contrôle qualité réel : pièce bien formée passe sans erreur", qualite1.resultat !== "error");

  const itemInvalide = await parts.ingererPiece({ supplierProfileId: profilPieces.id, supplierPartId: "SUP-PIE-003", ingestMethod: "manuel", rawData: { marque_src: "X", categorie_src: "Y", prix_src: "-10" }, actorId: ACTOR_ID });
  await supplier.definirMapping({
    supplierProfileId: profilPieces.id,
    entityType: "piece",
    regles: [
      { canonicalField: "marquePiece", supplierField: "marque_src" },
      { canonicalField: "categorie", supplierField: "categorie_src" },
      { canonicalField: "prixFournisseur", supplierField: "prix_src" },
    ],
    actorId: ACTOR_ID,
  });
  await parts.mapperEtNormaliser(itemInvalide.id, ACTOR_ID);
  const qualiteInvalide = await parts.controlerQualite(itemInvalide.id, ACTOR_ID);
  verif("6. prix négatif détecté comme erreur — jamais corrigé silencieusement", qualiteInvalide.resultat === "error");
  const detailInvalide = await parts.obtenirPieceDetail(itemInvalide.id);
  verif("6. statut ERROR réellement posé quand le contrôle qualité échoue", detailInvalide.item.status === "ERROR");

  // ── 7. Parts Intelligence Engine : honnête ──────────────────────────────
  const ia = await parts.analyserIA(item1.id, ACTOR_ID);
  verif("7. Analyse pièces honnêtement NOT_CONNECTED (aucune brique MKA.P-MS AI branchée)", ia.status === "NOT_CONNECTED" && ia.suggestions === null);

  // ── 8. Parts Pricing Engine ──────────────────────────────────────────
  const prix1 = await parts.calculerPrix({ supplierItemId: item1.id, supplierPrice: 45.9, supplierCurrency: "EUR", commissionRatePct: 10, vatRatePct: 20, actorId: ACTOR_ID });
  const htAttendu = Math.round(45.9 * 1.1 * 100) / 100;
  const ttcAttendu = Math.round(htAttendu * 1.2 * 100) / 100;
  verif("8. prix HT calculé avec commission", Number(prix1.retailPriceHt) === htAttendu);
  verif("8. prix TTC calculé avec TVA", Number(prix1.retailPriceTtc) === ttcAttendu);
  await assert.rejects(() => parts.calculerPrix({ supplierItemId: item1.id, supplierPrice: 10, supplierCurrency: "ZZZ", actorId: ACTOR_ID }), /inconnue du Country OS/i);
  verif("8. devise inconnue du Country OS refusée — jamais un taux inventé", true);
  await parts.calculerPrix({ supplierItemId: item2.id, supplierPrice: 39.0, supplierCurrency: "EUR", commissionRatePct: 10, actorId: ACTOR_ID });

  // ── Parts Stock Engine ───────────────────────────────────────────────
  const stock1 = await parts.definirStock({ supplierItemId: item1.id, physicalQuantity: 4, lowStockThreshold: 2, actorId: ACTOR_ID });
  verif("Stock : ledger réel posé, IN_STOCK au-dessus du seuil", stock1.stockStatus === "IN_STOCK");

  const reservation = await parts.reserverStock({ supplierItemId: item1.id, quantity: 1, orderRef: "CMD-TEST-1", actorId: ACTOR_ID });
  const apresReservation = await parts.obtenirPieceDetail(item1.id);
  verif("Stock : réservation réelle (4 → 3 disponibles, 1 réservé)", apresReservation.stock!.reservedQuantity === 1 && apresReservation.stock!.physicalQuantity === 4);

  await assert.rejects(() => parts.reserverStock({ supplierItemId: item1.id, quantity: 10, actorId: ACTOR_ID }), /Stock insuffisant/i);
  verif("Stock : survente refusée", true);

  await parts.libererReservationStock({ reservationId: reservation.id, reason: "test libération", actorId: ACTOR_ID });
  const apresLiberation = await parts.obtenirPieceDetail(item1.id);
  verif("Stock : réservation libérée, quantité réservée revenue à 0", apresLiberation.stock!.reservedQuantity === 0);

  const stockRupture = await parts.definirStock({ supplierItemId: item1.id, physicalQuantity: 0, lowStockThreshold: 2, actorId: ACTOR_ID });
  verif("Stock : rupture réelle détectée (OUT_OF_STOCK)", stockRupture.stockStatus === "OUT_OF_STOCK");
  await parts.definirStock({ supplierItemId: item1.id, physicalQuantity: 4, lowStockThreshold: 2, actorId: ACTOR_ID });

  await parts.definirStock({ supplierItemId: item2.id, physicalQuantity: 5, lowStockThreshold: 1, actorId: ACTOR_ID });

  // ── Parts Territory Engine ───────────────────────────────────────────
  const territoires1 = await parts.definirTerritoiresPiece({ supplierItemId: item1.id, allowedSaleCountries: ["FR", "ZZ"], exportAllowed: true, countryCodeOrigine: "FR", actorId: ACTOR_ID });
  verif("Territoires : code pays valide conservé, code inconnu rejeté", territoires1.allowedSaleCountries.includes("FR") && territoires1.rejetes.includes("ZZ"));
  verif("Territoires : export refusé par défaut sans règle Country Policy Engine confirmée", territoires1.exportAllowed === false);
  await parts.definirTerritoiresPiece({ supplierItemId: item2.id, allowedSaleCountries: ["FR"], actorId: ACTOR_ID });

  // ── 11-12. Préparation ────────────────────────────────────────────────
  const prep1 = await parts.preparerPourPublication(item1.id, ACTOR_ID);
  verif("11-12. préparation réussie une fois toutes les conditions réunies → READY_TO_PUBLISH", prep1.pret === true);

  const prepIncomplete = await parts.preparerPourPublication(itemInvalide.id, ACTOR_ID);
  verif("11-12. préparation bloquée avec motif exact tant qu'un manque subsiste (qualité en erreur)", prepIncomplete.pret === false && prepIncomplete.manques.length > 0);

  await parts.controlerQualite(item2.id, ACTOR_ID);
  const prep2 = await parts.preparerPourPublication(item2.id, ACTOR_ID);
  verif("11-12. deuxième pièce (même OEM, fournisseur confirmé) également prête", prep2.pret === true);

  // ── 13. Publication réelle ────────────────────────────────────────────
  const publication1 = await parts.validerEtPublier({ supplierItemId: item1.id, actorId: ACTOR_ID });
  verif("13. publication réelle : une ligne parts_catalog existe", publication1.catalogId > 0);
  const [catalogue1] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, publication1.catalogId));
  verif("13. l'offre publiée porte la référence OEM et le fournisseur", catalogue1.referenceOem === REF_OEM && catalogue1.fournisseurId === profilPieces.id);
  verif("13. l'offre est réellement publiée avec le prix public calculé", Number(catalogue1.prixTtc) === ttcAttendu && catalogue1.active === true);
  const [stockPublie] = await db.select().from(partsStock).where(eq(partsStock.catalogId, publication1.catalogId));
  verif("13. la ligne parts_stock reflète le stock réel au moment de la publication", stockPublie.quantite === 4);
  const compatMaterialisee = await db.select().from(partsCompatibility).where(eq(partsCompatibility.catalogId, publication1.catalogId));
  verif("13. la compatibilité VERIFIED_COMPATIBLE est matérialisée dans la marketplace", compatMaterialisee.some((c) => c.marque === "Renault" && c.modele === "Clio"));
  verif("13. la compatibilité INCOMPATIBLE n'est jamais matérialisée", !compatMaterialisee.some((c) => c.marque === "Peugeot"));

  const publication2 = await parts.validerEtPublier({ supplierItemId: item2.id, actorId: ACTOR_ID });
  verif("MULTI-FOURNISSEURS : deux offres distinctes (parts_catalog) pour la même pièce canonique", publication2.catalogId !== publication1.catalogId);
  const [shopLink1] = await db.select().from(partsSupplierShopLinks).where(eq(partsSupplierShopLinks.supplierProfileId, profilPieces.id));
  const [catalogue2] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, publication2.catalogId));
  verif("MULTI-FOURNISSEURS : boutique technique auto-provisionnée réutilisée pour le même fournisseur", catalogue1.shopId === shopLink1.shopId && catalogue2.shopId === shopLink1.shopId);

  // ── Synchronisation ────────────────────────────────────────────────────
  const resync = await parts.synchroniserPiece({ supplierItemId: item1.id, rawData: { ...RAW_PIECE, prix_src: "49.90" }, actorId: ACTOR_ID });
  verif("Synchronisation : donnée fournisseur réellement mise à jour", (resync.normalizedData as Record<string, unknown>).prixFournisseur === "49.90");

  // ── Retrait ────────────────────────────────────────────────────────────
  const retireCible = await parts.ingererPiece({ supplierProfileId: profilPieces.id, supplierPartId: "SUP-PIE-004", ingestMethod: "manuel", rawData: RAW_PIECE, actorId: ACTOR_ID });
  const retire = await parts.retirerPiece({ supplierItemId: retireCible.id, reason: "vendu ailleurs par le fournisseur" });
  verif("Retrait : retrait automatique réel (actorId absent = système)", retire.status === "REMOVED");
  await assert.rejects(() => parts.retirerPiece({ supplierItemId: retireCible.id, reason: "x" }), /déjà retirée/i);
  verif("Retrait : retrait déjà fait refusé deux fois", true);

  // ── Audit ────────────────────────────────────────────────────────────
  const journal = await parts.journalAudit(item1.id);
  const actionsAttendues = ["part.imported", "part.normalized", "part.canonical_created", "part.compatibility_checked", "part.quality_checked", "part.ai_analyzed", "part.priced", "part.stock_set", "part.territories_set", "part.ready", "part.published"];
  const actionsJournalisees = new Set(journal.map((j) => j.action));
  verif("Audit : chaque étape du pipeline est journalisée", actionsAttendues.every((a) => actionsJournalisees.has(a)));

  // ── MOS : health / feed / dashboard ─────────────────────────────────────
  const health = await parts.healthStatus();
  verif("MOS : healthStatus répond avec au moins ces pièces de test", health.metrics.total >= 4);
  const feed = await parts.controlCenterFeed();
  verif("MOS : controlCenterFeed déclare staging (non validé en production)", feed.status === "staging");
  const dash = await parts.dashboard();
  verif("MOS : dashboard expose des métriques business réelles", typeof dash.businessMetrics.pieces_published === "number");

  // ── Router : branché dans l'appRouter ────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const partsKeys = Object.keys(procs).filter((k) => k.startsWith("partsEngine."));
  for (const sub of [
    "partsEngine.meta",
    "partsEngine.ingerer",
    "partsEngine.mapperEtNormaliser",
    "partsEngine.identifierPieceEtCanonique",
    "partsEngine.analyserCompatibilite",
    "partsEngine.validerCompatibilite",
    "partsEngine.calculerPrix",
    "partsEngine.definirStock",
    "partsEngine.reserverStock",
    "partsEngine.definirTerritoires",
    "partsEngine.preparerPourPublication",
    "partsEngine.validerEtPublier",
    "partsEngine.retirer",
  ]) {
    verif(`Router : expose « ${sub} »`, partsKeys.includes(sub));
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
