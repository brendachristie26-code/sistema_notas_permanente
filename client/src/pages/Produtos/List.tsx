import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { Plus, Trash2, Edit } from "lucide-react";

export default function ProdutosList() {
  const { data: produtos, isLoading } = trpc.produtos.list.useQuery();
  const deleteProduto = trpc.produtos.delete.useMutation();

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
      await deleteProduto.mutateAsync({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Produtos</h1>
          <Link href="/produtos/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : produtos && produtos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Nome</th>
                      <th className="px-4 py-2 text-left font-semibold">Descrição</th>
                      <th className="px-4 py-2 text-right font-semibold">Preço Unitário</th>
                      <th className="px-4 py-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((produto) => (
                      <tr key={produto.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{produto.nome}</td>
                        <td className="px-4 py-3 text-gray-600">{produto.descricao || "-"}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(produto.precoUnitario / 100)}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link href={`/produtos/${produto.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(produto.id)}
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
                Nenhum produto cadastrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
