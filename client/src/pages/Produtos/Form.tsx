import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function ProdutosForm({ params }: { params?: { id?: string } }) {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ nome: "", descricao: "", precoUnitario: 0 });
  const createProduto = trpc.produtos.create.useMutation();
  const updateProduto = trpc.produtos.update.useMutation();
  const { data: produto } = trpc.produtos.get.useQuery(
    { id: params?.id ? parseInt(params.id) : 0 },
    { enabled: !!params?.id }
  );

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao || "",
        precoUnitario: produto.precoUnitario / 100,
      });
    }
  }, [produto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (params?.id) {
        await updateProduto.mutateAsync({
          id: parseInt(params.id),
          ...formData,
        });
      } else {
        await createProduto.mutateAsync(formData);
      }
      setLocation("/produtos");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">
          {params?.id ? "Editar Produto" : "Novo Produto"}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
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
              <div>
                <Label htmlFor="precoUnitario">Preço Unitário (R$)</Label>
                <Input
                  id="precoUnitario"
                  type="number"
                  step="0.01"
                  value={formData.precoUnitario}
                  onChange={(e) =>
                    setFormData({ ...formData, precoUnitario: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={createProduto.isPending || updateProduto.isPending}>
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/produtos")}
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
