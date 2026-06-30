import { randomBytes } from "node:crypto";
import { hashCommitment } from "../crypto/commitReveal";
import type { GameManager } from "../game/GameManager";
import type { Direction, GameMatch } from "../types";
import { DIRECTIONS } from "../types";

export const DEMO_BOT_WALLET =
  "EgoShotCPUBot111111111111111111111111111111";

export function isDemoBot(wallet: string): boolean {
  return wallet === DEMO_BOT_WALLET;
}

export class DemoBotController {
  private readonly pending = new Map<
    string,
    { direction: Direction; salt: string }
  >();
  private readonly timers = new Set<NodeJS.Timeout>();

  constructor(private readonly gameManager: GameManager) {
    gameManager.on("match_updated", (match) => {
      void this.handleMatchUpdated(match);
    });
    gameManager.on("round_started", (match) => {
      this.scheduleBotTurn(match.id, 600);
    });
  }

  private scheduleBotTurn(matchId: string, delayMs: number): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      void this.handleMatchUpdated(this.gameManager.getMatch(matchId));
    }, delayMs);
    this.timers.add(timer);
  }

  private async handleMatchUpdated(
    match: GameMatch | undefined
  ): Promise<void> {
    if (!match?.opponent) return;

    const botWallet = isDemoBot(match.creator.wallet)
      ? match.creator.wallet
      : isDemoBot(match.opponent.wallet)
        ? match.opponent.wallet
        : null;

    if (!botWallet) return;
    if (match.phase !== "round_commit" && match.phase !== "round_reveal") {
      return;
    }

    const round = match.rounds[match.currentRoundIndex];
    if (!round) return;

    try {
      if (round.phase === "commit" && !round.commits[botWallet]) {
        const direction =
          DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]!;
        const salt = randomBytes(16).toString("hex");
        const key = `${match.id}:${round.index}`;

        this.pending.set(key, { direction, salt });
        this.gameManager.submitCommit(
          match.id,
          botWallet,
          hashCommitment(direction, salt)
        );
        return;
      }

      if (
        round.phase === "reveal" &&
        round.commits[botWallet] &&
        !round.commits[botWallet].direction
      ) {
        const key = `${match.id}:${round.index}`;
        const pending = this.pending.get(key);
        if (!pending) return;

        this.gameManager.submitReveal(
          match.id,
          botWallet,
          pending.direction,
          pending.salt
        );
        this.pending.delete(key);
      }
    } catch {
      // Ignore race conditions when round already advanced.
    }
  }
}
