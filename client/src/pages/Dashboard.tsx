import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, FileText, CheckCircle, Eye, EyeOff, DollarSign, Calendar } from "lucide-react";
import { useState } from "react";
import ProximosPagamentosChart from "@/components/ProximosPagamentosChart";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: pagamentosPendentes } = trpc.dashboard.pagamentosPendentes.useQuery();
  const { data: pagamentosRealizados } = trpc.dashboard.pagamentosRealizados.useQuery();
  const { data: proximosPagamentos } = trpc.dashboard.proximosPagamentos.useQuery();
  const { data: notasEmitidas } = trpc.dashboard.notasEmitidas.useQuery();
  const { data: fluxoCaixa } = trpc.dashboard.fluxoCaixa.useQuery();
  
  // Dados para gráficos
  const { data: receitasDespesas } = trpc.dashboard.receitasDespesasUltimos30Dias.useQuery();
  const { data: despesasCategoria } = trpc.dashboard.despesasPorCategoria.useQuery();
  const { data: topAgentes } = trpc.dashboard.topAgentes.useQuery();

  const [filtroAtivo, setFiltroAtivo] = useState<'pendentes' | 'realizados' | 'proximos' | 'notas'>('pendentes');
  const [expandirFiltro, setExpandirFiltro] = useState(true);
  const [periodoFiltro, setPeriodoFiltro] = useState<'7d' | '30d' | '90d'>('30d');

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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
            <p className="text-gray-600 mt-2">Bem-vindo ao sistema de gestão de notas fiscais</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={periodoFiltro === '7d' ? 'default' : 'outline'}
              onClick={() => setPeriodoFiltro('7d')}
              className="text-sm"
            >
              7 dias
            </Button>
            <Button 
              variant={periodoFiltro === '30d' ? 'default' : 'outline'}
              onClick={() => setPeriodoFiltro('30d')}
              className="text-sm"
            >
              30 dias
            </Button>
            <Button 
              variant={periodoFiltro === '90d' ? 'default' : 'outline'}
              onClick={() => setPeriodoFiltro('90d')}
              className="text-sm"
            >
              90 dias
            </Button>
          </div>
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
                {formatCurrency(stats?.totalAPagar || 0)}
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
                {formatCurrency(stats?.totalPago || 0)}
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
              <div className="text-2xl font-bold">{stats?.notasPendentes || 0}</div>
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
                {stats?.totalAPagar ? Math.round((stats.totalPago / (stats.totalPago + stats.totalAPagar)) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Do total faturado</p>
            </CardContent>
          </Card>
        </div>

        {/* Fluxo de Caixa */}
        {fluxoCaixa && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Receitas (Mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(fluxoCaixa.receitas || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Pagamentos realizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Despesas (Mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(fluxoCaixa.despesas || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Despesas pagas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Saldo (Mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(fluxoCaixa.receitas || 0) - (fluxoCaixa.despesas || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency((fluxoCaixa.receitas || 0) - (fluxoCaixa.despesas || 0))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Receitas - Despesas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Linha: Receitas vs Despesas */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Receitas vs Despesas (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {receitasDespesas && receitasDespesas.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={receitasDespesas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)} />
                    <Legend />
                    <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" />
                    <Line type="monotone" dataKey="despesas" stroke="#ef4444" name="Despesas" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Pizza: Despesas por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {despesasCategoria && despesasCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={despesasCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {despesasCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras: Top 5 Agentes */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Agentes por Volume de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {topAgentes && topAgentes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topAgentes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)} />
                    <Bar dataKey="total" fill="#3b82f6" name="Total de Vendas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>

          {/* Próximos Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proximosPagamentos && Object.keys(proximosPagamentos).length > 0 ? (
                <ProximosPagamentosChart data={proximosPagamentos} />
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum pagamento próximo</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros Avançados */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setExpandirFiltro(!expandirFiltro)}>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                Filtros Avançados
              </CardTitle>
              <Eye className={`h-5 w-5 transition-transform ${expandirFiltro ? '' : 'rotate-180'}`} />
            </div>
          </CardHeader>
          {expandirFiltro && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Data Início</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Data Fim</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option>Todos</option>
                    <option>Pendente</option>
                    <option>Pago</option>
                    <option>Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Agente</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option>Todos</option>
                  </select>
                </div>
              </div>
              <Button className="mt-4 w-full">Aplicar Filtros</Button>
            </CardContent>
          )}
        </Card>


      </div>
    </DashboardLayout>
  );
}
