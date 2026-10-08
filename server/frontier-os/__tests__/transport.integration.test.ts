/**
 * La coupure appliquée par le service de transport : voie directe, tâche en file, reprise automatique, voie secondaire, échange en vol,
 * paiement déjà transmis. Après une coupure confirmée : aucun nouvel échange ne franchit la frontière, une tâche en attente ne rétablit
 * rien, une reprise respecte l'état désactivé.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { and, eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { cuts, exchanges } from "../base/schema.js";
import { commanderCoupure, commanderLigne, reprendreApresRedemarrage } from "../commandes.js";
import { appliquerCoupure, enregistrerResultatExterne, envoyer, mettreEnFile, regulariserEchangesEnVol, rejouer, traiterFile, type Livreur } from "../transport.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero } from "./utilitaires.js";

const o = { acteur: PDG, confirme: true } as const;
before(baseNeuve);
after(fermer);
beforeEach(remiseAZero);

const etatEchange = async (id: number) => (await dbFrontier().select().from(exchanges).where(eq(exchanges.id, id)))[0]!;
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
const demande = (ligneId: number, extra: Partial<Parameters<typeof envoyer>[0]> = {}) => ({ ligneId, direction: "remote_to_main" as const, kind: "message" as const, payloadRef: "ref:essai", ...extra });
const cote = async (ligneId: number, side: "remote" | "center" | "main") => (await dbFrontier().select().from(cuts).where(and(eq(cuts.lineId, ligneId), eq(cuts.side, side))).limit(1))[0]!;

test("après une coupure confirmée, plus aucun nouvel échange ne franchit la frontière — par aucune voie", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  assert.equal((await envoyer(demande(id))).livre, true, "connectée : l'échange passe");
  assert.equal((await commanderLigne(id, "deactivate", { acteur: PDG })).ok, true);
  const direct = await envoyer(demande(id));
  assert.equal(direct.livre, false);
  assert.equal(direct.echange.state, "refused");
  const secondaire = await envoyer(demande(id, { route: "secondary" }));
  assert.equal(secondaire.livre, false, "la voie secondaire passe par la même décision");
  assert.equal(secondaire.echange.route, "secondary");
  const sens = await envoyer(demande(id, { direction: "main_to_remote" }));
  assert.equal(sens.livre, false, "dans les deux sens");
  const tache = await mettreEnFile(demande(id));
  const bilan = await traiterFile(undefined, { maintenant: new Date(Date.now() + 1000) });
  assert.equal(bilan.suspendus, 1);
  assert.equal(bilan.livres, 0);
  assert.equal((await etatEchange(tache.id)).state, "suspended");
});

test("une tâche en attente ne rétablit JAMAIS la liaison : suspendue à la coupure, elle ne repart pas à la réactivation ; seul le PDG peut la rejouer", async () => {
  const id = await ligneDe("service-access");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  const tache = await mettreEnFile(demande(id));
  const paiement = await mettreEnFile(demande(id, { kind: "payment_external" }));
  assert.equal((await commanderLigne(id, "deactivate", { acteur: PDG })).ok, true);
  assert.equal((await etatEchange(tache.id)).state, "suspended", "coupure demandée : la tâche en attente est suspendue");
  assert.equal((await etatEchange(paiement.id)).state, "suspended", "un paiement pas encore transmis est simplement suspendu");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  const bilan = await traiterFile();
  assert.equal(bilan.traites, 0, "la réactivation ne remet RIEN en route toute seule");
  assert.equal((await etatEchange(tache.id)).state, "suspended");
  assert.equal(await rejouer(tache.id, PDG), true);
  const bilan2 = await traiterFile();
  assert.equal(bilan2.livres, 1);
  assert.equal((await etatEchange(tache.id)).state, "delivered");
  assert.equal(await rejouer(tache.id, PDG), false, "on ne rejoue qu'un échange suspendu");
});

test("les reprises automatiques respectent l'état désactivé : chaque tentative refait la décision de passage", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  let appels = 0;
  const capricieux: Livreur = async () => {
    appels += 1;
    return { ok: false, erreur: "destinataire occupé" };
  };
  const t = await mettreEnFile(demande(id, { maxTentatives: 4 }));
  const b1 = await traiterFile(capricieux);
  assert.deepEqual([b1.traites, b1.reprogrammes, appels], [1, 1, 1]);
  const e1 = await etatEchange(t.id);
  assert.equal(e1.state, "queued");
  assert.equal(e1.attempts, 1);
  assert.ok(e1.nextAttemptAt && e1.nextAttemptAt.getTime() > Date.now(), "reprise reportée");
  // 1. Par la voie normale, la coupure DEMANDÉE suspend déjà la reprise en attente (règle des échanges en vol).
  assert.equal((await commanderCoupure((await cote(id, "main")).id, "deactivate", { acteur: PDG })).ok, true);
  assert.equal((await etatEchange(t.id)).state, "suspended");
  const b2 = await traiterFile(capricieux, { maintenant: new Date(Date.now() + 60_000) });
  assert.equal(b2.traites, 0);
  assert.equal(appels, 1, "aucune tentative supplémentaire n'a franchi la coupure");

  // 2. Même si l'état de coupure change SANS passer par la règle (course, intervention directe), la reprise refait la décision et se suspend.
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  const t2 = await mettreEnFile(demande(id, { maxTentatives: 4 }));
  await traiterFile(capricieux, { maintenant: new Date(Date.now() + 120_000) });
  assert.equal((await etatEchange(t2.id)).state, "queued");
  assert.equal(appels, 2);
  await dbFrontier().update(cuts).set({ requested: "deactivate" }).where(eq(cuts.id, (await cote(id, "center")).id));
  const b3 = await traiterFile(capricieux, { maintenant: new Date(Date.now() + 600_000) });
  assert.equal(b3.suspendus, 1, "la reprise refait la décision de passage et se suspend");
  assert.equal(appels, 2, "rien n'est renvoyé");
  assert.equal((await etatEchange(t2.id)).state, "suspended");
});

test("échec définitif après le nombre de tentatives permis, tant que la ligne reste connectée", async () => {
  const id = await ligneDe("shop-intelligence-isolated");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  const t = await mettreEnFile(demande(id, { maxTentatives: 2 }));
  const ko: Livreur = async () => ({ ok: false, erreur: "non" });
  await traiterFile(ko);
  await traiterFile(ko, { maintenant: new Date(Date.now() + 60_000) });
  const e = await etatEchange(t.id);
  assert.equal(e.state, "failed");
  assert.equal(e.attempts, 2);
});

test("échange EN VOL au moment de la coupure : annulé de façon contrôlée, son résultat est écarté", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  let liberer!: () => void;
  const lent: Livreur = () => new Promise((resolve) => (liberer = () => resolve({ ok: true, resultRef: "tard" })));
  const envoi = envoyer(demande(id), lent);
  await attendre(60);
  const [enVol] = await dbFrontier().select().from(exchanges).where(eq(exchanges.state, "in_flight"));
  assert.ok(enVol, "l'échange est bien en vol");
  assert.equal((await commanderCoupure((await cote(id, "center")).id, "deactivate", { acteur: PDG })).ok, true);
  assert.equal((await etatEchange(enVol!.id)).state, "cancelled", "coupure demandée : annulé de façon contrôlée");
  liberer();
  const r = await envoi;
  assert.equal(r.livre, false);
  const final = await etatEchange(enVol!.id);
  assert.equal(final.state, "cancelled", "la fin tardive de la livraison ne ressuscite pas l'échange");
  assert.equal(final.resultRef, null, "son résultat est écarté");
});

test("PAIEMENT déjà transmis au prestataire : jamais annulé automatiquement — SUIVI, résultat enregistré et affiché, rien ne repasse la coupure", async () => {
  const id = await ligneDe("service-access");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  let liberer!: () => void;
  const prestataire: Livreur = () => new Promise((resolve) => (liberer = () => resolve({ ok: true, resultRef: "psp:paye" })));
  const envoi = envoyer(demande(id, { kind: "payment_external", externalRef: "psp:tx-42" }), prestataire);
  await attendre(60);
  const [paiement] = await dbFrontier().select().from(exchanges).where(eq(exchanges.kind, "payment_external"));
  assert.equal(paiement!.state, "in_flight");
  assert.equal((await commanderLigne(id, "deactivate", { acteur: PDG })).ok, true);
  const suivi = await etatEchange(paiement!.id);
  assert.equal(suivi.state, "tracked", "ni annulé ni livré : suivi");
  assert.match(suivi.note, /NON annulé/);
  liberer();
  await envoi;
  const apres = await etatEchange(paiement!.id);
  assert.equal(apres.state, "tracked");
  assert.equal(apres.resultRef, "psp:paye", "le résultat du prestataire est enregistré");
  assert.equal(apres.externalRef, "psp:tx-42");
  assert.equal(await enregistrerResultatExterne(paiement!.id, "psp:rembourse-partiel"), true);
  assert.equal((await etatEchange(paiement!.id)).resultRef, "psp:rembourse-partiel");
  // Et il ne repasse pas la frontière : un nouvel envoi du même paiement est refusé.
  assert.equal((await envoyer(demande(id, { kind: "payment_external" }))).livre, false);
  assert.equal(await enregistrerResultatExterne(999999, "x"), false);
});

test("redémarrage : les échanges en vol suivent la règle documentée, les échanges en attente restent en attente", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  const base = { lineId: id, direction: "remote_to_main" as const, payloadRef: "r" };
  const [msg] = await dbFrontier().insert(exchanges).values({ ...base, kind: "message", state: "in_flight" }).returning();
  const [pay] = await dbFrontier().insert(exchanges).values({ ...base, kind: "payment_external", state: "in_flight" }).returning();
  const [att] = await dbFrontier().insert(exchanges).values({ ...base, kind: "task", state: "queued", nextAttemptAt: new Date() }).returning();
  assert.equal(await regulariserEchangesEnVol(), 2);
  assert.equal((await etatEchange(msg!.id)).state, "cancelled");
  assert.equal((await etatEchange(pay!.id)).state, "tracked");
  assert.equal((await etatEchange(att!.id)).state, "queued");
  const bilan = await reprendreApresRedemarrage();
  assert.equal(bilan.echangesRegles, 0, "déjà réglés");
});

test("appliquerCoupure : la règle est appliquée une seule fois et journalisée", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  await mettreEnFile(demande(id));
  await mettreEnFile(demande(id));
  const b = await appliquerCoupure(id, PDG);
  assert.deepEqual(b, { suspendus: 2, annules: 0, suivis: 0 });
  assert.deepEqual(await appliquerCoupure(id, PDG), { suspendus: 0, annules: 0, suivis: 0 });
});

test("code : l'unique écriture d'échanges est dans le service de transport (aucune voie directe cachée)", async () => {
  const dossier = path.resolve(import.meta.dirname, "..");
  const fichiers = readdirSync(dossier).filter((f) => f.endsWith(".ts"));
  const coupables = fichiers.filter((f) => /insert\(exchanges\)|\.insert\(\s*exchanges\s*\)/.test(readFileSync(path.join(dossier, f), "utf8")) && f !== "transport.ts" && f !== "fondation.ts");
  // Les tests insèrent directement des échanges pour simuler un état, mais aucun module de production ne le fait hors du transport.
  assert.deepEqual(coupables, []);
});
