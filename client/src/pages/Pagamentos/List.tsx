import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import { CheckCircle, Clock, Trash2, Edit2, Plus, Copy, QrCode } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function PagamentosList() {
  const [statusFiltro, setStatusFiltro] = useState<string | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<any>(null);
  const [formData, setFormData] = useState({
    notaId: "",
    status: "Pendente",
    dataPagamento: "",
    observacoes: "",
  });

  const { data: pagamentos, isLoading, refetch } = trpc.pagamentos.list.useQuery({ status: statusFiltro || undefined });
  const { data: notas } = trpc.notasFiscais.list.useQuery();
  const updatePagamento = trpc.pagamentos.update.useMutation();
  const deletePagamento = trpc.pagamentos.delete.useMutation();
  const createPagamento = trpc.pagamentos.create.useMutation();

  const handleCopyPix = (copiaCola: string) => {
    navigator.clipboard.writeText(copiaCola);
    toast.success("Pix copiado para a área de transferência!");
  };

  const handleShowPixDialog = (pagamento: any) => {
    setSelectedPagamento(pagamento);
    setPixDialogOpen(true);
  };

  const handleOpenForm = (pagamento?: any) => {
    if (pagamento) {
      setEditingId(pagamento.id);
      setFormData({
        notaId: pagamento.notaFiscalId ? pagamento.notaFiscalId.toString() : "",
        status: pagamento.status,
        dataPagamento: pagamento.dataPagamento ? new Date(pagamento.dataPagamento).toISOString().split('T')[0] : "",
        observacoes: pagamento.observacoes || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        notaId: "",
        status: "Pendente",
        dataPagamento: "",
        observacoes: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePagamento.mutateAsync({
          id: editingId,
          status: formData.status,
          dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
          observacoes: formData.observacoes,
        });
        toast.success("Pagamento atualizado com sucesso!");
      } else {
        await createPagamento.mutateAsync({
          notaFiscalId: parseInt(formData.notaId),
          status: formData.status,
          dataVencimento: formData.dataPagamento ? new Date(formData.dataPagamento) : new Date(),
          observacoes: formData.observacoes,
        });
        toast.success("Pagamento criado com sucesso!");
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar pagamento");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este pagamento?")) {
      try {
        await deletePagamento.mutateAsync({ id });
        toast.success("Pagamento deletado com sucesso!");
        refetch();
      } catch (error) {
        toast.error("Erro ao deletar pagamento");
        console.error(error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case "Pendente":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "Cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Pagamento" : "Novo Pagamento"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nota Fiscal</label>
                  <Select value={formData.notaId} onValueChange={(value) => setFormData({ ...formData, notaId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma nota" />
                    </SelectTrigger>
                    <SelectContent>
                      {notas?.map((nota: any) => (
                        <SelectItem key={nota.id} value={nota.id.toString()}>
                          Nota #{nota.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Data de Pagamento</label>
                  <Input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <Input
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Adicione observações..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFiltro === undefined ? "default" : "outline"}
            onClick={() => setStatusFiltro(undefined)}
          >
            Todos
          </Button>
          <Button
            variant={statusFiltro === "Pendente" ? "default" : "outline"}
            onClick={() => setStatusFiltro("Pendente")}
          >
            Pendentes
          </Button>
          <Button
            variant={statusFiltro === "Pago" ? "default" : "outline"}
            onClick={() => setStatusFiltro("Pago")}
          >
            Pagos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : pagamentos && pagamentos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Nota Fiscal</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Data de Pagamento</th>
                      <th className="text-left py-3 px-4 font-semibold">Observações</th>
                      <th className="text-left py-3 px-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((pagamento: any) => (
                      <tr key={pagamento.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">#{pagamento.notaFiscalId}</td>
                        <td className="py-3 px-4">{getStatusBadge(pagamento.status)}</td>
                        <td className="py-3 px-4">{pagamento.dataPagamento ? formatDate(pagamento.dataPagamento) : "-"}</td>
                        <td className="py-3 px-4">{pagamento.observacoes || "-"}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {pagamento.status === "Pendente" && pagamento.pixCopiaCola && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowPixDialog(pagamento)}
                                className="gap-1 text-blue-600 hover:text-blue-700"
                              >
                                <QrCode className="h-4 w-4" />
                                Pix
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenForm(pagamento)}
                              className="gap-1"
                            >
                              <Edit2 className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(pagamento.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Deletar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum pagamento encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diálogo Pix */}
        <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>💳 Pix - Copia e Cola</DialogTitle>
            </DialogHeader>
            {selectedPagamento && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Valor:</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedPagamento.notaFiscalId ? 0 : 0)}
                  </p>
                </div>

                {selectedPagamento.pixQrCode && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">QR Code:</p>
                    <img 
                      src={selectedPagamento.pixQrCode} 
                      alt="QR Code Pix" 
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedPagamento.pixCopiaCola || ""}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopyPix(selectedPagamento.pixCopiaCola)}
                      className="gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>

                {selectedPagamento.pixTxid && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <p>ID da Transação: {selectedPagamento.pixTxid}</p>
                  </div>
                )}

                <Button 
                  onClick={() => setPixDialogOpen(false)} 
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
