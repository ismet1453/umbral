"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useT } from "@/components/i18n/LocaleProvider";
import { shortenWallet } from "@/lib/config";

interface GameLeftDrawerProps {
  open: boolean;
  wallet: string;
  onToggle: () => void;
}

export function GameLeftDrawer({ open, wallet, onToggle }: GameLeftDrawerProps) {
  const t = useT().game;

  return (
    <aside className={`um-drawer${open ? " um-drawer--open" : ""}`} aria-label={t.walletAria}>
      <button
        type="button"
        className="um-drawer__toggle"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? t.walletCloseAria : t.walletOpenAria}
      >
        <span className="um-drawer__toggle-icon" aria-hidden>
          {open ? "‹" : "◎"}
        </span>
        {!open && (
          <span className="um-drawer__toggle-label">{t.walletAria}</span>
        )}
      </button>

      <div className="um-drawer__inner">
        <p className="um-drawer__label">{t.walletTitle}</p>
        <p className="um-drawer__hint">{t.walletHint}</p>
        <div className="um-drawer__wallet-btn">
          <WalletMultiButton />
        </div>
        {wallet && (
          <p className="um-drawer__addr">{shortenWallet(wallet, 6)}</p>
        )}
      </div>
    </aside>
  );
}
