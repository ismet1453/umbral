import { PublicKey } from "@solana/web3.js";

export const CONFIG_SEED = Buffer.from("config");
export const MATCH_SEED = Buffer.from("match");

export const MIN_BET_LAMPORTS = 100_000_000;
export const MAX_COMMISSION_BPS = 2_500;

export function configPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], programId);
}

export function matchPda(
  programId: PublicKey,
  matchId: bigint | number
): [PublicKey, number] {
  const id = Buffer.alloc(8);
  id.writeBigUInt64LE(BigInt(matchId));
  return PublicKey.findProgramAddressSync([MATCH_SEED, id], programId);
}

export function calculateCommission(totalLamports: number, bps: number): number {
  return Math.floor((totalLamports * bps) / 10_000);
}

export function calculatePayout(totalLamports: number, bps: number): number {
  return totalLamports - calculateCommission(totalLamports, bps);
}
