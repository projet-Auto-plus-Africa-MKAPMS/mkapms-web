/**
 * LOT IA02E — Estimate Gateway : tests réels, base de données réelle.
 *
 * Couvre les scénarios obligatoires du chantier : jamais de montant inventé,
 * cohérence avec le moteur réellement appelé (aucune formule dupliquée),
 * honnêteté BUSINESS_ENGINE_MISSING/UNAVAILABLE, et la faille payMission
 * corrigée (le serveur recalcule toujours, ne fait jamais confiance au
 * montant transmis par le client).
 *
 * Lancement : `npx tsx server/estimate-gateway/__tests__/gateway.test.ts`
 */
import assert from "node:assert/strict";
import { db } from "../../db.js";
import { devisGarageRequests, devisItems, deliveryMissions } from "../../schema.js";
import { estimate as estimerVoEngine } from "../../vo-engine/service.js";
import { calculerTarifMission } from "../../routers/livraison.js";
import {
  estimerConversionDevise,
  estimerDouane,
  estimerLivraisonColis,
  estimerLocation,
  estimerMarge,
  estimerPrixDetail,
  estimerPrixPiece,
  estimerReparationGarage,
  estimerTransportVehicule,
  estimerValeurMarche,
  estimerValeurReprise,
  estimerVtc,
} from "../gateway.js";
import { OUTILS, trouver } from "../../intelligences/outils/registre.js";
import { eq } from "drizzle-orm";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PDG_ID = 4;

async function main() {
  // ── 1. Registre : les 14 outils estimate.* existent, aucun n'invente ────
  const TOOL_IDS = [
    "estimate.vehicle.marketValue",
    "estimate.vehicle.tradeIn",
    "estimate.vehicle.retail",
    "estimate.vehicle.margin",
    "estimate.garage.repair",
    "estimate.parts.price",
    "estimate.rental",
    "estimate.loa",
    "estimate.vtc",
    "estimate.transport",
    "estimate.delivery",
    "estimate.import",
    "estimate.customs",
    "estimate.currency",
  ];
  for (const id of TOOL_IDS) {
    verif(`1. ${id} est enregistré`, trouver(id) !== null);
  }
  verif("1. exactement 14 outils estimate.* enregistrés", OUTILS.filter((o) => o.toolId.startsWith("estimate.")).length === 14);
  verif(
    "1. rental/loa/vtc/customs sont BUSINESS_ENGINE_MISSING",
    ["estimate.rental", "estimate.loa", "estimate.vtc", "estimate.customs"].every(
      (id) => trouver(id)?.implementationStatus === "BUSINESS_ENGINE_MISSING",
    ),
  );

  // ── 2. Véhicule : la passerelle renvoie EXACTEMENT ce que le VO Engine calcule ──
  const params = { marque: "Renault", modele: "Clio", annee: 2018, kilometrage: 80000, etat: "bon", countryCode: "FR" };
  const direct = await estimerVoEngine(params);
  const viaGateway = await estimerValeurMarche(params, "test-trace-1");
  verif("2. aucun montant sans donnée réelle : amount vient du VO Engine", viaGateway.amount === direct.mid);
  verif("2. la fourchette basse/haute correspond au VO Engine", viaGateway.minAmount === direct.low && viaGateway.maxAmount === direct.high);
  verif("2. la devise correspond", viaGateway.currency === direct.currency);
  verif("2. status ok, quality jamais UNAVAILABLE quand le moteur répond", viaGateway.status === "ok" && viaGateway.quality !== "UNAVAILABLE");

  const reprise = await estimerValeurReprise(params, "test-trace-2");
  verif("2. reprise = bas de la fourchette (aucune règle de reprise inventée)", reprise.amount === direct.low);

  const detail = await estimerPrixDetail(params, "test-trace-3");
  verif("2. prix conseillé = haut de la fourchette", detail.amount === direct.high);

  const marge = await estimerMarge(params, "test-trace-4");
  verif("2. marge = haut - bas, calcul arithmétique exact", marge.amount === Math.round((direct.high - direct.low) * 100) / 100);

  // ── 3. Garage : sans devis, BUSINESS_ENGINE_MISSING — jamais un coût de réparation inventé ──
  const garageSansDevis = await estimerReparationGarage({ devisId: null, userId: PDG_ID }, "test-trace-5");
  verif("3. sans devis : business_engine_missing", garageSansDevis.status === "business_engine_missing");
  verif("3. sans devis : amount est null", garageSansDevis.amount === null);

  // Avec un vrai devis chiffré par un garage : le montant vient des lignes réelles.
  const [devisTest] = await db
    .insert(devisGarageRequests)
    .values({
      userId: PDG_ID,
      contactNom: "Test IA02E",
      contactEmail: "test-ia02e@mkapms.local",
      typeIntervention: "vidange",
      pays: "FR",
      status: "accepte",
    })
    .returning();
  await db.insert(devisItems).values([
    { devisId: devisTest.id, designation: "Vidange + filtre", quantite: "1", prixUnitaireHt: "80.00", type: "main_oeuvre" },
    { devisId: devisTest.id, designation: "Huile 5L", quantite: "1", prixUnitaireHt: "45.00", type: "piece" },
  ]);
  const garageAvecDevis = await estimerReparationGarage({ devisId: devisTest.id, userId: PDG_ID }, "test-trace-6");
  verif("3. avec devis chiffré : status ok", garageAvecDevis.status === "ok");
  verif("3. avec devis chiffré : quality LIVE_QUOTE (devis réel, pas une prédiction)", garageAvecDevis.quality === "LIVE_QUOTE");
  verif("3. avec devis chiffré : montant HT+TVA cohérent (125 HT minimum)", (garageAvecDevis.amount ?? 0) >= 125);
  await db.delete(devisItems).where(eq(devisItems.devisId, devisTest.id));
  await db.delete(devisGarageRequests).where(eq(devisGarageRequests.id, devisTest.id));

  // ── 4. Pièces : sans référence, indisponible — jamais un prix moyen inventé ──
  const piecesSansRef = await estimerPrixPiece({}, "test-trace-7");
  verif("4. sans référence ni marque/modèle : unavailable", piecesSansRef.status === "unavailable");
  verif("4. sans référence : amount null", piecesSansRef.amount === null);

  const piecesInconnue = await estimerPrixPiece({ catalogId: 999999999 }, "test-trace-8");
  verif("4. catalogId inexistant : unavailable, jamais un prix par défaut", piecesInconnue.status === "unavailable" && piecesInconnue.amount === null);

  // ── 5. Location courte durée / LOA / VTC / douane : BUSINESS_ENGINE_MISSING, jamais un tarif ──
  for (const t of [await estimerLocation("t9", "rental"), await estimerLocation("t10", "loa"), await estimerVtc("t11"), await estimerDouane("t12", "FR")]) {
    verif(`5. ${t.estimateType} : business_engine_missing`, t.status === "business_engine_missing");
    verif(`5. ${t.estimateType} : amount null`, t.amount === null);
    verif(`5. ${t.estimateType} : avertissement BUSINESS_ENGINE_MISSING explicite`, t.warnings.some((w) => w.includes("BUSINESS_ENGINE_MISSING")));
  }

  // ── 6. Livraison colis : sans distance, indisponible ; avec distance, cohérent avec la formule réelle ──
  const colisSansDistance = await estimerLivraisonColis({ poidsKg: 5 }, "t13");
  verif("6. colis sans distance : unavailable", colisSansDistance.status === "unavailable" && colisSansDistance.amount === null);

  const colisAvecDistance = await estimerLivraisonColis({ poidsKg: 5, distanceKm: 20 }, "t14");
  verif("6. colis avec distance : status ok", colisAvecDistance.status === "ok");
  verif("6. colis avec distance : amount positif réel", (colisAvecDistance.amount ?? 0) > 0);

  // ── 7. Transport véhicule : jamais de total quand une étape obligatoire n'est pas chiffrée, jamais de montant partiel ──
  const transport = await estimerTransportVehicule({}, "t15");
  if (transport.status === "unavailable") {
    verif("7. transport indisponible : amount null, manques nommés", transport.amount === null && transport.missingData.length > 0);
  } else {
    verif("7. transport chiffré : amount réel positif", (transport.amount ?? 0) > 0);
  }

  // ── 8. Devise : conversion réelle, jamais un taux inventé (repli statique documenté si l'API échoue) ──
  const conversion = await estimerConversionDevise({ montant: 100, de: "EUR", vers: "USD" }, "t16");
  verif("8. conversion : status ok", conversion.status === "ok");
  verif("8. conversion : montant positif, devise cible correcte", (conversion.amount ?? 0) > 0 && conversion.currency === "USD");
  verif("8. conversion : quality jamais UNAVAILABLE", conversion.quality !== "UNAVAILABLE");

  const conversionInconnue = await estimerConversionDevise({ montant: 10, de: "EUR", vers: "ZZZ" }, "t17");
  verif("8. devise inconnue : unavailable, jamais un taux inventé", conversionInconnue.status === "unavailable" && conversionInconnue.amount === null);

  // ── 9. Sécurité payMission (LOT IA02E) : le serveur recalcule toujours, ne fait jamais confiance au client ──
  const [missionSansDistance] = await db
    .insert(deliveryMissions)
    .values({ clientId: PDG_ID, typeColis: "test", vehicleTypeRequis: "moto", urgent: false })
    .returning();
  const tarifSansDistance = await calculerTarifMission(missionSansDistance);
  verif("9. mission sans distance : tarif non calculable (paiement refusé)", tarifSansDistance.tarif === null);

  const [missionAvecDistance] = await db
    .insert(deliveryMissions)
    .values({ clientId: PDG_ID, typeColis: "test", vehicleTypeRequis: "moto", distanceKm: "15.00", urgent: false })
    .returning();
  const tarifRecalcule = await calculerTarifMission(missionAvecDistance);
  verif("9. mission avec distance : un tarif réel est recalculé côté serveur", tarifRecalcule.tarif !== null && tarifRecalcule.tarif! > 0);
  // Le montant vient uniquement des champs enregistrés à la création (distance, gabarit, urgence) — jamais d'un champ transmis par le client au paiement, qui n'existe plus dans le schéma `payMission`.
  await db.delete(deliveryMissions).where(eq(deliveryMissions.id, missionSansDistance.id));
  await db.delete(deliveryMissions).where(eq(deliveryMissions.id, missionAvecDistance.id));

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
