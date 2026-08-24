/**
 * Points 84-85-86-88-89-90 — MKA.P-MS FABRIQUE INTELLIGENCE.
 *
 * Ce que cette couche refuse de faire, volontairement :
 *  • elle n'affiche jamais un fournisseur « actif » parce qu'il figure au
 *    catalogue : l'état vient de la présence réelle des variables
 *    d'environnement et d'un usage réellement constaté (points 84-85) ;
 *  • elle ne route jamais une donnée confidentielle vers un fournisseur qui
 *    n'est pas autorisé à la traiter, et le refus est journalisé (point 85) ;
 *  • elle n'invente aucune économie : le nombre d'opérations manuelles évitées
 *    est déclaré par l'appelant, et un coût non mesuré est affiché comme
 *    estimé (point 86) ;
 *  • elle ne crée pas un second système de sauvegarde : elle cible le
 *    périmètre mémoire et s'appuie sur le Backup OS existant, dont la
 *    restauration reste un acte humain (point 88) ;
 *  • elle ne recopie pas le registre des moteurs : la supervision lit le
 *    registre central et y ajoute depuis quand, l'impact et l'action
 *    proposée (point 89).
 */
import { createHash } from "node:crypto";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { createSnapshot, requestRestore } from "../backup-os/index.js";
import { impactOf } from "../engine-registry/dependencies.js";
import { getHealthLog } from "../engine-registry/service.js";
import { registryOverview, type EngineReadiness } from "../engine-registry/readiness.js";
import { akeNodes, akeSources } from "../knowledge-engine/schema.js";
import { rsFailureLessons } from "../resilience/schema.js";
import { smartActionTasks } from "../smart-engine/schema.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import { afCostEntries, afMemoryBackups, afProviders, afRoutes } from "./schema.js";

/** Point 84 — capacités externes dont MKA.P-MS ne doit dépendre d'aucun acteur unique. */
export const CAPABILITIES: { code: string; label: string; critique: boolean }[] = [
  { code: "ia_texte", label: "Modèles Intelligence — analyse et rédaction", critique: true },
  { code: "ia_vision", label: "Modèles Intelligence — images et documents", critique: false },
  { code: "hebergement", label: "Hébergement & exécution", critique: true },
  { code: "base_donnees", label: "Base de données", critique: true },
  { code: "paiement", label: "Encaissement", critique: true },
  { code: "cartographie", label: "Cartes, trafic et itinéraires", critique: false },
  { code: "analytique", label: "Mesure d'audience", critique: false },
  { code: "email", label: "Envoi d'e-mails", critique: true },
  { code: "stockage", label: "Stockage de fichiers", critique: false },
  { code: "voix_ecoute", label: "Dictée serveur — parole vers texte", critique: false },
  { code: "voix_parole", label: "Réponse parlée — texte vers parole", critique: false },
  { code: "recherche_web", label: "Recherche externe sourcée", critique: false },
  { code: "itineraire", label: "Distance et itinéraire réels entre deux adresses", critique: true },
  { code: "douane", label: "Droits, taxes et normes à l'importation par pays", critique: true },
  { code: "transporteur", label: "Grilles transporteurs par corridor", critique: true },
  { code: "donnees_techniques", label: "Données techniques véhicules et pièces", critique: true },
  { code: "paiement_local", label: "Encaissement local Afrique (mobile money)", critique: true },
];

/** Confidentialité croissante : un fournisseur n'accepte que jusqu'à son plafond. */
export const CONFIDENTIALITY_LEVELS = ["publique", "interne", "personnelle", "confidentielle"] as const;
export type Confidentiality = (typeof CONFIDENTIALITY_LEVELS)[number];

function levelIndex(c: string): number {
  const i = (CONFIDENTIALITY_LEVELS as readonly string[]).indexOf(c);
  return i < 0 ? 0 : i;
}

/**
 * Catalogue des fournisseurs envisageables. Y figurer n'est pas être branché :
 * `envKeys` dit ce qu'il faudrait fournir, `switchingNote` dit ce que coûterait
 * un changement — c'est la mesure honnête du verrouillage (point 84).
 */
export const PROVIDER_CATALOG: {
  code: string;
  label: string;
  capability: string;
  envKeys: string[];
  dataResidency: string | null;
  confidentialityMax: Confidentiality;
  unitCostCents: number | null;
  unitLabel: string | null;
  switchingNote: string;
}[] = [
  {
    code: "openai",
    label: "OpenAI",
    capability: "ia_texte",
    envKeys: ["OPENAI_API_KEY"],
    dataResidency: "États-Unis",
    confidentialityMax: "interne",
    unitCostCents: null,
    unitLabel: "1000 jetons",
    switchingNote:
      "Remplaçable : les appels passent par cette couche, aucun moteur métier n'appelle le fournisseur directement.",
  },
  {
    code: "anthropic",
    label: "Anthropic",
    capability: "ia_texte",
    envKeys: ["ANTHROPIC_API_KEY"],
    dataResidency: "États-Unis",
    confidentialityMax: "interne",
    unitCostCents: null,
    unitLabel: "1000 jetons",
    switchingNote: "Remplaçable : même contrat d'appel que les autres fournisseurs de texte.",
  },
  {
    code: "mistral",
    label: "Mistral AI",
    capability: "ia_texte",
    envKeys: ["MISTRAL_API_KEY"],
    dataResidency: "Union européenne",
    confidentialityMax: "personnelle",
    unitCostCents: null,
    unitLabel: "1000 jetons",
    switchingNote:
      "Résidence européenne des données : seul candidat acceptable aujourd'hui pour une donnée personnelle.",
  },
  {
    code: "modele_local",
    label: "Modèle auto-hébergé MKA.P-MS",
    capability: "ia_texte",
    envKeys: ["LOCAL_LLM_URL"],
    dataResidency: "Infrastructure MKA.P-MS",
    confidentialityMax: "confidentielle",
    unitCostCents: null,
    unitLabel: "appel",
    switchingNote:
      "Indépendance totale une fois hébergé. Tant qu'il n'existe pas, aucune donnée confidentielle ne peut être traitée par un modèle.",
  },
  {
    code: "openai_vision",
    label: "OpenAI — vision",
    capability: "ia_vision",
    envKeys: ["OPENAI_API_KEY"],
    dataResidency: "États-Unis",
    confidentialityMax: "interne",
    unitCostCents: null,
    unitLabel: "image",
    switchingNote: "Remplaçable par tout fournisseur de vision exposant la même interface.",
  },
  {
    code: "railway",
    label: "Railway",
    capability: "hebergement",
    envKeys: ["RAILWAY_ENVIRONMENT", "RAILWAY_PROJECT_ID"],
    dataResidency: null,
    confidentialityMax: "confidentielle",
    unitCostCents: null,
    unitLabel: "mois",
    switchingNote:
      "Déploiement conteneurisé (Dockerfile + Nixpacks) : reproductible ailleurs, mais variables et volumes à reconstituer.",
  },
  {
    code: "postgres",
    label: "PostgreSQL",
    capability: "base_donnees",
    envKeys: ["DATABASE_URL"],
    dataResidency: null,
    confidentialityMax: "confidentielle",
    unitCostCents: null,
    unitLabel: "mois",
    switchingNote:
      "Standard ouvert, migrations SQL versionnées : portable vers tout hébergeur PostgreSQL.",
  },
  {
    code: "stripe",
    label: "Stripe",
    capability: "paiement",
    envKeys: ["STRIPE_SECRET_KEY"],
    dataResidency: null,
    confidentialityMax: "personnelle",
    unitCostCents: null,
    unitLabel: "transaction",
    switchingNote:
      "L'orchestrateur de paiement existe déjà : un second encaisseur s'ajoute sans toucher aux univers.",
  },
  {
    code: "google_maps",
    label: "Google Maps Platform",
    capability: "cartographie",
    envKeys: ["GOOGLE_MAPS_API_KEY"],
    dataResidency: null,
    confidentialityMax: "publique",
    unitCostCents: null,
    unitLabel: "1000 requêtes",
    switchingNote:
      "Aucune carte n'est intégrée aujourd'hui : rien à démonter, mais rien de disponible non plus.",
  },
  {
    code: "resend",
    label: "Resend",
    capability: "email",
    envKeys: ["RESEND_API_KEY"],
    dataResidency: null,
    confidentialityMax: "personnelle",
    unitCostCents: null,
    unitLabel: "1000 e-mails",
    switchingNote: "Remplaçable : l'envoi passe par le moteur de notifications, pas par les pages.",
  },
  {
    code: "smtp_prive",
    label: "SMTP propre MKA.P-MS",
    capability: "email",
    envKeys: ["SMTP_HOST", "SMTP_USER"],
    dataResidency: "Infrastructure MKA.P-MS",
    confidentialityMax: "confidentielle",
    unitCostCents: null,
    unitLabel: "1000 e-mails",
    switchingNote: "Alternative interne : supprime la dépendance à un routeur d'e-mails externe.",
  },
  {
    code: "analytique_interne",
    label: "Mesure d'audience interne MKA.P-MS",
    capability: "analytique",
    envKeys: [],
    dataResidency: "Infrastructure MKA.P-MS",
    confidentialityMax: "confidentielle",
    unitCostCents: 0,
    unitLabel: "mois",
    switchingNote:
      "Déjà propriétaire : les visites et recherches sont mesurées par la plateforme elle-même.",
  },
  {
    code: "voix_ecoute_navigateur",
    label: "Dictée du navigateur (Web Speech)",
    capability: "voix_ecoute",
    envKeys: [],
    dataResidency: "Appareil du visiteur",
    confidentialityMax: "publique",
    unitCostCents: 0,
    unitLabel: "dictée",
    switchingNote:
      "Déjà en place sur les barres de recherche et l'assistant, mais dépend du navigateur : absente sur plusieurs navigateurs, et l'écran le dit au visiteur.",
  },
  {
    code: "voix_ecoute_serveur",
    label: "Transcription serveur (parole vers texte)",
    capability: "voix_ecoute",
    envKeys: ["SPEECH_TO_TEXT_API_KEY"],
    dataResidency: null,
    confidentialityMax: "interne",
    unitCostCents: null,
    unitLabel: "minute",
    switchingNote:
      "Nécessaire pour dicter depuis les navigateurs sans Web Speech et pour les langues africaines mal reconnues côté appareil. Absent : aucune transcription serveur n'existe.",
  },
  {
    code: "voix_parole_serveur",
    label: "Synthèse vocale (texte vers parole)",
    capability: "voix_parole",
    envKeys: ["TEXT_TO_SPEECH_API_KEY"],
    dataResidency: null,
    confidentialityMax: "publique",
    unitCostCents: null,
    unitLabel: "1000 caractères",
    switchingNote:
      "Absent : l'assistant écrit mais ne parle pas. Indispensable pour les visiteurs qui lisent difficilement.",
  },
  {
    code: "recherche_web_externe",
    label: "Recherche web sourcée",
    capability: "recherche_web",
    envKeys: ["WEB_SEARCH_API_KEY"],
    dataResidency: null,
    confidentialityMax: "publique",
    unitCostCents: null,
    unitLabel: "1000 requêtes",
    switchingNote:
      "Absent : l'assistant ne peut pas sortir chercher une réponse avec sa source. Sans ce fournisseur, une réponse externe serait une réponse inventée.",
  },
  {
    code: "itineraire_routier",
    label: "Calcul d'itinéraire et de distance",
    capability: "itineraire",
    envKeys: ["ROUTING_API_KEY"],
    dataResidency: null,
    confidentialityMax: "publique",
    unitCostCents: null,
    unitLabel: "1000 itinéraires",
    switchingNote:
      "Absent : le moteur d'acheminement ne connaît pas la distance réelle entre deux adresses, donc son prix reste « estimé » au lieu de « confirmé ».",
  },
  {
    code: "douane_tarifs",
    label: "Tarifs douaniers et normes d'importation",
    capability: "douane",
    envKeys: ["CUSTOMS_TARIFF_API_KEY"],
    dataResidency: null,
    confidentialityMax: "publique",
    unitCostCents: null,
    unitLabel: "requête",
    switchingNote:
      "Absent : les droits et taxes à l'arrivée sont affichés « non mesuré ». Un chiffre inventé ici coûte au client plus cher qu'une absence de chiffre.",
  },
  {
    code: "transporteurs_corridors",
    label: "Grilles tarifaires transporteurs",
    capability: "transporteur",
    envKeys: ["CARRIER_RATES_API_KEY"],
    dataResidency: null,
    confidentialityMax: "interne",
    unitCostCents: null,
    unitLabel: "cotation",
    switchingNote:
      "Absent : seuls les barèmes saisis par la direction chiffrent un corridor. Sans barème, l'acceptation du transport est bloquée.",
  },
  {
    code: "donnees_vehicules",
    label: "Base technique véhicules et pièces (type AutoData)",
    capability: "donnees_techniques",
    envKeys: ["VEHICLE_TECH_DATA_API_KEY"],
    dataResidency: null,
    confidentialityMax: "publique",
    unitCostCents: null,
    unitLabel: "requête",
    switchingNote:
      "Absent : les caractéristiques et références de pièces reposent sur la saisie des vendeurs, donc la compatibilité d'une pièce n'est jamais garantie par la plateforme.",
  },
  {
    code: "paiement_mobile_money",
    label: "Encaissement mobile money Afrique",
    capability: "paiement_local",
    envKeys: ["MOBILE_MONEY_API_KEY"],
    dataResidency: null,
    confidentialityMax: "personnelle",
    unitCostCents: null,
    unitLabel: "transaction",
    switchingNote:
      "Absent : seul l'encaissement par carte existe. Sur plusieurs marchés africains, un acheteur sans carte ne peut pas payer du tout.",
  },
];

/** Le catalogue est la référence ; la base ne fait que porter l'état constaté. */
export async function ensureProvidersSeeded(): Promise<number> {
  const existing = await db.select({ code: afProviders.code }).from(afProviders);
  const known = new Set(existing.map((r) => r.code));
  const missing = PROVIDER_CATALOG.filter((p) => !known.has(p.code));
  if (missing.length === 0) return 0;
  await db.insert(afProviders).values(
    missing.map((p) => ({
      code: p.code,
      label: p.label,
      capability: p.capability,
      envKeys: p.envKeys,
      dataResidency: p.dataResidency,
      confidentialityMax: p.confidentialityMax,
      unitCostCents: p.unitCostCents,
      unitLabel: p.unitLabel,
      switchingNote: p.switchingNote,
    })),
  );
  return missing.length;
}

/** Présence des secrets attendus — la valeur n'est jamais lue ni renvoyée. */
function envConfigured(envKeys: string[]): { configured: boolean; missing: string[] } {
  if (envKeys.length === 0) return { configured: true, missing: [] };
  const missing = envKeys.filter((k) => {
    const v = process.env[k];
    return typeof v !== "string" || v.trim().length === 0;
  });
  return { configured: missing.length === 0, missing };
}

export interface ProviderState {
  code: string;
  label: string;
  capability: string;
  status: "non_configure" | "configure" | "actif" | "suspendu";
  statusReason: string;
  missingEnv: string[];
  dataResidency: string | null;
  confidentialityMax: string;
  unitCostCents: number | null;
  unitLabel: string | null;
  switchingNote: string | null;
  lastUsedAt: Date | null;
}

/**
 * État réel de chaque fournisseur. Un fournisseur passe « actif » uniquement
 * après un usage réellement enregistré : impossible d'afficher branché ce qui
 * n'a jamais servi.
 */
export async function providerStates(): Promise<ProviderState[]> {
  await ensureProvidersSeeded();
  const rows = await db.select().from(afProviders).orderBy(afProviders.capability, afProviders.code);
  const states: ProviderState[] = [];

  for (const r of rows) {
    const { configured, missing } = envConfigured(r.envKeys);
    let status: ProviderState["status"];
    let statusReason: string;

    if (r.status === "suspendu") {
      status = "suspendu";
      statusReason = "Suspendu par la direction : aucune tâche ne lui est confiée.";
    } else if (!configured) {
      status = "non_configure";
      statusReason = `Aucun accès fourni — variable(s) manquante(s) : ${missing.join(", ")}.`;
    } else if (r.lastUsedAt) {
      status = "actif";
      statusReason = "Accès fourni et usage réellement constaté.";
    } else {
      status = "configure";
      statusReason = "Accès fourni, mais aucun appel constaté : pas encore attesté actif.";
    }

    if (r.status !== status) {
      await db
        .update(afProviders)
        .set({ status, updatedAt: new Date() })
        .where(eq(afProviders.id, r.id));
    }

    states.push({
      code: r.code,
      label: r.label,
      capability: r.capability,
      status,
      statusReason,
      missingEnv: missing,
      dataResidency: r.dataResidency,
      confidentialityMax: r.confidentialityMax,
      unitCostCents: r.unitCostCents,
      unitLabel: r.unitLabel,
      switchingNote: r.switchingNote,
      lastUsedAt: r.lastUsedAt,
    });
  }
  return states;
}

export interface CapabilityDependency {
  capability: string;
  label: string;
  critique: boolean;
  disponibles: string[];
  configurables: string[];
  /** remplacable | fournisseur_unique | aucun_fournisseur */
  verdict: "remplacable" | "fournisseur_unique" | "aucun_fournisseur";
  detail: string;
}

/** Point 84 — où MKA.P-MS est réellement prisonnière d'un fournisseur. */
export async function dependencyReport(): Promise<{
  capacites: CapabilityDependency[];
  risqueEleve: number;
}> {
  const states = await providerStates();
  const capacites = CAPABILITIES.map((c) => {
    const pour = states.filter((s) => s.capability === c.code);
    const disponibles = pour.filter((s) => s.status === "actif" || s.status === "configure");
    const configurables = pour.filter((s) => s.status === "non_configure");

    let verdict: CapabilityDependency["verdict"];
    let detail: string;
    if (disponibles.length === 0) {
      verdict = "aucun_fournisseur";
      detail =
        configurables.length > 0
          ? `Aucun fournisseur branché. ${configurables.length} candidat(s) au catalogue, aucun accès fourni.`
          : "Aucun fournisseur branché et aucun candidat au catalogue.";
    } else if (disponibles.length === 1) {
      verdict = "fournisseur_unique";
      detail = `Dépendance à un seul fournisseur (${disponibles[0].label}). ${disponibles[0].switchingNote ?? ""}`.trim();
    } else {
      verdict = "remplacable";
      detail = `${disponibles.length} fournisseurs interchangeables : un arrêt ou une hausse de prix n'immobilise pas la plateforme.`;
    }

    return {
      capability: c.code,
      label: c.label,
      critique: c.critique,
      disponibles: disponibles.map((s) => s.label),
      configurables: configurables.map((s) => s.label),
      verdict,
      detail,
    };
  });

  return {
    capacites,
    risqueEleve: capacites.filter((c) => c.critique && c.verdict !== "remplacable").length,
  };
}

export interface RouteInput {
  capability: string;
  taskType: string;
  engine?: string;
  countryCode?: string | null;
  confidentiality?: Confidentiality;
  /** Plafond de coût unitaire accepté, en centimes. */
  maxUnitCostCents?: number;
}

export interface RouteDecision {
  verdict: "route" | "aucun_fournisseur" | "refus_confidentialite" | "refus_capacite";
  providerCode: string | null;
  providerLabel: string | null;
  reason: string;
  candidates: string[];
}

/**
 * Point 85 — choisit un fournisseur selon capacité, confidentialité, résidence
 * des données et coût. Ne réalise aucun appel : c'est la porte d'entrée que les
 * moteurs utilisent pour ne jamais coder un fournisseur en dur.
 */
export async function chooseProvider(input: RouteInput): Promise<RouteDecision> {
  const confidentiality: Confidentiality = input.confidentiality ?? "publique";
  const known = CAPABILITIES.some((c) => c.code === input.capability);

  const journalise = async (d: RouteDecision): Promise<RouteDecision> => {
    await db.insert(afRoutes).values({
      capability: input.capability,
      taskType: input.taskType,
      engine: input.engine ?? null,
      countryCode: input.countryCode ?? null,
      confidentiality,
      verdict: d.verdict,
      providerCode: d.providerCode,
      reason: d.reason,
      candidates: d.candidates,
    });
    return d;
  };

  if (!known) {
    return journalise({
      verdict: "refus_capacite",
      providerCode: null,
      providerLabel: null,
      reason: `Capacité inconnue « ${input.capability} » : aucune tâche n'est confiée à un fournisseur non catalogué.`,
      candidates: [],
    });
  }

  const states = await providerStates();
  const pour = states.filter((s) => s.capability === input.capability);
  const utilisables = pour.filter((s) => s.status === "actif" || s.status === "configure");

  if (utilisables.length === 0) {
    return journalise({
      verdict: "aucun_fournisseur",
      providerCode: null,
      providerLabel: null,
      reason:
        pour.length > 0
          ? `Aucun fournisseur branché pour cette capacité. Candidats au catalogue sans accès fourni : ${pour.map((p) => p.label).join(", ")}.`
          : "Aucun fournisseur au catalogue pour cette capacité.",
      candidates: pour.map((p) => p.code),
    });
  }

  const habilites = utilisables.filter(
    (s) => levelIndex(s.confidentialityMax) >= levelIndex(confidentiality),
  );
  if (habilites.length === 0) {
    return journalise({
      verdict: "refus_confidentialite",
      providerCode: null,
      providerLabel: null,
      reason: `Donnée « ${confidentiality} » : aucun fournisseur branché n'est habilité à la traiter. La tâche reste interne plutôt que d'être envoyée dehors.`,
      candidates: utilisables.map((s) => s.code),
    });
  }

  const dansLeBudget =
    input.maxUnitCostCents === undefined
      ? habilites
      : habilites.filter(
          (s) => s.unitCostCents !== null && s.unitCostCents <= (input.maxUnitCostCents ?? 0),
        );
  const finalistes = dansLeBudget.length > 0 ? dansLeBudget : habilites;

  // Priorité : usage déjà constaté, puis coût connu le plus bas, puis plafond
  // de confidentialité le plus élevé (le plus souverain).
  const choisi = [...finalistes].sort((a, b) => {
    if (a.status !== b.status) return a.status === "actif" ? -1 : 1;
    const ca = a.unitCostCents ?? Number.MAX_SAFE_INTEGER;
    const cb = b.unitCostCents ?? Number.MAX_SAFE_INTEGER;
    if (ca !== cb) return ca - cb;
    return levelIndex(b.confidentialityMax) - levelIndex(a.confidentialityMax);
  })[0];

  const budgetIgnore =
    input.maxUnitCostCents !== undefined && dansLeBudget.length === 0
      ? " Aucun coût unitaire renseigné sous le plafond demandé : le plafond n'a pas pu être appliqué."
      : "";

  return journalise({
    verdict: "route",
    providerCode: choisi.code,
    providerLabel: choisi.label,
    reason: `${choisi.label} retenu — ${choisi.statusReason} Données traitées : ${choisi.dataResidency ?? "résidence non documentée"}.${budgetIgnore}`,
    candidates: finalistes.map((s) => s.code),
  });
}

/** Marque un fournisseur réellement utilisé : c'est ce qui le rend « actif ». */
export async function markProviderUsed(code: string): Promise<void> {
  await db
    .update(afProviders)
    .set({ lastUsedAt: new Date(), updatedAt: new Date() })
    .where(eq(afProviders.code, code));
}

export async function setProviderSuspended(input: {
  code: string;
  suspended: boolean;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const [row] = await db.select().from(afProviders).where(eq(afProviders.code, input.code)).limit(1);
  if (!row) return { ok: false, detail: "Fournisseur inconnu." };
  await db
    .update(afProviders)
    .set({ status: input.suspended ? "suspendu" : "non_configure", updatedAt: new Date() })
    .where(eq(afProviders.id, row.id));
  await logActivity({
    action: input.suspended ? "ai_fabric_fournisseur_suspendu" : "ai_fabric_fournisseur_reactive",
    userId: input.actorId,
    targetType: "af_provider",
    targetId: row.id,
    result: row.label,
  });
  return {
    ok: true,
    detail: input.suspended
      ? `${row.label} suspendu : plus aucune tâche ne lui est confiée.`
      : `${row.label} réactivé : son état sera recalculé depuis les accès réellement fournis.`,
  };
}

export interface CostInput {
  engine: string;
  taskType: string;
  capability: string;
  providerCode?: string | null;
  units?: number;
  unitLabel?: string;
  costCents?: number;
  measured?: boolean;
  manualOpsAvoided?: number;
  countryCode?: string | null;
  note?: string;
}

/** Point 86 — enregistre un coût réellement engagé (ou explicitement estimé). */
export async function recordCost(input: CostInput): Promise<number> {
  const [row] = await db
    .insert(afCostEntries)
    .values({
      engine: input.engine,
      taskType: input.taskType,
      capability: input.capability,
      providerCode: input.providerCode ?? null,
      units: input.units ?? 1,
      unitLabel: input.unitLabel ?? null,
      costCents: input.costCents ?? 0,
      measured: input.measured ?? false,
      manualOpsAvoided: input.manualOpsAvoided ?? null,
      countryCode: input.countryCode ?? null,
      note: input.note ?? null,
    })
    .returning({ id: afCostEntries.id });
  if (input.providerCode) await markProviderUsed(input.providerCode);
  return row.id;
}

export interface CostSummary {
  periodeJours: number;
  totalCents: number;
  totalMesureCents: number;
  totalEstimeCents: number;
  appels: number;
  operationsManuellesEvitees: number;
  entreesAvecEconomieDeclaree: number;
  parMoteur: { engine: string; costCents: number; appels: number; opsEvitees: number }[];
  parTache: { taskType: string; costCents: number; appels: number }[];
  parFournisseur: { providerCode: string; costCents: number; appels: number }[];
  lecture: string;
}

/** Point 86 — ce que l'automatisation coûte, et ce qu'elle évite réellement. */
export async function costSummary(days = 30): Promise<CostSummary> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.select().from(afCostEntries).where(gte(afCostEntries.createdAt, since));

  const totalCents = rows.reduce((s, r) => s + r.costCents, 0);
  const totalMesureCents = rows.filter((r) => r.measured).reduce((s, r) => s + r.costCents, 0);
  const avecEconomie = rows.filter((r) => r.manualOpsAvoided !== null);
  const opsEvitees = avecEconomie.reduce((s, r) => s + (r.manualOpsAvoided ?? 0), 0);

  const grouper = <K extends string>(cle: (r: (typeof rows)[number]) => K | null) => {
    const map = new Map<K, { costCents: number; appels: number; opsEvitees: number }>();
    for (const r of rows) {
      const k = cle(r);
      if (k === null) continue;
      const cur = map.get(k) ?? { costCents: 0, appels: 0, opsEvitees: 0 };
      cur.costCents += r.costCents;
      cur.appels += r.units;
      cur.opsEvitees += r.manualOpsAvoided ?? 0;
      map.set(k, cur);
    }
    return map;
  };

  const parMoteur = [...grouper((r) => r.engine).entries()]
    .map(([engine, v]) => ({ engine, ...v }))
    .sort((a, b) => b.costCents - a.costCents);
  const parTache = [...grouper((r) => r.taskType).entries()]
    .map(([taskType, v]) => ({ taskType, costCents: v.costCents, appels: v.appels }))
    .sort((a, b) => b.costCents - a.costCents);
  const parFournisseur = [...grouper((r) => r.providerCode).entries()]
    .map(([providerCode, v]) => ({ providerCode, costCents: v.costCents, appels: v.appels }))
    .sort((a, b) => b.costCents - a.costCents);

  const lecture =
    rows.length === 0
      ? `Aucune dépense enregistrée sur ${days} jours : aucun fournisseur externe n'a encore été appelé par la plateforme.`
      : `${(totalCents / 100).toFixed(2)} € sur ${days} jours, dont ${(totalMesureCents / 100).toFixed(2)} € réellement mesurés chez les fournisseurs. ` +
        (avecEconomie.length === 0
          ? "Aucune économie déclarée : le système ne l'estime pas à votre place."
          : `${opsEvitees} opération(s) manuelle(s) évitée(s), déclarée(s) sur ${avecEconomie.length} entrée(s) — le reste n'est pas compté.`);

  return {
    periodeJours: days,
    totalCents,
    totalMesureCents,
    totalEstimeCents: totalCents - totalMesureCents,
    appels: rows.reduce((s, r) => s + r.units, 0),
    operationsManuellesEvitees: opsEvitees,
    entreesAvecEconomieDeclaree: avecEconomie.length,
    parMoteur,
    parTache,
    parFournisseur,
    lecture,
  };
}

export async function listRoutes(limit = 60) {
  return db.select().from(afRoutes).orderBy(desc(afRoutes.createdAt)).limit(limit);
}

/**
 * Point 88 — périmètre de la mémoire intelligente. Ce sont les tables dont la
 * perte effacerait des années d'apprentissage, par opposition aux données
 * transactionnelles déjà couvertes par le Backup OS.
 */
export const MEMORY_TABLES = [
  "ake_nodes",
  "ake_edges",
  "ake_provenance",
  "ake_sources",
  "ake_discoveries",
  "smart_knowledge",
  "smart_kb_entries",
  "smart_teachings",
  "smart_learned_data",
  "engine_memory",
  "rs_failure_lessons",
  "cpe_rules",
  "rd_projects",
  "rd_chain_links",
  "rd_assets",
] as const;

async function countTable(table: string): Promise<number | null> {
  try {
    const res = await db.execute(sql`SELECT count(*)::int AS n FROM ${sql.identifier(table)}`);
    const rows =
      (res as unknown as { rows?: { n: number }[] }).rows ?? (res as unknown as { n: number }[]);
    const first = Array.isArray(rows) ? rows[0] : undefined;
    return first ? Number(first.n) : null;
  } catch {
    return null;
  }
}

function manifestChecksum(scope: string[], counts: Record<string, number>): string {
  const canonical = scope
    .slice()
    .sort()
    .map((t) => `${t}:${counts[t] ?? 0}`)
    .join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Point 88 — sauvegarde la mémoire. La sauvegarde des lignes elles-mêmes est
 * déléguée au Backup OS ; une table absente est signalée au lieu d'être
 * comptée à zéro, sinon une mémoire perdue ressemblerait à une mémoire vide.
 */
export async function backupMemory(input?: {
  note?: string;
  createdBy?: number;
}): Promise<{ ok: boolean; detail: string; id: number | null; absentes: string[] }> {
  const counts: Record<string, number> = {};
  const absentes: string[] = [];
  const presentes: string[] = [];

  for (const t of MEMORY_TABLES) {
    const n = await countTable(t);
    if (n === null) {
      absentes.push(t);
      continue;
    }
    counts[t] = n;
    presentes.push(t);
  }

  if (presentes.length === 0) {
    return {
      ok: false,
      detail: "Aucune table de mémoire lisible : rien n'a été sauvegardé, et rien n'est prétendu.",
      id: null,
      absentes,
    };
  }

  const snapshot = await createSnapshot({
    note: `Mémoire intelligente — ${presentes.length} table(s). ${input?.note ?? ""}`.trim(),
    createdBy: input?.createdBy,
  });

  const [last] = await db
    .select({ version: afMemoryBackups.version })
    .from(afMemoryBackups)
    .orderBy(desc(afMemoryBackups.version))
    .limit(1);

  const total = presentes.reduce((s, t) => s + (counts[t] ?? 0), 0);
  const [row] = await db
    .insert(afMemoryBackups)
    .values({
      snapshotId: snapshot?.id ?? null,
      version: (last?.version ?? 0) + 1,
      scope: presentes,
      rowCounts: counts,
      totalRows: total,
      checksum: manifestChecksum(presentes, counts),
      integrity: "intacte",
      verifiedAt: new Date(),
      note: input?.note ?? null,
      createdBy: input?.createdBy ?? null,
    })
    .returning({ id: afMemoryBackups.id, version: afMemoryBackups.version });

  await logActivity({
    action: "ai_fabric_memoire_sauvegardee",
    userId: input?.createdBy,
    targetType: "af_memory_backup",
    targetId: row.id,
    result: `version ${row.version}, ${total} lignes de mémoire`,
  });

  return {
    ok: true,
    detail:
      `Version ${row.version} enregistrée : ${total} ligne(s) de mémoire sur ${presentes.length} table(s).` +
      (absentes.length > 0
        ? ` ${absentes.length} table(s) absente(s) de la base et donc hors sauvegarde : ${absentes.join(", ")}.`
        : ""),
    id: row.id,
    absentes,
  };
}

/**
 * Point 88 — contrôle d'intégrité. Distingue deux choses souvent confondues :
 * l'altération de l'enregistrement (grave) et l'évolution normale de la
 * mémoire depuis la sauvegarde (attendue).
 */
export async function verifyMemoryBackup(id: number): Promise<{
  ok: boolean;
  integrity: "intacte" | "alteree" | "non_verifiee";
  detail: string;
  derive: { table: string; sauvegarde: number; actuel: number | null }[];
}> {
  const [row] = await db.select().from(afMemoryBackups).where(eq(afMemoryBackups.id, id)).limit(1);
  if (!row) {
    return { ok: false, integrity: "non_verifiee", detail: "Sauvegarde introuvable.", derive: [] };
  }

  const recalcule = manifestChecksum(row.scope, row.rowCounts);
  const intacte = recalcule === row.checksum;

  const derive: { table: string; sauvegarde: number; actuel: number | null }[] = [];
  for (const t of row.scope) {
    const actuel = await countTable(t);
    const sauvegarde = row.rowCounts[t] ?? 0;
    if (actuel !== sauvegarde) derive.push({ table: t, sauvegarde, actuel });
  }

  await db
    .update(afMemoryBackups)
    .set({ integrity: intacte ? "intacte" : "alteree", verifiedAt: new Date() })
    .where(eq(afMemoryBackups.id, id));

  const perdues = derive.filter((d) => d.actuel !== null && d.actuel < d.sauvegarde);
  const detail = intacte
    ? `Manifeste intact. ${derive.length === 0 ? "Aucun écart depuis la sauvegarde." : `${derive.length} table(s) ont évolué depuis${perdues.length > 0 ? `, dont ${perdues.length} avec moins de lignes qu'à la sauvegarde — à examiner` : " (croissance normale)"}.`}`
    : "Manifeste altéré : les comptages enregistrés ne correspondent plus à leur empreinte. Cette sauvegarde ne doit pas servir de référence.";

  return { ok: true, integrity: intacte ? "intacte" : "alteree", detail, derive };
}

export async function listMemoryBackups(limit = 30) {
  return db.select().from(afMemoryBackups).orderBy(desc(afMemoryBackups.createdAt)).limit(limit);
}

/** Point 88 — la restauration reste une demande humaine, jamais un automatisme. */
export async function requestMemoryRestore(input: {
  backupId: number;
  requestedBy?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const [row] = await db
    .select()
    .from(afMemoryBackups)
    .where(eq(afMemoryBackups.id, input.backupId))
    .limit(1);
  if (!row) return { ok: false, detail: "Sauvegarde introuvable." };
  if (!row.snapshotId) {
    return {
      ok: false,
      detail: "Cette version n'est rattachée à aucune sauvegarde du Backup OS : rien à restaurer.",
    };
  }
  const res = await requestRestore({
    snapshotId: row.snapshotId,
    requestedBy: input.requestedBy,
  });
  if (!res.ok) return { ok: false, detail: `Demande refusée : ${res.reason}.` };
  return {
    ok: true,
    detail: `Demande de restauration ouverte pour la version ${row.version}. Elle attend une validation humaine : aucune donnée n'est écrasée automatiquement.`,
  };
}

export interface SupervisedEngine {
  name: string;
  label: string;
  category: string;
  operational: string;
  reason: string;
  depuis: string | null;
  depuisDetail: string;
  impact: string;
  actionProposee: string;
}

/**
 * Point 89 — supervision de tous les moteurs. Lit le registre central existant
 * (état + motif) et complète les trois informations qui manquaient : depuis
 * quand, quel impact, quelle action.
 */
export async function supervision(): Promise<{
  total: number;
  parEtat: Record<string, number>;
  moteurs: SupervisedEngine[];
  aTraiter: number;
  checkedAt: string;
}> {
  const overview = await registryOverview();
  const moteurs: SupervisedEngine[] = [];

  for (const m of overview.moteurs) {
    const enDefaut = m.operational !== "ok";
    let depuis: string | null = null;
    let depuisDetail = "État nominal : aucune dégradation à dater.";

    if (enDefaut) {
      const log = await getHealthLog(m.name, 40);
      const dernierSain = log.find((l) => l.status === "ok");
      if (dernierSain) {
        depuis = dernierSain.createdAt.toISOString();
        depuisDetail = `Dégradé depuis le dernier relevé sain du ${dernierSain.createdAt.toLocaleString("fr-FR")}.`;
      } else if (log.length > 0) {
        depuisDetail = "Aucun relevé sain dans l'historique connu : la dégradation n'est pas datable.";
      } else {
        depuisDetail = "Aucun relevé de santé : le moteur n'a jamais rendu compte de son état.";
      }
    }

    moteurs.push({
      name: m.name,
      label: m.label,
      category: m.category,
      operational: m.operational,
      reason: m.reason,
      depuis,
      depuisDetail,
      impact: enDefaut ? await impactSentence(m) : "Aucun impact constaté.",
      actionProposee: proposedAction(m),
    });
  }

  return {
    total: overview.total,
    parEtat: overview.parEtat,
    moteurs,
    aTraiter: moteurs.filter((m) => m.operational !== "ok").length,
    checkedAt: overview.checkedAt,
  };
}

async function impactSentence(m: EngineReadiness): Promise<string> {
  const report = await impactOf(m.name);
  if (report.cascade.length === 0) return "Aucun autre moteur ne dépend de celui-ci.";
  return (
    `${report.cascade.length} moteur(s) touché(s) en cascade` +
    (report.activeAffected.length > 0
      ? `, dont ${report.activeAffected.length} en service : ${report.activeAffected.slice(0, 6).join(", ")}${report.activeAffected.length > 6 ? "…" : ""}.`
      : ", aucun en service actuellement.")
  );
}

/** Une action proposée doit décrire un geste réel, pas répéter le problème. */
function proposedAction(m: EngineReadiness): string {
  if (m.operational === "ok") return "Rien à faire.";
  if (m.missingDependencies.length > 0) {
    return `Enregistrer les moteurs manquants au registre : ${m.missingDependencies.join(", ")}.`;
  }
  if (m.unhealthyDependencies.length > 0) {
    return `Traiter d'abord les dépendances en défaut : ${m.unhealthyDependencies.join(", ")}.`;
  }
  if (m.operational === "non_configure") {
    return "Fournir la configuration attendue par ce moteur, ou le déclarer hors périmètre.";
  }
  if (m.heartbeatStale) {
    return "Vérifier la sonde : le moteur ne rend plus compte de son état, ce qui empêche toute mesure.";
  }
  return "Ouvrir une action dans le Centre d'Actions pour diagnostiquer, avec retour arrière décrit.";
}

export interface FinalRuleChain {
  etape: string;
  question: string;
  valeur: number;
  detail: string;
  tenue: boolean;
}

/**
 * Point 90 — la règle finale, mesurée et non affirmée : une validation produit
 * une action, une action produit un résultat, un résultat est vérifié, une
 * erreur devient une connaissance, une connaissance reste disponible.
 */
export async function finalRule(): Promise<{
  chaine: FinalRuleChain[];
  maillonsTenus: number;
  detail: string;
}> {
  const [validees] = await db
    .select({ n: count() })
    .from(smartActionTasks)
    .where(sql`${smartActionTasks.validatedAt} is not null`);
  const [avecResultat] = await db
    .select({ n: count() })
    .from(smartActionTasks)
    .where(sql`${smartActionTasks.status} in ('deploye','verifie','termine','echec','manuel_requis')`);
  const [verifiees] = await db
    .select({ n: count() })
    .from(smartActionTasks)
    .where(sql`${smartActionTasks.verifiedAt} is not null`);
  const [echecs] = await db
    .select({ n: count() })
    .from(smartActionTasks)
    .where(eq(smartActionTasks.status, "echec"));
  const [lecons] = await db.select({ n: count() }).from(rsFailureLessons);
  const [connaissances] = await db.select({ n: count() }).from(akeNodes);
  const [sourcees] = await db
    .select({ n: count() })
    .from(akeNodes)
    .where(sql`exists (select 1 from ake_provenance p where p.node_id = ${akeNodes.id})`);

  const chaine: FinalRuleChain[] = [
    {
      etape: "Une validation produit une action traçable",
      question: "Validations qui ont réellement créé une tâche exécutable",
      valeur: validees.n,
      detail:
        validees.n === 0
          ? "Aucune validation enregistrée : la chaîne n'a pas encore été éprouvée."
          : `${validees.n} validation(s) ont ouvert une tâche avec son historique.`,
      tenue: true,
    },
    {
      etape: "Une action produit un résultat",
      question: "Actions arrivées à un état terminal explicite",
      valeur: avecResultat.n,
      detail:
        avecResultat.n === 0
          ? "Aucune action terminée : rien n'est affirmé à leur sujet."
          : `${avecResultat.n} action(s) ont un résultat écrit, y compris les échecs et les interventions humaines requises.`,
      tenue: true,
    },
    {
      etape: "Un résultat est vérifié",
      question: "Actions dont le résultat a été recontrôlé après coup",
      valeur: verifiees.n,
      detail:
        verifiees.n === 0
          ? "Aucune vérification enregistrée : une action « terminée » non revérifiée n'est pas présentée comme prouvée."
          : `${verifiees.n} action(s) ont été recontrôlées après exécution.`,
      tenue: true,
    },
    {
      etape: "Une erreur devient une connaissance",
      question: "Échecs transformés en leçon réutilisable",
      valeur: lecons.n,
      detail:
        echecs.n === 0
          ? "Aucun échec à ce jour."
          : `${echecs.n} échec(s) constaté(s), ${lecons.n} leçon(s) enregistrée(s) avec cause, solution et prévention.`,
      tenue: echecs.n === 0 || lecons.n > 0,
    },
    {
      etape: "Une connaissance utile reste disponible",
      question: "Connaissances de la mémoire automobile portant une provenance",
      valeur: sourcees.n,
      detail:
        connaissances.n === 0
          ? "Mémoire automobile vide."
          : `${sourcees.n} connaissance(s) sur ${connaissances.n} portent une provenance vérifiable ; les autres restent internes.`,
      tenue: connaissances.n === 0 || sourcees.n > 0,
    },
  ];

  const tenus = chaine.filter((c) => c.tenue).length;
  return {
    chaine,
    maillonsTenus: tenus,
    detail:
      tenus === chaine.length
        ? "La chaîne complète tient : aucune étape ne s'interrompt en silence."
        : "Un maillon de la chaîne n'est pas tenu : il est nommé plutôt que masqué.",
  };
}

export async function aiFabricStats() {
  const states = await providerStates();
  const deps = await dependencyReport();
  const couts = await costSummary(30);
  const [routes] = await db.select({ n: count() }).from(afRoutes);
  const [refus] = await db
    .select({ n: count() })
    .from(afRoutes)
    .where(sql`${afRoutes.verdict} <> 'route'`);
  const [backups] = await db.select({ n: count() }).from(afMemoryBackups);
  const [sources] = await db.select({ n: count() }).from(akeSources);

  return {
    fournisseurs: {
      total: states.length,
      actifs: states.filter((s) => s.status === "actif").length,
      configures: states.filter((s) => s.status === "configure").length,
      nonConfigures: states.filter((s) => s.status === "non_configure").length,
      suspendus: states.filter((s) => s.status === "suspendu").length,
    },
    dependance: {
      capacites: deps.capacites.length,
      risqueEleve: deps.risqueEleve,
    },
    routage: { total: routes.n, refus: refus.n },
    couts: {
      totalCents: couts.totalCents,
      mesureCents: couts.totalMesureCents,
      opsEvitees: couts.operationsManuellesEvitees,
    },
    memoire: { sauvegardes: backups.n, tablesSuivies: MEMORY_TABLES.length, sources: sources.n },
  };
}

export async function aiFabricHealth(): Promise<{ status: "ok" | "degraded" | "down"; detail: string }> {
  try {
    const states = await providerStates();
    const deps = await dependencyReport();
    const [backups] = await db.select({ n: count() }).from(afMemoryBackups);
    if (deps.risqueEleve > 0) {
      return {
        status: "degraded",
        detail: `${deps.risqueEleve} capacité(s) critique(s) sans alternative branchée. ${backups.n} sauvegarde(s) de mémoire.`,
      };
    }
    return {
      status: "ok",
      detail: `${states.length} fournisseurs catalogués, ${backups.n} sauvegarde(s) de mémoire.`,
    };
  } catch (e) {
    return { status: "down", detail: e instanceof Error ? e.message : "Couche indisponible." };
  }
}
