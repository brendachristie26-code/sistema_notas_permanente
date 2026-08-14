import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getDb } from "../db";
import { workspaceMembers } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado." });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

const enforceWorkspaceAccess = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado." });
  }

  const wid = Number(ctx.workspaceId || 1);

  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  }

  const membership = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, ctx.user.id),
        eq(workspaceMembers.workspaceId, wid)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Usuário não pertence a este workspace." });
  }

  const member = membership[0];

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      workspaceId: wid,
      workspaceRole: member.role,
    },
  });
});

export const tenantProcedure = t.procedure.use(enforceWorkspaceAccess);

export const adminTenantProcedure = t.procedure.use(enforceWorkspaceAccess).use(
  t.middleware(async opts => {
    const { ctx } = opts;
    const role = (ctx as any).workspaceRole;

    if (role !== "OWNER" && role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores do workspace." });
    }

    return opts.next({
      ctx,
    });
  })
);
