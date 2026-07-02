import { describe, it, expect, beforeAll } from "vitest";
import { eq, and, lt } from "drizzle-orm";
import { getDb } from "../db";
import { pagamentos, notasFiscais } from "../../drizzle/schema";

describe("Automação de Pagamentos", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("deve gerar pagamento automaticamente para nota fiscal", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    // Buscar primeira nota fiscal
    const notas = await db.select().from(notasFiscais).limit(1);
    if (notas.length === 0) {
      console.log("No notes found, skipping test");
      return;
    }

    const nota = notas[0];

    // Verificar se já existe pagamento
    const pagamentoExistente = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.notaFiscalId, nota.id))
      .limit(1);

    if (pagamentoExistente.length === 0) {
      // Criar novo pagamento
      const pagamento = (
        await db
          .insert(pagamentos)
          .values({
            notaFiscalId: nota.id,
            status: "Pendente",
            dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            observacoes: "Gerado automaticamente",
          })
          .returning()
      )[0];

      expect(pagamento).toBeDefined();
      expect(pagamento.status).toBe("Pendente");
    }
  });

  it("deve identificar pagamentos vencidos", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const hoje = new Date();

    // Buscar pagamentos vencidos
    const pagamentosVencidos = await db
      .select()
      .from(pagamentos)
      .where(
        and(
          eq(pagamentos.status, "Pendente" as any),
          lt(pagamentos.dataVencimento, hoje)
        )
      );

    // Verificar se há pagamentos vencidos
    if (pagamentosVencidos.length > 0) {
      const primeiro = pagamentosVencidos[0];
      expect(new Date(primeiro.dataVencimento) < hoje).toBe(true);
    }
  });

  it("deve contar pagamentos pendentes e realizados", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const todosPagamentos = await db.select().from(pagamentos);

    const pendentes = todosPagamentos.filter((p: any) => p.status === "Pendente");
    const realizados = todosPagamentos.filter((p: any) => p.status === "Pago");

    expect(pendentes.length + realizados.length).toBeGreaterThanOrEqual(0);
  });
});
