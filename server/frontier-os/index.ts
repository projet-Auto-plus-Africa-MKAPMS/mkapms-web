/**
 * Centre Cyber-Électrique MKA.P-MS / Frontier OS — point d'entrée du moteur « frontier_os » (plateforme principale).
 *
 * Centre de contrôle, de sécurité, de réparation et de pilotage entre plateformes, avec sa PROPRE base (schéma « frontier », migrateur et
 * journal propres). Réservé au PDG (super_admin). Aucune clé d'accès ni API externe : tous les moteurs sont internes. SIMULATION seulement :
 * rien de réel n'est branché ni débranché d'ici ; la gouvernance du câble réel de la Boutique est facultative et armée par le PDG.
 */
import { TRPCError } from "@trpc/server";
import { count, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { dbFrontier } from "./base/connexion.js";
import { assurerBase, etatBase } from "./base/demarrage.js";
import { auditLog, platforms } from "./base/schema.js";
import { pdgProcedure, publicProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, MaturityLevel } from "../identity-os/contract.js";
import { ACTION_REELLE_ACTIVEE, MODE } from "./regles.js";
import { annulerReparation, appliquerReparation, cloreIncident, lancerDiagnostic, proposerReparation, testerReparation } from "./atelier.js";
import { commanderCoupure, commanderGeneral, commanderGroupe, commanderLigne, definirLigneActivee, deverrouillerLigne, verrouillerLigne } from "./commandes.js";
import { demarrerCentre } from "./demarrage-centre.js";
import { ajouterGroupe, importerInventaire, VERSION_CENTRE } from "./fondation.js";
import { armerReel, definirModeLigne, desarmerReel, reconcilierLiaisonsReelles, reelVue } from "./reel.js";
import { resoudreLacune } from "./developpement.js";
import { armerGouvernance, desarmerGouvernance } from "./gouvernance.js";
import type { Acteur } from "./journal.js";
import { echantillonnerCentre, mesurerCapacites } from "./mesures.js";
import { lancerProtocoleCoupures, lancerProtocolePannes } from "./protocole.js";
import { arreterMoteur, demarrerMoteur, verifierSanteMoteurs } from "./sante.js";
import { enregistrerResultatExterne, envoyer as envoyerEchange, rejouer } from "./transport.js";
import {
  accueil, atelierVue, auditVue, commandeDetail, commandesVue, echangesVue, employesVue, futuresVue, groupesVue, incidentsVue, inventaireResume, lignesVue, memoireVue, mesuresVue, moteurDetail,
  moteursListe, salleBoutique, sallesListe, securiteVue, sessionsVue,
} from "./vues.js";
import { connecteurVue, controleCentraleVue, definirIdentiteCentre, identiteVue, moteursDeclaresListe, salleDeclareeVue, surveillanceVue } from "./declares.js";
import { etapesDemarrage, etatNoyau } from "./noyau.js";
import { envoyer as envoyerBus } from "./bus.js";
import { MOTEURS_INTERNES } from "./moteurs-internes.js";

const V = VERSION_CENTRE;
const M: MaturityLevel = "sprint_1_minimal";
export const FRONTIER_OS_META = {
  name: "frontier_os" as const,
  label: "Centre Cyber-Électrique MKA.P-MS / Frontier OS" as const,
  version: V,
  maturityLevel: M,
  mode: MODE,
  actionReelle: ACTION_REELLE_ACTIVEE,
  contract: "server/frontier-os/index.ts",
};

export async function healthStatus() {
  const debut = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let plateformes = 0;
  try {
    const base = await assurerBase();
    if (!base.prete) status = "degraded";
    else plateformes = Number((await dbFrontier().select({ c: count() }).from(platforms))[0]?.c ?? 0);
  } catch {
    status = "degraded";
  }
  return { engine: FRONTIER_OS_META.name, version: V, status, checkedAt: new Date().toISOString(), metrics: { plateformes, mode: MODE, baseSeparee: etatBase().separee, responseMs: Date.now() - debut } };
}

/** Flux du centre de contrôle de la plateforme : lecture seule, ne pose jamais la fondation. */
export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const debut = Date.now();
  const h = await healthStatus();
  let evenements24h = 0;
  let recents = 0;
  let erreurs = 0;
  if (etatBase().prete) {
    try {
      const j = await dbFrontier()
        .select({ resultat: auditLog.result, n: sql<number>`count(*)::int`, r5: sql<number>`count(*) filter (where ${auditLog.at} > now() - interval '5 minutes')::int` })
        .from(auditLog)
        .where(gt(auditLog.at, sql`now() - interval '24 hours'`))
        .groupBy(auditLog.result);
      for (const l of j) {
        evenements24h += Number(l.n);
        recents += Number(l.r5);
        if (l.resultat === "error") erreurs += Number(l.n);
      }
    } catch {
      /* santé déjà dégradée si la base répond mal */
    }
  }
  return {
    engine: FRONTIER_OS_META.name, label: FRONTIER_OS_META.label, version: V, maturityLevel: M, health: h.status,
    load: { events5m: recents, events24h: evenements24h }, performance: { lastResponseMs: Date.now() - debut }, errors: { last24h: erreurs },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

const pret = async () => {
  try {
    await demarrerCentre();
  } catch (e) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `La base du centre n'est pas prête : ${(e as Error).message}` });
  }
};
const acteurPdg = (uid: number): Acteur => ({ type: "pdg", id: uid });
const id = z.number().int().positive();
const voulu = z.enum(["activate", "deactivate"]);

export const frontierOsRouter = router({
  meta: publicProcedure.query(() => FRONTIER_OS_META),
  healthStatus: pdgProcedure.query(() => healthStatus()),
  controlCenterFeed: pdgProcedure.query(() => controlCenterFeed()),

  /** État de la base du centre, lisible même si elle n'est pas prête (pour dire pourquoi). */
  base: pdgProcedure.query(async () => ({ ...(await assurerBase()), schema: "frontier" })),

  accueil: pdgProcedure.query(async () => {
    await pret();
    return accueil();
  }),
  salles: pdgProcedure.query(async () => {
    await pret();
    return sallesListe();
  }),
  groupes: pdgProcedure.query(async () => {
    await pret();
    return groupesVue();
  }),
  lignes: pdgProcedure.input(z.object({ groupe: z.string().max(40).optional() }).optional()).query(async ({ input }) => {
    await pret();
    return lignesVue(input?.groupe);
  }),
  moteurs: pdgProcedure
    .input(z.object({ plateforme: z.string().max(40).optional(), kind: z.string().max(32).optional(), etat: z.string().max(16).optional(), q: z.string().max(80).optional(), declareSeulement: z.boolean().optional(), limite: z.number().int().min(1).max(1000).optional() }).optional())
    .query(async ({ input }) => {
      await pret();
      return moteursListe(input ?? {});
    }),
  moteur: pdgProcedure.input(z.object({ code: z.string().min(2).max(120) })).query(async ({ input }) => {
    await pret();
    return moteurDetail(input.code);
  }),
  salleBoutique: pdgProcedure.input(z.object({ plateforme: z.string().min(2).max(40) })).query(async ({ input }) => {
    await pret();
    return salleBoutique(input.plateforme);
  }),
  inventaire: pdgProcedure.query(async () => inventaireResume()),
  securite: pdgProcedure.query(async () => {
    await pret();
    return securiteVue();
  }),
  atelier: pdgProcedure.query(async () => {
    await pret();
    return atelierVue();
  }),
  incidents: pdgProcedure.input(z.object({ limite: z.number().int().min(1).max(500).default(100) }).optional()).query(async ({ input }) => {
    await pret();
    return incidentsVue(input?.limite ?? 100);
  }),
  audit: pdgProcedure.input(z.object({ limite: z.number().int().min(1).max(500).default(100), resultat: z.enum(["ok", "refused", "error"]).optional() }).optional()).query(async ({ input }) => {
    await pret();
    return auditVue(input?.limite ?? 100, input?.resultat);
  }),
  commandes: pdgProcedure.query(async () => {
    await pret();
    return commandesVue();
  }),
  commande: pdgProcedure.input(z.object({ id })).query(async ({ input }) => {
    await pret();
    return commandeDetail(input.id);
  }),
  sessions: pdgProcedure.query(async () => {
    await pret();
    return sessionsVue();
  }),
  memoire: pdgProcedure.query(async () => {
    await pret();
    return memoireVue();
  }),
  employes: pdgProcedure.query(async () => {
    await pret();
    return employesVue();
  }),
  futures: pdgProcedure.query(async () => {
    await pret();
    return futuresVue();
  }),
  echanges: pdgProcedure.input(z.object({ ligneId: id.optional() }).optional()).query(async ({ input }) => {
    await pret();
    return echangesVue(input?.ligneId);
  }),
  mesures: pdgProcedure.query(async () => {
    await pret();
    return mesuresVue();
  }),

  // ── Commandes : trois coupures, grand contact du groupe, interrupteur général ──
  coupure: pdgProcedure.input(z.object({ coupureId: id, voulu, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return commanderCoupure(input.coupureId, input.voulu, { acteur: acteurPdg(ctx.user.uid), confirme: input.confirme });
  }),
  ligne: pdgProcedure.input(z.object({ ligneId: id, voulu, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return commanderLigne(input.ligneId, input.voulu, { acteur: acteurPdg(ctx.user.uid), confirme: input.confirme });
  }),
  groupe: pdgProcedure.input(z.object({ groupe: z.string().min(2).max(40), voulu, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return commanderGroupe(input.groupe, input.voulu, { acteur: acteurPdg(ctx.user.uid), confirme: input.confirme });
  }),
  general: pdgProcedure.input(z.object({ voulu, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return commanderGeneral(input.voulu, { acteur: acteurPdg(ctx.user.uid), confirme: input.confirme });
  }),
  verrouiller: pdgProcedure.input(z.object({ ligneId: id, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return verrouillerLigne(input.ligneId, { acteur: acteurPdg(ctx.user.uid), confirme: input.confirme });
  }),
  deverrouiller: pdgProcedure.input(z.object({ ligneId: id, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return deverrouillerLigne(input.ligneId, { acteur: acteurPdg(ctx.user.uid), confirme: input.confirme });
  }),
  activerLigne: pdgProcedure.input(z.object({ ligneId: id, activee: z.boolean(), confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return definirLigneActivee(input.ligneId, input.activee, { acteur: acteurPdg(ctx.user.uid), confirme: input.confirme });
  }),
  ajouterGroupe: pdgProcedure.input(z.object({ code: z.string().min(2).max(40), nom: z.string().min(2).max(160), plateforme: z.string().max(40).nullable().default(null) })).mutation(async ({ ctx, input }) => {
    await pret();
    return ajouterGroupe(input.code, input.nom, input.plateforme, acteurPdg(ctx.user.uid));
  }),

  // ── Tests ──
  protocole: pdgProcedure.input(z.object({ ligneId: id, type: z.enum(["coupures", "pannes"]).default("coupures") })).mutation(async ({ ctx, input }) => {
    await pret();
    return input.type === "pannes" ? lancerProtocolePannes(input.ligneId, acteurPdg(ctx.user.uid)) : lancerProtocoleCoupures(input.ligneId, acteurPdg(ctx.user.uid));
  }),
  echangeEssai: pdgProcedure.input(z.object({ ligneId: id, sens: z.enum(["remote_to_main", "main_to_remote"]).default("remote_to_main"), nature: z.enum(["message", "task", "payment_external"]).default("message") })).mutation(async ({ input }) => {
    await pret();
    const r = await envoyerEchange({ ligneId: input.ligneId, direction: input.sens, kind: input.nature, payloadRef: "essai:vitrine" });
    return { livre: r.livre, etat: r.echange.state, refus: r.refus ?? null, echangeId: r.echange.id };
  }),
  rejouerEchange: pdgProcedure.input(z.object({ id })).mutation(async ({ ctx, input }) => {
    await pret();
    return { ok: await rejouer(input.id, acteurPdg(ctx.user.uid)) };
  }),
  resultatExterne: pdgProcedure.input(z.object({ id, reference: z.string().min(1).max(160) })).mutation(async ({ input }) => {
    await pret();
    return { ok: await enregistrerResultatExterne(input.id, input.reference) };
  }),

  // ── Moteurs internes et mesures ──
  sante: pdgProcedure.mutation(async ({ ctx }) => {
    await pret();
    return verifierSanteMoteurs(acteurPdg(ctx.user.uid));
  }),
  moteurArreter: pdgProcedure.input(z.object({ code: z.string().min(2).max(120), confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return arreterMoteur(input.code, acteurPdg(ctx.user.uid), input.confirme);
  }),
  moteurDemarrer: pdgProcedure.input(z.object({ code: z.string().min(2).max(120), confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return demarrerMoteur(input.code, acteurPdg(ctx.user.uid), input.confirme);
  }),
  mesurer: pdgProcedure.mutation(async () => {
    await pret();
    await echantillonnerCentre();
    const sonder = async () => {
      await envoyerBus({ de: "center:monitor", vers: "center:ver.cut.center", type: "sante.verifier", contenu: {} });
    };
    const paires = MOTEURS_INTERNES.filter((m) => m.kind === "command" || m.kind === "verification").map((m) => m.code);
    const b = await mesurerCapacites(sonder, paires);
    return { ...b, note: "Le facteur mesuré est le gain de débit à deux sondes en parallèle, dans le même processus et la même base. Il ne prouve PAS une redondance : si le processus ou la base tombent, les deux moteurs tombent avec eux." };
  }),
  gouvernance: pdgProcedure.input(z.object({ armer: z.boolean(), confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return input.armer ? armerGouvernance(acteurPdg(ctx.user.uid), input.confirme) : desarmerGouvernance(acteurPdg(ctx.user.uid), input.confirme);
  }),
  // ── Mode réel : deux clés (environnement + armement du PDG), ligne par ligne, jamais rebranché tout seul ──
  reel: pdgProcedure.query(async ({ ctx }) => {
    await pret();
    return reelVue(ctx.user.uid);
  }),
  armerReel: pdgProcedure.input(z.object({ phrase: z.string().max(80) })).mutation(async ({ ctx, input }) => {
    await pret();
    return armerReel(acteurPdg(ctx.user.uid), input.phrase);
  }),
  desarmerReel: pdgProcedure.input(z.object({ confirme: z.literal(true) })).mutation(async ({ ctx }) => {
    await pret();
    return desarmerReel(acteurPdg(ctx.user.uid));
  }),
  modeLigne: pdgProcedure.input(z.object({ ligneId: id, mode: z.enum(["simulation", "real"]), confirme: z.literal(true) })).mutation(async ({ ctx, input }) => {
    await pret();
    return definirModeLigne(input.ligneId, input.mode, acteurPdg(ctx.user.uid));
  }),
  reconcilier: pdgProcedure.mutation(async ({ ctx }) => {
    await pret();
    return reconcilierLiaisonsReelles(acteurPdg(ctx.user.uid));
  }),
  importerInventaire: pdgProcedure.mutation(async ({ ctx }) => {
    await pret();
    return importerInventaire(acteurPdg(ctx.user.uid));
  }),

  // ── Atelier ──
  diagnostic: pdgProcedure.mutation(async ({ ctx }) => {
    await pret();
    return lancerDiagnostic(acteurPdg(ctx.user.uid));
  }),
  proposer: pdgProcedure.input(z.object({ incidentId: id })).mutation(async ({ ctx, input }) => {
    await pret();
    return proposerReparation(input.incidentId, acteurPdg(ctx.user.uid));
  }),
  tester: pdgProcedure.input(z.object({ reparationId: id })).mutation(async ({ ctx, input }) => {
    await pret();
    return testerReparation(input.reparationId, acteurPdg(ctx.user.uid));
  }),
  appliquer: pdgProcedure.input(z.object({ reparationId: id, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return appliquerReparation(input.reparationId, acteurPdg(ctx.user.uid), input.confirme);
  }),
  annuler: pdgProcedure.input(z.object({ reparationId: id, confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    return annulerReparation(input.reparationId, acteurPdg(ctx.user.uid), input.confirme);
  }),
  cloreIncident: pdgProcedure.input(z.object({ incidentId: id, raison: z.string().min(3).max(200) })).mutation(async ({ ctx, input }) => {
    await pret();
    return cloreIncident(input.incidentId, acteurPdg(ctx.user.uid), input.raison);
  }),

  // ── Lacunes de développement : « je ne peux pas faire ça, il me faut tel développement » ──
  resoudreLacune: pdgProcedure.input(z.object({ code: z.string().min(1).max(80), note: z.string().min(3).max(2000), confirme: z.literal(true) })).mutation(async ({ ctx, input }) => {
    await pret();
    return resoudreLacune(input.code, acteurPdg(ctx.user.uid), input.note, input.confirme);
  }),

  // ── Moteurs déclarés (migration 0005) : sept nouvelles salles, Connecteur A, Connecteur B, connecteurs MKAPMS Shop — préparés, jamais actifs par défaut ──
  moteursDeclares: pdgProcedure.input(z.object({ roomCode: z.string().max(60).optional(), connectorSet: z.string().max(60).optional() }).optional()).query(async ({ input }) => {
    await pret();
    return moteursDeclaresListe(input ?? {});
  }),
  salleDeclaree: pdgProcedure.input(z.object({ roomCode: z.string().min(2).max(60) })).query(async ({ input }) => {
    await pret();
    return salleDeclareeVue(input.roomCode);
  }),
  controleCentrale: pdgProcedure.query(async () => {
    await pret();
    return controleCentraleVue();
  }),
  surveillance: pdgProcedure.query(async () => {
    await pret();
    return surveillanceVue();
  }),
  connecteur: pdgProcedure.input(z.object({ set: z.string().min(2).max(60) })).query(async ({ input }) => {
    await pret();
    return connecteurVue(input.set);
  }),
  identiteCentre: pdgProcedure.query(async () => {
    await pret();
    return identiteVue();
  }),
  definirIdentiteCentre: pdgProcedure.input(z.object({ nom: z.string().min(2).max(120), confirme: z.literal(true) })).mutation(async ({ ctx, input }) => {
    await pret();
    return definirIdentiteCentre(input.nom, acteurPdg(ctx.user.uid));
  }),

  // ── Noyau central : démarrage visuel honnête, état lu en base, aucun connecteur, aucun accès externe ──
  noyau: pdgProcedure.query(async () => {
    await pret();
    const [etat, etapes] = await Promise.all([etatNoyau(), etapesDemarrage()]);
    return { etat, etapes };
  }),
});
