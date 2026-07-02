import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, Download, Eye, Share2, Copy } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { generatePDFWithLogo } from "@/lib/pdfGenerator";

export default function OrcamentosList() {
  const [, setLocation] = useLocation();
  const { data: orcamentos, refetch } = trpc.orcamentos.list.useQuery();
  const { data: agentes } = trpc.agentes.list.useQuery();
  const { data: produtos } = trpc.produtos.list.useQuery();
  const { data: config } = trpc.configuracoes.get.useQuery();
  
  const deleteMutation = trpc.orcamentos.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [previewOrcamentoId, setPreviewOrcamentoId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [linkPublicoId, setLinkPublicoId] = useState<number | null>(null);
  const [linkPublico, setLinkPublico] = useState<string | null>(null);
  
  const gerarTokenMutation = trpc.orcamentos.gerarTokenPublico.useMutation();

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este orçamento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleGerarLinkPublico = async (orcamento: any) => {
    try {
      const result = await gerarTokenMutation.mutateAsync({ id: orcamento.id });
      const url = `${window.location.origin}/orcamentos/publico/${result.token}`;
      setLinkPublico(url);
      setLinkPublicoId(orcamento.id);
      toast.success("Link público gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar link:", error);
      toast.error("Erro ao gerar link público");
    }
  };

  const handleCopyLink = () => {
    if (linkPublico) {
      navigator.clipboard.writeText(linkPublico);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handlePreview = async (orcamento: any) => {
    try {
      const agente = agentes?.find(a => a.id === orcamento.agenteId);
      const produto = produtos?.find(p => p.id === orcamento.produtoId);

      const blob = await generatePDFWithLogo({
        title: `ORÇAMENTO #${orcamento.numero}`,
        logoUrl: config?.logoUrl || undefined,
        nomeEmpresa: config?.nomeEmpresa || "",
        endereco: config?.endereco || "",
        telefone: config?.telefone || "",
        email: config?.email || "",
        content: [
          { label: "Número", value: orcamento.numero },
          { label: "Agente", value: agente?.nome || "N/A" },
          { label: "Data Emissão", value: formatDate(orcamento.dataEmissao) },
          { label: "Data Validade", value: formatDate(orcamento.dataValidade) },
          { label: "Status", value: orcamento.status },
        ],
        items: [
          {
            descricao: produto?.nome || "Produto",
            quantidade: orcamento.quantidade,
            valorUnitario: orcamento.valorUnitario / 100,
            valorTotal: orcamento.valorTotal / 100,
          },
        ],
      });

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOrcamentoId(orcamento.id);
    } catch (error) {
      console.error("Erro ao gerar preview:", error);
      toast.error("Erro ao gerar preview do PDF");
    }
  };

  const handleExportPDF = async (orcamento: any) => {
    try {
      const agente = agentes?.find(a => a.id === orcamento.agenteId);
      const produto = produtos?.find(p => p.id === orcamento.produtoId);

      const blob = await generatePDFWithLogo({
        title: `ORÇAMENTO #${orcamento.numero}`,
        logoUrl: config?.logoUrl || undefined,
        nomeEmpresa: config?.nomeEmpresa || "",
        endereco: config?.endereco || "",
        telefone: config?.telefone || "",
        email: config?.email || "",
        content: [
          { label: "Número", value: orcamento.numero },
          { label: "Agente", value: agente?.nome || "N/A" },
          { label: "Data Emissão", value: formatDate(orcamento.dataEmissao) },
          { label: "Data Validade", value: formatDate(orcamento.dataValidade) },
          { label: "Status", value: orcamento.status },
        ],
        items: [
          {
            descricao: produto?.nome || "Produto",
            quantidade: orcamento.quantidade,
            valorUnitario: orcamento.valorUnitario / 100,
            valorTotal: orcamento.valorTotal / 100,
          },
        ],
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orcamento-${orcamento.numero}-${Date.now()}.pdf`;
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
                      onClick={() => handlePreview(orcamento)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
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
                      onClick={() => handleGerarLinkPublico(orcamento)}
                      className="gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Link Público
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

      {/* Preview Dialog */}
      <Dialog open={previewOrcamentoId !== null} onOpenChange={() => setPreviewOrcamentoId(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview do Orçamento</DialogTitle>
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

      {/* Link Público Dialog */}
      <Dialog open={linkPublicoId !== null} onOpenChange={() => setLinkPublicoId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Público do Orçamento</DialogTitle>
          </DialogHeader>
          {linkPublico && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Compartilhe este link com o cliente:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkPublico}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                O cliente poderá visualizar e responder ao orçamento através deste link público.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
