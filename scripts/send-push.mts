/**
 * Sends Watchlist notifications for today's status changes (CS-201).
 *
 *   node scripts/send-push.mts [--dry]
 *
 * Needs SANITY_API_PROJECT_ID, SANITY_API_WRITE_TOKEN and VAPID_PRIVATE_KEY
 * (GitHub Actions secrets in the nightly job). Skips quietly without them.
 * Subscriptions that the browser has dropped (404/410) are deleted.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";
import webpush from "web-push";
import { VAPID_PUBLIC_KEY } from "../lib/push.ts";

const DRY = process.argv.includes("--dry");
const { SANITY_API_PROJECT_ID, SANITY_API_DATASET = "production", SANITY_API_WRITE_TOKEN, VAPID_PRIVATE_KEY } = process.env;
if (!SANITY_API_PROJECT_ID || !SANITY_API_WRITE_TOKEN || !VAPID_PRIVATE_KEY) {
  console.log("Push secrets not set; skipping notifications.");
  process.exit(0);
}
webpush.setVapidDetails("mailto:hello.joaldev@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const sanity = createClient({ projectId: SANITY_API_PROJECT_ID, dataset: SANITY_API_DATASET, apiVersion: "2025-01-01", token: SANITY_API_WRITE_TOKEN, useCdn: false });

const file = JSON.parse(readFileSync(new URL("../data/status/changes.json", import.meta.url), "utf8"));
const today: string = file.updated;
const changes: { date: string; number: string; title: string; to: string }[] = file.changes.filter((c: any) => c.date === today);
if (!changes.length) {
  console.log(`No status changes on ${today}; nothing to send.`);
  process.exit(0);
}
const byBill = new Map(changes.map((c) => [c.number, c]));
const label = (n: string) => n.replace(/^SBN-/, "SB ").replace(/^HB0*/, "HB ");
const short = (s: string) => {
  const ra = s.match(/republic act\s*(?:RA\s*)?(\d{4,6})/i);
  if (ra) return `Became law · RA ${ra[1]}`;
  const caps = s.replace(/[^A-Za-z]/g, "");
  return (caps === caps.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s).slice(0, 90);
};

const subs: { _id: string; endpoint: string; keys: { p256dh: string; auth: string }; bills: string[] }[] = await sanity.fetch(
  `*[_type == "pushSubscription"]{_id, endpoint, keys, bills}`
);
let sent = 0,
  removed = 0;
for (const s of subs) {
  const moved = (s.bills ?? []).map((b) => byBill.get(b)).filter(Boolean) as typeof changes;
  if (!moved.length) continue;
  const one = moved.length === 1 ? moved[0] : null;
  const payload = JSON.stringify(
    one
      ? { title: `${label(one.number)} moved`, body: `${short(one.to)}\n${one.title.slice(0, 80)}`, url: `/bills/${one.number}?utm_source=push&utm_medium=notification`, tag: one.number }
      : { title: `${moved.length} bills you follow moved`, body: moved.slice(0, 4).map((c) => `${label(c.number)}: ${short(c.to)}`).join("\n"), url: "/watchlist?utm_source=push&utm_medium=notification", tag: "watchlist" }
  );
  if (DRY) {
    console.log("would send", s._id, payload);
    continue;
  }
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 60 * 60 * 24 });
    sent++;
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await sanity.delete(s._id).catch(() => {});
      removed++;
    } else console.error("push failed", s._id, err?.statusCode ?? err?.message);
  }
}
console.log(`${changes.length} changes on ${today}; ${subs.length} subscribers; sent ${sent}; removed ${removed} expired.`);
