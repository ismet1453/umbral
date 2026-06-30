import { describe, expect, it } from "vitest";
import {
  buildRoundSchedule,
  determineRegulationWinner,
  needsSuddenDeath,
  resolveShot,
} from "../src/game/penaltyRules";
import type { GameMatch } from "../src/types";

describe("penaltyRules", () => {
  it("awards a goal when directions differ", () => {
    expect(resolveShot("left", "center")).toBe("goal");
    expect(resolveShot("right", "right")).toBe("save");
  });

  it("alternates shooter and keeper for regulation rounds", () => {
    const schedule = buildRoundSchedule("creator", "opponent", 3);

    expect(schedule).toHaveLength(6);
    expect(schedule[0]).toMatchObject({
      shooterWallet: "creator",
      keeperWallet: "opponent",
    });
    expect(schedule[1]).toMatchObject({
      shooterWallet: "opponent",
      keeperWallet: "creator",
    });
  });

  it("detects regulation winner and sudden death", () => {
    const resolvedRound = {
      index: 0,
      shooterWallet: "creator",
      keeperWallet: "opponent",
      phase: "resolved" as const,
      commits: {},
      commitDeadline: Date.now(),
    };

    const match: GameMatch = {
      id: "m1",
      chainMatchId: 1,
      betLamports: 1_000_000,
      creator: { wallet: "creator", goals: 2 },
      opponent: { wallet: "opponent", goals: 1 },
      phase: "round_commit",
      rounds: Array.from({ length: 6 }, (_, index) => ({
        ...resolvedRound,
        index,
      })),
      currentRoundIndex: 5,
      suddenDeath: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(determineRegulationWinner(match)).toBe("creator");
    expect(
      needsSuddenDeath(
        {
          ...match,
          creator: { ...match.creator, goals: 1 },
          opponent: { ...match.opponent!, goals: 1 },
        },
        3
      )
    ).toBe(true);
  });
});
