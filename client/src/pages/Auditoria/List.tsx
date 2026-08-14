import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Filter, Download, Search, FileText } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import jsPDF from "jspdf";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function AuditoriaList() {
  const { activeWorkspace } = useWorkspace();
  const [filtroAcao, setFiltroAcao] = useState<string>("");
  const [filtroEntidade, setFiltroEntidade] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: auditData, isLoading } = trpc.workspace.listAuditLogs.useQuery({
    acao: filtroAcao || undefined,
    entidade: filtroEntidade || undefined,
    search: searchTerm || undefined,
    dataInicio: filtroDataInicio ? new Date(filtroDataInicio) : undefined,
    dataFim: filtroDataFim ? new Date(filtroDataFim) : undefined,
    page,
    pageSize,
  }, { retry: false });

  const { data: summaryData } = trpc.workspace.auditActivitySummary.useQuery({ days: periodDays }, { retry: false });
  const { data: trendData } = trpc.workspace.auditTrendSummary.useQuery({ days: periodDays }, { retry: false });

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
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const handleExportPDF = () => {
    if (!auditData?.items || auditData.items.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Relatório de Auditoria - ${activeWorkspace?.name || "Workspace"}`, 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);

    let y = 38;
    auditData.items.slice(0, 25).forEach((log: any, idx: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. [${log.acao.toUpperCase()}] ${log.entidade} (#${log.entidadeId})`, 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Usuário: ${log.userEmail || log.userName || "N/A"} | Data: ${formatDate(log.createdAt)}`, 18, y);
      y += 6;
      if (log.detalhes) {
        doc.text(`Detalhes: ${log.detalhes}`, 18, y);
        y += 6;
      }
      y += 4;
    });

    doc.save(`auditoria-${Date.now()}.pdf`);
    toast.success("Relatório PDF gerado com sucesso!");
  };

  const getAcaoBadgeColor = (acao: string) => {
    switch (acao) {
      case "criar":
        return "bg-green-100 text-green-800";
      case "atualizar":
        return "bg-blue-100 text-blue-800";
      case "deletar":
        return "bg-red-100 text-red-800";
      case "aceitar":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Auditoria do Workspace</h1>
            <p className="text-sm text-muted-foreground">Histórico administrativo de {activeWorkspace?.name || "workspace ativo"}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> CSV
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <FileText className="w-4 h-4" /> PDF
            </Button>
          </div>
        </div>

        {/* Filtros e Pesquisa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filtros e Busca</span>
              <div className="flex gap-1">
                <Button size="sm" variant={periodDays === 7 ? "default" : "outline"} onClick={() => setPeriodDays(7)}>7 dias</Button>
                <Button size="sm" variant={periodDays === 30 ? "default" : "outline"} onClick={() => setPeriodDays(30)}>30 dias</Button>
                <Button size="sm" variant={periodDays === 90 ? "default" : "outline"} onClick={() => setPeriodDays(90)}>90 dias</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar nos detalhes, e-mail..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div>
                <select
                  value={filtroAcao}
                  onChange={(e) => setFiltroAcao(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-sm"
                >
                  <option value="">Todas as ações</option>
                  <option value="criar">Criar</option>
                  <option value="atualizar">Atualizar</option>
                  <option value="deletar">Deletar</option>
                  <option value="aceitar">Aceitar</option>
                </select>
              </div>

              <div>
                <select
                  value={filtroEntidade}
                  onChange={(e) => setFiltroEntidade(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-sm"
                >
                  <option value="">Todas as entidades</option>
                  <option value="agentes">Agentes</option>
                  <option value="produtos">Produtos</option>
                  <option value="notas-fiscais">Notas Fiscais</option>
                  <option value="pagamentos">Pagamentos</option>
                  <option value="despesas">Despesas</option>
                  <option value="orcamentos">Orçamentos</option>
                  <option value="workspace">Workspace</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Input type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} className="text-xs" />
                <Input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} className="text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Analítico & Tendência Temporal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {summaryData && summaryData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Atividade por Usuário ({periodDays}d)</CardTitle></CardHeader>
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

          {trendData && trendData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Tendência de Atividade Diária ({periodDays}d)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Eventos" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
