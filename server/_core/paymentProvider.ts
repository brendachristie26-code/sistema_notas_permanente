/**
 * Payment Provider - Integração com gateways de pagamento
 * Atualmente mockado para Pix. Futura integração com Mercado Pago, Stripe, etc.
 */

import { randomUUID } from "crypto";

export interface CobrancaPixResponse {
  txid: string;
  qrCode: string; // Base64 encoded QR code image
  copiaCola: string; // Pix copy-paste string
  expiresAt: Date;
}

/**
 * Gera uma cobrança Pix mockada
 * @param valor - Valor em centavos
 * @param descricao - Descrição da cobrança
 * @returns Objeto com TXID, QR Code e Copia e Cola
 */
export async function gerarCobrancaPix(
  valor: number,
  descricao: string
): Promise<CobrancaPixResponse> {
  // Mock: Gerar TXID único
  const txid = `${Date.now()}-${randomUUID().substring(0, 8)}`;

  // Mock: Gerar QR Code (base64 de uma imagem placeholder)
  // Em produção, seria gerado pelo gateway de pagamento
  const qrCodeMock = generateMockQRCode(valor, txid);

  // Mock: Gerar Copia e Cola
  // Formato real do Pix: 00020126580014br.gov.bcb.pix...
  const copiaCola = generateMockPixCopiaCola(valor, txid, descricao);

  // Expiração: 24 horas a partir de agora
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    txid,
    qrCode: qrCodeMock,
    copiaCola,
    expiresAt,
  };
}

/**
 * Gera um QR Code mockado em base64
 * Em produção, seria gerado pelo gateway de pagamento
 */
function generateMockQRCode(valor: number, txid: string): string {
  // Simular um QR Code com dados da cobrança
  const qrData = `PIX|${txid}|${valor}`;
  const base64 = Buffer.from(qrData).toString("base64");

  // Retornar como data URL (para exibição em img src)
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
}

/**
 * Gera um Pix Copia e Cola mockado
 * Formato real: 00020126580014br.gov.bcb.pix0136xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx52040000530398654061${valor}5802BR5913NOME EMPRESA6009SAO PAULO62410503***63041D3D
 */
function generateMockPixCopiaCola(
  valor: number,
  txid: string,
  descricao: string
): string {
  // Formato simplificado para mock
  // Em produção, seguir o padrão EMV QR Code para Pix
  const valorFormatado = (valor / 100).toFixed(2).replace(".", "");
  const timestamp = Date.now();

  // Simulação de um Pix Copia e Cola
  const copiaCola = `00020126580014br.gov.bcb.pix0136${txid}5204000053039865406${valorFormatado}5802BR5913EMPRESA TESTE6009SAO PAULO62410503${timestamp}63041D3D`;

  return copiaCola;
}

/**
 * Valida um webhook de confirmação de pagamento Pix
 * @param txid - TXID da transação
 * @param payload - Payload do webhook
 * @returns true se válido, false caso contrário
 */
export function validarWebhookPix(txid: string, payload: any): boolean {
  // Em produção, validar assinatura do webhook com chave privada do gateway
  if (!payload || !payload.txid) {
    return false;
  }

  return payload.txid === txid && payload.status === "CONCLUIDA";
}

/**
 * Simula a confirmação de um pagamento Pix
 * Útil para testes
 */
export function simularConfirmacaoPix(txid: string): {
  txid: string;
  status: "CONCLUIDA";
  timestamp: string;
} {
  return {
    txid,
    status: "CONCLUIDA",
    timestamp: new Date().toISOString(),
  };
}
