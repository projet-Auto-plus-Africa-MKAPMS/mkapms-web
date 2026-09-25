import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";
import { verifyToken } from "./auth.js";
import { isAdmin, isDirection, isPro, isSupplierOrCarrier } from "@shared/roles.js";
import { db } from "./db.js";
import { users } from "./schema.js";

export interface AuthUser {
  uid: number;
  role: string;
  email: string;
}

/**
 * Revérifié à chaque requête (pas seulement à la connexion) : un compte
 * suspendu ou supprimé par l'admin doit perdre l'accès immédiatement, même
 * s'il possède encore un jeton valide non expiré. Sans ce contrôle,
 * "suspendre un compte" n'aurait aucun effet réel avant l'expiration du
 * jeton.
 */
export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user: AuthUser | null = null;
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const token = bearer || (req.cookies?.token as string | undefined) || null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const [row] = await db.select({ status: users.status }).from(users).where(eq(users.id, payload.uid)).limit(1);
      if (row?.status === "active") {
        user = { uid: payload.uid, role: payload.role, email: payload.email };
      }
    }
  }
  return { req, res, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zod:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Connexion requise" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !isAdmin(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès back-office requis" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireDirection = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !isDirection(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès direction requis" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requirePro = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (!isPro(ctx.user.role) && !isAdmin(ctx.user.role))) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès professionnel requis" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requirePdg = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès PDG requis" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// LOT 7 (suite) — RBAC Fournisseur/Transporteur : porte d'accès isolée,
// jamais cumulée avec requireAdmin/requireDirection/requirePro. Un
// fournisseur ou un transporteur n'accède qu'aux procédures qui l'exigent
// explicitement, jamais aux procédures back-office/direction/pro.
const requireSupplierOrCarrier = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !isSupplierOrCarrier(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès fournisseur/transporteur requis" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
export const adminProcedure = publicProcedure.use(requireAdmin);
export const directionProcedure = publicProcedure.use(requireDirection);
export const proProcedure = publicProcedure.use(requirePro);
export const pdgProcedure = publicProcedure.use(requirePdg);
export const supplierCarrierProcedure = publicProcedure.use(requireSupplierOrCarrier);
