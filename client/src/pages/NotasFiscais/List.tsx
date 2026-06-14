import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generatePDFWithLogo } from "@/lib/pdfGenerator";
import { Link, useLocation } from "wouter";
import { Plus, Trash2, Edit, Download, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NotasFiscaisList() {
  const [, navigate] = useLocation();
  const { data: notas, isLoading, refetch } = trpc.notasFiscais.list.useQuery();
  const { data: agentes } = trpc.agentes.list.useQuery();
  const { data: produtos } = trpc.produtos.list.useQuery();
  const { data: config } = trpc.configuracoes.get.useQuery();
  
  const deleteNota = trpc.notasFiscais.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [previewNotaId, setPreviewNotaId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta nota fiscal?")) {
      await deleteNota.mutateAsync({ id });
    }
  };

  const handlePreview = async (nota: any) => {
    try {
      const agente = agentes?.find(a => a.id === nota.agenteId);
      const produto = produtos?.find(p => p.id === nota.produtoId);

      const blob = await generatePDFWithLogo({
        title: `NOTA FISCAL #${nota.numero}`,
        logoUrl: config?.logoUrl || undefined,
        nomeEmpresa: config?.nomeEmpresa || "",
        endereco: config?.endereco || "",
        telefone: config?.telefone || "",
        email: config?.email || "",
        content: [
          { label: "Número", value: nota.numero },
          { label: "Agente", value: agente?.nome || "N/A" },
          { label: "Data Emissão", value: formatDate(nota.dataEmissao) },
          { label: "Descrição", value: nota.descricao || "N/A" },
        ],
        items: [
          {
            descricao: produto?.nome || "Produto",
            quantidade: nota.quantidade,
            valorUnitario: nota.valorUnitario / 100,
            valorTotal: nota.valorTotal / 100,
          },
        ],
      });

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewNotaId(nota.id);
    } catch (error) {
      console.error("Erro ao gerar preview:", error);
      toast.error("Erro ao gerar preview do PDF");
    }
  };

  const handleDownload = async (nota: any) => {
    try {
      const agente = agentes?.find(a => a.id === nota.agenteId);
      const produto = produtos?.find(p => p.id === nota.produtoId);

      const blob = await generatePDFWithLogo({
        title: `NOTA FISCAL #${nota.numero}`,
        logoUrl: config?.logoUrl || undefined,
        nomeEmpresa: config?.nomeEmpresa || "",
        endereco: config?.endereco || "",
        telefone: config?.telefone || "",
        email: config?.email || "",
        content: [
          { label: "Número", value: nota.numero },
          { label: "Agente", value: agente?.nome || "N/A" },
          { label: "Data Emissão", value: formatDate(nota.dataEmissao) },
          { label: "Descrição", value: nota.descricao || "N/A" },
        ],
        items: [
          {
            descricao: produto?.nome || "Produto",
            quantidade: nota.quantidade,
            valorUnitario: nota.valorUnitario / 100,
            valorTotal: nota.valorTotal / 100,
          },
        ],
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nota-fiscal-${nota.numero}-${Date.now()}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast.error("Erro ao fazer download do PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Notas Fiscais</h1>
          <Link href="/notas-fiscais/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Nota
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Notas Fiscais</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : notas && notas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Número</th>
                      <th className="px-4 py-2 text-left font-semibold">Data</th>
                      <th className="px-4 py-2 text-left font-semibold">Agente</th>
                      <th className="px-4 py-2 text-left font-semibold">Produto</th>
                      <th className="px-4 py-2 text-right font-semibold">Valor</th>
                      <th className="px-4 py-2 text-center font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map((nota) => (
                      <tr key={nota.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{nota.numero}</td>
                        <td className="px-4 py-3">{formatDate(nota.dataEmissao)}</td>
                        <td className="px-4 py-3">{agentes?.find(a => a.id === nota.agenteId)?.nome || "N/A"}</td>
                        <td className="px-4 py-3">{produtos?.find(p => p.id === nota.produtoId)?.nome || "N/A"}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(nota.valorTotal / 100)}
                        </td>
                        <td className="px-4 py-3 text-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(nota)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(nota)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Link href={`/notas-fiscais/${nota.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(nota.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma nota fiscal cadastrada. <Link href="/notas-fiscais/novo"><span className="text-blue-600 hover:underline">Criar nova</span></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewNotaId !== null} onOpenChange={() => setPreviewNotaId(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview da Nota Fiscal</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0 rounded"
              title="Preview PDF"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
