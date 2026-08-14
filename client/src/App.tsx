import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import AgentesList from "./pages/Agentes/List";
import AgentesForm from "./pages/Agentes/Form";
import ProdutosList from "./pages/Produtos/List";
import ProdutosForm from "./pages/Produtos/Form";
import NotasFiscaisList from "./pages/NotasFiscais/List";
import NotasFiscaisForm from "./pages/NotasFiscais/Form";
import PagamentosList from "./pages/Pagamentos/List";
import DespesasList from "./pages/Despesas/List";
import RelatoriosList from "./pages/Relatorios/List";
import OrcamentosList from "./pages/Orcamentos/List";
import OrcamentosForm from "./pages/Orcamentos/Form";
import OrcamentosPublicoView from "./pages/OrcamentosPublico/View";
import AuditoriaList from "./pages/Auditoria/List";
import Configuracoes from "./pages/Configuracoes";
import EquipePage from "./pages/Equipe/Index";
import AceitarConvitePage from "./pages/Convites/Aceitar";

function PendingInviteHandler() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const acceptInvite = trpc.workspace.acceptInvite.useMutation({
    onSuccess: result => {
      window.localStorage.removeItem("pending-invite-token");
      window.localStorage.setItem("active-workspace-id", String(result.workspaceId));
      void utils.invalidate();
      setLocation("/");
    },
  });

  useEffect(() => {
    const token = window.localStorage.getItem("pending-invite-token");
    if (loading || !user || !token || location.startsWith("/convite/") || acceptInvite.isPending) return;
    acceptInvite.mutate({ token });
  }, [acceptInvite, loading, location, user]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/agentes"} component={AgentesList} />
      <Route path={"/agentes/novo"} component={AgentesForm} />
      <Route path={"/agentes/:id"} component={AgentesForm} />
      <Route path={"/produtos"} component={ProdutosList} />
      <Route path={"/produtos/novo"} component={ProdutosForm} />
      <Route path={"/produtos/:id"} component={ProdutosForm} />
      <Route path={"/notas-fiscais"} component={NotasFiscaisList} />
      <Route path={"/notas-fiscais/novo"} component={NotasFiscaisForm} />
      <Route path={"/notas-fiscais/:id"} component={NotasFiscaisForm} />
      <Route path={"/pagamentos"} component={PagamentosList} />
      <Route path={"/despesas"} component={DespesasList} />
      <Route path={"/relatorios"} component={RelatoriosList} />
      <Route path={"/orcamentos"} component={OrcamentosList} />
      <Route path={"/orcamentos/novo"} component={OrcamentosForm} />
      <Route path={"/orcamentos/:id/editar"} component={OrcamentosForm} />
      <Route path={"/orcamentos/publico/:token"} component={OrcamentosPublicoView} />
      <Route path={"/auditoria"} component={AuditoriaList} />
      <Route path={"/configuracoes"} component={Configuracoes} />
      <Route path={"/equipe"} component={EquipePage} />
      <Route path={"/convite/:token"} component={AceitarConvitePage} />
      <Route path={"*"} component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PendingInviteHandler />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
