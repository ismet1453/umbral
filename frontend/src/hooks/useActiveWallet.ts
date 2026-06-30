import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export type WalletSource = "phantom" | "dev" | null;

export function getDevWalletAddress(): string | null {
  const raw = process.env.NEXT_PUBLIC_DEV_WALLET?.trim();
  if (!raw || raw.length < 32) return null;
  return raw;
}

export function useActiveWallet(): {
  wallet: string | null;
  source: WalletSource;
} {
  const { publicKey } = useWallet();
  const devWallet = getDevWalletAddress();

  return useMemo(() => {
    if (publicKey) {
      return { wallet: publicKey.toBase58(), source: "phantom" as const };
    }
    if (devWallet) {
      return { wallet: devWallet, source: "dev" as const };
    }
    return { wallet: null, source: null };
  }, [publicKey, devWallet]);
}
