import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

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
    const conteudo = `
ORÇAMENTO #${orcamento.numero}
================================

Data de Emissão: ${formatDate(orcamento.dataEmissao)}
Data de Validade: ${formatDate(orcamento.dataValidade)}
Status: ${orcamento.status}

DETALHES
--------
Agente ID: ${orcamento.agenteId}
Produto ID: ${orcamento.produtoId}
Quantidade: ${orcamento.quantidade}
Valor Unitário: ${formatCurrency(orcamento.valorUnitario / 100)}
Valor Total: ${formatCurrency(orcamento.valorTotal / 100)}

Descrição: ${orcamento.descricao || "N/A"}
    `;

    const blob = new Blob([conteudo], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orcamento-${orcamento.numero}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <Button onClick={() => setLocation("/orcamentos/novo")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {orcamentos && orcamentos.length > 0 ? (
          <div className="grid gap-4">
            {orcamentos.map((orcamento) => (
              <Card key={orcamento.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Orçamento #{orcamento.numero}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(orcamento.dataEmissao)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      orcamento.status === "Aceito" ? "bg-green-100 text-green-800" :
                      orcamento.status === "Rejeitado" ? "bg-red-100 text-red-800" :
                      orcamento.status === "Enviado" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {orcamento.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Quantidade</p>
                      <p className="font-semibold">{orcamento.quantidade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor Unitário</p>
                      <p className="font-semibold">{formatCurrency(orcamento.valorUnitario / 100)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valor Total</p>
                      <p className="font-semibold text-lg">{formatCurrency(orcamento.valorTotal / 100)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Validade</p>
                      <p className="font-semibold">{formatDate(orcamento.dataValidade)}</p>
                    </div>
                  </div>
                  
                  {orcamento.descricao && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{orcamento.descricao}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLocation(`/orcamentos/${orcamento.id}/editar`)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleExportPDF(orcamento)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      onClick={() => handleDelete(orcamento.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Nenhum orçamento cadastrado</p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => setLocation("/orcamentos/novo")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Orçamento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
