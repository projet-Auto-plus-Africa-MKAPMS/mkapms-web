import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure, directionProcedure } from "../trpc.js";
import { db } from "../db.js";
import { roles, permissions, rolePermissions, staffProfiles } from "../schema.js";

// RBAC configurable en base (Plan Partie 1 §4). Rôles, permissions, affectations,
// profils employés — tout modifiable par le Super Admin sans toucher au code.
export const rbacRouter = router({
  roles: publicProcedure.query(async () => {
    return db.select().from(roles).orderBy(asc(roles.level));
  }),

  permissions: adminProcedure.query(async () => {
    return db.select().from(permissions).orderBy(asc(permissions.module));
  }),

  rolePermissions: adminProcedure
    .input(z.object({ roleId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));
    }),

  createRole: directionProcedure
    .input(
      z.object({
        name: z.string().min(2),
        label: z.string().min(2),
        level: z.number().min(0).max(100).default(0),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [r] = await db.insert(roles).values(input).returning();
      return r;
    }),

  setRolePermission: directionProcedure
    .input(z.object({ roleId: z.number(), permissionId: z.number(), allowed: z.boolean() }))
    .mutation(async ({ input }) => {
      const existing = await db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, input.roleId));
      const match = existing.find((e) => e.permissionId === input.permissionId);
      if (match) {
        const [r] = await db
          .update(rolePermissions)
          .set({ allowed: input.allowed })
          .where(eq(rolePermissions.id, match.id))
          .returning();
        return r;
      }
      const [r] = await db.insert(rolePermissions).values(input).returning();
      return r;
    }),

  // Profils employés (organigramme interne).
  staff: adminProcedure.query(async () => {
    return db.select().from(staffProfiles).orderBy(asc(staffProfiles.id));
  }),

  upsertStaff: directionProcedure
    .input(
      z.object({
        id: z.number().optional(),
        userId: z.number(),
        position: z.string(),
        department: z.string().optional(),
        managerId: z.number().optional(),
        status: z.string().default("active"),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const [s] = await db
          .update(staffProfiles)
          .set({ ...rest, updatedAt: new Date() })
          .where(eq(staffProfiles.id, id))
          .returning();
        return s;
      }
      const [s] = await db.insert(staffProfiles).values(input).returning();
      return s;
    }),
});
