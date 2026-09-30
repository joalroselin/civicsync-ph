/**
 * Sync docs/roadmap-canny.csv to the Canny "Feature Requests" board.
 *
 *   node --env-file=.env.local scripts/canny-sync.mts           # dry run: prints the plan
 *   node --env-file=.env.local scripts/canny-sync.mts --apply   # creates/updates posts
 *
 * - Creates missing categories and tags on the board
 * - Creates posts that don't exist yet (matched by title), authored by the
 *   board admin, then sets status and tags
 * - For existing posts, updates the description (if changed), status, and
 *   missing tags; never deletes
 * - Status changes don't notify voters (shouldNotifyVoters: false)
 *
 * Needs CANNY_API_KEY (Canny → Settings → API & Webhooks). Keep it out of git.
 */
import { readFileSync } from "node:fs";

const API = "https://canny.io/api/v1";
const KEY = process.env.CANNY_API_KEY;
const APPLY = process.argv.includes("--apply");
const BOARD_URL_NAME = "feature-requests";

if (!KEY) {
  console.error("Missing CANNY_API_KEY (run with --env-file=.env.local).");
  process.exit(1);
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: KEY, ...body }),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok || (data && typeof data === "object" && "error" in data)) {
    throw new Error(`${path}: ${res.status} ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  await new Promise((r) => setTimeout(r, 200)); // be gentle with rate limits
  return data as T;
}

/** Minimal CSV parser (quoted fields, commas, newlines in quotes). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") row.push(field), (field = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field), rows.push(row), (row = []), (field = "");
    } else field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const STATUS: Record<string, string> = {
  Open: "open",
  Backlog: "backlog",
  "Under Review": "under review",
  Planned: "planned",
  "In Progress": "in progress",
  Complete: "complete",
  Closed: "closed",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const tickets = parseCsv(readFileSync(new URL("../docs/roadmap-canny.csv", import.meta.url), "utf8"));

const { boards } = await call<{ boards: { id: string; url: string; name: string }[] }>("boards/list", {});
const board = boards.find((b) => b.url.endsWith(`/${BOARD_URL_NAME}`));
if (!board) throw new Error(`Board "${BOARD_URL_NAME}" not found`);

const users = await call<any>("users/list", { limit: 100 });
const admin = (Array.isArray(users) ? users : users.users).find((u: any) => u.isAdmin);
if (!admin) throw new Error("No admin user found");

const { categories } = await call<{ categories: { id: string; name: string }[] }>("categories/list", { boardID: board.id, limit: 100 });
const { tags } = await call<{ tags: { id: string; name: string }[] }>("tags/list", { boardID: board.id, limit: 100 });
const existingPosts: { id: string; title: string; details?: string; status: string; tags: { id: string; name: string }[] }[] = [];
for (let skip = 0; ; skip += 100) {
  const page = await call<{ posts: any[]; hasMore: boolean }>("posts/list", { boardID: board.id, limit: 100, skip });
  existingPosts.push(...page.posts);
  if (!page.hasMore) break;
}

/** Tags for a ticket, minus any that just repeat its category. */
const ticketTags = (t: Record<string, string>) =>
  t.Tags.split(";").map((s) => s.trim()).filter((s) => s && s !== t.Category);

const categoryIds = new Map(categories.map((c) => [c.name, c.id]));
const tagIds = new Map(tags.map((t) => [t.name, t.id]));
const needCategories = [...new Set(tickets.map((t) => t.Category).filter(Boolean))].filter((c) => !categoryIds.has(c));
const needTags = [...new Set(tickets.flatMap(ticketTags))].filter((t) => !tagIds.has(t));

console.log(`Board: ${board.name} (${existingPosts.length} existing posts) · admin: ${admin.name}`);
console.log(`Categories to create: ${needCategories.join(", ") || "none"}`);
console.log(`Tags to create: ${needTags.join(", ") || "none"}`);

const plan = tickets.map((t) => {
  const existing = existingPosts.find((p) => p.title.trim().toLowerCase() === t.Title.trim().toLowerCase());
  return { t, existing, status: STATUS[t.Status] ?? "open" };
});
console.log(`Posts to create: ${plan.filter((p) => !p.existing).length} · existing to update: ${plan.filter((p) => p.existing).length}`);

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply to make these changes.");
  process.exit(0);
}

for (const name of needCategories) {
  const { id } = await call<{ id: string }>("categories/create", { boardID: board.id, name, subscribeAdmins: false });
  categoryIds.set(name, id);
}
for (const name of needTags) {
  const { id } = await call<{ id: string }>("tags/create", { boardID: board.id, name });
  tagIds.set(name, id);
}

let created = 0;
let updated = 0;
let detailsUpdated = 0;
const statusFallbacks: string[] = [];
for (const { t, existing, status } of plan) {
  const details = [t.Details, t["Deployed On"] ? `Deployed: ${formatDate(t["Deployed On"])}` : ""].filter(Boolean).join("\n\n");
  let postID = existing?.id;
  if (!postID) {
    const res = await call<{ id: string }>("posts/create", {
      authorID: admin.id,
      boardID: board.id,
      title: t.Title,
      details: details || t.Title, // Canny requires non-empty details
      categoryID: categoryIds.get(t.Category),
    });
    postID = res.id;
    created++;
  } else {
    updated++;
    const want = details || t.Title;
    if ((existing!.details ?? "").trim() !== want.trim()) {
      await call("posts/update", { postID, details: want });
      detailsUpdated++;
    }
  }

  if (status !== "open" && existing?.status !== status) {
    try {
      await call("posts/change_status", { changerID: admin.id, postID, status, shouldNotifyVoters: false });
    } catch (err) {
      // Some accounts don't expose every status (e.g. Backlog) to the API
      const fallback = status === "backlog" ? "under review" : "open";
      await call("posts/change_status", { changerID: admin.id, postID, status: fallback, shouldNotifyVoters: false });
      statusFallbacks.push(`${t["Ticket ID"]}: ${status} → ${fallback} (${(err as Error).message.slice(0, 80)})`);
    }
  }

  const have = new Set((existing?.tags ?? []).map((x) => x.name));
  for (const name of ticketTags(t)) {
    if (!have.has(name)) await call("posts/add_tag", { postID, tagID: tagIds.get(name) });
  }
  process.stdout.write(".");
}

console.log(`\nDone: ${created} created, ${updated} updated (${detailsUpdated} descriptions changed).`);
if (statusFallbacks.length) console.log("Status fallbacks:\n  " + statusFallbacks.join("\n  "));
