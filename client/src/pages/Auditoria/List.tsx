import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Filter, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AuditoriaList() {

  const [filtroAcao, setFiltroAcao] = useState<string>("");
  const [filtroEntidade, setFiltroEntidade] = useState<string>("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");

  const { data: logs, isLoading } = trpc.workspace.listAuditLogs.useQuery({
    acao: filtroAcao || undefined,
    entidade: filtroEntidade || undefined,
  }, { retry: false });

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }

    const headers = ["ID", "Usuário", "Ação", "Entidade", "ID Entidade", "Detalhes", "Data"];
    const rows = logs.map((log: any) => [
      log.id,
      log.userId,
      log.acao,
      log.entidade,
      log.entidadeId,
      log.detalhes || "",
      formatDate(log.createdAt),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo exportado com sucesso!");
  };

  const getAcaoBadgeColor = (acao: string) => {
    switch (acao) {
      case "criar":
        return "bg-green-100 text-green-800";
      case "atualizar":
        return "bg-blue-100 text-blue-800";
      case "deletar":
        return "bg-red-100 text-red-800";
      case "visualizar":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Log de Auditoria</h1>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Ação
                </label>
                <select
                  value={filtroAcao}
                  onChange={(e) => setFiltroAcao(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as ações</option>
                  <option value="criar">Criar</option>
                  <option value="atualizar">Atualizar</option>
                  <option value="deletar">Deletar</option>
                  <option value="visualizar">Visualizar</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Entidade
                </label>
                <select
                  value={filtroEntidade}
                  onChange={(e) => setFiltroEntidade(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as entidades</option>
                  <option value="agentes">Agentes</option>
                  <option value="produtos">Produtos</option>
                  <option value="notas-fiscais">Notas Fiscais</option>
                  <option value="pagamentos">Pagamentos</option>
                  <option value="despesas">Despesas</option>
                  <option value="orcamentos">Orçamentos</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listagem */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Carregando...</p>
            </CardContent>
          </Card>
        ) : !logs || logs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Nenhum registro de auditoria encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getAcaoBadgeColor(log.acao)}>
                          {log.acao}
                        </Badge>
                        <span className="text-sm font-medium text-gray-700">
                          {log.entidade} #{log.entidadeId}
                        </span>
                      </div>
                      {log.detalhes && (
                        <p className="text-sm text-gray-600 mb-2">{log.detalhes}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Usuário ID: {log.userId} • {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
