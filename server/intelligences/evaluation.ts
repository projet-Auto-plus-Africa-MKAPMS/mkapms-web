/**
 * Point 148 — évaluation permanente des moteurs et des fournisseurs.
 *
 * Le but n'est pas de produire un classement flatteur : c'est de savoir, sur
 * preuve, **quand un moteur interne MKA.P-MS peut remplacer un fournisseur
 * externe**. Chaque critère demandé (qualité, précision, vitesse, coût,
 * disponibilité, stabilité, code, automobile, image, voix, recherche,
 * traduction) est donc rendu avec :
 *
 *   - une valeur mesurée, ou `null` ;
 *   - l'unité ;
 *   - le nombre d'observations qui la fondent ;
 *   - un constat lisible.
 *
 * Règle tenue : un critère sans observation est **non mesuré**, jamais bon. La
 * qualité et la précision ne sont pas déduites de la vitesse : la qualité vient
 * d'une note humaine, la précision du taux d'accord des comparaisons shadow.
 * Aucun moteur n'est déclaré supérieur sans preuve.
 */
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import { CAPACITES, type CodeCapacite } from "./capacites.js";
import { inAppels, inShadowRuns } from "./schema.js";

/** Les douze critères de la liste, dans l'ordre demandé. */
export const CRITERES = [
  "qualite",
  "precision",
  "vitesse",
  "cout",
  "disponibilite",
  "stabilite",
  "code",
  "automobile",
  "image",
  "voix",
  "recherche",
  "traduction",
] as const;
export type Critere = (typeof CRITERES)[number];

export const LIBELLE_CRITERE: Record<Critere, string> = {
  qualite: "Qualité",
  precision: "Précision",
  vitesse: "Vitesse",
  cout: "Coût",
  disponibilite: "Disponibilité",
  stabilite: "Stabilité",
  code: "Code",
  automobile: "Automobile",
  image: "Image",
  voix: "Voix",
  recherche: "Recherche",
  traduction: "Traduction",
};

/** Capacités qui portent les six critères métier de la liste. */
const CAPACITES_PAR_CRITERE: Partial<Record<Critere, CodeCapacite[]>> = {
  code: ["code"],
  automobile: ["raisonnement", "recherche"],
  image: ["image", "vision"],
  voix: ["voix", "audio", "transcription", "diarisation", "temps_reel"],
  recherche: ["recherche"],
  traduction: ["traduction"],
};

export interface Mesure {
  critere: Critere;
  libelle: string;
  valeur: number | null;
  unite: string;
  observations: number;
  mesure: boolean;
  constat: string;
}

export interface Enregistrement {
  capacite: string;
  tache: string;
  moteur: string;
  fournisseur: string | null;
  rang: "principal" | "repli" | "candidat";
  ok: boolean;
  dureeMs: number;
  jetonsEntree: number;
  jetonsSortie: number;
  coutCents?: number;
  coutMesure?: boolean;
  motif: string;
}

/**
 * Enregistre un appel réellement passé. Appelé par la couche fournisseur : sans
 * cette trace, aucune évaluation ne serait possible et « ce fournisseur est
 * lent » resterait une impression.
 */
export async function enregistrer(e: Enregistrement): Promise<void> {
  await db.insert(inAppels).values({
    capacite: e.capacite.slice(0, 32),
    tache: e.tache.slice(0, 64),
    moteur: e.moteur.slice(0, 64),
    fournisseur: e.fournisseur,
    rang: e.rang,
    ok: e.ok,
    dureeMs: Math.max(0, Math.round(e.dureeMs)),
    jetonsEntree: e.jetonsEntree,
    jetonsSortie: e.jetonsSortie,
    coutCents: e.coutCents ?? 0,
    coutMesure: e.coutMesure ?? false,
    motif: e.motif.slice(0, 2000),
  });
}

/** Note humaine d'un appel : c'est la seule source de la qualité affichée. */
export async function noter(input: {
  appelId: number;
  note: number;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  if (input.note < 1 || input.note > 5) {
    return { ok: false, detail: "La note attendue est comprise entre 1 et 5." };
  }
  const [ligne] = await db.select().from(inAppels).where(eq(inAppels.id, input.appelId)).limit(1);
  if (!ligne) return { ok: false, detail: "Appel inconnu." };

  await db
    .update(inAppels)
    .set({ note: Math.round(input.note), noteActorId: input.actorId ?? null })
    .where(eq(inAppels.id, input.appelId));

  return {
    ok: true,
    detail: `Appel #${input.appelId} noté ${Math.round(input.note)}/5 : la qualité du fournisseur ${
      ligne.fournisseur ?? "inconnu"
    } s'appuie désormais sur une observation de plus.`,
  };
}

interface LigneAppel {
  capacite: string;
  fournisseur: string | null;
  rang: string;
  ok: boolean;
  dureeMs: number;
  coutCents: number;
  coutMesure: boolean;
  note: number | null;
}

async function appels(jours: number): Promise<LigneAppel[]> {
  const depuis = new Date(Date.now() - jours * 86400 * 1000);
  const lignes = await db
    .select({
      capacite: inAppels.capacite,
      fournisseur: inAppels.fournisseur,
      rang: inAppels.rang,
      ok: inAppels.ok,
      dureeMs: inAppels.dureeMs,
      coutCents: inAppels.coutCents,
      coutMesure: inAppels.coutMesure,
      note: inAppels.note,
    })
    .from(inAppels)
    .where(gte(inAppels.createdAt, depuis))
    .limit(20000);
  return lignes;
}

function moyenne(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  return valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
}

function ecartType(valeurs: number[]): number | null {
  const m = moyenne(valeurs);
  if (m === null || valeurs.length < 2) return null;
  const variance =
    valeurs.reduce((s, v) => s + (v - m) * (v - m), 0) / (valeurs.length - 1);
  return Math.sqrt(variance);
}

function nonMesure(critere: Critere, motif: string): Mesure {
  return {
    critere,
    libelle: LIBELLE_CRITERE[critere],
    valeur: null,
    unite: "",
    observations: 0,
    mesure: false,
    constat: motif,
  };
}

function mesuresMetier(lignes: LigneAppel[]): Mesure[] {
  const sorties: Mesure[] = [];
  for (const critere of CRITERES) {
    const capacites = CAPACITES_PAR_CRITERE[critere];
    if (!capacites) continue;
    const concernes = lignes.filter((l) => capacites.includes(l.capacite as CodeCapacite));
    if (concernes.length === 0) {
      const noms = CAPACITES.filter((c) => capacites.includes(c.code))
        .map((c) => c.libelle)
        .join(", ");
      sorties.push(
        nonMesure(
          critere,
          `Aucun appel observé sur ${noms} : le critère reste non mesuré, il n'est ni bon ni mauvais.`,
        ),
      );
      continue;
    }
    const reussis = concernes.filter((l) => l.ok).length;
    sorties.push({
      critere,
      libelle: LIBELLE_CRITERE[critere],
      valeur: Math.round((reussis / concernes.length) * 100),
      unite: "% d'appels aboutis",
      observations: concernes.length,
      mesure: true,
      constat: `${reussis}/${concernes.length} appels aboutis sur ce domaine.`,
    });
  }
  return sorties;
}

export interface EvaluationFournisseur {
  fournisseur: string;
  appels: number;
  mesures: Mesure[];
}

export interface Evaluation {
  jours: number;
  appelsObserves: number;
  fournisseurs: EvaluationFournisseur[];
  /** Vue d'ensemble, tous fournisseurs confondus. */
  global: Mesure[];
  /** Ce qui manque pour conclure — nommé, jamais masqué. */
  manques: string[];
}

function mesuresPour(lignes: LigneAppel[], accords: number[] | null): Mesure[] {
  const notes = lignes.map((l) => l.note).filter((n): n is number => n !== null);
  const durees = lignes.filter((l) => l.ok).map((l) => l.dureeMs);
  const couts = lignes.filter((l) => l.coutMesure).map((l) => l.coutCents);
  const reussis = lignes.filter((l) => l.ok).length;

  const qualite: Mesure =
    notes.length > 0
      ? {
          critere: "qualite",
          libelle: LIBELLE_CRITERE.qualite,
          valeur: Number((moyenne(notes) ?? 0).toFixed(2)),
          unite: "note /5",
          observations: notes.length,
          mesure: true,
          constat: `Moyenne des notes données par la direction sur ${notes.length} réponses.`,
        }
      : nonMesure(
          "qualite",
          "Aucune réponse notée : la qualité n'est pas déduite de la vitesse ni du volume.",
        );

  const precision: Mesure =
    accords && accords.length > 0
      ? {
          critere: "precision",
          libelle: LIBELLE_CRITERE.precision,
          valeur: Math.round(moyenne(accords) ?? 0),
          unite: "% d'accord avec l'autre exécution",
          observations: accords.length,
          mesure: true,
          constat: `Accord moyen mesuré sur ${accords.length} comparaisons en mode shadow.`,
        }
      : nonMesure(
          "precision",
          "Aucune comparaison shadow enregistrée : la précision ne peut pas être établie sans seconde exécution de la même mission.",
        );

  const vitesse: Mesure =
    durees.length > 0
      ? {
          critere: "vitesse",
          libelle: LIBELLE_CRITERE.vitesse,
          valeur: Math.round(moyenne(durees) ?? 0),
          unite: "ms par appel abouti",
          observations: durees.length,
          mesure: true,
          constat: `Durée moyenne sur ${durees.length} appels aboutis.`,
        }
      : nonMesure("vitesse", "Aucun appel abouti : aucune durée à comparer.");

  const cout: Mesure =
    couts.length > 0
      ? {
          critere: "cout",
          libelle: LIBELLE_CRITERE.cout,
          valeur: Number(((moyenne(couts) ?? 0) / 100).toFixed(4)),
          unite: "€ par appel (tarif renseigné)",
          observations: couts.length,
          mesure: true,
          constat: `Coût moyen sur ${couts.length} appels au tarif réellement renseigné.`,
        }
      : nonMesure(
          "cout",
          "Tarif du fournisseur non renseigné : la consommation est comptée en jetons, mais aucun euro ne peut être affiché sans inventer un prix.",
        );

  const disponibilite: Mesure =
    lignes.length > 0
      ? {
          critere: "disponibilite",
          libelle: LIBELLE_CRITERE.disponibilite,
          valeur: Math.round((reussis / lignes.length) * 100),
          unite: "% d'appels aboutis",
          observations: lignes.length,
          mesure: true,
          constat: `${reussis} appels aboutis sur ${lignes.length}.`,
        }
      : nonMesure("disponibilite", "Aucun appel observé sur la période.");

  const dispersion = ecartType(durees);
  const stabilite: Mesure =
    dispersion !== null
      ? {
          critere: "stabilite",
          libelle: LIBELLE_CRITERE.stabilite,
          valeur: Math.round(dispersion),
          unite: "ms d'écart-type",
          observations: durees.length,
          mesure: true,
          constat:
            dispersion > (moyenne(durees) ?? 0)
              ? "Durées très irrégulières : le fournisseur répond, mais son délai n'est pas prévisible."
              : "Durées régulières sur la période observée.",
        }
      : nonMesure(
          "stabilite",
          "Moins de deux appels aboutis : la régularité ne peut pas être calculée.",
        );

  return [
    qualite,
    precision,
    vitesse,
    cout,
    disponibilite,
    stabilite,
    ...mesuresMetier(lignes),
  ];
}

export async function evaluation(jours = 30): Promise<Evaluation> {
  const lignes = await appels(jours);
  const depuis = new Date(Date.now() - jours * 86400 * 1000);
  const comparaisons = await db
    .select({
      capacite: inShadowRuns.capacite,
      candidat: inShadowRuns.candidat,
      fournisseur: inShadowRuns.fournisseur,
      similarite: inShadowRuns.similarite,
    })
    .from(inShadowRuns)
    .where(and(gte(inShadowRuns.createdAt, depuis), isNotNull(inShadowRuns.similarite)))
    .limit(5000);

  const accordsParFournisseur = new Map<string, number[]>();
  for (const c of comparaisons) {
    if (c.similarite === null) continue;
    for (const cle of [c.fournisseur, c.candidat]) {
      if (!cle) continue;
      const liste = accordsParFournisseur.get(cle) ?? [];
      liste.push(c.similarite);
      accordsParFournisseur.set(cle, liste);
    }
  }

  const codes = [...new Set(lignes.map((l) => l.fournisseur).filter((f): f is string => !!f))];
  const fournisseurs: EvaluationFournisseur[] = codes
    .map((code) => {
      const propres = lignes.filter((l) => l.fournisseur === code);
      return {
        fournisseur: code,
        appels: propres.length,
        mesures: mesuresPour(propres, accordsParFournisseur.get(code) ?? null),
      };
    })
    .sort((a, b) => b.appels - a.appels);

  const tousAccords = comparaisons
    .map((c) => c.similarite)
    .filter((s): s is number => s !== null);

  const manques: string[] = [];
  if (lignes.length === 0) {
    manques.push(
      "Aucun appel enregistré sur la période : aucune comparaison de fournisseurs n'est possible.",
    );
  }
  if (lignes.every((l) => l.note === null)) {
    manques.push(
      "Aucune réponse notée : la qualité ne pourra pas être comparée tant que la direction n'aura pas noté des réponses.",
    );
  }
  if (tousAccords.length === 0) {
    manques.push(
      "Aucune comparaison shadow : la précision et le remplacement interne restent non démontrés.",
    );
  }
  if (lignes.every((l) => !l.coutMesure)) {
    manques.push(
      "Aucun tarif fournisseur renseigné : le coût réel en euros reste inconnu, seuls les jetons sont comptés.",
    );
  }

  return {
    jours,
    appelsObserves: lignes.length,
    fournisseurs,
    global: mesuresPour(lignes, tousAccords),
    manques,
  };
}

/** Derniers appels, pour permettre au PDG de noter une réponse précise. */
export async function derniers(limit = 40) {
  return db
    .select({
      id: inAppels.id,
      capacite: inAppels.capacite,
      tache: inAppels.tache,
      moteur: inAppels.moteur,
      fournisseur: inAppels.fournisseur,
      rang: inAppels.rang,
      ok: inAppels.ok,
      dureeMs: inAppels.dureeMs,
      motif: inAppels.motif,
      note: inAppels.note,
      createdAt: inAppels.createdAt,
    })
    .from(inAppels)
    .orderBy(desc(inAppels.id))
    .limit(limit);
}

/**
 * Comptage brut par fournisseur, utilisé par l'abstraction fournisseurs
 * (point 147) pour afficher l'état réellement constaté sans recalculer
 * l'évaluation complète.
 */
export async function usageParFournisseur(jours = 30): Promise<
  Record<string, { appels: number; echecs: number; dureeMoyenneMs: number | null }>
> {
  const depuis = new Date(Date.now() - jours * 86400 * 1000);
  const lignes = await db
    .select({
      fournisseur: inAppels.fournisseur,
      appels: sql<number>`count(*)::int`,
      echecs: sql<number>`sum(case when ${inAppels.ok} then 0 else 1 end)::int`,
      duree: sql<number | null>`avg(case when ${inAppels.ok} then ${inAppels.dureeMs} end)`,
    })
    .from(inAppels)
    .where(gte(inAppels.createdAt, depuis))
    .groupBy(inAppels.fournisseur);

  const sortie: Record<string, { appels: number; echecs: number; dureeMoyenneMs: number | null }> =
    {};
  for (const l of lignes) {
    if (!l.fournisseur) continue;
    sortie[l.fournisseur] = {
      appels: l.appels,
      echecs: l.echecs,
      dureeMoyenneMs: l.duree === null ? null : Math.round(Number(l.duree)),
    };
  }
  return sortie;
}
