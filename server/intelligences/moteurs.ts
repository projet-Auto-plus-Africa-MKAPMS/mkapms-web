/**
 * Points 136 et 137 — registre obligatoire, et connexion de **tous** les
 * moteurs à MKA.P-MS Intelligences.
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
