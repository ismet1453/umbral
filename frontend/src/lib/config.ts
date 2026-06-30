export const MIN_BET_SOL = 0.1;
export const MIN_BET_LAMPORTS = 100_000_000;
export const DEMO_BOT_WALLET =
  "EgoShotCPUBot111111111111111111111111111111";

export function isDemoBot(wallet: string): boolean {
  return wallet === DEMO_BOT_WALLET;
}

export function displayWallet(wallet: string, chars = 4): string {
  if (isDemoBot(wallet)) return "CPU Bot";
  return shortenWallet(wallet, chars);
}

export function getBackendUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_WS_URL ??
    "http://localhost:3001";

  return raw.replace(/^ws:/, "http:").replace(/^wss:/, "https:").replace(/\/$/, "");
}

export function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(3);
}

export function solToLamports(sol: number): number {
  return Math.round(sol * 1_000_000_000);
}

export function shortenWallet(wallet: string, chars = 4): string {
  if (wallet.length <= chars * 2 + 1) return wallet;
  return `${wallet.slice(0, chars)}…${wallet.slice(-chars)}`;
}

export function formatCountdown(deadlineMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
  return `${seconds}s`;
}
