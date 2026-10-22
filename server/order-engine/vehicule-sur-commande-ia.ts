/**
 * Order Engine — orchestration « mode assisté par IA » (sections 2, 4 et 5,
 * demande PDG). Un seul point d'entrée qui enchaîne des étapes qui existent
 * déjà dans le Vehicle Engine (LOT 2, `server/vehicle-engine/`) — jamais un
 * second moteur, jamais une annonce fabriquée.
 *
 * Règle PDG absolue : l'IA n'est qu'un outil d'aide, jamais une condition.
 * L'étape d'analyse IA elle-même (`analyserIA`) répond honnêtement
 * NOT_CONNECTED aujourd'hui (aucune brique MKA.P-MS AI dédiée branchée pour
 * les véhicules — voir `server/intelligences/outils/familles/vehicules.ts`)
 * — jamais simulée — et ne bloque jamais la suite : le reste du pipeline
 * (mapping, doublons, qualité, prix, territoires) fonctionne entièrement
 * sans elle, exactement comme pour n'importe quel autre véhicule fournisseur
 * ingéré par ce moteur depuis le LOT 2.
 *
 * La publication réelle (`validerEtPublier`) reste réservée à la Direction
 * (`directionProcedure`, LOT 2) — jamais à cette orchestration seule.
 */
import * as vehicleEngine from "../vehicle-engine/service.js";
import { enregistrerAnnonceSurCommande } from "./service.js";

/**
 * Étapes automatiques (sans décision humaine à chaque étape) : ingestion,
 * mapping/normalisation, détection de doublons, analyse des données,
 * contrôle qualité, analyse IA. Toujours honnête : un doublon détecté ou un
 * contrôle qualité en erreur n'est jamais masqué, seulement rapporté pour
 * revue humaine avant la suite (`finaliserEtPublier`).
 */
export async function lancerAssistantDepot(input: {
  supplierProfileId: number;
  supplierVehicleId: string;
  ingestMethod: string;
  rawData: Record<string, unknown>;
  actorId: number;
}) {
  const item = await vehicleEngine.ingererVehicule({
    supplierProfileId: input.supplierProfileId,
    supplierVehicleId: input.supplierVehicleId,
    ingestMethod: input.ingestMethod,
    rawData: input.rawData,
    actorId: input.actorId,
  });
  const normalise = await vehicleEngine.mapperEtNormaliser(item.id, input.actorId);
  const doublons = await vehicleEngine.detecterDoublons(item.id, input.actorId);
  const donnees = await vehicleEngine.analyserDonnees(item.id, input.actorId);
  const qualite = await vehicleEngine.controlerQualite(item.id, input.actorId);
  const ia = await vehicleEngine.analyserIA(item.id, input.actorId);
  return { vehicleItemId: item.id, normalise, doublons, donnees, qualite, ia };
}

/**
 * Prix (humain, jamais déduit de l'IA) + territoires minimaux + préparation.
 * Rapporte honnêtement ce qui manque (`preparerPourPublication`) plutôt que
 * de forcer une publication incomplète.
 */
export async function preparerPublicationAssistee(input: {
  vehicleItemId: number;
  supplierPrice: number;
  supplierCurrency: string;
  commissionRatePct: number;
  pickupCity?: string;
  pickupCountryCode?: string;
  actorId: number;
}) {
  await vehicleEngine.calculerPrix({
    vehicleItemId: input.vehicleItemId,
    supplierPrice: input.supplierPrice,
    supplierCurrency: input.supplierCurrency,
    commissionRatePct: input.commissionRatePct,
    actorId: input.actorId,
  });
  await vehicleEngine.definirTerritoiresVehicule({
    vehicleItemId: input.vehicleItemId,
    allowedSaleCountries: [],
    pickupCity: input.pickupCity,
    pickupCountryCode: input.pickupCountryCode,
    actorId: input.actorId,
  });
  await vehicleEngine.assurerDisponibilite(input.vehicleItemId);
  return vehicleEngine.preparerPourPublication(input.vehicleItemId, input.actorId);
}

/**
 * Publication réelle (réservée à la Direction, `directionProcedure` côté
 * routeur) puis liaison immédiate dans l'Order Engine — sans cette liaison,
 * l'annonce serait publiée comme un véhicule normal, jamais comme
 * « véhicule sur commande ».
 */
export async function publierEtLierVehiculeSurCommande(input: { vehicleItemId: number; actorId: number }) {
  const { annonceId } = await vehicleEngine.validerEtPublier({ vehicleItemId: input.vehicleItemId, actorId: input.actorId });
  const detail = await vehicleEngine.obtenirVehiculeDetail(input.vehicleItemId);
  await enregistrerAnnonceSurCommande({
    annonceId,
    supplierProfileId: detail.item.supplierProfileId,
    vehicleItemId: input.vehicleItemId,
    creationMode: "ia_assistee",
    employeeId: input.actorId,
  });
  return { annonceId };
}
