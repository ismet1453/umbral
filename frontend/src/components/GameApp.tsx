"use client";



import { AuthScreen } from "@/components/auth/AuthScreen";

import { SystemGateBackground } from "@/components/auth/SystemGateBackground";

import { useT } from "@/components/i18n/LocaleProvider";

import { GameShell } from "@/components/game/GameShell";

import { IdleGameView } from "@/components/idle/IdleGameView";

import { useAuth } from "@/hooks/useAuth";



/**

 * App shell: auth gate → idle game when ready.

 */

export function GameApp() {

  const t = useT();

  const {

    hydrated,

    phase,

    profile,

    pendingHunterName,

    characterSelectMode,

    uiLocked,

    walletAddress,

    error,

    busy,

    connectWallet,

    submitLogin,

    proceedToCharacterSelect,

    selectCharacter,

    cancelCharacterSelect,

    logout,

    updateProfile,

    clearError,

  } = useAuth();



  if (!hydrated) {

    return (

      <div className="sys-notify-root sys-notify-root--loading">

        <SystemGateBackground />

        <div className="sys-boot__inner" style={{ position: "relative", zIndex: 1 }}>

          <div className="sys-boot__loader-ring" aria-hidden />

          <p className="sys-boot__loader-text">{t.common.loading}</p>

        </div>

      </div>

    );

  }



  if (phase !== "ready" || !profile) {

    return (

      <AuthScreen

        phase={phase === "ready" ? "welcome" : phase}

        profile={profile}

        pendingHunterName={pendingHunterName}

        characterSelectMode={characterSelectMode}

        uiLocked={uiLocked}

        walletAddress={walletAddress}

        error={error}

        busy={busy}

        onConnect={connectWallet}

        onSubmitLogin={submitLogin}

        onProceedToCharacterSelect={proceedToCharacterSelect}

        onSelectCharacter={selectCharacter}

        onCancelCharacterSelect={cancelCharacterSelect}

        onLogout={logout}

        onClearError={clearError}

      />

    );

  }



  return (

    <GameShell

      hunterName={profile.hunterName}

      wallet={profile.walletAddress}

      profile={profile}

      updateProfile={updateProfile}

      onLogout={logout}

    >

      <IdleGameView profile={profile} updateProfile={updateProfile} />

    </GameShell>

  );

}

