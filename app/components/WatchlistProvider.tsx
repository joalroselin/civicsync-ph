"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { firebaseEnabled } from "@/lib/firebase-config";
import { BATASWATCH_CONGRESS } from "@/lib/batasWatch";
import type { SyncUser } from "@/lib/watchlistSync";

/** Firebase sync code, downloaded only when needed (see loadSync). */
type SyncModule = typeof import("@/lib/watchlistSync");
let syncModule: Promise<SyncModule> | null = null;
const loadSync = () => (syncModule ??= import("@/lib/watchlistSync"));

/** Remembers that this browser has signed in, so sync only loads for those users. */
const SIGNED_IN_KEY = "civicsync:signed-in";
const hasSignedInBefore = () => {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === "1";
  } catch {
    return false;
  }
};
const setSignedInFlag = (on: boolean) => {
  try {
    if (on) localStorage.setItem(SIGNED_IN_KEY, "1");
    else localStorage.removeItem(SIGNED_IN_KEY);
  } catch {}
};

export interface WatchedBill {
  id: string;
  label: string;
  title: string;
  congress: number;
  status: string | null;
  /** e.g. "Sen. Risa Hontiveros +2"; filled when saved or on the next status refresh. */
  authorLine?: string;
  savedAt: number;
}

interface WatchlistContextValue {
  items: WatchedBill[];
  ready: boolean;
  isWatched: (id: string) => boolean;
  toggle: (bill: Omit<WatchedBill, "savedAt">) => void;
  /** Re-fetch live status for every watched bill; resolves when done. */
  refreshStatuses: () => Promise<void>;
  user: SyncUser | null;
  syncAvailable: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = "civicsync:watchlist";
const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function readLocal(): WatchedBill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchedBill[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: WatchedBill[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full or blocked — the in-memory list still works this session
  }
}

const sortBySaved = (items: WatchedBill[]) => [...items].sort((a, b) => b.savedAt - a.savedAt);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchedBill[]>([]);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SyncUser | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const stopSyncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setItems(sortBySaved(readLocal()));
    setReady(true);
  }, []);

  // Firestore sync: users/{uid}/watchlist/{billId}. Starts only for browsers
  // that have signed in before, or when someone taps "Sign in".
  const startSync = useCallback(async () => {
    if (!firebaseEnabled || stopSyncRef.current) return;
    const sync = await loadSync();
    let unsubSnapshot: (() => void) | null = null;
    const unsubAuth = sync.watchAuth(async (u) => {
      setUser(u);
      setSignedInFlag(Boolean(u));
      unsubSnapshot?.();
      unsubSnapshot = null;
      if (!u) return;
      unsubSnapshot = await sync.subscribeWatchlist<WatchedBill>(u.uid, readLocal(), (remote) => {
        setItems(sortBySaved(remote));
        writeLocal(remote);
      });
    });
    stopSyncRef.current = () => {
      unsubAuth();
      unsubSnapshot?.();
    };
  }, []);

  useEffect(() => {
    if (hasSignedInBefore()) startSync();
    return () => {
      stopSyncRef.current?.();
      stopSyncRef.current = null;
    };
  }, [startSync]);

  const toggle = useCallback(
    (bill: Omit<WatchedBill, "savedAt">) => {
      const exists = itemsRef.current.some((i) => i.id === bill.id);
      const next = exists
        ? itemsRef.current.filter((i) => i.id !== bill.id)
        : sortBySaved([...itemsRef.current, { ...bill, savedAt: Date.now() }]);
      setItems(next);
      writeLocal(next);

      if (user) {
        loadSync()
          .then((sync) => (exists ? sync.removeItem(user.uid, bill.id) : sync.saveItem(user.uid, next.find((i) => i.id === bill.id)!)))
          .catch((e) => console.error("Watchlist sync failed", e));
      }
    },
    [user]
  );

  const refreshStatuses = useCallback(async () => {
    const current = itemsRef.current.filter((i) => i.congress === BATASWATCH_CONGRESS);
    const updates = await Promise.all(
      current.map(async (item) => {
        try {
          const res = await fetch(`/api/bills/${encodeURIComponent(item.id)}`);
          if (!res.ok) return null;
          const bill = (await res.json()) as { status: string | null; label: string; authors: { first_name?: string; last_name?: string; aliases?: string[] }[]; authorNames: string[] };
          const names = bill.authors?.length
            ? bill.authors.map((a) => `${a.aliases?.[0] ?? a.first_name?.split(" ")[0] ?? ""} ${a.last_name ?? ""}`.trim())
            : bill.authorNames ?? [];
          const line = names.length ? `${bill.label?.startsWith("SB") ? "Sen." : "Rep."} ${names[0]}${names.length > 1 ? ` +${names.length - 1}` : ""}` : undefined;
          const statusChanged = bill.status && bill.status !== item.status;
          const authorChanged = line && line !== item.authorLine;
          return statusChanged || authorChanged ? { id: item.id, status: statusChanged ? bill.status! : item.status, authorLine: line ?? item.authorLine } : null;
        } catch {
          return null;
        }
      })
    );
    const changed = new Map(updates.filter(Boolean).map((u) => [u!.id, u!]));
    if (changed.size === 0) return;

    const next = itemsRef.current.map((i) => {
      const u = changed.get(i.id);
      return u ? { ...i, status: u.status, authorLine: u.authorLine } : i;
    });
    setItems(next);
    writeLocal(next);
    if (user) {
      const sync = await loadSync();
      for (const [id, u] of Array.from(changed)) {
        if (u.status) sync.updateStatus(user.uid, id, u.status).catch((e) => console.error("Watchlist sync failed", e));
      }
    }
  }, [user]);

  const isWatched = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const signIn = useCallback(async () => {
    if (!firebaseEnabled) return;
    await startSync(); // loads Firebase and starts listening for the signed-in user
    const sync = await loadSync();
    await sync.signIn();
  }, [startSync]);

  const signOut = useCallback(async () => {
    setSignedInFlag(false);
    const sync = await loadSync();
    await sync.signOut();
  }, []);

  return (
    <WatchlistContext.Provider
      value={{
        items,
        ready,
        isWatched,
        toggle,
        refreshStatuses,
        user,
        syncAvailable: firebaseEnabled,
        signIn,
        signOut,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used inside WatchlistProvider");
  return ctx;
}
