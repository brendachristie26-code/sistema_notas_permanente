import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { converterOrcamentosAceitosHandler, arquivarOrcamentosRejeitadosHandler, lembreteOrcamentosVencidosHandler } from "../automation/orcamentos";
import { gerarPagamentoAutomaticoHandler, lembretesPagamentosVencidosHandler, atualizarStatusPagamentosHandler } from "../automation/pagamentos";
import { gerarRelatorioDiarioHandler, alertaPagamentosAcimaLimiteHandler, enviarRelatorioPorEmailHandler } from "../automation/relatorios";
import { webhookPixHandler, webhookTestHandler } from "../automation/webhooks";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Scheduled tasks / Automation handlers
  app.post("/api/scheduled/orcamentos-converter-aceitos", converterOrcamentosAceitosHandler);
  app.post("/api/scheduled/orcamentos-arquivar-rejeitados", arquivarOrcamentosRejeitadosHandler);
  app.post("/api/scheduled/orcamentos-lembrete-vencidos", lembreteOrcamentosVencidosHandler);
  app.post("/api/scheduled/pagamentos-gerar-automatico", gerarPagamentoAutomaticoHandler);
  app.post("/api/scheduled/pagamentos-lembrete-vencidos", lembretesPagamentosVencidosHandler);
  app.post("/api/scheduled/pagamentos-atualizar-status", atualizarStatusPagamentosHandler);
  app.post("/api/scheduled/relatorio-diario", gerarRelatorioDiarioHandler);
  app.post("/api/scheduled/alerta-pagamentos-limite", alertaPagamentosAcimaLimiteHandler);
  app.post("/api/scheduled/relatorio-email", enviarRelatorioPorEmailHandler);
  
  // Webhook handlers
  app.post("/api/webhook/pix", webhookPixHandler);
  app.post("/api/webhook/test", webhookTestHandler);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
