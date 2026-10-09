/**
 * Centre Cyber-Électrique — le PIPELINE DE COMMANDES. Chaque commande suit les mêmes étapes, avec DEUX moteurs internes distincts :
 *
 *   1. contrôle préalable   — moteur de commande (prépare le plan)  +  moteur de vérification (contrôle les conditions) ;
 *   2. exécution            — moteur de commande (écrit la porte du transport) ;
 *   3. vérification finale  — moteur de vérification (SONDE la continuité réelle) : c'est elle, et elle seule, qui établit l'état OBSERVÉ.
 *
 * L'ordre demandé (requested) est séparé du résultat observé (observed) : une demande d'activation n'est « connectée » qu'une fois la
 * coupure confirmée par la sonde ; une demande de désactivation refuse le passage à l'instant et n'est « confirmée » que si la sonde le dit
 * (sinon : « coupure non confirmée », incident critique). Un moteur indisponible, qui ne répond pas, ou qui contredit l'autre : l'activation
 * est bloquée et un incident est enregistré. Tout est journalisé, tout est en simulation (le mode réel est refusé).
 */
import { and, eq, sql } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { commandReceipts, commands, cuts, engineBindings, groups, lines, type Command, type EtatObserve, type Mode, type StatutCommande } from "./base/schema.js";
import { envoyer as envoyerBus, type DefautMoteur, type IssueBus, type Reponse } from "./bus.js";
import { chargerLigne } from "./chaine.js";
import { ecrireConfig, journaliser, libelleActeur, ouvrirIncident, tronquer, type Acteur } from "./journal.js";
import { enregistrerMesure } from "./mesures.js";
import { brancherMoteursDeCommande, planDeGroupe, planDeLigne, planGeneral, type PlanGeneral, type PlanGroupe, type PlanLigne } from "./moteurs-commande.js";
import { brancherMoteursDeVerification } from "./moteurs-verification.js";
import { ACTION_REELLE_ACTIVEE, MODE } from "./regles.js";
import { ATTENTE_ACCUSE_MS } from "./liaisons-reelles.js";
import { reelAutorise } from "./reel-etat.js";
import { appliquerCoupure, regulariserEchangesEnVol } from "./transport.js";

brancherMoteursDeCommande();
brancherMoteursDeVerification();

export type Voulu = "activate" | "deactivate";

export interface OptionsCommande {
  acteur: Acteur;
  /** Confirmation explicite du PDG : exigée pour toute activation et pour toute coupure de groupe ou générale. */
  confirme?: boolean;
  /** Clé d'idempotence : la même clé rend la même commande, sans la rejouer. */
  cle?: string;
  mode?: Mode;
  /** Pannes à injecter, SIMULATION seulement (essais). */
  defauts?: Readonly<Record<string, DefautMoteur | undefined>>;
  delaiMs?: number;
  parentId?: number;
  raison?: string;
  /** Limite une commande générale à ces lignes (essais dans l'environnement isolé). */
  portee?: number[];
}

export interface Etape {
  phase: "precheck" | "execute" | "postcheck" | "plan";
  role: "command" | "verification";
  moteur: string;
  issue: IssueBus | "contradiction";
  detail: string;
  dureeMs: number;
}

export type CodeBlocage =
  | "CONFIRMATION_REQUISE"
  | "MODE_REEL_NON_ACTIVE"
  | "COUPURE_INCONNUE"
  | "LIGNE_INCONNUE"
  | "GROUPE_INCONNU"
  | "AUCUNE_PAIRE"
  | "MOTEUR_INDISPONIBLE"
  | "CONDITION_REFUSEE"
  | "COMMANDE_EN_COURS"
  | "AUCUNE_LIGNE_ADMISSIBLE";

export interface ResultatCommande {
  ok: boolean;
  statut: StatutCommande;
  code?: CodeBlocage | "CONTRADICTION" | "ECHEC_EXECUTION" | "ECHEC_VERIFICATION" | "PARTIEL";
  detail: string;
  commandeId: number | null;
  demande: Voulu;
  observe?: EtatObserve;
  etapes: Etape[];
  incidentId?: number;
  rejoue?: boolean;
  enfants?: ResultatCommande[];
  ecartees?: { ligneId: number; label: string; raison: string; detail: string }[];
}

const DELAI_VERROU_MS = 60_000;
const issueVersSortie = (i: IssueBus): "ok" | "refused" | "error" | "timeout" => (i === "ok" ? "ok" : i === "refuse" ? "refused" : i === "delai" ? "timeout" : "error");

async function recu(commandeId: number, e: Etape, observe: Record<string, unknown> = {}): Promise<number> {
  const [r] = await dbFrontier()
    .insert(commandReceipts)
    .values({ commandId: commandeId, engineCode: e.moteur, role: e.role, phase: e.phase === "plan" ? "precheck" : e.phase, outcome: e.issue === "contradiction" ? "contradiction" : issueVersSortie(e.issue), detail: tronquer(e.detail, 400), observed: observe, durationMs: Math.round(e.dureeMs) })
    .returning({ id: commandReceipts.id });
  await enregistrerMesure({ kind: "engine", code: e.moteur }, "latency_ms", e.dureeMs, "ms", "bus interne").catch(() => undefined);
  return r!.id;
}

/** Pannes injectables (SIMULATION seulement) : par moteur (« center:ver.cut.main ») ou pour une seule coupure (« center:ver.cut.main#12 »). */
function defautsEffectifs(d: OptionsCommande["defauts"], vers: string, contenu: unknown): Record<string, DefautMoteur | undefined> | undefined {
  if (!d) return undefined;
  const out: Record<string, DefautMoteur | undefined> = { ...d };
  const cid = (contenu as { coupureId?: number } | null)?.coupureId;
  if (cid !== undefined) {
    const specifique = d[`${vers}#${cid}`];
    if (specifique) out[vers] = specifique;
  }
  return out;
}

interface Echange<R = unknown> {
  rep: Reponse<R>;
  etape: Etape;
}
async function parler<R = unknown>(commandeId: number, e: { phase: Etape["phase"]; role: Etape["role"]; de: string; vers: string; type: Parameters<typeof envoyerBus>[0]["type"]; contenu: unknown; resume: (r: Reponse<R>) => string }, o: OptionsCommande): Promise<Echange<R>> {
  const rep = await envoyerBus<R>({ de: e.de, vers: e.vers, type: e.type, contenu: e.contenu }, { delaiMs: o.delaiMs, defauts: defautsEffectifs(o.defauts, e.vers, e.contenu), mode: o.mode ?? MODE });
  const etape: Etape = { phase: e.phase, role: e.role, moteur: e.vers, issue: rep.issue, detail: rep.ok ? e.resume(rep) : (rep.erreur ?? rep.issue), dureeMs: rep.dureeMs };
  await recu(commandeId, etape, rep.ok && rep.contenu && typeof rep.contenu === "object" ? (rep.contenu as Record<string, unknown>) : {});
  return { rep, etape };
}

async function clore(id: number, statut: StatutCommande, r: ResultatCommande): Promise<void> {
  await dbFrontier()
    .update(commands)
    .set({ status: statut, finishedAt: new Date(), result: { ok: r.ok, statut, code: r.code ?? null, detail: r.detail, observe: r.observe ?? null, etapes: r.etapes, incidentId: r.incidentId ?? null, ecartees: r.ecartees ?? [], enfants: (r.enfants ?? []).map((e) => ({ commandeId: e.commandeId, statut: e.statut, code: e.code ?? null, detail: e.detail })) } })
    .where(eq(commands.id, id));
}

async function rejouee(cle: string | undefined, demande: Voulu): Promise<ResultatCommande | null> {
  if (!cle) return null;
  const [c] = await dbFrontier().select().from(commands).where(eq(commands.idempotencyKey, cle)).limit(1);
  if (!c) return null;
  const r = c.result as Partial<ResultatCommande> & { statut?: StatutCommande };
  return { ok: c.status === "confirmed", statut: c.status, code: r.code, detail: `Commande déjà traitée (clé d'idempotence identique) : ${r.detail ?? c.status}`, commandeId: c.id, demande: c.requested ?? demande, observe: r.observe ?? undefined, etapes: (r.etapes as Etape[] | undefined) ?? [], rejoue: true };
}

async function refuserSansCommande(o: OptionsCommande, action: string, cible: string, cibleId: string | number, code: CodeBlocage, detail: string, demande: Voulu): Promise<ResultatCommande> {
  await journaliser({ acteur: o.acteur, action, cible, cibleId, resultat: "refused", erreur: code, detail: { detail } });
  return { ok: false, statut: "blocked", code, detail, commandeId: null, demande, etapes: [] };
}

async function creerCommande(kind: Command["kind"], cibleKind: Command["targetKind"], cibleId: string, voulu: Voulu, o: OptionsCommande, engineCommande: string | null, engineVerif: string | null): Promise<number> {
  const [c] = await dbFrontier()
    .insert(commands)
    .values({ kind, targetKind: cibleKind, targetId: cibleId, requested: voulu, mode: o.mode ?? MODE, status: "running", idempotencyKey: o.cle ?? null, actorType: o.acteur.type, actorId: o.acteur.id === undefined ? null : String(o.acteur.id), commandEngine: engineCommande, verificationEngine: engineVerif, parentId: o.parentId ?? null, confirmedByActor: o.confirme === true, reason: tronquer(o.raison ?? "", 300), startedAt: new Date() })
    .returning({ id: commands.id });
  return c!.id;
}

async function paire(cibleKind: "switch" | "line" | "group" | "general" | "external_engine", code: string): Promise<{ commande: string; verification: string } | null> {
  const [b] = await dbFrontier().select().from(engineBindings).where(and(eq(engineBindings.targetKind, cibleKind), eq(engineBindings.targetCode, code))).limit(1);
  return b ? { commande: b.commandEngine, verification: b.verificationEngine } : null;
}

/** Ouvre l'incident adapté à un blocage de moteur (indisponible, muet, en erreur). */
async function incidentMoteur(code: string, etape: Etape, commandeId: number, ligneId: number | null, coupureId: number | null, severite: "warning" | "critical"): Promise<number> {
  return ouvrirIncident({ severite, kind: "moteur_indisponible", resume: `Le moteur ${code} est indisponible (${etape.issue}) : ${etape.detail}`, moteur: code, ligneId, coupureId, commandeId, detail: { phase: etape.phase, issue: etape.issue } });
}

// ───────────────────────── Une coupure ─────────────────────────

export async function commanderCoupure(coupureId: number, voulu: Voulu, o: OptionsCommande): Promise<ResultatCommande> {
  const mode = o.mode ?? MODE;
  const action = voulu === "activate" ? "cut_activate" : "cut_deactivate";
  if (mode === "real" && !ACTION_REELLE_ACTIVEE) return refuserSansCommande(o, action, "cut", coupureId, "MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé : le centre ne pilote que la simulation, jusqu'à l'audit final décidé par le PDG.", voulu);
  const deja = await rejouee(o.cle, voulu);
  if (deja) return deja;
  const [cut] = await dbFrontier().select().from(cuts).where(eq(cuts.id, coupureId)).limit(1);
  if (!cut) return refuserSansCommande(o, action, "cut", coupureId, "COUPURE_INCONNUE", `Coupure ${coupureId} inconnue.`, voulu);
  if (voulu === "activate" && o.confirme !== true) return refuserSansCommande(o, action, "cut", coupureId, "CONFIRMATION_REQUISE", "Activer un contact est une action critique : confirmation requise.", voulu);
  const binding = await paire("switch", cut.elementCode);
  if (!binding) return refuserSansCommande(o, action, "cut", coupureId, "AUCUNE_PAIRE", `Aucune paire de moteurs internes (commande, vérification) pour ${cut.elementCode}.`, voulu);
  // Une coupure en mode RÉEL ne s'active que si l'environnement le permet ET si le PDG a armé. Une COUPURE, elle, passe toujours.
  if (voulu === "activate" && cut.mode === "real" && !(await reelAutorise())) return refuserSansCommande(o, action, "cut", coupureId, "MODE_REEL_NON_ACTIVE", "Cette coupure est en mode réel mais le mode réel n'est pas permis (variable d'environnement FRONTIER_MODE_REEL et armement du PDG requis) : activation refusée, fermé par sécurité.", voulu);
  // L'interrupteur distant attend l'accusé signé de la Boutique : le moteur de commande a besoin de plus de temps que le délai du bus interne.
  if (cut.mode === "real" && cut.side === "remote") o = { ...o, delaiMs: Math.max(o.delaiMs ?? 0, ATTENTE_ACCUSE_MS() + 3_000) };

  const commandeId = await creerCommande("cut", "cut", String(coupureId), voulu, { ...o, mode }, binding.commande, binding.verification);
  const etapes: Etape[] = [];
  const fin = async (r: Omit<ResultatCommande, "commandeId" | "demande" | "etapes">, statut: StatutCommande): Promise<ResultatCommande> => {
    const res: ResultatCommande = { ...r, commandeId, demande: voulu, etapes };
    await clore(commandeId, statut, res);
    await journaliser({ acteur: o.acteur, action, cible: "cut", cibleId: coupureId, resultat: statut === "confirmed" ? "ok" : statut === "blocked" ? "refused" : "error", erreur: res.code, detail: { commandeId, ligne: cut.lineId, cote: cut.side, observe: res.observe ?? null } });
    return res;
  };
  const bloque = (code: CodeBlocage, detail: string, extra: Partial<ResultatCommande> = {}) => fin({ ok: false, statut: "blocked", code, detail, ...extra }, "blocked");

  // 1. Contrôle préalable : les DEUX moteurs, chacun sa part.
  const plan = await parler(commandeId, { phase: "precheck", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.preparer", contenu: { coupureId, voulu }, resume: (r) => String((r.contenu as { plan?: string }).plan ?? "plan prêt") }, { ...o, mode });
  etapes.push(plan.etape);
  const cond = await parler(commandeId, { phase: "precheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.conditions", contenu: { coupureId, voulu }, resume: () => "conditions remplies" }, { ...o, mode });
  etapes.push(cond.etape);
  let incidentSecours: number | undefined;
  for (const [rep, e] of [[plan.rep, plan.etape], [cond.rep, cond.etape]] as const) {
    if (rep.ok) continue;
    if (rep.issue === "refuse") return bloque("CONDITION_REFUSEE", e.detail);
    const incidentId = await incidentMoteur(e.moteur, e, commandeId, cut.lineId, cut.id, voulu === "deactivate" ? "critical" : "warning");
    // L'activation échoue FERMÉE (bloquée). La coupure, elle, n'attend jamais un moteur en panne : elle est prise en compte par le transport.
    if (voulu === "activate") return bloque("MOTEUR_INDISPONIBLE", `Activation bloquée : ${e.detail}`, { incidentId });
    incidentSecours = incidentId;
  }

  // 2. Prise de la coupure (une seule commande à la fois ; un verrou périmé est repris). Une COUPURE passe toujours : elle prend la main.
  const prise = dbFrontier().update(cuts).set({ requested: voulu, progress: "pending", error: null, lastCommandId: commandeId, updatedAt: new Date() });
  const [pris] = await (voulu === "deactivate"
    ? prise.where(eq(cuts.id, coupureId))
    : prise.where(and(eq(cuts.id, coupureId), sql`(${cuts.progress} NOT IN ('pending', 'in_progress') OR ${cuts.updatedAt} < now() - (${DELAI_VERROU_MS} * interval '1 millisecond'))`))
  ).returning();
  if (!pris) return bloque("COMMANDE_EN_COURS", "Une commande est déjà en cours sur cette coupure.");

  // Une désactivation DEMANDÉE refuse le passage à l'instant et applique la règle des échanges en vol.
  if (voulu === "deactivate") await appliquerCoupure(cut.lineId, o.acteur);

  // 3. Exécution (moteur de commande).
  await dbFrontier().update(cuts).set({ progress: "in_progress", updatedAt: new Date() }).where(eq(cuts.id, coupureId));
  const exec = await parler(commandeId, { phase: "execute", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.appliquer", contenu: { coupureId, voulu, commandeId, acteurId: o.acteur.id ?? null }, resume: (r) => (((r.contenu as { applique?: boolean }).applique ? "appliqué" : "non appliqué") + ((r.contenu as { note?: string }).note ? ` (${(r.contenu as { note?: string }).note})` : "")) }, { ...o, mode });
  etapes.push(exec.etape);

  // 4. Vérification finale (moteur de vérification) — toujours, même si l'exécution a échoué : on ne devine pas l'état réel.
  const sonde = await parler<{ passe: boolean }>(commandeId, { phase: "postcheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.sonder", contenu: { coupureId, voulu }, resume: (r) => `continuité ${r.contenu?.passe ? "présente" : "absente"}` }, { ...o, mode });
  etapes.push(sonde.etape);

  const attendu: EtatObserve = voulu === "activate" ? "connected" : "disconnected";
  const observe: EtatObserve | null = sonde.rep.ok ? (sonde.rep.contenu!.passe ? "connected" : "disconnected") : null;

  let code: ResultatCommande["code"];
  let detail: string;
  let severite: "warning" | "critical" = "warning";
  let kindIncident = "";
  if (exec.rep.ok && sonde.rep.ok && observe === attendu) {
    await dbFrontier().update(cuts).set({ progress: "confirmed", observed: observe, error: null, lastCheckedAt: new Date(), lastProof: `commande:${commandeId}`, updatedAt: new Date() }).where(eq(cuts.id, coupureId));
    return fin({ ok: true, statut: "confirmed", detail: voulu === "activate" ? "Activation confirmée par la vérification : le contact laisse passer." : "Coupure confirmée par la vérification : plus rien ne passe.", observe }, "confirmed");
  }
  if (!sonde.rep.ok) {
    code = "ECHEC_VERIFICATION";
    detail = `Le moteur de vérification n'a pas pu confirmer (${sonde.etape.issue}) : état réel inconnu.`;
    kindIncident = "verification_impossible";
    severite = voulu === "deactivate" ? "critical" : "warning";
  } else if (!exec.rep.ok) {
    code = "ECHEC_EXECUTION";
    detail = `Le moteur de commande n'a pas exécuté (${exec.etape.issue}) : ${exec.etape.detail}`;
    kindIncident = "execution_impossible";
    severite = voulu === "deactivate" ? "critical" : "warning";
  } else {
    // Les deux moteurs répondent mais se contredisent : la commande dit « fait », la sonde dit autre chose.
    code = "CONTRADICTION";
    detail = `Contradiction : le moteur de commande annonce l'ordre appliqué, la vérification mesure « ${observe === "connected" ? "passe" : "ne passe pas"} » alors que « ${attendu === "connected" ? "passe" : "ne passe pas"} » est attendu.`;
    kindIncident = voulu === "deactivate" ? "coupure_non_confirmee" : "activation_non_confirmee";
    severite = voulu === "deactivate" ? "critical" : "warning";
    await recu(commandeId, { phase: "postcheck", role: "verification", moteur: binding.verification, issue: "contradiction", detail, dureeMs: 0 }, { attendu, observe });
    etapes.push({ phase: "postcheck", role: "verification", moteur: binding.verification, issue: "contradiction", detail, dureeMs: 0 });
  }
  // Activation en échec : on ne laisse jamais un contact ouvert derrière un échec (meilleur effort, sans écraser le constat).
  if (voulu === "activate") {
    await envoyerBus({ de: "center:pipeline", vers: binding.commande, type: "commande.appliquer", contenu: { coupureId, voulu: "deactivate", commandeId, acteurId: o.acteur.id ?? null } }, { delaiMs: o.delaiMs, mode }).catch(() => undefined);
  }
  await dbFrontier().update(cuts).set({ progress: "failed", observed: observe ?? "unknown", error: tronquer(detail, 300), lastCheckedAt: observe ? new Date() : null, lastProof: `commande:${commandeId}`, updatedAt: new Date() }).where(eq(cuts.id, coupureId));
  const incidentId = incidentSecours ?? await ouvrirIncident({ severite, kind: kindIncident, resume: voulu === "deactivate" ? `Coupure non confirmée sur la ligne ${cut.lineId} (${cut.side}) : ${detail}` : `Activation non confirmée sur la ligne ${cut.lineId} (${cut.side}) : ${detail}`, ligneId: cut.lineId, coupureId, moteur: code === "ECHEC_VERIFICATION" ? binding.verification : binding.commande, commandeId, detail: { attendu, observe, code } });
  return fin({ ok: false, statut: "failed", code, detail: voulu === "deactivate" ? `Coupure non confirmée. ${detail} Le transport refuse néanmoins tout passage tant que la coupure est demandée.` : detail, observe: observe ?? "unknown", incidentId }, "failed");
}

// ───────────────────────── Une ligne ─────────────────────────

export async function commanderLigne(ligneId: number, voulu: Voulu, o: OptionsCommande): Promise<ResultatCommande> {
  const mode = o.mode ?? MODE;
  const action = voulu === "activate" ? "line_activate" : "line_deactivate";
  if (mode === "real" && !ACTION_REELLE_ACTIVEE) return refuserSansCommande(o, action, "line", ligneId, "MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé.", voulu);
  const deja = await rejouee(o.cle, voulu);
  if (deja) return deja;
  const c = await chargerLigne(ligneId);
  if (!c || c.ligne.kind !== "real") return refuserSansCommande(o, action, "line", ligneId, "LIGNE_INCONNUE", `Ligne ${ligneId} inconnue ou vide : rien à commander.`, voulu);
  if (voulu === "activate" && o.confirme !== true) return refuserSansCommande(o, action, "line", ligneId, "CONFIRMATION_REQUISE", "Activer une ligne est une action critique : confirmation requise.", voulu);
  const binding = await paire("line", `line:${ligneId}`);
  if (!binding) return refuserSansCommande(o, action, "line", ligneId, "AUCUNE_PAIRE", "Aucune paire de moteurs internes pour cette ligne.", voulu);

  const commandeId = await creerCommande("line", "line", String(ligneId), voulu, { ...o, mode }, binding.commande, binding.verification);
  const etapes: Etape[] = [];
  const fin = async (r: Omit<ResultatCommande, "commandeId" | "demande" | "etapes">, statut: StatutCommande): Promise<ResultatCommande> => {
    const res: ResultatCommande = { ...r, commandeId, demande: voulu, etapes };
    await clore(commandeId, statut, res);
    await journaliser({ acteur: o.acteur, action, cible: "line", cibleId: ligneId, resultat: statut === "confirmed" ? "ok" : statut === "blocked" ? "refused" : "error", erreur: res.code, detail: { commandeId, enfants: (res.enfants ?? []).map((e) => `${e.commandeId}:${e.statut}`) } });
    return res;
  };

  const plan = await parler<PlanLigne>(commandeId, { phase: "precheck", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.preparer", contenu: { ligneId, voulu }, resume: () => "plan des trois coupures prêt" }, { ...o, mode });
  etapes.push(plan.etape);
  const cond = await parler(commandeId, { phase: "precheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.conditions", contenu: { ligneId, voulu }, resume: () => "conditions remplies" }, { ...o, mode });
  etapes.push(cond.etape);
  let planUtilise: PlanLigne | null = plan.rep.ok ? plan.rep.contenu! : null;
  let incidentSecours: number | undefined;
  for (const [rep, e] of [[plan.rep, plan.etape], [cond.rep, cond.etape]] as const) {
    if (rep.ok) continue;
    if (rep.issue === "refuse") return fin({ ok: false, statut: "blocked", code: "CONDITION_REFUSEE", detail: e.detail }, "blocked");
    const incidentId = await incidentMoteur(e.moteur, e, commandeId, ligneId, null, voulu === "deactivate" ? "critical" : "warning");
    if (voulu === "activate") return fin({ ok: false, statut: "blocked", code: "MOTEUR_INDISPONIBLE", detail: `Activation bloquée : ${e.detail}`, incidentId }, "blocked");
    incidentSecours = incidentId; // une coupure ne dépend pas d'un moteur d'orchestration en panne
  }
  if (!planUtilise) planUtilise = await planDeLigne(ligneId, voulu);

  const enfants: ResultatCommande[] = [];
  const faites: number[] = [];
  for (const etape of planUtilise.coupures) {
    const r = await commanderCoupure(etape.coupureId, voulu, { ...o, mode, confirme: true, cle: undefined, parentId: commandeId });
    enfants.push(r);
    if (r.ok) faites.push(etape.coupureId);
    if (!r.ok && voulu === "activate") break; // une ligne ne reste jamais à moitié branchée
  }
  if (voulu === "activate" && enfants.some((e) => !e.ok)) {
    // Défaire ce que CETTE commande a établi.
    for (const id of [...faites].reverse()) enfants.push(await commanderCoupure(id, "deactivate", { ...o, mode, cle: undefined, parentId: commandeId, raison: "Retour arrière d'une activation de ligne échouée" }));
  }

  const resumes = planUtilise.coupures.map((cp, i) => ({ side: cp.side, statut: enfants[i]?.statut ?? "pending" }));
  const clot = await parler<{ bilan: string }>(commandeId, { phase: "execute", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.cloturer", contenu: { resultats: resumes }, resume: (r) => `bilan côté commande : ${r.contenu?.bilan}` }, { ...o, mode });
  etapes.push(clot.etape);
  const agreg = await parler<{ etat: string; coherent: boolean }>(commandeId, { phase: "postcheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.agreger", contenu: { ligneId, voulu }, resume: (r) => `ligne recomptée : ${r.contenu?.etat}${r.contenu?.coherent ? ", cohérente" : ", INCOHÉRENTE"}` }, { ...o, mode });
  etapes.push(agreg.etape);

  const tout = resumes.every((r) => r.statut === "confirmed");
  const aucun = resumes.every((r) => r.statut !== "confirmed");
  const coherent = agreg.rep.ok && agreg.rep.contenu!.coherent;
  if (tout && coherent && (voulu === "deactivate" || enfants.every((e) => e.ok))) {
    return fin({ ok: true, statut: "confirmed", detail: voulu === "activate" ? "Ligne activée : les trois coupures sont confirmées et la sonde de bout en bout traverse." : "Ligne coupée : les trois coupures sont confirmées et la sonde de bout en bout est refusée.", enfants }, "confirmed");
  }
  if (tout && !coherent) {
    const incidentId = await ouvrirIncident({ severite: "critical", kind: "ligne_incoherente", resume: `La ligne ${ligneId} est incohérente après commande : les trois coupures sont confirmées mais la vérification de bout en bout n'est pas d'accord.`, ligneId, commandeId, detail: { agreg: agreg.rep.contenu ?? null, erreur: agreg.rep.erreur ?? null } });
    return fin({ ok: false, statut: "failed", code: "CONTRADICTION", detail: "Les coupures sont confirmées mais le contrôle de bout en bout est en désaccord.", enfants, incidentId }, "failed");
  }
  const partiel = voulu === "deactivate" && !aucun;
  return fin({ ok: false, statut: partiel ? "partial" : "failed", code: partiel ? "PARTIEL" : (enfants.find((e) => !e.ok)?.code ?? "ECHEC_EXECUTION"), detail: partiel ? "Coupure PARTIELLE : au moins une coupure n'est pas confirmée (voir l'incident critique)." : (enfants.find((e) => !e.ok)?.detail ?? "Activation échouée."), enfants, incidentId: enfants.find((e) => e.incidentId)?.incidentId }, partiel ? "partial" : "failed");
}

// ───────────────────────── Un groupe : le grand contact rouge ─────────────────────────

export async function commanderGroupe(groupeCode: string, voulu: Voulu, o: OptionsCommande): Promise<ResultatCommande> {
  const mode = o.mode ?? MODE;
  const action = voulu === "activate" ? "group_activate" : "group_deactivate";
  if (mode === "real" && !ACTION_REELLE_ACTIVEE) return refuserSansCommande(o, action, "group", groupeCode, "MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé.", voulu);
  const deja = await rejouee(o.cle, voulu);
  if (deja) return deja;
  const [g] = await dbFrontier().select().from(groups).where(eq(groups.code, groupeCode)).limit(1);
  if (!g) return refuserSansCommande(o, action, "group", groupeCode, "GROUPE_INCONNU", `Groupe « ${groupeCode} » inconnu.`, voulu);
  if (o.confirme !== true) return refuserSansCommande(o, action, "group", groupeCode, "CONFIRMATION_REQUISE", "Le grand contact d'un groupe commande tous ses contacts centraux : confirmation requise.", voulu);
  const binding = await paire("group", `group:${groupeCode}`);
  if (!binding) return refuserSansCommande(o, action, "group", groupeCode, "AUCUNE_PAIRE", "Aucune paire de moteurs internes pour ce groupe.", voulu);

  const commandeId = await creerCommande("group", "group", groupeCode, voulu, { ...o, mode }, binding.commande, binding.verification);
  const etapes: Etape[] = [];
  const fin = async (r: Omit<ResultatCommande, "commandeId" | "demande" | "etapes">, statut: StatutCommande): Promise<ResultatCommande> => {
    const res: ResultatCommande = { ...r, commandeId, demande: voulu, etapes };
    await clore(commandeId, statut, res);
    await journaliser({ acteur: o.acteur, action, cible: "group", cibleId: groupeCode, resultat: statut === "confirmed" ? "ok" : statut === "blocked" ? "refused" : "error", erreur: res.code, detail: { commandeId, visees: (res.enfants ?? []).length, ecartees: (res.ecartees ?? []).length } });
    return res;
  };

  const plan = await parler<PlanGroupe>(commandeId, { phase: "precheck", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.preparer", contenu: { groupe: groupeCode, voulu }, resume: (r) => `${r.contenu?.visees.length} contact(s) central(aux) visé(s), ${r.contenu?.ecartees.length} ligne(s) écartée(s)` }, { ...o, mode });
  etapes.push(plan.etape);
  const cond = await parler(commandeId, { phase: "precheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.conditions", contenu: { groupe: groupeCode }, resume: () => "conditions remplies" }, { ...o, mode });
  etapes.push(cond.etape);
  let planG: PlanGroupe | null = plan.rep.ok ? plan.rep.contenu! : null;
  for (const [rep, e] of [[plan.rep, plan.etape], [cond.rep, cond.etape]] as const) {
    if (rep.ok) continue;
    if (rep.issue === "refuse") return fin({ ok: false, statut: "blocked", code: "CONDITION_REFUSEE", detail: e.detail }, "blocked");
    const incidentId = await incidentMoteur(e.moteur, e, commandeId, null, null, voulu === "deactivate" ? "critical" : "warning");
    if (voulu === "activate") return fin({ ok: false, statut: "blocked", code: "MOTEUR_INDISPONIBLE", detail: `Activation bloquée : ${e.detail}`, incidentId }, "blocked");
  }
  if (!planG) planG = await planDeGroupe(groupeCode, voulu);
  const p = planG;
  if (p.visees.length === 0) return fin({ ok: false, statut: "blocked", code: "AUCUNE_LIGNE_ADMISSIBLE", detail: "Aucune ligne admissible dans ce groupe : rien n'a été commandé.", ecartees: p.ecartees }, "blocked");

  const enfants: ResultatCommande[] = [];
  for (const v of p.visees) enfants.push(await commanderCoupure(v.coupureId, voulu, { ...o, mode, confirme: true, cle: undefined, parentId: commandeId }));
  const clot = await parler<{ bilan: string }>(commandeId, { phase: "execute", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.cloturer", contenu: { resultats: enfants.map((e) => ({ statut: e.statut })) }, resume: (r) => `bilan côté commande : ${r.contenu?.bilan}` }, { ...o, mode });
  etapes.push(clot.etape);
  const agreg = await parler<{ connectes: number; deconnectes: number; centres: number }>(commandeId, { phase: "postcheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.agreger", contenu: { groupe: groupeCode, ligneIds: p.visees.map((v) => v.ligneId) }, resume: (r) => `${r.contenu?.connectes}/${r.contenu?.centres} contact(s) connecté(s), ${r.contenu?.deconnectes} déconnecté(s)` }, { ...o, mode });
  etapes.push(agreg.etape);

  const ok = enfants.filter((e) => e.ok).length;
  const attendu = voulu === "activate" ? agreg.rep.contenu?.connectes : agreg.rep.contenu?.deconnectes;
  const coherent = agreg.rep.ok && attendu === ok;
  if (ok === enfants.length && coherent) return fin({ ok: true, statut: "confirmed", detail: `${ok} contact(s) central(aux) ${voulu === "activate" ? "fermé(s)" : "ouvert(s)"} et confirmé(s).${p.ecartees.length ? ` ${p.ecartees.length} ligne(s) écartée(s).` : ""}`, enfants, ecartees: p.ecartees }, "confirmed");
  const statut: StatutCommande = ok === 0 ? "failed" : "partial";
  const incidentId = await ouvrirIncident({ severite: voulu === "deactivate" ? "critical" : "warning", kind: ok === 0 ? "groupe_en_echec" : "groupe_partiel", resume: `Commande de groupe « ${groupeCode} » ${ok === 0 ? "en échec" : `PARTIELLE : ${ok}/${enfants.length} contact(s) confirmé(s)`}.`, commandeId, detail: { echecs: enfants.filter((e) => !e.ok).map((e) => ({ commande: e.commandeId, code: e.code ?? null })) } });
  return fin({ ok: false, statut, code: ok === 0 ? "ECHEC_EXECUTION" : "PARTIEL", detail: ok === 0 ? "Aucun contact central n'a été confirmé." : `Défaillance PARTIELLE : ${ok} contact(s) confirmé(s) sur ${enfants.length}.`, enfants, ecartees: p.ecartees, incidentId }, statut);
}

// ───────────────────────── Le général ─────────────────────────

export async function commanderGeneral(voulu: Voulu, o: OptionsCommande): Promise<ResultatCommande> {
  const mode = o.mode ?? MODE;
  const action = voulu === "activate" ? "general_activate" : "general_deactivate";
  if (mode === "real" && !ACTION_REELLE_ACTIVEE) return refuserSansCommande(o, action, "general", "*", "MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé.", voulu);
  const deja = await rejouee(o.cle, voulu);
  if (deja) return deja;
  if (o.confirme !== true) return refuserSansCommande(o, action, "general", "*", "CONFIRMATION_REQUISE", "L'interrupteur général commande toutes les lignes : confirmation requise.", voulu);
  const binding = await paire("general", "general");
  if (!binding) return refuserSansCommande(o, action, "general", "*", "AUCUNE_PAIRE", "Aucune paire de moteurs internes pour l'interrupteur général.", voulu);

  const commandeId = await creerCommande("general", "general", "*", voulu, { ...o, mode }, binding.commande, binding.verification);
  const etapes: Etape[] = [];
  const fin = async (r: Omit<ResultatCommande, "commandeId" | "demande" | "etapes">, statut: StatutCommande): Promise<ResultatCommande> => {
    const res: ResultatCommande = { ...r, commandeId, demande: voulu, etapes };
    await clore(commandeId, statut, res);
    await journaliser({ acteur: o.acteur, action, cible: "general", cibleId: "*", resultat: statut === "confirmed" ? "ok" : statut === "blocked" ? "refused" : "error", erreur: res.code, detail: { commandeId, lignes: (res.enfants ?? []).length, ecartees: (res.ecartees ?? []).length } });
    return res;
  };

  const plan = await parler<PlanGeneral>(commandeId, { phase: "precheck", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.preparer", contenu: { voulu, portee: o.portee }, resume: (r) => `${r.contenu?.visees.length} ligne(s) visée(s), ${r.contenu?.ecartees.length} écartée(s)` }, { ...o, mode });
  etapes.push(plan.etape);
  const cond = await parler(commandeId, { phase: "precheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.conditions", contenu: {}, resume: () => "conditions remplies" }, { ...o, mode });
  etapes.push(cond.etape);
  let planX: PlanGeneral | null = plan.rep.ok ? plan.rep.contenu! : null;
  for (const [rep, e] of [[plan.rep, plan.etape], [cond.rep, cond.etape]] as const) {
    if (rep.ok) continue;
    if (rep.issue === "refuse") return fin({ ok: false, statut: "blocked", code: "CONDITION_REFUSEE", detail: e.detail }, "blocked");
    const incidentId = await incidentMoteur(e.moteur, e, commandeId, null, null, voulu === "deactivate" ? "critical" : "warning");
    if (voulu === "activate") return fin({ ok: false, statut: "blocked", code: "MOTEUR_INDISPONIBLE", detail: `Activation bloquée : ${e.detail}`, incidentId }, "blocked");
  }
  if (!planX) planX = await planGeneral(voulu, o.portee);
  const p = planX;
  if (p.visees.length === 0) return fin({ ok: false, statut: "blocked", code: "AUCUNE_LIGNE_ADMISSIBLE", detail: "Aucune ligne admissible : rien n'a été commandé.", ecartees: p.ecartees }, "blocked");

  const enfants: ResultatCommande[] = [];
  for (const id of p.visees) enfants.push(await commanderLigne(id, voulu, { ...o, mode, confirme: true, cle: undefined, parentId: commandeId }));
  const clot = await parler<{ bilan: string }>(commandeId, { phase: "execute", role: "command", de: "center:pipeline", vers: binding.commande, type: "commande.cloturer", contenu: { resultats: enfants.map((e) => ({ statut: e.statut })) }, resume: (r) => `bilan côté commande : ${r.contenu?.bilan}` }, { ...o, mode });
  etapes.push(clot.etape);
  const agreg = await parler<{ connectees: number; deconnectees: number; total: number }>(commandeId, { phase: "postcheck", role: "verification", de: "center:pipeline", vers: binding.verification, type: "verification.agreger", contenu: { ligneIds: p.visees }, resume: (r) => `${r.contenu?.connectees} connectée(s), ${r.contenu?.deconnectees} déconnectée(s) sur ${r.contenu?.total}` }, { ...o, mode });
  etapes.push(agreg.etape);

  const ok = enfants.filter((e) => e.ok).length;
  const attendu = voulu === "activate" ? agreg.rep.contenu?.connectees : agreg.rep.contenu?.deconnectees;
  const coherent = agreg.rep.ok && attendu === ok;
  if (ok === enfants.length && coherent) return fin({ ok: true, statut: "confirmed", detail: `${ok} ligne(s) ${voulu === "activate" ? "activée(s)" : "coupée(s)"} et confirmée(s).${p.ecartees.length ? ` ${p.ecartees.length} ligne(s) écartée(s) (verrouillée, en erreur, vide ou non validée).` : ""}`, enfants, ecartees: p.ecartees }, "confirmed");
  const statut: StatutCommande = ok === 0 ? "failed" : "partial";
  const incidentId = await ouvrirIncident({ severite: voulu === "deactivate" ? "critical" : "warning", kind: ok === 0 ? "general_en_echec" : "general_partiel", resume: `Commande générale ${ok === 0 ? "en échec" : `PARTIELLE : ${ok}/${enfants.length} ligne(s) confirmée(s)`}.`, commandeId, detail: { echecs: enfants.map((e, i) => ({ ligne: p.visees[i], statut: e.statut, code: e.code ?? null })).filter((e) => e.statut !== "confirmed") } });
  return fin({ ok: false, statut, code: ok === 0 ? "ECHEC_EXECUTION" : "PARTIEL", detail: ok === 0 ? "Aucune ligne n'a été confirmée." : `Défaillance PARTIELLE : ${ok} ligne(s) confirmée(s) sur ${enfants.length}.`, enfants, ecartees: p.ecartees, incidentId }, statut);
}

// ───────────────────────── Verrou et activation administrative d'une ligne ─────────────────────────

/** Verrouille une ligne : elle est d'abord COUPÉE (un verrou ne laisse jamais passer), puis marquée verrouillée. Le déverrouillage ne rebranche rien. */
export async function verrouillerLigne(ligneId: number, o: OptionsCommande): Promise<{ ok: boolean; detail: string; coupure?: ResultatCommande }> {
  const c = await chargerLigne(ligneId);
  if (!c || c.ligne.kind !== "real") return { ok: false, detail: "Ligne inconnue ou vide : une réserve ne se verrouille pas." };
  if (o.confirme !== true) {
    await journaliser({ acteur: o.acteur, action: "line_lock", cible: "line", cibleId: ligneId, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Verrouiller une ligne est une action critique : confirmation requise." };
  }
  const coupure = await commanderLigne(ligneId, "deactivate", { ...o, confirme: true, raison: "Coupure préalable au verrouillage" });
  await dbFrontier().update(lines).set({ locked: true, updatedAt: new Date() }).where(eq(lines.id, ligneId));
  await ecrireConfig(`ligne.${ligneId}.verrou`, true, o.acteur);
  await journaliser({ acteur: o.acteur, action: "line_lock", cible: "line", cibleId: ligneId, resultat: "ok", detail: { coupure: coupure.statut } });
  return { ok: true, detail: coupure.ok ? "Ligne coupée puis verrouillée." : `Ligne verrouillée (le transport la refuse) ; la coupure préalable n'est pas entièrement confirmée : ${coupure.detail}`, coupure };
}

export async function deverrouillerLigne(ligneId: number, o: OptionsCommande): Promise<{ ok: boolean; detail: string }> {
  const c = await chargerLigne(ligneId);
  if (!c || c.ligne.kind !== "real") return { ok: false, detail: "Ligne inconnue ou vide." };
  if (o.confirme !== true) {
    await journaliser({ acteur: o.acteur, action: "line_unlock", cible: "line", cibleId: ligneId, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Déverrouiller une ligne est une action critique : confirmation requise." };
  }
  await dbFrontier().update(lines).set({ locked: false, updatedAt: new Date() }).where(eq(lines.id, ligneId));
  await ecrireConfig(`ligne.${ligneId}.verrou`, false, o.acteur);
  await journaliser({ acteur: o.acteur, action: "line_unlock", cible: "line", cibleId: ligneId, resultat: "ok" });
  return { ok: true, detail: "Ligne déverrouillée. Elle reste coupée : rien n'est rebranché automatiquement." };
}

/** Active ou désactive administrativement une ligne réelle. Désactiver la COUPE d'abord. Une réserve ne s'active jamais. */
export async function definirLigneActivee(ligneId: number, activee: boolean, o: OptionsCommande): Promise<{ ok: boolean; detail: string }> {
  const c = await chargerLigne(ligneId);
  if (!c) return { ok: false, detail: "Ligne inconnue." };
  if (c.ligne.kind !== "real") {
    await journaliser({ acteur: o.acteur, action: "line_enable", cible: "line", cibleId: ligneId, resultat: "refused", erreur: "LIGNE_VIDE" });
    return { ok: false, detail: "Une ligne de réserve « À venir » reste vide et désactivée : elle n'est pas un moteur installé." };
  }
  if (o.confirme !== true) return { ok: false, detail: "Confirmation requise." };
  if (!activee) await commanderLigne(ligneId, "deactivate", { ...o, confirme: true, raison: "Coupure préalable à la désactivation de la ligne" });
  await dbFrontier().update(lines).set({ enabled: activee, updatedAt: new Date() }).where(eq(lines.id, ligneId));
  await ecrireConfig(`ligne.${ligneId}.activee`, activee, o.acteur);
  await journaliser({ acteur: o.acteur, action: activee ? "line_enable" : "line_disable", cible: "line", cibleId: ligneId, resultat: "ok" });
  return { ok: true, detail: activee ? "Ligne activée (administrativement) : elle reste coupée jusqu'à une commande." : "Ligne coupée puis désactivée." };
}

// ───────────────────────── Reprise après redémarrage ─────────────────────────

export interface BilanReprise {
  commandesInterrompues: number;
  coupuresReprises: number;
  portesFermees: number;
  echangesRegles: number;
}

/**
 * À chaque démarrage : ce qui était en cours n'est JAMAIS continué en rebranchant. Les commandes interrompues sont closes en échec, une
 * activation interrompue referme sa porte, une coupure interrompue reste coupée ; les échanges en vol suivent la règle documentée. Aucune
 * liaison n'est rétablie automatiquement : après un redémarrage, ce qui était coupé reste coupé et une réserve reste désactivée.
 */
export async function reprendreApresRedemarrage(acteur: Acteur = { type: "system" }): Promise<BilanReprise> {
  const db = dbFrontier();
  const bilan: BilanReprise = { commandesInterrompues: 0, coupuresReprises: 0, portesFermees: 0, echangesRegles: 0 };
  const cmd = await db.update(commands).set({ status: "failed", finishedAt: new Date(), result: { ok: false, detail: "Interrompue par un redémarrage du centre.", code: "INTERROMPUE" } }).where(sql`${commands.status} IN ('running', 'pending')`).returning({ id: commands.id });
  bilan.commandesInterrompues = cmd.length;
  const occupees = await db.select().from(cuts).where(sql`${cuts.progress} IN ('pending', 'in_progress')`);
  for (const c of occupees) {
    if (c.requested === "activate") {
      await db.execute(sql`UPDATE frontier.gates SET open = false, changed_at = now() WHERE cut_id = ${c.id}`);
      bilan.portesFermees += 1;
    }
    await db.update(cuts).set({ progress: "failed", observed: "unknown", error: "Interrompue par un redémarrage : la porte est restée fermée, rien n'a été rebranché.", updatedAt: new Date() }).where(eq(cuts.id, c.id));
    await ouvrirIncident({ severite: "warning", kind: "commande_interrompue", resume: `Une commande sur la ligne ${c.lineId} (${c.side}) a été interrompue par un redémarrage.`, ligneId: c.lineId, coupureId: c.id, detail: { requested: c.requested } });
    bilan.coupuresReprises += 1;
  }
  bilan.echangesRegles = await regulariserEchangesEnVol(acteur);
  if (bilan.commandesInterrompues + bilan.coupuresReprises + bilan.echangesRegles > 0) await journaliser({ acteur, action: "restart_recovery", cible: "center", resultat: "ok", detail: { ...bilan } });
  return bilan;
}

export { libelleActeur };
