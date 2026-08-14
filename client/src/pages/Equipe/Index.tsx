import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, Check, Clock3, Copy, MailPlus, Shield, UsersRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function EquipePage() {
  const [, setLocation] = useLocation();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const utils = trpc.useUtils();
  const workspaces = trpc.workspace.listMyWorkspaces.useQuery();
  const members = trpc.workspace.listMembers.useQuery(undefined, { retry: false });
  const [invitePage, setInvitePage] = useState(1);
  const invites = trpc.workspace.listInvites.useQuery({ page: invitePage, pageSize: 5 }, { retry: false });
  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: result => {
      window.localStorage.setItem("active-workspace-id", String(result.workspaceId));
      void utils.invalidate();
      setWorkspaceName("");
      setWorkspaceSlug("");
      toast.success("Workspace criado e selecionado.");
      window.location.reload();
    },
    onError: error => toast.error(error.message),
  });
  const updateMemberRole = trpc.workspace.updateMemberRole.useMutation({
    onSuccess: () => {
      void members.refetch();
      toast.success("Papel atualizado com sucesso.");
    },
    onError: error => toast.error(error.message),
  });
  const revokeInvite = trpc.workspace.revokeInvite.useMutation({
    onSuccess: () => {
      void invites.refetch();
      toast.success("Convite revogado.");
    },
    onError: error => toast.error(error.message),
  });
  const inviteMember = trpc.workspace.inviteMember.useMutation({
    onSuccess: result => {
      setEmail("");
      void members.refetch();
      void invites.refetch();
      toast.success(result.inviteLink ? "Convite criado. Configure o provedor para envio automático." : "Convite enviado.");
      if (result.inviteLink) void navigator.clipboard?.writeText(result.inviteLink);
    },
    onError: error => toast.error(error.message),
  });

  const handleCreateWorkspace = (event: React.FormEvent) => {
    event.preventDefault();
    createWorkspace.mutate({ name: workspaceName, slugUrl: workspaceSlug });
  };

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault();
    inviteMember.mutate({ email, role, origin: window.location.origin });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Administração multitenant</p>
            <h1 className="text-3xl font-bold tracking-tight">Equipe e Workspaces</h1>
            <p className="mt-1 text-muted-foreground">Gerencie organizações, acessos e convites com escopo isolado.</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/auditoria")} className="gap-2">
            <Shield className="h-4 w-4" /> Auditoria do workspace
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Meus workspaces</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {workspaces.data?.map(workspace => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    window.localStorage.setItem("active-workspace-id", String(workspace.id));
                    window.location.reload();
                  }}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:border-primary hover:bg-accent"
                >
                  <span><strong>{workspace.name}</strong><span className="block text-xs text-muted-foreground">/{workspace.slugUrl}</span></span>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{workspace.role}</span>
                </button>
              ))}
              <form onSubmit={handleCreateWorkspace} className="space-y-3 border-t pt-4">
                <p className="text-sm font-semibold">Criar novo workspace</p>
                <Input value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} placeholder="Nome da organização" required minLength={2} />
                <Input value={workspaceSlug} onChange={event => setWorkspaceSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="slug-da-organizacao" required minLength={2} />
                <Button type="submit" disabled={createWorkspace.isPending} className="w-full">{createWorkspace.isPending ? "Criando..." : "Criar workspace"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="h-5 w-5" /> Membros do workspace ativo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {members.error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{members.error.message}</p>
              ) : members.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando membros...</p>
              ) : (
                <div className="space-y-2">
                  {members.data?.map(member => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div><p className="font-medium">{member.name || "Usuário sem nome"}</p><p className="text-xs text-muted-foreground">{member.email}</p></div>
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={e => updateMemberRole.mutate({ memberId: member.id, role: e.target.value as "ADMIN" | "USER" })}
                          className="h-8 rounded-md border bg-background px-2 text-xs font-semibold"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          {member.role === "OWNER" && <option value="OWNER" disabled>OWNER</option>}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleInvite} className="space-y-3 border-t pt-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><MailPlus className="h-4 w-4" /> Convidar por e-mail</p>
                <Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="membro@empresa.com" required />
                <select value={role} onChange={event => setRole(event.target.value as "ADMIN" | "USER")} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="USER">Usuário</option><option value="ADMIN">Administrador</option></select>
                <Button type="submit" disabled={inviteMember.isPending || !email} className="w-full gap-2"><MailPlus className="h-4 w-4" />{inviteMember.isPending ? "Criando convite..." : "Criar convite seguro"}</Button>
                {inviteMember.data?.inviteLink && <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(inviteMember.data.inviteLink)} className="w-full gap-2"><Copy className="h-4 w-4" /> Copiar link de contingência</Button>}
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5" /> Convites pendentes</CardTitle></CardHeader>
          <CardContent>
            {invites.error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{invites.error.message}</p>
            ) : invites.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando convites...</p>
            ) : !invites.data || invites.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite pendente neste workspace.</p>
            ) : (
              <div className="space-y-3">
                {invites.data.items.map(invite => {
                  const inviteLink = `${window.location.origin}/convite/${invite.token}`;
                  return (
                    <div key={invite.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0"><p className="font-medium">{invite.email}</p><p className="text-xs text-muted-foreground">Papel: {invite.role} · Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}</p><p className="mt-1 truncate text-xs text-muted-foreground">{inviteLink}</p></div>
                      <div className="flex shrink-0 gap-2"><Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => { void navigator.clipboard?.writeText(inviteLink); toast.success("Link copiado."); }}><Copy className="h-4 w-4" /> Copiar link</Button><Button type="button" size="sm" variant="destructive" className="gap-2" disabled={revokeInvite.isPending} onClick={() => { if (window.confirm("Revogar este convite? O link deixará de funcionar.")) revokeInvite.mutate({ inviteId: invite.id }); }}><XCircle className="h-4 w-4" /> Revogar</Button></div>
                    </div>
                  );
                })}
                {invites.data.total > 5 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">Total de {invites.data.total} convites</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={invitePage === 1} onClick={() => setInvitePage(p => Math.max(1, p - 1))}>Anterior</Button>
                      <Button variant="outline" size="sm" disabled={invitePage * 5 >= invites.data.total} onClick={() => setInvitePage(p => p + 1)}>Próxima</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
