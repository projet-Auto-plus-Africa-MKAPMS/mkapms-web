/**
 * Gouvernance du câble RÉEL de la Boutique par le Centre Cyber-Électrique — facultative, armée par le PDG, jamais par défaut.
 *
 * Armée, le centre devient un portier supplémentaire sur TOUTES les voies de la plateforme vers la Boutique et de la Boutique vers la
 * plateforme (canaux du moteur intermédiaire shop_link, et la voie directe des outils de l'IA) : une voie ne passe que si le câble
 * l'autorise ET si la ligne correspondante du centre est connectée sur ses trois coupures. Le centre ne fait que RESTREINDRE : il ne peut
 * jamais ouvrir ce que le câble refuse. Non armée : aucun changement de comportement.
 *
 * Panne du centre pendant qu'il est armé : fermé par sécurité (dernier état connu « armé »). Panne avant toute lecture : non armé.
 */
import { eq } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { lines } from "./base/schema.js";
import { assurerBase } from "./base/demarrage.js";
import { brancherPortier, type DecisionPortier } from "../shop-link/portier.js";
import { journaliser, lireConfig, ecrireConfig, type Acteur } from "./journal.js";
import { evaluerPassage } from "./transport.js";

let dernierEtatConnu: boolean | null = null;
let dernierJournalLe = 0;

export async function gouvernanceArmee(): Promise<boolean> {
  try {
    const base = await assurerBase();
    if (!base.prete) return dernierEtatConnu === true;
    const armee = await lireConfig<boolean>("governance_armed", false);
    dernierEtatConnu = armee;
    return armee;
  } catch {
    return dernierEtatConnu === true;
  }
}

export async function armerGouvernance(acteur: Acteur, confirme: boolean): Promise<{ ok: boolean; detail: string }> {
  if (!confirme) {
    await journaliser({ acteur, action: "governance_arm", cible: "center", resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Armer la gouvernance est une action critique : toute voie vers la Boutique sera refusée tant que sa ligne n'est pas connectée dans le centre. Confirmation requise." };
  }
  await ecrireConfig("governance_armed", true, acteur);
  dernierEtatConnu = true;
  await journaliser({ acteur, action: "governance_arm", cible: "center", resultat: "ok" });
  return { ok: true, detail: "Gouvernance armée : le câble réel de la Boutique ne passe plus que si la ligne correspondante est connectée dans le centre." };
}

export async function desarmerGouvernance(acteur: Acteur, confirme: boolean): Promise<{ ok: boolean; detail: string }> {
  if (!confirme) {
    await journaliser({ acteur, action: "governance_disarm", cible: "center", resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Désarmer la gouvernance : confirmation requise." };
  }
  await ecrireConfig("governance_armed", false, acteur);
  dernierEtatConnu = false;
  await journaliser({ acteur, action: "governance_disarm", cible: "center", resultat: "ok" });
  return { ok: true, detail: "Gouvernance désarmée : le câble réel de la Boutique suit de nouveau ses propres règles." };
}

/** La décision du centre pour un canal du câble. Non armé : toujours « autorisé » (le câble reste seul juge). */
export async function portierCentre(canal: string, sens: "sortant" | "entrant"): Promise<DecisionPortier> {
  if (!(await gouvernanceArmee())) return { autorise: true, raison: "gouvernance non armée" };
  let decision: DecisionPortier;
  try {
    const [ligne] = await dbFrontier().select({ id: lines.id }).from(lines).where(eq(lines.channel, canal)).limit(1);
    if (!ligne) decision = { autorise: false, raison: `aucune ligne du centre ne correspond au canal « ${canal} » (gouvernance armée : fermé)` };
    else {
      const p = await evaluerPassage(ligne.id);
      decision = p.autorise ? { autorise: true, raison: "ligne connectée" } : { autorise: false, raison: `ligne coupée dans le centre (${p.raison ?? "refus"}${p.coupure ? `, coupure ${p.coupure}` : ""})` };
    }
  } catch (e) {
    decision = { autorise: false, raison: `centre indisponible, fermé par sécurité (${(e as Error).message.slice(0, 80)})` };
  }
  // Journal limité : un refus répété ne doit pas inonder le journal du centre.
  if (!decision.autorise && Date.now() - dernierJournalLe > 2000) {
    dernierJournalLe = Date.now();
    await journaliser({ acteur: { type: "system" }, action: "governance_denied", cible: "channel", cibleId: canal, resultat: "refused", erreur: decision.raison.slice(0, 200), detail: { sens } });
  }
  return decision;
}

let branche = false;
/** À appeler une fois au démarrage : branche le centre comme portier du câble. Sans effet tant que la gouvernance n'est pas armée. */
export function brancherPortierCentre(): void {
  if (branche) return;
  brancherPortier(portierCentre);
  branche = true;
}
