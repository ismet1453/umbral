import { Router } from "express";
import type { GameManager, LobbyService } from "../game/GameManager";
import { toPublicLobby, toPublicMatch } from "../types";

export function createRoutes(
  gameManager: GameManager,
  lobbyService: LobbyService
): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      service: "egoshot-backend",
      status: "ok",
      endpoints: {
        health: "GET /health",
        lobbies: "GET /lobbies",
        match: "GET /matches/:id",
      },
      socket: "WebSocket via Socket.io on this host",
    });
  });

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "egoshot-backend" });
  });

  router.get("/lobbies", (_req, res) => {
    res.json(lobbyService.list().map(toPublicLobby));
  });

  router.get("/matches/:id", (req, res) => {
    const match = gameManager.getMatch(req.params.id);
    if (!match) {
      res.status(404).json({ error: "Match not found" });
      return;
    }
    res.json(toPublicMatch(match));
  });

  return router;
}
