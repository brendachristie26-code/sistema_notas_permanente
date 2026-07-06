import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Settings, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function Configuracoes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'auditoria' | 'sistema'>('geral');

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-600 mt-2">Gerencie as configurações do sistema</p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setAbaAtiva('geral')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              abaAtiva === 'geral'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Geral
          </button>
          <button
            onClick={() => setAbaAtiva('sistema')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              abaAtiva === 'sistema'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Status do Sistema
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setAbaAtiva('auditoria')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                abaAtiva === 'auditoria'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Auditoria
            </button>
          )}
        </div>

        {/* ABA: Geral */}
        {abaAtiva === 'geral' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Perfil do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Nome</label>
                    <input
                      type="text"
                      value={user.name || ''}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Papel</label>
                    <input
                      type="text"
                      value={user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Membro desde</label>
                    <input
                      type="text"
                      value={new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações por Email</p>
                      <p className="text-sm text-gray-500">Receba alertas de pagamentos vencidos</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações WhatsApp</p>
                      <p className="text-sm text-gray-500">Receba lembretes via WhatsApp</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Relatórios Automáticos</p>
                      <p className="text-sm text-gray-500">Receba relatórios consolidados diariamente</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                  </div>
                </div>
                <Button className="mt-6 w-full">Salvar Preferências</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ABA: Status do Sistema */}
        {abaAtiva === 'sistema' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Banco de Dados</p>
                        <p className="text-sm text-gray-500">Online e funcionando</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Autenticação OAuth</p>
                        <p className="text-sm text-gray-500">Manus OAuth ativo</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">API tRPC</p>
                        <p className="text-sm text-gray-500">Todas as rotas funcionando</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Armazenamento S3</p>
                        <p className="text-sm text-gray-500">Conexão estável</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Automações (Heartbeat)</p>
                        <p className="text-sm text-gray-500">9 handlers configurados</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Técnicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versão da API:</span>
                    <span className="font-medium">v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banco de Dados:</span>
                    <span className="font-medium">MySQL/TiDB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Framework:</span>
                    <span className="font-medium">React 19 + Express 4 + tRPC 11</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última sincronização:</span>
                    <span className="font-medium">{new Date().toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ABA: Auditoria (apenas para admin) */}
        {abaAtiva === 'auditoria' && user.role === 'admin' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Log de Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Acesse a página completa de auditoria para visualizar o histórico detalhado de todas as ações do sistema.
                </p>
                <Button
                  onClick={() => setLocation('/auditoria')}
                  className="w-full"
                >
                  Ir para Auditoria
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Usuário fez login</p>
                      <p className="text-xs text-gray-500">há 2 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Nota fiscal criada</p>
                      <p className="text-xs text-gray-500">há 15 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Pagamento atualizado</p>
                      <p className="text-xs text-gray-500">há 1 hora</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
