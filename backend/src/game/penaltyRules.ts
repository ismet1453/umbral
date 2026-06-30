import type { Direction, GameMatch, RoundOutcome, RoundState } from "../types";

export function resolveShot(
  shooterDirection: Direction,
  keeperDirection: Direction
): RoundOutcome {
  return shooterDirection === keeperDirection ? "save" : "goal";
}

export function buildRoundSchedule(
  creatorWallet: string,
  opponentWallet: string,
  roundsPerPlayer: number
): Array<{ index: number; shooterWallet: string; keeperWallet: string }> {
  const schedule: Array<{ index: number; shooterWallet: string; keeperWallet: string }> = [];

  for (let i = 0; i < roundsPerPlayer * 2; i++) {
    const creatorShoots = i % 2 === 0;
    schedule.push({
      index: i,
      shooterWallet: creatorShoots ? creatorWallet : opponentWallet,
      keeperWallet: creatorShoots ? opponentWallet : creatorWallet,
    });
  }

  return schedule;
}

export function createRound(
  index: number,
  shooterWallet: string,
  keeperWallet: string,
  commitDeadline: number
): RoundState {
  return {
    index,
    shooterWallet,
    keeperWallet,
    phase: "commit",
    commits: {},
    commitDeadline,
  };
}

export function getGoals(match: GameMatch, wallet: string): number {
  if (match.creator.wallet === wallet) return match.creator.goals;
  if (match.opponent?.wallet === wallet) return match.opponent.goals;
  return 0;
}

export function addGoal(match: GameMatch, shooterWallet: string): void {
  if (match.creator.wallet === shooterWallet) {
    match.creator.goals += 1;
    return;
  }
  if (match.opponent?.wallet === shooterWallet) {
    match.opponent.goals += 1;
  }
}

export function regulationComplete(match: GameMatch, roundsPerPlayer: number): boolean {
  if (match.suddenDeath) return false;

  const totalRegulationRounds = roundsPerPlayer * 2;
  const regulationRounds = match.rounds.slice(0, totalRegulationRounds);

  return (
    regulationRounds.length === totalRegulationRounds &&
    regulationRounds.every((round) => round?.phase === "resolved")
  );
}

export function determineRegulationWinner(match: GameMatch): string | null {
  if (!match.opponent) return null;

  const creatorGoals = match.creator.goals;
  const opponentGoals = match.opponent.goals;

  if (creatorGoals === opponentGoals) return null;
  return creatorGoals > opponentGoals
    ? match.creator.wallet
    : match.opponent.wallet;
}

export function needsSuddenDeath(
  match: GameMatch,
  roundsPerPlayer: number
): boolean {
  return regulationComplete(match, roundsPerPlayer) && !determineRegulationWinner(match);
}

export function createSuddenDeathRound(
  match: GameMatch,
  commitDeadline: number
): RoundState {
  if (!match.opponent) {
    throw new Error("Cannot create sudden death round without opponent");
  }

  const roundIndex = match.rounds.length;
  const creatorShoots = roundIndex % 2 === 0;

  return createRound(
    roundIndex,
    creatorShoots ? match.creator.wallet : match.opponent.wallet,
    creatorShoots ? match.opponent.wallet : match.creator.wallet,
    commitDeadline
  );
}

export function determineSuddenDeathWinner(match: GameMatch): string | null {
  if (!match.opponent || match.rounds.length === 0) return null;

  const lastRound = match.rounds[match.rounds.length - 1];
  if (lastRound.phase !== "resolved" || !lastRound.outcome) return null;

  const shooterGoals = getGoals(match, lastRound.shooterWallet);
  const keeperGoals = getGoals(match, lastRound.keeperWallet);

  if (shooterGoals === keeperGoals) return null;

  return shooterGoals > keeperGoals ? lastRound.shooterWallet : lastRound.keeperWallet;
}
