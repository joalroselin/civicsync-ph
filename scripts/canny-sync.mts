/**
 * Sync docs/roadmap-canny.csv to the Canny "Feature Requests" board.
 *
 *   node --env-file=.env.local scripts/canny-sync.mts           # dry run: prints the plan
 *   node --env-file=.env.local scripts/canny-sync.mts --apply   # creates/updates posts
 *   add --no-create to only update posts that already exist on Canny
 *   add --push-status to overwrite Canny statuses with the CSV's
 *   or --push-status=CS-119,CS-120 to push only those tickets' statuses
 *
 * Statuses: Canny is the source of truth. Status changes made in Canny are
 * copied back into the CSV (on --apply) and never overwritten, unless you
 * pass --push-status. New posts get the CSV status.
 *
 * - Groups categories under parent categories (CATEGORY_GROUPS); an existing
 *   top-level category is moved under its parent by recreating it and
 *   re-filing its posts (votes, comments, and statuses are untouched)
 * - Creates missing tags; removes tags from posts that the CSV no longer lists
 * - Creates posts that don't exist yet (matched by title), authored by the
 *   board admin, then sets status and tags
 * - For existing posts, updates the description (if changed), status, and
 *   missing tags; never deletes
 * - Status changes don't notify voters (shouldNotifyVoters: false)
 *
 * Needs CANNY_API_KEY (Canny → Settings → API & Webhooks). Keep it out of git.
 */
import { readFileSync, writeFileSync } from "node:fs";

const API = "https://canny.io/api/v1";
const KEY = process.env.CANNY_API_KEY;
const APPLY = process.argv.includes("--apply");
/** Update existing posts only; don't recreate posts missing on Canny (e.g. deleted there on purpose). */
const NO_CREATE = process.argv.includes("--no-create");
/** Overwrite statuses on Canny with the CSV's (otherwise Canny's statuses win and are pulled into the CSV). */
const pushArg = process.argv.find((a) => a.startsWith("--push-status"));
const PUSH_STATUS = pushArg === "--push-status";
/** --push-status=CS-1,CS-2: push only these; Canny still wins for the rest. */
const PUSH_ONLY = pushArg?.includes("=") ? new Set(pushArg.split("=")[1].split(",").map((s) => s.trim())) : null;
const shouldPush = (id: string) => PUSH_STATUS || !!PUSH_ONLY?.has(id);
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

/** Parent category → subcategories (the CSV "Category" column holds the subcategory). */
const CATEGORY_GROUPS: Record<string, string[]> = {
  "Find & follow": ["Receipts", "Bills", "Watchlist", "Discovery"],
  Understand: ["Education", "Language", "Data"],
  "Trust & privacy": ["Trust", "Accessibility"],
  "App experience": ["Platform", "Performance", "Design", "Under the hood"],
  Community: ["Community", "Sharing", "Research"],
};
const PARENT_OF = new Map(Object.entries(CATEGORY_GROUPS).flatMap(([parent, subs]) => subs.map((s) => [s, parent] as const)));

const writeCsv = (rows: Record<string, string>[]) => {
  const cols = Object.keys(rows[0]);
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  writeFileSync(CSV_PATH, [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c] ?? "")).join(","))].join("\n") + "\n");
};

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

const CSV_PATH = new URL("../docs/roadmap-canny.csv", import.meta.url);
const tickets = parseCsv(readFileSync(CSV_PATH, "utf8"));
const LABEL_OF: Record<string, string> = Object.fromEntries(Object.entries(STATUS).map(([label, api]) => [api, label]));

const { boards } = await call<{ boards: { id: string; url: string; name: string }[] }>("boards/list", {});
const board = boards.find((b) => b.url.endsWith(`/${BOARD_URL_NAME}`));
if (!board) throw new Error(`Board "${BOARD_URL_NAME}" not found`);

const users = await call<any>("users/list", { limit: 100 });
const admin = (Array.isArray(users) ? users : users.users).find((u: any) => u.isAdmin);
if (!admin) throw new Error("No admin user found");

const { categories } = await call<{ categories: { id: string; name: string }[] }>("categories/list", { boardID: board.id, limit: 100 });
const { tags } = await call<{ tags: { id: string; name: string }[] }>("tags/list", { boardID: board.id, limit: 100 });
const existingPosts: { id: string; title: string; details?: string; status: string; category?: { id: string } | null; tags: { id: string; name: string }[] }[] = [];
for (let skip = 0; ; skip += 100) {
  const page = await call<{ posts: any[]; hasMore: boolean }>("posts/list", { boardID: board.id, limit: 100, skip });
  existingPosts.push(...page.posts);
  if (!page.hasMore) break;
}

/** Tags for a ticket, minus any that just repeat its category. */
const ticketTags = (t: Record<string, string>) =>
  t.Tags.split(";").map((s) => s.trim()).filter((s) => s && s !== t.Category);

// Category name → { id, parentID }. Parent and sub names must be unique on a board.
const catByName = new Map(categories.map((c: any) => [c.name, { id: c.id as string, parentID: (c.parentID ?? null) as string | null }]));
const wantedSubs = [...new Set(tickets.map((t) => t.Category).filter(Boolean))];
for (const sub of wantedSubs) if (!PARENT_OF.has(sub)) throw new Error(`Category "${sub}" has no parent in CATEGORY_GROUPS`);
// "Community" is both a parent and a subcategory name; Canny needs unique names, so the sub gets a suffix.
const subName = (sub: string) => (CATEGORY_GROUPS[sub] ? `${sub} (general)` : sub);
const tagIds = new Map(tags.map((t) => [t.name, t.id]));
const needParents = Object.keys(CATEGORY_GROUPS).filter((p) => !catByName.has(p) || catByName.get(p)!.parentID);
const needSubs = wantedSubs.filter((sub) => {
  const c = catByName.get(subName(sub));
  const parent = catByName.get(PARENT_OF.get(sub)!);
  return !c || !parent || c.parentID !== parent.id;
});
const needTags = [...new Set(tickets.flatMap(ticketTags))].filter((t) => !tagIds.has(t));

console.log(`Board: ${board.name} (${existingPosts.length} existing posts) · admin: ${admin.name}`);
console.log(`Parent categories to create: ${needParents.join(", ") || "none"}`);
console.log(`Subcategories to create/move: ${needSubs.map(subName).join(", ") || "none"}`);
console.log(`Tags to create: ${needTags.join(", ") || "none"}`);

const plan = tickets.map((t) => {
  const existing = existingPosts.find((p) => p.title.trim().toLowerCase() === t.Title.trim().toLowerCase());
  return { t, existing, status: STATUS[t.Status] ?? "open" };
});
console.log(`Posts to create: ${plan.filter((p) => !p.existing).length} · existing to update: ${plan.filter((p) => p.existing).length}`);
const statusDiffs = plan.filter((p) => p.existing && p.existing.status !== p.status);
if (statusDiffs.length)
  console.log(
    "Statuses that differ:\n  " +
      statusDiffs
        .map((p) => `${shouldPush(p.t["Ticket ID"]) ? "push" : "pull"}  ${p.t["Ticket ID"]} ${p.t.Title}: CSV ${p.t.Status} / Canny ${LABEL_OF[p.existing!.status] ?? p.existing!.status}`)
        .join("\n  ")
  );

if (!APPLY) {
  console.log("\nDry run. Re-run with --apply to make these changes.");
  process.exit(0);
}

for (const name of needParents) {
  const existing = catByName.get(name);
  if (existing) {
    // Exists but nested somewhere: free the name before creating the top-level parent
    await call("categories/delete", { categoryID: existing.id });
  }
  const { id } = await call<{ id: string }>("categories/create", { boardID: board.id, name, subscribeAdmins: false });
  catByName.set(name, { id, parentID: null });
}
for (const sub of needSubs) {
  const name = subName(sub);
  const parentID = catByName.get(PARENT_OF.get(sub)!)!.id;
  const current = catByName.get(name); // same-named category in the wrong place
  // If the sub was renamed (e.g. "Community" → "Community (general)"), posts may still sit
  // under the old name, which is now the parent itself. Move them, but never delete a parent.
  const legacy = name !== sub ? catByName.get(sub) : undefined;
  const fromIds = [current?.id, legacy?.id].filter(Boolean);
  const moving = existingPosts.filter((p) => p.category && fromIds.includes(p.category.id));
  if (current && current.parentID !== parentID) await call("categories/delete", { categoryID: current.id });
  const { id } = await call<{ id: string }>("categories/create", { boardID: board.id, name, parentID, subscribeAdmins: false });
  catByName.set(name, { id, parentID });
  for (const p of moving) {
    await call("posts/change_category", { postID: p.id, categoryID: id });
    p.category = { id };
  }
}
for (const name of needTags) {
  const { id } = await call<{ id: string }>("tags/create", { boardID: board.id, name });
  tagIds.set(name, id);
}

let created = 0;
let updated = 0;
let detailsUpdated = 0;
const statusFallbacks: string[] = [];
const skipped: string[] = [];
const pulled: string[] = [];

async function setStatus(postID: string, status: string, t: Record<string, string>) {
  try {
    await call("posts/change_status", { changerID: admin.id, postID, status, shouldNotifyVoters: false });
  } catch (err) {
    // Some accounts don't expose every status (e.g. Backlog) to the API
    const fallback = status === "backlog" ? "under review" : "open";
    await call("posts/change_status", { changerID: admin.id, postID, status: fallback, shouldNotifyVoters: false });
    statusFallbacks.push(`${t["Ticket ID"]}: ${status} → ${fallback} (${(err as Error).message.slice(0, 80)})`);
  }
}
for (const { t, existing, status } of plan) {
  const details = [t.Details, t["Deployed On"] ? `Deployed: ${formatDate(t["Deployed On"])}` : ""].filter(Boolean).join("\n\n");
  let postID = existing?.id;
  if (!postID && NO_CREATE) {
    skipped.push(`${t["Ticket ID"]} ${t.Title}`);
    continue;
  }
  if (!postID) {
    const res = await call<{ id: string }>("posts/create", {
      authorID: admin.id,
      boardID: board.id,
      title: t.Title,
      details: details || t.Title, // Canny requires non-empty details
      categoryID: catByName.get(subName(t.Category))?.id,
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

  if (!existing) {
    if (status !== "open") await setStatus(postID!, status, t);
  } else if (existing.status !== status) {
    if (shouldPush(t["Ticket ID"])) await setStatus(postID!, status, t);
    else {
      // Changed in Canny: keep it, and record it in the CSV
      pulled.push(`${t["Ticket ID"]} ${t.Title}: ${t.Status} → ${LABEL_OF[existing.status] ?? existing.status}`);
      t.Status = LABEL_OF[existing.status] ?? t.Status;
    }
  }

  const wantCat = catByName.get(subName(t.Category))?.id;
  if (existing && wantCat && (existing as any).category?.id !== wantCat) {
    await call("posts/change_category", { postID, categoryID: wantCat });
  }

  const want = new Set(ticketTags(t));
  const have = new Set((existing?.tags ?? []).map((x) => x.name));
  for (const name of want) {
    if (!have.has(name)) await call("posts/add_tag", { postID, tagID: tagIds.get(name) });
  }
  for (const tag of existing?.tags ?? []) {
    if (!want.has(tag.name)) await call("posts/remove_tag", { postID, tagID: tag.id });
  }
  process.stdout.write(".");
}

console.log(`\nDone: ${created} created, ${updated} updated (${detailsUpdated} descriptions changed).`);
if (pulled.length) {
  writeCsv(tickets);
  console.log("Kept Canny's status and updated the CSV:\n  " + pulled.join("\n  "));
}
if (skipped.length) console.log("Not on Canny, left alone (--no-create):\n  " + skipped.join("\n  "));
if (statusFallbacks.length) console.log("Status fallbacks:\n  " + statusFallbacks.join("\n  "));
