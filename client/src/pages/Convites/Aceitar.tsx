import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { CheckCircle2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AceitarConvitePage() {
  const [, params] = useRoute("/convite/:token");
  const { user, loading } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const acceptInvite = trpc.workspace.acceptInvite.useMutation({
    onSuccess: result => {
      window.localStorage.removeItem("pending-invite-token");
      window.localStorage.setItem("active-workspace-id", String(result.workspaceId));
      setAccepted(true);
      toast.success("Convite aceito. Workspace selecionado.");
    },
    onError: error => toast.error(error.message),
  });

  const token = params?.token ?? "";

  useEffect(() => {
    if (!loading && !user) {
      window.localStorage.setItem("pending-invite-token", token);
    }
  }, [loading, token, user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Convite seguro</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Entre na sua conta para aceitar este convite. O token ficará preservado durante o login.</p><Button className="w-full gap-2" onClick={() => { window.location.href = getLoginUrl(); }}><LogIn className="h-4 w-4" /> Entrar para continuar</Button></CardContent></Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Aceitar convite</CardTitle></CardHeader><CardContent className="space-y-4">
        {accepted ? <><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><p className="text-center text-sm">Você agora faz parte do workspace. Acesse o painel para continuar.</p><Button className="w-full" onClick={() => { window.location.href = "/"; }}>Ir para o dashboard</Button></> : <><p className="text-sm text-muted-foreground">Olá, {user.name || user.email}. Confirme sua entrada no workspace usando este convite.</p><Button className="w-full" disabled={acceptInvite.isPending || !token} onClick={() => acceptInvite.mutate({ token })}>{acceptInvite.isPending ? "Validando..." : "Aceitar convite"}</Button></>}
      </CardContent></Card>
    </main>
  );
}
