import { Request, Response } from "express";
import { eq, and, lt, gte, lte } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { pagamentos, notasFiscais } from "../../drizzle/schema";
import { createPagamento, updatePagamento } from "../db";
import { notificarPagamentoVencido } from "../\_core/whatsapp";
import { gerarCobrancaPix } from "../\_core/paymentProvider";

/**
 * Handler para gerar pagamentos automaticamente ao criar nota fiscal
 * Executado quando uma nova nota fiscal é criada
 */
export async function gerarPagamentoAutomaticoHandler(
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

    // Buscar nota fiscal pela task_uid
    const nota = (
      await db
        .select()
        .from(notasFiscais)
        .where(eq(notasFiscais.id, parseInt(req.body.notaFiscalId || "0")))
        .limit(1)
    )[0];

    if (!nota) {
      return res.json({ ok: true, skipped: "nota-not-found" });
    }

    // Verificar se já existe pagamento para esta nota
    const pagamentoExistente = (
      await db
        .select()
        .from(pagamentos)
        .where(eq(pagamentos.notaFiscalId, nota.id))
        .limit(1)
    )[0];

    if (pagamentoExistente) {
      return res.json({ ok: true, skipped: "pagamento-exists" });
    }

    // Criar pagamento com data de vencimento 30 dias após emissão
    const dataVencimento = new Date(nota.dataEmissao);
    dataVencimento.setDate(dataVencimento.getDate() + 30);

    await createPagamento({
      notaFiscalId: nota.id,
      status: "Pendente" as any,
      dataVencimento,
      observacoes: `Gerado automaticamente para nota #${nota.numero}`,
    });

    return res.json({
      ok: true,
      message: "Pagamento gerado automaticamente com sucesso",
      dataVencimento,
    });
  } catch (error) {
    console.error("[Automação] Erro ao gerar pagamento:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, taskUid: (req as any).user?.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler para enviar lembretes de pagamentos vencidos com Pix
 * Executado diariamente para notificar sobre pagamentos próximos do vencimento
 * Se o pagamento não tiver Pix gerado, gera automaticamente
 */
export async function lembretesPagamentosVencidosHandler(
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

    // Buscar pagamentos vencidos (dataVencimento < hoje e status = Pendente)
    const hoje = new Date();
    const pagamentosVencidos = await db
      .select()
      .from(pagamentos)
      .where(
        and(
          eq(pagamentos.status, "Pendente" as any),
          lt(pagamentos.dataVencimento, hoje)
        )
      );

    // Enviar notificações por WhatsApp com Pix
    let notificadasComSucesso = 0;
    let pixGerados = 0;
    
    for (const pag of pagamentosVencidos) {
      const nota = (await db.select().from(notasFiscais).where(eq(notasFiscais.id, pag.notaFiscalId)).limit(1))[0];
      if (nota) {
        // Se não tiver Pix gerado, gerar agora
        let pixCopiaCola = pag.pixCopiaCola;
        let pixTxid = pag.pixTxid;
        
        if (!pixCopiaCola || !pixTxid) {
          try {
            const cobranca = await gerarCobrancaPix(
              nota.valorTotal || 0,
              `Pagamento Nota Fiscal #${nota.numero}`
            );
            
            // Atualizar pagamento com dados do Pix
            await db
              .update(pagamentos)
              .set({
                pixTxid: cobranca.txid,
                pixQrCode: cobranca.qrCode,
                pixCopiaCola: cobranca.copiaCola,
              })
              .where(eq(pagamentos.id, pag.id));
            
            pixCopiaCola = cobranca.copiaCola;
            pixTxid = cobranca.txid;
            pixGerados++;
          } catch (err) {
            console.error(`[Automação] Erro ao gerar Pix para pagamento ${pag.id}:`, err);
          }
        }
        
        // TODO: Integrar com dados reais do cliente (agora usando placeholder)
        // Buscar número de WhatsApp do cliente via agente ou configurações
        const resultado = await notificarPagamentoVencido(
          process.env.WHATSAPP_NUMERO_PADRAO || "5585987654321",
          nota.numero || "Cliente",
          nota.valorTotal || 0,
          new Date(pag.dataVencimento),
          pixCopiaCola || undefined // Passar Pix Copia e Cola
        );
        if (resultado.sucesso) {
          notificadasComSucesso++;
        }
      }
    }
    console.log(
      `[Automação] ${pagamentosVencidos.length} pagamentos vencidos, ${notificadasComSucesso} notificadas, ${pixGerados} Pix gerados`
    );

    return res.json({
      ok: true,
      message: `${pagamentosVencidos.length} pagamentos vencidos processados`,
      count: pagamentosVencidos.length,
      pixGerados,
    });
  } catch (error) {
    console.error("[Automação] Erro ao enviar lembretes de pagamentos:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler para atualizar status de pagamento automaticamente por data
 * Executado diariamente para marcar pagamentos como vencidos se necessário
 */
export async function atualizarStatusPagamentosHandler(
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

    // Buscar todos os pagamentos pendentes
    const pagamentosPendentes = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.status, "Pendente" as any));

    const hoje = new Date();
    let atualizados = 0;

    // Atualizar status para "Vencido" se necessário (apenas log por enquanto)
    for (const pag of pagamentosPendentes) {
      if (new Date(pag.dataVencimento) < hoje) {
        console.log(
          `[Automação] Pagamento ${pag.id} vencido desde ${pag.dataVencimento}`
        );
        atualizados++;
      }
    }

    return res.json({
      ok: true,
      message: `${atualizados} pagamentos verificados`,
      count: atualizados,
    });
  } catch (error) {
    console.error("[Automação] Erro ao atualizar status de pagamentos:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
