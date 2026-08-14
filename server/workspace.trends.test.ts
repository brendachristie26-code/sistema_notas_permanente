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

describe("Workspace trend summary and CSV import", () => {
  it("returns audit trend summary by day", async () => {
    const caller = appRouter.createCaller(createContext());
    const trend = await caller.workspace.auditTrendSummary({ days: 30 });
    expect(Array.isArray(trend)).toBe(true);
  });

  it("handles CSV member import with unknown emails gracefully", async () => {
    const caller = appRouter.createCaller(createContext());
    const res = await caller.workspace.importMembersCsv({ csvData: "unknown@example.com\n" });
    expect(res.success).toBe(true);
    expect(res.errorsCount).toBe(1);
  });
});
