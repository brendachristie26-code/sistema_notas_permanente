/**
 * WhatsApp Helper - Evolution API Integration
 * Envia mensagens via WhatsApp usando Evolution API
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "default";

export interface EnviarWhatsAppParams {
  numero: string; // Número com DDD (ex: 5585987654321)
  mensagem: string;
  titulo?: string;
}

export interface EnviarWhatsAppResponse {
  sucesso: boolean;
  messageId?: string;
  erro?: string;
}

/**
 * Envia mensagem via WhatsApp usando Evolution API
 */
export async function enviarWhatsApp(
  params: EnviarWhatsAppParams
): Promise<EnviarWhatsAppResponse> {
  try {
    // Validar número primeiro (antes de verificar configuração)
    if (!params.numero || params.numero.length < 10) {
      return {
        sucesso: false,
        erro: "Número de WhatsApp inválido",
      };
    }

    // Validar variáveis de ambiente
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.warn(
        "WhatsApp não configurado: EVOLUTION_API_URL ou EVOLUTION_API_KEY não definidos"
      );
      return {
        sucesso: false,
        erro: "WhatsApp não configurado",
      };
    }

    // Preparar mensagem
    const mensagem = params.titulo
      ? `*${params.titulo}*\n\n${params.mensagem}`
      : params.mensagem;

    // Enviar via Evolution API
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: params.numero,
          text: mensagem,
        }),
      }
    );

    if (!response.ok) {
      const erro = await response.text();
      console.error("Erro ao enviar WhatsApp:", erro);
      return {
        sucesso: false,
        erro: `Erro na API: ${response.status}`,
      };
    }

    const data = await response.json() as any;

    return {
      sucesso: true,
      messageId: data.key?.id || data.messageId,
    };
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia notificação de pagamento vencido via WhatsApp
 */
export async function notificarPagamentoVencido(
  numero: string,
  nomeCliente: string,
  valor: number,
  dataVencimento: Date
): Promise<EnviarWhatsAppResponse> {
  const dataFormatada = dataVencimento.toLocaleDateString("pt-BR");
  const valorFormatado = (valor / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return enviarWhatsApp({
    numero,
    titulo: "⚠️ Pagamento Vencido",
    mensagem: `Olá ${nomeCliente},\n\nSeu pagamento de ${valorFormatado} venceu em ${dataFormatada}.\n\nPor favor, regularize sua situação.\n\nObrigado!`,
  });
}

/**
 * Envia notificação de orçamento aceito via WhatsApp
 */
export async function notificarOrcamentoAceito(
  numero: string,
  nomeCliente: string,
  numeroOrcamento: string,
  valor: number
): Promise<EnviarWhatsAppResponse> {
  const valorFormatado = (valor / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return enviarWhatsApp({
    numero,
    titulo: "✅ Orçamento Aceito",
    mensagem: `Olá ${nomeCliente},\n\nSeu orçamento #${numeroOrcamento} no valor de ${valorFormatado} foi aceito!\n\nProximas etapas serão comunicadas em breve.\n\nObrigado!`,
  });
}

/**
 * Envia notificação de orçamento rejeitado via WhatsApp
 */
export async function notificarOrcamentoRejeitado(
  numero: string,
  nomeCliente: string,
  numeroOrcamento: string
): Promise<EnviarWhatsAppResponse> {
  return enviarWhatsApp({
    numero,
    titulo: "❌ Orçamento Rejeitado",
    mensagem: `Olá ${nomeCliente},\n\nSeu orçamento #${numeroOrcamento} foi rejeitado.\n\nFicamos à disposição para discutir outras opções.\n\nObrigado!`,
  });
}

/**
 * Envia link de orçamento público via WhatsApp
 */
export async function enviarLinkOrcamento(
  numero: string,
  nomeCliente: string,
  numeroOrcamento: string,
  linkPublico: string
): Promise<EnviarWhatsAppResponse> {
  return enviarWhatsApp({
    numero,
    titulo: "📋 Novo Orçamento",
    mensagem: `Olá ${nomeCliente},\n\nTemos um novo orçamento para você!\n\n*Orçamento #${numeroOrcamento}*\n\nClique no link abaixo para visualizar e responder:\n${linkPublico}\n\nObrigado!`,
  });
}
