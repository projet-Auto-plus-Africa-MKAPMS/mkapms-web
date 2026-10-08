/**
 * Centre Cyber-Électrique — règles PURES (aucune base, aucun réseau) : validité d'une ligne à sept éléments, ce qui est admissible pour une
 * commande générale, décision de passage d'un échange, règle des échanges en vol, jauges. Tout ce qui décide est ici et se teste sans base.
 */
import type { Avancement, CoteCoupure, EtatDemande, EtatEchange, EtatObserve, Mode } from "./base/schema.js";

/** Le centre ne pilote QUE la simulation. Passer au réel exige un changement de code et l'audit final décidé par le PDG. */
export const MODE: Mode = "simulation";
export const ACTION_REELLE_ACTIVEE = false;

export const ETIQUETTE_RESERVE = "À venir";
/** Règle du PDG : au moins cinq lignes de réserve pour chaque ligne réelle inventoriée. */
export const RESERVE_PAR_LIGNE_REELLE = 5;
/** Un groupe sans ligne réelle (Map, IA, Bijoux, futures plateformes) garde tout de même cette réserve de départ. */
export const RESERVE_DE_DEPART = 5;

/** Les sept éléments d'une ligne, de la gauche (plateforme distante) à la droite (plateforme principale). */
export const ELEMENTS_CHAINE = [
  { cle: "remoteRealEngine", rang: 1, libelle: "Moteur réel distant", cote: "remote" },
  { cle: "remoteSwitch", rang: 2, libelle: "Interrupteur local distant", cote: "remote" },
  { cle: "remoteIntermediary", rang: 3, libelle: "Moteur intermédiaire distant", cote: "remote" },
  { cle: "centerContact", rang: 4, libelle: "Contact central", cote: "center" },
  { cle: "mainIntermediary", rang: 5, libelle: "Moteur intermédiaire principal", cote: "main" },
  { cle: "mainSwitch", rang: 6, libelle: "Interrupteur local principal", cote: "main" },
  { cle: "mainRealEngine", rang: 7, libelle: "Moteur réel principal", cote: "main" },
] as const;
export type CleElement = (typeof ELEMENTS_CHAINE)[number]["cle"];
export type Chaine = Record<CleElement, string | null>;

/** Les trois coupures, dans l'ordre d'une mise sous tension : les deux côtés locaux d'abord, le contact central en dernier. */
export const ORDRE_ACTIVATION: readonly CoteCoupure[] = ["remote", "main", "center"];
/** Et d'une coupure : le centre d'abord (le plus court chemin vers « rien ne passe »), puis les deux côtés. */
export const ORDRE_DESACTIVATION: readonly CoteCoupure[] = ["center", "remote", "main"];

export const CLE_ELEMENT_DE_COTE: Readonly<Record<CoteCoupure, CleElement>> = { remote: "remoteSwitch", center: "centerContact", main: "mainSwitch" };

export interface MoteurLite {
  code: string;
  kind: string;
  running: boolean;
  health: string;
  inventoryState: string | null;
}

const ETATS_REELS = new Set(["prepare", "installe", "teste", "connecte"]);

export interface EntreeValidite {
  kind: "real" | "reserve";
  elements: Chaine;
  moteurs: ReadonlyMap<string, MoteurLite>;
  /** Codes des éléments qui ont une liaison commande/vérification dont les deux moteurs internes sont distincts et en marche. */
  liaisonsValides: ReadonlySet<string>;
}

/**
 * Une ligne n'est valide que si ses sept éléments existent, si chaque moteur réel ou intermédiaire est préparé ou mieux (jamais « incomplet »),
 * si les trois éléments du centre sont en marche et si chacun des sept a sa paire commande / vérification. Les raisons sont dites une à une.
 */
export function validerLigne(e: EntreeValidite): { valide: boolean; raisons: string[] } {
  if (e.kind === "reserve") return { valide: false, raisons: ["Ligne de réserve « À venir » : vide, désactivée, aucun moteur."] };
  const raisons: string[] = [];
  for (const el of ELEMENTS_CHAINE) {
    const code = e.elements[el.cle];
    if (!code) {
      raisons.push(`Élément ${el.rang} absent : ${el.libelle.toLowerCase()}.`);
      continue;
    }
    const m = e.moteurs.get(code);
    if (!m) {
      raisons.push(`Élément ${el.rang} inconnu du registre : ${code}.`);
      continue;
    }
    const duCentre = el.rang === 2 || el.rang === 4 || el.rang === 6;
    if (duCentre) {
      if (!m.running || m.health === "down" || m.health === "stopped") raisons.push(`Élément ${el.rang} (${el.libelle.toLowerCase()}) arrêté ou en panne.`);
    } else if (!m.inventoryState || !ETATS_REELS.has(m.inventoryState)) {
      raisons.push(`Élément ${el.rang} (${el.libelle.toLowerCase()}) « ${m.code} » est ${m.inventoryState === "a_verifier" ? "à vérifier" : "incomplet"} : il n'est pas encore un moteur utilisable.`);
    }
    if (!e.liaisonsValides.has(code)) raisons.push(`Élément ${el.rang} sans paire valide de deux moteurs internes distincts (commande, vérification).`);
  }
  return { valide: raisons.length === 0, raisons };
}

export interface CoupureLite {
  side: CoteCoupure;
  requested: EtatDemande;
  observed: EtatObserve;
  progress: Avancement;
  mode: Mode;
  porteOuverte: boolean;
}

export interface LigneLite {
  kind: "real" | "reserve";
  enabled: boolean;
  locked: boolean;
  validity: "valid" | "invalid";
}

export type RaisonInadmissible = "VIDE" | "DESACTIVEE" | "VERROUILLEE" | "NON_VALIDEE" | "EN_ERREUR" | "EN_COURS";

/** Une ligne est admissible à l'activation si elle est réelle, activée, déverrouillée, validée, sans erreur ni commande en cours. */
export function ligneAdmissible(l: LigneLite, coupures: readonly CoupureLite[]): { ok: boolean; raison?: RaisonInadmissible; detail?: string } {
  if (l.kind !== "real") return { ok: false, raison: "VIDE", detail: "Ligne de réserve : vide." };
  if (!l.enabled) return { ok: false, raison: "DESACTIVEE", detail: "Ligne désactivée." };
  if (l.locked) return { ok: false, raison: "VERROUILLEE", detail: "Ligne verrouillée : déverrouillez-la d'abord (le verrou ne bloque jamais une coupure)." };
  if (l.validity !== "valid") return { ok: false, raison: "NON_VALIDEE", detail: "Ligne non validée : la chaîne à sept éléments est incomplète." };
  if (coupures.some((c) => c.progress === "failed")) return { ok: false, raison: "EN_ERREUR", detail: "Une coupure de cette ligne est en erreur : traitez l'incident d'abord." };
  if (coupures.some((c) => c.progress === "pending" || c.progress === "in_progress")) return { ok: false, raison: "EN_COURS", detail: "Une commande est déjà en cours sur cette ligne." };
  return { ok: true };
}

export type RaisonPassage =
  | "LIGNE_VIDE"
  | "LIGNE_DESACTIVEE"
  | "LIGNE_VERROUILLEE"
  | "LIGNE_NON_VALIDEE"
  | "COUPURE_NON_DEMANDEE"
  | "COUPURE_NON_CONFIRMEE"
  | "CONTACT_OUVERT"
  | "MODE_REEL_NON_ACTIVE"
  | "COUPURES_INCOMPLETES";

export interface DecisionPassage {
  autorise: boolean;
  raison?: RaisonPassage;
  /** La coupure qui refuse (la première rencontrée de gauche à droite), si une seule suffit à refuser. */
  coupure?: CoteCoupure;
  detail?: string;
}

/**
 * LA décision de passage d'un échange, la même à chaque envoi, chaque reprise et chaque voie secondaire.
 * Elle exige à la fois la CONTINUITÉ du contact (porte ouverte) et la PERMISSION (demande d'activation confirmée par la vérification) sur
 * les trois coupures. Une demande de désactivation refuse le passage à l'instant, avant même que la coupure soit confirmée ; une demande
 * d'activation ne l'ouvre qu'une fois la coupure confirmée par le moteur de vérification : un contact qui « approche » ne laisse rien passer.
 */
export function decisionPassage(l: LigneLite, coupures: readonly CoupureLite[]): DecisionPassage {
  if (l.kind !== "real") return { autorise: false, raison: "LIGNE_VIDE", detail: "Ligne de réserve : rien ne peut passer." };
  if (!l.enabled) return { autorise: false, raison: "LIGNE_DESACTIVEE", detail: "Ligne désactivée." };
  if (l.locked) return { autorise: false, raison: "LIGNE_VERROUILLEE", detail: "Ligne verrouillée." };
  if (l.validity !== "valid") return { autorise: false, raison: "LIGNE_NON_VALIDEE", detail: "Ligne non validée." };
  const cotes = new Set(coupures.map((c) => c.side));
  if (cotes.size !== 3) return { autorise: false, raison: "COUPURES_INCOMPLETES", detail: "Les trois coupures de la ligne ne sont pas toutes enregistrées." };
  for (const side of ["remote", "center", "main"] as const) {
    const c = coupures.find((x) => x.side === side)!;
    if (c.mode === "real" && !ACTION_REELLE_ACTIVEE) return { autorise: false, raison: "MODE_REEL_NON_ACTIVE", coupure: side, detail: "Le mode réel n'est pas activé." };
    if (c.requested !== "activate") return { autorise: false, raison: "COUPURE_NON_DEMANDEE", coupure: side, detail: c.requested === "deactivate" ? "Coupure demandée : rien ne passe." : "Jamais activée." };
    if (c.progress !== "confirmed" || c.observed !== "connected") return { autorise: false, raison: "COUPURE_NON_CONFIRMEE", coupure: side, detail: "Activation demandée mais non confirmée par la vérification." };
    if (!c.porteOuverte) return { autorise: false, raison: "CONTACT_OUVERT", coupure: side, detail: "Le contact est ouvert." };
  }
  return { autorise: true };
}

/** État résumé d'une ligne pour l'écran : jamais « connectée » sur la seule foi d'une demande. */
export type EtatLigne = "connected" | "disconnected" | "partial" | "transition" | "failed" | "unknown";
export function etatLigne(coupures: readonly CoupureLite[]): EtatLigne {
  if (coupures.length === 0) return "unknown";
  if (coupures.some((c) => c.progress === "failed")) return "failed";
  if (coupures.some((c) => c.progress === "pending" || c.progress === "in_progress")) return "transition";
  const confirmeesConnectees = coupures.filter((c) => c.observed === "connected" && c.progress === "confirmed" && c.requested === "activate").length;
  if (confirmeesConnectees === 3) return "connected";
  // Aucune coupure connectée : la ligne est coupée dès qu'au moins une coupure l'a été (les autres n'ont jamais été commandées).
  if (!coupures.some((c) => c.observed === "connected")) return coupures.some((c) => c.observed === "disconnected") ? "disconnected" : "unknown";
  return "partial";
}

/** Le grand contact rouge d'un groupe : résumé des contacts centraux des lignes réelles. */
export function etatContactGroupe(centres: readonly CoupureLite[]): "connected" | "disconnected" | "partial" | "unknown" {
  if (centres.length === 0) return "unknown";
  const co = centres.filter((c) => c.observed === "connected" && c.progress === "confirmed").length;
  const dis = centres.filter((c) => c.observed === "disconnected").length;
  if (co === centres.length) return "connected";
  if (dis === centres.length) return "disconnected";
  if (co === 0 && dis === 0) return "unknown";
  return "partial";
}

/** Combien de lignes de réserve ajouter pour qu'un groupe en ait au moins cinq par ligne réelle (ou cinq au départ s'il n'en a aucune). */
export function reservesAAjouter(reelles: number, reserves: number): number {
  const cible = reelles > 0 ? reelles * RESERVE_PAR_LIGNE_REELLE : RESERVE_DE_DEPART;
  return Math.max(0, cible - reserves);
}

export type KindEchange = "message" | "task" | "payment_external" | "probe";

/**
 * RÈGLE DES ÉCHANGES EN VOL (documentée et appliquée par le transport au moment où une désactivation est DEMANDÉE) :
 *  - en attente dans une file          → suspendu : une tâche en attente ne peut jamais rétablir la liaison, elle ne repart pas toute seule ;
 *  - en cours, message / tâche / sonde → annulé de façon contrôlée : le résultat éventuel est écarté, rien ne franchit la frontière ;
 *  - en cours, paiement déjà transmis au prestataire → SUIVI, jamais annulé automatiquement : la transaction existe chez le prestataire,
 *    le centre enregistre et affiche son résultat sans le renvoyer de l'autre côté.
 */
export function regleEnVol(kind: KindEchange, etat: EtatEchange): EtatEchange {
  if (etat === "queued") return "suspended";
  if (etat === "in_flight") return kind === "payment_external" ? "tracked" : "cancelled";
  return etat;
}

export type NiveauJauge = "ok" | "alerte" | "inconnu";
/** Vert seulement si une vérification a réussi ; une valeur absente est « non mesurée », jamais un zéro. */
export function niveauJauge(valeur: number | null, derniereVerificationReussie: boolean | null, seuilAlerte?: number): NiveauJauge {
  if (valeur === null || derniereVerificationReussie === null) return "inconnu";
  if (!derniereVerificationReussie) return "alerte";
  if (seuilAlerte !== undefined && valeur > seuilAlerte) return "alerte";
  return "ok";
}

/** Décision de gouvernance sur le câble réel : le centre ne peut que RESTREINDRE, jamais ouvrir. */
export function combinerAvecCable(cablePasse: boolean, centrePasse: boolean | "non_arme"): boolean {
  if (!cablePasse) return false;
  return centrePasse === "non_arme" ? true : centrePasse;
}
