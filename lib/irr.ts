/**
 * Reading a Republic Act's text (OCR'd, so imperfect) for:
 * - who must write its Implementing Rules and Regulations (IRR), and by when
 * - when the law takes effect
 * Pure functions; used by the nightly job (scripts/build-laws.mts) and tests.
 */
export interface IrrInfo {
  /** e.g. "the PVAO, DND, DILG, DOH, and DepEd" */
  agency: string | null;
  amount: number | null;
  unit: "days" | "months" | null;
  /** What the deadline counts from */
  from: "effectivity" | "approval" | null;
  /** The sentence(s) we read it from, for people to check */
  clause: string;
}

export function findIrr(raw: string): IrrInfo | null {
  const t = raw.replace(/\s+/g, " ");
  // The section usually starts "SEC. 6. Implementing Rules and Regulations. —"
  const start = t.search(/implementing rules and regulations\s*[.:]?\s*[—–-]/i);
  const at = start >= 0 ? start : t.search(/implementing rules/i);
  if (at < 0) return null;
  const rest = t.slice(at);
  const end = rest.slice(40).search(/\bSEC(TION)?\.?\s*\d+/i);
  const clause = rest.slice(0, end > 0 ? end + 40 : 700).trim().slice(0, 700);

  const period = clause.match(/(?:within|not later than|no later than)\s+(?:[a-z-]+\s+)?\((\d{1,3})\)\s*(days?|months?)/i) ?? clause.match(/\((\d{1,3})\)\s*(days?|months?)/i);
  const from = /from\s+(?:the\s+)?(?:date\s+of\s+)?(?:its\s+)?approval|after\s+(?:the\s+)?approval/i.test(clause)
    ? "approval"
    : /effectivity|take[s]?\s+effect/i.test(clause)
      ? "effectivity"
      : null;
  const verb = /\bshall,?\s+(?:[a-z ,]+?\s+)?(?:promulgate|issue|formulate|prepare|adopt|draft|craft|develop)\b/i;
  let agency: string | null = null;
  const vm = clause.match(verb);
  if (vm) {
    let before = clause.slice(0, vm.index).replace(/^implementing rules and regulations\s*[.:]?\s*[—–-]\s*/i, "");
    // Drop a leading deadline phrase: "Within ninety (90) days from the effectivity of this Act,"
    before = before.replace(/^(?:within|not later than|no later than)[^,]*?(?:this act|approval|effectivity)[^,]*,\s*/i, "");
    // Drop "in consultation with …" asides
    before = before.replace(/,?\s*in (?:close )?(?:consultation|coordination) with[^,]*(?:,|$)/i, "").trim().replace(/,$/, "");
    if (before.length > 3 && before.length < 220) agency = before.replace(/^the\s+/i, "the ");
  }
  return {
    agency,
    amount: period ? Number(period[1]) : null,
    unit: period ? (period[2].toLowerCase().startsWith("month") ? "months" : "days") : null,
    from,
    clause,
  };
}

/** "take effect fifteen (15) days after …" → 15; "immediately" → 0; unknown → null */
export function effectivityDays(raw: string): number | null {
  const t = raw.replace(/\s+/g, " ");
  const m = t.match(/take[s]?\s+effect[^.]{0,80}?\((\d{1,3})\)\s*days?/i);
  if (m) return Number(m[1]);
  return /take[s]?\s+effect\s+immediately/i.test(t) ? 0 : null;
}

/**
 * Estimated IRR due date. We don't know the publication date, so we assume
 * publication around the day it became law: an estimate, labelled as such.
 */
export function irrDue(lawDate: string, effDays: number | null, irr: Pick<IrrInfo, "amount" | "unit" | "from">): string | null {
  if (!irr.amount || !irr.unit) return null;
  const d = new Date(`${lawDate}T00:00:00Z`);
  if (irr.from !== "approval") d.setUTCDate(d.getUTCDate() + (effDays ?? 15));
  if (irr.unit === "days") d.setUTCDate(d.getUTCDate() + irr.amount);
  else d.setUTCMonth(d.getUTCMonth() + irr.amount);
  return d.toISOString().slice(0, 10);
}
