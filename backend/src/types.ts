export type Direction = "left" | "center" | "right";

export const DIRECTIONS: readonly Direction[] = ["left", "center", "right"];

export type MatchPhase =
  | "waiting_opponent"
  | "starting"
  | "round_commit"
  | "round_reveal"
  | "finished"
  | "cancelled";

export type RoundOutcome = "goal" | "save";

export type ForfeitReason = "commit_timeout" | "reveal_timeout" | "invalid_reveal";

export interface PlayerState {
  wallet: string;
  goals: number;
  socketId?: string;
}

export interface PlayerCommit {
  wallet: string;
  commitment: string;
  direction?: Direction;
  salt?: string;
}

export interface RoundState {
  index: number;
  shooterWallet: string;
  keeperWallet: string;
  phase: "commit" | "reveal" | "resolved";
  commits: Record<string, PlayerCommit>;
  outcome?: RoundOutcome;
  commitDeadline: number;
  revealDeadline?: number;
}

export interface GameMatch {
  id: string;
  chainMatchId: number;
  betLamports: number;
  creator: PlayerState;
  opponent?: PlayerState;
  phase: MatchPhase;
  rounds: RoundState[];
  currentRoundIndex: number;
  suddenDeath: boolean;
  winner?: string;
  forfeitReason?: ForfeitReason;
  forfeitWinner?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LobbyEntry {
  id: string;
  chainMatchId: number;
  betLamports: number;
  creatorWallet: string;
  createdAt: number;
}

export interface QueueEntry {
  wallet: string;
  betLamports: number;
  socketId: string;
  queuedAt: number;
}

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
  forfeitReason?: ForfeitReason;
}

export interface PublicLobbyView {
  id: string;
  chainMatchId: number;
  betLamports: number;
  creatorWallet: string;
  createdAt: number;
}

export function toPublicMatch(match: GameMatch): PublicMatchView {
  const round = match.rounds[match.currentRoundIndex];
  const currentRound =
    round && match.phase !== "finished" && match.phase !== "cancelled"
      ? {
          index: round.index,
          shooterWallet: round.shooterWallet,
          keeperWallet: round.keeperWallet,
          phase: round.phase === "resolved" ? ("reveal" as const) : round.phase,
          commitDeadline: round.commitDeadline,
          revealDeadline: round.revealDeadline,
          commitsReceived: Object.keys(round.commits),
          revealsReceived: Object.entries(round.commits)
            .filter(([, c]) => c.direction !== undefined)
            .map(([wallet]) => wallet),
        }
      : undefined;

  return {
    id: match.id,
    chainMatchId: match.chainMatchId,
    betLamports: match.betLamports,
    phase: match.phase,
    creator: { wallet: match.creator.wallet, goals: match.creator.goals },
    opponent: match.opponent
      ? { wallet: match.opponent.wallet, goals: match.opponent.goals }
      : undefined,
    currentRound,
    suddenDeath: match.suddenDeath,
    winner: match.winner ?? match.forfeitWinner,
    forfeitReason: match.forfeitReason,
  };
}

export function toPublicLobby(lobby: LobbyEntry): PublicLobbyView {
  return {
    id: lobby.id,
    chainMatchId: lobby.chainMatchId,
    betLamports: lobby.betLamports,
    creatorWallet: lobby.creatorWallet,
    createdAt: lobby.createdAt,
  };
}
