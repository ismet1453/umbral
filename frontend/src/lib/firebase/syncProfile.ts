import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import type { PlayerProfile } from "@/lib/idleGame";
import { getFirestoreDb } from "@/lib/firebase/client";

/** Subset of the profile we back up to / restore from Firestore. */
export interface CloudProfileSlice {
  hunterName: string;
  level: number;
  currentChapter: number;
  walletCoin: number;
  xp: number;
  updatedAt: number;
}

export interface LeaderboardEntry {
  walletAddress: string;
  hunterName: string;
  level: number;
  updatedAt: number;
  rank: number;
}

const PROFILES = "profiles";
const LEADERBOARD = "leaderboard";

export function profileToCloudSlice(p: PlayerProfile): CloudProfileSlice {
  return {
    hunterName: p.hunterName.trim(),
    level: p.level,
    currentChapter: p.currentChapter,
    walletCoin: Math.floor(p.walletCoin),
    xp: Math.floor(p.xp),
    updatedAt: Date.now(),
  };
}

/**
 * Push the leaderboard-relevant slice of a profile to Firestore.
 * No-op (resolves) when Firebase is not configured or the profile is unnamed.
 */
export async function pushProfileToCloud(p: PlayerProfile): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const wallet = p.walletAddress;
  if (!wallet || p.hunterName.trim().length < 2) return;

  const slice = profileToCloudSlice(p);

  try {
    await Promise.all([
      setDoc(doc(db, PROFILES, wallet), slice, { merge: true }),
      setDoc(
        doc(db, LEADERBOARD, wallet),
        {
          hunterName: slice.hunterName,
          level: slice.level,
          updatedAt: slice.updatedAt,
        },
        { merge: true }
      ),
    ]);
  } catch {
    // Network/permission failures must never break the game loop.
  }
}

export async function fetchCloudProfile(
  wallet: string
): Promise<CloudProfileSlice | null> {
  const db = getFirestoreDb();
  if (!db || !wallet) return null;
  try {
    const snap = await getDoc(doc(db, PROFILES, wallet));
    if (!snap.exists()) return null;
    const data = snap.data() as Partial<CloudProfileSlice>;
    return {
      hunterName: data.hunterName ?? "",
      level: Math.max(1, data.level ?? 1),
      currentChapter: Math.max(1, data.currentChapter ?? 1),
      walletCoin: Math.max(0, data.walletCoin ?? 0),
      xp: Math.max(0, data.xp ?? 0),
      updatedAt: data.updatedAt ?? 0,
    };
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(
  max = 100
): Promise<LeaderboardEntry[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  try {
    const q = query(
      collection(db, LEADERBOARD),
      orderBy("level", "desc"),
      fsLimit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d, i) => {
      const data = d.data() as { hunterName?: string; level?: number; updatedAt?: number };
      return {
        walletAddress: d.id,
        hunterName: data.hunterName ?? "—",
        level: data.level ?? 1,
        updatedAt: data.updatedAt ?? 0,
        rank: i + 1,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Merge a cloud slice into a local profile when the cloud copy is newer or has
 * a higher level. Returns the (possibly) updated profile.
 */
export function mergeCloudIntoLocal(
  local: PlayerProfile,
  cloud: CloudProfileSlice | null
): PlayerProfile {
  if (!cloud) return local;

  // Fresh local reset wins over stale cloud level until cloud catches up.
  if (
    local.progressResetAt &&
    cloud.updatedAt <= local.progressResetAt
  ) {
    return {
      ...local,
      walletCoin: Math.max(local.walletCoin, cloud.walletCoin),
      hunterName: local.hunterName || cloud.hunterName,
    };
  }

  const cloudIsNewer =
    cloud.updatedAt > local.lastAccrualMs || cloud.level > local.level;
  if (!cloudIsNewer) return local;
  return {
    ...local,
    level: Math.max(local.level, cloud.level),
    currentChapter: Math.max(local.currentChapter, cloud.currentChapter),
    walletCoin: Math.max(local.walletCoin, cloud.walletCoin),
    xp: cloud.level > local.level ? cloud.xp : local.xp,
    hunterName: local.hunterName || cloud.hunterName,
  };
}
