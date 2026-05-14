import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("orcamentos router", () => {
  it("should list orcamentos", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orcamentos.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create an orcamento", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newOrcamento = {
      numero: `ORC-${Date.now()}`,
      agenteId: 1,
      produtoId: 1,
      quantidade: 5,
      valorUnitario: 10000,
      valorTotal: 50000,
      dataEmissao: new Date(),
      dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      descricao: "Orçamento de teste",
      status: "Rascunho" as const,
    };

    const result = await caller.orcamentos.create(newOrcamento);
    expect(result).toBeDefined();
  });
});

describe("configuracoes router", () => {
  it("should get configuracoes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.configuracoes.get();
    // Pode ser null ou um objeto com dados
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("should update configuracoes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const updateData = {
      nomeEmpresa: "Minha Empresa Teste",
      cnpj: "00.000.000/0000-00",
      email: "contato@empresa.com",
    };

    const result = await caller.configuracoes.update(updateData);
    expect(result).toBeDefined();
  });
});
