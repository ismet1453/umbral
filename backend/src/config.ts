import "dotenv/config";

const DEFAULT_PORT = 3001;
const DEFAULT_COMMIT_MS = 30_000;
const DEFAULT_REVEAL_MS = 15_000;
const DEFAULT_ROUNDS_PER_PLAYER = 3;

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: readInt("PORT", DEFAULT_PORT),
  solanaRpcUrl:
    process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  programId: process.env.PROGRAM_ID ?? "",
  authorityKeypairPath: process.env.AUTHORITY_KEYPAIR_PATH ?? "",
  commissionBps: readInt("COMMISSION_BPS", 1000),
  commitTimeoutMs: readInt("COMMIT_TIMEOUT_MS", DEFAULT_COMMIT_MS),
  revealTimeoutMs: readInt("REVEAL_TIMEOUT_MS", DEFAULT_REVEAL_MS),
  roundsPerPlayer: readInt("ROUNDS_PER_PLAYER", DEFAULT_ROUNDS_PER_PLAYER),
  minBetLamports: readInt("MIN_BET_LAMPORTS", 100_000_000),
  demoBotEnabled: process.env.DEMO_BOT_ENABLED !== "false",
};
