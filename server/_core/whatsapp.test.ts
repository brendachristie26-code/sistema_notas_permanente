import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  enviarWhatsApp,
  notificarPagamentoVencido,
  notificarOrcamentoAceito,
  notificarOrcamentoRejeitado,
  enviarLinkOrcamento,
} from "./whatsapp";

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("WhatsApp Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("deve retornar erro se EVOLUTION_API_URL não está configurado", async () => {
    const resultado = await enviarWhatsApp({
      numero: "5585987654321",
      mensagem: "Teste",
    });

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toContain("não configurado");
  });

  it("deve retornar erro se número é inválido", async () => {
    const resultado = await enviarWhatsApp({
      numero: "123",
      mensagem: "Teste",
    });

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toContain("inválido");
  });

  it("deve formatar mensagem com título corretamente", async () => {
    const resultado = await enviarWhatsApp({
      numero: "5585987654321",
      mensagem: "Conteúdo da mensagem",
      titulo: "Título",
    });

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toContain("não configurado");
  });

  it("deve validar número de telefone com menos de 10 dígitos", async () => {
    const resultado = await enviarWhatsApp({
      numero: "123456789",
      mensagem: "Teste",
    });

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toContain("inválido");
  });

  it("deve retornar erro para número vazio", async () => {
    const resultado = await enviarWhatsApp({
      numero: "",
      mensagem: "Teste",
    });

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toContain("inválido");
  });

  it("deve preparar notificação de pagamento vencido", async () => {
    const resultado = await notificarPagamentoVencido(
      "5585987654321",
      "João Silva",
      50000,
      new Date("2026-06-14")
    );

    expect(resultado.sucesso).toBe(false);
  });

  it("deve preparar notificação de orçamento aceito", async () => {
    const resultado = await notificarOrcamentoAceito(
      "5585987654321",
      "Maria Santos",
      "ORC-001",
      100000
    );

    expect(resultado.sucesso).toBe(false);
  });

  it("deve preparar notificação de orçamento rejeitado", async () => {
    const resultado = await notificarOrcamentoRejeitado(
      "5585987654321",
      "Pedro Costa",
      "ORC-002"
    );

    expect(resultado.sucesso).toBe(false);
  });

  it("deve preparar envio de link de orçamento", async () => {
    const resultado = await enviarLinkOrcamento(
      "5585987654321",
      "Ana Lima",
      "ORC-003",
      "https://exemplo.com/orcamentos/publico/abc123"
    );

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erro).toContain("não configurado");
  });
});
