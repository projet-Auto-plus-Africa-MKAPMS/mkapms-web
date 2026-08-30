/**
 * Préférences utilisateur MKA.P-MS — persistance réelle des choix de compte.
 *
 * Les écrans Paramètres → Confidentialité, Coaching et Cookies affichaient des
 * interrupteurs purement décoratifs : le bouton « Enregistrer » ne faisait rien
 * et tout était perdu au retour. Ce moteur stocke réellement ces choix, par
 * espace (`namespace`), et les expose aux autres moteurs qui doivent les
 * respecter (annonces pour la visibilité du téléphone, messagerie pour le droit
 * de contact).
 *
 * Les canaux de notification restent gérés par le Notification OS
 * (`notif_user_preferences`) : ce moteur ne les duplique pas.
 */
import { and, eq } from "drizzle-orm";
import { integer, jsonb, pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { protectedProcedure, router } from "../trpc.js";

export const userPreferences = pgTable("user_preferences", {
  userId: integer("user_id").notNull(),
  namespace: varchar("namespace", { length: 32 }).notNull(),
  valeurs: jsonb("valeurs").$type<Record<string, boolean>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique("user_preferences_unique").on(t.userId, t.namespace) }));

/**
 * Clés autorisées et valeur par défaut de chaque espace. Une clé absente de
 * cette table est refusée : l'écran ne peut pas inventer un réglage que
 * personne n'applique.
 */
export const ESPACES_PREFERENCES = {
  confidentialite: {
    showPhone: false,
    showEmail: false,
    showAddress: false,
    showLastSeen: true,
    showAnnonces: true,
    allowSearch: true,
    allowContact: true,
  },
  coaching: {
    coachingEnabled: true,
    coachingTips: true,
    coachingAnnonce: true,
    coachingPrix: true,
  },
  cookies: {
    analytics: false,
    marketing: false,
  },
} as const;

export type EspacePreferences = keyof typeof ESPACES_PREFERENCES;

const NOMS_ESPACES = Object.keys(ESPACES_PREFERENCES) as [EspacePreferences, ...EspacePreferences[]];

function defauts(espace: EspacePreferences): Record<string, boolean> {
  return { ...ESPACES_PREFERENCES[espace] };
}

/** Ne conserve que les clés connues de l'espace, complétées par les défauts. */
function normaliser(espace: EspacePreferences, valeurs: Record<string, boolean>): Record<string, boolean> {
  const sortie = defauts(espace);
  for (const cle of Object.keys(sortie)) {
    if (typeof valeurs[cle] === "boolean") sortie[cle] = valeurs[cle];
  }
  return sortie;
}

export async function lirePreferences(
  userId: number,
  espace: EspacePreferences,
): Promise<Record<string, boolean>> {
  const [ligne] = await db
    .select()
    .from(userPreferences)
    .where(and(eq(userPreferences.userId, userId), eq(userPreferences.namespace, espace)))
    .limit(1);
  return normaliser(espace, ligne?.valeurs ?? {});
}

export async function ecrirePreferences(
  userId: number,
  espace: EspacePreferences,
  valeurs: Record<string, boolean>,
): Promise<Record<string, boolean>> {
  const normalisees = normaliser(espace, valeurs);
  await db
    .insert(userPreferences)
    .values({ userId, namespace: espace, valeurs: normalisees })
    .onConflictDoUpdate({
      target: [userPreferences.userId, userPreferences.namespace],
      set: { valeurs: normalisees, updatedAt: new Date() },
    });
  return normalisees;
}

/**
 * Confidentialité appliquée par les autres moteurs. Le compte qui a refusé
 * d'afficher son numéro ne doit pas voir son téléphone de profil ressorti sur
 * une annonce, et celui qui a coupé les messages directs ne doit pas être
 * contacté.
 */
export async function confidentialiteDe(userId: number): Promise<{
  showPhone: boolean;
  showEmail: boolean;
  allowContact: boolean;
  allowSearch: boolean;
}> {
  const p = await lirePreferences(userId, "confidentialite");
  return {
    showPhone: p.showPhone,
    showEmail: p.showEmail,
    allowContact: p.allowContact,
    allowSearch: p.allowSearch,
  };
}

export const userPreferencesRouter = router({
  espaces: protectedProcedure.query(() => ESPACES_PREFERENCES),

  get: protectedProcedure
    .input(z.object({ espace: z.enum(NOMS_ESPACES) }))
    .query(({ ctx, input }) => lirePreferences(ctx.user.uid, input.espace)),

  set: protectedProcedure
    .input(z.object({
      espace: z.enum(NOMS_ESPACES),
      valeurs: z.record(z.string(), z.boolean()),
    }))
    .mutation(({ ctx, input }) => ecrirePreferences(ctx.user.uid, input.espace, input.valeurs)),
});
