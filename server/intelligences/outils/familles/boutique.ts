/**
 * MKA.P-MS AI — Tool Registry, famille Boutique (catégorie « boutique »).
 *
 * L'IA principale travaille DANS la boutique (SHOP) avec le jeton de service que le PDG a créé côté boutique et
 * déposé dans le Coffre secret (server/intelligences/boutique.ts). Décision du PDG du 2 octobre 2026.
 *
 * Trois outils de lecture et deux outils d'écriture de faible risque, tous bornés par les portées du jeton :
 *  - lancer les photos met une tâche en file côté boutique (droits d'image = ceux enregistrés par le PDG) ;
 *  - proposer une fiche écrit un BROUILLON « à relire » : seul le PDG approuve et publie, dans la boutique.
 * Aucun outil ne touche un prix, une TVA, un stock, une livraison, ni n'approuve ou ne publie quoi que ce soit : la
 * boutique ne l'autorise pas à ce jeton, et aucun outil n'existe pour le demander.
 *
 * Réservés au PDG, comme le coffre dont ils dépendent.
 */
import type { OutilSpec } from "../registre.js";

const COMMUN = {
  version: "1.0.0",
  available: true,
  enabled: true,
  implementationStatus: "IMPLEMENTED" as const,
  allowedRoles: ["super_admin"],
  allowedCountries: null,
  blockedCountries: [],
  requiredSubscription: null,
  requiresHumanApproval: false,
  requiresStrongAuthentication: false,
  category: "boutique" as const,
  provider: "Boutique MKA.P-MS (SHOP) — jeton de service du coffre secret",
  internalReplacementStatus: "Sans objet — SHOP est le moteur de la boutique ; son IA propre prendra le relais quand elle sera prête.",
  timeoutMs: 25_000,
  auditCategory: "boutique_service",
};

const LECTURE = {
  ...COMMUN,
  requiredPermissions: ["READ" as const],
  riskLevel: "READ_ONLY" as const,
  idempotent: true,
  legalBasis: "Lecture des fiches de la boutique de l'entreprise avec un jeton que le PDG a lui-même créé (portée catalogue.read) ; usage journalisé dans le coffre et dans la boutique.",
  fallback: "Adresse ou jeton absent, refusé, expiré ou boutique indisponible : l'outil le dit tel quel — jamais une fiche supposée.",
};

const ECRITURE = {
  ...COMMUN,
  requiredPermissions: ["WRITE" as const],
  riskLevel: "LOW" as const,
  idempotent: false,
};

export const OUTILS_BOUTIQUE: OutilSpec[] = [
  {
    ...LECTURE,
    toolId: "boutique.capacites",
    name: "boutiqueCapacites",
    description:
      "Dit ce que le jeton de service de la boutique permet réellement (portées accordées) et ce qui reste interdit quelle que soit la portée (prix, TVA, stock, livraison, approbation, publication). À utiliser avant de promettre un travail dans la boutique.",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, scopes: { type: "array" }, neverAllowed: { type: "array" }, note: { type: "string" } } },
  },
  {
    ...LECTURE,
    toolId: "boutique.listerProduits",
    name: "boutiqueListerProduits",
    description:
      "Liste les fiches produit en cours dans la boutique (identifiant, titre, SKU, état de relecture et révision, publiée ou non, nombre de photos originales archivées et de photos premium prêtes, état de la tâche photo). Jamais de prix. Filtre facultatif par état : DRAFT, REVIEW_REQUIRED, APPROVED, REJECTED, NEEDS_CORRECTION.",
    schemaInput: {
      type: "object",
      properties: { etat: { type: "string", enum: ["DRAFT", "REVIEW_REQUIRED", "APPROVED", "REJECTED", "NEEDS_CORRECTION"] }, limite: { type: "number" }, decalage: { type: "number" } },
      required: [],
    },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, rows: { type: "array" } } },
  },
  {
    ...LECTURE,
    toolId: "boutique.lireProduit",
    name: "boutiqueLireProduit",
    description:
      "Lit une fiche produit de la boutique : titre fournisseur et titre actuel, description fournisseur originale, brouillon de description MKA.P-MS, champs et leur source, colis, état et révision, médias (état, contrôle de marque, photo principale). Jamais de prix ni d'adresse fournisseur.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" }, revision: { type: "number" }, media: { type: "array" } } },
  },
  {
    ...ECRITURE,
    toolId: "boutique.lancerPhotos",
    name: "boutiqueLancerPhotos",
    description:
      "Met en file, dans la boutique, la préparation des photos MKA.P-MS d'une fiche (archivage de l'original, recadrage fidèle sans rien inventer, contrôle de marque). Exige que le PDG ait déjà enregistré les droits d'image du fournisseur dans la boutique ; sinon l'outil le dit et rien ne démarre. Ne publie rien.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, detail: { type: "string" } } },
    legalBasis: "Mise en file d'un traitement déjà prévu par la boutique, avec la référence de droits d'image enregistrée par le PDG pour le fournisseur (portée photos.work) ; usage journalisé.",
    fallback: "Droits d'image absents, jeton sans la portée, ou boutique indisponible : l'outil le dit tel quel — aucune photo n'est traitée.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.proposerFiche",
    name: "boutiqueProposerFiche",
    description:
      "Propose le contenu d'une fiche produit (titre, description MKA.P-MS originale, caractéristiques avec leur source, colis). C'est un BROUILLON « à relire » : le PDG l'approuve ou le refuse dans la boutique, jamais l'IA. Lire d'abord la fiche (révision attendue). N'inventer aucune caractéristique : chaque champ renseigné exige sa source ; un champ inconnu reste FIELD_MISSING. Champs possibles : RecommendedAgeMin, RecommendedAgeMax, MaxChildWeight, Seats, ProductLength, ProductWidth, ProductHeight, ProductWeight, BatteryVoltage, BatteryCapacity, MotorCount, MotorPower, MaxSpeed, RemoteControl, SafetyWarnings, etc. (liste exacte validée par la boutique). Statuts : FIELD_AVAILABLE (valeur + source), FIELD_NOT_APPLICABLE (source), FIELD_UNVERIFIED, FIELD_MISSING.",
    schemaInput: {
      type: "object",
      properties: {
        produitId: { type: "string" },
        revisionAttendue: { type: "number" },
        titre: { type: "string" },
        descriptionBoutique: { type: "string" },
        champs: { type: "object" },
        colis: { type: "array" },
      },
      required: ["produitId", "revisionAttendue", "titre", "descriptionBoutique"],
    },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, saved: { type: "boolean" }, revision: { type: "number" }, state: { type: "string" } } },
    legalBasis: "Écriture d'un brouillon de fiche, non publié et soumis à relecture du PDG, avec un jeton que le PDG a lui-même créé (portée drafts.propose) ; historique signé côté boutique.",
    fallback: "Jeton sans la portée, révision périmée, champ sans source ou boutique indisponible : l'outil le dit tel quel — rien n'est enregistré.",
  },
];
