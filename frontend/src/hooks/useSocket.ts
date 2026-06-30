"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getBackendUrl } from "@/lib/config";
import type {
  CreateLobbyAck,
  JoinLobbyAck,
  MatchFinishedEvent,
  PublicLobbyView,
  PublicMatchView,
  QueueJoinAck,
  RoundResolvedEvent,
  SocketAck,
} from "@/lib/types";

function emitAck<T>(
  socket: Socket,
  event: string,
  payload: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response: SocketAck<T>) => {
      if (response && typeof response === "object" && "error" in response) {
        reject(new Error(response.error));
        return;
      }
      resolve(response as T);
    });
  });
}

export function useSocket(wallet: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lobbies, setLobbies] = useState<PublicLobbyView[]>([]);
  const [match, setMatch] = useState<PublicMatchView | null>(null);
  const [queued, setQueued] = useState(false);
  const [lastRound, setLastRound] = useState<RoundResolvedEvent | null>(null);
  const [finished, setFinished] = useState<MatchFinishedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(getBackendUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("lobby:list", (list: PublicLobbyView[]) => setLobbies(list));
    socket.on("match:update", (payload: PublicMatchView) => {
      setMatch(payload);
      setError(null);
    });
    socket.on("match:started", (payload: PublicMatchView) => {
      setMatch(payload);
      setQueued(false);
    });
    socket.on("round:resolved", (payload: RoundResolvedEvent) => {
      setLastRound(payload);
    });
    socket.on("match:finished", (payload: MatchFinishedEvent) => {
      setFinished(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const requireSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      throw new Error("Not connected to server");
    }
    return socket;
  }, []);

  const requireWallet = useCallback(() => {
    if (!wallet) throw new Error("Connect your wallet first");
    return wallet;
  }, [wallet]);

  const createLobby = useCallback(
    async (betLamports: number) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      const res = await emitAck<CreateLobbyAck>(socket, "lobby:create", {
        wallet: w,
        betLamports,
      });
      setMatch(res.match);
      return res.match;
    },
    [requireSocket, requireWallet]
  );

  const joinLobby = useCallback(
    async (matchId: string) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      const res = await emitAck<JoinLobbyAck>(socket, "lobby:join", {
        wallet: w,
        matchId,
      });
      setMatch(res.match);
      return res.match;
    },
    [requireSocket, requireWallet]
  );

  const cancelLobby = useCallback(
    async (matchId: string) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      await emitAck(socket, "lobby:cancel", { wallet: w, matchId });
      setMatch(null);
    },
    [requireSocket, requireWallet]
  );

  const addCpuOpponent = useCallback(
    async (matchId: string) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      const res = await emitAck<JoinLobbyAck>(socket, "lobby:vs_cpu", {
        wallet: w,
        matchId,
      });
      setMatch(res.match);
      return res.match;
    },
    [requireSocket, requireWallet]
  );

  const joinQueue = useCallback(
    async (betLamports: number, vsBot = true) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      const res = await emitAck<QueueJoinAck>(socket, "queue:join", {
        wallet: w,
        betLamports,
        vsBot,
      });
      if (res.queued) {
        setQueued(true);
      } else if (res.match) {
        setMatch(res.match);
        setQueued(false);
      }
      return res;
    },
    [requireSocket, requireWallet]
  );

  const leaveQueue = useCallback(async () => {
    setError(null);
    const socket = requireSocket();
    const w = requireWallet();
    await emitAck(socket, "queue:leave", { wallet: w });
    setQueued(false);
  }, [requireSocket, requireWallet]);

  const subscribeMatch = useCallback(
    async (matchId: string) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      const res = await emitAck<{ ok: true; match: PublicMatchView | null }>(
        socket,
        "match:subscribe",
        { wallet: w, matchId }
      );
      if (res.match) setMatch(res.match);
      return res.match;
    },
    [requireSocket, requireWallet]
  );

  const submitCommit = useCallback(
    async (matchId: string, commitment: string) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      const res = await emitAck<{ ok: true; match: PublicMatchView }>(
        socket,
        "game:commit",
        { wallet: w, matchId, commitment }
      );
      setMatch(res.match);
      return res.match;
    },
    [requireSocket, requireWallet]
  );

  const submitReveal = useCallback(
    async (matchId: string, direction: string, salt: string) => {
      setError(null);
      const socket = requireSocket();
      const w = requireWallet();
      const res = await emitAck<{ ok: true; match: PublicMatchView }>(
        socket,
        "game:reveal",
        { wallet: w, matchId, direction, salt }
      );
      setMatch(res.match);
      return res.match;
    },
    [requireSocket, requireWallet]
  );

  const resetFinished = useCallback(() => {
    setMatch(null);
    setFinished(null);
    setLastRound(null);
    setQueued(false);
  }, []);

  const runAction = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    []
  );

  return {
    connected,
    lobbies,
    match,
    queued,
    lastRound,
    finished,
    error,
    setError,
    createLobby,
    joinLobby,
    cancelLobby,
    addCpuOpponent,
    joinQueue,
    leaveQueue,
    subscribeMatch,
    submitCommit,
    submitReveal,
    resetFinished,
    runAction,
  };
}
