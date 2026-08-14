import { router, adminTenantProcedure, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { workspaceMembers, workspaces, workspaceInvites, users, auditLog } from "../../drizzle/schema";
import { and, eq, desc, gte, lte } from "drizzle-orm";
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

  updateMemberRole: adminTenantProcedure
    .input(z.object({ memberId: z.number(), role: z.enum(["ADMIN", "USER"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const target = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.id, input.memberId), eq(workspaceMembers.workspaceId, ctx.workspaceId)))
        .limit(1);

      if (target.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membro não encontrado." });
      }

      if (target[0].role === "OWNER" && target[0].userId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Não é permitido alterar o papel do proprietário do workspace." });
      }

      await db
        .update(workspaceMembers)
        .set({ role: input.role })
        .where(eq(workspaceMembers.id, input.memberId));

      return { success: true };
    }),

  listInvites: adminTenantProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        sortBy: z.enum(["createdAt", "email"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const sortBy = input?.sortBy ?? "createdAt";
      const sortOrder = input?.sortOrder ?? "desc";

      const queryBase = db
        .select()
        .from(workspaceInvites)
        .where(and(eq(workspaceInvites.workspaceId, ctx.workspaceId), eq(workspaceInvites.status, "PENDENTE")));

      const allItems = await queryBase.orderBy(
        sortOrder === "desc" ? desc(workspaceInvites[sortBy as keyof typeof workspaceInvites._.columns]) : workspaceInvites[sortBy as keyof typeof workspaceInvites._.columns]
      );

      const total = allItems.length;
      const items = allItems.slice((page - 1) * pageSize, page * pageSize);

      return { items, total };
    }),

  revokeInvite: adminTenantProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const invite = await db
        .select()
        .from(workspaceInvites)
        .where(and(eq(workspaceInvites.id, input.inviteId), eq(workspaceInvites.workspaceId, ctx.workspaceId)))
        .limit(1);

      if (invite.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Convite não encontrado." });
      }

      await db
        .update(workspaceInvites)
        .set({ status: "EXPIRADO" })
        .where(eq(workspaceInvites.id, input.inviteId));

      return { success: true };
    }),

  // Auditoria específica do workspace
  listAuditLogs: adminTenantProcedure
    .input(
      z.object({
        acao: z.string().optional(),
        entidade: z.string().optional(),
        search: z.string().optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(10),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const conditions = [eq(auditLog.workspaceId, ctx.workspaceId)];
      if (input?.acao) conditions.push(eq(auditLog.acao, input.acao));
      if (input?.entidade) conditions.push(eq(auditLog.entidade, input.entidade));
      if (input?.dataInicio) conditions.push(gte(auditLog.createdAt, input.dataInicio));
      if (input?.dataFim) {
        const endOfDay = new Date(input.dataFim);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(lte(auditLog.createdAt, endOfDay));
      }

      const allItems = await db
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
        .orderBy(desc(auditLog.createdAt));

      const searchTerm = input?.search?.toLowerCase().trim();
      const filtered = searchTerm
        ? allItems.filter(item =>
            (item.detalhes?.toLowerCase() ?? "").includes(searchTerm) ||
            (item.entidade?.toLowerCase() ?? "").includes(searchTerm) ||
            (item.userEmail?.toLowerCase() ?? "").includes(searchTerm) ||
            (item.userName?.toLowerCase() ?? "").includes(searchTerm)
          )
        : allItems;

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const total = filtered.length;
      const items = filtered.slice((page - 1) * pageSize, page * pageSize);

      return { items, total };
    }),

  auditActivitySummary: adminTenantProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const days = input?.days ?? 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await db
      .select({
        userName: users.name,
        userEmail: users.email,
        acao: auditLog.acao,
      })
      .from(auditLog)
      .innerJoin(users, eq(auditLog.userId, users.id))
      .where(and(eq(auditLog.workspaceId, ctx.workspaceId), gte(auditLog.createdAt, cutoff)));

    const map: Record<string, { name: string; total: number; criar: number; atualizar: number; deletar: number; outros: number }> = {};

    for (const log of logs) {
      const key = log.userEmail || log.userName || "Desconhecido";
      if (!map[key]) {
        map[key] = { name: key, total: 0, criar: 0, atualizar: 0, deletar: 0, outros: 0 };
      }
      map[key].total += 1;
      if (log.acao === "criar") map[key].criar += 1;
      else if (log.acao === "atualizar") map[key].atualizar += 1;
      else if (log.acao === "deletar") map[key].deletar += 1;
      else map[key].outros += 1;
    }

    return Object.values(map).sort((a, b) => b.total - a.total);
  }),

  auditTrendSummary: adminTenantProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const days = input?.days ?? 30;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const logs = await db
        .select({
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .where(and(eq(auditLog.workspaceId, ctx.workspaceId), gte(auditLog.createdAt, cutoff)))
        .orderBy(auditLog.createdAt);

      const trendMap: Record<string, number> = {};
      for (const log of logs) {
        const dateKey = new Date(log.createdAt).toISOString().split("T")[0];
        trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
      }

      return Object.entries(trendMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }),

  importMembersCsv: adminTenantProcedure
    .input(z.object({ csvData: z.string(), role: z.enum(["ADMIN", "USER"]).default("USER") }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const lines = input.csvData.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      let importedCount = 0;
      let errorsCount = 0;

      for (const line of lines) {
        const email = line.replace(/^["']|["']$/g, "").trim();
        if (!email || !email.includes("@")) {
          errorsCount++;
          continue;
        }

        const userRecord = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (userRecord.length === 0) {
          errorsCount++;
          continue;
        }

        const userId = userRecord[0].id;
        const existingMember = await db
          .select()
          .from(workspaceMembers)
          .where(and(eq(workspaceMembers.workspaceId, ctx.workspaceId), eq(workspaceMembers.userId, userId)))
          .limit(1);

        if (existingMember.length === 0) {
          await db.insert(workspaceMembers).values({
            workspaceId: ctx.workspaceId,
            userId,
            role: input.role,
          });
          importedCount++;
        }
      }

      return { success: true, importedCount, errorsCount };
    }),
});
