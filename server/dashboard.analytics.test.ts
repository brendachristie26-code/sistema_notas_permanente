import { describe, expect, it } from "vitest";
import { getDashboardAnalytics } from "./db";

describe("Dashboard analytics", () => {
  it("retorna uma estrutura estável para o período padrão", async () => {
    const result = await getDashboardAnalytics({ periodo: "30d" });

    expect(result).toHaveProperty("serie");
    expect(result).toHaveProperty("despesasPorCategoria");
    expect(result).toHaveProperty("topAgentes");
    expect(result).toHaveProperty("fornecedores");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.serie)).toBe(true);
    expect(Array.isArray(result.despesasPorCategoria)).toBe(true);
    expect(Array.isArray(result.topAgentes)).toBe(true);
    expect(Array.isArray(result.fornecedores)).toBe(true);
  });

  it("mantém os indicadores financeiros em faixas válidas", async () => {
    const result = await getDashboardAnalytics({ periodo: "90d", status: "Pago" });
    const { summary } = result;

    expect(summary.indiceRecebimento).toBeGreaterThanOrEqual(0);
    expect(summary.indiceRecebimento).toBeLessThanOrEqual(100);
    expect(summary.diasParaReceber).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(summary.tendencias.receitas)).toBe(true);
    expect(Number.isFinite(summary.tendencias.despesas)).toBe(true);
    expect(Number.isFinite(summary.tendencias.saldo)).toBe(true);
  });

  it("aceita os filtros dimensionais e de datas", async () => {
    const result = await getDashboardAnalytics({
      dataInicio: new Date("2020-01-01T00:00:00.000Z"),
      dataFim: new Date("2030-01-01T23:59:59.000Z"),
      status: "Pendente",
      categoria: "Fornecedor",
      fornecedor: "Fornecedor inexistente no teste",
      agenteId: 999999,
    });

    expect(result.serie).toEqual([]);
    expect(result.despesasPorCategoria).toEqual([]);
    expect(result.topAgentes).toEqual([]);
    expect(result.summary.receitas).toBe(0);
    expect(result.summary.despesas).toBe(0);
  });
});
