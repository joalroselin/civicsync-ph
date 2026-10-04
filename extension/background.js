// CivicSync PH extension (CS-115): looks up bill status for the content script.
// Only the bill number is sent, never the page or its address. Cached for 30 minutes.
const API = "https://civicsync-ph-gamma.vercel.app/api/status/";
const cache = new Map();

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type !== "bill" || typeof msg.number !== "string") return;
  const key = msg.number.replace(/\s+/g, "").toUpperCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return reply(hit.data);
  fetch(API + encodeURIComponent(key))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((data) => {
      cache.set(key, { at: Date.now(), data });
      reply(data);
    });
  return true; // async reply
});
