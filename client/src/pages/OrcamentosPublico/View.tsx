import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

export default function OrcamentosPublicoView() {
  const { token } = useParams() as { token: string };
  const [respondendo, setRespondendo] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [statusResposta, setStatusResposta] = useState<"Aceito" | "Rejeitado" | null>(null);

  const { data: orcamento, isLoading, refetch } = trpc.orcamentos.getByToken.useQuery({ token });
  const responder = trpc.orcamentos.responderPublico.useMutation();

  const handleResponder = async (status: "Aceito" | "Rejeitado") => {
    try {
      setRespondendo(true);
      await responder.mutateAsync({
        token,
        status,
        observacoes: observacoes || undefined,
      });
      setStatusResposta(status);
      toast.success(`Orçamento ${status.toLowerCase()} com sucesso!`);
      await refetch();
      setRespondendo(false);
    } catch (error) {
      toast.error("Erro ao responder orçamento");
      console.error(error);
      setRespondendo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">Carregando orçamento...</div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Orçamento não encontrado</p>
              <p className="text-sm text-gray-600 mt-2">O link pode ter expirado ou ser inválido</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusJaRespondido = orcamento.status === "Aceito" || orcamento.status === "Rejeitado";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Orçamento</h1>
          <p className="text-gray-600">Número: {orcamento.numero}</p>
        </div>

        {/* Card Principal */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Detalhes do Orçamento</CardTitle>
              </div>
              <Badge className={
                orcamento.status === "Aceito" ? "bg-green-500" :
                orcamento.status === "Rejeitado" ? "bg-red-500" :
                orcamento.status === "Enviado" ? "bg-blue-500" :
                "bg-gray-500"
              }>
                {orcamento.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Data de Emissão</p>
                  <p className="font-semibold">{formatDate(orcamento.dataEmissao)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data de Validade</p>
                  <p className="font-semibold">{formatDate(orcamento.dataValidade)}</p>
                </div>
              </div>

              {/* Descrição */}
              {orcamento.descricao && (
                <div>
                  <p className="text-sm text-gray-600">Descrição</p>
                  <p className="font-semibold">{orcamento.descricao}</p>
                </div>
              )}

              {/* Valores */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Quantidade</p>
                    <p className="font-semibold text-lg">{orcamento.quantidade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valor Unitário</p>
                    <p className="font-semibold text-lg">{formatCurrency(orcamento.valorUnitario / 100)}</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(orcamento.valorTotal / 100)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resposta */}
        {!statusJaRespondido && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle>Sua Resposta</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione qualquer observação sobre sua resposta..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleResponder("Aceito")}
                    disabled={respondendo}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
                  >
                    <CheckCircle size={18} />
                    Aceitar Orçamento
                  </Button>
                  <Button
                    onClick={() => handleResponder("Rejeitado")}
                    disabled={respondendo}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <XCircle size={18} />
                    Rejeitar Orçamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Respondido */}
        {(statusJaRespondido || statusResposta) && (
          <Card className={`shadow-lg ${(orcamento?.status === "Aceito" || statusResposta === "Aceito") ? "border-green-500" : "border-red-500"}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                {(orcamento?.status === "Aceito" || statusResposta === "Aceito") ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-green-600">Orçamento Aceito</p>
                    <p className="text-gray-600 mt-2">Obrigado por aceitar nosso orçamento!</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-red-600">Orçamento Rejeitado</p>
                    <p className="text-gray-600 mt-2">Entendemos sua decisão. Fico à disposição para discussões futuras.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
