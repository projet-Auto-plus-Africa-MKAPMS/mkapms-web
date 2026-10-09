/**
 * Centre Cyber-Électrique — le SERVICE DE TRANSPORT : l'unique chemin par lequel un échange traverse la frontière entre deux plateformes.
 *
 * La coupure est appliquée ICI, par le service qui transporte, pas seulement affichée :
 *  - voie directe, tâche en file, reprise automatique et voie secondaire passent toutes par `decisionPassage` à CHAQUE tentative ;
 *  - une désactivation DEMANDÉE refuse le passage à l'instant et applique la règle des échanges en vol (regles.ts) ;
 *  - une tâche en attente ne rétablit jamais la liaison : au réveil elle est suspendue, pas envoyée ;
 *  - un paiement déjà transmis à un prestataire n'est pas annulé : il est SUIVI, son résultat est enregistré et affiché, rien ne repasse la frontière.
 *
 * Environnement isolé : le livreur par défaut est une boucle locale (aucun réseau, aucun appel à la Boutique).
 */
import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import { exchanges, gates, type Exchange } from "./base/schema.js";
import { chargerLigne, coupuresLite, ligneLite } from "./chaine.js";
import { journaliser, SYSTEME, tronquer, type Acteur } from "./journal.js";
import { decisionPassage, regleEnVol, type DecisionPassage, type KindEchange } from "./regles.js";

export async function evaluerPassage(ligneId: number, base: BaseFrontier = dbFrontier()): Promise<DecisionPassage> {
  const c = await chargerLigne(ligneId, base);
  if (!c) return { autorise: false, raison: "LIGNE_VIDE", detail: "Ligne inconnue." };
  return decisionPassage(ligneLite(c.ligne), coupuresLite(c.coupures));
}

/** Continuité PHYSIQUE d'un contact (la porte) : ce que lit la sonde. Ne dit rien de la permission. */
export async function continuite(coupureId: number, base: BaseFrontier = dbFrontier()): Promise<boolean | null> {
  const [g] = await base.select({ open: gates.open }).from(gates).where(eq(gates.cutId, coupureId)).limit(1);
  return g ? g.open : null;
}

export interface Livraison {
  ok: boolean;
  resultRef?: string;
  erreur?: string;
}
export type Livreur = (e: Exchange) => Promise<Livraison>;
/** Environnement isolé : la livraison reste dans le processus. */
export const livreurIsole: Livreur = async (e) => ({ ok: true, resultRef: `isole:${e.id}` });

export interface DemandeEchange {
  ligneId: number;
  direction: "remote_to_main" | "main_to_remote";
  kind: KindEchange;
  payloadRef: string;
  externalRef?: string;
  route?: "primary" | "queue" | "retry" | "secondary";
  maxTentatives?: number;
}
export interface ResultatEnvoi {
  echange: Exchange;
  livre: boolean;
  refus?: DecisionPassage;
}

const MAX_REF = 200;

async function refuser(base: BaseFrontier, d: DemandeEchange, refus: DecisionPassage, route: string): Promise<ResultatEnvoi> {
  const [e] = await base
    .insert(exchanges)
    .values({ lineId: d.ligneId, direction: d.direction, kind: d.kind, route: d.route ?? "primary", state: "refused", payloadRef: tronquer(d.payloadRef, MAX_REF), externalRef: d.externalRef ?? null, note: tronquer(`${refus.raison ?? "REFUS"} — ${refus.detail ?? ""}`, 300), finishedAt: new Date() })
    .returning();
  // Une sonde de contrôle refusée est le résultat ATTENDU d'une coupure : elle est conservée comme échange, sans bruit dans le journal.
  if (d.kind !== "probe") await journaliser({ acteur: SYSTEME, action: "exchange_refused", cible: "line", cibleId: d.ligneId, resultat: "refused", erreur: refus.raison, detail: { echange: e!.id, route, kind: d.kind, coupure: refus.coupure ?? null } }, base);
  return { echange: e!, livre: false, refus };
}

/** Envoi direct. L'échange n'est créé « en vol » que si le passage est autorisé à cet instant. */
export async function envoyer(d: DemandeEchange, livrer: Livreur = livreurIsole, base: BaseFrontier = dbFrontier()): Promise<ResultatEnvoi> {
  const decision = await evaluerPassage(d.ligneId, base);
  if (!decision.autorise) return refuser(base, d, decision, d.route ?? "primary");
  const [e] = await base
    .insert(exchanges)
    .values({ lineId: d.ligneId, direction: d.direction, kind: d.kind, route: d.route ?? "primary", state: "in_flight", attempts: 1, maxAttempts: d.maxTentatives ?? 3, payloadRef: tronquer(d.payloadRef, MAX_REF), externalRef: d.externalRef ?? null })
    .returning();
  return terminerLivraison(base, e!, livrer);
}

/** Livre, puis ne conclut QUE si l'échange est toujours « en vol » : une coupure survenue entre-temps l'a déjà annulé ou mis en suivi. */
async function terminerLivraison(base: BaseFrontier, e: Exchange, livrer: Livreur): Promise<ResultatEnvoi> {
  let l: Livraison;
  try {
    l = await Promise.race([livrer(e), new Promise<Livraison>((r) => setTimeout(() => r({ ok: false, erreur: "livraison sans réponse (délai de 5 s)" }), 5000).unref())]);
  } catch (err) {
    l = { ok: false, erreur: (err as Error).message };
  }
  const [conclu] = await base
    .update(exchanges)
    .set({ state: l.ok ? "delivered" : "failed", resultRef: l.resultRef ?? null, lastError: l.ok ? null : tronquer(l.erreur ?? "échec", 300), updatedAt: new Date(), finishedAt: new Date() })
    .where(and(eq(exchanges.id, e.id), eq(exchanges.state, "in_flight")))
    .returning();
  if (conclu) return { echange: conclu, livre: l.ok };
  // Coupée en cours de route.
  const [actuel] = await base.select().from(exchanges).where(eq(exchanges.id, e.id)).limit(1);
  if (actuel?.state === "tracked" && l.resultRef) {
    const [suivi] = await base.update(exchanges).set({ resultRef: l.resultRef, updatedAt: new Date() }).where(eq(exchanges.id, e.id)).returning();
    return { echange: suivi ?? actuel, livre: false };
  }
  return { echange: actuel ?? e, livre: false };
}

/** Met un échange en file (tâche de fond) : il ne partira qu'à son tour, et seulement si le passage est autorisé à ce moment-là. */
export async function mettreEnFile(d: DemandeEchange, base: BaseFrontier = dbFrontier()): Promise<Exchange> {
  const [e] = await base
    .insert(exchanges)
    .values({ lineId: d.ligneId, direction: d.direction, kind: d.kind, route: "queue", state: "queued", maxAttempts: d.maxTentatives ?? 3, payloadRef: tronquer(d.payloadRef, MAX_REF), externalRef: d.externalRef ?? null, nextAttemptAt: new Date() })
    .returning();
  return e!;
}

export interface BilanFile {
  traites: number;
  livres: number;
  suspendus: number;
  reprogrammes: number;
  echoues: number;
}

/** Traite la file : décision de passage refaite à CHAQUE tentative, y compris les reprises automatiques. */
export async function traiterFile(livrer: Livreur = livreurIsole, opts: { maintenant?: Date; max?: number } = {}, base: BaseFrontier = dbFrontier()): Promise<BilanFile> {
  const bilan: BilanFile = { traites: 0, livres: 0, suspendus: 0, reprogrammes: 0, echoues: 0 };
  const maintenant = opts.maintenant ?? new Date();
  const dus = await base
    .select()
    .from(exchanges)
    .where(and(eq(exchanges.state, "queued"), lte(exchanges.nextAttemptAt, maintenant)))
    .orderBy(asc(exchanges.id))
    .limit(opts.max ?? 25);
  for (const e of dus) {
    // Revendication atomique : un seul traitement par échange, même avec plusieurs instances.
    const [pris] = await base.update(exchanges).set({ state: "in_flight", attempts: sql`${exchanges.attempts} + 1`, route: e.attempts > 0 ? "retry" : "queue", updatedAt: new Date() }).where(and(eq(exchanges.id, e.id), eq(exchanges.state, "queued"))).returning();
    if (!pris) continue;
    bilan.traites += 1;
    const decision = await evaluerPassage(e.lineId, base);
    if (!decision.autorise) {
      await base.update(exchanges).set({ state: "suspended", note: tronquer(`Suspendu à la reprise : ${decision.raison} — ${decision.detail ?? ""}. Une tâche en attente ne rétablit jamais la liaison.`, 300), updatedAt: new Date(), finishedAt: new Date() }).where(eq(exchanges.id, e.id));
      await journaliser({ acteur: SYSTEME, action: "exchange_suspended", cible: "line", cibleId: e.lineId, resultat: "refused", erreur: decision.raison, detail: { echange: e.id, tentative: pris.attempts } }, base);
      bilan.suspendus += 1;
      continue;
    }
    const r = await terminerLivraison(base, pris, livrer);
    if (r.livre) bilan.livres += 1;
    else if (r.echange.state === "failed") {
      if (pris.attempts < pris.maxAttempts) {
        await base.update(exchanges).set({ state: "queued", finishedAt: null, nextAttemptAt: new Date(maintenant.getTime() + 1000 * 2 ** pris.attempts), updatedAt: new Date() }).where(eq(exchanges.id, e.id));
        bilan.reprogrammes += 1;
      } else bilan.echoues += 1;
    }
  }
  return bilan;
}

export interface BilanCoupure {
  suspendus: number;
  annules: number;
  suivis: number;
}

/**
 * Appliquée au moment où une désactivation est DEMANDÉE sur une coupure de la ligne : règle des échanges en vol (regles.regleEnVol).
 * Ne renvoie rien de l'autre côté ; un paiement transmis reste suivi.
 */
export async function appliquerCoupure(ligneId: number, acteur: Acteur = SYSTEME, base: BaseFrontier = dbFrontier()): Promise<BilanCoupure> {
  const ouverts = await base.select().from(exchanges).where(and(eq(exchanges.lineId, ligneId), inArray(exchanges.state, ["queued", "in_flight"])));
  const bilan: BilanCoupure = { suspendus: 0, annules: 0, suivis: 0 };
  for (const e of ouverts) {
    const nouvel = regleEnVol(e.kind, e.state);
    if (nouvel === e.state) continue;
    const note =
      nouvel === "suspended" ? "Coupure demandée : tâche en attente suspendue (elle ne repart pas toute seule)."
      : nouvel === "tracked" ? "Coupure demandée : paiement déjà transmis au prestataire, NON annulé — suivi du résultat."
      : "Coupure demandée : échange en cours annulé de façon contrôlée, résultat écarté.";
    const [m] = await base.update(exchanges).set({ state: nouvel, note, updatedAt: new Date(), finishedAt: nouvel === "tracked" ? null : new Date() }).where(and(eq(exchanges.id, e.id), eq(exchanges.state, e.state))).returning();
    if (!m) continue;
    if (nouvel === "suspended") bilan.suspendus += 1;
    else if (nouvel === "tracked") bilan.suivis += 1;
    else bilan.annules += 1;
  }
  if (bilan.suspendus + bilan.annules + bilan.suivis > 0) await journaliser({ acteur, action: "exchanges_cut_rule", cible: "line", cibleId: ligneId, resultat: "ok", detail: { ...bilan } }, base);
  return bilan;
}

/** Résultat d'un paiement suivi : enregistré et affiché, jamais renvoyé de l'autre côté de la coupure. */
export async function enregistrerResultatExterne(echangeId: number, resultRef: string, base: BaseFrontier = dbFrontier()): Promise<boolean> {
  const [m] = await base.update(exchanges).set({ resultRef: tronquer(resultRef, MAX_REF), updatedAt: new Date(), finishedAt: new Date(), note: "Résultat du prestataire enregistré (suivi). Rien n'a été renvoyé de l'autre côté de la coupure." }).where(and(eq(exchanges.id, echangeId), eq(exchanges.state, "tracked"))).returning({ id: exchanges.id });
  return !!m;
}

/** Rejoue explicitement un échange suspendu : il repart en file et ne passera que si le passage est de nouveau autorisé. */
export async function rejouer(echangeId: number, acteur: Acteur, base: BaseFrontier = dbFrontier()): Promise<boolean> {
  const [m] = await base.update(exchanges).set({ state: "queued", attempts: 0, finishedAt: null, nextAttemptAt: new Date(), note: "Rejoué à la demande du PDG.", updatedAt: new Date() }).where(and(eq(exchanges.id, echangeId), eq(exchanges.state, "suspended"))).returning({ id: exchanges.id, lineId: exchanges.lineId });
  if (m) await journaliser({ acteur, action: "exchange_replay", cible: "exchange", cibleId: echangeId, resultat: "ok" }, base);
  return !!m;
}

export async function echangesRecents(ligneId: number | null, limite = 50, base: BaseFrontier = dbFrontier()) {
  const q = base.select().from(exchanges);
  return (ligneId === null ? q : q.where(eq(exchanges.lineId, ligneId))).orderBy(desc(exchanges.id)).limit(Math.min(200, limite));
}

/**
 * Redémarrage : les échanges « en vol » ont perdu leur livreur. La règle documentée s'applique à eux seuls (annulé, ou suivi pour un paiement
 * déjà transmis) ; les échanges en attente restent en attente (rien n'est rebranché, rien n'est perdu).
 */
export async function regulariserEchangesEnVol(acteur: Acteur = SYSTEME, base: BaseFrontier = dbFrontier()): Promise<number> {
  const enVol = await base.select().from(exchanges).where(eq(exchanges.state, "in_flight"));
  let n = 0;
  for (const e of enVol) {
    const nouvel = regleEnVol(e.kind, e.state);
    const [m] = await base.update(exchanges).set({ state: nouvel, note: "Interrompu par un redémarrage du centre : règle des échanges en vol appliquée.", updatedAt: new Date(), finishedAt: nouvel === "tracked" ? null : new Date() }).where(and(eq(exchanges.id, e.id), eq(exchanges.state, "in_flight"))).returning({ id: exchanges.id });
    if (m) n += 1;
  }
  if (n > 0) await journaliser({ acteur, action: "exchanges_restart_rule", cible: "center", resultat: "ok", detail: { n } }, base);
  return n;
}

/**
 * Essai de la liaison entre les deux moteurs intermédiaires dans l'ENVIRONNEMENT ISOLÉ : les deux intermédiaires (simulés, en mémoire)
 * échangent un aller-retour à travers le SEUL contact central. Il faut que ce contact soit confirmé connecté ; les côtés locaux ne sont pas
 * consultés (ils sont testés à part). Rien ne sort du processus.
 */
export async function essaiIntermediaires(ligneId: number, base: BaseFrontier = dbFrontier()): Promise<{ ok: boolean; detail: string; echangeId: number }> {
  const c = await chargerLigne(ligneId, base);
  const centre = c?.coupures.find((x) => x.side === "center");
  if (!c || !centre) return { ok: false, detail: "Ligne ou contact central inconnu.", echangeId: 0 };
  const conduit = (await continuite(centre.id, base)) === true;
  const confirme = centre.requested === "activate" && centre.progress === "confirmed" && centre.observed === "connected";
  const passe = conduit && confirme;
  const echo = (de: string, msg: string) => `${de}:${msg}`; // les deux intermédiaires simulés se contentent de renvoyer ce qu'ils reçoivent
  const aller = echo("principal", echo("distant", "bonjour"));
  const [e] = await base
    .insert(exchanges)
    .values({ lineId: ligneId, direction: "remote_to_main", kind: "probe", route: "primary", state: passe ? "delivered" : "refused", attempts: passe ? 1 : 0, payloadRef: "essai:intermediaires", resultRef: passe ? aller : null, note: passe ? "Aller-retour entre les deux intermédiaires (isolé) à travers le contact central." : "Contact central non connecté : l'aller-retour est refusé.", finishedAt: new Date() })
    .returning({ id: exchanges.id });
  return { ok: passe, detail: passe ? "Aller-retour réussi entre les deux intermédiaires (environnement isolé)." : "Refusé : le contact central n'est pas connecté et confirmé.", echangeId: e!.id };
}
