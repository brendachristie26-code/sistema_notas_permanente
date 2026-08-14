type InviteEmailInput = {
  to: string;
  inviteLink: string;
  workspaceName: string;
};

type InviteEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "provider_error" };

export async function sendInviteEmail(input: InviteEmailInput): Promise<InviteEmailResult> {
  const apiUrl = process.env.INVITE_EMAIL_API_URL;
  const apiKey = process.env.INVITE_EMAIL_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM;

  if (!apiUrl || !apiKey || !from) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: `Convite para ${input.workspaceName}`,
        text: `Você recebeu um convite para participar de ${input.workspaceName}. Acesse: ${input.inviteLink}`,
        html: `<p>Você recebeu um convite para participar de <strong>${input.workspaceName}</strong>.</p><p><a href="${input.inviteLink}">Aceitar convite</a></p>`,
      }),
    });

    if (!response.ok) return { sent: false, reason: "provider_error" };
    return { sent: true };
  } catch {
    return { sent: false, reason: "provider_error" };
  }
}
