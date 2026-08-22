/**
 * Point 150 — plan de détachement des fournisseurs, sur 12 mois.
 *
 * L'objectif du propriétaire est clair : dans cinq mois, débrancher les
 * fournisseurs externes et fonctionner avec le moteur MKA.P-MS. Ce fichier ne
 * se contente pas d'afficher un calendrier : chaque étape porte une
 * **précondition vérifiée dans les données réelles** (exemples mesurés,
 * comparaisons shadow, modèle auto-hébergé joignable). Une étape sans preuve
 * est « non atteinte » avec le motif, jamais « en bonne voie ».
 *
 * Il ne crée aucun moteur : il lit l'évaluation, le mode shadow, la Fabrique
 * Intelligence et le catalogue des fonctionnalités déjà en place.
 */
import { count, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { providerStates } from "../ai-fabric/service.js";
import { FONCTIONS } from "./fonctions.js";
import { CAPACITES } from "./capacites.js";
import { etat as etatShadow } from "./shadow.js";
import { inAppels, inPlanAutonomie } from "./schema.js";

export type StatutEtape = "attente" | "en_cours" | "atteinte" | "abandonnee";

export interface Etape {
  code: string;
  mois: number;
  titre: string;
  /** Ce qui doit être vrai pour que l'étape compte comme atteinte. */
  condition: string;
  /** Mesure réelle du moment. */
  constat: string;
  /** Vrai seulement quand la condition est vérifiée dans les données. */
  conditionRemplie: boolean;
  statut: StatutEtape;
  /** Décision écrite du propriétaire, quand il y en a une. */
  motif: string;
}

export interface PlanAutonomie {
  /** Objectif fixé par le propriétaire, en mois. */
  cibleMois: number;
  etapes: Etape[];
  /** Exemples réellement mesurés, matière première de l'apprentissage. */
  exemples: number;
  exemplesNotes: number;
  comparaisons: number;
  /** Capacités qui dépendent encore d'un fournisseur externe. */
  dependances: { capacite: string; fournisseur: string | null }[];
  /** Verdict honnête sur la cible du propriétaire. */
  verdict: string;
  /** Ce qui bloque réellement, nommé. */
  obstacles: string[];
}

/** Étapes du plan. Le mois est indicatif ; la condition, elle, est vérifiée. */
const ETAPES: { code: string; mois: number; titre: string; condition: string }[] = [
  {
    code: "mesure",
    mois: 1,
    titre: "Tout appel est mesuré",
    condition: "Au moins 200 appels enregistrés avec durée, succès et fournisseur.",
  },
  {
    code: "exemples",
    mois: 2,
    titre: "Jeu d'exemples constitué",
    condition: "Au moins 1 000 appels réussis, dont 50 jugés par un humain.",
  },
  {
    code: "modele_joignable",
    mois: 3,
    titre: "Modèle MKA.P-MS joignable",
    condition: "Le modèle auto-hébergé répond (LOCAL_LLM_URL configurée et vue en service).",
  },
  {
    code: "shadow_ouvert",
    mois: 4,
    titre: "Observation en parallèle lancée",
    condition: "Au moins une capacité observée en mode shadow avec des comparaisons réelles.",
  },
  {
    code: "preuves",
    mois: 5,
    titre: "Preuves suffisantes sur une capacité",
    condition: "Une capacité atteint 30 comparaisons sans que le candidat soit plus faible.",
  },
  {
    code: "palier_10",
    mois: 6,
    titre: "Premier palier de trafic réel",
    condition: "Une capacité servie à 10 % par le moteur MKA.P-MS.",
  },
  {
    code: "palier_50",
    mois: 8,
    titre: "Moitié du trafic sur le moteur interne",
    condition: "Une capacité servie à 50 % au moins.",
  },
  {
    code: "capacites_sensibles",
    mois: 9,
    titre: "Données personnelles traitées en interne",
    condition: "Les capacités documents et transcription ne sortent plus vers un fournisseur externe.",
  },
  {
    code: "palier_100",
    mois: 10,
    titre: "Capacité entièrement interne",
    condition: "Une capacité servie à 100 % par le moteur MKA.P-MS.",
  },
  {
    code: "detachement",
    mois: 12,
    titre: "Fournisseur externe détachable",
    condition:
      "Toutes les capacités exigeant un fournisseur sont servies à 100 % en interne ou disposent d'un repli assumé.",
  },
];

export async function plan(cibleMois = 5): Promise<PlanAutonomie> {
  const depuis = new Date(Date.now() - 365 * 24 * 3600 * 1000);

  const [[mesures], [notes], fournisseurs, shadow, decisions] = await Promise.all([
    db
      .select({
        total: count(),
        reussis: sql<number>`coalesce(sum(case when ${inAppels.ok} then 1 else 0 end), 0)::int`,
      })
      .from(inAppels)
      .where(gte(inAppels.createdAt, depuis)),
    db
      .select({ total: count() })
      .from(inAppels)
      .where(sql`${inAppels.note} is not null`),
    providerStates(),
    etatShadow(),
    db.select().from(inPlanAutonomie),
  ]);

  const parEtape = new Map(decisions.map((d) => [d.etape, d]));

  const exemples = Number(mesures?.total ?? 0);
  const exemplesReussis = Number(mesures?.reussis ?? 0);
  const exemplesNotes = Number(notes?.total ?? 0);
  const comparaisons = shadow.reduce((t, s) => t + s.preuves.comparaisons, 0);

  const local = fournisseurs.find((f) => f.code === "modele_local");
  const localJoignable = local !== undefined && (local.status === "actif" || local.status === "configure");

  const observees = shadow.filter((s) => s.actif).length;
  const partMax = shadow.reduce((m, s) => Math.max(m, s.part), 0);
  const capacitePreuve = shadow.find(
    (s) => s.preuves.comparaisons >= 30 && s.preuves.candidatFaible === 0,
  );

  const capacitesSensibles = ["documents", "transcription"];
  const sensiblesInternes = capacitesSensibles.every((code) => {
    const s = shadow.find((x) => x.capacite === code);
    return s !== undefined && s.part >= 100;
  });

  const exigeantes = CAPACITES.filter((c) => c.exigeFournisseur);
  const toutesInternes = exigeantes.every((c) => {
    const s = shadow.find((x) => x.capacite === c.code);
    return s !== undefined && s.part >= 100;
  });

  const conditions: Record<string, { remplie: boolean; constat: string }> = {
    mesure: {
      remplie: exemples >= 200,
      constat: `${exemples} appels mesurés.`,
    },
    exemples: {
      remplie: exemplesReussis >= 1000 && exemplesNotes >= 50,
      constat: `${exemplesReussis} appels réussis, ${exemplesNotes} jugés par un humain.`,
    },
    modele_joignable: {
      remplie: localJoignable,
      constat: local
        ? `${local.label} — ${local.statusReason}`
        : "Modèle auto-hébergé absent du catalogue des fournisseurs.",
    },
    shadow_ouvert: {
      remplie: observees > 0 && comparaisons > 0,
      constat: `${observees} capacité(s) observée(s), ${comparaisons} comparaison(s) enregistrée(s).`,
    },
    preuves: {
      remplie: capacitePreuve !== undefined,
      constat: capacitePreuve
        ? `${capacitePreuve.libelle} : ${capacitePreuve.preuves.comparaisons} comparaisons, aucun échec du candidat.`
        : "Aucune capacité n'atteint 30 comparaisons favorables.",
    },
    palier_10: {
      remplie: partMax >= 10,
      constat: `Part maximale réellement servie par le moteur interne : ${partMax} %.`,
    },
    palier_50: {
      remplie: partMax >= 50,
      constat: `Part maximale réellement servie par le moteur interne : ${partMax} %.`,
    },
    capacites_sensibles: {
      remplie: sensiblesInternes,
      constat: sensiblesInternes
        ? "Documents et transcription traités en interne."
        : "Documents et/ou transcription passent encore par un fournisseur externe.",
    },
    palier_100: {
      remplie: partMax >= 100,
      constat: `Part maximale réellement servie par le moteur interne : ${partMax} %.`,
    },
    detachement: {
      remplie: toutesInternes,
      constat: toutesInternes
        ? "Toutes les capacités exigeant un fournisseur sont servies en interne."
        : `${exigeantes.length} capacité(s) dépendent encore d'un fournisseur externe.`,
    },
  };

  const etapes: Etape[] = ETAPES.map((e) => {
    const c = conditions[e.code] ?? { remplie: false, constat: "Condition non mesurée." };
    const decision = parEtape.get(e.code);
    const statut: StatutEtape = decision
      ? (decision.statut as StatutEtape)
      : c.remplie
        ? "atteinte"
        : "attente";
    return {
      code: e.code,
      mois: e.mois,
      titre: e.titre,
      condition: e.condition,
      constat: c.constat,
      conditionRemplie: c.remplie,
      statut,
      motif: decision?.motif ?? "",
    };
  });

  const obstacles = etapes
    .filter((e) => !e.conditionRemplie)
    .map((e) => `Mois ${e.mois} — ${e.titre} : ${e.constat}`);

  const atteintes = etapes.filter((e) => e.conditionRemplie).length;
  const attenduesACible = etapes.filter((e) => e.mois <= cibleMois).length;
  const verdict = toutesInternes
    ? "Détachement possible : toutes les capacités exigeant un fournisseur sont servies en interne."
    : localJoignable
      ? `${atteintes} étape(s) sur ${etapes.length} réellement atteintes. Le modèle interne répond, mais le détachement reste conditionné aux preuves de comparaison.`
      : `Cible de ${cibleMois} mois non tenable en l'état : ${atteintes} étape(s) atteintes sur ${attenduesACible} attendues à cette échéance, et aucun modèle auto-hébergé ne répond aujourd'hui. Le détachement exige d'abord une infrastructure d'hébergement du modèle — c'est le vrai préalable, pas le code.`;

  const dependances = CAPACITES.filter((c) => c.exigeFournisseur).map((c) => ({
    capacite: c.libelle,
    fournisseur: c.fournisseurPrincipal,
  }));

  return {
    cibleMois,
    etapes,
    exemples,
    exemplesNotes,
    comparaisons,
    dependances,
    verdict,
    obstacles,
  };
}

/** Décision du propriétaire sur une étape : elle prime sur le calcul. */
export async function marquer(input: {
  etape: string;
  statut: StatutEtape;
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const spec = ETAPES.find((e) => e.code === input.etape);
  if (!spec) return { ok: false, detail: `Étape inconnue : ${input.etape}.` };

  const motif = input.motif.trim();
  if (input.statut === "atteinte") {
    const p = await plan();
    const e = p.etapes.find((x) => x.code === input.etape);
    if (e && !e.conditionRemplie && motif.length < 10) {
      return {
        ok: false,
        detail: `Condition non vérifiée (${e.constat}). Pour la déclarer atteinte malgré tout, écrivez la raison : elle restera au journal.`,
      };
    }
  }

  const [existante] = await db
    .select()
    .from(inPlanAutonomie)
    .where(eq(inPlanAutonomie.etape, input.etape))
    .limit(1);

  if (existante) {
    await db
      .update(inPlanAutonomie)
      .set({ statut: input.statut, motif, actorId: input.actorId ?? null, updatedAt: new Date() })
      .where(eq(inPlanAutonomie.id, existante.id));
  } else {
    await db.insert(inPlanAutonomie).values({
      etape: input.etape,
      statut: input.statut,
      motif,
      actorId: input.actorId ?? null,
    });
  }

  return { ok: true, detail: `${spec.titre} — ${input.statut}.` };
}

/** Fonctionnalités qui servent directement l'indépendance, pour l'écran. */
export function levierAutonomie(): { fonction: string; apport: string }[] {
  return FONCTIONS.map((f) => ({ fonction: f.libelle, apport: f.autonomie }));
}
