import { describe, it, expect } from "vitest";
import {
  gerarCobrancaPix,
  validarWebhookPix,
  simularConfirmacaoPix,
} from "./paymentProvider";

describe("Payment Provider - Pix", () => {
  describe("gerarCobrancaPix", () => {
    it("deve gerar cobrança Pix com todos os campos", async () => {
      const valor = 10000; // 100 reais em centavos
      const descricao = "Pagamento Nota Fiscal #001";

      const cobranca = await gerarCobrancaPix(valor, descricao);

      expect(cobranca).toBeDefined();
      expect(cobranca.txid).toBeDefined();
      expect(cobranca.txid.length).toBeGreaterThan(0);
      expect(cobranca.qrCode).toBeDefined();
      expect(cobranca.copiaCola).toBeDefined();
      expect(cobranca.expiresAt).toBeInstanceOf(Date);
    });

    it("deve gerar TXID único para cada cobrança", async () => {
      const valor = 5000;
      const descricao = "Teste";

      const cobranca1 = await gerarCobrancaPix(valor, descricao);
      const cobranca2 = await gerarCobrancaPix(valor, descricao);

      expect(cobranca1.txid).not.toBe(cobranca2.txid);
    });

    it("deve incluir valor na cobrança", async () => {
      const valor = 25000; // 250 reais
      const descricao = "Pagamento";

      const cobranca = await gerarCobrancaPix(valor, descricao);

      // Verificar que o valor está no Copia e Cola
      expect(cobranca.copiaCola).toContain("250");
    });

    it("deve ter QR Code em formato base64", async () => {
      const cobranca = await gerarCobrancaPix(10000, "Teste");

      expect(cobranca.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it("deve ter expiração em 24 horas", async () => {
      const antes = new Date();
      const cobranca = await gerarCobrancaPix(10000, "Teste");
      const depois = new Date();

      const expectedMin = new Date(antes.getTime() + 23 * 60 * 60 * 1000);
      const expectedMax = new Date(depois.getTime() + 25 * 60 * 60 * 1000);

      expect(cobranca.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMin.getTime()
      );
      expect(cobranca.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMax.getTime()
      );
    });
  });

  describe("validarWebhookPix", () => {
    it("deve validar webhook com payload correto", () => {
      const txid = "12345-abcde";
      const payload = {
        txid: "12345-abcde",
        status: "CONCLUIDA",
      };

      const resultado = validarWebhookPix(txid, payload);

      expect(resultado).toBe(true);
    });

    it("deve rejeitar webhook com TXID diferente", () => {
      const txid = "12345-abcde";
      const payload = {
        txid: "99999-zzzzz",
        status: "CONCLUIDA",
      };

      const resultado = validarWebhookPix(txid, payload);

      expect(resultado).toBe(false);
    });

    it("deve rejeitar webhook com status diferente de CONCLUIDA", () => {
      const txid = "12345-abcde";
      const payload = {
        txid: "12345-abcde",
        status: "PENDENTE",
      };

      const resultado = validarWebhookPix(txid, payload);

      expect(resultado).toBe(false);
    });

    it("deve rejeitar webhook sem payload", () => {
      const txid = "12345-abcde";

      const resultado = validarWebhookPix(txid, null);

      expect(resultado).toBe(false);
    });

    it("deve rejeitar webhook sem txid no payload", () => {
      const txid = "12345-abcde";
      const payload = {
        status: "CONCLUIDA",
      };

      const resultado = validarWebhookPix(txid, payload);

      expect(resultado).toBe(false);
    });
  });

  describe("simularConfirmacaoPix", () => {
    it("deve simular confirmação com TXID correto", () => {
      const txid = "12345-abcde";

      const confirmacao = simularConfirmacaoPix(txid);

      expect(confirmacao.txid).toBe(txid);
      expect(confirmacao.status).toBe("CONCLUIDA");
      expect(confirmacao.timestamp).toBeDefined();
    });

    it("deve retornar timestamp válido", () => {
      const confirmacao = simularConfirmacaoPix("test-txid");

      const timestamp = new Date(confirmacao.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());
      expect(timestamp.getTime()).toBeGreaterThan(
        new Date().getTime() - 1000
      );
    });
  });
});
