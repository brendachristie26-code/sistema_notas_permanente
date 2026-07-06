/**
 * Webhook Handlers - Recebe confirmações de pagamento de gateways
 */

import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { pagamentos, notasFiscais } from "../../drizzle/schema";
import { validarWebhookPix } from "../_core/paymentProvider";
import { notificarPagamentoRecebido } from "../_core/whatsapp";

/**
 * Webhook para confirmação de pagamento Pix
 * Recebe TXID e status de confirmação
 * Atualiza status do pagamento para "Pago" e envia notificação
 *
 * POST /api/webhook/pix
 * Body: { txid: string, status: "CONCLUIDA", timestamp: string }
 */
export async function webhookPixHandler(req: Request, res: Response) {
  try {
    const { txid, status, timestamp } = req.body;

    // Validar webhook
    if (!validarWebhookPix(txid, req.body)) {
      console.warn("[Webhook] Webhook Pix inválido:", txid);
      return res.status(400).json({ error: "Invalid webhook" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Buscar pagamento pelo TXID
    const pagamento = (
      await db
        .select()
        .from(pagamentos)
        .where(eq(pagamentos.pixTxid, txid))
        .limit(1)
    )[0];

    if (!pagamento) {
      console.warn("[Webhook] Pagamento não encontrado para TXID:", txid);
      return res.status(404).json({ error: "Payment not found" });
    }

    // Se já está pago, não fazer nada
    if (pagamento.status === "Pago") {
      return res.json({
        ok: true,
        message: "Payment already processed",
        pagamentoId: pagamento.id,
      });
    }

    // Atualizar status para "Pago"
    const agora = new Date();
    await db
      .update(pagamentos)
      .set({
        status: "Pago" as any,
        dataPagamento: agora,
      })
      .where(eq(pagamentos.id, pagamento.id));

    console.log(
      `[Webhook] Pagamento ${pagamento.id} marcado como Pago via Pix`
    );

    // Buscar nota fiscal para enviar notificação
    const nota = (
      await db
        .select()
        .from(notasFiscais)
        .where(eq(notasFiscais.id, pagamento.notaFiscalId))
        .limit(1)
    )[0];

    if (nota) {
      try {
        // TODO: Integrar com dados reais do cliente
        // Buscar número de WhatsApp do cliente via agente ou configurações
        await notificarPagamentoRecebido(
          process.env.WHATSAPP_NUMERO_PADRAO || "5585987654321",
          nota.numero || "Cliente",
          nota.valorTotal || 0,
          agora,
          txid
        );
      } catch (err) {
        console.error("[Webhook] Erro ao enviar notificação WhatsApp:", err);
        // Não falhar a requisição se WhatsApp falhar
      }
    }

    return res.json({
      ok: true,
      message: "Payment confirmed successfully",
      pagamentoId: pagamento.id,
      dataPagamento: agora,
    });
  } catch (error) {
    console.error("[Webhook] Erro ao processar webhook Pix:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Webhook genérico para testar/simular confirmações
 * POST /api/webhook/test
 * Body: { txid: string }
 */
export async function webhookTestHandler(req: Request, res: Response) {
  try {
    const { txid } = req.body;

    if (!txid) {
      return res.status(400).json({ error: "TXID is required" });
    }

    // Simular confirmação de pagamento
    const mockPayload = {
      txid,
      status: "CONCLUIDA",
      timestamp: new Date().toISOString(),
    };

    // Chamar handler de webhook como se fosse uma requisição real
    req.body = mockPayload;
    return webhookPixHandler(req, res);
  } catch (error) {
    console.error("[Webhook] Erro ao processar teste:", error);
    return res.status(500).json({
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
}
