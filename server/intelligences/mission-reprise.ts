/**
 * Reconnaissance de la mission active à partir d'une demande courte (« Tu peux travailler », « continue »).
 *
 * Ordre de recherche, du plus sûr au moins sûr :
 *  1. la mission que l'écran désigne explicitement (dernier compte rendu de la conversation) ;
 *  2. le dernier ordre substantiel de la conversation (pas lui-même une demande courte) ;
 *  3. les missions inachevées de cet acteur, récentes : une seule mission distincte = identifiable.
 * Plusieurs missions distinctes sans indice de la conversation, ou aucune : la mission n'est PAS identifiable — l'agent pose
 * alors une seule question et ne lance aucun parcours.
 */
import type { StoreMissions, LigneMission, LigneEtape } from "./mission-store.js";
import { demandeCourte, objectifNormalise } from "./mission-etat.js";

export const FENETRE_JOURS = 7;

export interface MissionActive {
  /** Absente quand la mission ne ressort que de la conversation (aucune mission enregistrée pour cet ordre). */
  id: number | null;
  objectif: string;
  domaine: string | null;
  devRequestId: number | null;
  etapes: LigneEtape[];
  /** Origine de l'identification, pour le rapport. */
  via: "ecran" | "conversation" | "historique";
}

export type ResolutionMission =
  | { etat: "identifiee"; mission: MissionActive }
  | { etat: "ambigue"; candidats: { id: number; objectif: string }[] }
  | { etat: "aucune" };

async function enMission(store: StoreMissions, l: LigneMission, via: MissionActive["via"]): Promise<MissionActive> {
  return { id: l.id, objectif: l.objectif, domaine: l.domaine, devRequestId: l.devRequestId, etapes: await store.etapesDe(l.id), via };
}

export async function trouverMissionActive(
  store: StoreMissions,
  entree: { actorId: number | undefined; missionActiveId?: number | null; contexte?: string[]; maintenant?: Date },
): Promise<ResolutionMission> {
  const maintenant = entree.maintenant ?? new Date();
  const depuis = new Date(maintenant.getTime() - FENETRE_JOURS * 24 * 3600 * 1000);
  const acteur = entree.actorId;
  if (acteur === undefined) return { etat: "aucune" };

  // 1. Désignation explicite par l'écran (la mission doit appartenir à l'acteur et ne pas être terminée).
  if (entree.missionActiveId) {
    const m = await store.parId(entree.missionActiveId);
    if (m && m.actorId === acteur && ["arretee", "echouee"].includes(m.statut)) return { etat: "identifiee", mission: await enMission(store, m, "ecran") };
  }

  const inachevees = await store.inachevees(acteur, depuis);

  // 2. Dernier ordre substantiel de la conversation (du plus récent au plus ancien).
  const substantiels = (entree.contexte ?? []).map((t) => t.trim()).filter((t) => t.length > 0 && !demandeCourte(t));
  const dernier = substantiels[substantiels.length - 1];
  if (dernier) {
    const cle = objectifNormalise(dernier);
    const correspondante = inachevees.find((m) => objectifNormalise(m.objectif) === cle);
    if (correspondante) return { etat: "identifiee", mission: await enMission(store, correspondante, "conversation") };
    // Ordre donné dans la conversation, sans mission enregistrée (ou mission déjà accomplie) : l'ordre lui-même est la tâche.
    return { etat: "identifiee", mission: { id: null, objectif: dernier, domaine: null, devRequestId: null, etapes: [], via: "conversation" } };
  }

  // 3. Missions inachevées récentes : une seule mission distincte = identifiable.
  const distinctes = new Map<string, LigneMission>();
  for (const m of inachevees) {
    const cle = objectifNormalise(m.objectif);
    if (cle.length === 0 || demandeCourte(m.objectif)) continue;
    if (!distinctes.has(cle)) distinctes.set(cle, m);
  }
  if (distinctes.size === 1) return { etat: "identifiee", mission: await enMission(store, [...distinctes.values()][0], "historique") };
  if (distinctes.size > 1) return { etat: "ambigue", candidats: [...distinctes.values()].slice(0, 4).map((m) => ({ id: m.id, objectif: m.objectif.slice(0, 120) })) };
  return { etat: "aucune" };
}
