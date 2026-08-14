import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Workspaces - Organizações/inquilinos do sistema
 */
export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slugUrl: varchar("slugUrl", { length: 100 }).notNull().unique(),
  logoUrl: varchar("logoUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

/**
 * Workspace Members - Relacionamento N:N entre usuários e workspaces com RBAC
 */
export const workspaceMembers = mysqlTable("workspaceMembers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  role: mysqlEnum("role", ["OWNER", "ADMIN", "USER"]).default("USER").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userWorkspaceUnique: unique("user_workspace_unique").on(t.userId, t.workspaceId),
}));

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = typeof workspaceMembers.$inferInsert;

/**
 * Workspace Invites - Convites seguros com token para novos membros
 */
export const workspaceInvites = mysqlTable("workspaceInvites", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["ADMIN", "USER"]).default("USER").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["PENDENTE", "ACEITO", "EXPIRADO"]).default("PENDENTE").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
export type InsertWorkspaceInvite = typeof workspaceInvites.$inferInsert;

/**
 * Agentes - Representantes ou vendedores
 */
export const agentes = mysqlTable("agentes", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agente = typeof agentes.$inferSelect;
export type InsertAgente = typeof agentes.$inferInsert;

/**
 * Produtos - Itens de venda
 */
export const produtos = mysqlTable("produtos", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  precoUnitario: int("precoUnitario").notNull(),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Produto = typeof produtos.$inferSelect;
export type InsertProduto = typeof produtos.$inferInsert;

/**
 * Notas Fiscais - Documentos de venda
 */
export const notasFiscais = mysqlTable("notasFiscais", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  numero: varchar("numero", { length: 100 }).notNull(),
  agenteId: int("agenteId").notNull(),
  produtoId: int("produtoId").notNull(),
  quantidade: int("quantidade").notNull().default(1),
  valorUnitario: int("valorUnitario").notNull(),
  valorTotal: int("valorTotal").notNull(),
  dataEmissao: timestamp("dataEmissao").notNull(),
  descricao: text("descricao"),
  arquivoPdfUrl: varchar("arquivoPdfUrl", { length: 512 }),
  arquivoPdfKey: varchar("arquivoPdfKey", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotaFiscal = typeof notasFiscais.$inferSelect;
export type InsertNotaFiscal = typeof notasFiscais.$inferInsert;

/**
 * Pagamentos - Controle de recebimentos
 */
export const pagamentos = mysqlTable("pagamentos", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  notaFiscalId: int("notaFiscalId").notNull(),
  status: mysqlEnum("status", ["Pendente", "Pago", "Cancelado"]).default("Pendente").notNull(),
  dataVencimento: timestamp("dataVencimento").notNull(),
  dataPagamento: timestamp("dataPagamento"),
  observacoes: text("observacoes"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  pixTxid: varchar("pixTxid", { length: 255 }),
  pixQrCode: text("pixQrCode"),
  pixCopiaCola: text("pixCopiaCola"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pagamento = typeof pagamentos.$inferSelect;
export type InsertPagamento = typeof pagamentos.$inferInsert;

/**
 * Orçamentos - Propostas comerciais
 */
export const orcamentos = mysqlTable("orcamentos", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  numero: varchar("numero", { length: 100 }).notNull(),
  agenteId: int("agenteId").notNull(),
  produtoId: int("produtoId").notNull(),
  quantidade: int("quantidade").notNull().default(1),
  valorUnitario: int("valorUnitario").notNull(),
  valorTotal: int("valorTotal").notNull(),
  dataEmissao: timestamp("dataEmissao").notNull(),
  dataValidade: timestamp("dataValidade").notNull(),
  descricao: text("descricao"),
  status: mysqlEnum("status", ["Rascunho", "Enviado", "Aceito", "Rejeitado"]).default("Rascunho").notNull(),
  arquivoPdfUrl: varchar("arquivoPdfUrl", { length: 512 }),
  arquivoPdfKey: varchar("arquivoPdfKey", { length: 512 }),
  tokenPublico: varchar("tokenPublico", { length: 64 }).unique(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Orcamento = typeof orcamentos.$inferSelect;
export type InsertOrcamento = typeof orcamentos.$inferInsert;

/**
 * Log de Auditoria - Histórico de ações
 */
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  acao: varchar("acao", { length: 100 }).notNull(),
  entidade: varchar("entidade", { length: 100 }).notNull(),
  entidadeId: int("entidadeId").notNull(),
  detalhes: text("detalhes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Configurações da Empresa - Logo, nome, dados da empresa por workspace
 */
export const configuracoes = mysqlTable("configuracoes", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull().unique(),
  nomeEmpresa: varchar("nomeEmpresa", { length: 255 }).notNull(),
  logoUrl: varchar("logoUrl", { length: 512 }),
  logoKey: varchar("logoKey", { length: 512 }),
  cnpj: varchar("cnpj", { length: 20 }),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Configuracao = typeof configuracoes.$inferSelect;
export type InsertConfiguracao = typeof configuracoes.$inferInsert;

/**
 * Despesas - Contas a pagar
 */
export const despesas = mysqlTable("despesas", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  descricao: varchar("descricao", { length: 255 }).notNull(),
  categoria: mysqlEnum("categoria", ["Fornecedor", "Fixo", "Variável", "Imposto", "Outro"]).notNull(),
  valor: int("valor").notNull(),
  dataVencimento: timestamp("dataVencimento").notNull(),
  dataPagamento: timestamp("dataPagamento"),
  status: mysqlEnum("status", ["Pendente", "Pago", "Cancelado"]).default("Pendente").notNull(),
  observacoes: text("observacoes"),
  fornecedor: varchar("fornecedor", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Despesa = typeof despesas.$inferSelect;
export type InsertDespesa = typeof despesas.$inferInsert;
