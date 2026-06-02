import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import jsPDF from "jspdf";

export default function OrcamentosList() {
  const [, setLocation] = useLocation();
  const { data: orcamentos, refetch } = trpc.orcamentos.list.useQuery();
  const deleteMutation = trpc.orcamentos.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este orçamento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExportPDF = (orcamento: any) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Título
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text(`ORÇAMENTO #${orcamento.numero}`, pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Linha de separação
      doc.setDrawColor(0);
      doc.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);
      yPosition += 10;

      // Informações gerais
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      doc.text(
        `Data de Emissão: ${formatDate(orcamento.dataEmissao)}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Data de Validade: ${formatDate(orcamento.dataValidade)}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(`Status: ${orcamento.status}`, 20, yPosition);
      yPosition += 15;

      // Seção de detalhes
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("DETALHES DO ORÇAMENTO", 20, yPosition);
      yPosition += 10;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Quantidade: ${orcamento.quantidade}`, 20, yPosition);
      yPosition += 6;
      doc.text(
        `Valor Unitário: ${formatCurrency(orcamento.valorUnitario / 100)}`,
        20,
        yPosition
      );
      yPosition += 6;
      doc.setFont(undefined, "bold");
      doc.text(
        `Valor Total: ${formatCurrency(orcamento.valorTotal / 100)}`,
        20,
        yPosition
      );
      yPosition += 12;

      // Descrição
      if (orcamento.descricao) {
        doc.setFont(undefined, "bold");
        doc.text("Descrição:", 20, yPosition);
        yPosition += 6;
        doc.setFont(undefined, "normal");
        const descricaoLines = doc.splitTextToSize(
          orcamento.descricao,
          pageWidth - 40
        );
        doc.text(descricaoLines, 20, yPosition);
      }

      // Rodapé
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Salvar PDF
      doc.save(`orcamento-${orcamento.numero}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <Button
            onClick={() => setLocation("/orcamentos/novo")}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Button>
        </div>

        {!orcamentos || orcamentos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                Nenhum orçamento cadastrado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orcamentos.map((orcamento: any) => (
              <Card key={orcamento.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Orçamento #{orcamento.numero}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(orcamento.dataEmissao)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        orcamento.status === "Ativo"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {orcamento.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Quantidade</p>
                      <p className="text-lg font-semibold">
                        {orcamento.quantidade}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor Total</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(orcamento.valorTotal / 100)}
                      </p>
                    </div>
                  </div>
                  {orcamento.descricao && (
                    <p className="text-sm text-gray-600 mb-4">
                      {orcamento.descricao}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLocation(`/orcamentos/${orcamento.id}/editar`)
                      }
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(orcamento)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(orcamento.id)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </Button>
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
