import { Request, Response } from "express";
import { eq, and, gte, lt } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { pagamentos, notasFiscais } from "../../drizzle/schema";

/**
 * Handler para gerar relatório consolidado diariamente
 * Executado todos os dias às 09:00 UTC
 */
export async function gerarRelatorioDiarioHandler(
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

    // Buscar estatísticas do dia
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Notas emitidas hoje
    const notasEmitidas = await db
      .select()
      .from(notasFiscais)
      .where(
        and(
          gte(notasFiscais.dataEmissao, hoje),
          lt(notasFiscais.dataEmissao, amanha)
        )
      );

    // Pagamentos realizados hoje
    const pagamentosRealizados = await db
      .select()
      .from(pagamentos)
      .where(
        and(
          eq(pagamentos.status, "Pago" as any),
          gte(pagamentos.dataPagamento, hoje),
          lt(pagamentos.dataPagamento, amanha)
        )
      );

    // Pagamentos vencidos hoje
    const pagamentosVencidos = await db
      .select()
      .from(pagamentos)
      .where(
        and(
          eq(pagamentos.status, "Pendente" as any),
          gte(pagamentos.dataVencimento, hoje),
          lt(pagamentos.dataVencimento, amanha)
        )
      );

    const relatorio = {
      data: hoje.toISOString().split("T")[0],
      notasEmitidas: notasEmitidas.length,
      valorNotasEmitidas: notasEmitidas.reduce(
        (sum, n) => sum + n.valorTotal,
        0
      ),
      pagamentosRealizados: pagamentosRealizados.length,
      valorPagamentosRealizados: pagamentosRealizados.reduce(
        (sum, p) => sum + (p.dataPagamento ? 1 : 0),
        0
      ),
      pagamentosVencidos: pagamentosVencidos.length,
      geradoEm: new Date().toISOString(),
    };

    // TODO: Salvar relatório no banco de dados ou enviar por email
    console.log("[Automação] Relatório diário gerado:", relatorio);

    return res.json({
      ok: true,
      message: "Relatório diário gerado com sucesso",
      relatorio,
    });
  } catch (error) {
    console.error("[Automação] Erro ao gerar relatório:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler para alertar pagamentos pendentes acima do limite
 * Executado diariamente para verificar se há pagamentos pendentes acima de um valor limite
 */
export async function alertaPagamentosAcimaLimiteHandler(
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

    // Limite padrão: R$ 10.000,00 (1.000.000 em centavos)
    const limiteAlerta = req.body.limite || 1000000;

    // Buscar pagamentos pendentes
    const pagamentosPendentes = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.status, "Pendente" as any));

    // Buscar notas associadas para obter valores
    const pagamentosComValor = [];
    for (const pag of pagamentosPendentes) {
      const nota = (
        await db
          .select()
          .from(notasFiscais)
          .where(eq(notasFiscais.id, pag.notaFiscalId))
          .limit(1)
      )[0];

      if (nota && nota.valorTotal > limiteAlerta) {
        pagamentosComValor.push({
          pagamentoId: pag.id,
          notaNumero: nota.numero,
          valor: nota.valorTotal,
          dataVencimento: pag.dataVencimento,
        });
      }
    }

    // TODO: Enviar alerta por email se houver pagamentos acima do limite
    if (pagamentosComValor.length > 0) {
      console.log(
        `[Automação] ALERTA: ${pagamentosComValor.length} pagamentos pendentes acima do limite`
      );
    }

    return res.json({
      ok: true,
      message: `Verificação de limites concluída`,
      alertas: pagamentosComValor.length,
      detalhes: pagamentosComValor,
    });
  } catch (error) {
    console.error("[Automação] Erro ao verificar alertas:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler para enviar relatório por email
 * Executado diariamente para enviar relatório consolidado
 */
export async function enviarRelatorioPorEmailHandler(
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

    // Buscar estatísticas gerais
    const todosOsPagamentos = await db.select().from(pagamentos);
    const todasAsNotas = await db.select().from(notasFiscais);

    const totalPago = todosOsPagamentos
      .filter((p) => p.status === "Pago")
      .reduce((sum, p) => sum + 1, 0);

    const totalPendente = todosOsPagamentos
      .filter((p) => p.status === "Pendente")
      .reduce((sum, p) => sum + 1, 0);

    const relatorioEmail = {
      assunto: `Relatório Financeiro - ${new Date().toLocaleDateString("pt-BR")}`,
      corpo: `
        Relatório Financeiro Consolidado
        Data: ${new Date().toLocaleDateString("pt-BR")}
        
        RESUMO:
        - Total de Notas Fiscais: ${todasAsNotas.length}
        - Pagamentos Realizados: ${totalPago}
        - Pagamentos Pendentes: ${totalPendente}
        - Taxa de Recebimento: ${totalPago + totalPendente > 0 ? Math.round((totalPago / (totalPago + totalPendente)) * 100) : 0}%
        
        Gerado automaticamente pelo sistema de gestão financeira.
      `,
    };

    // TODO: Integrar com serviço de email (SendGrid, AWS SES, etc)
    console.log("[Automação] Relatório por email preparado:", relatorioEmail);

    return res.json({
      ok: true,
      message: "Relatório por email preparado com sucesso",
      relatorio: relatorioEmail,
    });
  } catch (error) {
    console.error("[Automação] Erro ao enviar relatório por email:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
