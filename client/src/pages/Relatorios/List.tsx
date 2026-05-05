import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { FileText, Download } from "lucide-react";

export default function RelatoriosList() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: notas } = trpc.notasFiscais.list.useQuery();
  const { data: pagamentos } = trpc.pagamentos.list.useQuery({});

  const handleGerarRelatorioPDF = () => {
    // Implementar geração de PDF com os dados do relatório
    const conteudo = `
RELATÓRIO FINANCEIRO - SISTEMA DE NOTAS FISCAIS
================================================

Data do Relatório: ${new Date().toLocaleDateString("pt-BR")}

RESUMO FINANCEIRO
-----------------
Total a Pagar: ${formatCurrency((stats?.totalPendente || 0) / 100)}
Total Pago: ${formatCurrency((stats?.totalPago || 0) / 100)}
Notas Pendentes: ${stats?.contagemPendente || 0}
Taxa de Recebimento: ${stats && stats.totalPago + stats.totalPendente > 0
      ? Math.round((stats.totalPago / (stats.totalPago + stats.totalPendente)) * 100)
      : 0}%

NOTAS FISCAIS
--------------
Total de Notas: ${notas?.length || 0}

PAGAMENTOS
----------
Total de Registros: ${pagamentos?.length || 0}
Pendentes: ${pagamentos?.filter(p => p.status === "Pendente").length || 0}
Pagos: ${pagamentos?.filter(p => p.status === "Pago").length || 0}
    `;

    // Criar blob e fazer download
    const blob = new Blob([conteudo], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Relatórios</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório Financeiro Consolidado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Total a Pagar:</strong> {formatCurrency((stats?.totalPendente || 0) / 100)}</p>
                <p><strong>Total Pago:</strong> {formatCurrency((stats?.totalPago || 0) / 100)}</p>
                <p><strong>Notas Pendentes:</strong> {stats?.contagemPendente || 0}</p>
                <p><strong>Taxa de Recebimento:</strong> {stats && stats.totalPago + stats.totalPendente > 0
                  ? Math.round((stats.totalPago / (stats.totalPago + stats.totalPendente)) * 100)
                  : 0}%</p>
              </div>
              <Button onClick={handleGerarRelatorioPDF} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Total de Notas Fiscais:</strong> {notas?.length || 0}</p>
                <p><strong>Total de Pagamentos:</strong> {pagamentos?.length || 0}</p>
                <p><strong>Pagamentos Pendentes:</strong> {pagamentos?.filter(p => p.status === "Pendente").length || 0}</p>
                <p><strong>Pagamentos Realizados:</strong> {pagamentos?.filter(p => p.status === "Pago").length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>Os relatórios consolidam informações de todas as notas fiscais, pagamentos e agentes cadastrados no sistema.</p>
            <p>Você pode gerar relatórios em diferentes formatos para análise e auditoria financeira.</p>
            <p>Todos os dados são atualizados em tempo real conforme você realiza operações no sistema.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
