import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agentes, InsertAgente, produtos, InsertProduto, notasFiscais, InsertNotaFiscal, pagamentos, InsertPagamento } from "../drizzle/schema";
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
  if (!db) return undefined;
  const result = await db.select().from(agentes).where(eq(agentes.id, id)).limit(1);
  return result[0];
}

export async function createAgente(data: InsertAgente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentes).values(data);
  return result;
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
  if (!db) return undefined;
  const result = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return result[0];
}

export async function createProduto(data: InsertProduto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(produtos).values(data);
  return result;
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
  if (!db) return undefined;
  const result = await db.select().from(notasFiscais).where(eq(notasFiscais.id, id)).limit(1);
  return result[0];
}

export async function createNotaFiscal(data: InsertNotaFiscal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notasFiscais).values(data);
  return result;
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
  if (!db) return undefined;
  const result = await db.select().from(pagamentos).where(eq(pagamentos.id, id)).limit(1);
  return result[0];
}

export async function getPagamentoByNotaId(notaFiscalId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pagamentos).where(eq(pagamentos.notaFiscalId, notaFiscalId)).limit(1);
  return result[0];
}

export async function createPagamento(data: InsertPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pagamentos).values(data);
  return result;
}

export async function updatePagamento(id: number, data: Partial<InsertPagamento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(pagamentos).set(data).where(eq(pagamentos.id, id));
}

// ===== DASHBOARD =====
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalPendente: 0, totalPago: 0, contagemPendente: 0 };
  
  const pendentes = await db
    .select({ total: sql<number>`SUM(${notasFiscais.valorTotal})` })
    .from(notasFiscais)
    .innerJoin(pagamentos, eq(notasFiscais.id, pagamentos.notaFiscalId))
    .where(eq(pagamentos.status, "Pendente"));
  
  const pagos = await db
    .select({ total: sql<number>`SUM(${notasFiscais.valorTotal})` })
    .from(notasFiscais)
    .innerJoin(pagamentos, eq(notasFiscais.id, pagamentos.notaFiscalId))
    .where(eq(pagamentos.status, "Pago"));
  
  const contagemPendente = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(pagamentos)
    .where(eq(pagamentos.status, "Pendente"));
  
  return {
    totalPendente: pendentes[0]?.total || 0,
    totalPago: pagos[0]?.total || 0,
    contagemPendente: contagemPendente[0]?.count || 0,
  };
}
