"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  authorizePhantomWallet,
  isPhantomAuthorized,
} from "@/lib/phantomAuth";

export function usePhantomAuth() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authorizedWallet, setAuthorizedWallet] = useState<string | null>(
    null
  );

  const address = wallet.publicKey?.toBase58() ?? null;

  useEffect(() => {
    if (address && isPhantomAuthorized(address)) {
      setAuthorizedWallet(address);
    }
  }, [address]);

  const walletAuthorized = Boolean(
    address &&
      (authorizedWallet === address || isPhantomAuthorized(address))
  );

  const authorize = useCallback(async () => {
    setAuthPending(true);
    setAuthError(null);
    try {
      const addr = await authorizePhantomWallet(wallet, connection);
      setAuthorizedWallet(addr);
      return addr;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Phantom authorization failed.";
      if (!msg.toLowerCase().includes("user rejected")) {
        setAuthError(msg);
      }
      throw err;
    } finally {
      setAuthPending(false);
    }
  }, [wallet, connection]);

  const clearError = useCallback(() => setAuthError(null), []);

  return {
    address,
    walletAuthorized,
    authPending: authPending || wallet.connecting,
    authError,
    authorize,
    clearError,
  };
}
