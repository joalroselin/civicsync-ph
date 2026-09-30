"use client";

/**
 * Everything that touches the Firebase SDK for Watchlist sync.
 * Loaded with a dynamic import() by WatchlistProvider, only for people who
 * sign in, so most visitors never download Firebase (~110 kB).
 */
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch, type DocumentData } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";

export interface SyncUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

/** Minimal shape of a watched bill, to avoid importing app types here. */
type Item = { id: string };

export function watchAuth(onUser: (u: SyncUser | null) => void): () => void {
  const auth = firebaseAuth();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (u) => onUser(u ? { uid: u.uid, displayName: u.displayName, email: u.email } : null));
}

/** Push local items up (first sign-in on a device), then stream the remote list. */
export async function subscribeWatchlist<T extends Item>(
  uid: string,
  localItems: T[],
  onItems: (items: T[]) => void
): Promise<() => void> {
  const db = firestore();
  if (!db) return () => {};
  const col = collection(db, "users", uid, "watchlist");
  if (localItems.length) {
    const batch = writeBatch(db);
    for (const item of localItems) batch.set(doc(col, item.id), item as unknown as DocumentData, { merge: true });
    await batch.commit().catch((e) => console.error("Watchlist merge failed", e));
  }
  return onSnapshot(col, (snap) => onItems(snap.docs.map((d) => d.data() as T)));
}

export async function saveItem(uid: string, item: Item) {
  const db = firestore();
  if (db) await setDoc(doc(db, "users", uid, "watchlist", item.id), item as unknown as DocumentData);
}

export async function removeItem(uid: string, id: string) {
  const db = firestore();
  if (db) await deleteDoc(doc(db, "users", uid, "watchlist", id));
}

export async function updateStatus(uid: string, id: string, status: string) {
  const db = firestore();
  if (db) await setDoc(doc(db, "users", uid, "watchlist", id), { status }, { merge: true });
}

export async function signIn() {
  const auth = firebaseAuth();
  if (auth) await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOut() {
  const auth = firebaseAuth();
  if (auth) await fbSignOut(auth);
}
