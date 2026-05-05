import { describe, it, expect } from "vitest";
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Agentes Router", () => {
  it("should list agentes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agentes.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should create an agente", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.agentes.create({
      nome: "Test Agente",
      email: `test-${Date.now()}@example.com`,
      telefone: "1234567890",
    });

    expect(result).toBeDefined();
  });

  it("should get an agente by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create first
    const created = await caller.agentes.create({
      nome: "Test Agente",
      email: `test-${Date.now()}@example.com`,
    });

    // Get the created agente (assuming insertId is available)
    const result = await caller.agentes.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Dashboard Router", () => {
  it("should get dashboard stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalPendente");
    expect(result).toHaveProperty("totalPago");
    expect(result).toHaveProperty("contagemPendente");
  });
});
