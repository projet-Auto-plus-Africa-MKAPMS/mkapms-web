/**
 * Centre Cyber-Électrique — règles pures (aucune base, aucun réseau) : ce qui rend une paire, une ligne ou un bouton valide.
 *
 * Mode : SIMULATION uniquement. Rien ici ne commande une connexion réelle ; l'état réel d'un canal n'est que LU (miroir du câble
 * du moteur intermédiaire Boutique). Passer à l'action réelle exige un changement de code et l'audit final décidé par le PDG.
 */

export const MODE = "simulation" as const;
export const ACTION_REELLE_ACTIVEE = false as const;

export type EngineStatus = "active" | "inactive" | "error" | "locked" | "future" | "maintenance";
export type LineStatus = "on" | "off" | "locked" | "error" | "future";
export type SwitchStatus = "ON" | "OFF" | "locked" | "error";
export type PointageStatus = "connected" | "separated" | "locked" | "error";

export interface EngineLite {
  id: number;
  platformCode: string;
  isRealEngine: boolean;
  isFuturePlaceholder: boolean;
  status: EngineStatus;
  name?: string;
}

/** Un moteur peut en contrôler un autre seulement s'il est interne (plateforme principale), réel, non réservé et sans défaut ni verrou. */
export function moteurInterneUtilisable(e: EngineLite | undefined | null): boolean {
  return !!e && e.platformCode === "main" && e.isRealEngine && !e.isFuturePlaceholder && !["error", "locked", "future"].includes(e.status);
}

export const estExterne = (e: EngineLite): boolean => e.platformCode !== "main";

export interface PairLite {
  externalEngineId: number;
  primaryId: number;
  secondaryId: number;
}

/** Règle du PDG : un moteur externe n'est valide que contrôlé par DEUX moteurs internes distincts et utilisables. */
export function validerPaire(pair: PairLite | undefined, moteurs: Map<number, EngineLite>): { valide: boolean; raison?: string } {
  if (!pair) return { valide: false, raison: "Aucune paire de contrôle : un moteur externe doit être surveillé par deux moteurs internes." };
  if (pair.primaryId === pair.secondaryId) return { valide: false, raison: "Les deux moteurs de contrôle sont le même moteur." };
  const a = moteurs.get(pair.primaryId);
  const b = moteurs.get(pair.secondaryId);
  if (!moteurInterneUtilisable(a)) return { valide: false, raison: `Moteur de contrôle principal inutilisable (${a?.name ?? "absent"}).` };
  if (!moteurInterneUtilisable(b)) return { valide: false, raison: `Moteur de contrôle secondaire inutilisable (${b?.name ?? "absent"}).` };
  return { valide: true };
}

export const reserveCible = (lignesReelles: number, parLigne: number, depart: number): number => (lignesReelles > 0 ? lignesReelles * parLigne : depart);

export interface SwitchLite {
  status: SwitchStatus;
  isFuturePlaceholder: boolean;
  primaryEngineId: number | null;
  secondaryEngineId: number | null;
}
export interface PointageLite {
  status: PointageStatus;
}

export function interrupteurValide(s: SwitchLite | undefined, moteurs: Map<number, EngineLite>): boolean {
  if (!s || s.isFuturePlaceholder || s.primaryEngineId === null || s.secondaryEngineId === null || s.primaryEngineId === s.secondaryEngineId) return false;
  return moteurInterneUtilisable(moteurs.get(s.primaryEngineId)) && moteurInterneUtilisable(moteurs.get(s.secondaryEngineId));
}

export interface LigneAValider {
  isFuture: boolean;
  gauche?: { reel?: EngineLite; intermediaire?: EngineLite; interrupteur?: SwitchLite };
  droite?: { reel?: EngineLite; intermediaire?: EngineLite; interrupteur?: SwitchLite };
  pointage?: PointageLite;
}

/**
 * Une ligne est valide seulement si ses quatre moteurs existent et sont réels, si chaque moteur externe a une paire de contrôle
 * valide (deux moteurs internes), si ses deux interrupteurs ont deux moteurs chacun et si son pointage existe sans défaut.
 * Verrouillée ou éteinte reste « valide » : la validité décrit la structure, pas l'état.
 */
export function validerLigne(ligne: LigneAValider, moteurs: Map<number, EngineLite>, paires: Map<number, PairLite>): { valide: boolean; raisons: string[] } {
  if (ligne.isFuture) return { valide: false, raisons: ["Ligne future : vide, désactivée, non connectée."] };
  const raisons: string[] = [];
  const place = (e: EngineLite | undefined, quoi: string) => {
    if (!e) {
      raisons.push(`${quoi} : absent.`);
      return;
    }
    if (e.isFuturePlaceholder || !e.isRealEngine) raisons.push(`${quoi} : emplacement réservé, pas un moteur réel.`);
    else if (e.status === "error") raisons.push(`${quoi} : en erreur.`);
    else if (e.status === "locked") raisons.push(`${quoi} : verrouillé ou en attente d'une activation externe.`);
    else if (e.status === "future") raisons.push(`${quoi} : futur.`);
    if (e && estExterne(e) && e.isRealEngine && !e.isFuturePlaceholder) {
      const verdict = validerPaire(paires.get(e.id), moteurs);
      if (!verdict.valide) raisons.push(`${quoi} : ${verdict.raison}`);
    }
  };
  place(ligne.gauche?.reel, "Moteur réel de gauche");
  place(ligne.gauche?.intermediaire, "Moteur intermédiaire de gauche");
  place(ligne.droite?.intermediaire, "Moteur intermédiaire de droite");
  place(ligne.droite?.reel, "Moteur réel de droite");
  if (!interrupteurValide(ligne.gauche?.interrupteur, moteurs)) raisons.push("Interrupteur de gauche : il lui faut deux moteurs internes utilisables.");
  if (!interrupteurValide(ligne.droite?.interrupteur, moteurs)) raisons.push("Interrupteur de droite : il lui faut deux moteurs internes utilisables.");
  if (!ligne.pointage) raisons.push("Pointage central : absent.");
  else if (ligne.pointage.status === "error") raisons.push("Pointage central : en erreur.");
  return { valide: raisons.length === 0, raisons };
}

/** État d'une ligne déduit de ses deux interrupteurs et de son pointage : allumée seulement si tout est fermé. */
export function etatLigne(input: { isFuture: boolean; gauche: SwitchStatus; droite: SwitchStatus; pointage: PointageStatus }): LineStatus {
  if (input.isFuture) return "future";
  const tous = [input.gauche, input.droite, input.pointage];
  if (tous.includes("error")) return "error";
  if (tous.includes("locked")) return "locked";
  return input.gauche === "ON" && input.droite === "ON" && input.pointage === "connected" ? "on" : "off";
}

export const etatCourantLigne = (s: LineStatus): "off" | "simulated_on" | "locked" | "error" | "future" => (s === "on" ? "simulated_on" : s);

/** Le grand pointage central reste ROUGE : c'est son identité (grande coupure). L'état se lit à sa position, pas à sa couleur. */
export const COULEUR_POINTAGE_MAITRE = "red" as const;

/** Miroir de l'état d'un moteur du registre central vers les états du Centre. */
export function etatDepuisRegistre(state: string, health: string | null): EngineStatus {
  if (state === "disabled" || state === "staging") return "inactive";
  if (state === "read_only") return "locked";
  if (state === "maintenance") return "maintenance";
  if (health === "down" || health === "error") return "error";
  if (health === "degraded") return "maintenance";
  return "active";
}

/** Miroir de l'état du câble (moteur intermédiaire Boutique) vers l'état d'un moteur intermédiaire de la plateforme. */
export function etatDepuisCable(passe: boolean, raison: string | undefined): EngineStatus {
  if (passe) return "active";
  return raison === "ATTENTE_EXTERNE" ? "locked" : "inactive";
}

export type EtatReel = "connecte" | "coupe" | "attente_externe" | "sans_canal";
export const etatReelDepuisCable = (canal: string | null, passe: boolean, raison: string | undefined): EtatReel =>
  !canal ? "sans_canal" : passe ? "connecte" : raison === "ATTENTE_EXTERNE" ? "attente_externe" : "coupe";

// ── Jauges de l'accueil : uniquement des mesures calculées, jamais une valeur inventée ──────────────────────────────────
export interface Comptes {
  lignesReelles: number;
  lignesAllumees: number;
  lignesValides: number;
  pairesRequises: number;
  pairesValides: number;
  moteurs: { total: number; observes: number; actifs: number; inactifs: number; erreur: number; verrouilles: number; maintenance: number };
  canaux: { declares: number; connectes: number };
  alertes: { reparationsOuvertes: number; tentativesRefusees24h: number };
  memoire: number;
  reparation: { ouvertes: number; resolues: number };
}

export interface Jauge {
  cle: string;
  libelle: string;
  /** Pourcentage 0–100, ou null quand la mesure n'a pas de sens (rien à mesurer). */
  valeur: number | null;
  detail: string;
}

const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 100) : null);

export function jauges(c: Comptes): Jauge[] {
  const coupes = c.moteurs.inactifs + c.moteurs.verrouilles;
  return [
    { cle: "puissance", libelle: "Puissance globale", valeur: pct(c.lignesAllumees, c.lignesReelles), detail: `${c.lignesAllumees} ligne(s) allumée(s) en simulation sur ${c.lignesReelles} réelle(s)` },
    { cle: "securite", libelle: "Sécurité globale", valeur: pct(c.pairesValides, c.pairesRequises), detail: `${c.pairesValides} paire(s) de contrôle valide(s) sur ${c.pairesRequises} requise(s)` },
    { cle: "temperature", libelle: "Température des moteurs", valeur: pct(c.moteurs.erreur + c.moteurs.maintenance, c.moteurs.observes), detail: `${c.moteurs.erreur + c.moteurs.maintenance} moteur(s) en difficulté sur ${c.moteurs.observes} observé(s)` },
    { cle: "connexions", libelle: "Connexions actives", valeur: pct(c.canaux.connectes, c.canaux.declares), detail: `${c.canaux.connectes} canal(aux) réellement branché(s) sur ${c.canaux.declares}` },
    { cle: "erreurs", libelle: "Erreurs", valeur: null, detail: `${c.moteurs.erreur} moteur(s) en erreur` },
    { cle: "coupes", libelle: "Moteurs coupés", valeur: pct(coupes, c.moteurs.total), detail: `${coupes} moteur(s) coupé(s) ou verrouillé(s) sur ${c.moteurs.total}` },
    { cle: "alertes", libelle: "Alertes", valeur: null, detail: `${c.alertes.reparationsOuvertes} réparation(s) ouverte(s), ${c.alertes.tentativesRefusees24h} tentative(s) refusée(s) en 24 h` },
    { cle: "memoire", libelle: "État de la mémoire", valeur: null, detail: `${c.memoire} bloc(s) de mémoire` },
    { cle: "reparation", libelle: "État de la réparation", valeur: pct(c.reparation.resolues, c.reparation.ouvertes + c.reparation.resolues), detail: `${c.reparation.ouvertes} ouverte(s), ${c.reparation.resolues} résolue(s)` },
  ];
}
