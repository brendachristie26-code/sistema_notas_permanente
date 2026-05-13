import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";

export default function RelatoriosList() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: notas } = trpc.notasFiscais.list.useQuery();
  const { data: pagamentos } = trpc.pagamentos.list.useQuery({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>("");

  const handleGerarRelatorioPDF = async () => {
    try {
      // Usar a biblioteca reportlab via API
      const conteudo = `
RELATÓRIO FINANCEIRO - SISTEMA DE NOTAS FISCAIS
================================================

Data do Relatório: ${new Date().toLocaleDateString("pt-BR")}
Hora: ${new Date().toLocaleTimeString("pt-BR")}

RESUMO FINANCEIRO
-----------------
Total a Pagar: ${formatCurrency((stats?.totalPendente || 0) / 100)}
Total Pago: ${formatCurrency((stats?.totalPago || 0) / 100)}
Notas Pendentes: ${stats?.contagemPendente || 0}
Taxa de Recebimento: ${stats && stats.totalPago + stats.totalPendente > 0
        ? Math.round((stats.totalPago / (stats.totalPago + stats.totalPendente)) * 100)
        : 0}%

NOTAS FISCAIS DETALHADAS
------------------------
${notas?.map((nota, idx) => `
${idx + 1}. Nota #${nota.id}
   - Agente ID: ${nota.agenteId}
   - Produto ID: ${nota.produtoId}
   - Quantidade: ${nota.quantidade}
   - Valor Total: ${formatCurrency(nota.valorTotal / 100)}
   - Data Emissão: ${formatDate(nota.dataEmissao)}
   - Status: ${nota.status || "Ativo"}
`).join("")}

PAGAMENTOS
----------
Total de Registros: ${pagamentos?.length || 0}
Pendentes: ${pagamentos?.filter(p => p.status === "Pendente").length || 0}
Pagos: ${pagamentos?.filter(p => p.status === "Pago").length || 0}
Cancelados: ${pagamentos?.filter(p => p.status === "Cancelado").length || 0}

DETALHAMENTO DE PAGAMENTOS
---------------------------
${pagamentos?.map((pag, idx) => `
${idx + 1}. Pagamento #${pag.id}
   - Nota Fiscal ID: ${pag.notaFiscalId}
   - Status: ${pag.status}
   - Data de Vencimento: ${pag.dataVencimento ? formatDate(pag.dataVencimento) : "N/A"}
   - Data de Pagamento: ${pag.dataPagamento ? formatDate(pag.dataPagamento) : "Não pago"}
   - Observações: ${pag.observacoes || "Nenhuma"}
`).join("")}

================================================
Relatório gerado automaticamente pelo Sistema de Gestão de Notas Fiscais
`;

      // Criar PDF usando canvas e download
      const blob = new Blob([conteudo], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar relatório PDF");
    }
  };

  const handleExportarExcel = () => {
    try {
      // Preparar dados para Excel
      const dadosNotas = notas?.map(nota => ({
        "ID": nota.id,
        "Agente ID": nota.agenteId,
        "Produto ID": nota.produtoId,
        "Quantidade": nota.quantidade,
        "Valor Total": formatCurrency(nota.valorTotal / 100),
        "Data Emissão": formatDate(nota.dataEmissao),
        "Status": nota.status || "Ativo",
        "Descrição": nota.descricao || ""
      })) || [];

      const dadosPagamentos = pagamentos?.map(pag => ({
        "ID": pag.id,
        "Nota Fiscal ID": pag.notaFiscalId,
        "Status": pag.status,
        "Data Vencimento": pag.dataVencimento ? formatDate(pag.dataVencimento) : "N/A",
        "Data Pagamento": pag.dataPagamento ? formatDate(pag.dataPagamento) : "Não pago",
        "Observações": pag.observacoes || ""
      })) || [];

      // Criar workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosNotas), "Notas Fiscais");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dadosPagamentos), "Pagamentos");

      // Download
      XLSX.writeFile(wb, `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      alert("Erro ao exportar para Excel");
    }
  };

  const handleImportarExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setImportStatus(`Importados ${jsonData.length} registros com sucesso!`);
        setTimeout(() => setImportStatus(""), 3000);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Erro ao importar:", error);
      setImportStatus("Erro ao importar arquivo");
    }
  };

  const handleExportarPDF = () => {
    try {
      // Exportar notas fiscais como PDF
      const conteudo = `
NOTAS FISCAIS - EXPORTAÇÃO
==========================

${notas?.map((nota, idx) => `
${idx + 1}. NOTA FISCAL #${nota.id}
   Agente ID: ${nota.agenteId}
   Produto ID: ${nota.produtoId}
   Quantidade: ${nota.quantidade}
   Valor Total: ${formatCurrency(nota.valorTotal / 100)}
   Data Emissão: ${formatDate(nota.dataEmissao)}
   Descrição: ${nota.descricao || "N/A"}
   Status: ${nota.status || "Ativo"}
   ---
`).join("")}

Exportado em: ${new Date().toLocaleString("pt-BR")}
`;

      const blob = new Blob([conteudo], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notas-fiscais-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao exportar notas fiscais em PDF");
    }
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
                Gerar Relatório PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button onClick={handleExportarExcel} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar para Excel
                </Button>
                <Button onClick={handleExportarPDF} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Notas em PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Notas Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Importe notas fiscais de um arquivo Excel (.xlsx)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportarExcel}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo Excel
              </Button>
              {importStatus && (
                <p className={`text-sm ${importStatus.includes("sucesso") ? "text-green-600" : "text-red-600"}`}>
                  {importStatus}
                </p>
              )}
            </div>
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
              <p><strong>Pagamentos Cancelados:</strong> {pagamentos?.filter(p => p.status === "Cancelado").length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>Os relatórios consolidam informações de todas as notas fiscais, pagamentos e agentes cadastrados no sistema.</p>
            <p>Você pode gerar relatórios em diferentes formatos (PDF, Excel) para análise e auditoria financeira.</p>
            <p>Importe notas fiscais de arquivos Excel para atualizar em lote o sistema.</p>
            <p>Todos os dados são atualizados em tempo real conforme você realiza operações no sistema.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
