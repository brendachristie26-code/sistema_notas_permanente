import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  listAgentes,
  getAgenteById,
  createAgente,
  updateAgente,
  deleteAgente,
  listProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  deleteProduto,
  listNotasFiscais,
  getNotaFiscalById,
  createNotaFiscal,
  updateNotaFiscal,
  deleteNotaFiscal,
  listPagamentos,
  getPagamentoById,
  getPagamentoByNotaId,
  createPagamento,
  updatePagamento,
  getDashboardStats,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  agentes: router({
    list: protectedProcedure.query(() => listAgentes()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getAgenteById(input.id)),
    create: protectedProcedure
      .input(z.object({ nome: z.string(), email: z.string().email(), telefone: z.string().optional() }))
      .mutation(({ input }) => createAgente({ nome: input.nome, email: input.email, telefone: input.telefone })),
    update: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional(), email: z.string().email().optional(), telefone: z.string().optional() }))
      .mutation(({ input }) => updateAgente(input.id, { nome: input.nome, email: input.email, telefone: input.telefone })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteAgente(input.id)),
  }),

  produtos: router({
    list: protectedProcedure.query(() => listProdutos()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getProdutoById(input.id)),
    create: protectedProcedure
      .input(z.object({ nome: z.string(), descricao: z.string().optional(), precoUnitario: z.number() }))
      .mutation(({ input }) => createProduto({ nome: input.nome, descricao: input.descricao, precoUnitario: Math.round(input.precoUnitario * 100) })),
    update: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional(), descricao: z.string().optional(), precoUnitario: z.number().optional() }))
      .mutation(({ input }) => updateProduto(input.id, { nome: input.nome, descricao: input.descricao, precoUnitario: input.precoUnitario ? Math.round(input.precoUnitario * 100) : undefined })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteProduto(input.id)),
  }),

  notasFiscais: router({
    list: protectedProcedure.query(() => listNotasFiscais()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getNotaFiscalById(input.id)),
    create: protectedProcedure
      .input(z.object({
        numero: z.string(),
        agenteId: z.number(),
        produtoId: z.number(),
        quantidade: z.number().default(1),
        valorUnitario: z.number(),
        valorTotal: z.number(),
        dataEmissao: z.date(),
        descricao: z.string().optional(),
        arquivoPdfUrl: z.string().optional(),
        arquivoPdfKey: z.string().optional(),
      }))
      .mutation(({ input }) => createNotaFiscal({
        numero: input.numero,
        agenteId: input.agenteId,
        produtoId: input.produtoId,
        quantidade: input.quantidade,
        valorUnitario: Math.round(input.valorUnitario * 100),
        valorTotal: Math.round(input.valorTotal * 100),
        dataEmissao: input.dataEmissao,
        descricao: input.descricao,
        arquivoPdfUrl: input.arquivoPdfUrl,
        arquivoPdfKey: input.arquivoPdfKey,
      })),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        numero: z.string().optional(),
        agenteId: z.number().optional(),
        produtoId: z.number().optional(),
        quantidade: z.number().optional(),
        valorUnitario: z.number().optional(),
        valorTotal: z.number().optional(),
        dataEmissao: z.date().optional(),
        descricao: z.string().optional(),
        arquivoPdfUrl: z.string().optional(),
        arquivoPdfKey: z.string().optional(),
      }))
      .mutation(({ input }) => updateNotaFiscal(input.id, {
        numero: input.numero,
        agenteId: input.agenteId,
        produtoId: input.produtoId,
        quantidade: input.quantidade,
        valorUnitario: input.valorUnitario ? Math.round(input.valorUnitario * 100) : undefined,
        valorTotal: input.valorTotal ? Math.round(input.valorTotal * 100) : undefined,
        dataEmissao: input.dataEmissao,
        descricao: input.descricao,
        arquivoPdfUrl: input.arquivoPdfUrl,
        arquivoPdfKey: input.arquivoPdfKey,
      })),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteNotaFiscal(input.id)),
  }),

  pagamentos: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(({ input }) => listPagamentos(input.status)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getPagamentoById(input.id)),
    getByNotaId: protectedProcedure.input(z.object({ notaFiscalId: z.number() })).query(({ input }) => getPagamentoByNotaId(input.notaFiscalId)),
    create: protectedProcedure
      .input(z.object({ notaFiscalId: z.number(), status: z.string().default("Pendente"), observacoes: z.string().optional() }))
      .mutation(({ input }) => createPagamento({ notaFiscalId: input.notaFiscalId, status: input.status as any, observacoes: input.observacoes })),
    update: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string().optional(), dataPagamento: z.date().optional(), observacoes: z.string().optional() }))
      .mutation(({ input }) => updatePagamento(input.id, { status: input.status as any, dataPagamento: input.dataPagamento, observacoes: input.observacoes })),
  }),

  dashboard: router({
    stats: protectedProcedure.query(() => getDashboardStats()),
  }),
});

export type AppRouter = typeof appRouter;
