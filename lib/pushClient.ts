"use client";

import { PUSH_FLAG, VAPID_PUBLIC_KEY } from "./push";

/** Browser side of Watchlist notifications (CS-201). */
export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export const pushEnabled = () => {
  try {
    return localStorage.getItem(PUSH_FLAG) === "1" && Notification.permission === "granted";
  } catch {
    return false;
  }
};

const keyBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function subscription(create: boolean) {
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing || !create) return existing;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) });
}

async function save(sub: PushSubscription, bills: string[]) {
  const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON(), bills }) });
  if (!res.ok) throw new Error("save failed");
}

/** Ask permission, subscribe, and save the followed bills. Returns false if the person declined. */
export async function enablePush(bills: string[]): Promise<boolean> {
  if ((await Notification.requestPermission()) !== "granted") return false;
  const sub = await subscription(true);
  if (!sub) return false;
  await save(sub, bills);
  localStorage.setItem(PUSH_FLAG, "1");
  return true;
}

export async function disablePush() {
  const sub = await subscription(false);
  if (sub) {
    await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  localStorage.removeItem(PUSH_FLAG);
}

/** Keep the server's copy of followed bills current (called when the Watchlist changes). */
export async function syncPush(bills: string[]) {
  if (!pushSupported() || !pushEnabled()) return;
  const sub = await subscription(false);
  if (sub) await save(sub, bills).catch(() => {});
}
