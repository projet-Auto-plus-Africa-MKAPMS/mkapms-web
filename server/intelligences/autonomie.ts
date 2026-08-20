/**
 * Point 132 — niveaux d'autonomie.
 *
 * Les capacités sont construites au maximum (point 125), mais **ce qui peut
 * réellement s'exécuter** est un curseur que le propriétaire monte ou descend.
 * Deux verrous indépendants, jamais un seul :
 *
 *   - la **permission du rôle** : ce qu'une personne a le droit de demander ;
 *   - le **niveau d'autonomie du domaine** : ce que la plateforme s'autorise à
 *     faire elle-même, même quand la personne en a le droit.
 *
 * Le niveau par défaut est 2 (proposition) : au premier démarrage, MKA.P-MS
 * Intelligences observe et propose, elle n'écrit rien et ne déploie rien. Un
 * niveau élevé n'est jamais deviné : il est posé par une décision tracée.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { inAutonomie, inAutonomieJournal } from "./schema.js";
import type { Permission } from "./capacites.js";

export const NIVEAUX_AUTONOMIE = [
  { niveau: 1, code: "observation", libelle: "Observation" },
  { niveau: 2, code: "proposition", libelle: "Proposition" },
  { niveau: 3, code: "modification", libelle: "Modification" },
  { niveau: 4, code: "tests", libelle: "Tests automatiques" },
  { niveau: 5, code: "deploiement", libelle: "Déploiement contrôlé" },
  { niveau: 6, code: "operationnelle", libelle: "Autonomie opérationnelle" },
  { niveau: 7, code: "infrastructure", libelle: "Administration infrastructure" },
] as const;

export type NiveauAutonomie = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Ce qu'un niveau autorise, écrit pour être lu par le propriétaire. */
export const PORTEE_NIVEAU: Record<NiveauAutonomie, string> = {
  1: "Lire et rapporter. Aucune proposition rédigée, aucune écriture.",
  2: "Analyser et proposer. Le correctif est rédigé mais rien n'est appliqué.",
  3: "Modifier hors production : dossier de développement et travail en bac à sable.",
  4: "Lancer seule les contrôles et la non-régression, sans déployer.",
  5: "Déployer après passage complet du pipeline et confirmation des actions critiques.",
  6: "Enchaîner des opérations courantes autorisées et surveiller leur résultat.",
  7: "Agir sur l'infrastructure (services, variables, bases). Réservé au propriétaire.",
};

/**
 * Niveau minimal exigé par chaque permission technique. C'est la table de
 * conversion entre « ce que la capacité demande » et « ce que le curseur
 * autorise » : sans elle, une permission de rôle suffirait à tout déclencher.
 */
export const NIVEAU_PAR_PERMISSION: Record<Permission, NiveauAutonomie> = {
  READ: 1,
  ANALYZE: 1,
  PROPOSE: 2,
  WRITE: 3,
  TEST: 4,
  DEPLOY: 5,
  FINANCIAL: 6,
  ADMINISTRATION: 6,
  INFRASTRUCTURE: 7,
};

/**
 * Domaines réglables séparément : le propriétaire peut laisser l'observation
 * partout et n'ouvrir l'écriture que là où il le veut. `global` sert de
 * plafond : aucun domaine ne dépasse le niveau global.
 */
export const DOMAINES_AUTONOMIE = [
  { code: "global", libelle: "Plafond général" },
  { code: "code", libelle: "Code et correctifs" },
  { code: "contenu", libelle: "Contenus, textes et traductions" },
  { code: "seo", libelle: "Référencement et indexation" },
  { code: "paiement", libelle: "Paiement et facturation" },
  { code: "support", libelle: "Support et messagerie" },
  { code: "moteurs", libelle: "Moteurs et registre" },
  { code: "infrastructure", libelle: "Infrastructure et déploiement" },
] as const;

export type DomaineAutonomie = (typeof DOMAINES_AUTONOMIE)[number]["code"];

/** Niveau par défaut : proposer, jamais exécuter. */
const DEFAUT: NiveauAutonomie = 2;

/** Domaines dont le défaut est plus bas que la règle générale, par prudence. */
const DEFAUT_PAR_DOMAINE: Partial<Record<DomaineAutonomie, NiveauAutonomie>> = {
  paiement: 1,
  infrastructure: 1,
};

function borner(n: number): NiveauAutonomie {
  if (n < 1) return 1;
  if (n > 7) return 7;
  return n as NiveauAutonomie;
}

export interface EtatAutonomie {
  domaine: string;
  libelle: string;
  niveau: NiveauAutonomie;
  /** Niveau réellement applicable après le plafond global. */
  effectif: NiveauAutonomie;
  code: string;
  portee: string;
  motif: string;
  defini: boolean;
  updatedAt: Date | null;
}

export async function etat(): Promise<EtatAutonomie[]> {
  const rows = await db.select().from(inAutonomie);
  const parDomaine = new Map(rows.map((r) => [r.domaine, r]));

  const lire = (code: string): NiveauAutonomie => {
    const r = parDomaine.get(code);
    if (r) return borner(r.niveau);
    return DEFAUT_PAR_DOMAINE[code as DomaineAutonomie] ?? DEFAUT;
  };

  const global = lire("global");

  return DOMAINES_AUTONOMIE.map((d) => {
    const niveau = lire(d.code);
    const effectif = d.code === "global" ? niveau : borner(Math.min(niveau, global));
    const spec = NIVEAUX_AUTONOMIE.find((n) => n.niveau === effectif)!;
    const r = parDomaine.get(d.code);
    return {
      domaine: d.code,
      libelle: d.libelle,
      niveau,
      effectif,
      code: spec.code,
      portee: PORTEE_NIVEAU[effectif],
      motif: r?.motif ?? "Niveau par défaut : aucune décision enregistrée.",
      defini: r !== undefined,
      updatedAt: r?.updatedAt ?? null,
    };
  });
}

/** Niveau applicable à un domaine, plafond global compris. */
export async function niveau(domaine: string): Promise<NiveauAutonomie> {
  const e = await etat();
  const trouve = e.find((x) => x.domaine === domaine);
  if (trouve) return trouve.effectif;
  // Domaine non déclaré : il hérite du plafond global sans privilège propre.
  const global = e.find((x) => x.domaine === "global");
  return borner(Math.min(DEFAUT, global?.effectif ?? DEFAUT));
}

export interface Verdict {
  autorise: boolean;
  niveauRequis: NiveauAutonomie;
  niveauAccorde: NiveauAutonomie;
  motif: string;
}

/**
 * Verrou appelé avant toute action. Un refus indique le niveau manquant et le
 * domaine à ouvrir : le propriétaire sait exactement quel curseur monter.
 */
export async function autorise(
  domaine: string,
  permission: Permission,
): Promise<Verdict> {
  const requis = NIVEAU_PAR_PERMISSION[permission];
  const accorde = await niveau(domaine);
  if (accorde >= requis) {
    return {
      autorise: true,
      niveauRequis: requis,
      niveauAccorde: accorde,
      motif: `Niveau ${accorde} (${NIVEAUX_AUTONOMIE.find((n) => n.niveau === accorde)!.libelle}) sur « ${domaine} ».`,
    };
  }
  const specRequis = NIVEAUX_AUTONOMIE.find((n) => n.niveau === requis)!;
  const specAccorde = NIVEAUX_AUTONOMIE.find((n) => n.niveau === accorde)!;
  return {
    autorise: false,
    niveauRequis: requis,
    niveauAccorde: accorde,
    motif: `Autonomie insuffisante sur « ${domaine} » : ${permission} exige le niveau ${requis} (${specRequis.libelle}), le curseur est à ${accorde} (${specAccorde.libelle}).`,
  };
}

export interface ReglerInput {
  domaine: string;
  niveau: number;
  motif: string;
  actorId?: number;
}

/**
 * Réglage du curseur. Monter un niveau exige un motif écrit : une autonomie
 * accordée sans raison consignée est une autonomie que personne n'assume.
 */
export async function regler(
  input: ReglerInput,
): Promise<{ ok: boolean; detail: string; niveau: NiveauAutonomie }> {
  const connu = DOMAINES_AUTONOMIE.some((d) => d.code === input.domaine);
  if (!connu) {
    return {
      ok: false,
      detail: `Domaine inconnu : ${input.domaine}.`,
      niveau: DEFAUT,
    };
  }
  const cible = borner(input.niveau);
  const avant = await niveau(input.domaine);
  const motif = input.motif.trim();
  if (cible > avant && motif.length < 10) {
    return {
      ok: false,
      detail:
        "Montée d'autonomie refusée : la raison doit être écrite pour rester opposable plus tard.",
      niveau: avant,
    };
  }

  const [existant] = await db
    .select({ id: inAutonomie.id })
    .from(inAutonomie)
    .where(eq(inAutonomie.domaine, input.domaine))
    .limit(1);

  if (existant) {
    await db
      .update(inAutonomie)
      .set({
        niveau: cible,
        motif,
        actorId: input.actorId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(inAutonomie.id, existant.id));
  } else {
    await db.insert(inAutonomie).values({
      domaine: input.domaine,
      niveau: cible,
      motif,
      actorId: input.actorId ?? null,
    });
  }

  await db.insert(inAutonomieJournal).values({
    domaine: input.domaine,
    avant,
    apres: cible,
    motif,
    actorId: input.actorId ?? null,
  });

  const effectif = await niveau(input.domaine);
  const detail =
    effectif < cible
      ? `Niveau ${cible} enregistré, mais le plafond général le ramène à ${effectif} : montez d'abord « Plafond général ».`
      : `Niveau ${cible} appliqué sur « ${input.domaine} » : ${PORTEE_NIVEAU[cible]}`;
  return { ok: true, detail, niveau: effectif };
}

export async function journal(limit = 100) {
  return db
    .select()
    .from(inAutonomieJournal)
    .orderBy(desc(inAutonomieJournal.id))
    .limit(limit);
}
