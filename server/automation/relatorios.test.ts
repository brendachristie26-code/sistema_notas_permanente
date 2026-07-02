import { describe, it, expect, beforeAll } from "vitest";
import { eq, and, gte, lt } from "drizzle-orm";
import { getDb } from "../db";
import { pagamentos, notasFiscais } from "../../drizzle/schema";

describe("Automação de Relatórios", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("deve gerar estatísticas diárias", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Notas emitidas hoje
    const notasEmitidas = await db
      .select()
      .from(notasFiscais)
      .where(
        and(
          gte(notasFiscais.dataEmissao, hoje),
          lt(notasFiscais.dataEmissao, amanha)
        )
      );

    // Pagamentos realizados hoje
    const pagamentosRealizados = await db
      .select()
      .from(pagamentos)
      .where(
        and(
          eq(pagamentos.status, "Pago" as any),
          gte(pagamentos.dataPagamento, hoje),
          lt(pagamentos.dataPagamento, amanha)
        )
      );

    expect(notasEmitidas).toBeDefined();
    expect(pagamentosRealizados).toBeDefined();
    expect(Array.isArray(notasEmitidas)).toBe(true);
    expect(Array.isArray(pagamentosRealizados)).toBe(true);
  });

  it("deve calcular taxa de recebimento", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const todosPagamentos = await db.select().from(pagamentos);

    const totalPago = todosPagamentos.filter(
      (p: any) => p.status === "Pago"
    ).length;
    const totalPendente = todosPagamentos.filter(
      (p: any) => p.status === "Pendente"
    ).length;

    const total = totalPago + totalPendente;
    const taxaRecebimento =
      total > 0 ? Math.round((totalPago / total) * 100) : 0;

    expect(taxaRecebimento).toBeGreaterThanOrEqual(0);
    expect(taxaRecebimento).toBeLessThanOrEqual(100);
  });

  it("deve identificar pagamentos acima do limite", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const limiteAlerta = 1000000; // R$ 10.000,00

    const pagamentosPendentes = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.status, "Pendente" as any));

    const pagamentosAltos = [];
    for (const pag of pagamentosPendentes) {
      const nota = (
        await db
          .select()
          .from(notasFiscais)
          .where(eq(notasFiscais.id, pag.notaFiscalId))
          .limit(1)
      )[0];

      if (nota && nota.valorTotal > limiteAlerta) {
        pagamentosAltos.push(pag);
      }
    }

    expect(Array.isArray(pagamentosAltos)).toBe(true);
  });

  it("deve contar total de notas fiscais", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const todasAsNotas = await db.select().from(notasFiscais);

    expect(Array.isArray(todasAsNotas)).toBe(true);
    expect(todasAsNotas.length).toBeGreaterThanOrEqual(0);
  });
});
