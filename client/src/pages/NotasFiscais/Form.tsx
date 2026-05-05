import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function NotasFiscaisForm({ params }: { params?: { id?: string } }) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    numero: "",
    agenteId: 0,
    produtoId: 0,
    quantidade: 1,
    valorUnitario: 0,
    valorTotal: 0,
    dataEmissao: new Date().toISOString().split("T")[0],
    descricao: "",
  });

  const { data: agentes } = trpc.agentes.list.useQuery();
  const { data: produtos } = trpc.produtos.list.useQuery();
  const createNota = trpc.notasFiscais.create.useMutation();
  const updateNota = trpc.notasFiscais.update.useMutation();
  const { data: nota } = trpc.notasFiscais.get.useQuery(
    { id: params?.id ? parseInt(params.id) : 0 },
    { enabled: !!params?.id }
  );

  useEffect(() => {
    if (nota) {
      setFormData({
        numero: nota.numero,
        agenteId: nota.agenteId,
        produtoId: nota.produtoId,
        quantidade: nota.quantidade,
        valorUnitario: nota.valorUnitario / 100,
        valorTotal: nota.valorTotal / 100,
        dataEmissao: new Date(nota.dataEmissao).toISOString().split("T")[0],
        descricao: nota.descricao || "",
      });
    }
  }, [nota]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (params?.id) {
        await updateNota.mutateAsync({
          id: parseInt(params.id),
          ...formData,
          dataEmissao: new Date(formData.dataEmissao),
        });
      } else {
        await createNota.mutateAsync({
          ...formData,
          dataEmissao: new Date(formData.dataEmissao),
        });
      }
      setLocation("/notas-fiscais");
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">
          {params?.id ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Nota Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="numero">Número da Nota</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData({ ...formData, numero: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agenteId">Agente</Label>
                  <Select
                    value={formData.agenteId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, agenteId: parseInt(value) })
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
                  <Label htmlFor="produtoId">Produto</Label>
                  <Select
                    value={formData.produtoId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, produtoId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos?.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id.toString()}>
                          {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={formData.quantidade}
                    onChange={(e) =>
                      setFormData({ ...formData, quantidade: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
                  <Input
                    id="valorUnitario"
                    type="number"
                    step="0.01"
                    value={formData.valorUnitario}
                    onChange={(e) =>
                      setFormData({ ...formData, valorUnitario: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valorTotal">Valor Total (R$)</Label>
                  <Input
                    id="valorTotal"
                    type="number"
                    step="0.01"
                    value={formData.valorTotal}
                    onChange={(e) =>
                      setFormData({ ...formData, valorTotal: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dataEmissao">Data de Emissão</Label>
                <Input
                  id="dataEmissao"
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) =>
                    setFormData({ ...formData, dataEmissao: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={createNota.isPending || updateNota.isPending}>
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/notas-fiscais")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
