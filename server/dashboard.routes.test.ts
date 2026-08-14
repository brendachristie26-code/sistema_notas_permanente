import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "dashboard-test-user",
    email: "dashboard@example.com",
    name: "Dashboard Test",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("dashboard tRPC routes", () => {
  it("retorna analytics filtrados por período", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.dashboard.analytics({ periodo: "30d" });

    expect(Array.isArray(result.serie)).toBe(true);
    expect(result.summary).toHaveProperty("comparacaoMensal");
    expect(result.summary.comparacaoMensal).toHaveProperty("mesAtual");
    expect(result.summary.comparacaoMensal).toHaveProperty("mesAnterior");
  });

  it("mantém as rotas de gráficos legadas compatíveis", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const [evolucao, categorias, agentes] = await Promise.all([
      caller.dashboard.receitasDespesasUltimos30Dias(),
      caller.dashboard.despesasPorCategoria(),
      caller.dashboard.topAgentes(),
    ]);

    expect(Array.isArray(evolucao)).toBe(true);
    expect(Array.isArray(categorias)).toBe(true);
    expect(Array.isArray(agentes)).toBe(true);
  });
});
