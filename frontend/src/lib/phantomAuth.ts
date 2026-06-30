import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

const AUTH_STORAGE_PREFIX = "umbral-phantom-auth:";

/** Phantom browser extension installed (popup connect only works with this). */
export function isPhantomInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const solana = (window as Window & { solana?: { isPhantom?: boolean } }).solana;
  return Boolean(solana?.isPhantom);
}

export function phantomInstallHint(): string {
  return "Install the Phantom browser extension, then refresh this page.";
}

export function isPhantomAuthorized(wallet: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${AUTH_STORAGE_PREFIX}${wallet}`) === "1";
}

function markPhantomAuthorized(wallet: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${AUTH_STORAGE_PREFIX}${wallet}`, "1");
}

export function clearPhantomAuthorized(wallet: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${AUTH_STORAGE_PREFIX}${wallet}`);
}

function buildRegistrationMessage(wallet: string): Uint8Array {
  const text = [
    "UMBRAL — Hunter Registration",
    `Wallet: ${wallet}`,
    "This signature authorizes your hunter profile and balance read access.",
    `Nonce: ${Date.now()}`,
  ].join("\n");
  return new TextEncoder().encode(text);
}

async function signRegistrationMemoTx(
  wallet: WalletContextState,
  pubkey: PublicKey,
  connection: Connection
): Promise<void> {
  if (!wallet.sendTransaction) {
    throw new Error("Wallet cannot send registration transaction.");
  }

  const memoIx = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey, isSigner: true, isWritable: true }],
    data: Buffer.from("UMBRAL: Authorize Hunter Registration"),
  });

  const tx = new Transaction().add(memoIx);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = pubkey;

  const sig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
}

/** Opens Phantom extension → connect → sign registration proof */
export async function authorizePhantomWallet(
  wallet: WalletContextState,
  connection: Connection
): Promise<string> {
  if (!isPhantomInstalled()) {
    throw new Error(phantomInstallHint());
  }

  if (!wallet.select) {
    throw new Error("Wallet adapter not ready. Refresh the page and try again.");
  }

  await wallet.select(PhantomWalletName);

  if (!wallet.connected) {
    try {
      await wallet.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("user rejected")) {
        throw err;
      }
      throw new Error(
        msg.includes("not found") || msg.includes("WalletNotFound")
          ? phantomInstallHint()
          : `Phantom connection failed: ${msg}`
      );
    }
  }

  const pubkey = wallet.publicKey;
  if (!pubkey) {
    throw new Error("Phantom connection failed.");
  }

  const address = pubkey.toBase58();

  if (isPhantomAuthorized(address)) {
    return address;
  }

  if (wallet.signMessage) {
    try {
      await wallet.signMessage(buildRegistrationMessage(address));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("user rejected")) throw err;
      throw new Error(`Signature required to register: ${msg}`);
    }
  } else {
    await signRegistrationMemoTx(wallet, pubkey, connection);
  }

  markPhantomAuthorized(address);
  return address;
}
