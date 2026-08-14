import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(email = "brenda.christie26@gmail.com", workspaceId = 1, role = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email,
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    workspaceId,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Workspace roles and audit summary", () => {
  it("returns audit activity summary grouped by user", async () => {
    const caller = appRouter.createCaller(createContext());
    const summary = await caller.workspace.auditActivitySummary();
    expect(Array.isArray(summary)).toBe(true);
  });

  it("allows updating member role to ADMIN", async () => {
    const caller = appRouter.createCaller(createContext());
    const members = await caller.workspace.listMembers();
    const target = members.find(m => m.userId !== 1) || members[0];
    if (target) {
      const res = await caller.workspace.updateMemberRole({ memberId: target.id, role: "ADMIN" });
      expect(res.success).toBe(true);
    }
  });
});
