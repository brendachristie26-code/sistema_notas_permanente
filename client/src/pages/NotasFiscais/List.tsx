import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { Plus, Trash2, Edit, Download } from "lucide-react";

export default function NotasFiscaisList() {
  const { data: notas, isLoading } = trpc.notasFiscais.list.useQuery();
  const deleteNota = trpc.notasFiscais.delete.useMutation();

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta nota fiscal?")) {
      await deleteNota.mutateAsync({ id });
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
                      <th className="px-4 py-2 text-center font-semibold">Arquivo</th>
                      <th className="px-4 py-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map((nota) => (
                      <tr key={nota.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{nota.numero}</td>
                        <td className="px-4 py-3">{formatDate(nota.dataEmissao)}</td>
                        <td className="px-4 py-3">{nota.agenteId}</td>
                        <td className="px-4 py-3">{nota.produtoId}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(nota.valorTotal / 100)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {nota.arquivoPdfUrl ? (
                            <a href={nota.arquivoPdfUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
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
    </DashboardLayout>
  );
}
