import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { config } from "./config";
import { DemoBotController, DEMO_BOT_WALLET } from "./bot/DemoBot";
import { GameManager, LobbyService } from "./game/GameManager";
import { createRoutes } from "./http/routes";
import { MatchmakingQueue } from "./queue/MatchmakingQueue";
import { attachSocketServer } from "./socket";

export function createApp() {
  const gameManager = new GameManager({
    commitTimeoutMs: config.commitTimeoutMs,
    revealTimeoutMs: config.revealTimeoutMs,
    roundsPerPlayer: config.roundsPerPlayer,
  });
  const lobbyService = new LobbyService();
  const matchmakingQueue = new MatchmakingQueue();

  if (config.demoBotEnabled) {
    new DemoBotController(gameManager);
  }

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(createRoutes(gameManager, lobbyService));

  const httpServer = createServer(app);
  attachSocketServer(httpServer, {
    gameManager,
    lobbyService,
    matchmakingQueue,
  });

  return { app, httpServer, gameManager, lobbyService, matchmakingQueue };
}

export function startServer() {
  const { httpServer } = createApp();

  httpServer.listen(config.port, () => {
    console.log(`EgoShot backend listening on http://localhost:${config.port}`);
  });
}

if (require.main === module) {
  startServer();
}
