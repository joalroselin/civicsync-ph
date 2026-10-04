import lawsFile from "@/data/laws.json";
import type { IrrInfo } from "./irr";
import { irrDue } from "./irr";

/** Republic Acts from the 20th Congress, read nightly by scripts/build-laws.mts (CS-129). */
export interface LawRecord {
  ra: string;
  bill: string;
  title: string;
  date: string | null;
  how: "enacted" | "lapsed";
  textUrl: string | null;
  effectivityDays: number | null;
  irr: IrrInfo | null;
  read: "ok" | "no-text" | "no-pdf";
  checkedAt: string;
}

const file = lawsFile as unknown as { generatedAt: string; laws: Record<string, LawRecord> };
export const lawsUpdated = file.generatedAt;
export const allLaws: LawRecord[] = Object.values(file.laws).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
export const getLaw = (ra: string) => file.laws[ra] ?? null;

export type IrrState = "overdue" | "due-soon" | "not-yet-due" | "no-deadline" | "no-irr-section" | "unread";

/** Deadline status. "Overdue" means past the estimated date; we don't yet know if the IRR came out. */
export function irrStatus(law: LawRecord, today = new Date().toISOString().slice(0, 10)): { state: IrrState; due: string | null } {
  if (law.read !== "ok") return { state: "unread", due: null };
  if (!law.irr) return { state: "no-irr-section", due: null };
  const due = law.date ? irrDue(law.date, law.effectivityDays, law.irr) : null;
  if (!due) return { state: "no-deadline", due: null };
  if (due < today) return { state: "overdue", due };
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  return { state: due <= soon ? "due-soon" : "not-yet-due", due };
}
