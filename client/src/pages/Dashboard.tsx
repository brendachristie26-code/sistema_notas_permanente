import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, FileText, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Carregando estatísticas...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-gray-600 mt-2">Bem-vindo ao sistema de gestão de notas fiscais</p>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total a Pagar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Total a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((stats?.totalPendente || 0) / 100)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Notas pendentes</p>
            </CardContent>
          </Card>

          {/* Total Pago */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((stats?.totalPago || 0) / 100)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Notas recebidas</p>
            </CardContent>
          </Card>

          {/* Notas Pendentes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4 text-yellow-500" />
                Notas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.contagemPendente || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Aguardando pagamento</p>
            </CardContent>
          </Card>

          {/* Taxa de Recebimento */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Taxa de Recebimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats && stats.totalPago + stats.totalPendente > 0
                  ? Math.round((stats.totalPago / (stats.totalPago + stats.totalPendente)) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-gray-500 mt-1">Do total faturado</p>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Atalhos Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                Use o menu lateral para navegar entre as seções do sistema:
              </p>
              <ul className="text-sm space-y-1 text-gray-600 list-disc list-inside">
                <li>Agentes - Gerencie seus representantes</li>
                <li>Produtos - Cadastre itens de venda</li>
                <li>Notas Fiscais - Crie e acompanhe documentos</li>
                <li>Pagamentos - Controle recebimentos</li>
                <li>Relatórios - Analise dados consolidados</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Banco de Dados</span>
                <span className="text-sm font-semibold text-green-600">✓ Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Autenticação</span>
                <span className="text-sm font-semibold text-green-600">✓ Ativa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API</span>
                <span className="text-sm font-semibold text-green-600">✓ Funcionando</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
