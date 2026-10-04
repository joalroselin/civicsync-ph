/**
 * Builds data/laws.json: every 20th Congress bill that became a Republic
 * Act, with its signed text link and, read from the law itself, who must
 * write its IRR and by when (CS-129).
 *
 *   node scripts/build-laws.mts      (needs `pdftoppm` and `tesseract`)
 *
 * Signed laws are scanned images, so each new law is OCR'd once and cached;
 * re-runs only process laws not seen before. Runs in the nightly job after
 * scripts/build-lawmakers.mts (which writes data/status/latest.json).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { effectivityDays, findIrr, type IrrInfo } from "../lib/irr.ts";

const BW = "https://bills.juris.ph/api";
const UA = "Mozilla/5.0 (compatible; CivicSyncPH/1.0; +https://civicsync-ph-gamma.vercel.app)";
const OUT = new URL("../data/laws.json", import.meta.url);
/** Bump when OCR settings or lib/irr.ts change, so laws are re-read. */
const PARSER = 2;
const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

const has = (cmd: string) => {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
if (!has("pdftoppm") || !has("tesseract")) {
  log("pdftoppm/tesseract not installed; skipping law reading.");
  process.exit(0);
}

interface Law {
  ra: string;
  bill: string;
  title: string;
  date: string | null;
  how: "enacted" | "lapsed";
  textUrl: string | null;
  effectivityDays: number | null;
  irr: IrrInfo | null;
  /** "ok" read fine; "no-text" OCR found nothing; "no-pdf" no accessible signed copy */
  read: "ok" | "no-text" | "no-pdf";
  checkedAt: string;
}

const laws: Record<string, Law> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).laws ?? {} : {};
const latest = JSON.parse(readFileSync(new URL("../data/status/latest.json", import.meta.url), "utf8"));
const enacted = Object.entries(latest.bills as Record<string, { s: string }>).filter(([, b]) => /republic act/i.test(b.s));
log(`${enacted.length} bills are law; ${Object.keys(laws).length} already read`);

async function measure(number: string) {
  const j = await fetch(`${BW}/measures?q=${encodeURIComponent(number)}`, { signal: AbortSignal.timeout(20_000) }).then((r) => r.json());
  return (j.items ?? []).find((m: any) => m.number === number);
}

function ocr(pdf: Buffer): string {
  const dir = mkdtempSync(join(tmpdir(), "ra-"));
  try {
    writeFileSync(join(dir, "law.pdf"), pdf);
    // 200 dpi greyscale is plenty for typed text.
    execFileSync("pdftoppm", ["-r", "200", "-gray", "-png", join(dir, "law.pdf"), join(dir, "p")], { stdio: "ignore", timeout: 240_000 });
    return readdirSync(dir)
      .filter((f) => f.startsWith("p") && f.endsWith(".png"))
      .sort()
      .map((f) => execFileSync("tesseract", [join(dir, f), "-", "-l", "eng", "--psm", "3"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 120_000 }))
      .join("\n");
    // psm 3 = automatic layout: reads two-column pages column by column.
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

for (const [number, b] of enacted) {
  const ra = b.s.match(/(\d{4,6})/)?.[1];
  // Re-read laws parsed by an older version of the reader.
  if (!ra || (laws[ra]?.read === "ok" && (laws[ra] as any).parser === PARSER)) continue;
  const m = await measure(number).catch(() => null);
  if (!m) continue;
  const doc = (m.documentVersions ?? []).find((d: any) => new RegExp(`^RA\\s*0*${ra}$`, "i").test((d.label ?? "").trim()));
  const base: Omit<Law, "effectivityDays" | "irr" | "read"> = {
    ra,
    bill: number,
    title: m.title ?? m.longTitle ?? "",
    date: b.s.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null,
    how: /lapsed/i.test(b.s) ? "lapsed" : "enacted",
    textUrl: doc?.url ?? null,
    checkedAt: new Date().toISOString().slice(0, 10),
  };
  const res = doc ? await fetch(doc.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(120_000) }).catch(() => null) : null;
  if (!res?.ok) {
    laws[ra] = { ...base, textUrl: null, effectivityDays: null, irr: null, read: "no-pdf" };
    log(`RA ${ra}: no accessible signed copy`);
    continue;
  }
  const text = ocr(Buffer.from(await res.arrayBuffer()));
  const irr = findIrr(text);
  laws[ra] = { ...base, effectivityDays: effectivityDays(text), irr, read: text.trim().length > 200 ? "ok" : "no-text", parser: PARSER } as Law;
  log(`RA ${ra}: ${text.length} chars; IRR ${irr ? `${irr.agency ?? "?"} · ${irr.amount ?? "?"} ${irr.unit ?? ""} from ${irr.from ?? "?"}` : "none found"}`);
}

writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), laws }, null, 1) + "\n");
log(`Wrote ${Object.keys(laws).length} laws`);
