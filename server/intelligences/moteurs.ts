/**
 * Points 136 et 137 — registre obligatoire, et connexion de **tous** les
 * moteurs à MKA.P-MS AI.
 *
 * Le registre central existe déjà (`server/engine-registry`) : il n'est pas
 * refait ici. Ce fichier répond à la question que le registre seul ne tranche
 * pas : « ce moteur est-il réellement contrôlable par Intelligences, ou
 * seulement inscrit sur une liste ? »
 *
 * Six exigences du point 137, vérifiées sur preuve et jamais sur déclaration :
 *   1. envoyer son état      → santé connue et battement pas trop ancien ;
 *   2. envoyer ses événements→ émetteur ou abonné au bus central ;
 *   3. envoyer ses erreurs   → journal de santé réellement écrit ;
 *   4. recevoir les commandes→ contrat déclaré avec sa surface de permission ;
 *   5. être analysé          → présent au relevé du code ;
 *   6. être surveillé        → sonde de domaine définie.
 *
 * Un moteur qui manque une exigence est nommé, avec le manque exact. Aucun
 * « tout va bien » global : c'est précisément ce que le point 137 interdit.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { afCostEntries } from "../ai-fabric/schema.js";
import { engineHealthLog } from "../engine-registry/schema.js";
import { ENGINE_PROBES } from "../engine-registry/probes.js";
import { ENGINE_CONTRACTS } from "../engine-registry/contracts.js";
import { EVENT_TYPES, SUBSCRIPTIONS } from "../event-bus/catalog.js";
import { registryOverview } from "../engine-registry/readiness.js";
import type { EngineReadiness } from "../engine-registry/readiness.js";
import { MOTEURS } from "../data/moteurs.js";
import { OUTILS, listerActifs } from "./outils/registre.js";
import { CAPACITES } from "./capacites.js";
import { universDuMoteur } from "./univers/registre.js";

export const EXIGENCES = [
  { code: "etat", libelle: "Envoie son état" },
  { code: "evenements", libelle: "Envoie ses événements" },
  { code: "erreurs", libelle: "Envoie ses erreurs" },
  { code: "commandes", libelle: "Reçoit les commandes autorisées" },
  { code: "analyse", libelle: "Est analysé" },
  { code: "surveillance", libelle: "Est surveillé" },
] as const;

export type CodeExigence = (typeof EXIGENCES)[number]["code"];

export interface MoteurControle {
  nom: string;
  libelle: string;
  categorie: string;
  version: string;
  etat: string;
  motifEtat: string;
  /** Exigence remplie ou non, avec la preuve ou le manque. */
  exigences: { code: CodeExigence; libelle: string; rempli: boolean; preuve: string }[];
  /** Appels réellement passés par ce moteur à Intelligences. */
  appels: number;
  dernierAppel: Date | null;
  controle: boolean;
  manques: string[];
}

export interface AuditMoteurs {
  total: number;
  controles: number;
  nonControles: number;
  /** Exigence → nombre de moteurs qui ne la remplissent pas. */
  manquesParExigence: Record<CodeExigence, number>;
  moteurs: MoteurControle[];
  observeLe: string;
  /** Ce qui empêche l'audit d'être complet, quand c'est le cas. */
  reserves: string[];
}

export const STATUTS_INTEGRATION_IA = [
  "NOT_RELEVANT_TO_AI",
  "REGISTERED_ONLY",
  "DISCOVERABLE",
  "READ_ONLY_CONNECTED",
  "EVENT_CONNECTED",
  "TOOL_CONNECTED",
  "ACTION_CONNECTED",
  "PARTIALLY_CONNECTED",
  "FULLY_CONNECTED",
  "BLOCKED_EXTERNAL_DEPENDENCY",
] as const;
export type StatutIntegrationIa = (typeof STATUTS_INTEGRATION_IA)[number];

export interface LigneEngineGateway {
  engineId: string;
  engineName: string;
  canonicalOwner: string;
  universe: string | null;
  implementationStatus: string;
  routes: string[];
  events: { published: string[]; consumed: string[] };
  contracts: string[];
  permissions: string[];
  health: { status: string; reason: string; checked: boolean };
  audit: string[];
  diagnostics: string[];
  actions: string[];
  tools: string[];
  capabilities: string[];
  countryRules: string[];
  riskLevel: "NOT_APPLICABLE" | "READ_ONLY" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresApproval: boolean;
  version: string;
  intelligenceConnection: StatutIntegrationIa;
  actionableByIntelligence: boolean;
  readableByIntelligence: boolean;
  eventConnected: boolean;
  toolConnected: boolean;
  contextConnected: boolean;
  memoryConnected: boolean;
  monitoringConnected: boolean;
  tests: string[];
  missingItems: { genre: string; detail: string }[];
  duplicateOf: string | null;
  legacyStatus: "NO_DUPLICATE_DECLARED";
}

function normaliserProprietaire(valeur: string): string {
  return valeur
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, "")
    .replace(/-/g, "_")
    .replace(/_(?:engine|os)$/g, "");
}

function outilDuMoteur(provider: string, moteur: string): boolean {
  const attendu = normaliserProprietaire(moteur);
  return provider
    .split("+")
    .map(normaliserProprietaire)
    .some((p) => p === attendu);
}

/**
 * Matrice canonique du mécanisme Engine Gateway existant. Elle agrège les
 * sources propriétaires sans recopier leur logique : périmètre généré,
 * contrats, univers, Tool/Capability Registries, Event Bus et probes.
 */
export function construireMatriceEngineGateway(
  readiness: readonly EngineReadiness[] = [],
): LigneEngineGateway[] {
  const sante = new Map(readiness.map((r) => [r.name, r]));
  const outilsActifs = listerActifs();
  const contrats = new Map(ENGINE_CONTRACTS.map((c) => [c.id, c]));
  const sondes = new Set(ENGINE_PROBES.map((p) => p.engine));

  return MOTEURS.map((m) => {
    const contrat = contrats.get(m.moteur);
    const univers = universDuMoteur(m.moteur);
    const outils = outilsActifs.filter((o) => outilDuMoteur(o.provider, m.moteur));
    const outilsEnregistres = OUTILS.filter((o) => outilDuMoteur(o.provider, m.moteur));
    const capacites = CAPACITES.filter((c) =>
      c.moteurs.some((id) => normaliserProprietaire(id) === normaliserProprietaire(m.moteur)),
    );
    const eventConnected = m.evenementsPublies.length > 0 || m.evenementsConsommes.length > 0;
    const toolConnected = outils.length > 0;
    const actionableByIntelligence = outils.some((o) =>
      o.requiredPermissions.some((p) => p === "WRITE" || p === "PROPOSE" || p === "TEST"),
    );
    const readableByIntelligence = true; // inscrit dans le périmètre généré, lisible par l'audit PDG
    const contextConnected = toolConnected && univers?.conversationnel === true;
    const memoryConnected = eventConnected; // abonnement Intelligence "*" du bus → mémoire technique
    const monitoringConnected = sondes.has(m.moteur) || m.battement !== "aucun";
    const externeBloque =
      outilsEnregistres.length > 0 &&
      outils.length > 0 &&
      outils.every((o) => o.implementationStatus === "IMPLEMENTED_NOT_CONNECTED");

    let intelligenceConnection: StatutIntegrationIa;
    if (externeBloque) intelligenceConnection = "BLOCKED_EXTERNAL_DEPENDENCY";
    else if (
      actionableByIntelligence &&
      eventConnected &&
      contextConnected &&
      monitoringConnected &&
      m.tests.length > 0
    ) intelligenceConnection = "FULLY_CONNECTED";
    else if (actionableByIntelligence) intelligenceConnection = "ACTION_CONNECTED";
    else if (toolConnected && eventConnected) intelligenceConnection = "PARTIALLY_CONNECTED";
    else if (toolConnected) intelligenceConnection = "TOOL_CONNECTED";
    else if (eventConnected) intelligenceConnection = "EVENT_CONNECTED";
    else if (contrat || capacites.length > 0) intelligenceConnection = "READ_ONLY_CONNECTED";
    else intelligenceConnection = "DISCOVERABLE";

    const etat = sante.get(m.moteur);
    return {
      engineId: m.moteur,
      engineName: m.label,
      canonicalOwner: m.moteur,
      universe: univers?.universeId ?? null,
      implementationStatus: m.etatDeclare,
      routes: [...m.routes],
      events: { published: [...m.evenementsPublies], consumed: [...m.evenementsConsommes] },
      contracts: contrat ? [contrat.technicalName, ...contrat.endpoints] : [],
      permissions: [
        ...(contrat?.permissions.map((p) => p.key) ?? []),
        ...new Set(outils.flatMap((o) => o.requiredPermissions)),
      ],
      health: {
        status: etat?.operational ?? "NOT_VERIFIED",
        reason: etat?.reason ?? "État runtime non chargé : matrice structurelle uniquement.",
        checked: etat !== undefined,
      },
      audit: [
        ...(m.battement !== "aucun" ? [`heartbeat:${m.battement}`] : []),
        ...(eventConnected ? ["event_bus:intelligences_memoire"] : []),
      ],
      diagnostics: [
        "contrat:DiagnosticMoteur",
        ...(contrat?.healthCheck ? [`health:${contrat.healthCheck}`] : []),
      ],
      actions: outils.map((o) => o.toolId).sort(),
      tools: outils.map((o) => o.toolId).sort(),
      capabilities: capacites.map((c) => c.code).sort(),
      countryRules: [
        ...new Set(
          outils.flatMap((o) => [
            ...(o.allowedCountries ?? []).map((pays) => `allowed:${pays}`),
            ...(o.blockedCountries ?? []).map((pays) => `blocked:${pays}`),
          ]),
        ),
      ],
      riskLevel:
        outils.some((o) => o.riskLevel === "CRITICAL")
          ? "CRITICAL"
          : outils.some((o) => o.riskLevel === "HIGH")
            ? "HIGH"
            : outils.some((o) => o.riskLevel === "MEDIUM")
              ? "MEDIUM"
              : outils.some((o) => o.riskLevel === "LOW")
                ? "LOW"
                : outils.some((o) => o.riskLevel === "READ_ONLY")
                  ? "READ_ONLY"
                  : "NOT_APPLICABLE",
      requiresApproval: outils.some((o) => o.requiresHumanApproval),
      version: etat?.version ?? contrat?.version ?? "UNVERSIONED",
      intelligenceConnection,
      actionableByIntelligence,
      readableByIntelligence,
      eventConnected,
      toolConnected,
      contextConnected,
      memoryConnected,
      monitoringConnected,
      tests: [...m.tests],
      missingItems: m.manques.map((x) => ({ genre: x.genre, detail: x.detail })),
      duplicateOf: null,
      legacyStatus: "NO_DUPLICATE_DECLARED",
    };
  });
}

export async function matriceEngineGateway(): Promise<LigneEngineGateway[]> {
  const overview = await registryOverview();
  return construireMatriceEngineGateway(overview.moteurs);
}

/**
 * Audit complet. Si 40 moteurs existent, 40 lignes sortent ; si 100 existent,
 * 100 lignes sortent. Le nombre vient du registre, jamais d'une liste écrite ici.
 */
export async function audit(): Promise<AuditMoteurs> {
  const reserves: string[] = [];
  const overview = await registryOverview();

  const sondes = new Set(ENGINE_PROBES.map((p) => p.engine));
  const contrats = new Set(ENGINE_CONTRACTS.map((c) => c.id));

  const emetteurs = new Set<string>();
  for (const t of EVENT_TYPES) for (const e of t.emetteurs) emetteurs.add(e);
  const abonnes = new Set(SUBSCRIPTIONS.map((s) => s.engine));

  const journaux = new Map<string, { total: number; dernier: Date | null }>();
  try {
    const lignes = await db
      .select({
        moteur: engineHealthLog.engineName,
        total: sql<number>`count(*)::int`,
        dernier: sql<Date | null>`max(${engineHealthLog.createdAt})`,
      })
      .from(engineHealthLog)
      .groupBy(engineHealthLog.engineName);
    for (const l of lignes) journaux.set(l.moteur, { total: l.total, dernier: l.dernier });
  } catch (e) {
    reserves.push(
      `Journal de santé illisible (${e instanceof Error ? e.message : "erreur inconnue"}) : l'exigence « envoie ses erreurs » n'a pas pu être vérifiée.`,
    );
  }

  const appels = new Map<string, { total: number; dernier: Date | null }>();
  try {
    const lignes = await db
      .select({
        moteur: afCostEntries.engine,
        total: sql<number>`count(*)::int`,
        dernier: sql<Date | null>`max(${afCostEntries.createdAt})`,
      })
      .from(afCostEntries)
      .groupBy(afCostEntries.engine);
    for (const l of lignes) appels.set(l.moteur, { total: l.total, dernier: l.dernier });
  } catch (e) {
    reserves.push(
      `Consommation Intelligences illisible (${e instanceof Error ? e.message : "erreur inconnue"}).`,
    );
  }

  let connusDuCode = new Set<string>();
  let sansTest = new Set<string>();
  try {
    const graphe = await import("../code-graph/service.js");
    const etatGraphe = await graphe.etat();
    if (!etatGraphe.snapshot) {
      reserves.push(
        `Aucun relevé de code ingéré : l'exigence « est analysé » reste non vérifiée (${etatGraphe.artefact.motif ?? "artefact absent"}).`,
      );
    }
    sansTest = new Set(etatGraphe.moteursSansTest);
    const noeuds = await graphe.recherche("", 5000);
    connusDuCode = new Set(
      noeuds.filter((n) => n.type === "moteur").map((n) => n.label),
    );
  } catch (e) {
    reserves.push(
      `Relevé de code illisible (${e instanceof Error ? e.message : "erreur inconnue"}).`,
    );
  }

  const moteurs: MoteurControle[] = overview.moteurs.map((m) => {
    const journal = journaux.get(m.name);
    const appel = appels.get(m.name);

    const exigences: MoteurControle["exigences"] = [
      {
        code: "etat",
        libelle: "Envoie son état",
        rempli: m.health !== "unknown" && !m.heartbeatStale,
        preuve:
          m.health === "unknown"
            ? "Aucune santé déclarée : le moteur n'expose pas encore de sonde."
            : m.heartbeatStale
              ? "Dernier signe de vie trop ancien : l'état affiché n'est plus garanti."
              : `Santé « ${m.health} », dernier signe de vie ${m.lastHeartbeat ?? "inconnu"}.`,
      },
      {
        code: "evenements",
        libelle: "Envoie ses événements",
        rempli: emetteurs.has(m.name) || abonnes.has(m.name),
        preuve:
          emetteurs.has(m.name) || abonnes.has(m.name)
            ? `${emetteurs.has(m.name) ? "Émetteur" : ""}${emetteurs.has(m.name) && abonnes.has(m.name) ? " et " : ""}${abonnes.has(m.name) ? "abonné" : ""} au bus central.`
            : "Ni émetteur ni abonné au bus : ce moteur travaille sans que personne l'entende.",
      },
      {
        code: "erreurs",
        libelle: "Envoie ses erreurs",
        rempli: (journal?.total ?? 0) > 0,
        preuve:
          (journal?.total ?? 0) > 0
            ? `${journal?.total} entrée(s) au journal de santé, dernière le ${journal?.dernier ? new Date(journal.dernier).toLocaleDateString("fr-FR") : "?"}.`
            : "Aucune entrée au journal de santé : une panne de ce moteur passerait inaperçue.",
      },
      {
        code: "commandes",
        libelle: "Reçoit les commandes autorisées",
        rempli: contrats.has(m.name),
        preuve: contrats.has(m.name)
          ? "Contrat moteur déclaré : surface de permission connue."
          : "Aucun contrat déclaré : aucune commande ne peut lui être adressée sans deviner sa surface.",
      },
      {
        code: "analyse",
        libelle: "Est analysé",
        rempli: connusDuCode.size > 0 ? connusDuCode.has(m.name) : false,
        preuve:
          connusDuCode.size === 0
            ? "Relevé de code indisponible : analyse non vérifiée."
            : connusDuCode.has(m.name)
              ? `Présent au relevé du code${sansTest.has(m.name) ? ", mais aucun contrôle ne le couvre" : ""}.`
              : "Absent du relevé de code : Intelligences ne sait pas ce qu'il risque de casser.",
      },
      {
        code: "surveillance",
        libelle: "Est surveillé",
        rempli: sondes.has(m.name),
        preuve: sondes.has(m.name)
          ? "Sonde de domaine définie : son activité réelle est mesurable."
          : "Aucune sonde de domaine : sa santé ne peut être que déclarative.",
      },
    ];

    const manques = exigences.filter((e) => !e.rempli).map((e) => e.libelle);

    return {
      nom: m.name,
      libelle: m.label,
      categorie: m.category,
      version: m.version,
      etat: m.operational,
      motifEtat: m.reason,
      exigences,
      appels: appel?.total ?? 0,
      dernierAppel: appel?.dernier ?? null,
      controle: manques.length === 0,
      manques,
    };
  });

  const manquesParExigence = EXIGENCES.reduce(
    (acc, e) => ({
      ...acc,
      [e.code]: moteurs.filter((m) => m.exigences.some((x) => x.code === e.code && !x.rempli))
        .length,
    }),
    {} as Record<CodeExigence, number>,
  );

  return {
    total: moteurs.length,
    controles: moteurs.filter((m) => m.controle).length,
    nonControles: moteurs.filter((m) => !m.controle).length,
    manquesParExigence,
    moteurs,
    observeLe: new Date().toISOString(),
    reserves,
  };
}

/** Détail d'un seul moteur, pour l'écran de direction. */
export async function moteur(nom: string): Promise<MoteurControle | null> {
  const a = await audit();
  return a.moteurs.find((m) => m.nom === nom) ?? null;
}

/** Derniers appels réellement passés à Intelligences, moteur par moteur. */
export async function appelsRecents(limit = 50) {
  return db
    .select({
      moteur: afCostEntries.engine,
      tache: afCostEntries.taskType,
      capacite: afCostEntries.capability,
      fournisseur: afCostEntries.providerCode,
      quand: afCostEntries.createdAt,
    })
    .from(afCostEntries)
    .orderBy(desc(afCostEntries.id))
    .limit(limit);
}

/** Journal de santé d'un moteur — sert au détail d'écran. */
export async function journalSante(nom: string, limit = 30) {
  return db
    .select()
    .from(engineHealthLog)
    .where(eq(engineHealthLog.engineName, nom))
    .orderBy(desc(engineHealthLog.id))
    .limit(limit);
}
