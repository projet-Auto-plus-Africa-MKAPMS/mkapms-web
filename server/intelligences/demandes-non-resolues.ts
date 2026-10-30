/**
 * IA centrale PDG — point « demandes non résolues ».
 *
 * Chaque fois qu'AL-HOUDOUD·M ne peut pas satisfaire une demande légitime —
 * capacité entière indisponible (routeur.ts) ou outil précis non implémenté /
 * en échec (outils/audit.ts) — le signal existe déjà dans deux journaux :
 *
 *   - in_capacite_refus_journal : refus d'une capacité (ce fichier l'écrit,
 *     appelé depuis routeur.ts::refus()).
 *   - in_outils_journal : refus/échec d'un outil précis (déjà écrit par
 *     outils/audit.ts::journaliser(), lu ici tel quel — jamais dupliqué).
 *
 * Ce fichier ne fait qu'une chose que personne d'autre ne fait encore :
 * regrouper ces deux journaux par signature (même capacité/outil, même
 * catégorie de blocage) pour que la direction voie un besoin récurrent une
 * fois, avec son nombre d'occurrences, plutôt que de dérouler un journal brut.
 *
 * Règle de confidentialité : `in_outils_journal.argumentsJson` et
 * `.resultatJson` (texte libre potentiellement privé) ne sont JAMAIS lus ici.
 * `in_capacite_refus_journal` n'a, par construction, aucune colonne de texte
 * libre utilisateur. Seules des métadonnées systémiques sont regroupées.
 */
import { desc, sql } from "drizzle-orm";
import { db } from "../db.js";
import { inCapaciteRefusJournal, inDemandesAnnotations, inOutilsJournal } from "./schema.js";
import type { CodeCapacite } from "./capacites.js";

/** Plafond de lignes brutes lues par source : un tableau de bord direction, pas un export complet. */
const LIMITE_BRUTE = 5000;

export type GraviteBesoin = "lacune" | "technique" | "politique";

export interface SignalerRefusCapaciteInput {
  capacite: CodeCapacite;
  moteur: string;
  role: string | null;
  confidentialite?: string;
  countryCode?: string | null;
  motif: string;
}

/** Appelé depuis routeur.ts::refus() — jamais `demande.message` (texte libre de l'utilisateur). */
export async function signalerRefusCapacite(input: SignalerRefusCapaciteInput): Promise<void> {
  try {
    await db.insert(inCapaciteRefusJournal).values({
      capacite: input.capacite,
      moteur: input.moteur,
      role: input.role,
      confidentialite: input.confidentialite ?? null,
      countryCode: input.countryCode ?? null,
      motif: input.motif.slice(0, 2000),
    });
  } catch {
    // Le signalement ne doit jamais faire échouer la demande qu'il observe.
  }
}

export interface DemandeNonResolue {
  signature: string;
  domaine: "capacite" | "outil";
  cle: string;
  gravite: GraviteBesoin;
  occurrences: number;
  premiereFois: string;
  derniereFois: string;
  moteurs: string[];
  roles: string[];
  exemplesMotifs: string[];
  statut: string;
  note: string;
}

function graviteOutil(verdictPolitique: string, statutExecution: string | null): GraviteBesoin {
  if (statutExecution === "non_implemente") return "lacune";
  if (statutExecution === "erreur" || statutExecution === "timeout") return "technique";
  return "politique";
}

function graviteCapacite(motif: string): GraviteBesoin {
  // Motifs réels d'une capacité non exécutable aujourd'hui — voir capacites.ts::registre()
  // (« indisponible » : aucun fournisseur au catalogue / aucun repli interne) et le motif par
  // défaut de routeur.ts quand la capacité n'est même pas déclarée au registre, ou n'est pas
  // fabriquée par un fournisseur de modèle (elle appartient à un moteur métier propriétaire).
  if (/non constatée disponible|aucun fournisseur au catalogue|aucun repli interne|est propriétaire ?:/i.test(motif)) return "lacune";
  return "politique";
}

interface GroupeAccumule {
  domaine: "capacite" | "outil";
  cle: string;
  gravite: GraviteBesoin;
  occurrences: number;
  premiereFois: Date;
  derniereFois: Date;
  moteurs: Set<string>;
  roles: Set<string>;
  exemplesMotifs: string[];
}

function regrouper(
  lignes: { domaine: "capacite" | "outil"; cle: string; gravite: GraviteBesoin; moteur: string; role: string | null; motif: string; createdAt: Date }[],
): Map<string, GroupeAccumule> {
  const groupes = new Map<string, GroupeAccumule>();
  for (const l of lignes) {
    const signature = `${l.domaine}:${l.cle}:${l.gravite}`;
    let g = groupes.get(signature);
    if (!g) {
      g = { domaine: l.domaine, cle: l.cle, gravite: l.gravite, occurrences: 0, premiereFois: l.createdAt, derniereFois: l.createdAt, moteurs: new Set(), roles: new Set(), exemplesMotifs: [] };
      groupes.set(signature, g);
    }
    g.occurrences += 1;
    if (l.createdAt < g.premiereFois) g.premiereFois = l.createdAt;
    if (l.createdAt > g.derniereFois) g.derniereFois = l.createdAt;
    if (l.moteur) g.moteurs.add(l.moteur);
    if (l.role) g.roles.add(l.role);
    if (l.motif && g.exemplesMotifs.length < 5 && !g.exemplesMotifs.includes(l.motif)) g.exemplesMotifs.push(l.motif);
  }
  return groupes;
}

/**
 * Liste groupée des demandes non résolues, triée par nombre d'occurrences
 * décroissant (le besoin le plus répété en premier). `graviteFiltre`, si
 * fourni, ne garde qu'une catégorie (ex. "lacune" seule pour écarter le bruit
 * des refus de politique métier volontaires).
 */
export async function listerDemandesNonResolues(graviteFiltre?: GraviteBesoin): Promise<DemandeNonResolue[]> {
  const [refusCapacite, journalOutils, annotations] = await Promise.all([
    db
      .select({
        capacite: inCapaciteRefusJournal.capacite,
        moteur: inCapaciteRefusJournal.moteur,
        role: inCapaciteRefusJournal.role,
        motif: inCapaciteRefusJournal.motif,
        createdAt: inCapaciteRefusJournal.createdAt,
      })
      .from(inCapaciteRefusJournal)
      .orderBy(desc(inCapaciteRefusJournal.createdAt))
      .limit(LIMITE_BRUTE),
    db
      .select({
        toolId: inOutilsJournal.toolId,
        moteur: inOutilsJournal.moteur,
        role: inOutilsJournal.role,
        verdictPolitique: inOutilsJournal.verdictPolitique,
        statutExecution: inOutilsJournal.statutExecution,
        motif: inOutilsJournal.motif,
        createdAt: inOutilsJournal.createdAt,
      })
      .from(inOutilsJournal)
      .where(sql`${inOutilsJournal.verdictPolitique} <> 'autorise' OR ${inOutilsJournal.statutExecution} IN ('erreur', 'timeout', 'non_implemente')`)
      .orderBy(desc(inOutilsJournal.createdAt))
      .limit(LIMITE_BRUTE),
    db.select().from(inDemandesAnnotations),
  ]);

  const parSignature = new Map(annotations.map((a) => [a.signature, a]));

  const lignes = [
    ...refusCapacite.map((r) => ({
      domaine: "capacite" as const,
      cle: r.capacite,
      gravite: graviteCapacite(r.motif),
      moteur: r.moteur,
      role: r.role,
      motif: r.motif,
      createdAt: r.createdAt,
    })),
    ...journalOutils.map((o) => ({
      domaine: "outil" as const,
      cle: o.toolId,
      gravite: graviteOutil(o.verdictPolitique, o.statutExecution),
      moteur: o.moteur,
      role: o.role,
      motif: o.motif,
      createdAt: o.createdAt,
    })),
  ];

  const groupes = regrouper(lignes);
  const resultat: DemandeNonResolue[] = [];
  for (const [signature, g] of groupes) {
    if (graviteFiltre && g.gravite !== graviteFiltre) continue;
    const annotation = parSignature.get(signature);
    resultat.push({
      signature,
      domaine: g.domaine,
      cle: g.cle,
      gravite: g.gravite,
      occurrences: g.occurrences,
      premiereFois: g.premiereFois.toISOString(),
      derniereFois: g.derniereFois.toISOString(),
      moteurs: [...g.moteurs],
      roles: [...g.roles],
      exemplesMotifs: g.exemplesMotifs,
      statut: annotation?.statut ?? "nouveau",
      note: annotation?.note ?? "",
    });
  }
  return resultat.sort((a, b) => b.occurrences - a.occurrences);
}

export const STATUTS_DEMANDE = ["nouveau", "en_etude", "planifie", "resolu", "ignore"] as const;
export type StatutDemande = (typeof STATUTS_DEMANDE)[number];

export interface AnnoterDemandeInput {
  signature: string;
  statut: StatutDemande;
  note: string;
  actorId: number | null;
}

export async function annoterDemande(input: AnnoterDemandeInput): Promise<void> {
  await db
    .insert(inDemandesAnnotations)
    .values({ signature: input.signature, statut: input.statut, note: input.note.slice(0, 4000), actorId: input.actorId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: inDemandesAnnotations.signature,
      set: { statut: input.statut, note: input.note.slice(0, 4000), actorId: input.actorId, updatedAt: new Date() },
    });
}
