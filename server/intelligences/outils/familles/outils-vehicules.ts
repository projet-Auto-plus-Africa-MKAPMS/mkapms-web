/**
 * MKA.P-MS Intelligence — implémentations réelles de la famille "vehicules"
 * (server/intelligences/outils/familles/vehicules.ts).
 *
 * Réutilise les moteurs déjà existants (vo-engine, country-os, annonces) —
 * aucune donnée ni logique métier dupliquée. Un résultat non mesurable est
 * toujours déclaré tel quel (confiance faible / non vérifié / indisponible),
 * jamais inventé.
 */
import { and, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db } from "../../../db.js";
import { annonces } from "../../../schema.js";
import { estimate, type EstimateInput } from "../../../vo-engine/service.js";
import { voEstimations } from "../../../vo-engine/schema.js";
import type { ImplementationOutil } from "../outils-test.js";

// ── decodeVIN : décodage structurel ISO 3779, sans appel externe ──────────

/**
 * Table WMI volontairement partielle (constructeurs les plus courants sur
 * les marchés déjà ouverts). Un WMI absent n'est jamais traité comme une
 * erreur : la confiance retombe à "faible", le VIN reste valide.
 */
const WMI_CONNUS: Record<string, { constructeur: string; pays: string }> = {
  VF1: { constructeur: "Renault", pays: "France" },
  VF3: { constructeur: "Peugeot", pays: "France" },
  VF7: { constructeur: "Citroën", pays: "France" },
  WVW: { constructeur: "Volkswagen", pays: "Allemagne" },
  WBA: { constructeur: "BMW", pays: "Allemagne" },
  WDB: { constructeur: "Mercedes-Benz", pays: "Allemagne" },
  WDD: { constructeur: "Mercedes-Benz", pays: "Allemagne" },
  WAU: { constructeur: "Audi", pays: "Allemagne" },
  JTD: { constructeur: "Toyota", pays: "Japon" },
  JHM: { constructeur: "Honda", pays: "Japon" },
  JN1: { constructeur: "Nissan", pays: "Japon" },
  KMH: { constructeur: "Hyundai", pays: "Corée du Sud" },
  KNA: { constructeur: "Kia", pays: "Corée du Sud" },
  "1FA": { constructeur: "Ford", pays: "États-Unis" },
  "1GC": { constructeur: "Chevrolet", pays: "États-Unis" },
  ZFA: { constructeur: "Fiat", pays: "Italie" },
  SAJ: { constructeur: "Jaguar", pays: "Royaume-Uni" },
};

/** Code année-modèle ISO 3779 (position 10), cycle de 30 ans. */
const CODE_ANNEE: Record<string, number[]> = {};
{
  const sequence = "ABCDEFGHJKLMNPRSTVWXY123456789";
  for (let cycle = 0; cycle < 3; cycle++) {
    for (let i = 0; i < sequence.length; i++) {
      const annee = 1980 + cycle * 30 + i;
      const lettre = sequence[i];
      CODE_ANNEE[lettre] = [...(CODE_ANNEE[lettre] ?? []), annee];
    }
  }
}

export interface DecodeVinResultat {
  valide: boolean;
  wmi: string;
  pays: string;
  constructeur: string;
  anneeModele: number | null;
  confiance: "moyenne" | "faible" | "aucune";
  motif: string;
}

export function decoderVin(vinBrut: string): DecodeVinResultat {
  const vin = (vinBrut || "").trim().toUpperCase();
  const formatValide = /^[A-HJ-NPR-Z0-9]{17}$/.test(vin); // I, O, Q exclus par la norme

  if (!formatValide) {
    return {
      valide: false,
      wmi: "",
      pays: "",
      constructeur: "",
      anneeModele: null,
      confiance: "aucune",
      motif: "Format invalide : un VIN fait 17 caractères, sans I/O/Q.",
    };
  }

  const wmi = vin.slice(0, 3);
  const connu = WMI_CONNUS[wmi] ?? WMI_CONNUS[wmi.slice(0, 1) as never];
  const codeAnnee = vin[9];
  const anneesPossibles = CODE_ANNEE[codeAnnee] ?? [];
  // Sans année déclarée par ailleurs, on retient la plus récente plausible.
  const anneeModele = anneesPossibles.length > 0 ? anneesPossibles[anneesPossibles.length - 1] : null;

  return {
    valide: true,
    wmi,
    pays: connu?.pays ?? "",
    constructeur: connu?.constructeur ?? "",
    anneeModele,
    confiance: connu ? "moyenne" : "faible",
    motif: connu
      ? "WMI reconnu dans la table interne."
      : "Format valide mais WMI absent de la table interne (partielle) : constructeur non identifié.",
  };
}

// ── normalizeVehicleData ───────────────────────────────────────────────

const CARBURANTS: Record<string, string> = {
  essence: "essence",
  diesel: "diesel",
  gazole: "diesel",
  electrique: "electrique",
  électrique: "electrique",
  hybride: "hybride",
  gpl: "gpl",
};
const BOITES: Record<string, string> = {
  automatique: "automatique",
  auto: "automatique",
  manuelle: "manuelle",
  manuel: "manuelle",
};

function titreCasse(valeur: string): string {
  return valeur
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());
}

// ── Implémentations exposées à l'exécuteur ────────────────────────────

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "vehicules.decodeVIN": async (args) => {
    const resultat = decoderVin(String(args.vin ?? ""));
    return resultat;
  },

  "vehicules.identifyVehicleByVIN": async (args) => {
    const vin = String(args.vin ?? "").trim().toUpperCase();
    const decode = decoderVin(vin);
    if (!decode.valide) return { trouve: false, source: "aucune", confiance: "aucune", decode };

    const [precedente] = await db
      .select()
      .from(voEstimations)
      .where(eq(voEstimations.vin, vin))
      .orderBy(sql`${voEstimations.createdAt} desc`)
      .limit(1);

    if (precedente) {
      return {
        trouve: true,
        source: "estimation_precedente",
        confiance: "moyenne",
        marque: precedente.marque,
        modele: precedente.modele,
        annee: precedente.annee,
        decode,
      };
    }
    return {
      trouve: false,
      source: "decodage_structurel_seul",
      confiance: decode.confiance,
      motif: "Aucune estimation MKA.P-MS déjà demandée pour ce VIN, et aucune colonne VIN sur les annonces publiées.",
      decode,
    };
  },

  "vehicules.identifyVehicleByPlate": async (args) => {
    const countryCode = String(args.countryCode ?? "").toUpperCase();
    const { getCountry } = await import("../../../country-os/index.js");
    const pays = countryCode ? await getCountry(countryCode) : null;
    return {
      trouve: false,
      confiance: "insuffisante",
      motif: !countryCode
        ? "countryCode requis : le Country Engine ne peut pas choisir de règle sans pays."
        : !pays || !pays.active
          ? `Pays ${countryCode} non ouvert au Country Engine : aucune règle applicable.`
          : `Aucun registre d'immatriculation connecté pour ${countryCode}. Repli vérification manuelle recommandé.`,
    };
  },

  "vehicules.getVehicleTechnicalData": async () => ({
    disponible: false,
    motif: "Fournisseur donnees_vehicules non configuré (VEHICLE_TECH_DATA_API_KEY absent).",
  }),

  "vehicules.getVehicleOptions": async () => ({
    disponible: false,
    options: [],
    motif: "Fournisseur donnees_vehicules non configuré (VEHICLE_TECH_DATA_API_KEY absent). Repli : options déclarées par le vendeur, si présentes dans l'annonce.",
  }),

  "vehicules.getVehicleMarketValue": async (args) => {
    const r = await estimate(versEstimateInput(args));
    return { low: r.low, mid: r.mid, high: r.high, devise: r.currency, confiance: r.confidence, methode: r.method, disclaimer: r.disclaimer };
  },

  "vehicules.getTradeInValue": async (args) => {
    const r = await estimate(versEstimateInput(args));
    // La reprise se cadre sur le bas de la fourchette de marché : c'est ce
    // que l'acheteur professionnel reprend, pas ce qu'il revendra.
    return { valeurReprise: r.low, devise: r.currency, confiance: r.confidence, disclaimer: r.disclaimer };
  },

  "vehicules.estimateRetailPrice": async (args) => {
    const r = await estimate(versEstimateInput(args));
    // Le prix conseillé au détail se cadre sur le haut de la fourchette de
    // marché — même estimation réelle, lecture différente de la fourchette.
    return { prixConseille: r.high, devise: r.currency, confiance: r.confidence, disclaimer: r.disclaimer };
  },

  "vehicules.estimateMargin": async (args) => {
    const r = await estimate(versEstimateInput(args));
    // Marge = même fourchette réelle, écart entre son bas (reprise) et son
    // haut (détail) — aucune règle de marge inventée, c'est l'écart déjà
    // publié par le VO Engine pour cette estimation.
    return { margeEstimee: r.high - r.low, devise: r.currency, confiance: r.confidence, disclaimer: r.disclaimer };
  },

  "vehicules.checkVehicleHistory": async () => ({
    disponible: false,
    verifie: false,
    motif: "Aucun registre d'historique (sinistres/accidents) connecté pour aucun pays : jamais déclaré « sain » sans preuve.",
  }),

  "vehicules.checkRecall": async () => ({
    disponible: false,
    verifie: false,
    motif: "Aucune base de rappels constructeur connectée : jamais déclaré « aucun rappel » sans preuve.",
  }),

  "vehicules.checkVehicleConsistency": async (args) => {
    const vin = String(args.vin ?? "");
    const decode = decoderVin(vin);
    const ecarts: string[] = [];
    if (!decode.valide) {
      return { coherent: false, ecarts: ["VIN de format invalide."], decode };
    }
    const marqueDeclaree = args.marqueDeclaree ? String(args.marqueDeclaree) : null;
    const anneeDeclaree = typeof args.anneeDeclaree === "number" ? args.anneeDeclaree : null;

    if (marqueDeclaree && decode.constructeur && titreCasse(marqueDeclaree) !== titreCasse(decode.constructeur)) {
      ecarts.push(`Marque déclarée « ${marqueDeclaree} » ≠ constructeur décodé du VIN « ${decode.constructeur} ».`);
    }
    if (anneeDeclaree && decode.anneeModele && Math.abs(anneeDeclaree - decode.anneeModele) > 1) {
      ecarts.push(`Année déclarée ${anneeDeclaree} éloignée de l'année-modèle décodée ${decode.anneeModele} (plage 30 ans, ambiguïté possible).`);
    }
    return { coherent: ecarts.length === 0, ecarts, decode };
  },

  "vehicules.normalizeVehicleData": async (args) => ({
    marque: args.marque ? titreCasse(String(args.marque)) : undefined,
    modele: args.modele ? titreCasse(String(args.modele)) : undefined,
    carburant: args.carburant ? CARBURANTS[String(args.carburant).toLowerCase()] ?? String(args.carburant).toLowerCase() : undefined,
    boite: args.boite ? BOITES[String(args.boite).toLowerCase()] ?? String(args.boite).toLowerCase() : undefined,
  }),

  "vehicules.detectVehicleDuplicate": async (args) => {
    const marque = args.marque ? String(args.marque) : null;
    const modele = args.modele ? String(args.modele) : null;
    if (!marque || !modele) {
      return { doublonProbable: false, annonceIds: [], motif: "marque et modele requis pour comparer (aucune colonne VIN sur les annonces)." };
    }
    const annee = typeof args.annee === "number" ? args.annee : null;
    const km = typeof args.kilometrage === "number" ? args.kilometrage : null;

    const conditions = [eq(annonces.status, "publiee"), ilike(annonces.marque, marque), ilike(annonces.modele, modele)];
    if (annee) {
      conditions.push(gte(annonces.annee, annee - 1));
      conditions.push(lte(annonces.annee, annee + 1));
    }
    const candidats = await db
      .select({ id: annonces.id, kilometrage: annonces.kilometrage })
      .from(annonces)
      .where(and(...conditions))
      .limit(20);

    const proches = km
      ? candidats.filter((c) => c.kilometrage === null || Math.abs(c.kilometrage - km) <= 2000)
      : candidats;

    return {
      doublonProbable: proches.length > 0,
      annonceIds: proches.map((c) => c.id),
      motif: "Comparaison sur marque + modèle + année ± 1 + kilométrage ± 2000 km (aucune colonne VIN sur les annonces).",
    };
  },
};

function versEstimateInput(args: Record<string, unknown>): EstimateInput {
  return {
    marque: String(args.marque ?? ""),
    modele: String(args.modele ?? ""),
    annee: typeof args.annee === "number" ? args.annee : null,
    kilometrage: typeof args.kilometrage === "number" ? args.kilometrage : null,
    etat: args.etat ? String(args.etat) : null,
    countryCode: args.countryCode ? String(args.countryCode) : undefined,
  };
}
