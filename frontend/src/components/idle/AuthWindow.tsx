"use client";

import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface AuthWindowProps {
  phase: "connect" | "naming";
  connecting: boolean;
  onConnect: () => void;
  onEnterGate: (name: string) => void;
}

export function AuthWindow({
  phase,
  connecting,
  onConnect,
  onEnterGate,
}: AuthWindowProps) {
  const [name, setName] = useState("");

  if (phase === "connect") {
    return (
      <div className="sl-auth sl-glass">
        <div className="sl-auth__glow" aria-hidden />
        <p className="sl-auth__eyebrow">Shadow Monarch Protocol</p>
        <h2 className="sl-auth__title">Enter the Gate</h2>
        <p className="sl-auth__body">
          Connect your Phantom wallet to awaken your hunter and begin the dungeon
          siege.
        </p>
        <button
          type="button"
          className="sl-btn-connect"
          disabled={connecting}
          onClick={onConnect}
        >
          {connecting ? "Connecting…" : "CONNECT WALLET"}
        </button>
        <p className="sl-auth__hint">
          No wallet? Simulated connection will be used for demo.
        </p>
        <div className="sl-auth__phantom">
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  return (
    <div className="sl-auth sl-glass">
      <div className="sl-auth__glow" aria-hidden />
      <p className="sl-auth__eyebrow">Hunter Registration</p>
      <h2 className="sl-auth__title">Choose Your Hunter Name</h2>
      <p className="sl-auth__body">
        This name will be etched into the Hunter Association records.
      </p>
      <input
        type="text"
        className="sl-auth__input"
        placeholder="Hunter name…"
        maxLength={20}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim().length >= 2) {
            onEnterGate(name.trim());
          }
        }}
      />
      <button
        type="button"
        className="sl-btn-connect"
        disabled={name.trim().length < 2}
        onClick={() => onEnterGate(name.trim())}
      >
        ENTER THE GATE
      </button>
    </div>
  );
}
