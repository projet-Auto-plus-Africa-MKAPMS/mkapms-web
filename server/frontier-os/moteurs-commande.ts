/**
 * Moteurs de COMMANDE : ils préparent et exécutent. Ils écrivent la porte du transport (actionneurs) ou ordonnent les coupures (chef de ligne,
 * grand contact du groupe, interrupteur général). Ils n'établissent JAMAIS le résultat observé : c'est le travail des moteurs de vérification
 * (moteurs-verification.ts), un autre code, un autre identifiant.
 */
import { eq } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { cuts, gates, groups, lines } from "./base/schema.js";
import { enregistrer, RefusMoteur } from "./bus.js";
import { chargerCoupures, coupuresLite, ligneLite } from "./chaine.js";
import { adaptateurDe } from "./liaisons-reelles.js";
import { reelAutorise } from "./reel-etat.js";
import { ligneAdmissible, ORDRE_ACTIVATION, ORDRE_DESACTIVATION } from "./regles.js";
import { continuite } from "./transport.js";
import type { CoteCoupure } from "./base/schema.js";

export interface ContenuCoupure {
  coupureId: number;
  voulu: "activate" | "deactivate";
  commandeId?: number;
  /** Qui commande (pour tracer le câble réel) ; absent : le système. */
  acteurId?: number | string | null;
}

const COTES: readonly CoteCoupure[] = ["remote", "center", "main"];

function brancherActionneur(cote: CoteCoupure): void {
  const code = `center:cmd.cut.${cote}`;
  enregistrer(code, "commande.preparer", async (m) => {
    const c = m.contenu as ContenuCoupure;
    const [cut] = await dbFrontier().select().from(cuts).where(eq(cuts.id, c.coupureId)).limit(1);
    if (!cut) throw new RefusMoteur("COUPURE_INCONNUE", `Coupure ${c.coupureId} inconnue.`);
    if (cut.side !== cote) throw new RefusMoteur("MAUVAIS_COTE", `Ce moteur dessert le côté « ${cote} », pas « ${cut.side} ».`);
    const passe = await continuite(cut.id);
    const but = c.voulu === "activate";
    return { plan: passe === but ? "aucun changement" : but ? "établir la continuité du contact" : "rompre la continuité du contact", continuiteActuelle: passe };
  });
  enregistrer(code, "commande.appliquer", async (m, ctx) => {
    const c = m.contenu as ContenuCoupure;
    const [cut] = await dbFrontier().select().from(cuts).where(eq(cuts.id, c.coupureId)).limit(1);
    if (!cut || cut.side !== cote) throw new RefusMoteur("COUPURE_INCONNUE", `Coupure ${c.coupureId} non desservie par ce moteur.`);
    const but = c.voulu === "activate";
    // Contact bloqué (simulation) : l'actionneur croit avoir agi et le dit ; la sonde dira autre chose.
    if (ctx.defaut === "bloque") return { applique: true, continuite: await continuite(cut.id), note: "contact bloqué (panne simulée)" };
    const ecrirePorte = () => dbFrontier().update(gates).set({ open: but, changedAt: new Date(), changedBy: c.commandeId ?? null }).where(eq(gates.cutId, cut.id));
    if (cut.mode !== "real") {
      await ecrirePorte();
      return { applique: true, continuite: but };
    }
    // Coupure RÉELLE : on n'ouvre jamais la porte avant que la liaison réelle ait dit oui ; on la FERME toujours avant d'agir sur la liaison.
    if (but && !(await reelAutorise())) throw new RefusMoteur("MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas permis (variable d'environnement et armement du PDG requis) : l'activation est refusée.");
    const [ligne] = await dbFrontier().select().from(lines).where(eq(lines.id, cut.lineId)).limit(1);
    const adaptateur = adaptateurDe(cut, ligne!);
    if (but && !adaptateur.disponible) throw new RefusMoteur("LIAISON_ABSENTE", adaptateur.raison ?? "Aucune liaison réelle pour cette coupure.");
    if (!but) await ecrirePorte();
    let detailLiaison = "porte du centre";
    if (adaptateur.liaison) {
      const r = await adaptateur.liaison.appliquer(c.voulu, { commandeId: c.commandeId ?? null, acteurId: c.acteurId ?? null });
      detailLiaison = r.detail;
      if (!r.ok && but) throw new RefusMoteur("LIAISON_REELLE", r.detail);
    }
    if (but) await ecrirePorte();
    return { applique: true, continuite: but, reel: true, note: detailLiaison };
  });
  enregistrer(code, "sante.verifier", async () => {
    await dbFrontier().select({ id: gates.cutId }).from(gates).limit(1);
    return { ok: true };
  });
}

export interface PlanLigne {
  ligneId: number;
  coupures: { side: CoteCoupure; coupureId: number }[];
}

/** Le plan ordonné des trois coupures d'une ligne. Utilisé par le chef de ligne et, pour une COUPURE, par le secours si ce moteur est en panne. */
export async function planDeLigne(ligneId: number, voulu: "activate" | "deactivate"): Promise<PlanLigne> {
  const [ligne] = await dbFrontier().select().from(lines).where(eq(lines.id, ligneId)).limit(1);
  if (!ligne || ligne.kind !== "real") throw new RefusMoteur("LIGNE_INCONNUE", `Ligne ${ligneId} inconnue ou vide : rien à commander.`);
  const coupures = (await chargerCoupures([ligneId])).get(ligneId) ?? [];
  const ordre = voulu === "activate" ? ORDRE_ACTIVATION : ORDRE_DESACTIVATION;
  const plan: PlanLigne = { ligneId, coupures: ordre.map((side) => ({ side, coupureId: coupures.find((c) => c.side === side)?.id ?? -1 })) };
  if (plan.coupures.some((c) => c.coupureId < 0)) throw new RefusMoteur("COUPURES_INCOMPLETES", "Les trois coupures de la ligne ne sont pas toutes enregistrées.");
  return plan;
}

function brancherChefDeLigne(): void {
  const code = "center:cmd.line";
  enregistrer(code, "commande.preparer", async (m) => {
    const { ligneId, voulu } = m.contenu as { ligneId: number; voulu: "activate" | "deactivate" };
    return planDeLigne(ligneId, voulu);
  });
  enregistrer(code, "commande.cloturer", async (m) => {
    const { resultats } = m.contenu as { resultats: { side: CoteCoupure; statut: string }[] };
    const ok = resultats.filter((r) => r.statut === "confirmed").length;
    return { bilan: ok === resultats.length && ok > 0 ? "confirmed" : ok === 0 ? "failed" : "partial", confirmees: ok, total: resultats.length };
  });
  enregistrer(code, "sante.verifier", async () => ({ ok: true }));
}

export interface PlanGroupe {
  groupe: string;
  visees: { ligneId: number; coupureId: number }[];
  ecartees: { ligneId: number; label: string; raison: string; detail: string }[];
}

/** Les contacts centraux visés par le grand contact d'un groupe, et les lignes écartées avec leur raison. */
export async function planDeGroupe(groupe: string, voulu: "activate" | "deactivate"): Promise<PlanGroupe> {
  const [g] = await dbFrontier().select().from(groups).where(eq(groups.code, groupe)).limit(1);
  if (!g) throw new RefusMoteur("GROUPE_INCONNU", `Groupe « ${groupe} » inconnu.`);
  if (voulu === "activate" && g.contactLocked) throw new RefusMoteur("CONTACT_VERROUILLE", "Le grand contact de ce groupe est verrouillé.");
  const reelles = await dbFrontier().select().from(lines).where(eq(lines.groupCode, groupe));
  const coup = await chargerCoupures(reelles.filter((l) => l.kind === "real").map((l) => l.id));
  const plan: PlanGroupe = { groupe, visees: [], ecartees: [] };
  for (const l of reelles) {
    if (l.kind !== "real") continue; // les réserves ne sont ni visées ni listées comme écartées : elles n'existent pas encore
    const c = coup.get(l.id) ?? [];
    const centre = c.find((x) => x.side === "center");
    if (voulu === "activate") {
      const a = ligneAdmissible(ligneLite(l), coupuresLite(c));
      if (!a.ok || !centre) {
        plan.ecartees.push({ ligneId: l.id, label: l.label, raison: a.raison ?? "COUPURES_INCOMPLETES", detail: a.detail ?? "Contact central absent." });
        continue;
      }
    } else if (!centre) {
      plan.ecartees.push({ ligneId: l.id, label: l.label, raison: "COUPURES_INCOMPLETES", detail: "Contact central absent." });
      continue;
    }
    plan.visees.push({ ligneId: l.id, coupureId: centre.id });
  }
  return plan;
}

function brancherGrandContact(): void {
  const code = "center:cmd.group";
  enregistrer(code, "commande.preparer", async (m) => {
    const { groupe, voulu } = m.contenu as { groupe: string; voulu: "activate" | "deactivate" };
    return planDeGroupe(groupe, voulu);
  });
  enregistrer(code, "commande.cloturer", async (m) => {
    const { resultats } = m.contenu as { resultats: { statut: string }[] };
    const ok = resultats.filter((r) => r.statut === "confirmed").length;
    return { bilan: resultats.length === 0 ? "blocked" : ok === resultats.length ? "confirmed" : ok === 0 ? "failed" : "partial", confirmees: ok, total: resultats.length };
  });
  enregistrer(code, "sante.verifier", async () => ({ ok: true }));
}

export interface PlanGeneral {
  visees: number[];
  ecartees: { ligneId: number; label: string; raison: string; detail: string }[];
}

/** Les lignes visées par l'interrupteur général (admissibles à l'activation ; toutes à la coupure) et celles écartées avec leur raison. */
export async function planGeneral(voulu: "activate" | "deactivate", portee?: number[]): Promise<PlanGeneral> {
  const toutes = await dbFrontier().select().from(lines).where(eq(lines.kind, "real"));
  const retenues = portee ? toutes.filter((l) => portee.includes(l.id)) : toutes;
  const coup = await chargerCoupures(retenues.map((l) => l.id));
  const plan: PlanGeneral = { visees: [], ecartees: [] };
  for (const l of retenues) {
    if (voulu === "activate") {
      const a = ligneAdmissible(ligneLite(l), coupuresLite(coup.get(l.id) ?? []));
      if (!a.ok) {
        plan.ecartees.push({ ligneId: l.id, label: l.label, raison: a.raison ?? "NON_VALIDEE", detail: a.detail ?? "" });
        continue;
      }
    }
    plan.visees.push(l.id);
  }
  return plan;
}

function brancherInterrupteurGeneral(): void {
  const code = "center:cmd.general";
  enregistrer(code, "commande.preparer", async (m) => {
    const { voulu, portee } = m.contenu as { voulu: "activate" | "deactivate"; portee?: number[] };
    return planGeneral(voulu, portee);
  });
  enregistrer(code, "commande.cloturer", async (m) => {
    const { resultats } = m.contenu as { resultats: { statut: string }[] };
    const ok = resultats.filter((r) => r.statut === "confirmed").length;
    return { bilan: resultats.length === 0 ? "blocked" : ok === resultats.length ? "confirmed" : ok === 0 ? "failed" : "partial", confirmees: ok, total: resultats.length };
  });
  enregistrer(code, "sante.verifier", async () => ({ ok: true }));
}

let branche = false;
export function brancherMoteursDeCommande(): void {
  if (branche) return;
  for (const c of COTES) brancherActionneur(c);
  brancherChefDeLigne();
  brancherGrandContact();
  brancherInterrupteurGeneral();
  branche = true;
}
