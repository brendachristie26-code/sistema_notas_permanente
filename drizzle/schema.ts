import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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
 * Agentes - Representantes ou vendedores
 */
export const agentes = mysqlTable("agentes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
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
  numero: varchar("numero", { length: 100 }).notNull().unique(),
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
  notaFiscalId: int("notaFiscalId").notNull(),
  status: mysqlEnum("status", ["Pendente", "Pago", "Cancelado"]).default("Pendente").notNull(),
  dataVencimento: timestamp("dataVencimento").notNull(),
  dataPagamento: timestamp("dataPagamento"),
  observacoes: text("observacoes"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).unique(),
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
  numero: varchar("numero", { length: 100 }).notNull().unique(),
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
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).unique(),
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
 * Configurações da Empresa - Logo, nome, dados da empresa
 */
export const configuracoes = mysqlTable("configuracoes", {
  id: int("id").autoincrement().primaryKey(),
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