/**
 * Points 71-72-75 — routeur du Centre de Commandes.
 *
 * Lecture et commandes écrites : direction. Voix et pipeline : PDG uniquement —
 * une commande dictée est le canal le plus facile à usurper, elle est donc le
 * plus protégé.
 */
import { z } from "zod";
import { directionProcedure, pdgProcedure, router } from "../trpc.js";
import { COMMAND_INTENTS } from "./nlu.js";
import {
  CODE_GENERATION_AVAILABLE,
  closeVoiceSession,
  commandCenterHealth,
  commandStats,
  listCommands,
  listDevRequests,
  listVoiceSessions,
  openDevRequest,
  openVoiceSession,
  sendDevRequestToPipeline,
  submitCommand,
  unmatchedCommands,
  updateDevRequest,
} from "./service.js";

export const COMMAND_CENTER_META = {
  code: "command_center",
  name: "Command & Development Center",
  role: "Commandes en langage naturel et vocales transformées en actions tracées, agent développeur passant obligatoirement par le pipeline.",
} as const;

export const commandCenterRouter = router({
  /** Ce que la plateforme sait réellement recevoir comme demande. */
  capacites: directionProcedure.query(() => ({
    intentions: COMMAND_INTENTS.map((i) => ({
      code: i.code,
      label: i.label,
      effect: i.effect,
      riskLevel: i.riskLevel,
      execution: i.actionType ? "action" : "consultation",
    })),
    generationCode: CODE_GENERATION_AVAILABLE,
  })),

  stats: directionProcedure.query(() => commandStats()),
  health: directionProcedure.query(() => commandCenterHealth()),

  // ─── Point 71 — commandes écrites ────────────────────────────────────
  envoyer: directionProcedure
    .input(z.object({ texte: z.string().min(1).max(2000), langue: z.string().max(8).optional() }))
    .mutation(({ ctx, input }) =>
      submitCommand({
        text: input.texte,
        channel: "ecrit",
        actorId: ctx.user!.uid,
        language: input.langue,
      }),
    ),

  journal: directionProcedure
    .input(z.object({ limite: z.number().int().min(1).max(300).optional() }).optional())
    .query(({ input }) => listCommands(input?.limite ?? 120)),

  nonComprises: directionProcedure.query(() => unmatchedCommands()),

  // ─── Point 72 — commandes vocales ────────────────────────────────────
  ouvrirSessionVocale: pdgProcedure
    .input(z.object({ motDePasse: z.string().min(1).max(200), appareil: z.string().max(120).optional() }))
    .mutation(({ ctx, input }) =>
      openVoiceSession({
        actorId: ctx.user!.uid,
        password: input.motDePasse,
        device: input.appareil,
      }),
    ),

  fermerSessionVocale: pdgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => closeVoiceSession(input.id, ctx.user!.uid)),

  envoyerVocal: pdgProcedure
    .input(
      z.object({
        texte: z.string().min(1).max(2000),
        sessionId: z.number().int().positive(),
        langue: z.string().max(8).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      submitCommand({
        text: input.texte,
        channel: "vocal",
        actorId: ctx.user!.uid,
        language: input.langue,
        voiceSessionId: input.sessionId,
      }),
    ),

  sessionsVocales: directionProcedure.query(() => listVoiceSessions()),

  // ─── Point 75 — agent développeur ────────────────────────────────────
  dossiers: directionProcedure.query(() => listDevRequests()),

  ouvrirDossier: directionProcedure
    .input(
      z.object({
        besoin: z.string().min(10).max(4000),
        pays: z.string().max(4).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      openDevRequest({ need: input.besoin, countryCode: input.pays ?? null, requestedBy: ctx.user!.uid }),
    ),

  completerDossier: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        analyse: z.string().max(4000).optional(),
        perimetre: z.array(z.string().max(40)).max(20).optional(),
        risque: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      }),
    )
    .mutation(({ input }) =>
      updateDevRequest({
        id: input.id,
        analysis: input.analyse,
        scope: input.perimetre,
        riskLevel: input.risque,
      }),
    ),

  /** Mise au pipeline : PDG uniquement, retour arrière obligatoire. */
  envoyerAuPipeline: pdgProcedure
    .input(z.object({ id: z.number().int().positive(), retourArriere: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) =>
      sendDevRequestToPipeline({
        id: input.id,
        rollbackPlan: input.retourArriere,
        actorId: ctx.user!.uid,
      }),
    ),
});
