import 'dotenv/config';
import express from "express";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { server as serverConfig } from "./config/index";

const app = express();

(async () => {
  const httpServer = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  httpServer.listen(serverConfig.port, serverConfig.host, () => {
    log(`serving on port ${serverConfig.port}`);
  });
})();
