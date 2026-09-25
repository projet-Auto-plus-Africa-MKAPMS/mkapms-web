/**
 * Moteur Démarches — catalogue des démarches administratives ouvertes au dépôt.
 *
 * Chaque écran de démarche affiche ce que le moteur déclare ici : le type de
 * dossier créé, les champs véhicule attendus et les pièces justificatives à
 * fournir. L'écran ne décide rien ; il envoie au moteur (`createDossier` +
 * `addDocument`) et renvoie vers le suivi du dossier réellement créé.
 */

export type TypeDossierDemarche =
  | "declaration_achat"
  | "declaration_cession"
  | "changement_titulaire"
  | "carte_grise"
  | "vehicule_etranger"
  | "ww_cpi"
  | "w_garage"
  | "duplicata"
  | "correction"
  | "autre";

export type ChampDemarche =
  | "immatriculation"
  | "vin"
  | "marque"
  | "modele"
  | "annee"
  | "vendeurNom"
  | "acheteurNom";

export interface PieceDemarche {
  readonly code: string;
  readonly libelle: string;
  readonly obligatoire: boolean;
}

export interface DemarcheCatalogue {
  /** Code stable, identique au suffixe de l'écran `/demarches/<code>` sauf `ecran` explicite. */
  readonly code: string;
  /** Écran de dépôt lorsque la route diffère du code. */
  readonly ecran?: string;
  readonly titre: string;
  readonly description: string;
  readonly type: TypeDossierDemarche;
  /** Champs véhicule / parties demandés à l'écran. */
  readonly champs: readonly ChampDemarche[];
  readonly pieces: readonly PieceDemarche[];
  /** Note libre proposée à l'écran (motif, précision sur la démarche). */
  readonly noteLibelle?: string;
  /** Choix fermés inscrits dans les notes du dossier (motif de duplicata, type de plaque…). */
  readonly options?: { readonly libelle: string; readonly valeurs: readonly string[] };
  /** Réservée aux professionnels habilités. */
  readonly proUniquement?: boolean;
}

const PIECE_IDENTITE: PieceDemarche = { code: "piece_identite", libelle: "Pièce d'identité", obligatoire: true };
const JUSTIFICATIF_DOMICILE: PieceDemarche = { code: "justificatif_domicile", libelle: "Justificatif de domicile", obligatoire: true };
const CARTE_GRISE: PieceDemarche = { code: "carte_grise", libelle: "Carte grise", obligatoire: true };

export const DEMARCHES_CATALOGUE: readonly DemarcheCatalogue[] = [
  {
    code: "changement-adresse",
    titre: "Changement d'adresse",
    description: "Mise à jour de l'adresse du titulaire sur le certificat d'immatriculation.",
    type: "correction",
    champs: ["immatriculation"],
    noteLibelle: "Nouvelle adresse complète (rue, code postal, ville)",
    pieces: [JUSTIFICATIF_DOMICILE, PIECE_IDENTITE, CARTE_GRISE],
  },
  {
    code: "changement-titulaire",
    titre: "Changement de titulaire",
    description: "Carte grise au nom du nouveau propriétaire après achat.",
    type: "changement_titulaire",
    champs: ["immatriculation", "vin", "marque", "modele", "vendeurNom", "acheteurNom"],
    pieces: [
      CARTE_GRISE,
      PIECE_IDENTITE,
      JUSTIFICATIF_DOMICILE,
      { code: "certificat_cession", libelle: "Certificat de cession (Cerfa)", obligatoire: true },
      { code: "controle_technique", libelle: "Contrôle technique en cours de validité", obligatoire: false },
    ],
  },
  {
    code: "declaration-cession",
    titre: "Déclaration de cession",
    description: "Déclaration par le vendeur de la vente ou du don du véhicule.",
    type: "declaration_cession",
    champs: ["immatriculation", "marque", "modele", "vendeurNom", "acheteurNom"],
    pieces: [
      { code: "certificat_cession", libelle: "Certificat de cession (Cerfa)", obligatoire: true },
      { code: "carte_grise_barree", libelle: "Carte grise barrée, datée et signée", obligatoire: true },
      { code: "piece_identite_vendeur", libelle: "Pièce d'identité du vendeur", obligatoire: true },
    ],
  },
  {
    code: "duplicata-demarche",
    titre: "Duplicata de carte grise",
    description: "Nouvel exemplaire après perte, vol ou détérioration.",
    type: "duplicata",
    champs: ["immatriculation"],
    options: { libelle: "Motif", valeurs: ["Perte", "Vol", "Détérioration"] },
    pieces: [
      PIECE_IDENTITE,
      JUSTIFICATIF_DOMICILE,
      { code: "declaration_perte_vol", libelle: "Déclaration de perte ou de vol", obligatoire: false },
    ],
  },
  {
    code: "immatriculation-provisoire",
    titre: "Immatriculation provisoire (WW)",
    description: "Certificat provisoire pour circuler en attendant l'immatriculation définitive.",
    type: "ww_cpi",
    champs: ["immatriculation", "vin", "marque", "modele"],
    pieces: [
      { code: "carte_grise_origine", libelle: "Carte grise étrangère ou ancienne", obligatoire: true },
      PIECE_IDENTITE,
      JUSTIFICATIF_DOMICILE,
      { code: "assurance", libelle: "Attestation d'assurance", obligatoire: true },
    ],
  },
  {
    code: "importation-vehicule",
    titre: "Importation de véhicule",
    description: "Immatriculation d'un véhicule acheté à l'étranger.",
    type: "vehicule_etranger",
    champs: ["vin", "marque", "modele", "annee"],
    pieces: [
      { code: "facture_achat", libelle: "Facture d'achat", obligatoire: true },
      { code: "quitus_fiscal", libelle: "Quitus fiscal", obligatoire: true },
      { code: "certificat_conformite", libelle: "Certificat de conformité", obligatoire: true },
      { code: "controle_technique", libelle: "Contrôle technique", obligatoire: false },
      PIECE_IDENTITE,
      JUSTIFICATIF_DOMICILE,
    ],
  },
  {
    code: "succession-vehicule",
    titre: "Succession de véhicule",
    description: "Transfert du véhicule à un héritier.",
    type: "changement_titulaire",
    champs: ["immatriculation", "marque", "modele", "acheteurNom"],
    noteLibelle: "Précisions sur la succession",
    pieces: [
      { code: "acte_deces", libelle: "Acte de décès", obligatoire: true },
      { code: "certificat_heredite", libelle: "Certificat d'hérédité ou acte notarié", obligatoire: true },
      CARTE_GRISE,
      { code: "piece_identite_heritier", libelle: "Pièce d'identité de l'héritier", obligatoire: true },
      JUSTIFICATIF_DOMICILE,
    ],
  },
  {
    code: "ww-garage",
    ecran: "/demarches/w-w-garage",
    titre: "W garage",
    description: "Certificat W garage pour les professionnels de l'automobile.",
    type: "w_garage",
    champs: [],
    noteLibelle: "Raison sociale et usage prévu",
    proUniquement: true,
    pieces: [
      { code: "kbis", libelle: "Extrait Kbis de moins de 3 mois", obligatoire: true },
      { code: "piece_identite_dirigeant", libelle: "Pièce d'identité du dirigeant", obligatoire: true },
      { code: "assurance_pro", libelle: "Attestation d'assurance professionnelle", obligatoire: true },
    ],
  },
  {
    code: "plaques-immatriculation",
    titre: "Plaques d'immatriculation",
    description: "Commande de plaques homologuées au numéro du véhicule.",
    type: "autre",
    champs: ["immatriculation"],
    options: { libelle: "Type de plaque", valeurs: ["Standard", "Luxe (fond noir)", "Moto", "Utilitaire"] },
    pieces: [CARTE_GRISE, PIECE_IDENTITE],
  },
];

const PAR_CODE = new Map(DEMARCHES_CATALOGUE.map((d) => [d.code, d]));

/** Route de l'écran de dépôt d'une démarche du catalogue. */
export function ecranDemarche(d: DemarcheCatalogue): string {
  return d.ecran ?? `/demarches/${d.code}`;
}

export function demarcheParCode(code: string): DemarcheCatalogue | undefined {
  return PAR_CODE.get(code);
}
