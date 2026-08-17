/**
 * Points 64-65 — veille mondiale automobile, pays par pays.
 *
 * Le principe tenu ici : **la veille ne fabrique jamais l'information qu'elle
 * n'a pas**. Chaque sujet surveillé exige un type de source ; si aucune source
 * autorisée n'existe pour ce sujet dans ce pays, le cycle l'écrit
 * (`aucune_source_autorisee`) au lieu de produire un constat inventé.
 *
 * Deux familles de constats coexistent donc :
 *   • ceux issus des données réelles de MKA.P-MS (modèles réellement déposés,
 *     recherches réellement effectuées) — disponibles immédiatement ;
 *   • ceux qui dépendent d'une source externe (rappels officiels, normes,
 *     réglementation, tendances industrielles) — bloqués tant que la source
 *     n'est pas autorisée.
 *
 * Point 65 : rien n'est mondial par défaut. Le cycle tourne pays par pays sur
 * les pays réellement activés, et chaque constat porte son pays. Une
 * observation faite en France n'est jamais recopiée sur un autre pays.
 */
import { and, desc, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import { smartSearchLogs } from "../smart-engine/schema.js";
import { countryCountries } from "../country-os/index.js";
import { akeNodes, akeSources, akeWatchRuns } from "./schema.js";
import { recordDiscovery } from "./discoveries.js";

/** Sujets du point 64, avec le type de source qui peut légitimement les nourrir. */
export const WATCH_TOPICS: {
  code: string;
  label: string;
  domain: string;
  /** Classification par défaut d'un constat sur ce sujet (point 64). */
  classification: "critique" | "important" | "opportunite" | "information";
  /** Types de sources acceptables. Vide = observable en interne. */
  sourceKinds: string[];
}[] = [
  {
    code: "rappels",
    label: "Rappels et alertes de sécurité",
    domain: "securite",
    classification: "critique",
    sourceKinds: ["reglementation", "donnees_publiques", "constructeur"],
  },
  {
    code: "reglementation",
    label: "Changements réglementaires",
    domain: "reglementation",
    classification: "important",
    sourceKinds: ["reglementation", "donnees_publiques"],
  },
  {
    code: "normes",
    label: "Nouvelles normes",
    domain: "norme",
    classification: "important",
    sourceKinds: ["reglementation", "donnees_publiques", "base_licence"],
  },
  {
    code: "motorisations",
    label: "Nouvelles motorisations",
    domain: "motorisation",
    classification: "information",
    sourceKinds: ["constructeur", "base_licence", "documentation"],
  },
  {
    code: "technologies",
    label: "Nouvelles technologies",
    domain: "technologie",
    classification: "opportunite",
    sourceKinds: ["constructeur", "tendances", "documentation", "base_licence"],
  },
  {
    code: "innovations",
    label: "Innovations industrielles",
    domain: "technologie",
    classification: "opportunite",
    sourceKinds: ["tendances", "documentation", "reseau_social"],
  },
  {
    code: "marches",
    label: "Évolution des marchés",
    domain: "mobilite",
    classification: "information",
    sourceKinds: ["tendances", "donnees_publiques"],
  },
  {
    code: "modeles",
    label: "Nouveaux modèles",
    domain: "modele",
    classification: "information",
    sourceKinds: [],
  },
  {
    code: "tendances_conso",
    label: "Tendances consommateurs",
    domain: "mobilite",
    classification: "opportunite",
    sourceKinds: [],
  },
  {
    code: "services",
    label: "Nouveaux services attendus",
    domain: "mobilite",
    classification: "opportunite",
    sourceKinds: [],
  },
];

/** Seuil minimal de constats avant de parler de tendance : une coïncidence n'en est pas une. */
const SEUIL_TENDANCE = 5;

export interface WatchTopicResult {
  topic: string;
  label: string;
  countryCode: string;
  statut: "observe" | "aucune_source_autorisee" | "aucun_constat";
  constats: number;
  sourcesAutorisees: number;
  detail: string;
}

/** Sources dont l'autorisation est réellement établie, par type et par pays. */
async function authorizedSources(countryCode: string): Promise<{ code: string; kind: string }[]> {
  const rows = await db
    .select({
      code: akeSources.code,
      kind: akeSources.kind,
      countryCode: akeSources.countryCode,
      authorization: akeSources.authorization,
    })
    .from(akeSources);
  return rows
    .filter(
      (r) =>
        r.authorization !== "interdite" &&
        r.authorization !== "a_verifier" &&
        (r.countryCode === null || r.countryCode === countryCode),
    )
    .map((r) => ({ code: r.code, kind: r.kind }));
}

/**
 * Modèles réellement déposés dans un pays et encore absents de la mémoire.
 * C'est un fait constatable sur la plateforme, pas une annonce constructeur.
 */
async function watchModels(countryCode: string): Promise<{ constats: number; detail: string }> {
  const rows = await db
    .select({
      marque: annonces.marque,
      modele: annonces.modele,
      n: sql<number>`count(*)::int`,
      derniere: sql<Date>`max(${annonces.createdAt})`,
    })
    .from(annonces)
    .where(and(eq(annonces.status, "publiee"), eq(annonces.pays, countryCode)))
    .groupBy(annonces.marque, annonces.modele)
    .limit(400);

  const connus = new Set(
    (
      await db
        .select({ label: akeNodes.label })
        .from(akeNodes)
        .where(eq(akeNodes.domain, "modele"))
    ).map((r) => r.label.trim().toLowerCase()),
  );

  let constats = 0;
  for (const r of rows) {
    const label = `${r.marque} ${r.modele}`.trim();
    if (connus.has(label.toLowerCase())) continue;
    await recordDiscovery({
      title: `Modèle « ${label} » présent sur la plateforme mais absent de la mémoire`,
      domain: "modele",
      detail: `${r.n} annonce(s) publiée(s) dans ce pays portent ce modèle, qui n'a encore aucune fiche de connaissance.`,
      interest:
        "Compléter la mémoire (motorisations, pièces, entretien) rendrait l'estimation et la recherche plus justes pour ce modèle.",
      countryCode,
      sourceCode: "mkapms_interne",
      classification: "information",
      evidence: { marque: r.marque, modele: r.modele, annonces: r.n },
    });
    constats += 1;
  }
  return {
    constats,
    detail:
      constats === 0
        ? "Tous les modèles déposés dans ce pays sont déjà connus de la mémoire."
        : `${constats} modèle(s) déposé(s) dans ce pays ne sont pas encore documentés.`,
  };
}

/**
 * Tendances de recherche réelles : comparaison des 30 derniers jours aux 30
 * précédents. Une requête vue moins de cinq fois n'est pas une tendance.
 */
async function watchConsumerTrends(
  countryCode: string,
): Promise<{ constats: number; detail: string }> {
  const now = Date.now();
  const debutRecent = new Date(now - 30 * 24 * 3600 * 1000);
  const debutPrecedent = new Date(now - 60 * 24 * 3600 * 1000);

  const recentes = await db
    .select({ query: smartSearchLogs.query, n: sql<number>`count(*)::int`, sansResultat: sql<number>`count(*) filter (where ${smartSearchLogs.hasResults} = false)::int` })
    .from(smartSearchLogs)
    .where(
      and(
        isNotNull(smartSearchLogs.query),
        eq(smartSearchLogs.pays, countryCode),
        gte(smartSearchLogs.createdAt, debutRecent),
      ),
    )
    .groupBy(smartSearchLogs.query)
    .limit(200);

  const precedentes = await db
    .select({ query: smartSearchLogs.query, n: sql<number>`count(*)::int` })
    .from(smartSearchLogs)
    .where(
      and(
        isNotNull(smartSearchLogs.query),
        eq(smartSearchLogs.pays, countryCode),
        gte(smartSearchLogs.createdAt, debutPrecedent),
        lt(smartSearchLogs.createdAt, debutRecent),
      ),
    )
    .groupBy(smartSearchLogs.query)
    .limit(500);

  const avant = new Map(precedentes.map((r) => [r.query ?? "", r.n]));
  let constats = 0;

  for (const r of recentes) {
    const q = (r.query ?? "").trim();
    if (q.length < 3 || r.n < SEUIL_TENDANCE) continue;
    const ancien = avant.get(q) ?? 0;

    if (r.sansResultat >= SEUIL_TENDANCE) {
      await recordDiscovery({
        title: `« ${q} » recherché sans résultat`,
        domain: "mobilite",
        detail: `${r.sansResultat} recherche(s) sans aucun résultat sur les 30 derniers jours dans ce pays.`,
        interest:
          "Une demande existe et la plateforme n'y répond pas : offre manquante, mot-clé manquant, ou service à ouvrir dans ce pays.",
        countryCode,
        sourceCode: "mkapms_interne",
        classification: "important",
        evidence: { requete: q, recherches: r.n, sansResultat: r.sansResultat },
      });
      constats += 1;
      continue;
    }

    if (ancien >= SEUIL_TENDANCE && r.n >= ancien * 2) {
      await recordDiscovery({
        title: `Demande en hausse : « ${q} »`,
        domain: "mobilite",
        detail: `${ancien} recherche(s) sur la période précédente, ${r.n} sur les 30 derniers jours dans ce pays.`,
        interest: "Hausse constatée sur des recherches réelles : opportunité à examiner pour ce pays.",
        countryCode,
        sourceCode: "mkapms_interne",
        classification: "opportunite",
        evidence: { requete: q, avant: ancien, apres: r.n },
      });
      constats += 1;
    }
  }

  return {
    constats,
    detail:
      constats === 0
        ? `Aucune tendance au-dessus du seuil de ${SEUIL_TENDANCE} recherches sur ce pays.`
        : `${constats} mouvement(s) de demande constaté(s) sur des recherches réelles.`,
  };
}

/**
 * Univers activés pour un pays mais sans aucune connaissance rattachée : la
 * plateforme vend (ou s'apprête à vendre) un service qu'elle ne documente pas.
 */
async function watchServices(
  countryCode: string,
  universes: string[],
): Promise<{ constats: number; detail: string }> {
  if (universes.length === 0) {
    return { constats: 0, detail: "Aucun univers activé pour ce pays." };
  }
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(akeNodes)
    .where(eq(akeNodes.countryCode, countryCode));
  const connaissancesPays = row?.n ?? 0;
  if (connaissancesPays > 0) {
    return {
      constats: 0,
      detail: `${connaissancesPays} connaissance(s) rattachée(s) à ce pays.`,
    };
  }
  await recordDiscovery({
    title: `Aucune connaissance rattachée à ce pays`,
    domain: "mobilite",
    detail: `Univers activés : ${universes.join(", ")}. La mémoire ne contient aucune connaissance portant ce pays.`,
    interest:
      "Les règles, pièces, garages et usages diffèrent d'un pays à l'autre : sans connaissance locale, les réponses de la plateforme reposent sur un autre pays.",
    countryCode,
    sourceCode: "mkapms_interne",
    classification: "important",
    evidence: { universes },
  });
  return { constats: 1, detail: "Pays activé sans aucune connaissance locale." };
}

/**
 * Cycle de veille complet. Tourne sur les pays réellement activés ; ne retombe
 * jamais sur un pays par défaut si aucun n'est activé.
 */
export async function runWatchCycle(opts?: { countryCode?: string }): Promise<{
  pays: number;
  resultats: WatchTopicResult[];
  erreurs: string[];
}> {
  const pays = await db
    .select({
      code: countryCountries.code,
      universes: countryCountries.universesEnabled,
    })
    .from(countryCountries)
    .where(
      opts?.countryCode
        ? and(eq(countryCountries.active, true), eq(countryCountries.code, opts.countryCode.toUpperCase()))
        : eq(countryCountries.active, true),
    );

  const resultats: WatchTopicResult[] = [];
  const erreurs: string[] = [];

  for (const p of pays) {
    const sources = await authorizedSources(p.code);

    for (const topic of WATCH_TOPICS) {
      const utilisables =
        topic.sourceKinds.length === 0
          ? sources.filter((s) => s.kind === "mkapms")
          : sources.filter((s) => topic.sourceKinds.includes(s.kind));

      let statut: WatchTopicResult["statut"] = "aucun_constat";
      let constats = 0;
      let detail = "";

      if (utilisables.length === 0) {
        statut = "aucune_source_autorisee";
        detail =
          topic.sourceKinds.length === 0
            ? "Les données internes MKA.P-MS ne sont pas déclarées comme source autorisée."
            : `Aucune source autorisée de type ${topic.sourceKinds.join(" / ")} pour ce pays : rien n'est surveillé, et rien n'est inventé.`;
      } else {
        try {
          if (topic.code === "modeles") {
            const r = await watchModels(p.code);
            constats = r.constats;
            detail = r.detail;
          } else if (topic.code === "tendances_conso") {
            const r = await watchConsumerTrends(p.code);
            constats = r.constats;
            detail = r.detail;
          } else if (topic.code === "services") {
            const r = await watchServices(p.code, p.universes ?? []);
            constats = r.constats;
            detail = r.detail;
          } else {
            // Sujet nourri par une source externe : elle est autorisée, mais la
            // collecte réelle dépend de sa configuration et de sa synchronisation.
            detail = `Source autorisée (${utilisables.map((s) => s.code).join(", ")}) : la collecte s'exécutera à la prochaine synchronisation confirmée.`;
          }
          statut = constats > 0 ? "observe" : "aucun_constat";
        } catch (e) {
          erreurs.push(
            `${p.code}/${topic.code} : ${e instanceof Error ? e.message : "erreur inconnue"}`,
          );
          continue;
        }
      }

      await db.insert(akeWatchRuns).values({
        countryCode: p.code,
        topic: topic.code,
        status: statut,
        authorizedSources: utilisables.length,
        findings: constats,
        detail,
      });

      resultats.push({
        topic: topic.code,
        label: topic.label,
        countryCode: p.code,
        statut,
        constats,
        sourcesAutorisees: utilisables.length,
        detail,
      });
    }
  }

  return { pays: pays.length, resultats, erreurs };
}

/**
 * Dernier état de veille par pays et par sujet. Sert de constat de couverture :
 * ce qui est réellement surveillé, et ce qui ne l'est pas faute d'autorisation.
 */
export async function watchCoverage() {
  const rows = await db
    .select()
    .from(akeWatchRuns)
    .orderBy(desc(akeWatchRuns.createdAt))
    .limit(600);

  const dernier = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const key = `${r.countryCode}|${r.topic}`;
    if (!dernier.has(key)) dernier.set(key, r);
  }

  return [...dernier.values()].map((r) => ({
    countryCode: r.countryCode,
    topic: r.topic,
    label: WATCH_TOPICS.find((t) => t.code === r.topic)?.label ?? r.topic,
    classification:
      WATCH_TOPICS.find((t) => t.code === r.topic)?.classification ?? "information",
    status: r.status,
    authorizedSources: r.authorizedSources,
    findings: r.findings,
    detail: r.detail,
    createdAt: r.createdAt,
  }));
}
