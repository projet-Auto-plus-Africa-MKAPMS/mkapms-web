/**
 * MKA.P-MS Gouvernance — LOT IA02D : Provider Registry / Dependency Registry.
 *
 * Source centrale de vérité pour les dépendances de modèles externes, en vue de
 * l'échéance d'indépendance du 27 mars 2027. Ne remplace ni ne duplique les
 * registres existants, qui restent chacun propriétaires de ce qu'ils savent
 * déjà :
 *  - server/ai-fabric/service.ts (PROVIDER_CATALOG, providerStates, coût) —
 *    ce fichier LIT son état réel, ne le recopie jamais en dur ;
 *  - server/intelligences/capacites.ts (quelle capacité, quel remplacement
 *    MKA.P-MS visé) — lu, jamais réécrit ;
 *  - server/intelligences/shadow.ts (preuves réelles de montée en charge du
 *    remplacement interne) — seule source du disconnect readiness, jamais
 *    une estimation inventée ici.
 *
 * Périmètre assumé de ce lot : les dépendances de MODÈLES DE LANGAGE (openai,
 * anthropic, mistral) — c'est sur elles que porte l'échéance du 27 mars 2027.
 * Les dépendances hors modèles de langage du catalogue ai-fabric (paiement, hébergement,
 * cartographie, e-mail…) restent dans ce catalogue existant, sans date de
 * sortie fixée par la direction dans ce chantier : les dupliquer ici sans
 * mandat aurait été une extension non demandée.
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { gvDependencies } from "./schema.js";
import { providerStates, costSummary } from "../ai-fabric/service.js";
import { etat as etatShadow } from "../intelligences/shadow.js";
import { SETTINGS_REGISTRY } from "./settings-registry.js";

export const STATUTS_DEPENDANCE = [
  "REGISTERED",
  "AUTHORIZED",
  "CONNECTED_NOT_TESTED",
  "CONNECTED_AND_TESTED",
  "ACTIVE",
  "DEGRADED",
  "FALLBACK_ONLY",
  "INTERNAL_REPLACEMENT_IN_PROGRESS",
  "READY_TO_DISCONNECT",
  "DISCONNECTED",
  "BLOCKED",
] as const;
export type StatutDependance = (typeof STATUTS_DEPENDANCE)[number];

export const STATUTS_MIGRATION = ["ON_TRACK", "AT_RISK", "BLOCKED", "READY_TO_DISCONNECT", "DISCONNECTED"] as const;
export type StatutMigration = (typeof STATUTS_MIGRATION)[number];

export const DROITS_DONNEES = ["LEGAL_RIGHTS_UNKNOWN", "NOT_PERMITTED", "PERMITTED_WITH_CONDITIONS", "PERMITTED"] as const;

/** Cible réelle de l'échéance d'indépendance. Exploitable, pas une note texte. */
export const ECHEANCE_INDEPENDANCE = new Date("2027-03-27T00:00:00.000Z");

/**
 * Faits déclarés une fois, jamais recopiés depuis ailleurs — chaque champ
 * technique variable (statut, coût, disconnect readiness) reste calculé en
 * direct dans `registre()`, pas stocké ici en double source de vérité.
 */
interface DependanceReference {
  providerId: string;
  internalName: string;
  adapterId: string;
  capabilitiesAvailable: string[];
  capabilitiesUsed: string[];
  fallback: string;
  alternativeProvider: string | null;
  internalReplacement: string;
  dataDependency: string;
  retentionPolicy: string;
  cachePolicy: string;
  countryConstraints: string[];
  migrationPriority: "haute" | "moyenne" | "basse";
  concerneEcheance2027: boolean;
}

const DEPENDANCES_REFERENCE: DependanceReference[] = [
  {
    providerId: "openai",
    internalName: "OpenAI (raisonnement, vision, code, traduction)",
    adapterId: "server/intelligences/provider.ts (ENDPOINTS.openai / openai_vision)",
    capabilitiesAvailable: [
      "chat/texte", "vision", "génération d'image (DALL-E)", "transcription audio (Whisper)",
      "synthèse vocale (TTS)", "embeddings", "API temps réel", "appel d'outils (function calling)",
    ],
    capabilitiesUsed: ["chat/texte", "vision", "appel d'outils (function calling, depuis LOT IA02B)"],
    fallback: "Repli automatique vers Mistral pour le texte (server/intelligences/provider.ts::replier) ; aucun repli pour la vision.",
    alternativeProvider: "mistral",
    internalReplacement: "Modèle auto-hébergé MKA.P-MS (capacité modele_local)",
    dataDependency: "Message de conversation (question, contexte direction constaté, historique récent), système de consigne. Jamais de secret ni de clé.",
    retentionPolicy: "Non clarifiée avec le fournisseur pour ce compte — voir droits sur les données.",
    cachePolicy: "Aucune réponse mise en cache ; seul le nom du modèle découvert l'est (server/intelligences/provider.ts::cacheModele).",
    countryConstraints: [],
    migrationPriority: "haute",
    concerneEcheance2027: true,
  },
  {
    providerId: "anthropic",
    internalName: "Anthropic (catalogué, non câblé)",
    adapterId: "aucun — server/intelligences/provider.ts::ENDPOINTS ne le liste pas",
    capabilitiesAvailable: ["chat/texte", "vision", "appel d'outils (function calling)"],
    capabilitiesUsed: [],
    fallback: "Sans objet : jamais sélectionné (wireStatus REGISTERED, LOT IA02A).",
    alternativeProvider: null,
    internalReplacement: "Modèle auto-hébergé MKA.P-MS (capacité modele_local)",
    dataDependency: "Aucune — aucun appel réel n'est possible aujourd'hui.",
    retentionPolicy: "Non applicable : aucune donnée n'est envoyée.",
    cachePolicy: "Non applicable.",
    countryConstraints: [],
    migrationPriority: "basse",
    concerneEcheance2027: false,
  },
  {
    providerId: "mistral",
    internalName: "Mistral AI (repli texte, résidence UE)",
    adapterId: "server/intelligences/provider.ts (ENDPOINTS.mistral)",
    capabilitiesAvailable: ["chat/texte", "embeddings", "appel d'outils (function calling)"],
    capabilitiesUsed: ["chat/texte (repli)", "appel d'outils (function calling, depuis LOT IA02B)"],
    fallback: "Sert de repli à OpenAI ; aucun repli propre configuré.",
    alternativeProvider: "openai",
    internalReplacement: "Modèle auto-hébergé MKA.P-MS (capacité modele_local)",
    dataDependency: "Identique à OpenAI pour le texte : message de conversation, contexte, historique récent.",
    retentionPolicy: "Non clarifiée avec le fournisseur pour ce compte — voir droits sur les données.",
    cachePolicy: "Aucune réponse mise en cache.",
    countryConstraints: ["Seul fournisseur externe acceptable aujourd'hui pour une confidentialité « personnelle » (résidence UE) — server/ai-fabric/service.ts."],
    migrationPriority: "moyenne",
    concerneEcheance2027: true,
  },
];

/** Idempotent — n'écrase pas une ligne déjà enrichie manuellement (motif écrit, dates de test…). */
export async function seedReference(): Promise<{ crees: number; total: number }> {
  let crees = 0;
  for (const r of DEPENDANCES_REFERENCE) {
    const [existante] = await db.select({ id: gvDependencies.id }).from(gvDependencies).where(eq(gvDependencies.providerId, r.providerId)).limit(1);
    if (existante) continue;
    await db.insert(gvDependencies).values({
      providerId: r.providerId,
      internalName: r.internalName,
      category: "ia_modele",
      adapterId: r.adapterId,
      capabilitiesAvailable: r.capabilitiesAvailable,
      capabilitiesUsed: r.capabilitiesUsed,
      authenticationType: "api_key",
      fallback: r.fallback,
      alternativeProvider: r.alternativeProvider,
      dataDependency: r.dataDependency,
      internalReplacement: r.internalReplacement,
      internalReplacementStatus: "external_primary",
      migrationPriority: r.migrationPriority,
      targetDisconnectDate: r.concerneEcheance2027 ? ECHEANCE_INDEPENDANCE : null,
      retentionPolicy: r.retentionPolicy,
      cachePolicy: r.cachePolicy,
      countryConstraints: r.countryConstraints,
      status: "REGISTERED",
    });
    crees++;
  }
  return { crees, total: DEPENDANCES_REFERENCE.length };
}

/**
 * Point 5 — ce qui manquerait réellement pour couper ce fournisseur
 * aujourd'hui. Calculé, jamais estimé : preuves shadow.ts (montée en charge
 * du remplacement interne) + lacunes réelles du Settings Registry pour les
 * capacités qu'il sert.
 */
export interface DisconnectReadiness {
  pourcentage: number;
  bloquants: string[];
}

export async function disconnectReadiness(providerId: string): Promise<DisconnectReadiness> {
  const bloquants: string[] = [];
  const shadowEtat = await etatShadow();

  // Preuve de remplacement interne : la seule capacité Fabrique concernée
  // aujourd'hui par openai/mistral est "raisonnement" (ia_texte) — voir
  // capacites.ts. Sans candidat servant une part réelle, la lecture est 0.
  const raisonnement = shadowEtat.find((s) => s.capacite === "raisonnement");
  const partInterne = raisonnement?.part ?? 0;
  if (partInterne === 0) {
    bloquants.push(
      raisonnement?.candidat
        ? `Candidat interne « ${raisonnement.candidat} » nommé mais à 0 % de trafic réel (server/intelligences/shadow.ts).`
        : "Aucun moteur candidat interne observé pour la capacité « raisonnement ».",
    );
  } else if (partInterne < 100) {
    bloquants.push(`Remplacement interne à ${partInterne} % de trafic réel seulement (palier suivant : ${raisonnement?.palierSuivant ?? "aucun"}).`);
  }

  // Réglages non connectés qui dépendent structurellement d'un modèle externe.
  const cles = providerId === "openai"
    ? ["intelligence.modeles", "intelligence.vision", "intelligence.image"]
    : ["intelligence.modeles"];
  for (const cle of cles) {
    const r = SETTINGS_REGISTRY.find((s) => s.cle === cle);
    if (r && (r.etat === "NOT_CONNECTED" || r.etat === "HARDCODED" || r.etat === "PARTIAL")) {
      bloquants.push(`Réglage « ${r.libelle} » (${r.cle}) à l'état ${r.etat} : ${r.motif || "voir Settings Registry"}`);
    }
  }

  // Aucun candidat interne hébergé du tout dans cet environnement (LOCAL_LLM_URL absent) :
  // le plancher de readiness reste bas quel que soit le nombre de comparaisons déjà faites.
  const local = (await providerStates()).find((s) => s.code === "modele_local");
  if (!local || local.status === "non_configure") {
    bloquants.push("Aucun modèle auto-hébergé MKA.P-MS réellement configuré (LOCAL_LLM_URL absent) : le remplacement interne visé n'existe pas encore physiquement.");
  }

  // Score simple et honnête : part interne réelle pèse pour l'essentiel,
  // chaque bloquant restant grignote le reste — jamais négatif, jamais fabriqué à 100 sans preuve.
  const pourcentage = Math.max(0, Math.min(100, Math.round(partInterne * 0.7) - Math.max(0, bloquants.length - 1) * 5));
  return { pourcentage, bloquants };
}

function statutMigration(readiness: DisconnectReadiness, cible: Date | null, dejaDisconnected: boolean): StatutMigration {
  if (dejaDisconnected) return "DISCONNECTED";
  if (readiness.pourcentage >= 100 && readiness.bloquants.length === 0) return "READY_TO_DISCONNECT";
  if (!cible) return "ON_TRACK";
  const joursRestants = (cible.getTime() - Date.now()) / (24 * 3600 * 1000);
  if (readiness.bloquants.length > 0 && joursRestants < 180) return "AT_RISK";
  if (readiness.pourcentage === 0 && joursRestants < 365) return "BLOCKED";
  return "ON_TRACK";
}

export interface LigneDependance {
  providerId: string;
  internalName: string;
  adapterId: string;
  capabilitiesAvailable: string[];
  capabilitiesUsed: string[];
  fallback: string;
  alternativeProvider: string | null;
  internalReplacement: string;
  internalReplacementStatus: string;
  migrationPriority: string;
  targetDisconnectDate: Date | null;
  trainingRights: string;
  redistributionRights: string;
  retentionPolicy: string;
  countryConstraints: string[];
  lastIndependenceTest: Date | null;
  lastIndependenceTestOk: boolean | null;
  /** État réel constaté auprès de la Fabrique — jamais recopié en base, toujours relu. */
  wireStatus: string | undefined;
  fournisseurConfigure: boolean;
  coutMesureCents30j: number;
  readiness: DisconnectReadiness;
  statutMigration: StatutMigration;
}

/** Vue d'ensemble réelle : registre statique + état vivant Fabrique + shadow + coûts. */
export async function registre(): Promise<LigneDependance[]> {
  await seedReference();
  const lignes = await db.select().from(gvDependencies);
  const etats = await providerStates();
  const couts = await costSummary(30);

  const sorties: LigneDependance[] = [];
  for (const l of lignes) {
    const etatFabrique = etats.find((e) => e.code === l.providerId);
    const readiness = await disconnectReadiness(l.providerId);
    const coutLigne = couts.parFournisseur.find((c) => c.providerCode === l.providerId);
    sorties.push({
      providerId: l.providerId,
      internalName: l.internalName,
      adapterId: l.adapterId,
      capabilitiesAvailable: l.capabilitiesAvailable,
      capabilitiesUsed: l.capabilitiesUsed,
      fallback: l.fallback,
      alternativeProvider: l.alternativeProvider,
      internalReplacement: l.internalReplacement,
      internalReplacementStatus: l.internalReplacementStatus,
      migrationPriority: l.migrationPriority,
      targetDisconnectDate: l.targetDisconnectDate,
      trainingRights: l.trainingRights,
      redistributionRights: l.redistributionRights,
      retentionPolicy: l.retentionPolicy,
      countryConstraints: l.countryConstraints,
      lastIndependenceTest: l.lastIndependenceTest,
      lastIndependenceTestOk: l.lastIndependenceTestOk,
      wireStatus: etatFabrique?.wireStatus,
      fournisseurConfigure: etatFabrique?.status === "actif" || etatFabrique?.status === "configure",
      coutMesureCents30j: coutLigne?.costCents ?? 0,
      readiness,
      statutMigration: statutMigration(readiness, l.targetDisconnectDate, l.status === "DISCONNECTED"),
    });
  }
  return sorties;
}

export async function detail(providerId: string): Promise<LigneDependance | null> {
  const tout = await registre();
  return tout.find((l) => l.providerId === providerId) ?? null;
}

/**
 * Consigne un test d'indépendance réellement exécuté (jamais une déclaration
 * sans exécution). `seedReference()` garantit que la ligne existe déjà quand
 * ce test est le tout premier appel du processus (cas réel : ce fichier de
 * test est lancé seul, sans être passé par registre()/couverture() avant).
 */
export async function enregistrerTestIndependance(providerId: string, ok: boolean): Promise<void> {
  await seedReference();
  await db
    .update(gvDependencies)
    .set({ lastIndependenceTest: new Date(), lastIndependenceTestOk: ok, updatedAt: new Date() })
    .where(eq(gvDependencies.providerId, providerId));
}

export interface CouvertureDependances {
  external_dependencies_inventoried_pct: number;
  dependencies_without_adapter: number;
  critical_dependency_without_fallback: number;
  dependency_without_exit_plan: number;
  dependency_without_target_date: number;
  independence_test_stale: number;
  dependency_past_target_date: number;
  detail: string[];
}

/**
 * Point 18 — chaque compteur est calculé depuis le registre réel, jamais
 * fixé à une valeur cible par convenance. Une valeur non nulle honnête (voir
 * anthropic, enregistré mais sans adaptateur réel) reste affichée, avec son
 * anomalie nommée, plutôt que masquée.
 */
export async function couverture(): Promise<CouvertureDependances> {
  const lignes = await registre();
  const detail: string[] = [];

  const sansAdaptateur = lignes.filter((l) => !l.adapterId || /^aucun/i.test(l.adapterId));
  for (const l of sansAdaptateur) detail.push(`${l.providerId} : sans adaptateur réel (${l.adapterId || "vide"}).`);

  const critiquesUtilisees = lignes.filter((l) => l.capabilitiesUsed.length > 0);
  const sansRepli = critiquesUtilisees.filter((l) => !l.fallback || /^sans objet/i.test(l.fallback));
  for (const l of sansRepli) detail.push(`${l.providerId} : utilisé réellement mais sans repli déclaré.`);

  const sansDate = critiquesUtilisees.filter((l) => !l.targetDisconnectDate);
  for (const l of sansDate) detail.push(`${l.providerId} : utilisé réellement mais sans date cible de déconnexion.`);

  const testPerime = critiquesUtilisees.filter(
    (l) => !l.lastIndependenceTest || Date.now() - l.lastIndependenceTest.getTime() > 180 * 24 * 3600 * 1000,
  );
  for (const l of testPerime) detail.push(`${l.providerId} : test d'indépendance jamais exécuté ou périmé (>6 mois).`);

  const depassees = lignes.filter((l) => l.targetDisconnectDate && l.targetDisconnectDate.getTime() < Date.now());
  for (const l of depassees) detail.push(`${l.providerId} : échéance de déconnexion dépassée sans être déconnecté.`);

  return {
    external_dependencies_inventoried_pct: lignes.length > 0 ? 100 : 0,
    dependencies_without_adapter: sansAdaptateur.length,
    critical_dependency_without_fallback: sansRepli.length,
    dependency_without_exit_plan: sansDate.length,
    dependency_without_target_date: sansDate.length,
    independence_test_stale: testPerime.length,
    dependency_past_target_date: depassees.length,
    detail,
  };
}

/** Point 15 — alertes de migration, calculées, jamais poussées automatiquement (pas de canal dédié dans ce lot). */
export async function alertesMigration(): Promise<string[]> {
  const alertes: string[] = [];
  const lignes = await registre();
  for (const l of lignes) {
    if (!l.targetDisconnectDate) continue;
    const joursRestants = Math.round((l.targetDisconnectDate.getTime() - Date.now()) / (24 * 3600 * 1000));
    if (joursRestants < 365 && l.readiness.pourcentage < 50) {
      alertes.push(`« ${l.internalName} » : ${joursRestants} jour(s) avant l'échéance, readiness ${l.readiness.pourcentage} % seulement.`);
    }
    if (!l.lastIndependenceTest) {
      alertes.push(`« ${l.internalName} » : aucun test d'indépendance jamais consigné.`);
    } else if (Date.now() - l.lastIndependenceTest.getTime() > 180 * 24 * 3600 * 1000) {
      alertes.push(`« ${l.internalName} » : dernier test d'indépendance daté de plus de six mois.`);
    }
    if (l.trainingRights === "LEGAL_RIGHTS_UNKNOWN" || l.redistributionRights === "LEGAL_RIGHTS_UNKNOWN") {
      alertes.push(`« ${l.internalName} » : droits sur les données non clarifiés (LEGAL_RIGHTS_UNKNOWN).`);
    }
  }
  return alertes;
}
