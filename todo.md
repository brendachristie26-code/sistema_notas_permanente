# Sistema de Gestão Financeira - TODO

## Banco de Dados
- [x] Tabela de Agentes (nome, email, telefone, ativo)
- [x] Tabela de Produtos (nome, descricao, precoUnitario, ativo)
- [x] Tabela de Notas Fiscais (numero, agenteId, produtoId, quantidade, valores, dataEmissao, descricao, arquivoPdf)
- [x] Tabela de Pagamentos (notaFiscalId, status, dataPagamento, observacoes, dataVencimento)
- [x] Tabela de Orcamentos (numero, agenteId, produtoId, quantidade, valores, dataEmissao, dataValidade, status)
- [x] Tabela de Configuracoes (nomeEmpresa, logoUrl, logoKey, cnpj, endereco, telefone, email, website)
- [x] Migrations SQL geradas e aplicadas

## Backend (tRPC)
- [x] Rotas CRUD para Agentes (list, get, create, update, delete)
- [x] Rotas CRUD para Produtos (list, get, create, update, delete)
- [x] Rotas CRUD para Notas Fiscais (list, get, create, update, delete)
- [x] Rotas CRUD para Pagamentos (list, get, getByNotaId, create, update)
- [x] Rotas CRUD para Orcamentos (list, get, create, update, delete)
- [x] Rotas para Configuracoes (get, update)
- [x] Rota de Dashboard com estatísticas financeiras
- [x] Query helpers em server/db.ts
- [x] Proteção com protectedProcedure para todas as rotas

## Frontend (React)
- [x] Página Home com informações gerais
- [x] Dashboard com cards de estatísticas (Total a Pagar, Total Pago, Notas Pendentes, Taxa de Recebimento)
- [x] Página de listagem de Agentes com CRUD
- [x] Formulário de criação/edição de Agentes
- [x] Página de listagem de Produtos com CRUD
- [x] Formulário de criação/edição de Produtos
- [x] Página de listagem de Notas Fiscais com CRUD
- [x] Formulário de criação/edição de Notas Fiscais com seleção de Agentes e Produtos
- [x] Página de listagem de Pagamentos com filtros por status
- [x] Funcionalidade de confirmar pagamentos
- [x] Página de Relatórios com geração de relatório consolidado
- [x] Página de Orcamentos com listagem e CRUD
- [x] Página de Configuracoes com upload de logo
- [x] DashboardLayout com sidebar navigation
- [x] Componentes reutilizáveis (Card, Button, Input, Select, Textarea)
- [x] Rotas completas registradas no App.tsx

## Funcionalidades Adicionais
- [x] Autenticação com Manus OAuth
- [x] Formatação de moeda (BRL) com Intl.NumberFormat
- [x] Formatação de datas com Intl.DateTimeFormat
- [x] Filtros de status em Pagamentos (Pendente, Pago, Cancelado)
- [x] Upload de PDFs de notas fiscais (estrutura pronta para S3)
- [x] Testes vitest para rotas principais (9 testes passando)
- [x] Type-safety com tRPC e Zod
- [x] Dashboard corrigido e funcionando
- [x] Todas as rotas de navegação funcionando corretamente

## Filtros Avançados do Dashboard (Concluído)
- [x] Campo dataVencimento adicionado na tabela de pagamentos
- [x] Rota tRPC para Pagamentos Pendentes (com filtro de data)
- [x] Rota tRPC para Próximos Pagamentos (análise diária do próximo mês)
- [x] Rota tRPC para Pagamentos Realizados
- [x] Rota tRPC para Notas Emitidas com filtros
- [x] Componente React para exibir Pagamentos Pendentes
- [x] Componente ProximosPagamentosChart (gráfico de pizza)
- [x] Componente React para exibir Próximos Pagamentos com resumo diário
- [x] Componente React para exibir Pagamentos Realizados
- [x] Componente React para exibir Notas Emitidas
- [x] Integração dos filtros no Dashboard
- [x] Dados de exemplo com datas de vencimento realistas

## Correções e Novas Funcionalidades (Concluído)
- [x] Corrigir botão de confirmar pagamento (com reload da página)
- [x] Implementar geração de PDF para relatórios (com detalhes completos)
- [x] Adicionar funcionalidade de importar notas fiscais (Excel)
- [x] Adicionar funcionalidade de exportar notas fiscais (PDF e Excel)
- [x] Instalar biblioteca xlsx para suporte a Excel

## Módulo de Orcamentos e Logo (Concluído)
- [x] Adicionar tabela de Orcamentos no banco de dados
- [x] Adicionar tabela de Configuracoes da Empresa (logo, nome, etc)
- [x] Criar rotas tRPC para CRUD de Orcamentos (list, get, create, update, delete)
- [x] Criar rotas tRPC para upload e gerenciamento de logo
- [x] Criar página de listagem de Orcamentos com CRUD
- [x] Criar formulário de criação/edição de Orcamentos
- [x] Criar página de Configuracoes com upload de logo
- [x] Adicionar menu de Orcamentos no DashboardLayout
- [x] Adicionar menu de Configuracoes no DashboardLayout
- [x] Testes vitest para Orcamentos e Configuracoes (9 testes passando)

## Integração S3 e Logo (Concluído)
- [x] Rotas tRPC para upload de PDF em S3
- [x] Rotas tRPC para upload de Logo em S3
- [x] Biblioteca jspdf instalada e funcionando
- [x] Geração de PDF para orçamentos com jspdf
- [x] Estrutura pronta para integrar logo nos PDFs

## Próximas Melhorias (Opcional)
- [ ] Integrar logo nos PDFs de Notas Fiscais
- [ ] Integrar logo nos PDFs de Orcamentos
- [ ] Envio de notificações por email
- [ ] Dashboard com gráficos de análise avançada
- [ ] Autenticação de dois fatores
- [ ] Histórico de alterações
- [ ] Backup automático de dados
