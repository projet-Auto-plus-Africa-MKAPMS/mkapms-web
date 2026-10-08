/**
 * Centre Cyber-Électrique MKA.P-MS / Frontier OS — point d'entrée du moteur « frontier_os » (plateforme principale).
 *
 * Le centre de contrôle, de sécurité, de réparation et de pilotage entre plateformes : Boutique à gauche, plateforme principale à droite,
 * entre les deux des moteurs intermédiaires, des interrupteurs, des lignes et un grand pointage rouge. Réservé au PDG (super_admin),
 * aucune clé d'accès ni API externe pour le moment, SIMULATION uniquement : rien de réel n'est branché ni débranché d'ici.
 */
import { count, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { pdgProcedure, publicProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, MaturityLevel } from "../identity-os/contract.js";
import { foAuditLogs, foPlatforms } from "./schema.js";
import { ACTION_REELLE_ACTIVEE, MODE } from "./rules.js";
import {
  accueil, actionnerInterrupteur, annulerReparation, appuyerBouton, assurerFondationUneFois, atelierListe, boutonsListe, comptageBoutique, ecartsPlateformeBoutique, groupesVue, journalListe, journaliser,
  lignesVue, memoireListe, moteurDetail, moteursListe, sallesListe, verifierIntegrite, type Acteur,
} from "./service.js";

export { assurerFondation, assurerFondationUneFois } from "./service.js";

const V = "1.0.0";
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
    plateformes = Number((await db.select({ c: count() }).from(foPlatforms))[0]?.c ?? 0);
  } catch {
    status = "degraded";
  }
  return { engine: FRONTIER_OS_META.name, version: V, status, checkedAt: new Date().toISOString(), metrics: { plateformes, mode: MODE, responseMs: Date.now() - debut } };
}

/** Flux du centre de contrôle : lecture seule, ne pose jamais la fondation (c'est le premier accès du PDG qui la pose). */
export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const debut = Date.now();
  const h = await healthStatus();
  let evenements24h = 0;
  let recents = 0;
  let erreurs = 0;
  try {
    const j = await db
      .select({ resultat: foAuditLogs.result, n: sql<number>`count(*)::int`, r5: sql<number>`count(*) filter (where ${foAuditLogs.createdAt} > now() - interval '5 minutes')::int` })
      .from(foAuditLogs)
      .where(gt(foAuditLogs.createdAt, sql`now() - interval '24 hours'`))
      .groupBy(foAuditLogs.result);
    for (const l of j) {
      evenements24h += Number(l.n);
      recents += Number(l.r5);
      if (l.resultat === "error") erreurs += Number(l.n);
    }
  } catch {
    /* santé déjà dégradée si la base répond mal */
  }
  return {
    engine: FRONTIER_OS_META.name, label: FRONTIER_OS_META.label, version: V, maturityLevel: M, health: h.status,
    load: { events5m: recents, events24h: evenements24h }, performance: { lastResponseMs: Date.now() - debut }, errors: { last24h: erreurs },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

const pret = () => assurerFondationUneFois();
const acteurPdg = (uid: number): Acteur => ({ type: "pdg", id: uid });

export const frontierOsRouter = router({
  meta: publicProcedure.query(() => FRONTIER_OS_META),
  healthStatus: pdgProcedure.query(() => healthStatus()),
  controlCenterFeed: pdgProcedure.query(() => controlCenterFeed()),

  /** Pose (ou complète) la fondation : plateformes, groupes, moteurs, paires, boutons, zones, lignes réelles et réserve de lignes futures. */
  fondation: pdgProcedure.mutation(async () => pret()),

  accueil: pdgProcedure.query(async () => {
    await pret();
    return accueil();
  }),
  groupes: pdgProcedure.query(async () => {
    await pret();
    return groupesVue();
  }),
  lignes: pdgProcedure.input(z.object({ groupId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => {
    await pret();
    return lignesVue(input?.groupId);
  }),
  moteurs: pdgProcedure
    .input(z.object({ plateforme: z.string().max(40).optional(), type: z.string().max(32).optional(), statut: z.string().max(16).optional(), q: z.string().max(80).optional(), limite: z.number().int().min(1).max(1000).optional() }).optional())
    .query(async ({ input }) => {
      await pret();
      return moteursListe(input ?? {});
    }),
  moteur: pdgProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    await pret();
    return moteurDetail(input.id);
  }),
  salles: pdgProcedure.query(async () => {
    await pret();
    return sallesListe();
  }),
  boutons: pdgProcedure.query(async () => {
    await pret();
    return boutonsListe();
  }),

  /** Seul point d'entrée des boutons : deux moteurs distincts requis, confirmation pour les actions critiques, tout journalisé. */
  appuyer: pdgProcedure
    .input(z.object({ boutonId: z.number().int().positive(), ligneId: z.number().int().positive().optional(), reparationId: z.number().int().positive().optional(), confirme: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      await pret();
      return appuyerBouton({ ...input, acteur: acteurPdg(ctx.user.uid) });
    }),
  interrupteur: pdgProcedure
    .input(z.object({ id: z.number().int().positive(), etat: z.enum(["ON", "OFF"]), confirme: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      await pret();
      const acteur = acteurPdg(ctx.user.uid);
      if (input.etat === "ON" && !input.confirme) {
        await journaliser({ acteur, action: "switch_on", cible: "switch", cibleId: input.id, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
        return { ok: false, code: "CONFIRMATION_REQUISE" as const, detail: "Mettre un interrupteur sur ON est une action critique : confirmation requise." };
      }
      return actionnerInterrupteur(input.id, input.etat, acteur);
    }),

  atelier: pdgProcedure.query(async () => {
    await pret();
    return atelierListe();
  }),
  annulerReparation: pdgProcedure.input(z.object({ id: z.number().int().positive(), confirme: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
    await pret();
    const acteur = acteurPdg(ctx.user.uid);
    if (!input.confirme) {
      await journaliser({ acteur, action: "rollback", cible: "repair", cibleId: input.id, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
      return { ok: false, code: "CONFIRMATION_REQUISE" as const, detail: "Annuler une réparation est une action critique : confirmation requise." };
    }
    return annulerReparation(input.id, acteur);
  }),
  journal: pdgProcedure.input(z.object({ limite: z.number().int().min(1).max(500).default(100), resultat: z.enum(["ok", "refused", "error"]).optional() }).optional()).query(async ({ input }) => {
    await pret();
    return journalListe(input?.limite ?? 100, input?.resultat);
  }),
  memoire: pdgProcedure.query(async () => {
    await pret();
    return memoireListe();
  }),
  /** Le comptage des moteurs intermédiaires de la Boutique, avec ses preuves, et les écarts avec la plateforme. */
  comptage: pdgProcedure.query(async () => ({ ...comptageBoutique(), ecarts: await ecartsPlateformeBoutique() })),
  integrite: pdgProcedure.query(async () => {
    await pret();
    return { violations: await verifierIntegrite() };
  }),
});

