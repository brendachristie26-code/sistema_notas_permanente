import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(email = "brenda.christie26@gmail.com", workspaceId = 1): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email,
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    workspaceId,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Workspace audit search and filters", () => {
  it("supports search term parameter in listAuditLogs", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.workspace.listAuditLogs({ search: "Workspace" });
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("supports days parameter in auditActivitySummary", async () => {
    const caller = appRouter.createCaller(createContext());
    const summary = await caller.workspace.auditActivitySummary({ days: 7 });
    expect(Array.isArray(summary)).toBe(true);
  });
});
