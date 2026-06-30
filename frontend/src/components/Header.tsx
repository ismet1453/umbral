"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { shortenWallet } from "@/lib/config";

interface HeaderProps {
  hunterName: string | null;
  wallet: string | null;
  onLogout?: () => void;
}

export function Header({ hunterName, wallet, onLogout }: HeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
      <div>
        <p className="sl-header__eyebrow">Shadow Monarch · Web3 Idle</p>
        <h1 className="sl-header__title">
          Ego<span className="sl-header__accent">Shot</span>
        </h1>
        {hunterName && wallet && (
          <p className="sl-header__hunter">
            <span className="sl-header__hunter-name">{hunterName}</span>
            <span className="sl-header__hunter-sep">·</span>
            <span className="sl-header__hunter-wallet">
              {shortenWallet(wallet, 5)}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onLogout && (
          <button type="button" className="auth-panel__link auth-panel__link--header" onClick={onLogout}>
            Log out
          </button>
        )}
        <WalletMultiButton />
      </div>
    </header>
  );
}
