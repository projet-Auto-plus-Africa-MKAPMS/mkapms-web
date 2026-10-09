/**
 * Centre Cyber-Électrique — PROTOCOLES DE TEST d'une ligne, joués dans l'environnement isolé (simulation, aucun réseau) et conservés :
 * une session, ses étapes, ce qui était attendu, ce qui a été observé, la commande qui le prouve.
 *
 * Protocole des trois coupures (dans l'ordre exigé) :
 *  1 lien local distant + coupure centrale · 2 lien local principal + coupure centrale · 3 les deux liens locaux coupés ·
 *  4 lien entre les deux intermédiaires (isolé) · 5 le centre recoupé · 6 les deux côtés locaux réactivés ·
 *  7 la chaîne complète (isolé) · 8 la commande centrale individuelle · 9 l'activation et la coupure générales (limitées à cette ligne).
 *
 * Protocole des pannes : moteur en panne, moteur muet, désaccord entre les deux moteurs, commande répétée, redémarrage.
 * L'état de la ligne est restauré à la fin : un essai ne laisse pas une ligne autrement qu'il l'a trouvée.
 */
import { and, eq, sql } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { cuts, incidents, testSessions, testSteps } from "./base/schema.js";
import { chargerLigne, coupuresLite, ligneLite } from "./chaine.js";
import { commanderCoupure, commanderGeneral, commanderLigne, reprendreApresRedemarrage, type OptionsCommande, type ResultatCommande } from "./commandes.js";
import { journaliser, type Acteur } from "./journal.js";
import { decisionPassage, etatLigne } from "./regles.js";
import { essaiIntermediaires, envoyer as envoyerEchange, continuite } from "./transport.js";

export interface EtapeProtocole {
  ord: number;
  nom: string;
  attendu: string;
  observe: string;
  ok: boolean;
  commandeId: number | null;
}
export interface RapportProtocole {
  sessionId: number;
  protocole: string;
  ligneId: number;
  ok: boolean;
  etapes: EtapeProtocole[];
}

type Cote = "remote" | "center" | "main";
const COTES: Cote[] = ["remote", "center", "main"];

async function etatActuel(ligneId: number) {
  const c = (await chargerLigne(ligneId))!;
  return { ligne: c.ligne, coupures: c.coupures, etat: etatLigne(coupuresLite(c.coupures)), passage: decisionPassage(ligneLite(c.ligne), coupuresLite(c.coupures)) };
}

class Session {
  etapes: EtapeProtocole[] = [];
  /** Incidents ouverts PAR l'essai : clos à la fin et marqués comme tels, jamais ceux qui n'en viennent pas. */
  incidentsEssai = new Set<number>();
  noter(r: { incidentId?: number | null }): void {
    if (r.incidentId) this.incidentsEssai.add(r.incidentId);
  }
  constructor(
    readonly id: number,
    readonly ligneId: number,
    readonly acteur: Acteur,
  ) {}
  async etape(nom: string, attendu: string, fn: () => Promise<{ ok: boolean; observe: string; commandeId?: number | null }>): Promise<boolean> {
    let r: { ok: boolean; observe: string; commandeId?: number | null };
    try {
      r = await fn();
    } catch (e) {
      r = { ok: false, observe: `exception : ${(e as Error).message}` };
    }
    const e: EtapeProtocole = { ord: this.etapes.length + 1, nom, attendu, observe: r.observe, ok: r.ok, commandeId: r.commandeId ?? null };
    this.etapes.push(e);
    await dbFrontier().insert(testSteps).values({ sessionId: this.id, ord: e.ord, name: nom, expectation: attendu, observation: r.observe, passed: r.ok, commandId: e.commandeId });
    return r.ok;
  }
}

async function ouvrir(ligneId: number, protocole: string, label: string, acteur: Acteur): Promise<Session> {
  const [s] = await dbFrontier().insert(testSessions).values({ label, protocol: protocole, mode: "simulation", environment: "isolated", lineId: ligneId, actor: `${acteur.type}${acteur.id !== undefined ? `:${acteur.id}` : ""}` }).returning({ id: testSessions.id });
  return new Session(s!.id, ligneId, acteur);
}

async function fermer(s: Session, protocole: string): Promise<RapportProtocole> {
  const ok = s.etapes.length > 0 && s.etapes.every((e) => e.ok);
  await dbFrontier().update(testSessions).set({ status: ok ? "passed" : "failed", finishedAt: new Date(), summary: { etapes: s.etapes.length, reussies: s.etapes.filter((e) => e.ok).length } }).where(eq(testSessions.id, s.id));
  await journaliser({ acteur: s.acteur, action: "test_protocol", cible: "line", cibleId: s.ligneId, resultat: ok ? "ok" : "error", detail: { session: s.id, protocole, reussies: s.etapes.filter((e) => e.ok).length, total: s.etapes.length } });
  return { sessionId: s.id, protocole, ligneId: s.ligneId, ok, etapes: s.etapes };
}

const OPTS = (acteur: Acteur, extra: Partial<OptionsCommande> = {}): OptionsCommande => ({ acteur, confirme: true, raison: "protocole de test (environnement isolé)", ...extra });
const cible = async (ligneId: number, side: Cote) => (await dbFrontier().select().from(cuts).where(and(eq(cuts.lineId, ligneId), eq(cuts.side, side))).limit(1))[0]!;
const commande = (r: ResultatCommande) => r.commandeId;

async function poser(ligneId: number, side: Cote, voulu: "activate" | "deactivate", acteur: Acteur): Promise<ResultatCommande> {
  return commanderCoupure((await cible(ligneId, side)).id, voulu, OPTS(acteur));
}
async function tenter(ligneId: number, message: string) {
  return envoyerEchange({ ligneId, direction: "remote_to_main", kind: "message", payloadRef: `essai:${message}` });
}

/** Les neuf étapes de coupure, dans l'ordre exigé. La ligne doit être validée. */
export async function lancerProtocoleCoupures(ligneId: number, acteur: Acteur): Promise<RapportProtocole> {
  const avant = await chargerLigne(ligneId);
  const s = await ouvrir(ligneId, "coupures-9-etapes", `Protocole des trois coupures — ${avant?.ligne.label ?? ligneId}`, acteur);
  if (!avant || avant.ligne.kind !== "real") {
    await s.etape("Ligne réelle", "Une ligne réelle existe", async () => ({ ok: false, observe: "Ligne inconnue ou vide : rien à tester." }));
    return fermer(s, "coupures-9-etapes");
  }
  if (avant.ligne.validity !== "valid") {
    await s.etape("Ligne validée", "La chaîne à sept éléments est complète", async () => ({ ok: false, observe: `Ligne non validée : ${avant.ligne.invalidReasons[0] ?? "chaîne incomplète"}` }));
    return fermer(s, "coupures-9-etapes");
  }
  const etaitConnectee = etatLigne(coupuresLite(avant.coupures)) === "connected";
  // Point de départ : tout est coupé (un test des trois coupures part d'un état connu).
  const base = await commanderLigne(ligneId, "deactivate", OPTS(acteur));
  await s.etape("Point de départ : ligne coupée", "Les trois coupures sont confirmées coupées", async () => ({ ok: base.ok, observe: base.detail, commandeId: commande(base) }));

  await s.etape("1. Lien local distant avec coupure centrale", "Côté distant connecté, centre et côté principal coupés : rien ne passe, le côté distant conduit", async () => {
    const r = await poser(ligneId, "remote", "activate", acteur);
    const t = await tenter(ligneId, "1");
    const e = await etatActuel(ligneId);
    const conduit = await continuite((await cible(ligneId, "remote")).id);
    return { ok: r.ok && !t.livre && e.etat === "partial" && conduit === true, observe: `côté distant ${r.observe ?? "?"} · échange ${t.livre ? "PASSÉ" : `refusé (${t.refus?.raison}, coupure ${t.refus?.coupure})`} · état ${e.etat}`, commandeId: commande(r) };
  });
  await s.etape("2. Lien local de la plateforme principale avec coupure centrale", "Côté principal connecté seul : rien ne passe, le côté principal conduit", async () => {
    const a = await poser(ligneId, "remote", "deactivate", acteur);
    const r = await poser(ligneId, "main", "activate", acteur);
    const t = await tenter(ligneId, "2");
    const e = await etatActuel(ligneId);
    const conduit = await continuite((await cible(ligneId, "main")).id);
    return { ok: a.ok && r.ok && !t.livre && e.etat === "partial" && conduit === true, observe: `côté principal ${r.observe ?? "?"} · échange ${t.livre ? "PASSÉ" : `refusé (${t.refus?.raison})`} · état ${e.etat}`, commandeId: commande(r) };
  });
  await s.etape("3. Coupure des deux liens locaux", "Côtés distant et principal coupés, centre coupé : état coupé", async () => {
    const a = await poser(ligneId, "main", "deactivate", acteur);
    const b = await poser(ligneId, "remote", "deactivate", acteur);
    const t = await tenter(ligneId, "3");
    const e = await etatActuel(ligneId);
    return { ok: a.ok && b.ok && !t.livre && e.etat === "disconnected", observe: `état ${e.etat} · échange ${t.livre ? "PASSÉ" : "refusé"}`, commandeId: commande(b) };
  });
  await s.etape("4. Lien entre les deux moteurs intermédiaires (environnement isolé)", "Avec le seul contact central connecté, l'aller-retour entre intermédiaires réussit ; la ligne complète reste fermée", async () => {
    const c = await poser(ligneId, "center", "activate", acteur);
    const i = await essaiIntermediaires(ligneId);
    const t = await tenter(ligneId, "4");
    return { ok: c.ok && i.ok && !t.livre, observe: `${i.detail} · échange de bout en bout ${t.livre ? "PASSÉ" : "refusé (côtés locaux coupés)"}`, commandeId: commande(c) };
  });
  await s.etape("5. Recoupure du centre", "Le contact central est de nouveau coupé ; l'aller-retour entre intermédiaires est refusé", async () => {
    const c = await poser(ligneId, "center", "deactivate", acteur);
    const i = await essaiIntermediaires(ligneId);
    return { ok: c.ok && !i.ok, observe: `centre ${c.observe ?? "?"} · ${i.detail}`, commandeId: commande(c) };
  });
  await s.etape("6. Réactivation des deux côtés locaux validés", "Côtés distant et principal connectés, centre coupé : rien ne passe", async () => {
    const a = await poser(ligneId, "remote", "activate", acteur);
    const b = await poser(ligneId, "main", "activate", acteur);
    const t = await tenter(ligneId, "6");
    const e = await etatActuel(ligneId);
    return { ok: a.ok && b.ok && !t.livre && e.etat === "partial", observe: `état ${e.etat} · échange ${t.livre ? "PASSÉ" : `refusé (coupure ${t.refus?.coupure})`}`, commandeId: commande(b) };
  });
  await s.etape("7. Chaîne complète (environnement isolé)", "Les trois coupures connectées : les échanges passent dans les deux sens", async () => {
    const c = await poser(ligneId, "center", "activate", acteur);
    const t1 = await tenter(ligneId, "7a");
    const t2 = await envoyerEchange({ ligneId, direction: "main_to_remote", kind: "message", payloadRef: "essai:7b" });
    const e = await etatActuel(ligneId);
    return { ok: c.ok && t1.livre && t2.livre && e.etat === "connected" && e.passage.autorise, observe: `état ${e.etat} · aller ${t1.livre ? "livré" : "refusé"} · retour ${t2.livre ? "livré" : "refusé"}`, commandeId: commande(c) };
  });
  await s.etape("8. Commande centrale individuelle", "Couper le seul contact central coupe tout sans toucher aux côtés locaux ; le rétablir rétablit", async () => {
    const c = await poser(ligneId, "center", "deactivate", acteur);
    const t = await tenter(ligneId, "8a");
    const e = await etatActuel(ligneId);
    const locauxIntacts = e.coupures.filter((x) => x.side !== "center").every((x) => x.observed === "connected");
    const r = await poser(ligneId, "center", "activate", acteur);
    const t2 = await tenter(ligneId, "8b");
    return { ok: c.ok && !t.livre && locauxIntacts && r.ok && t2.livre, observe: `après coupure : ${t.livre ? "PASSÉ" : "refusé"}, côtés locaux ${locauxIntacts ? "intacts" : "TOUCHÉS"} · après rétablissement : ${t2.livre ? "livré" : "refusé"}`, commandeId: commande(c) };
  });
  await s.etape("9. Activation et coupure générales (limitées à cette ligne)", "La coupure générale ferme la ligne, l'activation générale la rouvre ; chaque ligne rend son résultat", async () => {
    const off = await commanderGeneral("deactivate", OPTS(acteur, { portee: [ligneId] }));
    const t = await tenter(ligneId, "9a");
    const on = await commanderGeneral("activate", OPTS(acteur, { portee: [ligneId] }));
    const t2 = await tenter(ligneId, "9b");
    return { ok: off.ok && !t.livre && on.ok && t2.livre && (on.enfants?.length ?? 0) === 1, observe: `coupure générale ${off.statut} (${off.enfants?.length ?? 0} ligne) · activation générale ${on.statut} · échanges : ${t.livre ? "PASSÉ" : "refusé"} puis ${t2.livre ? "livré" : "refusé"}`, commandeId: commande(on) };
  });

  // Restauration : la ligne est rendue dans l'état où elle a été trouvée.
  const retour = await commanderLigne(ligneId, etaitConnectee ? "activate" : "deactivate", OPTS(acteur));
  await s.etape("Restauration de l'état initial", etaitConnectee ? "La ligne, trouvée connectée, est rebranchée" : "La ligne, trouvée coupée, est laissée coupée", async () => ({ ok: retour.ok, observe: retour.detail, commandeId: commande(retour) }));
  return fermer(s, "coupures-9-etapes");
}

/** Pannes : moteur en panne, moteur muet, désaccord, commande répétée, redémarrage. Les incidents créés par l'essai sont clos et marqués comme tels. */
export async function lancerProtocolePannes(ligneId: number, acteur: Acteur): Promise<RapportProtocole> {
  const avant = await chargerLigne(ligneId);
  const s = await ouvrir(ligneId, "pannes", `Essais de panne — ${avant?.ligne.label ?? ligneId}`, acteur);
  if (!avant || avant.ligne.kind !== "real" || avant.ligne.validity !== "valid") {
    await s.etape("Ligne réelle et validée", "La ligne existe et sa chaîne est complète", async () => ({ ok: false, observe: "Ligne absente, vide ou non validée." }));
    return fermer(s, "pannes");
  }
  const etaitConnectee = etatLigne(coupuresLite(avant.coupures)) === "connected";
  await commanderLigne(ligneId, "deactivate", OPTS(acteur));
  const centre = await cible(ligneId, "center");
  const D = 200;

  await s.etape("Panne d'un moteur interne", "Activation bloquée, incident enregistré, aucun contact ouvert", async () => {
    const r = await commanderCoupure(centre.id, "activate", OPTS(acteur, { delaiMs: D, defauts: { "center:cmd.cut.center": "panne" } }));
    s.noter(r);
    const ouvert = await continuite(centre.id);
    return { ok: !r.ok && r.statut === "blocked" && r.code === "MOTEUR_INDISPONIBLE" && !!r.incidentId && ouvert === false, observe: `${r.statut} / ${r.code} · incident ${r.incidentId ?? "aucun"} · contact ${ouvert ? "OUVERT" : "fermé"}`, commandeId: commande(r) };
  });
  await s.etape("Moteur qui ne répond pas", "Délai dépassé : activation bloquée, incident enregistré, pas d'attente infinie", async () => {
    const t0 = Date.now();
    const r = await commanderCoupure(centre.id, "activate", OPTS(acteur, { delaiMs: D, defauts: { "center:ver.cut.center": "muet" } }));
    s.noter(r);
    return { ok: !r.ok && r.statut === "blocked" && r.etapes.some((e) => e.issue === "delai") && Date.now() - t0 < 5000 && (await continuite(centre.id)) === false, observe: `${r.statut} / ${r.code} · ${r.etapes.find((e) => e.issue === "delai")?.detail ?? "pas de délai constaté"}`, commandeId: commande(r) };
  });
  await s.etape("Désaccord entre les deux moteurs", "Contradiction constatée : activation en échec, incident, contact refermé, rien ne passe", async () => {
    const r = await commanderCoupure(centre.id, "activate", OPTS(acteur, { delaiMs: D, defauts: { "center:ver.cut.center": "desaccord" } }));
    s.noter(r);
    const t = await tenter(ligneId, "desaccord");
    return { ok: !r.ok && r.code === "CONTRADICTION" && (await continuite(centre.id)) === false && !t.livre, observe: `${r.statut} / ${r.code} · incident ${r.incidentId ?? "aucun"} · échange ${t.livre ? "PASSÉ" : "refusé"}`, commandeId: commande(r) };
  });
  // Remise en état de la coupure en erreur par l'atelier (réparation testée) : l'essai éprouve aussi le circuit de réparation.
  const { lancerDiagnostic, proposerReparation, testerReparation, appliquerReparation } = await import("./atelier.js");
  const diag = await lancerDiagnostic(acteur);
  const inc = diag.anomalies.find((a) => a.kind === "coupure_en_erreur" && a.coupureId === centre.id && a.incidentId);
  if (inc?.incidentId) s.incidentsEssai.add(inc.incidentId);
  await s.etape("Réparation de la coupure en erreur (atelier)", "Proposée, testée en environnement isolé, appliquée : la coupure est de nouveau commandable", async () => {
    if (!inc?.incidentId) return { ok: false, observe: "Aucun incident de coupure en erreur à réparer." };
    const p = await proposerReparation(inc.incidentId, acteur);
    const t = p.reparation ? await testerReparation(p.reparation.id, acteur) : { ok: false, detail: p.detail };
    const a = p.reparation && t.ok ? await appliquerReparation(p.reparation.id, acteur, true) : { ok: false, detail: "non testée" };
    const apres = await cible(ligneId, "center");
    return { ok: p.ok && t.ok && a.ok && apres.progress === "idle", observe: `proposée ${p.ok} · testée ${t.ok} · appliquée ${a.ok} · coupure ${apres.progress}` };
  });
  await s.etape("Commande répétée", "La même clé d'idempotence rend la même commande ; activer deux fois ne casse rien", async () => {
    await poser(ligneId, "remote", "activate", acteur);
    await poser(ligneId, "main", "activate", acteur);
    const cle = `essai-${s.id}`;
    const a = await commanderCoupure(centre.id, "activate", OPTS(acteur, { cle }));
    const b = await commanderCoupure(centre.id, "activate", OPTS(acteur, { cle }));
    const c = await commanderCoupure(centre.id, "activate", OPTS(acteur));
    return { ok: a.ok && b.rejoue === true && b.commandeId === a.commandeId && c.ok, observe: `1re ${a.statut} · 2e ${b.rejoue ? "rejouée (même commande)" : b.statut} · 3e sans clé ${c.statut}`, commandeId: commande(a) };
  });
  await s.etape("Redémarrage", "Après reprise, la ligne connectée reste connectée, rien n'est rebranché, une commande interrompue est close", async () => {
    await commanderCoupure(centre.id, "deactivate", OPTS(acteur));
    await dbFrontier().update(cuts).set({ requested: "activate", progress: "in_progress" }).where(eq(cuts.id, centre.id));
    const bilan = await reprendreApresRedemarrage(acteur);
    for (const i of await dbFrontier().select({ id: incidents.id }).from(incidents).where(and(eq(incidents.lineId, ligneId), eq(incidents.kind, "commande_interrompue"), eq(incidents.status, "open")))) s.incidentsEssai.add(i.id);
    const apres = await cible(ligneId, "center");
    const ouvert = await continuite(centre.id);
    return { ok: apres.progress === "failed" && ouvert === false && bilan.coupuresReprises >= 1, observe: `coupure ${apres.progress} · porte ${ouvert ? "OUVERTE" : "fermée"} · ${bilan.coupuresReprises} coupure(s) reprise(s)` };
  });

  // Remise en état : réparer la coupure laissée en erreur, clore les incidents de l'essai, restaurer la ligne.
  const d2 = await lancerDiagnostic(acteur);
  const inc2 = d2.anomalies.find((a) => a.kind === "coupure_en_erreur" && a.coupureId === centre.id && a.incidentId);
  if (inc2?.incidentId) s.incidentsEssai.add(inc2.incidentId);
  if (inc2?.incidentId) {
    const p = await proposerReparation(inc2.incidentId, acteur);
    if (p.reparation && (await testerReparation(p.reparation.id, acteur)).ok) await appliquerReparation(p.reparation.id, acteur, true);
  }
  if (s.incidentsEssai.size) {
    await dbFrontier().execute(sql`UPDATE frontier.incidents SET status = 'closed', closed_at = now(), detail = detail || ${JSON.stringify({ essai: s.id })}::jsonb WHERE id IN (${sql.join([...s.incidentsEssai].map((i) => sql`${i}`), sql`, `)})`);
  }
  const retour = await commanderLigne(ligneId, etaitConnectee ? "activate" : "deactivate", OPTS(acteur));
  await s.etape("Restauration de l'état initial", etaitConnectee ? "La ligne, trouvée connectée, est rebranchée" : "La ligne, trouvée coupée, est laissée coupée", async () => ({ ok: retour.ok, observe: retour.detail, commandeId: commande(retour) }));
  return fermer(s, "pannes");
}
