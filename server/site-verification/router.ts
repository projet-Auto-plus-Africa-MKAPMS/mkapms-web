/**
 * Vérification de propriété du site — pilotage PDG.
 *
 * Lecture réservée à la direction, écriture réservée au PDG : un jeton de
 * vérification donne accès aux outils de référencement du domaine.
 */
import { z } from "zod";
import { router, adminProcedure, pdgProcedure } from "../trpc.js";
import { logAction } from "../audit.js";
import { env } from "../env.js";
import {
  VERIFICATION_PROVIDERS,
  checkRendered,
  saveToken,
  verificationStatus,
} from "./index.js";

const providerSchema = z.enum(VERIFICATION_PROVIDERS);

/**
 * L'adresse contrôlée vient de la configuration de la plateforme, jamais de
 * l'en-tête `Host` de la requête : sinon un appelant pourrait faire émettre au
 * serveur une requête vers l'hôte de son choix.
 */
function baseUrlPublique(): string {
  return env.PUBLIC_URL.replace(/\/+$/, "");
}

export const siteVerificationRouter = router({
  /** État de configuration réel, plateforme par plateforme. */
  etat: adminProcedure.query(() => verificationStatus()),

  /** Enregistre le jeton collé depuis Search Console (ou l'efface si vide). */
  definir: pdgProcedure
    .input(z.object({ plateforme: providerSchema, jeton: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const res = await saveToken({
        provider: input.plateforme,
        saisie: input.jeton,
        userId: ctx.user.uid,
      });
      await logAction(ctx.user.uid, "site_verification.definir", "seo", null, {
        plateforme: input.plateforme,
        jetons: res.jetons,
      });
      return { ...res, etat: verificationStatus() };
    }),

  /** Lit le site public et confirme que les balises sont réellement rendues. */
  verifierRendu: adminProcedure.mutation(async () => {
    return checkRendered(baseUrlPublique());
  }),
});
