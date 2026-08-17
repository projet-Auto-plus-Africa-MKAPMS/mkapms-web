/**
 * MKA.P-MS AUTOMOTIVE KNOWLEDGE ENGINE — router tRPC (points 60-63, 83, 87).
 *
 * Accès direction : la mémoire technique de l'entreprise n'est pas publique, et
 * une connaissance non tranchée par le PDG ne doit pas fuiter en contenu.
 */
import { z } from "zod";
import { directionProcedure, router } from "../trpc.js";
import {
  AKE_DATA_CLASSES,
  AKE_DOMAINS,
  AKE_LICENSES,
  knowledgeEngineHealth,
  knowledgeStats,
  linkNodes,
  nodeMemory,
  searchNodes,
  upsertNode,
} from "./service.js";
import {
  AKE_AUTHORIZATIONS,
  AKE_SOURCE_KINDS,
  declareSource,
  listSources,
  recordSync,
  seedSources,
} from "./sources.js";
import {
  AKE_CLASSIFICATIONS,
  AKE_DECISIONS,
  decideDiscovery,
  discoveryStats,
  listDiscoveries,
  recordDiscovery,
} from "./discoveries.js";
import { coverageGaps, runInternalLearning, staleKnowledge } from "./learning.js";
import { WATCH_TOPICS, runWatchCycle, watchCoverage } from "./watch.js";

export const KNOWLEDGE_ENGINE_META = {
  code: "connaissance_auto",
  name: "Automotive Knowledge Engine",
  role: "Mémoire automobile reliée, datée et sourcée : connaissance ≠ publication.",
} as const;

const decisionEnum = z.enum(["oui", "non", "plus_tard", "analyser"]);

export const knowledgeEngineRouter = router({
  /** Référentiels d'affichage — aucun libellé inventé côté client. */
  referentiels: directionProcedure.query(() => ({
    domaines: Object.entries(AKE_DOMAINS).map(([code, label]) => ({ code, label })),
    classesDonnees: Object.entries(AKE_DATA_CLASSES).map(([code, label]) => ({ code, label })),
    licences: Object.entries(AKE_LICENSES).map(([code, label]) => ({ code, label })),
    typesSource: Object.entries(AKE_SOURCE_KINDS).map(([code, label]) => ({ code, label })),
    autorisations: Object.entries(AKE_AUTHORIZATIONS).map(([code, label]) => ({ code, label })),
    classifications: Object.entries(AKE_CLASSIFICATIONS).map(([code, label]) => ({ code, label })),
    decisions: Object.entries(AKE_DECISIONS).map(([code, label]) => ({ code, label })),
    sujetsVeille: WATCH_TOPICS.map((t) => ({
      code: t.code,
      label: t.label,
      classification: t.classification,
      sourcesRequises: t.sourceKinds,
    })),
  })),

  stats: directionProcedure.query(async () => knowledgeStats()),

  // ── Points 60 & 63 — mémoire reliée ───────────────────────────────────
  rechercher: directionProcedure
    .input(
      z
        .object({
          query: z.string().max(200).optional(),
          domain: z.string().max(40).optional(),
          countryCode: z.string().max(4).optional(),
          status: z.enum(["propose", "confirme", "conteste", "obsolete"]).optional(),
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => searchNodes(input ?? {})),

  memoire: directionProcedure
    .input(z.object({ nodeId: z.number().int().positive() }))
    .query(async ({ input }) => nodeMemory(input.nodeId)),

  /** Saisie manuelle d'une connaissance par la direction, provenance comprise. */
  enregistrerConnaissance: directionProcedure
    .input(
      z.object({
        domain: z.string().min(1).max(40),
        kind: z.string().min(1).max(40),
        label: z.string().min(2).max(240),
        summary: z.string().max(4000).optional(),
        countryCode: z.string().max(4).optional(),
        dataClass: z.enum(["publique", "licence", "mkapms", "fournisseur", "confidentielle"]),
        sourceCode: z.string().min(1).max(64),
        sourceRef: z.string().max(2000).optional(),
        license: z.enum(["publique", "licence", "propriete_mkapms", "fournisseur", "inconnue"]),
        licenseRef: z.string().max(2000).optional(),
        reliability: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      upsertNode({
        domain: input.domain,
        kind: input.kind,
        label: input.label,
        summary: input.summary,
        countryCode: input.countryCode ?? null,
        dataClass: input.dataClass,
        learnedByEngine: "direction",
        provenance: {
          sourceCode: input.sourceCode,
          sourceRef: input.sourceRef,
          license: input.license,
          licenseRef: input.licenseRef,
          countryCode: input.countryCode ?? null,
          reliability: input.reliability,
          learnedByEngine: `direction:${ctx.user.uid}`,
        },
      }),
    ),

  relier: directionProcedure
    .input(
      z.object({
        fromNodeId: z.number().int().positive(),
        toNodeId: z.number().int().positive(),
        relation: z.string().min(2).max(32),
        confidence: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ input }) =>
      linkNodes({ ...input, origin: "manuel" }),
    ),

  // ── Point 62 — sources externes autorisées ────────────────────────────
  sources: directionProcedure.query(async () => listSources()),

  initialiserSources: directionProcedure.mutation(async () => seedSources()),

  declarerSource: directionProcedure
    .input(
      z.object({
        code: z.string().min(2).max(64),
        label: z.string().min(2).max(160),
        kind: z.string().min(2).max(32),
        authorization: z.enum([
          "publique",
          "api_officielle",
          "licence",
          "propriete_mkapms",
          "a_verifier",
          "interdite",
        ]),
        authorizationRef: z.string().max(2000).optional(),
        countryCode: z.string().max(4).optional(),
        apiEndpoint: z.string().max(500).optional(),
        rateLimit: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => declareSource({ ...input, declaredBy: ctx.user.uid })),

  enregistrerSynchronisation: directionProcedure
    .input(
      z.object({
        code: z.string().min(2).max(64),
        ok: z.boolean(),
        detail: z.string().min(3).max(2000),
        reliability: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ input }) => recordSync(input)),

  // ── Point 61 — découvertes en attente de décision ─────────────────────
  decouvertes: directionProcedure
    .input(
      z
        .object({
          decision: z.enum(["attente", "oui", "non", "plus_tard", "analyser"]).optional(),
          classification: z.enum(["critique", "important", "opportunite", "information"]).optional(),
          domain: z.string().max(40).optional(),
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => listDiscoveries(input ?? {})),

  decouvertesStats: directionProcedure.query(async () => discoveryStats()),

  enregistrerDecouverte: directionProcedure
    .input(
      z.object({
        title: z.string().min(3).max(240),
        domain: z.string().min(1).max(40),
        detail: z.string().max(4000).optional(),
        interest: z.string().max(4000).optional(),
        relatedService: z.string().max(64).optional(),
        countryCode: z.string().max(4).optional(),
        sourceCode: z.string().max(64).optional(),
        sourceRef: z.string().max(2000).optional(),
        classification: z.enum(["critique", "important", "opportunite", "information"]).optional(),
      }),
    )
    .mutation(async ({ input }) => recordDiscovery(input)),

  /** OUI / NON / PLUS TARD / ANALYSER DAVANTAGE. */
  deciderDecouverte: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        decision: decisionEnum,
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      decideDiscovery({ ...input, actorId: ctx.user.uid }),
    ),

  // ── Point 87 — absorption des données internes, sans réentraînement ───
  apprendreInterne: directionProcedure
    .input(z.object({ limit: z.number().int().min(10).max(2000).optional() }).optional())
    .mutation(async ({ input }) => runInternalLearning({ limit: input?.limit })),

  /** Domaines du point 60 encore vides : constat, pas estimation. */
  couvertureManquante: directionProcedure.query(async () => {
    const gaps = await coverageGaps();
    return gaps.map((g) => ({ ...g, label: AKE_DOMAINS[g.domain] ?? g.domain }));
  }),

  // ── Points 64-65 — veille mondiale, pays par pays ─────────────────────
  veilleCouverture: directionProcedure.query(async () => watchCoverage()),

  lancerVeille: directionProcedure
    .input(z.object({ countryCode: z.string().max(4).optional() }).optional())
    .mutation(async ({ input }) => runWatchCycle({ countryCode: input?.countryCode })),

  connaissancesAVerifier: directionProcedure
    .input(z.object({ jours: z.number().int().min(1).max(3650).optional() }).optional())
    .query(async ({ input }) => staleKnowledge(input?.jours ?? 180)),

  health: directionProcedure.query(async () => knowledgeEngineHealth()),
});
