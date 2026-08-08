/**
 * MKA.P-MS Pro Account Engine — amorce des règles pays / métier.
 *
 * Ce fichier n'est qu'un point de départ : dès qu'une règle existe en base,
 * c'est elle qui fait autorité. Ajouter un pays ou durcir un métier se fait
 * en base, sans retoucher le parcours ni redéployer le portail.
 *
 * Honnêteté volontaire : cette amorce ne prétend pas couvrir la
 * réglementation mondiale. Un pays absent d'ici retombe sur le socle commun
 * (identité, entreprise, adresse, contact) et n'exige rien d'inventé.
 */

/** Libellés lisibles des champs du dossier professionnel. */
export const FIELD_LABELS: Record<string, string> = {
  contactFirstName: "Prénom du représentant légal",
  contactLastName: "Nom du représentant légal",
  contactEmail: "Adresse e-mail professionnelle",
  contactPhone: "Téléphone professionnel",
  legalName: "Dénomination sociale",
  legalForm: "Forme juridique",
  registrationNumber: "Numéro d'immatriculation",
  vatNumber: "Numéro de TVA",
  addressLine: "Adresse de l'établissement",
  city: "Ville",
  postalCode: "Code postal",
  website: "Site internet",
};

export interface CountryRuleSeed {
  countryCode: string;
  /** `null` = règle applicable à tous les métiers du pays. */
  professionCode?: string | null;
  requiredFields: string[];
  requiredDocs: string[];
  registrationLabel: string;
  notes?: string;
}

export const COUNTRY_RULES: CountryRuleSeed[] = [
  // ── France ──────────────────────────────────────────────────────────────
  {
    countryCode: "FR",
    requiredFields: ["legalForm", "registrationNumber", "postalCode"],
    requiredDocs: ["Extrait Kbis de moins de 3 mois", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro SIRET",
    notes: "La TVA intracommunautaire est exigée pour les activités de vente et de location.",
  },
  {
    countryCode: "FR",
    professionCode: "vendeur",
    requiredFields: ["vatNumber"],
    requiredDocs: ["Attestation de TVA intracommunautaire"],
    registrationLabel: "Numéro SIRET",
  },
  {
    countryCode: "FR",
    professionCode: "concessionnaire",
    requiredFields: ["vatNumber"],
    requiredDocs: ["Attestation de TVA intracommunautaire", "Justificatif de représentation de marque"],
    registrationLabel: "Numéro SIRET",
  },
  {
    countryCode: "FR",
    professionCode: "loueur",
    requiredFields: ["vatNumber"],
    requiredDocs: ["Attestation d'assurance flotte en location"],
    registrationLabel: "Numéro SIRET",
  },
  {
    countryCode: "FR",
    professionCode: "vtc_taxi",
    requiredFields: [],
    requiredDocs: ["Carte professionnelle VTC ou licence de taxi", "Attestation d'assurance transport de personnes"],
    registrationLabel: "Numéro SIRET",
  },
  {
    countryCode: "FR",
    professionCode: "controle_technique",
    requiredFields: [],
    requiredDocs: ["Agrément de centre de contrôle technique"],
    registrationLabel: "Numéro SIRET",
  },

  // ── Belgique ────────────────────────────────────────────────────────────
  {
    countryCode: "BE",
    requiredFields: ["legalForm", "registrationNumber", "postalCode"],
    requiredDocs: ["Extrait Banque-Carrefour des Entreprises", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro d'entreprise (BCE)",
  },

  // ── Espagne ─────────────────────────────────────────────────────────────
  {
    countryCode: "ES",
    requiredFields: ["legalForm", "registrationNumber", "postalCode"],
    requiredDocs: ["Certificat d'immatriculation de l'entreprise", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro NIF/CIF",
  },

  // ── Afrique de l'Ouest (OHADA — registre RCCM) ──────────────────────────
  {
    countryCode: "GN",
    requiredFields: ["legalForm", "registrationNumber"],
    requiredDocs: ["Registre du commerce (RCCM)", "Numéro d'identification fiscale (NIF)", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro RCCM",
    notes: "Le code postal n'est pas exigé : il n'est pas d'usage courant.",
  },
  {
    countryCode: "SN",
    requiredFields: ["legalForm", "registrationNumber"],
    requiredDocs: ["Registre du commerce (RCCM)", "Numéro d'identification nationale des entreprises (NINEA)", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro RCCM",
  },
  {
    countryCode: "CI",
    requiredFields: ["legalForm", "registrationNumber"],
    requiredDocs: ["Registre du commerce (RCCM)", "Déclaration fiscale d'existence", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro RCCM",
  },
  {
    countryCode: "ML",
    requiredFields: ["legalForm", "registrationNumber"],
    requiredDocs: ["Registre du commerce (RCCM)", "Numéro d'identification fiscale (NIF)", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro RCCM",
  },

  // ── Maghreb ─────────────────────────────────────────────────────────────
  {
    countryCode: "MA",
    requiredFields: ["legalForm", "registrationNumber"],
    requiredDocs: ["Modèle J du registre de commerce", "Identifiant Commun de l'Entreprise (ICE)", "Pièce d'identité du représentant légal"],
    registrationLabel: "Numéro du registre de commerce",
  },
  {
    countryCode: "TN",
    requiredFields: ["legalForm", "registrationNumber"],
    requiredDocs: ["Extrait du registre national des entreprises", "Pièce d'identité du représentant légal"],
    registrationLabel: "Identifiant unique (matricule fiscal)",
  },
];
