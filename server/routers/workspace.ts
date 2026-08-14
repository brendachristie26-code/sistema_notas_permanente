import { router, adminTenantProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { workspaceMembers, users } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const workspaceRouter = router({
  inviteMember: adminTenantProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["ADMIN", "USER"]).default("USER"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const targetUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (targetUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário com este email não encontrado no sistema.",
        });
      }

      const userId = targetUser[0].id;

      await db.insert(workspaceMembers).values({
        userId,
        workspaceId: ctx.workspaceId,
        role: input.role,
      });

      return { success: true };
    }),

  listMembers: adminTenantProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const members = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        name: users.name,
        email: users.email,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, ctx.workspaceId));

    return members;
  }),
});
