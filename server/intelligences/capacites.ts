/**
 * Points 126, 147 — registre central des capacités de MKA.P-MS Intelligences.
 *
 * Une capacité n'est pas un mot sur un écran : c'est un fournisseur joignable,
 * un moteur MKA responsable, une permission exigée, un repli, et un état
 * **constaté**. Ce fichier est la référence unique ; il ne duplique pas la
 * Fabrique Intelligence (qui possède les fournisseurs et la confidentialité)
 * ni le registre des moteurs (qui possède la santé) : il les relie.
 *
 * Règle tenue : une capacité sans fournisseur joignable est déclarée
 * `indisponible` avec le motif exact. Elle n'est jamais affichée « prête ».
 */
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { afCostEntries } from "../ai-fabric/schema.js";
import { providerStates, type Confidentiality } from "../ai-fabric/service.js";

/** Permissions techniques (point 146). Elles se cumulent selon le rôle. */
export const PERMISSIONS = [
  "READ",
  "ANALYZE",
  "PROPOSE",
  "WRITE",
  "TEST",
  "DEPLOY",
  "INFRASTRUCTURE",
  "FINANCIAL",
  "ADMINISTRATION",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Capacité du registre — la liste des 14 capacités demandées. */
export type CodeCapacite =
  | "raisonnement"
  | "code"
  | "recherche"
  | "image"
  | "vision"
  | "audio"
  | "voix"
  | "temps_reel"
  | "transcription"
  | "diarisation"
  | "traduction"
  | "documents"
  | "outils"
  | "automatisation";

export interface SpecCapacite {
  code: CodeCapacite;
  libelle: string;
  /** Ce que la capacité permet réellement de faire, sans promesse. */
  usage: string;
  /** Capacité Fabrique Intelligence utilisée pour router l'appel. */
  capaciteFabrique: "ia_texte" | "ia_vision" | null;
  /** Moteurs MKA qui portent déjà cette capacité — aucun doublon créé. */
  moteurs: string[];
  /** Fournisseur visé en premier, puis le repli. */
  fournisseurPrincipal: string | null;
  fournisseurSecondaire: string | null;
  /** Repli sans fournisseur externe : ce que la plateforme sait faire seule. */
  repliInterne: string;
  /** Moteur MKA destiné à remplacer le fournisseur (point 147). */
  remplacementMka: string;
  /** Permission minimale exigée pour l'utiliser (point 146). */
  permission: Permission;
  /** Confidentialité maximale acceptable pour cette capacité. */
  confidentialiteMax: Confidentiality;
  /** Vrai quand un fournisseur externe est indispensable. */
  exigeFournisseur: boolean;
}

export const CAPACITES: SpecCapacite[] = [
  {
    code: "raisonnement",
    libelle: "Raisonnement",
    usage: "Analyser une situation, comparer des options, expliquer une décision.",
    capaciteFabrique: "ia_texte",
    moteurs: ["intelligences", "smart_engine", "knowledge_engine"],
    fournisseurPrincipal: "openai",
    fournisseurSecondaire: "mistral",
    repliInterne:
      "Règles et seuils du Smart Engine : détection d'anomalies et propositions déjà codées, sans rédaction libre.",
    remplacementMka: "Modèle auto-hébergé MKA.P-MS (capacité modele_local)",
    permission: "ANALYZE",
    confidentialiteMax: "interne",
    exigeFournisseur: true,
  },
  {
    code: "code",
    libelle: "Code",
    usage: "Lire le dépôt, proposer un correctif, expliquer une régression.",
    capaciteFabrique: "ia_texte",
    moteurs: ["code_graph", "smart_audit", "resilience"],
    fournisseurPrincipal: "openai",
    fournisseurSecondaire: "mistral",
    repliInterne:
      "Code Knowledge Graph : fichiers, tables, API, contrôles et dépendants d'un domaine, sans écriture de code.",
    remplacementMka: "Agent développeur MKA.P-MS sur modèle auto-hébergé",
    permission: "PROPOSE",
    confidentialiteMax: "interne",
    exigeFournisseur: true,
  },
  {
    code: "recherche",
    libelle: "Recherche",
    usage: "Retrouver une information dans la plateforme et dans la mémoire.",
    capaciteFabrique: null,
    moteurs: ["search_os", "knowledge_engine", "code_graph"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne: "Search OS et base de connaissances : recherche interne, sans dépendance externe.",
    remplacementMka: "Déjà propriétaire — Search OS",
    permission: "READ",
    confidentialiteMax: "confidentielle",
    exigeFournisseur: false,
  },
  {
    code: "image",
    libelle: "Image",
    usage: "Produire une image (publicité, illustration, visuel de fiche).",
    capaciteFabrique: null,
    moteurs: ["media_os", "visibility_os"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne:
      "Media OS : optimisation, recadrage, miniatures et gabarits. Aucune génération d'image sans fournisseur.",
    remplacementMka: "Générateur d'images MKA.P-MS (non construit)",
    permission: "PROPOSE",
    confidentialiteMax: "publique",
    exigeFournisseur: true,
  },
  {
    code: "vision",
    libelle: "Vision",
    usage: "Comprendre une capture d'écran, une photo de véhicule, un document photographié.",
    capaciteFabrique: "ia_vision",
    moteurs: ["media_os", "media_authenticity", "document_os"],
    fournisseurPrincipal: "openai_vision",
    fournisseurSecondaire: null,
    repliInterne:
      "Empreintes perceptuelles et métadonnées : dire si une image est réutilisée, sans la comprendre.",
    remplacementMka: "Modèle vision auto-hébergé MKA.P-MS",
    permission: "ANALYZE",
    confidentialiteMax: "interne",
    exigeFournisseur: true,
  },
  {
    code: "audio",
    libelle: "Audio",
    usage: "Analyser un son : bruit moteur, enregistrement joint à un litige.",
    capaciteFabrique: null,
    moteurs: ["media_os", "media_authenticity"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne: "Empreinte du fichier et métadonnées seulement.",
    remplacementMka: "Modèle audio auto-hébergé MKA.P-MS",
    permission: "ANALYZE",
    confidentialiteMax: "interne",
    exigeFournisseur: true,
  },
  {
    code: "voix",
    libelle: "Voix",
    usage: "Lire une réponse à voix haute (accueil, accessibilité, appel sortant).",
    capaciteFabrique: null,
    moteurs: ["intelligences", "support_os"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne: "Synthèse vocale du navigateur côté visiteur, sans coût ni fournisseur.",
    remplacementMka: "Synthèse vocale MKA.P-MS (non construite)",
    permission: "READ",
    confidentialiteMax: "publique",
    exigeFournisseur: true,
  },
  {
    code: "temps_reel",
    libelle: "Temps réel",
    usage: "Tenir une conversation vocale continue avec un client.",
    capaciteFabrique: null,
    moteurs: ["support_os", "messaging_os"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne: "Messagerie et support écrits, avec file de priorités déjà en service.",
    remplacementMka: "Canal temps réel MKA.P-MS (non construit)",
    permission: "READ",
    confidentialiteMax: "personnelle",
    exigeFournisseur: true,
  },
  {
    code: "transcription",
    libelle: "Transcription",
    usage: "Transformer un vocal du PDG ou d'un client en texte exploitable.",
    capaciteFabrique: null,
    moteurs: ["command_center", "support_os"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne:
      "Dictée du navigateur : le texte arrive déjà transcrit côté client, la commande vocale reste utilisable.",
    remplacementMka: "Transcription auto-hébergée MKA.P-MS",
    permission: "READ",
    confidentialiteMax: "personnelle",
    exigeFournisseur: true,
  },
  {
    code: "diarisation",
    libelle: "Diarisation",
    usage: "Distinguer qui parle dans un enregistrement à plusieurs voix.",
    capaciteFabrique: null,
    moteurs: ["support_os", "media_authenticity"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne: "Aucun repli : sans modèle, les voix ne sont pas séparées.",
    remplacementMka: "Diarisation auto-hébergée MKA.P-MS",
    permission: "ANALYZE",
    confidentialiteMax: "personnelle",
    exigeFournisseur: true,
  },
  {
    code: "traduction",
    libelle: "Traduction",
    usage: "Servir un visiteur dans sa langue, traduire une annonce ou un document.",
    capaciteFabrique: "ia_texte",
    moteurs: ["language_os", "seo_os"],
    fournisseurPrincipal: "openai",
    fournisseurSecondaire: "mistral",
    repliInterne:
      "Language OS : libellés traduits déjà présents et langue du pays, sans traduction de contenu libre.",
    remplacementMka: "Traduction auto-hébergée MKA.P-MS",
    permission: "READ",
    confidentialiteMax: "publique",
    exigeFournisseur: true,
  },
  {
    code: "documents",
    libelle: "Documents",
    usage: "Lire un devis, une facture, une carte grise, un contrat.",
    capaciteFabrique: "ia_vision",
    moteurs: ["document_os", "contrat_os", "media_authenticity"],
    fournisseurPrincipal: "openai_vision",
    fournisseurSecondaire: null,
    repliInterne:
      "Document OS : QR, signature, versions et historique — la traçabilité fonctionne sans modèle, la lecture du contenu non.",
    remplacementMka: "Lecture documentaire MKA.P-MS",
    permission: "ANALYZE",
    confidentialiteMax: "personnelle",
    exigeFournisseur: true,
  },
  {
    code: "outils",
    libelle: "Navigation & outils",
    usage: "Interroger la plateforme, ses moteurs et ses données pour agir juste.",
    capaciteFabrique: null,
    moteurs: ["engine_registry", "event_bus", "command_center"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne:
      "Registre des moteurs, Event Bus et Centre de Commandes : déjà propriétaires, aucun fournisseur requis.",
    remplacementMka: "Déjà propriétaire",
    permission: "READ",
    confidentialiteMax: "confidentielle",
    exigeFournisseur: false,
  },
  {
    code: "automatisation",
    libelle: "Automatisation",
    usage: "Enchaîner des actions autorisées et surveiller leur résultat.",
    capaciteFabrique: null,
    moteurs: ["scheduler_os", "smart_engine", "continuous_test"],
    fournisseurPrincipal: null,
    fournisseurSecondaire: null,
    repliInterne:
      "Scheduler OS et contrôle continu : les enchaînements existent déjà et restent soumis aux permissions.",
    remplacementMka: "Déjà propriétaire",
    permission: "TEST",
    confidentialiteMax: "confidentielle",
    exigeFournisseur: false,
  },
];

export type EtatCapacite = "disponible" | "interne_seulement" | "indisponible";

export interface CapaciteConstatee extends SpecCapacite {
  etat: EtatCapacite;
  /** Motif exact : ce qui manque, nommé. */
  motif: string;
  /** Fournisseur réellement retenu aujourd'hui. */
  fournisseurRetenu: string | null;
  /** Repli qui serait utilisé si le fournisseur tombe. */
  fallback: string;
  /** Appels des 30 derniers jours et durée moyenne — performances constatées. */
  appels30j: number;
  dureeMoyenneMs: number | null;
  /** Coût constaté sur 30 jours, en centimes. `mesure: false` = tarif non saisi. */
  coutCents: number;
  coutMesure: boolean;
  dernierUsage: Date | null;
}

/**
 * État constaté de chaque capacité. Rien n'est déclaré prêt : la disponibilité
 * vient de la présence réelle d'un fournisseur configuré côté Fabrique.
 */
export async function registre(): Promise<CapaciteConstatee[]> {
  const fournisseurs = await providerStates();
  const parCode = new Map(fournisseurs.map((f) => [f.code, f]));

  const depuis = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const usage = await db
    .select({
      capacite: afCostEntries.capability,
      appels: sql<number>`count(*)::int`,
      cout: sql<number>`coalesce(sum(${afCostEntries.costCents}), 0)::int`,
      mesures: sql<number>`sum(case when ${afCostEntries.measured} then 1 else 0 end)::int`,
      dernier: sql<Date | null>`max(${afCostEntries.createdAt})`,
    })
    .from(afCostEntries)
    .where(gte(afCostEntries.createdAt, depuis))
    .groupBy(afCostEntries.capability);
  const parCapaciteFabrique = new Map(usage.map((u) => [u.capacite, u]));

  return CAPACITES.map((spec) => {
    const principal = spec.fournisseurPrincipal ? parCode.get(spec.fournisseurPrincipal) : undefined;
    const secondaire = spec.fournisseurSecondaire
      ? parCode.get(spec.fournisseurSecondaire)
      : undefined;

    const utilisable = (f?: { status: string }) =>
      f !== undefined && (f.status === "actif" || f.status === "configure");

    let etat: EtatCapacite;
    let motif: string;
    let fournisseurRetenu: string | null = null;

    if (!spec.exigeFournisseur) {
      etat = "disponible";
      motif = "Capacité propriétaire : aucun fournisseur externe nécessaire.";
    } else if (utilisable(principal)) {
      etat = "disponible";
      fournisseurRetenu = principal!.code;
      motif = `${principal!.label} — ${principal!.statusReason}`;
    } else if (utilisable(secondaire)) {
      etat = "disponible";
      fournisseurRetenu = secondaire!.code;
      motif = `Fournisseur principal indisponible ; repli sur ${secondaire!.label}.`;
    } else if (spec.repliInterne.startsWith("Aucun repli")) {
      etat = "indisponible";
      motif =
        principal === undefined
          ? "Aucun fournisseur au catalogue pour cette capacité : elle n'est pas exécutable aujourd'hui."
          : `Aucun fournisseur joignable (${principal.statusReason}) et aucun repli interne.`;
    } else {
      etat = "interne_seulement";
      motif =
        principal === undefined
          ? `Aucun fournisseur configuré : seul le repli interne fonctionne — ${spec.repliInterne}`
          : `${principal.label} indisponible (${principal.statusReason}) : seul le repli interne fonctionne.`;
    }

    const u = spec.capaciteFabrique ? parCapaciteFabrique.get(spec.capaciteFabrique) : undefined;

    return {
      ...spec,
      etat,
      motif,
      fournisseurRetenu,
      fallback: spec.repliInterne,
      appels30j: u?.appels ?? 0,
      dureeMoyenneMs: null,
      coutCents: u?.cout ?? 0,
      coutMesure: (u?.mesures ?? 0) > 0,
      dernierUsage: u?.dernier ?? null,
    };
  });
}

/** Résumé pour l'écran de direction : ce qui manque est nommé, pas moyenné. */
export async function resume(): Promise<{
  total: number;
  disponibles: number;
  interneSeulement: number;
  indisponibles: number;
  manquantes: { capacite: string; motif: string }[];
}> {
  const r = await registre();
  return {
    total: r.length,
    disponibles: r.filter((c) => c.etat === "disponible").length,
    interneSeulement: r.filter((c) => c.etat === "interne_seulement").length,
    indisponibles: r.filter((c) => c.etat === "indisponible").length,
    manquantes: r
      .filter((c) => c.etat !== "disponible")
      .map((c) => ({ capacite: c.libelle, motif: c.motif })),
  };
}

export function spec(code: CodeCapacite): SpecCapacite {
  const s = CAPACITES.find((c) => c.code === code);
  if (!s) throw new Error(`Capacité inconnue : ${code}`);
  return s;
}

/** Dernier appel enregistré pour une capacité, utile aux sondes de santé. */
export async function dernierAppel(capaciteFabrique: string): Promise<Date | null> {
  const [row] = await db
    .select({ d: afCostEntries.createdAt })
    .from(afCostEntries)
    .where(eq(afCostEntries.capability, capaciteFabrique))
    .orderBy(desc(afCostEntries.createdAt))
    .limit(1);
  return row?.d ?? null;
}
