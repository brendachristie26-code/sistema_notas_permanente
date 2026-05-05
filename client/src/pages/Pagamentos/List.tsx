import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import { CheckCircle, Clock } from "lucide-react";

export default function PagamentosList() {
  const [statusFiltro, setStatusFiltro] = useState<string | undefined>(undefined);
  const { data: pagamentos, isLoading } = trpc.pagamentos.list.useQuery({ status: statusFiltro });
  const updatePagamento = trpc.pagamentos.update.useMutation();

  const handleConfirmarPagamento = async (id: number) => {
    if (confirm("Confirmar pagamento?")) {
      await updatePagamento.mutateAsync({
        id,
        status: "Pago",
        dataPagamento: new Date(),
      });
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
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">ID Nota</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-left font-semibold">Data de Pagamento</th>
                      <th className="px-4 py-2 text-left font-semibold">Observações</th>
                      <th className="px-4 py-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((pagamento) => (
                      <tr key={pagamento.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">#{pagamento.notaFiscalId}</td>
                        <td className="px-4 py-3">{getStatusBadge(pagamento.status)}</td>
                        <td className="px-4 py-3">
                          {pagamento.dataPagamento ? formatDate(pagamento.dataPagamento) : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{pagamento.observacoes || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          {pagamento.status === "Pendente" && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmarPagamento(pagamento.id)}
                              disabled={updatePagamento.isPending}
                            >
                              Confirmar Pagamento
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum pagamento encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
