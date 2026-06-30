export type Direction = "left" | "center" | "right";

export const DIRECTIONS: readonly Direction[] = ["left", "center", "right"];

export type MatchPhase =
  | "waiting_opponent"
  | "starting"
  | "round_commit"
  | "round_reveal"
  | "finished"
  | "cancelled";

export interface PublicMatchView {
  id: string;
  chainMatchId: number;
  betLamports: number;
  phase: MatchPhase;
  creator: { wallet: string; goals: number };
  opponent?: { wallet: string; goals: number };
  currentRound?: {
    index: number;
    shooterWallet: string;
    keeperWallet: string;
    phase: "commit" | "reveal";
    commitDeadline: number;
    revealDeadline?: number;
    commitsReceived: string[];
    revealsReceived: string[];
  };
  suddenDeath: boolean;
  winner?: string;
  forfeitReason?: string;
}

export interface PublicLobbyView {
  id: string;
  chainMatchId: number;
  betLamports: number;
  creatorWallet: string;
  createdAt: number;
}

export interface RoundResolvedEvent {
  matchId: string;
  round: {
    index: number;
    outcome: "goal" | "save";
    shooterWallet: string;
    keeperWallet: string;
  };
  score: { creator: number; opponent: number };
  suddenDeath: boolean;
}

export interface MatchFinishedEvent {
  matchId: string;
  winner: string;
  forfeitReason?: string;
  score: { creator: number; opponent: number };
}

export type SocketAck<T> = T | { error: string };

export interface CreateLobbyAck {
  ok: true;
  match: PublicMatchView;
}

export interface JoinLobbyAck {
  ok: true;
  match: PublicMatchView;
}

export interface QueueJoinAck {
  ok: true;
  queued: boolean;
  betLamports?: number;
  match?: PublicMatchView;
}
