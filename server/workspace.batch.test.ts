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

describe("Workspace batch member removal", () => {
  it("removes selected members safely", async () => {
    const caller = appRouter.createCaller(createContext());
    const res = await caller.workspace.removeMembersBatch({ memberIds: [9999] });
    expect(res.success).toBe(true);
    expect(res.removedCount).toBe(0);
  });
});
