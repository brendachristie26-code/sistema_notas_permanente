import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { orcamentos, notasFiscais } from "../../drizzle/schema";
import { createNotaFiscal } from "../db";

/**
 * Handler para converter orçamentos aceitos em notas fiscais
 * Executado automaticamente quando um orçamento tem status "Aceito"
 */
export async function converterOrcamentosAceitosHandler(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Buscar orçamento pela task_uid
    const orcamento = (
      await db
        .select()
        .from(orcamentos)
        .where(eq(orcamentos.scheduleCronTaskUid, user.taskUid))
        .limit(1)
    )[0];

    if (!orcamento) {
      return res.json({ ok: true, skipped: "orphan" });
    }

    // Verificar se o orçamento está aceito
    if (orcamento.status !== "Aceito") {
      return res.json({ ok: true, skipped: "not-accepted" });
    }

    // Converter em nota fiscal
    const numeroNota = `NF-${Date.now()}-${orcamento.id}`;
    await createNotaFiscal({
      numero: numeroNota,
      agenteId: orcamento.agenteId,
      produtoId: orcamento.produtoId,
      quantidade: orcamento.quantidade,
      valorUnitario: orcamento.valorUnitario,
      valorTotal: orcamento.valorTotal,
      dataEmissao: new Date(),
      descricao: `Convertido de orçamento #${orcamento.numero}`,
      arquivoPdfUrl: orcamento.arquivoPdfUrl,
      arquivoPdfKey: orcamento.arquivoPdfKey,
    });

    // Atualizar status do orçamento para "Convertido"
    await db
      .update(orcamentos)
      .set({ status: "Aceito", updatedAt: new Date() })
      .where(eq(orcamentos.id, orcamento.id));

    return res.json({
      ok: true,
      message: "Orçamento convertido em nota fiscal com sucesso",
      numeroNota,
    });
  } catch (error) {
    console.error("[Automação] Erro ao converter orçamentos:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: (req as any).user?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler para arquivar orçamentos rejeitados
 * Executado automaticamente para limpar orçamentos rejeitados
 */
export async function arquivarOrcamentosRejeitadosHandler(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Buscar orçamento pela task_uid
    const orcamento = (
      await db
        .select()
        .from(orcamentos)
        .where(eq(orcamentos.scheduleCronTaskUid, user.taskUid))
        .limit(1)
    )[0];

    if (!orcamento) {
      return res.json({ ok: true, skipped: "orphan" });
    }

    // Verificar se o orçamento está rejeitado
    if (orcamento.status !== "Rejeitado") {
      return res.json({ ok: true, skipped: "not-rejected" });
    }

    // Marcar como arquivado (soft delete via status)
    await db
      .update(orcamentos)
      .set({ status: "Rejeitado", updatedAt: new Date() })
      .where(eq(orcamentos.id, orcamento.id));

    return res.json({
      ok: true,
      message: "Orçamento rejeitado arquivado com sucesso",
    });
  } catch (error) {
    console.error("[Automação] Erro ao arquivar orçamentos:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: (req as any).user?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler para enviar lembretes de orçamentos vencidos
 * Executado diariamente para notificar sobre orçamentos próximos do vencimento
 */
export async function lembreteOrcamentosVencidosHandler(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Buscar orçamentos vencidos (dataValidade < hoje)
    const hoje = new Date();
    const orcamentosVencidos = await db
      .select()
      .from(orcamentos)
      .where(eq(orcamentos.status, "Enviado" as any));

    const vencidos = orcamentosVencidos.filter(
      (o) => new Date(o.dataValidade) < hoje
    );

    // TODO: Enviar notificações por email
    console.log(`[Automação] ${vencidos.length} orçamentos vencidos encontrados`);

    return res.json({
      ok: true,
      message: `${vencidos.length} orçamentos vencidos processados`,
      count: vencidos.length,
    });
  } catch (error) {
    console.error("[Automação] Erro ao enviar lembretes:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
