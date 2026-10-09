/**
 * Pannes et contradictions : moteur indisponible, moteur muet, désaccord entre les deux moteurs, contact bloqué, commande répétée, redémarrage.
 * Règle : une activation échoue FERMÉE (bloquée + incident) ; une coupure DEMANDÉE est prise en compte par le transport même si un moteur est en panne.
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { and, count, eq } from "drizzle-orm";
import { configurerBase, dbFrontier } from "../base/connexion.js";
import { assurerBase, oublierEtatBasePourTests } from "../base/demarrage.js";
import { commands, cuts, engines, gates, incidents, lines } from "../base/schema.js";
import { chargerLigne, coupuresLite } from "../chaine.js";
import { commanderCoupure, commanderGeneral, commanderGroupe, commanderLigne, reprendreApresRedemarrage } from "../commandes.js";
import { assurerFondation, oublierFondationPourTests } from "../fondation.js";
import { etatLigne } from "../regles.js";
import { envoyer } from "../transport.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero, urlDeTest } from "./utilitaires.js";

const o = { acteur: PDG, confirme: true, delaiMs: 150 } as const;
before(baseNeuve);
after(fermer);
beforeEach(remiseAZero);

const cote = async (ligneId: number, side: "remote" | "center" | "main") => (await dbFrontier().select().from(cuts).where(and(eq(cuts.lineId, ligneId), eq(cuts.side, side))).limit(1))[0]!;
const porte = async (cutId: number) => (await dbFrontier().select().from(gates).where(eq(gates.cutId, cutId)))[0]!.open;
const etat = async (ligneId: number) => etatLigne(coupuresLite((await chargerLigne(ligneId))!.coupures));
const arreter = (code: string) => dbFrontier().update(engines).set({ running: false, health: "stopped" }).where(eq(engines.code, code));
const incidentsOuverts = async (kind: string) => dbFrontier().select().from(incidents).where(eq(incidents.kind, kind));

test("moteur de COMMANDE arrêté : activation bloquée, incident enregistré, rien n'est demandé ni écrit", async () => {
  const id = await ligneDe("shop-documents-only");
  await arreter("center:cmd.cut.center");
  const c = await cote(id, "center");
  const r = await commanderCoupure(c.id, "activate", o);
  assert.equal(r.ok, false);
  assert.equal(r.statut, "blocked");
  assert.equal(r.code, "MOTEUR_INDISPONIBLE");
  assert.ok(r.incidentId);
  const [inc] = await incidentsOuverts("moteur_indisponible");
  assert.equal(inc!.engineCode, "center:cmd.cut.center");
  assert.equal((await cote(id, "center")).requested, "none");
  assert.equal(await porte(c.id), false);
  // La ligne entière ne s'active pas non plus (le contact central en fait partie) et ne reste pas à moitié branchée.
  const ligne = await commanderLigne(id, "activate", o);
  assert.equal(ligne.ok, false);
  assert.equal(await etat(id), "disconnected", "les côtés déjà activés ont été défaits");
  assert.equal((await cote(id, "remote")).observed, "disconnected");
  assert.equal(await porte((await cote(id, "remote")).id), false);
});

test("moteur de VÉRIFICATION arrêté : activation bloquée avant tout contact (il contrôle les conditions) ; incident", async () => {
  const id = await ligneDe("service-access");
  await arreter("center:ver.cut.main");
  const c = await cote(id, "main");
  const r = await commanderCoupure(c.id, "activate", o);
  assert.equal(r.code, "MOTEUR_INDISPONIBLE");
  assert.equal(r.statut, "blocked");
  assert.equal(await porte(c.id), false);
  const [inc] = await incidentsOuverts("moteur_indisponible");
  assert.equal(inc!.engineCode, "center:ver.cut.main");
});

test("moteur qui ne répond pas : délai dépassé = activation bloquée + incident, pas d'attente infinie", async () => {
  const id = await ligneDe("shop-intelligence-isolated");
  const c = await cote(id, "remote");
  const debut = Date.now();
  const r = await commanderCoupure(c.id, "activate", { ...o, defauts: { "center:cmd.cut.remote": "muet" } });
  assert.ok(Date.now() - debut < 2000);
  assert.equal(r.code, "MOTEUR_INDISPONIBLE");
  assert.equal(r.etapes[0]!.issue, "delai");
  assert.equal(await porte(c.id), false);
  assert.ok((await incidentsOuverts("moteur_indisponible")).length === 1);
});

test("la sonde ne répond pas APRÈS exécution : état réel inconnu, échec, porte refermée, rien ne passe", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderCoupure((await cote(id, "remote")).id, "activate", o)).ok, true);
  assert.equal((await commanderCoupure((await cote(id, "main")).id, "activate", o)).ok, true);
  const centre = await cote(id, "center");
  // Muette seulement au moment de la sonde finale (pas à la vérification des conditions) : on cible la phase par un défaut de coupure,
  // puis on laisse la sonde répondre à la phase préalable en ne la rendant muette que pour « sonder ».
  const r = await commanderCoupure(centre.id, "activate", { ...o, defauts: { [`center:ver.cut.center#${centre.id}`]: "muet" } });
  assert.equal(r.ok, false);
  assert.ok(["MOTEUR_INDISPONIBLE", "ECHEC_VERIFICATION"].includes(r.code!), r.code);
  assert.equal(await porte(centre.id), false, "jamais de contact ouvert derrière un échec d'activation");
  const e = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "x" });
  assert.equal(e.livre, false);
});

test("DÉSACCORD entre les deux moteurs : la commande dit « fait », la sonde dit l'inverse → contradiction, échec, incident, contact refermé", async () => {
  const id = await ligneDe("shop-documents-only");
  const c = await cote(id, "center");
  // La sonde ne répond « ne passe pas » qu'à la phase finale : elle contredit l'actionneur. (À la phase des conditions, elle ne sonde pas.)
  const r = await commanderCoupure(c.id, "activate", { ...o, defauts: { "center:ver.cut.center": "desaccord" } });
  assert.equal(r.ok, false);
  assert.equal(r.code, "CONTRADICTION");
  assert.equal(r.statut, "failed");
  assert.match(r.detail, /Contradiction/);
  const apres = await cote(id, "center");
  assert.equal(apres.progress, "failed");
  assert.equal(apres.observed, "disconnected");
  assert.equal(await porte(c.id), false, "le contact a été refermé : un échec ne laisse rien ouvert");
  const [inc] = await incidentsOuverts("activation_non_confirmee");
  assert.equal(inc!.severity, "warning");
  const recus = await dbFrontier().execute(`SELECT outcome FROM frontier.command_receipts WHERE command_id = ${r.commandeId} ORDER BY id`);
  assert.ok((recus.rows as { outcome: string }[]).some((x) => x.outcome === "contradiction"));
  // La ligne en erreur n'est plus admissible : elle ne peut pas être rebranchée sans traiter l'incident.
  const l = await commanderLigne(id, "activate", o);
  assert.equal(l.ok, false);
  assert.match(l.detail, /erreur|EN_ERREUR/);
});

test("contact BLOQUÉ à la coupure : « coupure non confirmée », incident critique, mais le transport refuse déjà tout passage", async () => {
  const id = await ligneDe("service-access");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  assert.equal(await etat(id), "connected");
  const c = await cote(id, "center");
  const r = await commanderCoupure(c.id, "deactivate", { ...o, defauts: { "center:cmd.cut.center": "bloque" } });
  assert.equal(r.ok, false);
  assert.equal(r.code, "CONTRADICTION");
  assert.match(r.detail, /Coupure non confirmée/);
  assert.equal(r.observe, "connected", "la sonde mesure encore la continuité");
  const [inc] = await incidentsOuverts("coupure_non_confirmee");
  assert.equal(inc!.severity, "critical");
  const apres = await cote(id, "center");
  assert.equal(apres.requested, "deactivate");
  assert.equal(await porte(c.id), true, "le contact conduit encore (panne simulée)");
  const e = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "après coupure demandée" });
  assert.equal(e.livre, false, "mais RIEN ne passe : la coupure demandée refuse le passage à l'instant");
  assert.equal(e.refus?.raison, "COUPURE_NON_DEMANDEE");
  // Sans la panne, la coupure se confirme.
  const bis = await commanderCoupure(c.id, "deactivate", o);
  assert.equal(bis.ok, true, bis.detail);
  assert.equal(await porte(c.id), false);
});

test("une COUPURE passe même si le moteur de commande est arrêté : demandée, effective pour le transport, non confirmée + incident critique", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  await arreter("center:cmd.cut.center");
  const c = await cote(id, "center");
  const r = await commanderCoupure(c.id, "deactivate", o);
  assert.equal(r.ok, false);
  assert.notEqual(r.statut, "blocked", "une coupure n'est jamais « bloquée » par une panne");
  assert.equal((await cote(id, "center")).requested, "deactivate");
  const e = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "x" });
  assert.equal(e.livre, false);
  assert.ok((await dbFrontier().select().from(incidents).where(eq(incidents.severity, "critical"))).length >= 1);
  // La ligne entière aussi : l'orchestrateur en panne n'empêche pas la coupure des autres côtés.
  await arreter("center:cmd.line");
  const l = await commanderLigne(id, "deactivate", { acteur: PDG, delaiMs: 150 });
  assert.equal((await cote(id, "remote")).observed, "disconnected");
  assert.equal((await cote(id, "main")).observed, "disconnected");
  assert.notEqual(l.statut, "blocked");
});

test("commande RÉPÉTÉE : même clé = même commande rendue, une seule trace ; activer deux fois ne casse rien", async () => {
  const id = await ligneDe("shop-documents-only");
  const c = await cote(id, "remote");
  const a = await commanderCoupure(c.id, "activate", { ...o, cle: "essai-1" });
  const b = await commanderCoupure(c.id, "activate", { ...o, cle: "essai-1" });
  assert.equal(a.ok, true);
  assert.equal(b.rejoue, true);
  assert.equal(b.commandeId, a.commandeId);
  assert.equal(Number((await dbFrontier().select({ n: count() }).from(commands).where(eq(commands.idempotencyKey, "essai-1")))[0]!.n), 1);
  // Sans clé : la même demande à nouveau est un no-op confirmé, pas une dérive.
  const c2 = await commanderCoupure(c.id, "activate", o);
  assert.equal(c2.ok, true);
  assert.equal(c2.etapes.find((e) => e.phase === "precheck" && e.role === "command")!.detail, "aucun changement");
  assert.equal(await porte(c.id), true);
  const d1 = await commanderCoupure(c.id, "deactivate", o);
  const d2 = await commanderCoupure(c.id, "deactivate", o);
  assert.equal(d1.ok && d2.ok, true);
  assert.equal(await porte(c.id), false);
});

test("deux commandes concurrentes sur la même coupure : une seule passe, l'autre est refusée", async () => {
  const id = await ligneDe("service-access");
  const c = await cote(id, "center");
  const [x, y] = await Promise.all([commanderCoupure(c.id, "activate", { ...o }), commanderCoupure(c.id, "activate", { ...o })]);
  const statuts = [x.statut, y.statut].sort();
  assert.ok(statuts.includes("confirmed"));
  assert.ok(statuts.includes("blocked") || statuts.filter((s) => s === "confirmed").length === 2, "la seconde est soit refusée, soit un no-op confirmé après la première");
  assert.equal((await cote(id, "center")).observed, "connected");
});

test("une ligne ne reste JAMAIS à moitié branchée : si un côté échoue, ce que la commande a établi est défait", async () => {
  const id = await ligneDe("shop-documents-only");
  const main = await cote(id, "main");
  const r = await commanderLigne(id, "activate", { ...o, defauts: { [`center:ver.cut.main#${main.id}`]: "desaccord" } });
  assert.equal(r.ok, false);
  assert.equal(r.statut, "failed");
  assert.equal(await porte((await cote(id, "remote")).id), false, "le côté distant, déjà confirmé, a été remis en coupure");
  assert.equal(await porte((await cote(id, "center")).id), false);
  assert.equal(await porte(main.id), false);
  const e = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "x" });
  assert.equal(e.livre, false);
});

test("défaillance PARTIELLE signalée : le groupe et le général rendent le résultat de chaque ligne et disent « partiel »", async () => {
  const [docs, etatId, service] = await Promise.all(["shop-documents-only", "shop-intelligence-isolated", "service-access"].map(ligneDe));
  const cDocs = await cote(docs!, "center");
  const g = await commanderGroupe("boutique", "activate", { ...o, defauts: { [`center:ver.cut.center#${cDocs.id}`]: "desaccord" } });
  assert.equal(g.ok, false);
  assert.equal(g.statut, "partial");
  assert.equal(g.code, "PARTIEL");
  assert.equal(g.enfants!.filter((e) => e.ok).length, 2);
  assert.equal(g.enfants!.filter((e) => !e.ok).length, 1);
  assert.match(g.detail, /PARTIELLE/);
  assert.ok(g.incidentId);
  assert.equal((await cote(etatId!, "center")).observed, "connected");
  assert.equal((await cote(service!, "center")).observed, "connected");

  await remiseAZero();
  const cEtat = await cote(etatId!, "main");
  const gen = await commanderGeneral("activate", { ...o, defauts: { [`center:ver.cut.main#${cEtat.id}`]: "desaccord" } });
  assert.equal(gen.statut, "partial");
  assert.equal(gen.enfants!.length, 3);
  assert.deepEqual(gen.enfants!.map((e) => e.statut).sort(), ["confirmed", "confirmed", "failed"]);
  assert.match(gen.detail, /PARTIELLE/);
  assert.equal(await etat(etatId!), "failed", "la ligne en échec est signalée en erreur");
  assert.equal(await porte((await cote(etatId!, "main")).id), false, "et son contact est resté refermé");
  assert.equal(await etat(docs!), "connected");
});

test("REDÉMARRAGE : une commande interrompue ne rebranche rien ; coupé reste coupé, réserve reste désactivée, connecté reste connecté", async () => {
  const [docs, etatId, service] = await Promise.all(["shop-documents-only", "shop-intelligence-isolated", "service-access"].map(ligneDe));
  assert.equal((await commanderLigne(docs!, "activate", o)).ok, true);
  assert.equal((await commanderLigne(service!, "activate", o)).ok, true);
  assert.equal((await commanderLigne(service!, "deactivate", { acteur: PDG })).ok, true);
  // Plantage simulé en pleine activation de la ligne « état » : demandée, contact ouvert, jamais confirmée.
  const interrompue = await cote(etatId!, "center");
  await dbFrontier().update(cuts).set({ requested: "activate", progress: "in_progress" }).where(eq(cuts.id, interrompue.id));
  await dbFrontier().update(gates).set({ open: true }).where(eq(gates.cutId, interrompue.id));
  await dbFrontier().insert(commands).values({ kind: "cut", targetKind: "cut", targetId: String(interrompue.id), requested: "activate", status: "running", actorType: "pdg" });

  // « Redémarrage » : nouveau pool, migrations, fondation, reprise — comme au démarrage du serveur.
  await configurerBase(urlDeTest());
  oublierEtatBasePourTests();
  oublierFondationPourTests();
  assert.equal((await assurerBase()).prete, true);
  await assurerFondation();
  const bilan = await reprendreApresRedemarrage();
  assert.equal(bilan.commandesInterrompues, 1);
  assert.equal(bilan.coupuresReprises, 1);
  assert.equal(bilan.portesFermees, 1);

  const apres = await cote(etatId!, "center");
  assert.equal(apres.progress, "failed");
  assert.equal(await porte(apres.id), false, "la porte d'une activation interrompue est refermée");
  assert.equal(await etat(docs!), "connected", "ce qui était confirmé le reste");
  assert.equal(await etat(service!), "disconnected", "ce qui avait été coupé le reste");
  const [r] = await dbFrontier().select({ n: count() }).from(lines).where(and(eq(lines.kind, "reserve"), eq(lines.enabled, true)));
  assert.equal(Number(r!.n), 0, "une réserve reste désactivée");
  assert.ok((await incidentsOuverts("commande_interrompue")).length === 1);
  // Et rien n'a été rebranché : aucune porte ouverte en plus de celles de la ligne confirmée.
  const ouvertes = Number((await dbFrontier().select({ n: count() }).from(gates).where(eq(gates.open, true)))[0]!.n);
  assert.equal(ouvertes, 3);
});
