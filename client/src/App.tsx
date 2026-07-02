import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Dashboard - Página inicial
import Dashboard from "./pages/Dashboard";

// Páginas de Agentes
import AgentesList from "./pages/Agentes/List";
import AgentesForm from "./pages/Agentes/Form";

// Páginas de Produtos
import ProdutosList from "./pages/Produtos/List";
import ProdutosForm from "./pages/Produtos/Form";

// Páginas de Notas Fiscais
import NotasFiscaisList from "./pages/NotasFiscais/List";
import NotasFiscaisForm from "./pages/NotasFiscais/Form";

// Páginas de Pagamentos
import PagamentosList from "./pages/Pagamentos/List";

// Páginas de Despesas
import DespesasList from "./pages/Despesas/List";

// Páginas de Relatórios
import RelatoriosList from "./pages/Relatorios/List";
import OrcamentosList from "./pages/Orcamentos/List";
import OrcamentosForm from "./pages/Orcamentos/Form";
import Configuracoes from "./pages/Configuracoes/Index";

function Router() {
  return (
    <Switch>
      {/* Dashboard - Página inicial */}
      <Route path={"/"} component={Dashboard} />
      
      {/* Agentes */}
      <Route path={"/agentes"} component={AgentesList} />
      <Route path={"/agentes/novo"} component={AgentesForm} />
      <Route path={"/agentes/:id"} component={AgentesForm} />
      
      {/* Produtos */}
      <Route path={"/produtos"} component={ProdutosList} />
      <Route path={"/produtos/novo"} component={ProdutosForm} />
      <Route path={"/produtos/:id"} component={ProdutosForm} />
      
      {/* Notas Fiscais */}
      <Route path={"/notas-fiscais"} component={NotasFiscaisList} />
      <Route path={"/notas-fiscais/novo"} component={NotasFiscaisForm} />
      <Route path={"/notas-fiscais/:id"} component={NotasFiscaisForm} />
      
      {/* Pagamentos */}
      <Route path={"/pagamentos"} component={PagamentosList} />
      
      {/* Despesas */}
      <Route path={"/despesas"} component={DespesasList} />
      
      {/* Relatórios */}
      <Route path={"/relatorios"} component={RelatoriosList} />
      
      {/* Orçamentos */}
      <Route path={"/orcamentos"} component={OrcamentosList} />
      <Route path={"/orcamentos/novo"} component={OrcamentosForm} />
      <Route path={"/orcamentos/:id/editar"} component={OrcamentosForm} />
      
      {/* Configurações */}
      <Route path={"/configuracoes"} component={Configuracoes} />
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
