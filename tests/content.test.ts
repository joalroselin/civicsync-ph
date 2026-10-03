import { describe, expect, it } from "vitest";
import { explainStatus, STAGES } from "@/lib/billStages";
import { citations } from "@/lib/cite";
import { GLOSSARY, lookupTerm } from "@/lib/glossary";
import { DEFAULT_SITE_SETTINGS } from "@/lib/content-defaults";

describe("explainStatus", () => {
  it.each([
    ["PENDING IN THE COMMITTEE", 1],
    ["Pending with the Committee on HEALTH since 2026-01-02", 1],
    ["Approved on Second Reading on 2026-09-30", 3],
    ["Business for the day on 2026-09-30", 2],
    ["Approved by the House on 2026-09-02, transmitted to the Senate", 4],
    ["ENROLLED COPY SENT TO MALACANANG", 6],
    ["Republic Act No. 12345", 7],
  ])("%s → step %i", (status, stage) => expect(explainStatus(status)?.stage).toBe(stage));
  it("has no step for bills that left the path", () => expect(explainStatus("CONSOLIDATED/SUBSTITUTED IN THE COMMITTEE REPORT")?.stage).toBeNull());
  it("returns null when there's no status", () => expect(explainStatus(null)).toBeNull());
});

describe("glossary", () => {
  it("defines every [[term]] used in the stages", () => {
    const terms = STAGES.flatMap((s) => [...s.body.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].map((m) => m[2] ?? m[1]));
    expect(terms.length).toBeGreaterThan(5);
    for (const t of terms) expect(lookupTerm(t), t).toBeTruthy();
  });
  it("keys are lowercase", () => Object.keys(GLOSSARY).forEach((k) => expect(k).toBe(k.toLowerCase())));
});

describe("citations", () => {
  const out = citations(
    { label: "SB 1294", chamber: "Senate", congress: 20, title: "The Magna Carta of Young Farmers", dateFiled: "2025-08-27", url: "https://example.ph/x" },
    "2026-10-03"
  );
  const by = Object.fromEntries(out.map((c) => [c.key, c.text]));
  it("offers each style", () => expect(Object.keys(by)).toEqual(["apa", "harvard", "mla", "chicago", "bibtex"]));
  it("APA", () => expect(by.apa).toBe("Senate of the Philippines. (2025). The Magna Carta of Young Farmers (Senate Bill No. 1294, 20th Congress). https://example.ph/x"));
  it("Harvard", () => expect(by.harvard).toContain("(Accessed: 3 October 2026)."));
  it("MLA", () => expect(by.mla).toContain("27 Aug. 2025") );
});

describe("non-partisan defaults", () => {
  it("home suggestions name no lawmakers or bill numbers", () => {
    for (const s of DEFAULT_SITE_SETTINGS.homeSuggestions) expect(s).not.toMatch(/^(SB|HB)\s?\d|hontiveros|tulfo|marcos|duterte/i);
  });
});
