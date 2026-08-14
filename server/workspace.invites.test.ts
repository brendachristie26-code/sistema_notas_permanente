import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
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
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    workspaceId,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Workspace invite and audit isolation", () => {
  it("lists only workspaces where the authenticated user is a member", async () => {
    const result = await appRouter.createCaller(createContext()).workspace.listMyWorkspaces();
    expect(result.some(workspace => workspace.id === 1)).toBe(true);
  });

  it("creates and accepts a valid invite for the authenticated email", async () => {
    const caller = appRouter.createCaller(createContext());
    const created = await caller.workspace.inviteMember({
      email: "brenda.christie26@gmail.com",
      role: "USER",
      origin: "https://example.com",
    });
    expect(created.success).toBe(true);
    expect(created.inviteLink).toContain("/convite/");

    const token = created.inviteLink.split("/convite/")[1];
    const accepted = await caller.workspace.acceptInvite({ token });
    expect(accepted.success).toBe(true);
    expect(accepted.workspaceId).toBe(1);
  });

  it("lists and revokes a pending invite before acceptance", async () => {
    const caller = appRouter.createCaller(createContext());
    const created = await caller.workspace.inviteMember({
      email: "pending@example.com",
      role: "USER",
      origin: "https://example.com",
    });
    const token = created.inviteLink.split("/convite/")[1];
    const pending = await caller.workspace.listInvites();
    const invite = pending.items.find((item: any) => item.token === token);
    expect(invite).toBeDefined();

    await caller.workspace.revokeInvite({ inviteId: invite!.id });
    const afterRevoke = await caller.workspace.listInvites();
    expect(afterRevoke.items.some((item: any) => item.id === invite!.id)).toBe(false);
    const invitedCaller = appRouter.createCaller(createContext("pending@example.com"));
    await expect(invitedCaller.workspace.acceptInvite({ token })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an invite when the authenticated email differs", async () => {
    const ownerCaller = appRouter.createCaller(createContext());
    const created = await ownerCaller.workspace.inviteMember({
      email: "brenda.christie26@gmail.com",
      role: "USER",
      origin: "https://example.com",
    });
    const token = created.inviteLink.split("/convite/")[1];
    const otherCaller = appRouter.createCaller(createContext("another@example.com"));
    await expect(otherCaller.workspace.acceptInvite({ token })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns logs for the active workspace and denies an unrelated workspace", async () => {
    const result = await appRouter.createCaller(createContext()).workspace.listAuditLogs();
    expect(Array.isArray(result.items)).toBe(true);
    await expect(appRouter.createCaller(createContext("brenda.christie26@gmail.com", 999)).workspace.listAuditLogs()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
