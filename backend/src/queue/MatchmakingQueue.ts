import type { QueueEntry } from "../types";

export interface QueuePair {
  betLamports: number;
  players: [QueueEntry, QueueEntry];
}

export class MatchmakingQueue {
  private readonly queues = new Map<number, QueueEntry[]>();

  join(entry: QueueEntry): QueuePair | null {
    const queue = this.queues.get(entry.betLamports) ?? [];
    const existing = queue.find((q) => q.wallet === entry.wallet);
    if (existing) {
      existing.socketId = entry.socketId;
      existing.queuedAt = entry.queuedAt;
      return null;
    }

    if (queue.length === 0) {
      queue.push(entry);
      this.queues.set(entry.betLamports, queue);
      return null;
    }

    const partner = queue.shift()!;
    if (queue.length === 0) {
      this.queues.delete(entry.betLamports);
    } else {
      this.queues.set(entry.betLamports, queue);
    }

    return {
      betLamports: entry.betLamports,
      players: [partner, entry],
    };
  }

  leave(wallet: string): boolean {
    for (const [bet, queue] of this.queues.entries()) {
      const index = queue.findIndex((entry) => entry.wallet === wallet);
      if (index === -1) continue;

      queue.splice(index, 1);
      if (queue.length === 0) {
        this.queues.delete(bet);
      } else {
        this.queues.set(bet, queue);
      }
      return true;
    }
    return false;
  }

  isQueued(wallet: string): boolean {
    for (const queue of this.queues.values()) {
      if (queue.some((entry) => entry.wallet === wallet)) return true;
    }
    return false;
  }

  queueSize(betLamports: number): number {
    return this.queues.get(betLamports)?.length ?? 0;
  }
}
