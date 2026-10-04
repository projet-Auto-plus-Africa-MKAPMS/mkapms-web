/**
 * Suivi en direct d'une mission en cours : les étapes de l'orchestrateur sont
 * publiées ici au fil de leur exécution, et l'écran Travail les relit pendant
 * que la mission tourne. Mémoire de processus bornée ; la trace définitive
 * reste celle enregistrée par l'orchestrateur en fin de mission.
 */
import type { StatutEtape } from "./mission-etat.js";
import type { AppelOutilEnDirect } from "./outils/boucle.js";
import { libelleOutil, statutAppelOutil } from "../../shared/libelles-outils.js";

export type StatutProgression = StatutEtape | "en_cours";

export interface EtapeProgression {
  etape: string;
  libelle: string;
  statut: StatutProgression;
  observe: string;
}

export interface EvenementProgression {
  etape: string;
  libelle: string;
  statut: StatutProgression;
  observe?: string;
}

interface Suivi {
  actorId: number;
  debut: number;
  maj: number;
  termine: boolean;
  etapes: EtapeProgression[];
}

export const DUREE_CONSERVATION_MS = 10 * 60 * 1000;
export const SUIVIS_MAX = 200;
const APERCU_MAX = 600;

const suivis = new Map<string, Suivi>();

function purger(maintenant: number) {
  for (const [id, s] of suivis) if (maintenant - s.maj > DUREE_CONSERVATION_MS) suivis.delete(id);
  while (suivis.size > SUIVIS_MAX) {
    const plusAncien = suivis.keys().next().value;
    if (plusAncien === undefined) break;
    suivis.delete(plusAncien);
  }
}

export function ouvrirSuivi(id: string, actorId: number, maintenant = Date.now()) {
  purger(maintenant);
  suivis.set(id, { actorId, debut: maintenant, maj: maintenant, termine: false, etapes: [] });
}

export function publierEtape(id: string, evt: EvenementProgression, maintenant = Date.now()) {
  const suivi = suivis.get(id);
  if (!suivi) return;
  const observe = (evt.observe ?? "").slice(0, APERCU_MAX);
  const existante = suivi.etapes.find((e) => e.etape === evt.etape);
  if (existante) Object.assign(existante, { libelle: evt.libelle, statut: evt.statut, observe });
  else suivi.etapes.push({ etape: evt.etape, libelle: evt.libelle, statut: evt.statut, observe });
  suivi.maj = maintenant;
}

export function terminerSuivi(id: string, maintenant = Date.now()) {
  const suivi = suivis.get(id);
  if (!suivi) return;
  suivi.termine = true;
  suivi.maj = maintenant;
}

/** Un suivi n'est lisible que par celui qui a lancé la mission. */
export function lireSuivi(id: string, actorId: number, maintenant = Date.now()) {
  const suivi = suivis.get(id);
  if (!suivi || suivi.actorId !== actorId) return null;
  return {
    termine: suivi.termine,
    dureeMs: maintenant - suivi.debut,
    etapes: suivi.etapes.map((e) => ({ ...e })),
  };
}

/** Un appel d'outil de la boucle devient une ligne lisible du suivi (« Lit la fiche produit complète · en cours »). */
export function etapeOutil(a: AppelOutilEnDirect): EvenementProgression {
  const statut = statutAppelOutil(a.verdictPolitique, a.statutExecution);
  return { etape: `outil-${a.rang}`, libelle: libelleOutil(a.toolId), statut, observe: statut === "fait" || statut === "en_cours" ? "" : a.motif };
}
