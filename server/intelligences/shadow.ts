/**
 * Point 149 — mode shadow pour les futurs moteurs MKA.P-MS.
 *
 * Même mission, deux exécutions : le fournisseur en place répond au client, le
 * moteur candidat répond dans l'ombre. Le candidat n'est **jamais** exposé au
 * client tant que sa part est à zéro, et son résultat n'est utilisé que pour
 * mesurer l'écart.
 *
 * La montée en charge suit les paliers demandés — 10 %, 25 %, 50 %, 100 % — et
 * chaque palier exige des preuves : un nombre minimum de comparaisons, un
 * accord suffisant avec le fournisseur, et un taux d'échec du candidat qui
 * reste tenable. Sans ces preuves, la montée est refusée avec le motif. Le
 * fournisseur externe ne se détache donc pas sur une intuition.
 */
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import { CAPACITES, spec, type CodeCapacite } from "./capacites.js";
import { inActions, inShadow, inShadowRuns } from "./schema.js";

/** Paliers de bascule autorisés. Aucune valeur intermédiaire n'est acceptée. */
export const PALIERS = [0, 10, 25, 50, 100] as const;
export type Palier = (typeof PALIERS)[number];

/** Preuves exigées pour atteindre chaque palier. */
const EXIGENCE: Record<Palier, { comparaisons: number; accord: number; echecMax: number }> = {
  0: { comparaisons: 0, accord: 0, echecMax: 100 },
  10: { comparaisons: 20, accord: 70, echecMax: 20 },
  25: { comparaisons: 60, accord: 80, echecMax: 10 },
  50: { comparaisons: 150, accord: 85, echecMax: 5 },
  100: { comparaisons: 400, accord: 90, echecMax: 2 },
};

export interface Preuves {
  comparaisons: number;
  accordMoyen: number | null;
  echecCandidat: number | null;
  candidatMeilleur: number;
  candidatFaible: number;
  equivalent: number;
}

export interface EtatShadow {
  capacite: CodeCapacite;
  libelle: string;
  /** Moteur MKA.P-MS destiné à remplacer le fournisseur, tel qu'inscrit au registre. */
  remplacementMka: string;
  fournisseurPrincipal: string | null;
  candidat: string | null;
  actif: boolean;
  part: Palier;
  motif: string;
  preuves: Preuves;
  palierSuivant: Palier | null;
  /** Vrai quand les preuves suffisent réellement pour le palier suivant. */
  montePossible: boolean;
  verdict: string;
}

function palierValide(part: number): Palier | null {
  return (PALIERS as readonly number[]).includes(part) ? (part as Palier) : null;
}

function suivant(part: Palier): Palier | null {
  const i = PALIERS.indexOf(part);
  return i >= 0 && i < PALIERS.length - 1 ? PALIERS[i + 1] : null;
}

async function preuves(capacite: string): Promise<Preuves> {
  const [ligne] = await db
    .select({
      comparaisons: sql<number>`count(*)::int`,
      accord: sql<number | null>`avg(${inShadowRuns.similarite})`,
      echecs: sql<number>`sum(case when ${inShadowRuns.okCandidat} then 0 else 1 end)::int`,
      meilleur: sql<number>`sum(case when ${inShadowRuns.verdict} = 'candidat_meilleur' then 1 else 0 end)::int`,
      faible: sql<number>`sum(case when ${inShadowRuns.verdict} = 'candidat_faible' then 1 else 0 end)::int`,
      equivalent: sql<number>`sum(case when ${inShadowRuns.verdict} = 'equivalent' then 1 else 0 end)::int`,
    })
    .from(inShadowRuns)
    .where(eq(inShadowRuns.capacite, capacite));

  const total = ligne?.comparaisons ?? 0;
  return {
    comparaisons: total,
    accordMoyen: ligne?.accord === null || ligne?.accord === undefined ? null : Math.round(Number(ligne.accord)),
    echecCandidat: total === 0 ? null : Math.round(((ligne?.echecs ?? 0) / total) * 100),
    candidatMeilleur: ligne?.meilleur ?? 0,
    candidatFaible: ligne?.faible ?? 0,
    equivalent: ligne?.equivalent ?? 0,
  };
}

function evaluerMontee(
  cible: Palier,
  p: Preuves,
): { possible: boolean; motif: string } {
  const exigence = EXIGENCE[cible];
  const manques: string[] = [];
  if (p.comparaisons < exigence.comparaisons) {
    manques.push(
      `${p.comparaisons}/${exigence.comparaisons} comparaisons enregistrées`,
    );
  }
  if (p.accordMoyen === null) {
    manques.push("aucun accord mesuré");
  } else if (p.accordMoyen < exigence.accord) {
    manques.push(`accord ${p.accordMoyen} % au lieu de ${exigence.accord} % exigés`);
  }
  if (p.echecCandidat !== null && p.echecCandidat > exigence.echecMax) {
    manques.push(
      `${p.echecCandidat} % d'échecs du candidat au lieu de ${exigence.echecMax} % tolérés`,
    );
  }
  if (manques.length > 0) {
    return {
      possible: false,
      motif: `Palier ${cible} % refusé : ${manques.join(", ")}.`,
    };
  }
  return {
    possible: true,
    motif: `Palier ${cible} % démontré : ${p.comparaisons} comparaisons, ${p.accordMoyen} % d'accord, ${p.echecCandidat ?? 0} % d'échecs.`,
  };
}

export async function etat(): Promise<EtatShadow[]> {
  const lignes = await db.select().from(inShadow);
  const sortie: EtatShadow[] = [];

  for (const c of CAPACITES) {
    const config = lignes.find((l) => l.capacite === c.code);
    const p = await preuves(c.code);
    const part = palierValide(config?.part ?? 0) ?? 0;
    const cible = suivant(part);
    const montee = cible === null ? { possible: false, motif: "Palier maximal atteint." } : evaluerMontee(cible, p);

    sortie.push({
      capacite: c.code,
      libelle: c.libelle,
      remplacementMka: c.remplacementMka,
      fournisseurPrincipal: c.fournisseurPrincipal,
      candidat: config?.candidat ?? null,
      actif: config?.actif ?? false,
      part,
      motif: config?.motif ?? "",
      preuves: p,
      palierSuivant: cible,
      montePossible: montee.possible,
      verdict:
        config === undefined
          ? "Aucune observation en parallèle configurée : le fournisseur reste seul en charge."
          : !config.actif
            ? "Observation en parallèle arrêtée : aucune comparaison nouvelle n'est produite."
            : montee.motif,
    });
  }

  return sortie;
}

/**
 * Le propriétaire configure l'observation et la part. La part n'est acceptée
 * que si les preuves du palier existent : refuser ici est le seul moyen
 * d'empêcher un remplacement décidé sur une impression.
 */
export async function regler(input: {
  capacite: string;
  candidat?: string;
  actif?: boolean;
  part?: number;
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const connue = CAPACITES.find((c) => c.code === input.capacite);
  if (!connue) return { ok: false, detail: `Capacité inconnue « ${input.capacite} ».` };

  const [existant] = await db
    .select()
    .from(inShadow)
    .where(eq(inShadow.capacite, input.capacite))
    .limit(1);

  const candidat = (input.candidat ?? existant?.candidat ?? "modele_local").trim();
  if (!candidat) {
    return { ok: false, detail: "Aucun moteur candidat nommé : rien à observer." };
  }

  const partActuelle = palierValide(existant?.part ?? 0) ?? 0;
  let part = partActuelle;

  if (input.part !== undefined && input.part !== partActuelle) {
    const cible = palierValide(input.part);
    if (cible === null) {
      return {
        ok: false,
        detail: `Part ${input.part} % refusée : les paliers autorisés sont ${PALIERS.join(", ")} %.`,
      };
    }
    if (cible > partActuelle) {
      const p = await preuves(input.capacite);
      const montee = evaluerMontee(cible, p);
      if (!montee.possible) {
        await db.insert(inActions).values({
          commande: "shadow",
          argument: input.capacite,
          resultat: "refuse",
          detail: montee.motif,
          actorId: input.actorId ?? null,
        });
        return { ok: false, detail: montee.motif };
      }
    }
    part = cible;
  }

  const actif = input.actif ?? existant?.actif ?? true;

  if (existant) {
    await db
      .update(inShadow)
      .set({
        candidat,
        actif,
        part,
        motif: input.motif,
        actorId: input.actorId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(inShadow.id, existant.id));
  } else {
    await db.insert(inShadow).values({
      capacite: input.capacite,
      candidat,
      actif,
      part,
      motif: input.motif,
      actorId: input.actorId ?? null,
    });
  }

  await db.insert(inActions).values({
    commande: "shadow",
    argument: input.capacite,
    resultat: "execute",
    detail: `Candidat ${candidat}, observation ${actif ? "active" : "arrêtée"}, part ${partActuelle} % → ${part} %. Motif : ${
      input.motif || "non renseigné"
    }.`,
    actorId: input.actorId ?? null,
  });

  return {
    ok: true,
    detail: `Capacité « ${connue.libelle} » : candidat ${candidat}, part ${part} %, observation ${
      actif ? "active" : "arrêtée"
    }.`,
  };
}

export interface Configuration {
  candidat: string;
  actif: boolean;
  part: Palier;
}

/** Configuration réelle d'une capacité, ou null si rien n'est observé. */
export async function configuration(capacite: string): Promise<Configuration | null> {
  const [ligne] = await db
    .select()
    .from(inShadow)
    .where(eq(inShadow.capacite, capacite))
    .limit(1);
  if (!ligne) return null;
  return {
    candidat: ligne.candidat,
    actif: ligne.actif,
    part: palierValide(ligne.part) ?? 0,
  };
}

/**
 * Le candidat doit-il servir cette demande précise ? Tiré au sort selon la part
 * décidée. À 0 %, il ne sert jamais : le client ne voit que le fournisseur en
 * place.
 */
export function candidatSert(config: Configuration | null): boolean {
  if (!config || config.part <= 0) return false;
  return Math.random() * 100 < config.part;
}

/** Accord lexical entre deux réponses, 0 à 100. Ce n'est pas un jugement de qualité. */
export function accord(a: string, b: string): number {
  const mots = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((m) => m.length > 3),
    );
  const ma = mots(a);
  const mb = mots(b);
  if (ma.size === 0 || mb.size === 0) return 0;
  let communs = 0;
  for (const m of ma) if (mb.has(m)) communs += 1;
  return Math.round((communs / new Set([...ma, ...mb]).size) * 100);
}

export interface Comparaison {
  capacite: string;
  tache: string;
  fournisseur: string | null;
  candidat: string;
  okFournisseur: boolean;
  okCandidat: boolean;
  dureeFournisseurMs: number;
  dureeCandidatMs: number;
  similarite: number | null;
  verdict: string;
  motifCandidat: string;
}

/** Enregistre une comparaison. Le texte des réponses n'est pas conservé ici. */
export async function enregistrer(input: {
  capacite: string;
  tache: string;
  fournisseur: string | null;
  candidat: string;
  texteFournisseur: string;
  texteCandidat: string;
  okFournisseur: boolean;
  okCandidat: boolean;
  dureeFournisseurMs: number;
  dureeCandidatMs: number;
  motifCandidat: string;
}): Promise<Comparaison> {
  const similarite =
    input.okFournisseur && input.okCandidat
      ? accord(input.texteFournisseur, input.texteCandidat)
      : null;

  const verdict = !input.okCandidat
    ? "candidat_absent"
    : !input.okFournisseur
      ? "candidat_meilleur"
      : similarite !== null && similarite >= 60
        ? input.dureeCandidatMs < input.dureeFournisseurMs
          ? "candidat_meilleur"
          : "equivalent"
        : "candidat_faible";

  const comparaison: Comparaison = {
    capacite: input.capacite,
    tache: input.tache,
    fournisseur: input.fournisseur,
    candidat: input.candidat,
    okFournisseur: input.okFournisseur,
    okCandidat: input.okCandidat,
    dureeFournisseurMs: input.dureeFournisseurMs,
    dureeCandidatMs: input.dureeCandidatMs,
    similarite,
    verdict,
    motifCandidat: input.motifCandidat,
  };

  await db.insert(inShadowRuns).values({
    capacite: comparaison.capacite.slice(0, 32),
    tache: comparaison.tache.slice(0, 64),
    fournisseur: comparaison.fournisseur,
    candidat: comparaison.candidat.slice(0, 48),
    okFournisseur: comparaison.okFournisseur,
    okCandidat: comparaison.okCandidat,
    dureeFournisseurMs: Math.max(0, Math.round(comparaison.dureeFournisseurMs)),
    dureeCandidatMs: Math.max(0, Math.round(comparaison.dureeCandidatMs)),
    similarite: comparaison.similarite,
    verdict: comparaison.verdict,
    motifCandidat: comparaison.motifCandidat.slice(0, 2000),
  });

  return comparaison;
}

/** Comparaisons récentes, du plus récent au plus ancien. */
export async function comparaisons(limit = 60) {
  return db.select().from(inShadowRuns).orderBy(desc(inShadowRuns.id)).limit(limit);
}

/**
 * Un fournisseur externe peut-il être détaché d'une capacité ? Réponse fondée
 * sur les preuves, pas sur l'envie de couper la facture.
 */
export async function detachementPossible(capacite: string): Promise<{
  possible: boolean;
  motif: string;
}> {
  const c = CAPACITES.find((x) => x.code === capacite);
  if (!c) return { possible: false, motif: `Capacité inconnue « ${capacite} ».` };

  const config = await configuration(capacite);
  if (!config) {
    return {
      possible: false,
      motif: `Aucun moteur candidat observé pour « ${c.libelle} » : le remplacement interne (${c.remplacementMka}) n'a jamais été mesuré.`,
    };
  }
  if (config.part < 100) {
    return {
      possible: false,
      motif: `« ${c.libelle} » n'est servie qu'à ${config.part} % par ${config.candidat} : le fournisseur externe reste nécessaire.`,
    };
  }
  const p = await preuves(capacite);
  const montee = evaluerMontee(100, p);
  return montee.possible
    ? {
        possible: true,
        motif: `${config.candidat} sert 100 % de « ${c.libelle} » avec ${p.comparaisons} comparaisons et ${p.accordMoyen} % d'accord : le fournisseur externe peut être détaché.`,
      }
    : { possible: false, motif: montee.motif };
}

/** Récapitulatif utilisé par l'écran de direction. */
export async function resume(): Promise<{
  observees: number;
  servies: number;
  comparaisons: number;
  candidatsPrets: string[];
}> {
  const lignes = await etat();
  const total = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(inShadowRuns)
    .where(and(gte(inShadowRuns.createdAt, new Date(Date.now() - 30 * 86400 * 1000)), isNotNull(inShadowRuns.capacite)));

  return {
    observees: lignes.filter((l) => l.actif).length,
    servies: lignes.filter((l) => l.part > 0).length,
    comparaisons: total[0]?.n ?? 0,
    candidatsPrets: lignes
      .filter((l) => l.montePossible && l.palierSuivant !== null)
      .map((l) => `${spec(l.capacite).libelle} → ${l.candidat ?? "candidat non nommé"} (${l.palierSuivant} %)`),
  };
}
