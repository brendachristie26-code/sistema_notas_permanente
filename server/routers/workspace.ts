import { router, adminTenantProcedure, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { workspaceMembers, workspaces, workspaceInvites, users, auditLog } from "../../drizzle/schema";
import { and, eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendInviteEmail } from "../_core/inviteEmail";

export const workspaceRouter = router({
  // Listar workspaces do usuário logado
  listMyWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slugUrl: workspaces.slugUrl,
        logoUrl: workspaces.logoUrl,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, ctx.user.id));

    return result;
  }),

  // Criar novo workspace
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slugUrl: z.string().min(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const newWs = await db.insert(workspaces).values({
        name: input.name,
        slugUrl: input.slugUrl,
      });

      const wsId = Number(newWs[0].insertId);

      // Associar criador como OWNER
      await db.insert(workspaceMembers).values({
        userId: ctx.user.id,
        workspaceId: wsId,
        role: "OWNER",
      });
      await db.insert(auditLog).values({
        workspaceId: wsId,
        userId: ctx.user.id,
        acao: "criar",
        entidade: "workspace",
        entidadeId: wsId,
        detalhes: `Workspace criado: ${input.name}`,
      });

      return { workspaceId: wsId };
    }),

  // Convidar membro com token seguro e simulação de envio de e-mail
  inviteMember: adminTenantProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["ADMIN", "USER"]).default("USER"),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      const inviteResult = await db.insert(workspaceInvites).values({
        workspaceId: ctx.workspaceId,
        email: input.email,
        role: input.role,
        token,
        status: "PENDENTE",
        expiresAt,
      });

      const inviteLink = `${input.origin}/convite/${token}`;
      const delivery = await sendInviteEmail({
        to: input.email,
        inviteLink,
        workspaceName: `Workspace ${ctx.workspaceId}`,
      });
      await db.insert(auditLog).values({
        workspaceId: ctx.workspaceId,
        userId,
        acao: "criar",
        entidade: "workspace_invite",
        entidadeId: Number(inviteResult[0].insertId),
        detalhes: `Convite criado para ${input.email}; entrega: ${delivery.sent ? "enviado" : delivery.reason}`,
      });

      return { success: true, inviteLink, delivery: delivery.sent ? "enviado" : delivery.reason };
    }),

  // Aceitar convite por token (público mas requer autenticação)
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const invite = await db
        .select()
        .from(workspaceInvites)
        .where(eq(workspaceInvites.token, input.token))
        .limit(1);

      if (invite.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite inválido." });
      }

      const inv = invite[0];
      const currentEmail = ctx.user?.email?.toLowerCase();
      if (!currentEmail || currentEmail !== inv.email.toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este convite não pertence à conta autenticada." });
      }
      if (inv.status !== "PENDENTE" || new Date() > new Date(inv.expiresAt)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Convite expirado ou já utilizado." });
      }

      // Adicionar membro somente se ainda não estiver associado; nunca rebaixar um OWNER/ADMIN.
      const existingMembership = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.userId, ctx.user.id), eq(workspaceMembers.workspaceId, inv.workspaceId)))
        .limit(1);
      if (existingMembership.length === 0) {
        await db.insert(workspaceMembers).values({
          userId: ctx.user.id,
          workspaceId: inv.workspaceId,
          role: inv.role,
        });
      }

      // Marcar convite como aceito
      await db
        .update(workspaceInvites)
        .set({ status: "ACEITO" })
        .where(eq(workspaceInvites.id, inv.id));
      await db.insert(auditLog).values({
        workspaceId: inv.workspaceId,
        userId: ctx.user.id,
        acao: "aceitar",
        entidade: "workspace_invite",
        entidadeId: inv.id,
        detalhes: `Convite aceito por ${ctx.user.email || ctx.user.id}`,
      });

      return { success: true, workspaceId: inv.workspaceId };
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

  // Auditoria específica do workspace
  listAuditLogs: adminTenantProcedure
    .input(
      z.object({
        acao: z.string().optional(),
        entidade: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(auditLog.workspaceId, ctx.workspaceId)];
      if (input?.acao) conditions.push(eq(auditLog.acao, input.acao));
      if (input?.entidade) conditions.push(eq(auditLog.entidade, input.entidade));

      const logs = await db
        .select({
          id: auditLog.id,
          acao: auditLog.acao,
          entidade: auditLog.entidade,
          entidadeId: auditLog.entidadeId,
          detalhes: auditLog.detalhes,
          createdAt: auditLog.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLog)
        .innerJoin(users, eq(auditLog.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(auditLog.createdAt))
        .limit(100);

      return logs;
    }),
});
