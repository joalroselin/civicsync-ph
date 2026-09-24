"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { firebaseAuth, firebaseEnabled, firestore } from "@/lib/firebase";
import { BATASWATCH_CONGRESS } from "@/lib/batasWatch";

export interface WatchedBill {
  id: string;
  label: string;
  title: string;
  congress: number;
  status: string | null;
  savedAt: number;
}

interface WatchlistContextValue {
  items: WatchedBill[];
  ready: boolean;
  isWatched: (id: string) => boolean;
  toggle: (bill: Omit<WatchedBill, "savedAt">) => void;
  /** Re-fetch live status for every watched bill; resolves when done. */
  refreshStatuses: () => Promise<void>;
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    setItems(sortBySaved(readLocal()));
    setReady(true);
  }, []);

  // Firestore sync: users/{uid}/watchlist/{billId}
  useEffect(() => {
    const auth = firebaseAuth();
    const db = firestore();
    if (!auth || !db) return;

    let unsubSnapshot: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      unsubSnapshot?.();
      unsubSnapshot = null;
      if (!u) return;

      const col = collection(db, "users", u.uid, "watchlist");
      // First sign-in on this device: push anything saved locally up.
      const local = readLocal();
      if (local.length) {
        const batch = writeBatch(db);
        for (const item of local) batch.set(doc(col, item.id), item, { merge: true });
        await batch.commit().catch((e) => console.error("Watchlist merge failed", e));
      }
      unsubSnapshot = onSnapshot(col, (snap) => {
        const remote = snap.docs.map((d) => d.data() as WatchedBill);
        setItems(sortBySaved(remote));
        writeLocal(remote);
      });
    });

    return () => {
      unsubAuth();
      unsubSnapshot?.();
    };
  }, []);

  const toggle = useCallback(
    (bill: Omit<WatchedBill, "savedAt">) => {
      const exists = itemsRef.current.some((i) => i.id === bill.id);
      const next = exists
        ? itemsRef.current.filter((i) => i.id !== bill.id)
        : sortBySaved([...itemsRef.current, { ...bill, savedAt: Date.now() }]);
      setItems(next);
      writeLocal(next);

      const db = firestore();
      if (user && db) {
        const ref = doc(db, "users", user.uid, "watchlist", bill.id);
        const op = exists ? deleteDoc(ref) : setDoc(ref, next.find((i) => i.id === bill.id)!);
        op.catch((e) => console.error("Watchlist sync failed", e));
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
          const { status } = (await res.json()) as { status: string | null };
          return status && status !== item.status ? { id: item.id, status } : null;
        } catch {
          return null;
        }
      })
    );
    const changed = new Map(updates.filter(Boolean).map((u) => [u!.id, u!.status]));
    if (changed.size === 0) return;

    const next = itemsRef.current.map((i) => (changed.has(i.id) ? { ...i, status: changed.get(i.id)! } : i));
    setItems(next);
    writeLocal(next);
    const db = firestore();
    if (user && db) {
      for (const [id, status] of Array.from(changed)) {
        setDoc(doc(db, "users", user.uid, "watchlist", id), { status }, { merge: true }).catch((e) =>
          console.error("Watchlist sync failed", e)
        );
      }
    }
  }, [user]);

  const isWatched = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const signIn = useCallback(async () => {
    const auth = firebaseAuth();
    if (!auth) return;
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    const auth = firebaseAuth();
    if (auth) await fbSignOut(auth);
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
