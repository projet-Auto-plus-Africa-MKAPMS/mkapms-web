/**
 * Point 123 — routes du moteur d'authenticité média.
 *
 * Le côté public se limite à ce qu'un visiteur a besoin de savoir : les
 * déclarations possibles au dépôt et l'étiquette portée par un média publié.
 * Le constat détaillé, les preuves et les décisions restent à la direction.
 */
import { z } from "zod";
import { pdgProcedure, publicProcedure, router } from "../trpc.js";
import {
  DECLARATIONS,
  DECLARATION_LABELS,
  DETECTEURS,
  LABEL_LABELS,
  type Declaration,
  type LabelCode,
} from "./definition.js";
import { decider, detail, etat, incidents } from "./service.js";

export const MEDIA_AUTHENTICITY_META = {
  code: "media_authenticity",
  name: "MKA.P-MS Media Authenticity",
  role: "Protège photos, vidéos, voix, documents et annonces : provenance, réutilisation, étiquetage et incidents.",
} as const;

export const mediaAuthenticityRouter = router({
  /** Déclarations proposées au dépôt (point 144) — lisibles par tout déposant. */
  declarations: publicProcedure.query(() =>
    DECLARATIONS.map((code) => ({ code, label: DECLARATION_LABELS[code as Declaration] })),
  ),

  /** Étiquettes visibles d'un média publié (point 127) — jamais les preuves. */
  etiquettes: publicProcedure
    .input(z.object({ mediaId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const d = await detail(input.mediaId);
      if (!d) return { trouve: false as const, labels: [] };
      return {
        trouve: true as const,
        labels: d.labels
          .filter((l) => l.visible)
          .map((l) => ({
            code: l.code,
            label: LABEL_LABELS[l.code as LabelCode] ?? l.code,
          })),
      };
    }),

  /** Centre d'incidents média (point 128) — direction seule. */
  etat: pdgProcedure.query(() => etat()),

  detecteurs: pdgProcedure.query(() =>
    DETECTEURS.map((d) => ({
      code: d.code,
      label: d.label,
      cherche: d.cherche,
      nature: d.nature,
      dependance: d.dependance,
      poidsMax: d.poidsMax,
    })),
  ),

  incidents: pdgProcedure
    .input(
      z.object({
        statut: z.enum(["ouvert", "tranche", "clos"]).optional(),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    )
    .query(({ input }) => incidents(input.statut, input.limit)),

  media: pdgProcedure
    .input(z.object({ mediaId: z.number().int().positive() }))
    .query(({ input }) => detail(input.mediaId)),

  /** Décision humaine : le moteur ne tranche jamais seul un cas grave. */
  trancher: pdgProcedure
    .input(
      z.object({
        incidentId: z.number().int().positive(),
        decision: z.enum(["autoriser", "etiqueter", "bloquer"]),
        motif: z.string().min(5).max(2000),
      }),
    )
    .mutation(({ input, ctx }) =>
      decider({
        incidentId: input.incidentId,
        decision: input.decision,
        motif: input.motif,
        decidePar: ctx.user?.uid,
      }),
    ),
});
