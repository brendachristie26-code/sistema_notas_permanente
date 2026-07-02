import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
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
  deletePagamento,
  getDashboardStats,
  listDespesas,
  getDespesaById,
  createDespesa,
  updateDespesa,
  deleteDespesa,
  getFluxoCaixa,
  registrarAuditLog,
  listAuditLog,
} from "./db";
import { eq, gte, lte, and } from "drizzle-orm";
import { pagamentos, notasFiscais, despesas, auditLog, orcamentos } from "../drizzle/schema";

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
      .input(z.object({ notaFiscalId: z.number(), dataVencimento: z.date(), status: z.string().default("Pendente"), observacoes: z.string().optional() }))
      .mutation(({ input }) => createPagamento({ notaFiscalId: input.notaFiscalId, dataVencimento: input.dataVencimento, status: input.status as any, observacoes: input.observacoes })),
    update: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string().optional(), dataPagamento: z.date().optional(), observacoes: z.string().optional() }))
      .mutation(({ input }) => updatePagamento(input.id, { status: input.status as any, dataPagamento: input.dataPagamento, observacoes: input.observacoes })),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deletePagamento(input.id)),
  }),

  dashboard: router({
    stats: protectedProcedure.query(() => getDashboardStats()),
    pagamentosPendentes: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const hoje = new Date();
      const result = await db.select().from(pagamentos).where(
        and(
          eq(pagamentos.status, 'Pendente' as any),
          lte(pagamentos.dataVencimento, hoje)
        )
      );
      return result;
    }),
    pagamentosRealizados: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const result = await db.select().from(pagamentos).where(
        eq(pagamentos.status, 'Pago' as any)
      );
      return result;
    }),
    proximosPagamentos: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return {};
      const hoje = new Date();
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
      const fimProximoMes = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 0);
      
      const result = await db.select().from(pagamentos).where(
        and(
          gte(pagamentos.dataVencimento, proximoMes),
          lte(pagamentos.dataVencimento, fimProximoMes),
          eq(pagamentos.status, 'Pendente' as any)
        )
      );
      
      const porDia: Record<string, { dia: string, aPagar: number }> = {};
      result.forEach(item => {
        const data = new Date(item.dataVencimento);
        const dia = data.toLocaleDateString('pt-BR');
        if (!porDia[dia]) {
          porDia[dia] = { dia, aPagar: 0 };
        }
        porDia[dia].aPagar += 1; // Incrementar contagem
      });
      return porDia;
    }),
    notasEmitidas: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(notasFiscais);
    }),
    fluxoCaixa: protectedProcedure.query(() => getFluxoCaixa()),
    
    // Rotas para gráficos
    receitasDespesasUltimos30Dias: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const hoje = new Date();
      const trinta_dias_atras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const dados: Record<string, { data: string, receitas: number, despesas: number }> = {};
      
      // Processar pagamentos (receitas)
      const pagtos = await db.select().from(pagamentos).where(
        and(
          gte(pagamentos.dataPagamento, trinta_dias_atras),
          lte(pagamentos.dataPagamento, hoje)
        )
      );
      
      pagtos.forEach((p: any) => {
        const data = new Date(p.dataPagamento || new Date()).toLocaleDateString('pt-BR');
        if (!dados[data]) dados[data] = { data, receitas: 0, despesas: 0 };
        dados[data].receitas += p.valor || 0;
      });
      
      // Processar despesas
      const desp = await db.select().from(despesas).where(
        and(
          gte(despesas.dataPagamento, trinta_dias_atras),
          lte(despesas.dataPagamento, hoje)
        )
      );
      
      desp.forEach((d: any) => {
        const data = new Date(d.dataPagamento || new Date()).toLocaleDateString('pt-BR');
        if (!dados[data]) dados[data] = { data, receitas: 0, despesas: 0 };
        dados[data].despesas += d.valor || 0;
      });
      
      return Object.values(dados).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }),
    
    despesasPorCategoria: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const desp = await db.select().from(despesas);
      const porCategoria: Record<string, number> = {};
      
      desp.forEach((d: any) => {
        if (!porCategoria[d.categoria]) porCategoria[d.categoria] = 0;
        porCategoria[d.categoria] += d.valor || 0;
      });
      
      return Object.entries(porCategoria).map(([name, value]) => ({ name, value }));
    }),
    
    topAgentes: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const notas = await db.select().from(notasFiscais);
      const porAgente: Record<number, { agenteId: number, total: number }> = {};
      
      notas.forEach((n: any) => {
        if (!porAgente[n.agenteId]) porAgente[n.agenteId] = { agenteId: n.agenteId, total: 0 };
        porAgente[n.agenteId].total += n.valor || 0;
      });
      
      return Object.values(porAgente)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(item => ({
          agenteId: item.agenteId,
          total: item.total,
          name: `Agente ${item.agenteId}`
        }));
    }),
  }),

  despesas: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(({ input }) => listDespesas(input.status)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getDespesaById(input.id)),
    create: protectedProcedure
      .input(z.object({
        descricao: z.string(),
        categoria: z.enum(["Fornecedor", "Fixo", "Variável", "Imposto", "Outro"]),
        valor: z.number(),
        dataVencimento: z.date(),
        dataPagamento: z.date().optional(),
        status: z.enum(["Pendente", "Pago", "Cancelado"]).default("Pendente"),
        observacoes: z.string().optional(),
        fornecedor: z.string().optional(),
      }))
      .mutation(({ input, ctx }) => {
        registrarAuditLog(ctx.user.id, "criou", "Despesa", 0, JSON.stringify(input));
        return createDespesa(input as any);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        descricao: z.string().optional(),
        categoria: z.enum(["Fornecedor", "Fixo", "Variável", "Imposto", "Outro"]).optional(),
        valor: z.number().optional(),
        dataVencimento: z.date().optional(),
        dataPagamento: z.date().optional(),
        status: z.enum(["Pendente", "Pago", "Cancelado"]).optional(),
        observacoes: z.string().optional(),
        fornecedor: z.string().optional(),
      }))
      .mutation(({ input, ctx }) => {
        const { id, ...updateData } = input;
        registrarAuditLog(ctx.user.id, "editou", "Despesa", id, JSON.stringify(updateData));
        return updateDespesa(id, updateData as any);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input, ctx }) => {
        registrarAuditLog(ctx.user.id, "excluiu", "Despesa", input.id);
        return deleteDespesa(input.id);
      }),
  }),

  orcamentos: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { orcamentos } = await import("../drizzle/schema");
      return db.select().from(orcamentos);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { orcamentos } = await import("../drizzle/schema");
      const result = await db.select().from(orcamentos).where(eq(orcamentos.id, input.id));
      return result[0] || null;
    }),
    create: protectedProcedure
      .input(z.object({
        numero: z.string(),
        agenteId: z.number(),
        produtoId: z.number(),
        quantidade: z.number().default(1),
        valorUnitario: z.number(),
        valorTotal: z.number(),
        dataEmissao: z.date(),
        dataValidade: z.date(),
        descricao: z.string().optional(),
        status: z.enum(["Rascunho", "Enviado", "Aceito", "Rejeitado"]).default("Rascunho"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { orcamentos } = await import("../drizzle/schema");
        const result = await db.insert(orcamentos).values(input);
        return result;
      }),
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
        dataValidade: z.date().optional(),
        descricao: z.string().optional(),
        status: z.enum(["Rascunho", "Enviado", "Aceito", "Rejeitado"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { orcamentos } = await import("../drizzle/schema");
        const { id, ...updateData } = input;
        const result = await db.update(orcamentos).set(updateData).where(eq(orcamentos.id, id));
        return result;
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { orcamentos } = await import("../drizzle/schema");
      const result = await db.delete(orcamentos).where(eq(orcamentos.id, input.id));
      return result;
    }),
    gerarTokenPublico: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { orcamentos } = await import("../drizzle/schema");
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const result = await db.update(orcamentos).set({ tokenPublico: token }).where(eq(orcamentos.id, input.id));
      return { token };
    }),
    getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const { orcamentos } = await import("../drizzle/schema");
      const result = await db.select().from(orcamentos).where(eq(orcamentos.tokenPublico, input.token));
      return result[0] || null;
    }),
    responderPublico: publicProcedure
      .input(z.object({ token: z.string(), status: z.enum(["Aceito", "Rejeitado"]), observacoes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { orcamentos } = await import("../drizzle/schema");
        const orcamento = await db.select().from(orcamentos).where(eq(orcamentos.tokenPublico, input.token));
        if (!orcamento.length) throw new Error("Orçamento não encontrado");
        const result = await db.update(orcamentos).set({ status: input.status as any }).where(eq(orcamentos.id, orcamento[0].id));
        return result;
      }),
  }),

  storage: router({
    uploadPdf: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        pdfContent: z.string(), // base64 encoded PDF
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.pdfContent, "base64");
        const key = `pdfs/${Date.now()}-${input.fileName}`;
        const result = await storagePut(key, buffer, "application/pdf");
        return result;
      }),
    uploadLogo: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        imageContent: z.string(), // base64 encoded image
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.imageContent, "base64");
        const key = `logos/${input.fileName}`;
        const result = await storagePut(key, buffer, "image/png");
        return result;
      }),
  }),

  configuracoes: router({
    get: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      const { configuracoes } = await import("../drizzle/schema");
      const result = await db.select().from(configuracoes).limit(1);
      return result[0] || null;
    }),
    update: protectedProcedure
      .input(z.object({
        nomeEmpresa: z.string().optional(),
        logoUrl: z.string().optional(),
        logoKey: z.string().optional(),
        cnpj: z.string().optional(),
        endereco: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { configuracoes } = await import("../drizzle/schema");
        
        // Verificar se já existe configuração
        const existing = await db.select().from(configuracoes).limit(1);
        
        if (existing.length > 0) {
          // Atualizar
          const result = await db.update(configuracoes).set(input).where(eq(configuracoes.id, existing[0].id));
          return result;
        } else {
          // Criar nova
          const result = await db.insert(configuracoes).values({
            nomeEmpresa: input.nomeEmpresa || "Minha Empresa",
            ...input,
          });
          return result;
        }
            }),
  }),

  auditLog: router({
    list: adminProcedure
      .input(z.object({
        acao: z.string().optional(),
        entidade: z.string().optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { auditLog } = await import("../drizzle/schema");
        let query = db.select().from(auditLog);
        
        if (input.acao) {
          query = query.where(eq(auditLog.acao, input.acao)) as any;
        }
        if (input.entidade) {
          query = query.where(eq(auditLog.entidade, input.entidade)) as any;
        }
        if (input.dataInicio || input.dataFim) {
          const conditions = [];
          if (input.dataInicio) {
            conditions.push(gte(auditLog.createdAt, input.dataInicio));
          }
          if (input.dataFim) {
            conditions.push(lte(auditLog.createdAt, input.dataFim));
          }
          if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
          }
        }
        
        return query.orderBy(auditLog.createdAt);
      }),
  }),
});
export type AppRouter = typeof appRouter;
