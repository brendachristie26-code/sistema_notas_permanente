import { describe, expect, it } from "vitest";
import { sendInviteEmail } from "./inviteEmail";

describe("Invite email adapter", () => {
  it("does not claim delivery when provider credentials are absent", async () => {
    const result = await sendInviteEmail({
      to: "member@example.com",
      inviteLink: "https://example.com/convite/test-token",
      workspaceName: "Workspace Teste",
    });

    expect(result.sent).toBe(false);
    expect(result.reason).toBe("not_configured");
  });
});
