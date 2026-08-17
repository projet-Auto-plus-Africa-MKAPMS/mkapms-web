/**
 * MKA.P-MS AUTOMOTIVE R&D LAB — router tRPC (points 79-80-81-82).
 *
 * Accès direction en lecture et déclaration ; les décisions structurantes
 * (création de projet, versement d'un actif au graphe partagé) restent au PDG.
 * Aucune procédure publique : le laboratoire n'est pas un contenu.
 */
import { z } from "zod";
import { directionProcedure, pdgProcedure, router } from "../trpc.js";
import {
  CHAIN_LABELS,
  INDUSTRIAL_CHAIN,
  RD_BRANCHES,
  RD_DATA_CLASSES,
  RD_DOMAINS,
  createProject,
  declareAsset,
  ecosystemSnapshot,
  listAssets,
  listEcosystemSnapshots,
  listProjects,
  projectChain,
  rdLabHealth,
  rdStats,
  setChainLink,
  shareAssetToGraph,
  updateProject,
} from "./service.js";

export const RD_LAB_META = {
  code: "rd_lab",
  name: "Automotive R&D Lab",
  role: "Laboratoire séparé des services vendus : connaissances industrielles, chaîne véhicule, droits d'usage.",
} as const;

const chainEnum = z.enum(INDUSTRIAL_CHAIN);

export const rdLabRouter = router({
  /** Référentiels — aucun libellé inventé côté client. */
  referentiels: directionProcedure.query(() => ({
    branches: Object.entries(RD_BRANCHES).map(([code, label]) => ({ code, label })),
    domaines: RD_DOMAINS,
    maillons: INDUSTRIAL_CHAIN.map((code) => ({ code, label: CHAIN_LABELS[code] })),
    classesDonnees: Object.entries(RD_DATA_CLASSES).map(([code, v]) => ({
      code,
      label: v.label,
      regime: v.regime,
    })),
  })),

  stats: directionProcedure.query(() => rdStats()),
  health: directionProcedure.query(() => rdLabHealth()),

  // ─── Point 79 ───────────────────────────────────────────────────────────
  projets: directionProcedure.query(() => listProjects()),

  creerProjet: pdgProcedure
    .input(
      z.object({
        code: z.string().min(2).max(48),
        titre: z.string().min(3).max(240),
        branche: z.string().min(2).max(32),
        domaine: z.string().min(2).max(48),
        objectif: z.string().min(10),
        pays: z.string().length(2).nullable().optional(),
        confidentialite: z.enum(["interne", "confidentiel", "secret"]).optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      createProject({
        code: input.code,
        title: input.titre,
        branch: input.branche,
        domain: input.domaine,
        objective: input.objectif,
        countryCode: input.pays ?? null,
        confidentiality: input.confidentialite,
        createdBy: ctx.user.uid,
      }),
    ),

  majProjet: pdgProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        objectif: z.string().min(10).optional(),
        statut: z.enum(["etude", "en_cours", "pause", "archive"]).optional(),
        confidentialite: z.enum(["interne", "confidentiel", "secret"]).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(({ input }) =>
      updateProject({
        id: input.id,
        objective: input.objectif,
        status: input.statut,
        confidentiality: input.confidentialite,
        notes: input.notes,
      }),
    ),

  // ─── Point 80 ───────────────────────────────────────────────────────────
  chaine: directionProcedure
    .input(z.object({ projetId: z.number().int().positive() }))
    .query(({ input }) => projectChain(input.projetId)),

  renseignerMaillon: directionProcedure
    .input(
      z.object({
        projetId: z.number().int().positive(),
        maillon: chainEnum,
        contenu: z.string().min(5),
        appui: z.string().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      setChainLink({
        projectId: input.projetId,
        link: input.maillon,
        content: input.contenu,
        evidence: input.appui,
        actorId: ctx.user.uid,
      }),
    ),

  // ─── Point 82 ───────────────────────────────────────────────────────────
  actifs: directionProcedure.query(() => listAssets()),

  declarerActif: directionProcedure
    .input(
      z.object({
        titre: z.string().min(3).max(240),
        branche: z.string().min(2).max(32),
        domaine: z.string().min(2).max(48),
        resume: z.string().optional(),
        classe: z.enum(["publique", "licence", "mkapms", "fournisseur", "confidentielle"]),
        licence: z.enum(["publique", "licence", "propriete_mkapms", "fournisseur", "inconnue"]),
        referenceLicence: z.string().optional(),
        source: z.string().optional(),
        referenceSource: z.string().optional(),
        fournisseur: z.string().optional(),
        pays: z.string().length(2).nullable().optional(),
        projetId: z.number().int().positive().nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      declareAsset({
        title: input.titre,
        branch: input.branche,
        domain: input.domaine,
        summary: input.resume,
        dataClass: input.classe,
        license: input.licence,
        licenseRef: input.referenceLicence,
        sourceLabel: input.source,
        sourceRef: input.referenceSource,
        supplier: input.fournisseur,
        countryCode: input.pays ?? null,
        projectId: input.projetId ?? null,
        declaredBy: ctx.user.uid,
      }),
    ),

  verserAuGraphe: pdgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input, ctx }) => shareAssetToGraph({ id: input.id, actorId: ctx.user.uid })),

  // ─── Point 81 ───────────────────────────────────────────────────────────
  ecosysteme: directionProcedure
    .input(z.object({ pays: z.string().length(2) }))
    .query(({ input }) => ecosystemSnapshot(input.pays)),

  releverEcosysteme: pdgProcedure
    .input(z.object({ pays: z.string().length(2) }))
    .mutation(({ input }) => ecosystemSnapshot(input.pays, { save: true })),

  relevesEcosysteme: directionProcedure.query(() => listEcosystemSnapshots()),
});
