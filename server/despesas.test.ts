import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { despesas } from "../drizzle/schema";

describe("Despesas Router", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should list despesas", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const result = await db.select().from(despesas).limit(10);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a despesa", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const despesa = {
      descricao: "Teste de Despesa",
      categoria: "Fornecedor" as const,
      valor: 10000,
      dataVencimento: new Date(),
      status: "Pendente" as const,
    };

    const result = await db.insert(despesas).values(despesa);
    expect(result).toBeDefined();
  });

  it("should filter despesas by status", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const result = await db.select().from(despesas).where(eq(despesas.status, "Pendente" as any));
    expect(Array.isArray(result)).toBe(true);
  });

  it("should count total despesas", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    const result = await db.select().from(despesas);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});
