import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function OrcamentosForm({ params }: { params?: { id?: string } }) {
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id) : undefined;
  
  const { data: orcamento } = trpc.orcamentos.get.useQuery(
    { id: id! },
    { enabled: !!id }
  );
  const { data: agentes } = trpc.agentes.list.useQuery();
  const { data: produtos } = trpc.produtos.list.useQuery();
  
  const createMutation = trpc.orcamentos.create.useMutation();
  const updateMutation = trpc.orcamentos.update.useMutation();

  const [formData, setFormData] = useState({
    numero: "",
    agenteId: "",
    produtoId: "",
    quantidade: 1,
    valorUnitario: 0,
    valorTotal: 0,
    dataEmissao: new Date().toISOString().split("T")[0],
    dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    descricao: "",
    status: "Rascunho" as const,
  });

  useEffect(() => {
    if (orcamento) {
      setFormData({
        numero: orcamento.numero,
        agenteId: orcamento.agenteId.toString(),
        produtoId: orcamento.produtoId.toString(),
        quantidade: orcamento.quantidade,
        valorUnitario: orcamento.valorUnitario / 100,
        valorTotal: orcamento.valorTotal / 100,
        dataEmissao: new Date(orcamento.dataEmissao).toISOString().split("T")[0],
        dataValidade: new Date(orcamento.dataValidade)
          .toISOString()
          .split("T")[0],
        descricao: orcamento.descricao || "",
        status: (orcamento.status as any) || "Rascunho",
      });
    }
  }, [orcamento]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "quantidade" || name === "valorUnitario"
        ? parseFloat(value) || 0
        : value;
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };
      if (name === "quantidade" || name === "valorUnitario") {
        updated.valorTotal =
          (updated.quantidade as number) * (updated.valorUnitario as number);
      }
      return updated;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (id) {
        await updateMutation.mutateAsync({
          id,
          numero: formData.numero,
          agenteId: parseInt(formData.agenteId),
          produtoId: parseInt(formData.produtoId),
          quantidade: formData.quantidade as number,
          valorUnitario: (formData.valorUnitario as number) * 100,
          valorTotal: (formData.valorTotal as number) * 100,
          dataEmissao: new Date(formData.dataEmissao),
          dataValidade: new Date(formData.dataValidade),
          descricao: formData.descricao,
          status: formData.status,
        });
        toast.success("Orçamento atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync({
          numero: formData.numero,
          agenteId: parseInt(formData.agenteId),
          produtoId: parseInt(formData.produtoId),
          quantidade: formData.quantidade as number,
          valorUnitario: (formData.valorUnitario as number) * 100,
          valorTotal: (formData.valorTotal as number) * 100,
          dataEmissao: new Date(formData.dataEmissao),
          dataValidade: new Date(formData.dataValidade),
          descricao: formData.descricao,
          status: formData.status,
        });
        toast.success("Orçamento criado com sucesso!");
      }
      setLocation("/orcamentos");
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      toast.error("Erro ao salvar orçamento");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {id ? "Editar Orçamento" : "Novo Orçamento"}
          </h1>
          <p className="text-gray-600 mt-2">
            {id
              ? "Atualize os dados do orçamento"
              : "Crie um novo orçamento para seus clientes"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número do Orçamento
                  </label>
                  <Input
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    placeholder="ORC-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Enviado">Enviado</SelectItem>
                      <SelectItem value="Aceito">Aceito</SelectItem>
                      <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Agente
                  </label>
                  <Select
                    value={formData.agenteId}
                    onValueChange={(value) =>
                      handleSelectChange("agenteId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentes?.map((agente) => (
                        <SelectItem key={agente.id} value={agente.id.toString()}>
                          {agente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Produto
                  </label>
                  <Select
                    value={formData.produtoId}
                    onValueChange={(value) =>
                      handleSelectChange("produtoId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos?.map((produto) => (
                        <SelectItem
                          key={produto.id}
                          value={produto.id.toString()}
                        >
                          {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantidade
                  </label>
                  <Input
                    name="quantidade"
                    type="number"
                    value={formData.quantidade}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor Unitário (R$)
                  </label>
                  <Input
                    name="valorUnitario"
                    type="number"
                    value={formData.valorUnitario}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor Total (R$)
                  </label>
                  <Input
                    name="valorTotal"
                    type="number"
                    value={formData.valorTotal}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data de Emissão
                  </label>
                  <Input
                    name="dataEmissao"
                    type="date"
                    value={formData.dataEmissao}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data de Validade
                  </label>
                  <Input
                    name="dataValidade"
                    type="date"
                    value={formData.dataValidade}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <Textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Adicione detalhes do orçamento..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/orcamentos")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : "Salvar Orçamento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
