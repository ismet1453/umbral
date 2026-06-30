"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import type { PlayerProfile } from "@/lib/idleGame";
import { GameLeftDrawer } from "./GameLeftDrawer";
import { GameModal } from "./GameModal";
import { GameRightMenu, type GamePanelId } from "./GameRightMenu";
import { ItemsPanel } from "./panels/ItemsPanel";
import { PlaceholderPanel } from "./panels/PlaceholderPanel";
import { SettingsPanel } from "./panels/SettingsPanel";

interface GameShellProps {
  hunterName: string;
  wallet: string;
  profile: PlayerProfile;
  updateProfile: (fn: (p: PlayerProfile) => PlayerProfile) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function GameShell({
  hunterName,
  wallet,
  profile,
  updateProfile,
  onLogout,
  children,
  cinematic = true,
}: GameShellProps & { cinematic?: boolean }) {
  const t = useT().game;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<GamePanelId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const closePanel = useCallback(() => setActivePanel(null), []);

  const togglePanel = useCallback((id: GamePanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div
      className={`um-shell${drawerOpen ? " um-shell--drawer-open" : ""}${cinematic ? " um-shell--cinematic" : ""}`}
    >
      {!cinematic && (
        <GameLeftDrawer
          open={drawerOpen}
          wallet={wallet}
          onToggle={() => setDrawerOpen((o) => !o)}
        />
      )}

      <main className="um-main">
        {!cinematic && (
          <header className="um-topbar">
            <div className="um-topbar__brand">
              <p className="um-topbar__tag">{t.tagline}</p>
              <h1 className="um-topbar__title">
                Um<span className="um-topbar__accent">bral</span>
              </h1>
            </div>
            <div className="um-topbar__hunter">
              <span className="um-topbar__hunter-label">{t.hunterLabel}</span>
              <span className="um-topbar__hunter-name">{hunterName}</span>
            </div>
          </header>
        )}

        <div className="um-main__content">{children}</div>
      </main>

      {cinematic && (
        <button
          type="button"
          className="sl-cine-settings sl-glass"
          onClick={() => setSettingsOpen(true)}
          title={t.menuSettings}
          aria-label={t.menuSettings}
        >
          ⚙
        </button>
      )}

      {!cinematic && (
        <GameRightMenu active={activePanel} onSelect={togglePanel} />
      )}

      <GameModal open={activePanel === "trade"} title={t.menuTrade} onClose={closePanel}>
        <PlaceholderPanel title={t.tradeTitle} description={t.tradeDesc} />
      </GameModal>

      <GameModal open={activePanel === "map"} title={t.menuMap} onClose={closePanel}>
        <PlaceholderPanel title={t.mapTitle} description={t.mapDesc} />
      </GameModal>

      <GameModal open={activePanel === "items"} title={t.menuItems} onClose={closePanel}>
        <ItemsPanel profile={profile} />
      </GameModal>

      <GameModal open={activePanel === "settings" || settingsOpen} title={t.menuSettings} onClose={() => { closePanel(); setSettingsOpen(false); }}>
        <SettingsPanel onLogout={onLogout} />
      </GameModal>
    </div>
  );
}
