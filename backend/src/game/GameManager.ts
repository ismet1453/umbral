import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { verifyCommitment } from "../crypto/commitReveal";
import type {
  Direction,
  ForfeitReason,
  GameMatch,
  LobbyEntry,
} from "../types";
import {
  addGoal,
  buildRoundSchedule,
  createRound,
  createSuddenDeathRound,
  determineRegulationWinner,
  determineSuddenDeathWinner,
  needsSuddenDeath,
  regulationComplete,
  resolveShot,
} from "./penaltyRules";

export interface GameManagerOptions {
  commitTimeoutMs: number;
  revealTimeoutMs: number;
  roundsPerPlayer: number;
}

export type GameManagerEvents = {
  match_updated: [GameMatch];
  round_started: [GameMatch, GameMatch["rounds"][number]];
  round_resolved: [GameMatch, GameMatch["rounds"][number]];
  match_finished: [GameMatch];
};

export class GameManager extends EventEmitter {
  private readonly matches = new Map<string, GameMatch>();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly options: GameManagerOptions) {
    super();
  }

  createLobbyMatch(params: {
    chainMatchId: number;
    betLamports: number;
    creatorWallet: string;
    socketId?: string;
  }): GameMatch {
    const now = Date.now();
    const match: GameMatch = {
      id: randomUUID(),
      chainMatchId: params.chainMatchId,
      betLamports: params.betLamports,
      creator: {
        wallet: params.creatorWallet,
        goals: 0,
        socketId: params.socketId,
      },
      phase: "waiting_opponent",
      rounds: [],
      currentRoundIndex: 0,
      suddenDeath: false,
      createdAt: now,
      updatedAt: now,
    };

    this.matches.set(match.id, match);
    this.emitUpdate(match);
    return match;
  }

  joinMatch(
    matchId: string,
    opponentWallet: string,
    socketId?: string
  ): GameMatch {
    const match = this.requireMatch(matchId);

    if (match.phase !== "waiting_opponent") {
      throw new Error("Match is not open for joining");
    }
    if (match.creator.wallet === opponentWallet) {
      throw new Error("Creator cannot join their own match");
    }
    if (match.opponent) {
      throw new Error("Match already has an opponent");
    }

    match.opponent = { wallet: opponentWallet, goals: 0, socketId };
    match.phase = "starting";
    match.updatedAt = Date.now();

    this.emitUpdate(match);
    this.startGame(match.id);
    return match;
  }

  getMatch(matchId: string): GameMatch | undefined {
    return this.matches.get(matchId);
  }

  bindSocket(matchId: string, wallet: string, socketId: string): GameMatch {
    const match = this.requireMatch(matchId);
    if (match.creator.wallet === wallet) {
      match.creator.socketId = socketId;
    } else if (match.opponent?.wallet === wallet) {
      match.opponent.socketId = socketId;
    } else {
      throw new Error("Wallet is not part of this match");
    }
    match.updatedAt = Date.now();
    return match;
  }

  submitCommit(
    matchId: string,
    wallet: string,
    commitment: string
  ): GameMatch {
    const match = this.requireMatch(matchId);
    const round = this.requireActiveRound(match);

    if (round.phase !== "commit") {
      throw new Error("Round is not accepting commits");
    }
    if (Date.now() > round.commitDeadline) {
      throw new Error("Commit deadline has passed");
    }
    if (!this.isParticipant(match, wallet)) {
      throw new Error("Wallet is not part of this match");
    }
    if (round.commits[wallet]) {
      throw new Error("Commit already submitted");
    }

    round.commits[wallet] = { wallet, commitment };
    match.updatedAt = Date.now();
    this.emitUpdate(match);

    if (this.bothPlayersCommitted(round, match)) {
      this.beginRevealPhase(match);
    }

    return match;
  }

  submitReveal(
    matchId: string,
    wallet: string,
    direction: Direction,
    salt: string
  ): GameMatch {
    const match = this.requireMatch(matchId);
    const round = this.requireActiveRound(match);

    if (round.phase !== "reveal") {
      throw new Error("Round is not accepting reveals");
    }
    if (round.revealDeadline && Date.now() > round.revealDeadline) {
      throw new Error("Reveal deadline has passed");
    }

    const commit = round.commits[wallet];
    if (!commit) {
      throw new Error("No commit found for wallet");
    }
    if (commit.direction) {
      throw new Error("Already revealed");
    }
    if (!verifyCommitment(commit.commitment, direction, salt)) {
      throw new Error("Reveal does not match commitment");
    }

    commit.direction = direction;
    commit.salt = salt;
    match.updatedAt = Date.now();
    this.emitUpdate(match);

    if (this.bothPlayersRevealed(round, match)) {
      this.resolveRound(match);
    }

    return match;
  }

  cancelWaitingMatch(matchId: string, wallet: string): GameMatch {
    const match = this.requireMatch(matchId);
    if (match.phase !== "waiting_opponent") {
      throw new Error("Only waiting matches can be cancelled");
    }
    if (match.creator.wallet !== wallet) {
      throw new Error("Only creator can cancel");
    }

    match.phase = "cancelled";
    match.updatedAt = Date.now();
    this.clearTimer(matchId);
    this.emitUpdate(match);
    return match;
  }

  private startGame(matchId: string): void {
    const match = this.requireMatch(matchId);
    if (!match.opponent) return;

    match.phase = "round_commit";
    match.suddenDeath = false;
    match.rounds = buildRoundSchedule(
      match.creator.wallet,
      match.opponent.wallet,
      this.options.roundsPerPlayer
    ).map((entry) =>
      createRound(
        entry.index,
        entry.shooterWallet,
        entry.keeperWallet,
        Date.now() + this.options.commitTimeoutMs
      )
    );
    match.currentRoundIndex = 0;
    match.updatedAt = Date.now();

    const round = this.requireActiveRound(match);
    this.scheduleCommitTimeout(matchId);
    this.emit("round_started", match, round);
    this.emitUpdate(match);
  }

  private beginRevealPhase(match: GameMatch): void {
    const round = this.requireActiveRound(match);
    round.phase = "reveal";
    round.revealDeadline = Date.now() + this.options.revealTimeoutMs;
    match.phase = "round_reveal";
    match.updatedAt = Date.now();

    this.clearTimer(match.id);
    this.scheduleRevealTimeout(match.id);
    this.emitUpdate(match);
  }

  private resolveRound(match: GameMatch): void {
    const round = this.requireActiveRound(match);
    const shooterCommit = round.commits[round.shooterWallet];
    const keeperCommit = round.commits[round.keeperWallet];

    if (!shooterCommit?.direction || !keeperCommit?.direction) {
      throw new Error("Both players must reveal before resolving");
    }

    round.outcome = resolveShot(shooterCommit.direction, keeperCommit.direction);
    round.phase = "resolved";

    if (round.outcome === "goal") {
      addGoal(match, round.shooterWallet);
    }

    match.updatedAt = Date.now();
    this.clearTimer(match.id);
    this.emit("round_resolved", match, round);
    this.emitUpdate(match);
    this.advanceAfterRound(match);
  }

  private advanceAfterRound(match: GameMatch): void {
    if (match.suddenDeath) {
      const winner = determineSuddenDeathWinner(match);
      if (winner) {
        this.finishMatch(match, winner);
        return;
      }

      this.startSuddenDeathRound(match);
      return;
    }

    if (!regulationComplete(match, this.options.roundsPerPlayer)) {
      this.startNextRegulationRound(match);
      return;
    }

    if (needsSuddenDeath(match, this.options.roundsPerPlayer)) {
      match.suddenDeath = true;
      this.startSuddenDeathRound(match);
      return;
    }

    const winner = determineRegulationWinner(match);
    if (winner) {
      this.finishMatch(match, winner);
    }
  }

  private startNextRegulationRound(match: GameMatch): void {
    match.currentRoundIndex += 1;
    match.phase = "round_commit";
    const round = this.requireActiveRound(match);
    round.commitDeadline = Date.now() + this.options.commitTimeoutMs;
    match.updatedAt = Date.now();

    this.scheduleCommitTimeout(match.id);
    this.emit("round_started", match, round);
    this.emitUpdate(match);
  }

  private startSuddenDeathRound(match: GameMatch): void {
    const round = createSuddenDeathRound(
      match,
      Date.now() + this.options.commitTimeoutMs
    );
    match.rounds.push(round);
    match.currentRoundIndex = match.rounds.length - 1;
    match.phase = "round_commit";
    match.updatedAt = Date.now();

    this.scheduleCommitTimeout(match.id);
    this.emit("round_started", match, round);
    this.emitUpdate(match);
  }

  private finishMatch(match: GameMatch, winner: string): void {
    match.phase = "finished";
    match.winner = winner;
    match.updatedAt = Date.now();
    this.clearTimer(match.id);
    this.emit("match_finished", match);
    this.emitUpdate(match);
  }

  private forfeitMatch(
    match: GameMatch,
    winner: string,
    reason: ForfeitReason
  ): void {
    match.phase = "finished";
    match.forfeitWinner = winner;
    match.forfeitReason = reason;
    match.updatedAt = Date.now();
    this.clearTimer(match.id);
    this.emit("match_finished", match);
    this.emitUpdate(match);
  }

  private scheduleCommitTimeout(matchId: string): void {
    this.clearTimer(matchId);
    const timer = setTimeout(() => {
      this.handleCommitTimeout(matchId);
    }, this.options.commitTimeoutMs);
    this.timers.set(matchId, timer);
  }

  private scheduleRevealTimeout(matchId: string): void {
    this.clearTimer(matchId);
    const timer = setTimeout(() => {
      this.handleRevealTimeout(matchId);
    }, this.options.revealTimeoutMs);
    this.timers.set(matchId, timer);
  }

  private handleCommitTimeout(matchId: string): void {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== "round_commit") return;

    const round = this.requireActiveRound(match);
    const missing = this.participants(match).filter((w) => !round.commits[w]);
    if (missing.length === 0) return;

    const winner = this.participants(match).find((w) => !missing.includes(w));
    if (!winner) return;

    this.forfeitMatch(match, winner, "commit_timeout");
  }

  private handleRevealTimeout(matchId: string): void {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== "round_reveal") return;

    const round = this.requireActiveRound(match);
    const missing = this.participants(match).filter(
      (w) => !round.commits[w]?.direction
    );
    if (missing.length === 0) return;

    const winner = this.participants(match).find((w) => !missing.includes(w));
    if (!winner) return;

    this.forfeitMatch(match, winner, "reveal_timeout");
  }

  private bothPlayersCommitted(round: GameMatch["rounds"][number], match: GameMatch): boolean {
    return this.participants(match).every((wallet) => Boolean(round.commits[wallet]));
  }

  private bothPlayersRevealed(round: GameMatch["rounds"][number], match: GameMatch): boolean {
    return this.participants(match).every(
      (wallet) => Boolean(round.commits[wallet]?.direction)
    );
  }

  private participants(match: GameMatch): string[] {
    if (!match.opponent) return [match.creator.wallet];
    return [match.creator.wallet, match.opponent.wallet];
  }

  private isParticipant(match: GameMatch, wallet: string): boolean {
    return this.participants(match).includes(wallet);
  }

  private requireMatch(matchId: string): GameMatch {
    const match = this.matches.get(matchId);
    if (!match) throw new Error("Match not found");
    return match;
  }

  private requireActiveRound(match: GameMatch): GameMatch["rounds"][number] {
    const round = match.rounds[match.currentRoundIndex];
    if (!round) throw new Error("No active round");
    return round;
  }

  private clearTimer(matchId: string): void {
    const timer = this.timers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(matchId);
    }
  }

  private emitUpdate(match: GameMatch): void {
    this.emit("match_updated", match);
  }
}

export class LobbyService {
  private readonly lobbies = new Map<string, LobbyEntry>();

  registerOpenMatch(match: GameMatch): LobbyEntry {
    const lobby: LobbyEntry = {
      id: match.id,
      chainMatchId: match.chainMatchId,
      betLamports: match.betLamports,
      creatorWallet: match.creator.wallet,
      createdAt: match.createdAt,
    };
    this.lobbies.set(lobby.id, lobby);
    return lobby;
  }

  remove(matchId: string): void {
    this.lobbies.delete(matchId);
  }

  list(): LobbyEntry[] {
    return [...this.lobbies.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  get(matchId: string): LobbyEntry | undefined {
    return this.lobbies.get(matchId);
  }
}
