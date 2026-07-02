import { drizzle } from "drizzle-orm/mysql2";
import { eq, gte, lte, and, desc, or } from "drizzle-orm";
import { InsertUser, users, agentes, InsertAgente, produtos, InsertProduto, notasFiscais, InsertNotaFiscal, pagamentos, InsertPagamento, despesas, InsertDespesa, auditLog, InsertAuditLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== AGENTES =====
export async function listAgentes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentes).where(eq(agentes.ativo, 1));
}

export async function getAgenteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(agentes).where(eq(agentes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createAgente(data: InsertAgente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(agentes).values(data);
}

export async function updateAgente(id: number, data: Partial<InsertAgente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(agentes).set(data).where(eq(agentes.id, id));
}

export async function deleteAgente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(agentes).set({ ativo: 0 }).where(eq(agentes.id, id));
}

// ===== PRODUTOS =====
export async function listProdutos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(produtos).where(eq(produtos.ativo, 1));
}

export async function getProdutoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createProduto(data: InsertProduto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(produtos).values(data);
}

export async function updateProduto(id: number, data: Partial<InsertProduto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(produtos).set(data).where(eq(produtos.id, id));
}

export async function deleteProduto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(produtos).set({ ativo: 0 }).where(eq(produtos.id, id));
}

// ===== NOTAS FISCAIS =====
export async function listNotasFiscais() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notasFiscais);
}

export async function getNotaFiscalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notasFiscais).where(eq(notasFiscais.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createNotaFiscal(data: InsertNotaFiscal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notasFiscais).values(data);
}

export async function updateNotaFiscal(id: number, data: Partial<InsertNotaFiscal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notasFiscais).set(data).where(eq(notasFiscais.id, id));
}

export async function deleteNotaFiscal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(notasFiscais).where(eq(notasFiscais.id, id));
}

// ===== PAGAMENTOS =====
export async function listPagamentos(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return db.select().from(pagamentos).where(eq(pagamentos.status, status as any));
  }
  return db.select().from(pagamentos);
}

export async function getPagamentoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pagamentos).where(eq(pagamentos.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPagamentoByNotaId(notaFiscalId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pagamentos).where(eq(pagamentos.notaFiscalId, notaFiscalId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPagamento(data: InsertPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(pagamentos).values(data);
}

export async function updatePagamento(id: number, data: Partial<InsertPagamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(pagamentos).set(data).where(eq(pagamentos.id, id));
}

export async function deletePagamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(pagamentos).where(eq(pagamentos.id, id));
}

// ===== FILTROS AVANÇADOS DO DASHBOARD =====
export async function getPagamentosPendentes() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: pagamentos.id,
      notaFiscalId: pagamentos.notaFiscalId,
      status: pagamentos.status,
      dataPagamento: pagamentos.dataPagamento,
      valorTotal: notasFiscais.valorTotal,
      agenteNome: agentes.nome,
      produtoNome: produtos.nome,
      dataEmissao: notasFiscais.dataEmissao,
    })
    .from(pagamentos)
    .innerJoin(notasFiscais, eq(pagamentos.notaFiscalId, notasFiscais.id))
    .innerJoin(agentes, eq(notasFiscais.agenteId, agentes.id))
    .innerJoin(produtos, eq(notasFiscais.produtoId, produtos.id))
    .where(eq(pagamentos.status, 'Pendente'))
    .orderBy(notasFiscais.dataEmissao);
  
  return result;
}

export async function getProximosPagamentos() {
  const db = await getDb();
  if (!db) return {};
  
  const hoje = new Date();
  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
  const fimProximoMes = new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 0);
  
  const result = await db
    .select({
      id: pagamentos.id,
      notaFiscalId: pagamentos.notaFiscalId,
      status: pagamentos.status,
      dataPagamento: pagamentos.dataPagamento,
      valorTotal: notasFiscais.valorTotal,
      agenteNome: agentes.nome,
      produtoNome: produtos.nome,
      dataEmissao: notasFiscais.dataEmissao,
    })
    .from(pagamentos)
    .innerJoin(notasFiscais, eq(pagamentos.notaFiscalId, notasFiscais.id))
    .innerJoin(agentes, eq(notasFiscais.agenteId, agentes.id))
    .innerJoin(produtos, eq(notasFiscais.produtoId, produtos.id))
    .where(
      and(
        gte(notasFiscais.dataEmissao, proximoMes),
        lte(notasFiscais.dataEmissao, fimProximoMes)
      )
    )
    .orderBy(notasFiscais.dataEmissao);
  
  // Agrupar por dia
  const porDia: Record<string, { dia: string, aPagar: number, aReceber: number }> = {};
  
  result.forEach(item => {
    const data = new Date(item.dataEmissao);
    const dia = data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    if (!porDia[dia]) {
      porDia[dia] = { dia, aPagar: 0, aReceber: 0 };
    }
    
    if (item.status === 'Pendente') {
      porDia[dia].aPagar += item.valorTotal;
    } else if (item.status === 'Pago') {
      porDia[dia].aReceber += item.valorTotal;
    }
  });
  
  return porDia;
}

export async function getPagamentosRealizados() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: pagamentos.id,
      notaFiscalId: pagamentos.notaFiscalId,
      status: pagamentos.status,
      dataPagamento: pagamentos.dataPagamento,
      valorTotal: notasFiscais.valorTotal,
      agenteNome: agentes.nome,
      produtoNome: produtos.nome,
      dataEmissao: notasFiscais.dataEmissao,
    })
    .from(pagamentos)
    .innerJoin(notasFiscais, eq(pagamentos.notaFiscalId, notasFiscais.id))
    .innerJoin(agentes, eq(notasFiscais.agenteId, agentes.id))
    .innerJoin(produtos, eq(notasFiscais.produtoId, produtos.id))
    .where(eq(pagamentos.status, 'Pago'))
    .orderBy(desc(pagamentos.dataPagamento));
  
  return result;
}

export async function getNotasEmitidas(dataInicio?: Date, dataFim?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: notasFiscais.id,
      numero: notasFiscais.numero,
      agenteNome: agentes.nome,
      produtoNome: produtos.nome,
      quantidade: notasFiscais.quantidade,
      valorTotal: notasFiscais.valorTotal,
      dataEmissao: notasFiscais.dataEmissao,
    })
    .from(notasFiscais)
    .innerJoin(agentes, eq(notasFiscais.agenteId, agentes.id))
    .innerJoin(produtos, eq(notasFiscais.produtoId, produtos.id))
    .orderBy(desc(notasFiscais.dataEmissao));
  
  if (dataInicio && dataFim) {
    return result.filter(item => 
      item.dataEmissao >= dataInicio && item.dataEmissao <= dataFim
    );
  }
  
  return result;
}

// ===== DASHBOARD =====
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalAPagar: 0, totalPago: 0, notasPendentes: 0, taxaRecebimento: 0 };

  const pagamentosPendentes = await db
    .select({ total: pagamentos.id })
    .from(pagamentos)
    .innerJoin(notasFiscais, eq(pagamentos.notaFiscalId, notasFiscais.id))
    .where(eq(pagamentos.status, 'Pendente'));

  const pagamentosPagos = await db
    .select({ total: pagamentos.id })
    .from(pagamentos)
    .innerJoin(notasFiscais, eq(pagamentos.notaFiscalId, notasFiscais.id))
    .where(eq(pagamentos.status, 'Pago'));

  let totalAPagar = 0;
  let totalPago = 0;

  if (pagamentosPendentes.length > 0) {
    const result = await db
      .select({ total: pagamentos.id })
      .from(pagamentos)
      .innerJoin(notasFiscais, eq(pagamentos.notaFiscalId, notasFiscais.id))
      .where(eq(pagamentos.status, 'Pendente'));
    
    // Recalculate with proper sum
    const sumResult = await db
      .select()
      .from(notasFiscais)
      .innerJoin(pagamentos, eq(pagamentos.notaFiscalId, notasFiscais.id))
      .where(eq(pagamentos.status, 'Pendente'));
    
    totalAPagar = sumResult.reduce((sum, row) => sum + (row.notasFiscais.valorTotal || 0), 0);
  }

  if (pagamentosPagos.length > 0) {
    const sumResult = await db
      .select()
      .from(notasFiscais)
      .innerJoin(pagamentos, eq(pagamentos.notaFiscalId, notasFiscais.id))
      .where(eq(pagamentos.status, 'Pago'));
    
    totalPago = sumResult.reduce((sum, row) => sum + (row.notasFiscais.valorTotal || 0), 0);
  }

  const notasPendentes = pagamentosPendentes.length;
  const totalNotas = pagamentosPendentes.length + pagamentosPagos.length;
  const taxaRecebimento = totalNotas > 0 ? Math.round((pagamentosPagos.length / totalNotas) * 100) : 0;

  return {
    totalAPagar,
    totalPago,
    notasPendentes,
    taxaRecebimento,
  };
}


// ===== DESPESAS =====
export async function listDespesas(status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return db.select().from(despesas).where(eq(despesas.status, status as any));
  }
  return db.select().from(despesas);
}

export async function getDespesaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(despesas).where(eq(despesas.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createDespesa(data: InsertDespesa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(despesas).values(data);
}

export async function updateDespesa(id: number, data: Partial<InsertDespesa>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(despesas).set(data).where(eq(despesas.id, id));
}

export async function deleteDespesa(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(despesas).where(eq(despesas.id, id));
}

// ===== FLUXO DE CAIXA =====
export async function getFluxoCaixa() {
  const db = await getDb();
  if (!db) return { receitas: 0, despesas: 0, saldo: 0 };

  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  // Receitas do mês (pagamentos realizados)
  const pagamentosPagos = await db
    .select()
    .from(pagamentos)
    .where(
      and(
        eq(pagamentos.status, "Pago" as any),
        gte(pagamentos.dataPagamento, primeiroDia),
        lte(pagamentos.dataPagamento, ultimoDia)
      )
    );

  // Despesas do mês (despesas pagas)
  const despesasPagas = await db
    .select()
    .from(despesas)
    .where(
      and(
        eq(despesas.status, "Pago" as any),
        gte(despesas.dataPagamento, primeiroDia),
        lte(despesas.dataPagamento, ultimoDia)
      )
    );

  // Calcular receitas somando os valores das notas com pagamentos realizados
  const receitas = pagamentosPagos.reduce((sum, p) => sum + 1, 0); // Contar pagamentos
  
  // Para valores reais, seria necessário fazer um JOIN com notasFiscais
  // Por enquanto, retornamos a contagem de pagamentos realizados
  const totalReceitas = pagamentosPagos.length > 0
    ? await db
        .select()
        .from(notasFiscais)
        .where(
          or(...pagamentosPagos.map((p) => eq(notasFiscais.id, p.notaFiscalId)))
        )
        .then((notas: any[]) => notas.reduce((sum, n) => sum + n.valorTotal, 0))
    : 0;

  const despesasTotal = despesasPagas.reduce((sum, d) => sum + d.valor, 0);
  const saldo = totalReceitas - despesasTotal;

  return {
    receitas: totalReceitas,
    despesas: despesasTotal,
    saldo,
  };
}

// ===== AUDIT LOG =====
export async function registrarAuditLog(
  userId: number,
  acao: string,
  entidade: string,
  entidadeId: number,
  detalhes?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Cannot register audit log: database not available");
    return;
  }

  try {
    await db.insert(auditLog).values({
      userId,
      acao,
      entidade,
      entidadeId,
      detalhes: detalhes || null,
    });
  } catch (error) {
    console.error("[Audit] Failed to register audit log:", error);
  }
}

export async function listAuditLog(entidade?: string) {
  const db = await getDb();
  if (!db) return [];

  if (entidade) {
    return db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entidade, entidade))
      .orderBy(desc(auditLog.createdAt));
  }
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt));
}
