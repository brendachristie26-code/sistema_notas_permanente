import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function DespesasList() {
  const [statusFiltro, setStatusFiltro] = useState<string | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "Fornecedor",
    valor: "",
    dataVencimento: "",
    dataPagamento: "",
    status: "Pendente",
    observacoes: "",
    fornecedor: "",
  });

  const { data: despesas, isLoading, refetch } = trpc.despesas.list.useQuery({ status: statusFiltro || undefined });
  const updateDespesa = trpc.despesas.update.useMutation();
  const deleteDespesa = trpc.despesas.delete.useMutation();
  const createDespesa = trpc.despesas.create.useMutation();

  const handleOpenForm = (despesa?: any) => {
    if (despesa) {
      setEditingId(despesa.id);
      setFormData({
        descricao: despesa.descricao,
        categoria: despesa.categoria,
        valor: (despesa.valor / 100).toString(),
        dataVencimento: despesa.dataVencimento ? new Date(despesa.dataVencimento).toISOString().split('T')[0] : "",
        dataPagamento: despesa.dataPagamento ? new Date(despesa.dataPagamento).toISOString().split('T')[0] : "",
        status: despesa.status,
        observacoes: despesa.observacoes || "",
        fornecedor: despesa.fornecedor || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        descricao: "",
        categoria: "Fornecedor",
        valor: "",
        dataVencimento: "",
        dataPagamento: "",
        status: "Pendente",
        observacoes: "",
        fornecedor: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const valor = Math.round(parseFloat(formData.valor) * 100);
      
      if (editingId) {
        await updateDespesa.mutateAsync({
          id: editingId,
          descricao: formData.descricao,
          categoria: formData.categoria as any,
          valor: valor,
          dataVencimento: formData.dataVencimento ? new Date(formData.dataVencimento) : undefined,
          dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
          status: formData.status as any,
          observacoes: formData.observacoes,
          fornecedor: formData.fornecedor,
        });
        toast.success("Despesa atualizada com sucesso!");
      } else {
        await createDespesa.mutateAsync({
          descricao: formData.descricao,
          categoria: formData.categoria as any,
          valor: valor,
          dataVencimento: new Date(formData.dataVencimento),
          dataPagamento: formData.dataPagamento ? new Date(formData.dataPagamento) : undefined,
          status: formData.status as any,
          observacoes: formData.observacoes,
          fornecedor: formData.fornecedor,
        });
        toast.success("Despesa criada com sucesso!");
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar despesa");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta despesa?")) {
      try {
        await deleteDespesa.mutateAsync({ id });
        toast.success("Despesa excluída com sucesso!");
        refetch();
      } catch (error) {
        toast.error("Erro ao excluir despesa");
        console.error(error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pago":
        return "bg-green-100 text-green-800";
      case "Pendente":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Fornecedor": "bg-blue-100 text-blue-800",
      "Fixo": "bg-purple-100 text-purple-800",
      "Variável": "bg-orange-100 text-orange-800",
      "Imposto": "bg-red-100 text-red-800",
      "Outro": "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Despesas</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenForm()} className="gap-2">
              <Plus size={20} /> Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                      <SelectItem value="Fixo">Fixo</SelectItem>
                      <SelectItem value="Variável">Variável</SelectItem>
                      <SelectItem value="Imposto">Imposto</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data Vencimento</label>
                  <Input
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data Pagamento</label>
                  <Input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
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
                <label className="text-sm font-medium">Fornecedor</label>
                <Input
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Observações</label>
                <Input
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Atualizar" : "Criar"} Despesa
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-4">
        <Select value={statusFiltro || "todos"} onValueChange={(value) => setStatusFiltro(value === "todos" ? undefined : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Despesas ({despesas?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Descrição</th>
                  <th className="text-left py-2">Categoria</th>
                  <th className="text-left py-2">Valor</th>
                  <th className="text-left py-2">Vencimento</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {despesas && despesas.length > 0 ? (
                  despesas.map((despesa: any) => (
                    <tr key={despesa.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{despesa.descricao}</td>
                      <td className="py-3">
                        <Badge className={getCategoryColor(despesa.categoria)}>
                          {despesa.categoria}
                        </Badge>
                      </td>
                      <td className="py-3">{formatCurrency(despesa.valor)}</td>
                      <td className="py-3">{formatDate(despesa.dataVencimento)}</td>
                      <td className="py-3">
                        <Badge className={getStatusColor(despesa.status)}>
                          {despesa.status}
                        </Badge>
                      </td>
                      <td className="py-3 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(despesa)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(despesa.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Nenhuma despesa encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
