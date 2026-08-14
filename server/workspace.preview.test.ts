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

describe("Workspace CSV preview", () => {
  it("previews members csv returning valid and invalid categories", async () => {
    const caller = appRouter.createCaller(createContext());
    const res = await caller.workspace.previewMembersCsv({ csvData: "brenda.christie26@gmail.com\ninvalid-email\nunknown@example.com" });
    expect(res.valid).toContain("brenda.christie26@gmail.com");
    expect(res.invalid).toContain("invalid-email");
    expect(res.notFound).toContain("unknown@example.com");
  });
});
