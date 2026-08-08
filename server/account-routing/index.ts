/**
 * MKA.P-MS Account Routing Engine (point 25).
 *
 * Règle centrale : chaque compte retourne automatiquement dans son univers.
 * Le calcul vit dans `shared/account-routing` afin que le client et le serveur
 * prennent exactement la même décision — une page ne peut pas router ailleurs
 * que ce que le serveur autorise.
 *
 * Moteur distinct du Redirection Engine : celui-ci résout des destinations
 * publiques (clés → cibles), celui-là décide de l'univers d'un compte.
 */
import { z } from "zod";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { users } from "../schema.js";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  UNIVERSE_ROUTES,
  isInternalUniverse,
  isProfessionalUniverse,
  resolveAccountRoute,
  type AccountRoute,
} from "@shared/account-routing.js";

export const ACCOUNT_ROUTING_META = {
  code: "account_routing",
  name: "Account Routing Engine",
  role: "Retour automatique de chaque compte dans son univers (particulier, métiers, administration, direction, PDG).",
} as const;

export interface AccountRouteResult extends AccountRoute {
  /** L'univers est-il professionnel ? Sert à ne rien mélanger côté interface. */
  professional: boolean;
  /** Univers interne MKA.P-MS (équipe) ? */
  internal: boolean;
}

async function routeForUser(userId: number): Promise<AccountRouteResult | null> {
  const [u] = await db
    .select({
      role: users.role,
      accountType: users.accountType,
      proCategory: users.proCategory,
      staffPosition: users.staffPosition,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (!u) return null;

  const route = resolveAccountRoute(u);
  return {
    ...route,
    professional: isProfessionalUniverse(route.universe),
    internal: isInternalUniverse(route.universe),
  };
}

/**
 * Répartition réelle des comptes par univers + univers encore sans espace
 * dédié. Aucun vert de complaisance : un univers en repli est signalé.
 */
export async function accountRoutingHealth(): Promise<{
  health: "ok" | "degraded" | "down";
  comptes: number;
  parUnivers: { universe: string; comptes: number }[];
  universSansEspaceDedie: string[];
  details: string[];
}> {
  try {
    const rows = await db
      .select({
        role: users.role,
        accountType: users.accountType,
        proCategory: users.proCategory,
        staffPosition: users.staffPosition,
        n: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.role, users.accountType, users.proCategory, users.staffPosition);

    const tally = new Map<string, number>();
    let total = 0;
    for (const r of rows) {
      const { universe } = resolveAccountRoute(r);
      tally.set(universe, (tally.get(universe) ?? 0) + r.n);
      total += r.n;
    }

    const fallbacks = Object.values(UNIVERSE_ROUTES)
      .filter((d) => d.fallback)
      .map((d) => d.universe);

    return {
      // Un univers en repli n'est pas une panne du moteur : c'est un espace
      // pas encore construit. On l'affiche sans dégrader la santé.
      health: "ok",
      comptes: total,
      parUnivers: Array.from(tally, ([universe, comptes]) => ({ universe, comptes })).sort(
        (a, b) => b.comptes - a.comptes,
      ),
      universSansEspaceDedie: fallbacks,
      details: fallbacks.length
        ? [`espace dédié à construire : ${fallbacks.join(", ")}`]
        : [],
    };
  } catch (err) {
    return {
      health: "down",
      comptes: 0,
      parUnivers: [],
      universSansEspaceDedie: [],
      details: [(err as Error).message],
    };
  }
}

export const accountRoutingRouter = router({
  /** Univers du compte connecté : où il doit revenir. */
  mine: protectedProcedure.query(({ ctx }) => routeForUser(ctx.user!.uid)),

  /** Carte des univers et de leurs destinations (lecture publique). */
  universes: publicProcedure.query(() =>
    Object.values(UNIVERSE_ROUTES).map((d) => ({
      universe: d.universe,
      homePath: d.homePath,
      label: d.label,
      fallback: !!d.fallback,
      professional: isProfessionalUniverse(d.universe),
      internal: isInternalUniverse(d.universe),
    })),
  ),

  /** Contrôle d'un compte donné (administration). */
  forUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(({ input }) => routeForUser(input.userId)),

  health: adminProcedure.query(() => accountRoutingHealth()),
});
