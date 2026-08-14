import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Filter, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
export default function AuditoriaList() {
  const { activeWorkspace } = useWorkspace();
  const [filtroAcao, setFiltroAcao] = useState<string>("");
  const [filtroEntidade, setFiltroEntidade] = useState<string>("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: auditData, isLoading } = trpc.workspace.listAuditLogs.useQuery({
    acao: filtroAcao || undefined,
    entidade: filtroEntidade || undefined,
    dataInicio: filtroDataInicio ? new Date(filtroDataInicio) : undefined,
    dataFim: filtroDataFim ? new Date(filtroDataFim) : undefined,
    page,
    pageSize: 10,
  }, { retry: false });

  const { data: summaryData } = trpc.workspace.auditActivitySummary.useQuery(undefined, { retry: false });

  const handleExportCSV = () => {
    if (!auditData?.items || auditData.items.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }

    const headers = ["ID", "Usuário", "Ação", "Entidade", "ID Entidade", "Detalhes", "Data"];
    const rows = auditData.items.map((log: any) => [
      log.id,
      log.userEmail || log.userName || "Usuário desconhecido",
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
          <div><h1 className="text-3xl font-bold">Auditoria do Workspace</h1><p className="text-sm text-muted-foreground">Histórico administrativo de {activeWorkspace?.name || "workspace ativo"}</p></div>
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

        {summaryData && summaryData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Atividade de Usuários (Analytics)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="criar" name="Criar" fill="#22c55e" stackId="a" />
                    <Bar dataKey="atualizar" name="Atualizar" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="deletar" name="Deletar" fill="#ef4444" stackId="a" />
                    <Bar dataKey="outros" name="Outros" fill="#8b5cf6" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listagem com Paginação */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Carregando...</p>
            </CardContent>
          </Card>
        ) : !auditData || auditData.items.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Nenhum registro de auditoria encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {auditData.items.map((log: any) => (
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
                        {log.userName || log.userEmail || "Usuário desconhecido"} • {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {auditData.total > pageSize && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">Exibindo {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, auditData.total)} de {auditData.total} registros</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
                  <Button variant="outline" size="sm" disabled={page * pageSize >= auditData.total} onClick={() => setPage(p => p + 1)}>Próxima</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
