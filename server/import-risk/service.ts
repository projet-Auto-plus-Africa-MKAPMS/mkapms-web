/**
 * MKA.P-MS IMPORT RISK ENGINE — risques d'importation et d'homologation avant
 * achat ou livraison.
 *
 * Ce moteur ne détient **aucune** règle réglementaire : la source de vérité
 * reste le Country Policy Engine (`cpe_rules`), déjà confirmé par un humain
 * identifié. Ici on lit ces règles pour le pays de destination et on les
 * transforme en diagnostic lisible par un acheteur, en y ajoutant les seuls
 * constats que la plateforme peut réellement mesurer (pays d'origine, énergie,
 * classe d'émission, bornes recensées).
 *
 * Règle de conception héritée du Country Policy Engine : **l'absence
 * d'information n'est pas une autorisation.** Une donnée que nous n'avons pas
 * est affichée « non mesuré » ou « vérification requise », jamais « conforme ».
 * Un prix, une homologation ou un délai ne sont jamais inventés.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import { countryCountries } from "../country-os/index.js";
import { chargingPoints } from "../charging-engine/schema.js";
import { CPE_DOMAINS, reglesConfirmees } from "../country-policy/service.js";
import { emitSafe } from "../event-bus/service.js";

/**
 * Gravité d'un risque. Les trois derniers niveaux existent parce qu'ils sont la
 * réalité la plus fréquente : la plateforme ignore encore beaucoup de choses, et
 * le dire est plus utile qu'un feu vert non fondé.
 */
export const NIVEAUX = [
  "bloquant",
  "important",
  "verification",
  "non_mesure",
  "conforme",
] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const NIVEAU_LABELS: Record<Niveau, string> = {
  bloquant: "Bloquant",
  important: "Important",
  verification: "Vérification requise",
  non_mesure: "Non mesuré",
  conforme: "Conforme",
};

export interface Risque {
  code: string;
  titre: string;
  niveau: Niveau;
  /** Texte affichable tel quel à l'acheteur, sans reformulation. */
  message: string;
  /** D'où vient l'information : règle confirmée, donnée de l'annonce, ou rien. */
  preuve: string;
  /** Ce qui manque pour trancher, quand rien ne permet de trancher. */
  manque?: string;
}

export interface Diagnostic {
  annonceId: number;
  paysSource: string | null;
  paysDestination: string | null;
  paysDestinationNom: string | null;
  /** Faux quand le véhicule est déjà dans le pays de l'acheteur. */
  importation: boolean;
  risques: Risque[];
  /** Au moins un risque bloquant : l'achat ne peut pas se conclure en ligne. */
  bloquant: boolean;
  /** Un risque bloquant ou une vérification : confirmation humaine exigée. */
  confirmationRequise: boolean;
  resume: string;
  /** Domaines réglementaires sans règle confirmée pour ce pays. */
  domainesNonCouverts: string[];
}

/** Domaines réglementaires interrogés avant un achat transfrontalier. */
const DOMAINES_ACHAT = [
  "importation",
  "immatriculation",
  "controle_technique",
  "emissions",
  "vente_vehicule",
  "garantie",
] as const;

const TITRES: Record<string, string> = {
  importation: "Importation et douane",
  immatriculation: "Immatriculation (carte grise)",
  controle_technique: "Contrôle technique",
  emissions: "Normes d'émission",
  vente_vehicule: "Vente du véhicule",
  garantie: "Garantie légale",
};

function nombreDe(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/**
 * Un âge maximal d'importation est la cause la plus fréquente de refus à
 * l'arrivée. Quand la règle pays le précise dans ses conditions, on le compare
 * réellement à l'année du véhicule au lieu d'afficher la règle en vrac.
 */
function ageMaxDesConditions(conditions: Record<string, unknown>): number | null {
  for (const cle of ["ageMaxAnnees", "age_max_annees", "ageMax", "vehiculeAgeMax"]) {
    const n = nombreDe(conditions[cle]);
    if (n !== null && n > 0) return n;
  }
  return null;
}

export async function diagnostiquer(input: {
  annonceId: number;
  paysDestination?: string | null;
}): Promise<Diagnostic> {
  const [annonce] = await db
    .select({
      id: annonces.id,
      titre: annonces.titre,
      marque: annonces.marque,
      modele: annonces.modele,
      annee: annonces.annee,
      pays: annonces.pays,
      ville: annonces.ville,
      carburant: annonces.carburant,
      classeEmission: annonces.classeEmission,
      categorie: annonces.categorie,
    })
    .from(annonces)
    .where(eq(annonces.id, input.annonceId));

  if (!annonce) {
    throw new Error(`Annonce ${input.annonceId} introuvable.`);
  }

  const source = annonce.pays ? annonce.pays.toUpperCase() : null;
  const destination = input.paysDestination ? input.paysDestination.toUpperCase() : null;
  const risques: Risque[] = [];
  const domainesNonCouverts: string[] = [];

  if (!destination) {
    risques.push({
      code: "destination_inconnue",
      titre: "Pays de livraison",
      niveau: "verification",
      message:
        "Votre pays de livraison n'est pas connu : aucun risque d'importation ne peut être vérifié. " +
        "Choisissez votre pays pour obtenir le diagnostic réel.",
      preuve: "Aucun pays transmis par la navigation.",
      manque: "Pays de destination.",
    });
  }

  if (!source) {
    risques.push({
      code: "origine_inconnue",
      titre: "Pays d'origine du véhicule",
      niveau: "verification",
      message:
        "Le pays où se trouve ce véhicule n'est pas renseigné sur l'annonce. " +
        "Tant qu'il ne l'est pas, ni l'importation ni les documents ne peuvent être vérifiés.",
      preuve: "Champ « pays » vide sur l'annonce.",
      manque: "Pays d'origine déclaré par le vendeur.",
    });
  }

  const importation = Boolean(source && destination && source !== destination);

  let paysDestinationNom: string | null = null;
  if (destination) {
    const [pays] = await db
      .select({ nom: countryCountries.nameFr, actif: countryCountries.active })
      .from(countryCountries)
      .where(eq(countryCountries.code, destination));
    paysDestinationNom = pays?.nom ?? null;
    if (!pays) {
      risques.push({
        code: "pays_non_ouvert",
        titre: "Pays non ouvert",
        niveau: "bloquant",
        message:
          `${destination} n'est pas un pays ouvert sur la plateforme : nous ne pouvons ni livrer, ` +
          "ni garantir l'immatriculation de ce véhicule chez vous.",
        preuve: "Pays absent du référentiel Country OS.",
      });
    } else if (!pays.actif) {
      risques.push({
        code: "pays_desactive",
        titre: "Pays temporairement fermé",
        niveau: "bloquant",
        message:
          `Les opérations sont suspendues en ${pays.nom} : aucun achat transfrontalier n'y est conclu aujourd'hui.`,
        preuve: "Pays désactivé dans Country OS.",
      });
    }
  }

  if (importation && destination) {
    for (const domaine of DOMAINES_ACHAT) {
      const regles = await reglesConfirmees(destination, domaine);
      const libelle = TITRES[domaine] ?? CPE_DOMAINS[domaine] ?? domaine;

      if (regles.length === 0) {
        domainesNonCouverts.push(libelle);
        risques.push({
          code: `regle_absente_${domaine}`,
          titre: libelle,
          niveau: "verification",
          message:
            `Aucune règle confirmée pour « ${libelle} » en ${paysDestinationNom ?? destination}. ` +
            "Nous ne pouvons pas vous affirmer que ce véhicule sera acceptable : une vérification humaine est nécessaire avant tout achat.",
          preuve: "Country Policy Engine — aucune règle vérifiée et en cours de validité.",
          manque: `Règle « ${libelle} » à confirmer pour ${destination}.`,
        });
        continue;
      }

      const interdit = regles.find((r) => r.effect === "interdit");
      if (interdit) {
        const papiers =
          domaine === "immatriculation" || domaine === "importation"
            ? " Concrètement : il n'est pas homologué, vous ne pouvez pas faire les papiers, la voiture ne peut pas rouler ici."
            : "";
        risques.push({
          code: `interdit_${domaine}`,
          titre: libelle,
          niveau: "bloquant",
          message:
            `Interdit en ${paysDestinationNom ?? destination} : ${interdit.rule}.${papiers}`,
          preuve: `Règle pays confirmée #${interdit.id}${interdit.authority ? ` — ${interdit.authority}` : ""}.`,
        });
        continue;
      }

      const conditionne = regles.find((r) => r.effect === "conditionne");
      if (conditionne) {
        const ageMax = ageMaxDesConditions(conditionne.conditions);
        const age = annonce.annee ? new Date().getFullYear() - annonce.annee : null;
        if (ageMax !== null && age !== null && age > ageMax) {
          risques.push({
            code: `age_depasse_${domaine}`,
            titre: libelle,
            niveau: "bloquant",
            message:
              `Ce véhicule a ${age} ans et ${paysDestinationNom ?? destination} n'admet à l'importation ` +
              `que les véhicules de moins de ${ageMax} ans. Il n'est pas homologable : vous ne pourrez pas faire les papiers, ` +
              "la voiture ne pourra pas rouler ici.",
            preuve: `Règle pays confirmée #${conditionne.id} — âge maximal ${ageMax} ans.`,
          });
          continue;
        }
        risques.push({
          code: `conditionne_${domaine}`,
          titre: libelle,
          niveau: "important",
          message:
            `Autorisé sous conditions en ${paysDestinationNom ?? destination} : ${conditionne.rule}. ` +
            "Ces conditions doivent être réunies avant la livraison, sinon le véhicule reste immobilisé à l'arrivée.",
          preuve: `Règle pays confirmée #${conditionne.id}${conditionne.authority ? ` — ${conditionne.authority}` : ""}.`,
          manque:
            ageMax !== null && age === null
              ? "Année du véhicule absente de l'annonce : l'âge maximal ne peut pas être contrôlé."
              : undefined,
        });
        continue;
      }

      const autorise = regles[0];
      risques.push({
        code: `autorise_${domaine}`,
        titre: libelle,
        niveau: "conforme",
        message: `${libelle} : ${autorise.rule}`,
        preuve: `Règle pays confirmée #${autorise.id}${autorise.authority ? ` — ${autorise.authority}` : ""}.`,
      });
    }

    if (!annonce.classeEmission) {
      risques.push({
        code: "emission_inconnue",
        titre: "Classe d'émission",
        niveau: "verification",
        message:
          "La classe d'émission de ce véhicule n'est pas déclarée. Dans les pays qui appliquent une norme " +
          "à l'importation ou une zone à faibles émissions, elle conditionne l'immatriculation et la circulation.",
        preuve: "Champ « classe d'émission » vide sur l'annonce.",
        manque: "Classe d'émission déclarée par le vendeur.",
      });
    }

    if (
      annonce.carburant === "electrique" ||
      annonce.carburant === "hybride_rechargeable"
    ) {
      const [bornes] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(chargingPoints)
        .where(
          and(
            eq(chargingPoints.countryCode, destination),
            eq(chargingPoints.status, "publie"),
          ),
        );
      const n = bornes?.n ?? 0;
      risques.push(
        n === 0
          ? {
              code: "recharge_absente",
              titre: "Recharge sur place",
              niveau: "important",
              message:
                `Aucune borne de recharge n'est recensée en ${paysDestinationNom ?? destination} dans notre annuaire. ` +
                "Cela ne veut pas dire qu'il n'en existe aucune, mais nous ne pouvons pas vous garantir la recharge de ce véhicule.",
              preuve: "Charging Engine — 0 borne publiée pour ce pays.",
              manque: "Annuaire des bornes à alimenter pour ce pays.",
            }
          : {
              code: "recharge_recensee",
              titre: "Recharge sur place",
              niveau: "conforme",
              message: `${n} borne(s) de recharge recensée(s) en ${paysDestinationNom ?? destination}.`,
              preuve: "Charging Engine — bornes publiées.",
            },
      );
    }

    // Constats que la plateforme ne sait pas encore mesurer. Les afficher en
    // « non mesuré » est le seul choix honnête : les taire laisserait croire
    // que le dossier est complet.
    risques.push(
      {
        code: "conduite_cote",
        titre: "Côté de conduite",
        niveau: "non_mesure",
        message:
          "Le côté du volant n'est pas saisi sur les annonces. Entre deux pays de conduite opposée, " +
          "l'immatriculation peut être refusée ou exiger une transformation.",
        preuve: "Donnée absente du dépôt d'annonce.",
        manque: "Champ « côté de conduite » au dépôt d'annonce.",
      },
      {
        code: "douane_taxes",
        titre: "Droits de douane et taxes",
        niveau: "non_mesure",
        message:
          "Aucun barème douanier n'est connecté : nous n'affichons pas de montant de droits ni de taxes. " +
          "Un chiffre inventé vous coûterait plus cher qu'une absence de chiffre.",
        preuve: "Aucune source douanière raccordée.",
        manque: "Connecteur tarifaire douanier par pays.",
      },
      {
        code: "transport_prix_delai",
        titre: "Transport, prix et délai",
        niveau: "non_mesure",
        message:
          "Aucun transporteur n'est raccordé pour cette liaison : le prix et le délai de livraison ne sont pas mesurés.",
        preuve: "Aucun transporteur connecté.",
        manque: "Connecteur transporteur (tarif, itinéraire, délai).",
      },
      {
        code: "pieces_disponibles",
        titre: "Disponibilité des pièces",
        niveau: "non_mesure",
        message:
          `La disponibilité des pièces ${annonce.marque} ${annonce.modele} en ${paysDestinationNom ?? destination} ` +
          "n'est pas mesurée : un entretien peut devenir difficile ou coûteux.",
        preuve: "Catalogue pièces non rattaché au pays de destination.",
        manque: "Couverture pièces par pays.",
      },
    );
  } else if (source && destination && source === destination) {
    risques.push({
      code: "pas_importation",
      titre: "Importation",
      niveau: "conforme",
      message: `Ce véhicule est déjà en ${paysDestinationNom ?? destination} : aucune importation, aucun dédouanement.`,
      preuve: "Pays de l'annonce identique au pays de livraison.",
    });
  }

  const bloquant = risques.some((r) => r.niveau === "bloquant");
  const confirmationRequise =
    bloquant || risques.some((r) => r.niveau === "verification" || r.niveau === "important");

  const compte = (n: Niveau) => risques.filter((r) => r.niveau === n).length;
  const resume = bloquant
    ? `Achat bloqué : ${compte("bloquant")} obstacle(s) réglementaire(s) identifié(s).`
    : importation
      ? `Importation : ${compte("verification")} point(s) à vérifier, ${compte("important")} point(s) important(s), ${compte("non_mesure")} non mesuré(s).`
      : "Aucun risque d'importation : le véhicule est dans votre pays.";

  if (bloquant) {
    await emitSafe({
      source: "import_risk",
      type: "vehicule.risque_import",
      payload: {
        annonceId: annonce.id,
        paysSource: source ?? "",
        paysDestination: destination ?? "",
        niveau: "bloquant",
        motif: risques.find((r) => r.niveau === "bloquant")?.message ?? "",
      },
    });
  }

  return {
    annonceId: annonce.id,
    paysSource: source,
    paysDestination: destination,
    paysDestinationNom,
    importation,
    risques,
    bloquant,
    confirmationRequise,
    resume,
    domainesNonCouverts,
  };
}

/**
 * Surface de supervision : ce que le moteur sait faire et ce qui lui manque.
 * Consommée par le registre central et le Completion Center.
 */
export async function controlCenterFeed() {
  const [regles] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(countryCountries)
    .where(eq(countryCountries.active, true));

  return {
    version: "1",
    health: "ok" as const,
    resume:
      "Diagnostic de risque avant achat, adossé aux règles pays confirmées. " +
      "Douane, transport, côté de conduite et couverture pièces restent non mesurés faute de connecteur.",
    paysActifs: regles?.n ?? 0,
    manques: [
      "Connecteur tarifaire douanier par pays",
      "Connecteur transporteur (prix, itinéraire, délai)",
      "Champ « côté de conduite » au dépôt d'annonce",
      "Couverture pièces par pays",
    ],
  };
}
