/**
 * Centre Cyber-Électrique — LE MODE RÉEL : armement par le PDG, passage d'une ligne en réel, retour en simulation, réconciliation, vue.
 *
 * Règles (toutes vérifiées par tests) :
 *  - le réel exige DEUX clés indépendantes : la variable d'environnement FRONTIER_MODE_REEL=oui ET l'armement du PDG (phrase de confirmation). Une seule ne suffit pas ;
 *  - une ligne ne passe en réel que par un acte explicite du PDG, uniquement si elle est coupée, validée, déverrouillée, et si chacune de ses trois coupures a une
 *    liaison réelle disponible ; ses états sont alors remis à zéro (rien de ce qui a été « confirmé » en simulation ne vaut pour le réel) ;
 *  - ce n'est JAMAIS rebranché tout seul : désarmer, retirer la variable ou redémarrer ne rouvre rien ; une liaison réelle trouvée ouverte contre l'avis du centre est COUPÉE
 *    (fermé par sécurité) et signalée par un incident ;
 *  - une coupure (désactivation) est toujours permise, armé ou non.
 */
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { cuts, gates, lines, remoteOrders } from "./base/schema.js";
import { chargerCoupures, chargerLigne, coupuresLite } from "./chaine.js";
import { commanderLigne } from "./commandes.js";
import { ecrireConfig, journaliser, ouvrirIncident, type Acteur } from "./journal.js";
import { adaptateurDe } from "./liaisons-reelles.js";
import { CLE_ARMEMENT_REEL, ENV_MODE_REEL, reelArme, reelAutorise, reelPermisParEnvironnement } from "./reel-etat.js";
import { etatLigne } from "./regles.js";

export const PHRASE_ARMEMENT = "ARMER LE MODE REEL";

export interface ResultatReel {
  ok: boolean;
  detail: string;
  code?: string;
}

export async function armerReel(acteur: Acteur, phrase: string): Promise<ResultatReel> {
  if (!reelPermisParEnvironnement()) {
    await journaliser({ acteur, action: "real_arm", cible: "center", resultat: "refused", erreur: "ENVIRONNEMENT_ABSENT" });
    return { ok: false, code: "ENVIRONNEMENT_ABSENT", detail: `La variable ${ENV_MODE_REEL}=oui n'est pas posée sur le service : le mode réel ne peut pas être armé depuis le centre. Elle se pose dans les variables du service (Railway), jamais depuis cet écran.` };
  }
  if (phrase.trim() !== PHRASE_ARMEMENT) {
    await journaliser({ acteur, action: "real_arm", cible: "center", resultat: "refused", erreur: "PHRASE_INCORRECTE" });
    return { ok: false, code: "PHRASE_INCORRECTE", detail: `Pour armer le mode réel, recopiez exactement : « ${PHRASE_ARMEMENT} ».` };
  }
  await ecrireConfig(CLE_ARMEMENT_REEL, true, acteur);
  await journaliser({ acteur, action: "real_arm", cible: "center", resultat: "ok" });
  return { ok: true, detail: "Mode réel armé. Aucune ligne n'est devenue réelle pour autant : chaque ligne se passe en réel par un acte explicite, et rien ne se rebranche tout seul." };
}

/** Passe une ligne dans le régime demandé en remettant ses trois coupures à zéro : nul état « confirmé » ne traverse de la simulation au réel ni inversement. */
async function remettreAZero(ligneId: number, mode: "simulation" | "real"): Promise<void> {
  const db = dbFrontier();
  await db.transaction(async (tx) => {
    const cs = await tx.select({ id: cuts.id }).from(cuts).where(eq(cuts.lineId, ligneId));
    const ids = cs.map((c) => c.id);
    if (ids.length) {
      await tx.update(cuts).set({ mode, requested: "none", observed: "unknown", progress: "idle", error: null, lastProof: null, lastCheckedAt: null, lastCommandId: null, updatedAt: new Date() }).where(inArray(cuts.id, ids));
      await tx.update(gates).set({ open: false, changedBy: null, changedAt: new Date() }).where(inArray(gates.cutId, ids));
    }
    await tx.update(remoteOrders).set({ status: "cancelled" }).where(and(eq(remoteOrders.lineId, ligneId), inArray(remoteOrders.status, ["pending", "delivered"])));
  });
}

export async function definirModeLigne(ligneId: number, mode: "simulation" | "real", acteur: Acteur): Promise<ResultatReel> {
  const refus = async (code: string, detail: string): Promise<ResultatReel> => {
    await journaliser({ acteur, action: mode === "real" ? "line_to_real" : "line_to_simulation", cible: "line", cibleId: ligneId, resultat: "refused", erreur: code, detail: { detail } });
    return { ok: false, code, detail };
  };
  const c = await chargerLigne(ligneId);
  if (!c || c.ligne.kind !== "real") return refus("LIGNE_INCONNUE", "Ligne inconnue ou vide : une réserve ne devient jamais réelle.");
  const lite = coupuresLite(c.coupures);
  const etat = etatLigne(lite);
  if (c.coupures.length !== 3) return refus("COUPURES_INCOMPLETES", "Les trois coupures de la ligne ne sont pas toutes enregistrées.");
  if (c.coupures.some((x) => x.progress === "pending" || x.progress === "in_progress")) return refus("EN_COURS", "Une commande est en cours sur cette ligne.");
  if (etat === "connected" || etat === "partial" || etat === "transition" || etat === "failed") return refus("LIGNE_NON_COUPEE", "Coupez la ligne et attendez la confirmation avant de changer de régime : un changement ne se fait jamais sur une ligne branchée ou en erreur.");
  if (c.coupures.every((x) => x.mode === mode)) return { ok: true, detail: `La ligne est déjà en ${mode === "real" ? "réel" : "simulation"}.` };
  if (mode === "real") {
    if (!(await reelAutorise())) return refus("MODE_REEL_NON_ACTIVE", `Le mode réel n'est pas permis : ${reelPermisParEnvironnement() ? "le PDG ne l'a pas armé" : `la variable ${ENV_MODE_REEL}=oui n'est pas posée`}.`);
    if (c.ligne.validity !== "valid") return refus("NON_VALIDEE", "Ligne non validée : la chaîne à sept éléments est incomplète.");
    if (c.ligne.locked) return refus("VERROUILLEE", "Ligne verrouillée : déverrouillez-la d'abord.");
    const manques = c.coupures.map((x) => ({ x, a: adaptateurDe(x, c.ligne) })).filter((y) => !y.a.disponible);
    if (manques.length) return refus("LIAISON_ABSENTE", `Aucune liaison réelle pour ${manques.map((y) => `la coupure « ${y.x.side} » (${y.a.raison ?? "indisponible"})`).join(" ; ")}. La ligne reste en simulation.`);
  }
  await remettreAZero(ligneId, mode);
  await journaliser({ acteur, action: mode === "real" ? "line_to_real" : "line_to_simulation", cible: "line", cibleId: ligneId, resultat: "ok" });
  return { ok: true, detail: mode === "real" ? "Ligne passée en RÉEL : ses trois coupures sont remises à zéro (coupées, jamais commandées). Rien n'est branché." : "Ligne revenue en simulation : ses trois coupures sont remises à zéro." };
}

export interface BilanDesarmement {
  ok: boolean;
  detail: string;
  lignes: { ligneId: number; label: string; coupee: boolean; detail: string }[];
}

/** Désarmer : la clé du PDG est retirée D'ABORD (tout passage réel est refusé à l'instant), puis chaque ligne réelle est coupée et revient en simulation si la coupure est confirmée. */
export async function desarmerReel(acteur: Acteur): Promise<BilanDesarmement> {
  await ecrireConfig(CLE_ARMEMENT_REEL, false, acteur);
  await journaliser({ acteur, action: "real_disarm", cible: "center", resultat: "ok" });
  const reelles = await dbFrontier().select({ id: lines.id, label: lines.label }).from(lines).where(eq(lines.kind, "real"));
  const par: BilanDesarmement["lignes"] = [];
  for (const l of reelles) {
    const cs = (await chargerCoupures([l.id])).get(l.id) ?? [];
    if (!cs.some((x) => x.mode === "real")) continue;
    const r = await commanderLigne(l.id, "deactivate", { acteur, confirme: true, raison: "désarmement du mode réel" });
    const apres = (await chargerCoupures([l.id])).get(l.id) ?? [];
    const coupee = etatLigne(coupuresLite(apres)) === "disconnected" && apres.every((x) => x.observed === "disconnected" && x.progress === "confirmed");
    if (coupee) await remettreAZero(l.id, "simulation");
    par.push({ ligneId: l.id, label: l.label, coupee, detail: coupee ? "coupée et confirmée, revenue en simulation" : `coupure non confirmée (${r.detail}) : la ligne reste en réel, FERMÉE par sécurité (mode réel non permis)` });
  }
  const ok = par.every((p) => p.coupee);
  return { ok, detail: par.length === 0 ? "Mode réel désarmé. Aucune ligne n'était en réel." : ok ? `Mode réel désarmé : ${par.length} ligne(s) coupée(s) et revenue(s) en simulation.` : "Mode réel désarmé, mais au moins une ligne n'a pas pu être confirmée coupée : elle reste fermée par sécurité. Voir les incidents.", lignes: par };
}

export interface BilanReconciliation {
  lignes: number;
  coupuresCoupees: number;
  incidents: number;
  detail: string[];
}

/**
 * Réconciliation : le centre est l'autorité des lignes en réel. Une liaison réelle trouvée OUVERTE contre l'avis du centre (câble ouvert alors que la coupure n'est pas
 * confirmée, ou mode réel non permis) est COUPÉE et signalée ; une liaison fermée alors que le centre la croit connectée marque la coupure en échec. Jamais l'inverse :
 * le centre ne rouvre rien.
 */
export async function reconcilierLiaisonsReelles(acteur: Acteur = { type: "system" }): Promise<BilanReconciliation> {
  const bilan: BilanReconciliation = { lignes: 0, coupuresCoupees: 0, incidents: 0, detail: [] };
  const permis = await reelAutorise();
  const reelles = await dbFrontier().select().from(lines).where(eq(lines.kind, "real"));
  for (const l of reelles) {
    const cs = (await chargerCoupures([l.id])).get(l.id) ?? [];
    const coupuresReelles = cs.filter((x) => x.mode === "real");
    if (coupuresReelles.length === 0) continue;
    bilan.lignes += 1;
    for (const x of coupuresReelles) {
      const a = adaptateurDe(x, l);
      if (!a.liaison) continue;
      const constat = await a.liaison.lire().catch(() => ({ passe: null, preuve: "lecture impossible", observeLe: null }));
      const centreDitConnecte = permis && x.requested === "activate" && x.progress === "confirmed" && x.observed === "connected";
      if (constat.passe === true && !centreDitConnecte) {
        const r = x.side === "remote" ? { ok: true, detail: "ordre de coupure donné à la Boutique" } : await a.liaison.appliquer("deactivate", { commandeId: null, acteurId: null });
        if (x.side === "remote") {
          const [dejaDonne] = await dbFrontier().select({ id: remoteOrders.id }).from(remoteOrders).where(and(eq(remoteOrders.lineId, l.id), eq(remoteOrders.wanted, "deactivate"), inArray(remoteOrders.status, ["pending", "delivered"]), gt(remoteOrders.expiresAt, sql`now()`))).limit(1);
          if (!dejaDonne) await dbFrontier().insert(remoteOrders).values({ lineId: l.id, cutId: x.id, wanted: "deactivate", expiresAt: new Date(Date.now() + 120_000) });
        }
        bilan.coupuresCoupees += 1;
        bilan.incidents += 1;
        await ouvrirIncident({ severite: "warning", kind: "liaison_ouverte_hors_centre", resume: `La liaison réelle de la coupure « ${x.side} » de la ligne « ${l.label} » était ouverte alors que le centre ne la donnait pas connectée${permis ? "" : " (mode réel non permis)"} : coupée par sécurité.`, ligneId: l.id, coupureId: x.id, detail: { preuve: constat.preuve, coupure: r.detail } });
        await journaliser({ acteur, action: "reconcile_cut", cible: "cut", cibleId: x.id, resultat: r.ok ? "ok" : "error", erreur: r.ok ? undefined : r.detail, detail: { ligne: l.id, cote: x.side, preuve: constat.preuve } });
        bilan.detail.push(`${l.label} · ${x.side} : liaison ouverte hors centre → coupée`);
      } else if (constat.passe === false && centreDitConnecte) {
        await dbFrontier().update(cuts).set({ progress: "failed", observed: "disconnected", error: "La liaison réelle est fermée alors que le centre la croyait connectée.", lastCheckedAt: new Date(), lastProof: constat.preuve.slice(0, 200), updatedAt: new Date() }).where(eq(cuts.id, x.id));
        await dbFrontier().update(gates).set({ open: false, changedAt: new Date() }).where(eq(gates.cutId, x.id));
        bilan.incidents += 1;
        await ouvrirIncident({ severite: "critical", kind: "liaison_fermee_hors_centre", resume: `La liaison réelle de la coupure « ${x.side} » de la ligne « ${l.label} » est fermée alors que le centre la croyait connectée : coupure marquée en échec, rien n'est rouvert.`, ligneId: l.id, coupureId: x.id, detail: { preuve: constat.preuve } });
        bilan.detail.push(`${l.label} · ${x.side} : liaison fermée hors centre → coupure en échec`);
      }
    }
  }
  return bilan;
}

// ───────────────────────── Vue ─────────────────────────
export async function reelVue(pdgId: number) {
  const permisEnv = reelPermisParEnvironnement();
  const arme = await reelArme();
  const reelles = await dbFrontier().select().from(lines).where(eq(lines.kind, "real")).orderBy(lines.groupCode, lines.position);
  const coup = await chargerCoupures(reelles.map((l) => l.id));
  const lignesVue = reelles.map((l) => {
    const cs = coup.get(l.id) ?? [];
    const natures = cs.map((x) => {
      const a = adaptateurDe(x, l);
      return { side: x.side, mode: x.mode, liaison: a.nom, libelle: a.libelle, disponible: a.disponible, raison: a.raison ?? null };
    });
    const reel = natures.filter((n) => n.mode === "real").length;
    return { id: l.id, label: l.label, intermediaire: l.intermediaryRef, canal: l.channel, regime: reel === 0 ? ("simulation" as const) : reel === natures.length ? ("reel" as const) : ("mixte" as const), etat: etatLigne(coupuresLite(cs)), natures, peutPasserEnReel: natures.length === 3 && natures.every((n) => n.disponible) && l.validity === "valid" };
  });
  // Accès sécurisés MESURÉS (présence seulement, jamais une valeur) : clés publiques de la Boutique, secrets du Coffre, prérequis de chaque canal.
  let acces: { canal: string; manques: string[] }[] | null = null;
  let clesBoutique: number | null = null;
  try {
    const service = await import("../shop-link/service.js");
    const { CANAUX, CANAUX_IDS } = await import("../shop-link/contrats.js");
    clesBoutique = (await service.clesActives()).length;
    acces = [];
    for (const id of CANAUX_IDS) if (CANAUX[id].activation === "disponible") acces.push({ canal: id, manques: await service.prerequis(id, pdgId) });
  } catch {
    acces = null;
  }
  return {
    environnement: { variable: ENV_MODE_REEL, posee: permisEnv },
    arme,
    autorise: permisEnv && arme,
    phrase: PHRASE_ARMEMENT,
    lignes: lignesVue,
    acces,
    clesBoutique,
    resteSimule: [
      "Tout ce qui est en mode simulation : une ligne ne devient réelle que par l'acte explicite du PDG, quand le mode réel est permis.",
      "Interrupteur local de la Boutique : réel seulement quand la Boutique exécute l'émetteur (ordres signés et accusés) ; sans rapport signé et frais, son état est INCONNU, jamais connecté.",
      "Lignes « paiement » et « google » : liaison indisponible tant que l'activation externe côté Boutique n'a pas eu lieu.",
      "Ligne « main-to-shop-entry » : aucun canal côté plateforme, donc aucun câble à commander.",
    ],
  };
}
