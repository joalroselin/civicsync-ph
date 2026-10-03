/**
 * Roadmap helper: edit docs/roadmap-canny.csv and sync just that change to
 * Canny in one step. Canny stays the source of truth for every other ticket.
 *
 *   npm run roadmap -- CS-119 "In Progress"       # set a status
 *   npm run roadmap -- CS-119 deployed            # Complete + Deployed tag + today's date
 *   npm run roadmap -- add "Title" "Details" Category [Status]   # new ticket, next free ID
 *   npm run roadmap -- tidy                       # drop the Deployed tag after 30 days
 *   npm run roadmap -- list [status]              # print tickets
 *
 * Add --dry to preview without touching Canny. Needs CANNY_API_KEY (the npm
 * script loads .env.local; in GitHub Actions it comes from a secret).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CSV = new URL("../docs/roadmap-canny.csv", import.meta.url);
const STATUSES = ["Open", "Planned", "In Progress", "Complete", "Closed"];
const DEPLOYED_DAYS = 30;
const args = process.argv.slice(2).filter((a) => a !== "--dry");
const DRY = process.argv.includes("--dry");
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

// --- CSV --------------------------------------------------------------------
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") row.push(field), (field = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field), rows.push(row), (row = []), (field = "");
    } else field += c;
  }
  if (field || row.length) row.push(field), rows.push(row);
  const [h, ...b] = rows.filter((r) => r.some(Boolean));
  return b.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}
const cols = ["Ticket ID", "Title", "Details", "Status", "Category", "Tags", "Deployed On"];
const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const read = () => parseCsv(readFileSync(CSV, "utf8"));
const write = (rows: Record<string, string>[]) =>
  writeFileSync(CSV, [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c] ?? "")).join(","))].join("\n") + "\n");
const tags = (r: Record<string, string>) => r.Tags.split(";").filter(Boolean);

// --- Canny ------------------------------------------------------------------
function sync(pushIds: string[], create = false) {
  if (DRY) return console.log(`(dry run) would sync ${pushIds.join(", ") || "descriptions/tags"} to Canny`);
  const flags = ["--apply", ...(create ? [] : ["--no-create"]), ...(pushIds.length ? [`--push-status=${pushIds.join(",")}`] : [])];
  execFileSync(process.execPath, ["scripts/canny-sync.mts", ...flags], { stdio: "inherit" });
}

// --- Commands ---------------------------------------------------------------
const [cmd, ...rest] = args;
const rows = read();
const find = (id: string) => {
  const r = rows.find((x) => x["Ticket ID"].toUpperCase() === id.toUpperCase());
  if (!r) throw new Error(`No ticket ${id}`);
  return r;
};

if (!cmd || cmd === "help") {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("*/")[0]);
} else if (cmd === "list") {
  const want = rest.join(" ");
  for (const r of rows.filter((r) => !want || r.Status.toLowerCase() === want.toLowerCase()))
    console.log(`${r["Ticket ID"].padEnd(7)} ${r.Status.padEnd(12)} ${r.Title}${r["Deployed On"] ? `  (deployed ${r["Deployed On"]})` : ""}`);
} else if (cmd === "add") {
  const [title, details = "", category = "", status = "Open"] = rest;
  if (!title || !STATUSES.includes(status)) throw new Error('Usage: add "Title" "Details" Category [Open|Planned|In Progress]');
  // Next free number in the 1xx feature range.
  const next = Math.max(...rows.map((r) => Number(r["Ticket ID"].slice(3))).filter((n) => n >= 100 && n < 200)) + 1;
  const id = `CS-${next}`;
  rows.push({ "Ticket ID": id, Title: title, Details: details, Status: status, Category: category, Tags: "", "Deployed On": "" });
  write(rows);
  console.log(`Added ${id}: ${title} (${status})`);
  sync([], true);
} else if (cmd === "tidy") {
  // Deployed tag = shipped in the last 30 days; older ones stay Complete without it.
  const cutoff = new Date(Date.now() - DEPLOYED_DAYS * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const aged = rows.filter((r) => tags(r).includes("Deployed") && r["Deployed On"] && r["Deployed On"] < cutoff);
  for (const r of aged) r.Tags = tags(r).filter((t) => t !== "Deployed").join(";");
  if (!aged.length) console.log("Nothing to tidy.");
  else {
    write(rows);
    console.log(`Removed the Deployed tag from ${aged.length} ticket(s) shipped before ${cutoff}:\n  ${aged.map((r) => r["Ticket ID"]).join(", ")}`);
    sync([]);
  }
} else if (/^CS-\d+$/i.test(cmd)) {
  const r = find(cmd);
  const arg = rest.join(" ");
  if (arg.toLowerCase() === "deployed") {
    r.Status = "Complete";
    r.Tags = [...new Set([...tags(r), "Deployed"])].join(";");
    r["Deployed On"] = today;
  } else {
    const status = STATUSES.find((s) => s.toLowerCase() === arg.toLowerCase());
    if (!status) throw new Error(`Status must be one of: ${STATUSES.join(", ")}, or "deployed"`);
    r.Status = status;
  }
  write(rows);
  console.log(`${r["Ticket ID"]} ${r.Title} → ${r.Status}${r["Deployed On"] === today ? ` (deployed ${today})` : ""}`);
  sync([r["Ticket ID"]]);
} else {
  throw new Error(`Unknown command "${cmd}". Run: npm run roadmap -- help`);
}
