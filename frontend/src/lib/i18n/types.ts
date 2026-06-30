import type { CharacterId } from "@/lib/idleGame";

export type StorySubtitleCue = {
  atMs: number;
  text: string;
};

/** Plain string, or timed cues within one scene (e.g. vo_5 @ 0s and 10s). */
export type StorySceneSubtitle = string | StorySubtitleCue[];

export type Locale =
  | "tr"
  | "en"
  | "ru"
  | "zh"
  | "ja"
  | "ko"
  | "es"
  | "de"
  | "hi"
  | "ar";

export type CharacterCopy = {
  subtitle: string;
  role: string;
  lore: string;
  focus: string;
};


export type Messages = {
  language: {
    title: string;
    subtitle: string;
    continue: string;
    skip: string;
  };
  boot: {
    enterGate: string;
    gateHint: string;
    skip: string;
    accessGranted: string;
    typeLines: [string, string, string];
  };
  notify: {
    title: string;
    qualify: string;
    survive: string;
    welcome: string;
    resume: string;
    subAwakening: string;
    subSession: string;
    subSessionRestore: string;
    enterName: string;
    connectWallet: string;
    awaitingPhantom: string;
    signWallet: string;
    yes: string;
    no: string;
    selectHunter: string;
    connecting: string;
    registering: string;
    restoring: string;
    restoreStatus: string;
    hintMin: string;
    hintGuest: string;
    hintAuthorized: string;
    hintSign: string;
    chooseHunter: string;
  };
  charSelect: {
    sysLabel: string;
    titleLine1: string;
    titleLine2: string;
    hintNav: string;
    hintConfirm: string;
    lockIn: string;
    registering: string;
    entering: string;
    free: string;
    unlockFree: string;
    unlockSol: string;
    hunterFallback: string;
    prevAria: string;
    nextAria: string;
  };
  story: {
    skip: string;
    /** vo_1 … vo_9 — synced to STORY_SCENES order */
    scenes: [
      StorySceneSubtitle,
      StorySceneSubtitle,
      StorySceneSubtitle,
      StorySceneSubtitle,
      StorySceneSubtitle,
      StorySceneSubtitle,
      StorySceneSubtitle,
      StorySceneSubtitle,
      StorySceneSubtitle,
    ];
  };
  common: {
    loading: string;
    hp: string;
    atk: string;
    def: string;
    crit: string;
    monarch: string;
  };
  game: {
    tagline: string;
    hunterLabel: string;
    walletAria: string;
    walletOpenAria: string;
    walletCloseAria: string;
    walletTitle: string;
    walletHint: string;
    menuAria: string;
    menuTrade: string;
    menuTradeShort: string;
    menuMap: string;
    menuMapShort: string;
    menuItems: string;
    menuItemsShort: string;
    menuSettings: string;
    menuSettingsShort: string;
    modalClose: string;
    soon: string;
    tradeTitle: string;
    tradeDesc: string;
    mapTitle: string;
    mapDesc: string;
    itemsLead: string;
    settingsLanguage: string;
    settingsAccount: string;
    settingsLogout: string;
    statLevel: string;
    statGold: string;
    statGoldPerSec: string;
    statCrit: string;
    statCritHint: string;
    statsTitle: string;
    statsMeta: string;
    statStr: string;
    statStrLabel: string;
    statAgi: string;
    statAgiLabel: string;
    statCc: string;
    statCcLabel: string;
    statMonarch: string;
    statMonarchLabel: string;
    arenaTitle: string;
    hunterBadge: string;
    bossBadge: string;
    bossName: string;
    damageCrit: string;
    damageHp: string;
    lootTitle: string;
    lootSub: string;
    chestCommonName: string;
    chestCommonDesc: string;
    chestCommonOpen: string;
    chestBossName: string;
    chestBossDesc: string;
    chestBossOpen: string;
    lootReward: string;
    lootPool: string;
    levelUp: string;
    levelUpCost: string;
    claim: string;
    productionPaused: string;
    shopTitle: string;
    shopActive: string;
    shopSelect: string;
    shopFree: string;
    shopBuy: string;
    offlineFarm: string;
    enemyMob: string;
    enemyBoss: string;
    xpLabel: string;
    nextBoss: string;
    levelUpToast: string;
    chestDropped: string;
    statHp: string;
    statToken: string;
    tabInventory: string;
    tabChests: string;
    tabPets: string;
    berserkerBtn: string;
    bottomBarAria: string;
    tabStayOpen?: string;
    petSlotEmpty: string;
    chapterLabel: string;
    chapterProgress: string;
    chapterKills: string;
    bossIncoming: string;
    bossIncomingSub: string;
    deathTitle: string;
    deathSub: string;
    instantRevive: string;
    chestGridEmpty: string;
    chestOpened: string;
    chestEquipped: string;
    inventoryEmpty: string;
    tabMerge: string;
    mergeTitle: string;
    mergeHint: string;
    mergeButton: string;
    mergeNeed: string;
    mergeEmpty: string;
    mergeResult: string;
    petTitle: string;
    petOwnedEmpty: string;
    petEquip: string;
    petUnequip: string;
    petSlotLabel: string;
    petFound: string;
    bloodstoneName: string;
    bloodstoneFound: string;
    bloodstoneCount: string;
    bossLockedMsg: string;
    berserkActive: string;
    berserkReady: string;
    itemLevel: string;
    /** FAZ B — equipment panel (TR+EN provided; others fall back in-component) */
    tabEquip?: string;
    tabBag?: string;
    tabEnhance?: string;
    enhanceSoon?: string;
    equipHint?: string;
    bagEmpty?: string;
    /** FAZ C — auto-equip suggestion toast (TR+EN; others fall back) */
    equipSuggestTitle?: string;
    equipSuggestEquip?: string;
    equipSuggestDismiss?: string;
    equipSuggestBonus?: string;
    /** FAZ F — leaderboard (TR+EN; others fall back) */
    leaderboardTitle?: string;
    leaderboardOpen?: string;
    leaderboardRank?: string;
    leaderboardHunter?: string;
    leaderboardLevel?: string;
    leaderboardLevelValue?: string;
    leaderboardEmpty?: string;
    leaderboardLoading?: string;
    leaderboardRefresh?: string;
    leaderboardYou?: string;
    /** FAZ D — enhance (TR+EN) */
    enhanceButton?: string;
    enhanceRate?: string;
    enhanceCost?: string;
    enhanceCurrent?: string;
    enhanceUseScroll?: string;
    enhanceBuyScroll?: string;
    enhanceSuccess?: string;
    enhanceFail?: string;
    enhanceBreak?: string;
    enhanceNoItems?: string;
  };
  characters: Record<CharacterId, CharacterCopy>;
};

export type BaseMessages = Omit<Messages, "game" | "characters">;
