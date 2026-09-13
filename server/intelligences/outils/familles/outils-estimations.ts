/**
 * MKA.P-MS Intelligence — implémentations réelles de la famille "estimations"
 * (server/intelligences/outils/familles/estimations.ts).
 *
 * Chaque outil ne fait qu'appeler l'Estimate Gateway
 * (server/estimate-gateway/gateway.ts) et renvoyer son résultat tel quel :
 * aucune logique de prix ici, uniquement la conversion arguments → appel.
 */
import { randomUUID } from "node:crypto";
import type { ImplementationOutil } from "../outils-test.js";
import {
  estimerConversionDevise,
  estimerDouane,
  estimerImportation,
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
} from "../../../estimate-gateway/gateway.js";

function vehiculeArgs(args: Record<string, unknown>) {
  return {
    marque: String(args.marque ?? ""),
    modele: String(args.modele ?? ""),
    annee: typeof args.annee === "number" ? args.annee : null,
    kilometrage: typeof args.kilometrage === "number" ? args.kilometrage : null,
    etat: typeof args.etat === "string" ? args.etat : null,
    countryCode: typeof args.countryCode === "string" ? args.countryCode : undefined,
  };
}

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "estimate.vehicle.marketValue": async (args) => estimerValeurMarche(vehiculeArgs(args), randomUUID()),
  "estimate.vehicle.tradeIn": async (args) => estimerValeurReprise(vehiculeArgs(args), randomUUID()),
  "estimate.vehicle.retail": async (args) => estimerPrixDetail(vehiculeArgs(args), randomUUID()),
  "estimate.vehicle.margin": async (args) => estimerMarge(vehiculeArgs(args), randomUUID()),

  "estimate.garage.repair": async (args, contexte) =>
    estimerReparationGarage(
      { devisId: typeof args.devisId === "number" ? args.devisId : null, userId: contexte?.actorId ?? null },
      randomUUID(),
    ),

  "estimate.parts.price": async (args) =>
    estimerPrixPiece(
      {
        catalogId: typeof args.catalogId === "number" ? args.catalogId : null,
        marque: typeof args.marque === "string" ? args.marque : null,
        modele: typeof args.modele === "string" ? args.modele : null,
        annee: typeof args.annee === "number" ? args.annee : null,
      },
      randomUUID(),
    ),

  "estimate.rental": async () => estimerLocation(randomUUID(), "rental"),
  "estimate.loa": async () => estimerLocation(randomUUID(), "loa"),
  "estimate.vtc": async () => estimerVtc(randomUUID()),

  "estimate.transport": async (args) =>
    estimerTransportVehicule(
      {
        annonceId: typeof args.annonceId === "number" ? args.annonceId : null,
        mode: typeof args.mode === "string" ? (args.mode as never) : null,
        categorie: typeof args.categorie === "string" ? (args.categorie as never) : null,
        paysDepart: typeof args.paysDepart === "string" ? args.paysDepart : null,
        paysArrivee: typeof args.paysArrivee === "string" ? args.paysArrivee : null,
        distanceKm: typeof args.distanceKm === "number" ? args.distanceKm : null,
      },
      randomUUID(),
    ),

  "estimate.delivery": async (args) =>
    estimerLivraisonColis(
      {
        poidsKg: typeof args.poidsKg === "number" ? args.poidsKg : null,
        longueurCm: typeof args.longueurCm === "number" ? args.longueurCm : null,
        largeurCm: typeof args.largeurCm === "number" ? args.largeurCm : null,
        hauteurCm: typeof args.hauteurCm === "number" ? args.hauteurCm : null,
        distanceKm: typeof args.distanceKm === "number" ? args.distanceKm : null,
        urgent: Boolean(args.urgent),
      },
      randomUUID(),
    ),

  "estimate.import": async (args) => {
    if (typeof args.annonceId !== "number") throw new Error("annonceId requis pour estimer un risque d'importation.");
    return estimerImportation(
      { annonceId: args.annonceId, paysDestination: typeof args.paysDestination === "string" ? args.paysDestination : null },
      randomUUID(),
    );
  },

  "estimate.customs": async (args) => estimerDouane(randomUUID(), typeof args.countryCode === "string" ? args.countryCode : null),

  "estimate.currency": async (args) => {
    if (typeof args.montant !== "number" || typeof args.de !== "string" || typeof args.vers !== "string") {
      throw new Error("montant, de et vers sont requis pour une conversion de devise.");
    }
    return estimerConversionDevise({ montant: args.montant, de: args.de, vers: args.vers }, randomUUID());
  },
};
