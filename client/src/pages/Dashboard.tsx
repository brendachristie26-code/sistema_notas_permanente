import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, FileText, CheckCircle, Eye, EyeOff, DollarSign } from "lucide-react";
import { useState } from "react";
import ProximosPagamentosChart from "@/components/ProximosPagamentosChart";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: pagamentosPendentes } = trpc.dashboard.pagamentosPendentes.useQuery();
  const { data: pagamentosRealizados } = trpc.dashboard.pagamentosRealizados.useQuery();
  const { data: proximosPagamentos } = trpc.dashboard.proximosPagamentos.useQuery();
  const { data: notasEmitidas } = trpc.dashboard.notasEmitidas.useQuery();
  const { data: fluxoCaixa } = trpc.dashboard.fluxoCaixa.useQuery();

  const [filtroAtivo, setFiltroAtivo] = useState<'pendentes' | 'realizados' | 'proximos' | 'notas'>('pendentes');
  const [expandirFiltro, setExpandirFiltro] = useState(true);

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
                {formatCurrency((stats?.totalAPagar || 0) / 100)}
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
              <div className="text-2xl font-bold">{stats?.taxaRecebimento || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">Do total faturado</p>
            </CardContent>
          </Card>
        </div>

        {/* Fluxo de Caixa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Receitas (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((fluxoCaixa?.receitas || 0) / 100)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Pagamentos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Despesas (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency((fluxoCaixa?.despesas || 0) / 100)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Despesas pagas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Saldo (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (fluxoCaixa?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency((fluxoCaixa?.saldo || 0) / 100)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Receitas - Despesas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Avançados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Filtros Avançados</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandirFiltro(!expandirFiltro)}
            >
              {expandirFiltro ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          
          {expandirFiltro && (
            <>
              <CardContent className="border-t pt-4">
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant={filtroAtivo === 'pendentes' ? 'default' : 'outline'}
                    onClick={() => setFiltroAtivo('pendentes')}
                  >
                    Pagamentos Pendentes
                  </Button>
                  <Button
                    variant={filtroAtivo === 'realizados' ? 'default' : 'outline'}
                    onClick={() => setFiltroAtivo('realizados')}
                  >
                    Pagamentos Realizados
                  </Button>
                  <Button
                    variant={filtroAtivo === 'proximos' ? 'default' : 'outline'}
                    onClick={() => setFiltroAtivo('proximos')}
                  >
                    Próximos Pagamentos
                  </Button>
                  <Button
                    variant={filtroAtivo === 'notas' ? 'default' : 'outline'}
                    onClick={() => setFiltroAtivo('notas')}
                  >
                    Notas Emitidas
                  </Button>
                </div>

                {/* Pagamentos Pendentes */}
                {filtroAtivo === 'pendentes' && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm mb-3">Pagamentos Pendentes</h3>
                    {pagamentosPendentes && pagamentosPendentes.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pagamentosPendentes.map((item: any) => (
                          <div key={item.id} className="p-2 bg-red-50 rounded text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Nota #{item.notaFiscalId}</span>
                              <span className="text-red-600 font-semibold">Pendente</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum pagamento pendente</p>
                    )}
                  </div>
                )}

                {/* Pagamentos Realizados */}
                {filtroAtivo === 'realizados' && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm mb-3">Pagamentos Realizados</h3>
                    {pagamentosRealizados && pagamentosRealizados.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pagamentosRealizados.map((item: any) => (
                          <div key={item.id} className="p-2 bg-green-50 rounded text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Nota #{item.notaFiscalId}</span>
                              <span className="text-green-600 font-semibold">Pago</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum pagamento realizado</p>
                    )}
                  </div>
                )}
                {/* Próximos Pagamentos */}
                {filtroAtivo === 'proximos' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">Próximos Pagamentos (Próximo Mês)</h3>
                    {proximosPagamentos && Object.keys(proximosPagamentos).length > 0 ? (
                      <>
                        <ProximosPagamentosChart data={proximosPagamentos} />
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {Object.entries(proximosPagamentos).map(([dia, dados]: any) => (
                            <div key={dia} className="p-2 bg-blue-50 rounded text-sm">
                              <div className="font-medium text-blue-900">{dia}</div>
                              <div className="text-blue-700 text-xs mt-1">
                                {dados.aPagar} nota(s) para pagar
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhum pagamento previsto para o próximo mês</p>
                    )}
                  </div>
                )}






















                {/* Notas Emitidas */}
                {filtroAtivo === 'notas' && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm mb-3">Notas Emitidas</h3>
                    {notasEmitidas && notasEmitidas.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notasEmitidas.map((item: any) => (
                          <div key={item.id} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Nota #{item.numero}</span>
                              <span className="text-gray-600">{formatCurrency((item.valorTotal || 0) / 100)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma nota emitida</p>
                    )}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>

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
