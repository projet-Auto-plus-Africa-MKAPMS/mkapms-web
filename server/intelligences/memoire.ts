/**
 * Points 134 et 139 — mémoire MKA.P-MS à grande capacité, et apprentissage
 * après chaque action.
 *
 * La mémoire est **fédérée, pas recopiée**. Chaque catégorie du point 134 est
 * rattachée au moteur qui la détient déjà — le Code Knowledge Graph pour le
 * code, le registre pour les moteurs, le moteur de connaissance automobile pour
 * l'automobile, la résilience pour les erreurs et solutions, le Country Policy
 * pour les pays. Recopier ces mémoires dans une table Intelligence créerait deux
 * vérités : la première divergence rendrait les deux inutilisables.
 *
 * `in_memoire` n'héberge donc que les catégories sans propriétaire (entreprise,
 * décisions, projets, recherche, apprentissage). La croissance se fait par
 * catégorie et par cycle (actif → historique → archive) : ajouter une catégorie
 * ne demande pas de reconstruire le système.
 */
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { inExperiences, inMemoire } from "./schema.js";

/** Cycle de vie d'un souvenir. */
export const CYCLES = ["actif", "historique", "archive"] as const;
export type Cycle = (typeof CYCLES)[number];

export interface Categorie {
  code: string;
  libelle: string;
  /** Moteur qui détient réellement cette mémoire, ou `intelligences` si propre. */
  detenteur: string;
  usage: string;
}

/** Les 13 mémoires du point 134, avec leur détenteur réel. */
export const CATEGORIES: Categorie[] = [
  {
    code: "entreprise",
    libelle: "Mémoire entreprise",
    detenteur: "intelligences",
    usage: "Décisions de cadrage, règles maison, positionnement, engagements.",
  },
  {
    code: "technique",
    libelle: "Mémoire technique",
    detenteur: "intelligences",
    usage: "Choix d'architecture, contraintes d'hébergement, dettes assumées.",
  },
  {
    code: "code",
    libelle: "Mémoire code",
    detenteur: "code_graph",
    usage: "Fichiers, routes, API, tables, tests et dépendances réellement relevés.",
  },
  {
    code: "automobile",
    libelle: "Mémoire automobile",
    detenteur: "knowledge_engine",
    usage: "Connaissance véhicule sourcée, avec provenance et licence.",
  },
  {
    code: "erreurs",
    libelle: "Mémoire erreurs et solutions",
    detenteur: "resilience",
    usage: "Panne, cause, correction appliquée, leçon retenue.",
  },
  {
    code: "decisions",
    libelle: "Mémoire décisions",
    detenteur: "intelligences",
    usage: "Ce qui a été tranché, par qui, quand, et sur quel motif.",
  },
  {
    code: "pays",
    libelle: "Mémoire pays",
    detenteur: "country_policy",
    usage: "Règles applicables par pays, restrictions, obligations.",
  },
  {
    code: "moteurs",
    libelle: "Mémoire moteurs",
    detenteur: "engine_registry",
    usage: "État, dernière activité, dernière erreur, dépendances de chaque moteur.",
  },
  {
    code: "utilisateurs",
    libelle: "Mémoire utilisateurs",
    detenteur: "smart_engine",
    usage: "Préférences et parcours observés, sans donnée sensible inutile.",
  },
  {
    code: "clients",
    libelle: "Mémoire clients",
    detenteur: "support_os",
    usage: "Historique de relation, demandes, engagements pris envers un client.",
  },
  {
    code: "projets",
    libelle: "Mémoire projets",
    detenteur: "intelligences",
    usage: "Chantiers en cours, périmètre, état d'avancement, blocages.",
  },
  {
    code: "recherche",
    libelle: "Mémoire recherche",
    detenteur: "intelligences",
    usage: "Veille, comparaisons de plateformes, pistes non encore décidées.",
  },
  {
    code: "apprentissage",
    libelle: "Mémoire apprentissage",
    detenteur: "intelligences",
    usage: "Expériences de mission : problème, diagnostic, solution, résultat.",
  },
];

const PROPRES = new Set(
  CATEGORIES.filter((c) => c.detenteur === "intelligences").map((c) => c.code),
);

const VIDES = new Set([
  "le",
  "la",
  "les",
  "des",
  "une",
  "un",
  "de",
  "du",
  "et",
  "ou",
  "pour",
  "avec",
  "dans",
  "sur",
  "que",
  "qui",
  "est",
  "sont",
  "ce",
  "cette",
]);

/** Mots-clés extraits sans fournisseur externe : la mémoire reste lisible seule. */
export function motsCles(texte: string, max = 12): string[] {
  const vus = new Set<string>();
  for (const brut of texte.toLowerCase().split(/[^a-zà-ÿ0-9_.-]+/)) {
    const mot = brut.trim();
    if (mot.length < 4 || VIDES.has(mot)) continue;
    vus.add(mot);
    if (vus.size >= max) break;
  }
  return [...vus];
}

export interface EcrireInput {
  categorie: string;
  titre: string;
  contenu: string;
  cle?: string;
  liens?: Record<string, string>;
  source?: string;
  countryCode?: string | null;
  poids?: number;
  actorId?: number;
}

/**
 * Écrit un souvenir. Refuse une catégorie détenue par un autre moteur : écrire
 * ici la mémoire du code ou des moteurs créerait une seconde vérité.
 */
export async function ecrire(
  input: EcrireInput,
): Promise<{ ok: boolean; detail: string; id: number | null }> {
  const categorie = CATEGORIES.find((c) => c.code === input.categorie);
  if (!categorie) {
    return { ok: false, detail: `Catégorie de mémoire inconnue : ${input.categorie}.`, id: null };
  }
  if (!PROPRES.has(categorie.code)) {
    return {
      ok: false,
      detail: `La mémoire « ${categorie.libelle} » est détenue par le moteur ${categorie.detenteur} : elle s'écrit là-bas, elle est seulement lue ici.`,
      id: null,
    };
  }

  const cle = (input.cle ?? input.titre).slice(0, 200);
  const [existant] = await db
    .select({ id: inMemoire.id, poids: inMemoire.poids })
    .from(inMemoire)
    .where(and(eq(inMemoire.categorie, categorie.code), eq(inMemoire.cle, cle)))
    .limit(1);

  if (existant) {
    // Le souvenir précédent devient l'historique du même sujet : on ne perd
    // jamais l'antérieur, on le déclasse.
    await db
      .update(inMemoire)
      .set({
        cycle: "historique",
        updatedAt: new Date(),
      })
      .where(eq(inMemoire.id, existant.id));
  }

  const [ligne] = await db
    .insert(inMemoire)
    .values({
      categorie: categorie.code,
      cycle: "actif",
      cle,
      titre: input.titre.slice(0, 240),
      contenu: input.contenu.slice(0, 200000),
      motsCles: motsCles(`${input.titre} ${input.contenu}`),
      liens: input.liens ?? {},
      source: input.source ?? "intelligences",
      countryCode: input.countryCode ?? null,
      poids: input.poids ?? (existant ? existant.poids + 1 : 1),
      actorId: input.actorId ?? null,
    })
    .returning({ id: inMemoire.id });

  return {
    ok: true,
    detail: existant
      ? `Souvenir mis à jour ; la version précédente passe en historique.`
      : `Souvenir enregistré dans « ${categorie.libelle} ».`,
    id: ligne.id,
  };
}

export interface Trouvaille {
  categorie: string;
  detenteur: string;
  titre: string;
  extrait: string;
  cycle: string;
  quand: Date | null;
}

/**
 * Recherche transversale. Les catégories propres sont interrogées en base ; les
 * catégories fédérées sont interrogées chez leur moteur détenteur. Un moteur
 * illisible est signalé comme tel, jamais compté comme « aucun résultat ».
 */
export async function rechercher(
  q: string,
  limit = 40,
): Promise<{ trouvailles: Trouvaille[]; nonLues: { detenteur: string; motif: string }[] }> {
  const terme = q.trim();
  const trouvailles: Trouvaille[] = [];
  const nonLues: { detenteur: string; motif: string }[] = [];
  if (terme.length < 2) return { trouvailles, nonLues };

  const motif = `%${terme}%`;
  const propres = await db
    .select()
    .from(inMemoire)
    .where(
      or(
        ilike(inMemoire.titre, motif),
        ilike(inMemoire.contenu, motif),
        ilike(inMemoire.cle, motif),
      ),
    )
    .orderBy(desc(inMemoire.updatedAt))
    .limit(limit);

  for (const l of propres) {
    trouvailles.push({
      categorie: l.categorie,
      detenteur: "intelligences",
      titre: l.titre,
      extrait: l.contenu.slice(0, 400),
      cycle: l.cycle,
      quand: l.updatedAt,
    });
  }

  try {
    const graphe = await import("../code-graph/service.js");
    const noeuds = await graphe.recherche(terme, 12);
    for (const n of noeuds) {
      trouvailles.push({
        categorie: "code",
        detenteur: "code_graph",
        titre: n.label,
        extrait: `${n.type} — ${n.key}`,
        cycle: "actif",
        quand: null,
      });
    }
  } catch (e) {
    nonLues.push({
      detenteur: "code_graph",
      motif: e instanceof Error ? e.message : "relevé de code illisible",
    });
  }

  try {
    const ake = await import("../knowledge-engine/service.js");
    const r = await ake.searchNodes({ query: terme, limit: 12 });
    for (const n of r) {
      trouvailles.push({
        categorie: "automobile",
        detenteur: "knowledge_engine",
        titre: n.label,
        extrait: (n.summary ?? "").slice(0, 400),
        cycle: "actif",
        quand: n.updatedAt ?? null,
      });
    }
  } catch (e) {
    nonLues.push({
      detenteur: "knowledge_engine",
      motif: e instanceof Error ? e.message : "connaissance automobile illisible",
    });
  }

  try {
    const exp = await experiencesProches(terme, 10);
    for (const x of exp) {
      trouvailles.push({
        categorie: "apprentissage",
        detenteur: "intelligences",
        titre: `${x.domaine} — ${x.resultat}`,
        extrait: `${x.probleme}\n${x.solution}`.slice(0, 400),
        cycle: "actif",
        quand: x.updatedAt,
      });
    }
  } catch (e) {
    nonLues.push({
      detenteur: "experiences",
      motif: e instanceof Error ? e.message : "expériences illisibles",
    });
  }

  return { trouvailles: trouvailles.slice(0, limit), nonLues };
}

export interface EtatCategorie extends Categorie {
  /** Nombre réellement compté, ou null quand le détenteur n'a pas répondu. */
  volume: number | null;
  motif: string;
  dernier: Date | null;
}

/** État de la mémoire, catégorie par catégorie, sur volume constaté. */
export async function etat(): Promise<EtatCategorie[]> {
  const parCategorie = new Map<string, { volume: number; dernier: Date | null }>();
  const lignes = await db
    .select({
      categorie: inMemoire.categorie,
      volume: sql<number>`count(*)::int`,
      dernier: sql<Date | null>`max(${inMemoire.updatedAt})`,
    })
    .from(inMemoire)
    .groupBy(inMemoire.categorie);
  for (const l of lignes) parCategorie.set(l.categorie, { volume: l.volume, dernier: l.dernier });

  const sorties: EtatCategorie[] = [];
  for (const c of CATEGORIES) {
    if (PROPRES.has(c.code)) {
      const compte = parCategorie.get(c.code);
      sorties.push({
        ...c,
        volume: compte?.volume ?? 0,
        dernier: compte?.dernier ?? null,
        motif: compte ? "Mémoire propre à Intelligences." : "Aucun souvenir enregistré à ce jour.",
      });
      continue;
    }
    sorties.push({ ...c, ...(await volumeFedere(c)) });
  }
  return sorties;
}

async function volumeFedere(
  c: Categorie,
): Promise<{ volume: number | null; motif: string; dernier: Date | null }> {
  try {
    switch (c.detenteur) {
      case "code_graph": {
        const graphe = await import("../code-graph/service.js");
        const e = await graphe.etat();
        const noeuds = Object.values(e.snapshot?.stats ?? {}).reduce((n, v) => n + v, 0);
        return {
          volume: e.snapshot ? noeuds : null,
          motif: e.snapshot
            ? `Relevé du ${new Date(e.snapshot.generatedAt).toLocaleDateString("fr-FR")} : ${noeuds} élément(s)${e.snapshot.perime ? ", relevé périmé" : ""}.`
            : `Aucun relevé de code ingéré : ${e.artefact.motif ?? "artefact absent"}.`,
          dernier: e.snapshot ? new Date(e.snapshot.ingestedAt) : null,
        };
      }
      case "knowledge_engine": {
        const ake = await import("../knowledge-engine/service.js");
        const s = await ake.knowledgeStats();
        return {
          volume: s.noeuds,
          motif: `${s.noeuds} connaissance(s) dont ${s.confirmes} confirmée(s) ; ${s.sansProvenance} sans provenance vérifiée.`,
          dernier: null,
        };
      }
      case "engine_registry": {
        const reg = await import("../engine-registry/memory.js");
        const s = await reg.memorySummary();
        const total = s.reduce((n, e) => n + e.total, 0);
        return {
          volume: total,
          motif: `${s.length} moteur(s) ayant écrit une mémoire, ${total} entrée(s).`,
          dernier: null,
        };
      }
      case "resilience": {
        const res = await import("../resilience/service.js");
        const pipelines = await res.listPipelines(200);
        const echoues = pipelines.filter((p) => p.status !== "reussi").length;
        return {
          volume: pipelines.length,
          motif: `${pipelines.length} passage(s) de pipeline mémorisé(s), dont ${echoues} non réussi(s) : ce sont les leçons d'échec.`,
          dernier: null,
        };
      }
      default:
        return {
          volume: null,
          motif: `Mémoire détenue par ${c.detenteur} : lue à la demande, non recopiée ici.`,
          dernier: null,
        };
    }
  } catch (e) {
    return {
      volume: null,
      motif: `Détenteur ${c.detenteur} illisible : ${e instanceof Error ? e.message : "erreur inconnue"}. État « non mesuré », pas « vide ».`,
      dernier: null,
    };
  }
}

export async function lister(categorie: string, cycle?: Cycle, limit = 60) {
  const conditions = [eq(inMemoire.categorie, categorie)];
  if (cycle) conditions.push(eq(inMemoire.cycle, cycle));
  return db
    .select()
    .from(inMemoire)
    .where(and(...conditions))
    .orderBy(desc(inMemoire.updatedAt))
    .limit(limit);
}

/**
 * Archivage : l'historique d'un sujet passe en archive au-delà d'un seuil, la
 * mémoire active reste utilisable. Aucune suppression — une mémoire effacée ne
 * s'apprend pas deux fois.
 */
export async function archiver(joursHistorique = 120): Promise<{ archives: number }> {
  const r = await db
    .update(inMemoire)
    .set({ cycle: "archive", updatedAt: new Date() })
    .where(
      and(
        eq(inMemoire.cycle, "historique"),
        sql`${inMemoire.updatedAt} < now() - interval '1 day' * ${joursHistorique}`,
      ),
    )
    .returning({ id: inMemoire.id });
  return { archives: r.length };
}

/* ------------------------------------------------------------------ */
/* Point 139 — apprentissage après chaque action                       */
/* ------------------------------------------------------------------ */

/** Signature stable d'un problème : domaine + mots-clés triés. */
export function signature(domaine: string, probleme: string): string {
  const mots = motsCles(probleme, 6).sort().join("-");
  return `${domaine}:${mots}`.slice(0, 160);
}

export interface RetenirInput {
  domaine: string;
  probleme: string;
  diagnostic: string;
  solution: string;
  resultat: string;
  blocage?: string;
  missionId?: number | null;
  testRunId?: number | null;
  devRequestId?: number | null;
}

/**
 * Enregistre l'expérience d'une action terminée. Une même signature n'empile pas
 * les doublons : elle incrémente le compteur d'occurrences, ce qui fait
 * apparaître les problèmes récurrents au lieu de les diluer.
 */
export async function retenir(input: RetenirInput): Promise<{ id: number; recurrent: boolean }> {
  const sig = signature(input.domaine, input.probleme);
  const [existant] = await db
    .select({ id: inExperiences.id, occurrences: inExperiences.occurrences })
    .from(inExperiences)
    .where(eq(inExperiences.signature, sig))
    .limit(1);

  if (existant) {
    await db
      .update(inExperiences)
      .set({
        diagnostic: input.diagnostic.slice(0, 20000),
        solution: input.solution.slice(0, 20000),
        resultat: input.resultat.slice(0, 32),
        blocage: (input.blocage ?? "").slice(0, 20000),
        missionId: input.missionId ?? null,
        testRunId: input.testRunId ?? null,
        devRequestId: input.devRequestId ?? null,
        occurrences: existant.occurrences + 1,
        updatedAt: new Date(),
      })
      .where(eq(inExperiences.id, existant.id));
    return { id: existant.id, recurrent: true };
  }

  const [ligne] = await db
    .insert(inExperiences)
    .values({
      signature: sig,
      domaine: input.domaine,
      probleme: input.probleme.slice(0, 20000),
      diagnostic: input.diagnostic.slice(0, 20000),
      solution: input.solution.slice(0, 20000),
      resultat: input.resultat.slice(0, 32),
      blocage: (input.blocage ?? "").slice(0, 20000),
      missionId: input.missionId ?? null,
      testRunId: input.testRunId ?? null,
      devRequestId: input.devRequestId ?? null,
    })
    .returning({ id: inExperiences.id });
  return { id: ligne.id, recurrent: false };
}

/** Expériences dont la signature ou le texte recoupe le problème posé. */
export async function experiencesProches(probleme: string, limit = 5) {
  const mots = motsCles(probleme, 5);
  if (mots.length === 0) {
    return db.select().from(inExperiences).orderBy(desc(inExperiences.updatedAt)).limit(limit);
  }
  return db
    .select()
    .from(inExperiences)
    .where(
      or(
        ...mots.map((m) => ilike(inExperiences.signature, `%${m}%`)),
        ...mots.map((m) => ilike(inExperiences.probleme, `%${m}%`)),
      ),
    )
    .orderBy(desc(inExperiences.occurrences), desc(inExperiences.updatedAt))
    .limit(limit);
}

/**
 * Ce que la mémoire sait déjà d'un problème. Rendu tel quel dans la mission :
 * « rien de connu » est une réponse valable, une invention n'en est pas une.
 */
export async function dejaVu(
  domaine: string,
  probleme: string,
): Promise<{ connu: boolean; verdict: string; experiences: number }> {
  const proches = await experiencesProches(`${domaine} ${probleme}`, 5);
  if (proches.length === 0) {
    return {
      connu: false,
      verdict: "Aucune expérience comparable en mémoire : ce cas est traité pour la première fois.",
      experiences: 0,
    };
  }
  const lignes = proches.map(
    (x) =>
      `• ${x.domaine} (vu ${x.occurrences} fois, résultat ${x.resultat}) — ${x.solution.slice(0, 300) || x.diagnostic.slice(0, 300) || "solution non écrite"}`,
  );
  return {
    connu: true,
    verdict: [`${proches.length} expérience(s) comparable(s) :`, ...lignes].join("\n"),
    experiences: proches.length,
  };
}

export async function experiences(limit = 60) {
  return db
    .select()
    .from(inExperiences)
    .orderBy(desc(inExperiences.occurrences), desc(inExperiences.updatedAt))
    .limit(limit);
}
