import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Plus, Trash2, Edit } from "lucide-react";

export default function AgentesList() {
  const { data: agentes, isLoading } = trpc.agentes.list.useQuery();
  const deleteAgente = trpc.agentes.delete.useMutation();

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este agente?")) {
      await deleteAgente.mutateAsync({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Agentes</h1>
          <Link href="/agentes/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agente
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Agentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : agentes && agentes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Nome</th>
                      <th className="px-4 py-2 text-left font-semibold">Email</th>
                      <th className="px-4 py-2 text-left font-semibold">Telefone</th>
                      <th className="px-4 py-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentes.map((agente) => (
                      <tr key={agente.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{agente.nome}</td>
                        <td className="px-4 py-3">{agente.email}</td>
                        <td className="px-4 py-3">{agente.telefone || "-"}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link href={`/agentes/${agente.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(agente.id)}
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
                Nenhum agente cadastrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
