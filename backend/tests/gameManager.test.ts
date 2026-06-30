import { describe, expect, it } from "vitest";
import { GameManager } from "../src/game/GameManager";
import { hashCommitment } from "../src/crypto/commitReveal";

function createManager() {
  return new GameManager({
    commitTimeoutMs: 60_000,
    revealTimeoutMs: 60_000,
    roundsPerPlayer: 1,
  });
}

describe("GameManager", () => {
  it("runs lobby create, join, commit, reveal and finishes", () => {
    const manager = createManager();
    const match = manager.createLobbyMatch({
      chainMatchId: 10,
      betLamports: 10_000_000,
      creatorWallet: "creator",
    });

    manager.joinMatch(match.id, "opponent");

    const shooterSalt = "shoot-salt";
    const keeperSalt = "keep-salt";
    const shooterDirection = "left";
    const keeperDirection = "center";

    manager.submitCommit(
      match.id,
      "creator",
      hashCommitment(shooterDirection, shooterSalt)
    );
    manager.submitCommit(
      match.id,
      "opponent",
      hashCommitment(keeperDirection, keeperSalt)
    );

    manager.submitReveal(match.id, "creator", shooterDirection, shooterSalt);
    manager.submitReveal(match.id, "opponent", keeperDirection, keeperSalt);

    const updated = manager.getMatch(match.id)!;
    expect(updated.phase).toBe("round_commit");

    const shooterSalt2 = "shoot-salt-2";
    const keeperSalt2 = "keep-salt-2";
    const shooterDirection2 = "right";
    const keeperDirection2 = "right";

    manager.submitCommit(
      match.id,
      "opponent",
      hashCommitment(shooterDirection2, shooterSalt2)
    );
    manager.submitCommit(
      match.id,
      "creator",
      hashCommitment(keeperDirection2, keeperSalt2)
    );

    manager.submitReveal(match.id, "opponent", shooterDirection2, shooterSalt2);
    manager.submitReveal(match.id, "creator", keeperDirection2, keeperSalt2);

    const finished = manager.getMatch(match.id)!;
    expect(finished.phase).toBe("finished");
    expect(finished.creator.goals).toBe(1);
    expect(finished.winner).toBe("creator");
  });

  it("enters sudden death when regulation ends in a tie", () => {
    const manager = createManager();
    const match = manager.createLobbyMatch({
      chainMatchId: 12,
      betLamports: 10_000_000,
      creatorWallet: "creator",
    });

    manager.joinMatch(match.id, "opponent");

    // Round 0: creator scores
    manager.submitCommit(
      match.id,
      "creator",
      hashCommitment("left", "s0")
    );
    manager.submitCommit(
      match.id,
      "opponent",
      hashCommitment("center", "k0")
    );
    manager.submitReveal(match.id, "creator", "left", "s0");
    manager.submitReveal(match.id, "opponent", "center", "k0");

    // Round 1: opponent scores
    manager.submitCommit(
      match.id,
      "opponent",
      hashCommitment("left", "s1")
    );
    manager.submitCommit(
      match.id,
      "creator",
      hashCommitment("center", "k1")
    );
    manager.submitReveal(match.id, "opponent", "left", "s1");
    manager.submitReveal(match.id, "creator", "center", "k1");

    const tied = manager.getMatch(match.id)!;
    expect(tied.phase).toBe("round_commit");
    expect(tied.suddenDeath).toBe(true);
    expect(tied.creator.goals).toBe(1);
    expect(tied.opponent?.goals).toBe(1);
  });

  it("cancels a waiting lobby for the creator", () => {
    const manager = createManager();
    const match = manager.createLobbyMatch({
      chainMatchId: 11,
      betLamports: 10_000_000,
      creatorWallet: "creator",
    });

    const cancelled = manager.cancelWaitingMatch(match.id, "creator");
    expect(cancelled.phase).toBe("cancelled");
  });
});
