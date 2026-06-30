import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { config } from "../config";
import { DEMO_BOT_WALLET } from "../bot/DemoBot";
import type { GameManager, LobbyService } from "../game/GameManager";
import type { MatchmakingQueue } from "../queue/MatchmakingQueue";
import { DIRECTIONS, toPublicLobby, toPublicMatch } from "../types";

let chainMatchIdCounter = Date.now();

function nextChainMatchId(): number {
  chainMatchIdCounter += 1;
  return chainMatchIdCounter;
}

function socketError(error: unknown): { error: string } {
  return {
    error: error instanceof Error ? error.message : "Unknown error",
  };
}

function validateBetLamports(betLamports: number): void {
  if (betLamports < config.minBetLamports) {
    throw new Error("Minimum bet is 0.1 SOL");
  }
}

export function attachSocketServer(
  httpServer: HttpServer,
  deps: {
    gameManager: GameManager;
    lobbyService: LobbyService;
    matchmakingQueue: MatchmakingQueue;
  }
): Server {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const { gameManager, lobbyService, matchmakingQueue } = deps;

  const broadcastLobbies = () => {
    io.emit("lobby:list", lobbyService.list().map(toPublicLobby));
  };

  const emitMatch = (socket: Socket | Server, matchId: string) => {
    const match = gameManager.getMatch(matchId);
    if (!match) return;
    const payload = toPublicMatch(match);
    if ("emit" in socket) {
      socket.to(`match:${matchId}`).emit("match:update", payload);
      socket.emit("match:update", payload);
    } else {
      io.to(`match:${matchId}`).emit("match:update", payload);
    }
  };

  gameManager.on("match_updated", (match) => {
    io.to(`match:${match.id}`).emit("match:update", toPublicMatch(match));
    if (match.phase !== "waiting_opponent") {
      lobbyService.remove(match.id);
      broadcastLobbies();
    }
  });

  gameManager.on("round_started", (match, round) => {
    io.to(`match:${match.id}`).emit("round:started", {
      matchId: match.id,
      round: {
        index: round.index,
        shooterWallet: round.shooterWallet,
        keeperWallet: round.keeperWallet,
        phase: round.phase,
        commitDeadline: round.commitDeadline,
      },
    });
  });

  gameManager.on("round_resolved", (match, round) => {
    io.to(`match:${match.id}`).emit("round:resolved", {
      matchId: match.id,
      round: {
        index: round.index,
        outcome: round.outcome,
        shooterWallet: round.shooterWallet,
        keeperWallet: round.keeperWallet,
      },
      score: {
        creator: match.creator.goals,
        opponent: match.opponent?.goals ?? 0,
      },
      suddenDeath: match.suddenDeath,
    });
  });

  gameManager.on("match_finished", (match) => {
    io.to(`match:${match.id}`).emit("match:finished", {
      matchId: match.id,
      winner: match.winner ?? match.forfeitWinner,
      forfeitReason: match.forfeitReason,
      score: {
        creator: match.creator.goals,
        opponent: match.opponent?.goals ?? 0,
      },
    });
  });

  io.on("connection", (socket) => {
    socket.emit("lobby:list", lobbyService.list().map(toPublicLobby));

    socket.on("lobby:create", (payload, ack) => {
      try {
        const { wallet, betLamports, chainMatchId } = payload as {
          wallet: string;
          betLamports: number;
          chainMatchId?: number;
        };

        if (!wallet || !betLamports) {
          ack?.(socketError(new Error("wallet and betLamports are required")));
          return;
        }

        validateBetLamports(betLamports);

        const match = gameManager.createLobbyMatch({
          chainMatchId: chainMatchId ?? nextChainMatchId(),
          betLamports,
          creatorWallet: wallet,
          socketId: socket.id,
        });

        lobbyService.registerOpenMatch(match);
        socket.join(`match:${match.id}`);
        broadcastLobbies();

        const response = toPublicMatch(match);
        ack?.({ ok: true, match: response });
        socket.emit("match:update", response);
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("lobby:join", (payload, ack) => {
      try {
        const { wallet, matchId } = payload as {
          wallet: string;
          matchId: string;
        };

        if (!wallet || !matchId) {
          ack?.(socketError(new Error("wallet and matchId are required")));
          return;
        }

        const match = gameManager.joinMatch(matchId, wallet, socket.id);
        lobbyService.remove(matchId);
        socket.join(`match:${matchId}`);
        broadcastLobbies();

        ack?.({ ok: true, match: toPublicMatch(match) });
        io.to(`match:${matchId}`).emit("match:started", toPublicMatch(match));
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("lobby:cancel", (payload, ack) => {
      try {
        const { wallet, matchId } = payload as {
          wallet: string;
          matchId: string;
        };

        const match = gameManager.cancelWaitingMatch(matchId, wallet);
        lobbyService.remove(matchId);
        broadcastLobbies();
        ack?.({ ok: true, match: toPublicMatch(match) });
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("queue:join", (payload, ack) => {
      try {
        const { wallet, betLamports, vsBot } = payload as {
          wallet: string;
          betLamports: number;
          vsBot?: boolean;
        };

        if (!wallet || !betLamports) {
          ack?.(socketError(new Error("wallet and betLamports are required")));
          return;
        }

        validateBetLamports(betLamports);

        if (vsBot && config.demoBotEnabled) {
          const chainMatchId = nextChainMatchId();
          const match = gameManager.createLobbyMatch({
            chainMatchId,
            betLamports,
            creatorWallet: wallet,
            socketId: socket.id,
          });

          gameManager.joinMatch(match.id, DEMO_BOT_WALLET);
          socket.join(`match:${match.id}`);

          const publicMatch = toPublicMatch(match);
          ack?.({ ok: true, queued: false, match: publicMatch, vsBot: true });
          io.to(`match:${match.id}`).emit("match:started", publicMatch);
          return;
        }

        const pair = matchmakingQueue.join({
          wallet,
          betLamports,
          socketId: socket.id,
          queuedAt: Date.now(),
        });

        if (!pair) {
          ack?.({ ok: true, queued: true, betLamports });
          return;
        }

        const [playerA, playerB] = pair.players;
        const chainMatchId = nextChainMatchId();

        const match = gameManager.createLobbyMatch({
          chainMatchId,
          betLamports: pair.betLamports,
          creatorWallet: playerA.wallet,
          socketId: playerA.socketId,
        });

        gameManager.joinMatch(match.id, playerB.wallet, playerB.socketId);

        const creatorSocket = io.sockets.sockets.get(playerA.socketId);
        const opponentSocket = io.sockets.sockets.get(playerB.socketId);
        creatorSocket?.join(`match:${match.id}`);
        opponentSocket?.join(`match:${match.id}`);

        const publicMatch = toPublicMatch(match);
        ack?.({ ok: true, queued: false, match: publicMatch });
        io.to(`match:${match.id}`).emit("match:started", publicMatch);
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("lobby:vs_cpu", (payload, ack) => {
      try {
        const { wallet, matchId } = payload as {
          wallet: string;
          matchId: string;
        };

        if (!config.demoBotEnabled) {
          ack?.(socketError(new Error("CPU opponent is disabled")));
          return;
        }

        const existing = gameManager.getMatch(matchId);
        if (!existing || existing.phase !== "waiting_opponent") {
          ack?.(socketError(new Error("Lobby is not waiting for an opponent")));
          return;
        }
        if (existing.creator.wallet !== wallet) {
          ack?.(socketError(new Error("Only the creator can add CPU opponent")));
          return;
        }

        const match = gameManager.joinMatch(matchId, DEMO_BOT_WALLET);
        lobbyService.remove(matchId);
        socket.join(`match:${matchId}`);
        broadcastLobbies();

        ack?.({ ok: true, match: toPublicMatch(match) });
        io.to(`match:${matchId}`).emit("match:started", toPublicMatch(match));
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("queue:leave", (payload, ack) => {
      try {
        const { wallet } = payload as { wallet: string };
        const removed = matchmakingQueue.leave(wallet);
        ack?.({ ok: true, removed });
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("match:subscribe", (payload, ack) => {
      try {
        const { wallet, matchId } = payload as {
          wallet: string;
          matchId: string;
        };

        gameManager.bindSocket(matchId, wallet, socket.id);
        socket.join(`match:${matchId}`);
        const match = gameManager.getMatch(matchId);
        ack?.({ ok: true, match: match ? toPublicMatch(match) : null });
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("game:commit", (payload, ack) => {
      try {
        const { wallet, matchId, commitment } = payload as {
          wallet: string;
          matchId: string;
          commitment: string;
        };

        if (!commitment) {
          ack?.(socketError(new Error("commitment is required")));
          return;
        }

        const match = gameManager.submitCommit(matchId, wallet, commitment);
        ack?.({ ok: true, match: toPublicMatch(match) });
        emitMatch(io, matchId);
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("game:reveal", (payload, ack) => {
      try {
        const { wallet, matchId, direction, salt } = payload as {
          wallet: string;
          matchId: string;
          direction: string;
          salt: string;
        };

        if (!DIRECTIONS.includes(direction as (typeof DIRECTIONS)[number])) {
          ack?.(socketError(new Error("Invalid direction")));
          return;
        }

        const match = gameManager.submitReveal(
          matchId,
          wallet,
          direction as (typeof DIRECTIONS)[number],
          salt
        );
        ack?.({ ok: true, match: toPublicMatch(match) });
        emitMatch(io, matchId);
      } catch (error) {
        ack?.(socketError(error));
      }
    });

    socket.on("disconnect", () => {
      for (const lobby of lobbyService.list()) {
        // Keep lobby entries; reconnect via match:subscribe in phase 4.
      }
    });
  });

  return io;
}
