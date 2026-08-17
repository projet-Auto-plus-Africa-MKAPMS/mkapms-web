/**
 * Points 116-117-118 — Code Knowledge Graph et mémoire des anomalies
 * (accès PDG / Direction uniquement : c'est la carte technique de la maison).
 */
import { z } from "zod";
import { adminProcedure, router } from "../trpc.js";
import {
  apprendre,
  classes,
  etat,
  impact,
  ingest,
  lecons,
  recherche,
  reconnaitre,
} from "./service.js";

export const codeGraphRouter = router({
  /** État du relevé : présent, ingéré, à jour — ou le motif exact. */
  etat: adminProcedure.query(() => etat()),

  /** Point 116 — relève le code et enregistre ce qui a changé depuis. */
  observer: adminProcedure.mutation(() => ingest()),

  /** Point 117 — tout ce qu'un service met en jeu. */
  impact: adminProcedure
    .input(z.object({ cle: z.string().min(2).max(200) }))
    .query(({ input }) => impact(input.cle)),

  recherche: adminProcedure
    .input(z.object({ q: z.string().min(2).max(120) }))
    .query(({ input }) => recherche(input.q)),

  /** Point 118 — apprend des corrections réellement enregistrées. */
  apprendre: adminProcedure.mutation(() => apprendre()),

  lecons: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(80) }).optional())
    .query(({ input }) => lecons(input?.limit ?? 80)),

  classes: adminProcedure.query(() => classes()),

  /** « Est-ce que je connais déjà ce problème ? » */
  reconnaitre: adminProcedure
    .input(z.object({ probleme: z.string().min(3).max(2000) }))
    .query(({ input }) => reconnaitre(input.probleme)),
});
