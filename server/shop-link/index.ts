/**
 * Moteur intermédiaire Boutique (« shop-link ») — côté plateforme principale.
 *
 * Entre la plateforme et la Boutique il n'y a qu'un câble que le PDG coupe et rebranche, canal par canal ou en entier :
 *   catalogue   (sortant)  l'IA de la plateforme travaille dans la Boutique (jeton de service du Coffre)
 *   etat        (entrant)  état technique agrégé de la Boutique
 *   documents   (entrant)  références de documents
 *   ia-memoire  (mixte)    boîte d'échange entre les deux IA, validée par le PDG
 *   paiement, google       contrats déclarés, en attente d'activation externe côté Boutique
 * Aucun moteur de la plateforme ne parle directement à la Boutique : tout passe ici (sortant.ts / entrant.ts).
 * Les chemins déjà en place (server/intelligences/boutique.ts, shop-analysis.ts, shop-knowledge.ts) ne sont pas modifiés.
 */
import { and, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { pdgProcedure, publicProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import { creerSortant, creerSortantDepuisConnaissance, decider, listerBoite, TYPES_ECHANGE } from "./boite.js";
import { CANAUX, CANAUX_IDS, ROUTES_CATALOGUE, VERSION_CONTRAT, type CanalId } from "./contrats.js";
import { dernierEtatBoutique } from "./entrant.js";
import { shopLinkJournal } from "./schema.js";
import { MAITRE, clesActives, enregistrerCle, etatEffectif, lireCables, lireJournal, listerCles, messageCoupure, prerequis, regler, revoquerCle, toutCouper } from "./service.js";
import { viaCable } from "./sortant.js";
import { capacitesBoutique } from "../intelligences/boutique.js";

export { shopLinkApi } from "./entrant.js";
export { viaCable } from "./sortant.js";
export { etatEffectif, regler } from "./service.js";

// ── Métadonnées, santé, flux du centre de contrôle ────────────────────────────────────────────────────────────────
const V = "1.0.0";
const M: MaturityLevel = "sprint_2_complete";
export const SHOP_LINK_META = {
  name: "shop_link" as const,
  label: "Moteur intermédiaire Boutique" as const,
  version: V,
  contrat: VERSION_CONTRAT,
  maturityLevel: M,
  contract: "server/shop-link/index.ts",
};

async function compter24h() {
  const lignes = await db
    .select({ resultat: shopLinkJournal.resultat, n: sql<number>`count(*)::int` })
    .from(shopLinkJournal)
    .where(and(gt(shopLinkJournal.creeLe, sql`now() - interval '24 hours'`), sql`${shopLinkJournal.evenement} in ('appel_sortant','appel_entrant')`))
    .groupBy(shopLinkJournal.resultat);
  const par = new Map(lignes.map((l) => [l.resultat, Number(l.n)]));
  const [{ n: recents }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(shopLinkJournal)
    .where(gt(shopLinkJournal.creeLe, sql`now() - interval '5 minutes'`));
  return { ok: par.get("ok") ?? 0, refuse: par.get("refuse") ?? 0, erreur: par.get("erreur") ?? 0, recents: Number(recents) };
}

export async function healthStatus() {
  const debut = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let branches = 0;
  try {
    const cables = await lireCables();
    branches = CANAUX_IDS.filter((id) => cables.maitre.etat === "connecte" && cables.canaux[id].etat === "connecte" && CANAUX[id].activation === "disponible").length;
    await compter24h();
  } catch {
    status = "degraded";
  }
  // Câble coupé = état voulu par le PDG, pas une panne : le moteur reste « ok ».
  return { engine: SHOP_LINK_META.name, version: V, status, checkedAt: new Date().toISOString(), metrics: { canauxBranches: branches, canauxDeclares: CANAUX_IDS.length, responseMs: Date.now() - debut } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const debut = Date.now();
  const h = await healthStatus();
  let compteurs = { ok: 0, refuse: 0, erreur: 0, recents: 0 };
  try {
    compteurs = await compter24h();
  } catch {
    /* santé déjà dégradée */
  }
  return {
    engine: SHOP_LINK_META.name,
    label: SHOP_LINK_META.label,
    version: V,
    maturityLevel: M,
    health: h.status,
    load: { events5m: compteurs.recents, events24h: compteurs.ok + compteurs.refuse + compteurs.erreur },
    performance: { lastResponseMs: Date.now() - debut },
    errors: { last24h: compteurs.erreur },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  const recents = await lireJournal({ limite: 10 });
  return {
    ...feed,
    businessMetrics: { canaux_branches: h.metrics.canauxBranches, canaux_declares: h.metrics.canauxDeclares, cles_actives: (await clesActives()).length },
    recentEvents: recents.filter((l) => l.resultat === "ok").map((l) => ({ at: l.creeLe.toISOString(), action: `${l.canal}:${l.evenement}`, metadata: { sens: l.sens } })),
    recentErrors: recents.filter((l) => l.resultat !== "ok").map((l) => ({ at: l.creeLe.toISOString(), message: `${l.canal}:${l.evenement} ${l.detail}`.trim() })),
  };
}

// ── État complet pour l'écran du PDG ───────────────────────────────────────────────────────────────────────────────
export async function etatComplet(ownerId: number) {
  const cables = await lireCables();
  const lignes = await db
    .select({ canal: shopLinkJournal.canal, resultat: shopLinkJournal.resultat, n: sql<number>`count(*)::int`, dernier: sql<Date | null>`max(${shopLinkJournal.creeLe})` })
    .from(shopLinkJournal)
    .where(and(gt(shopLinkJournal.creeLe, sql`now() - interval '24 hours'`), sql`${shopLinkJournal.evenement} not in ('cable','cle_enregistree','cle_revoquee','sortant_cree','approuve','rejete')`))
    .groupBy(shopLinkJournal.canal, shopLinkJournal.resultat);
  const canaux = await Promise.all(
    CANAUX_IDS.map(async (id) => {
      const c = CANAUX[id];
      const passage = await etatEffectif(id);
      const mes = lignes.filter((l) => l.canal === id);
      return {
        id,
        libelle: c.libelle,
        sens: c.sens,
        description: c.description,
        contratBoutique: c.contratBoutique,
        donneesAutorisees: c.donneesAutorisees,
        donneesInterdites: c.donneesInterdites,
        planCoupure: c.planCoupure,
        activation: c.activation,
        raisonAttente: c.raisonAttente ?? null,
        etat: cables.canaux[id].etat,
        motif: cables.canaux[id].motif,
        modifieLe: cables.canaux[id].modifieLe,
        passe: passage.passe,
        raisonBlocage: passage.passe ? null : passage.raison ?? null,
        prerequisManquants: await prerequis(id, ownerId),
        dernierPassage: mes.reduce<Date | null>((acc, l) => (l.dernier && (!acc || l.dernier > acc) ? l.dernier : acc), null),
        ok24h: mes.filter((l) => l.resultat === "ok").reduce((s, l) => s + Number(l.n), 0),
        refus24h: mes.filter((l) => l.resultat === "refuse").reduce((s, l) => s + Number(l.n), 0),
        erreurs24h: mes.filter((l) => l.resultat === "erreur").reduce((s, l) => s + Number(l.n), 0),
      };
    }),
  );
  const etatBoutique = await dernierEtatBoutique();
  return {
    contrat: VERSION_CONTRAT,
    maitre: { etat: cables.maitre.etat, motif: cables.maitre.motif, modifieLe: cables.maitre.modifieLe },
    canaux,
    etatBoutique: etatBoutique ? { recuLe: etatBoutique.recuLe, observeLe: etatBoutique.observeLe, contenu: etatBoutique.contenu } : null,
    routesCatalogue: ROUTES_CATALOGUE.length,
  };
}

// ── Routeur tRPC (PDG) ──────────────────────────────────────────────────────────────────────────────────────────────
const canalSchema = z.enum(CANAUX_IDS);
const motifSchema = z.string().trim().min(3).max(240);

export const shopLinkRouter = router({
  meta: publicProcedure.query(() => SHOP_LINK_META),
  healthStatus: pdgProcedure.query(() => healthStatus()),
  controlCenterFeed: pdgProcedure.query(() => controlCenterFeed()),
  dashboard: pdgProcedure.query(() => dashboard()),

  etat: pdgProcedure.query(({ ctx }) => etatComplet(ctx.user.uid)),

  /** Branche ou coupe un canal (ou le commutateur général : canal « maitre »). */
  regler: pdgProcedure
    .input(z.object({ cible: z.union([canalSchema, z.literal(MAITRE)]), etat: z.enum(["connecte", "coupe"]), motif: motifSchema }))
    .mutation(({ ctx, input }) => regler(input.cible, input.etat, { motif: input.motif, acteur: ctx.user.uid })),

  toutCouper: pdgProcedure.input(z.object({ motif: motifSchema })).mutation(({ ctx, input }) => toutCouper({ motif: input.motif, acteur: ctx.user.uid })),

  journal: pdgProcedure.input(z.object({ canal: z.string().max(32).optional(), limite: z.number().int().min(1).max(500).default(100) }).optional()).query(({ input }) => lireJournal({ canal: input?.canal, limite: input?.limite })),

  cles: pdgProcedure.query(() => listerCles()),
  enregistrerCle: pdgProcedure
    .input(z.object({ libelle: z.string().trim().min(2).max(80), clePublique: z.string().trim().min(40).max(200) }))
    .mutation(({ ctx, input }) => enregistrerCle({ libelle: input.libelle, clePublique: input.clePublique, acteur: ctx.user.uid })),
  revoquerCle: pdgProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => revoquerCle({ id: input.id, acteur: ctx.user.uid })),

  boite: pdgProcedure
    .input(z.object({ sens: z.enum(["entrant", "sortant"]).optional(), etat: z.string().max(16).optional() }).optional())
    .query(({ input }) => listerBoite({ sens: input?.sens, etat: input?.etat })),
  creerSortant: pdgProcedure
    .input(z.object({ type: z.enum(TYPES_ECHANGE), titre: z.string().trim().min(3).max(160), contenu: z.string().trim().min(10).max(4000), source: z.string().trim().max(120).default("") }))
    .mutation(({ ctx, input }) => creerSortant({ ...input, acteur: ctx.user.uid })),
  creerSortantDepuisConnaissance: pdgProcedure
    .input(z.object({ connaissanceId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => creerSortantDepuisConnaissance({ connaissanceId: input.connaissanceId, acteur: ctx.user.uid })),
  decider: pdgProcedure
    .input(z.object({ id: z.number().int().positive(), approuver: z.boolean() }))
    .mutation(({ ctx, input }) => decider({ id: input.id, approuver: input.approuver, acteur: ctx.user.uid })),

  /** Essai réel en lecture seule du canal catalogue : demande à la Boutique la liste de ses portées, à travers le câble. */
  tester: pdgProcedure.mutation(async ({ ctx }) => {
    const r = await viaCable({ ownerId: ctx.user.uid, outil: "shop_link.tester", motif: "Essai du câble Boutique demandé par le PDG" }, (acces, f) => capacitesBoutique(acces, f));
    const passage = await etatEffectif("catalogue");
    return r.ok
      ? { ok: true, detail: "La Boutique a répondu à travers le câble." }
      : { ok: false, code: "code" in r ? r.code ?? null : null, detail: !passage.passe ? messageCoupure(passage.raison) : r.detail };
  }),
});
