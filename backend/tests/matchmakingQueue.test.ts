import { describe, expect, it } from "vitest";
import { MatchmakingQueue } from "../src/queue/MatchmakingQueue";

describe("MatchmakingQueue", () => {
  it("pairs two players with the same bet amount", () => {
    const queue = new MatchmakingQueue();

    const first = queue.join({
      wallet: "a",
      betLamports: 10_000_000,
      socketId: "s1",
      queuedAt: Date.now(),
    });
    expect(first).toBeNull();

    const second = queue.join({
      wallet: "b",
      betLamports: 10_000_000,
      socketId: "s2",
      queuedAt: Date.now(),
    });

    expect(second?.players.map((p) => p.wallet)).toEqual(["a", "b"]);
  });

  it("removes a queued player", () => {
    const queue = new MatchmakingQueue();
    queue.join({
      wallet: "a",
      betLamports: 10_000_000,
      socketId: "s1",
      queuedAt: Date.now(),
    });

    expect(queue.leave("a")).toBe(true);
    expect(queue.isQueued("a")).toBe(false);
  });
});
