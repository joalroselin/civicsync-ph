import { describe, expect, it } from "vitest";
import { toTitleCase } from "@/lib/format";
import { parseBillNumber } from "@/lib/openCongress";
import { fromBatasWatchNumber, toBatasWatchNumber, displayAuthorName, statusTone, authoredBy, type BatasWatchMeasure } from "@/lib/batasWatch";

describe("parseBillNumber", () => {
  it.each([
    ["SB 1294", { subtype: "SB", number: 1294 }],
    ["sbn-01294", { subtype: "SB", number: 1294 }],
    ["hb4659", { subtype: "HB", number: 4659 }],
    ["H.B. 12", { subtype: "HB", number: 12 }],
  ])("reads %s", (q, want) => expect(parseBillNumber(q)).toEqual(want));
  it("ignores topics", () => expect(parseBillNumber("rice")).toBeNull());
});

describe("BatasWatch numbers", () => {
  it("round-trips Senate and House formats", () => {
    expect(toBatasWatchNumber("SB", 1294)).toBe("SBN-1294");
    expect(toBatasWatchNumber("HB", 4659)).toBe("HB04659");
    expect(fromBatasWatchNumber("HB04659")).toEqual({ subtype: "HB", number: 4659 });
    expect(fromBatasWatchNumber("SBN-1294")).toEqual({ subtype: "SB", number: 1294 });
  });
});

describe("toTitleCase", () => {
  it("converts shouting titles, keeping acronyms", () => {
    expect(toTitleCase("AN ACT STRENGTHENING THE DOH AND DEPED")).toBe("An Act Strengthening the DOH and DEPED");
  });
  it("converts mostly-caps titles with a stray lowercase word", () => {
    expect(toTitleCase("AN ACT GRANTING SOUTHEAST ASIAN AIRLINES (SEAir), INC. A FRANCHISE")).toMatch(/^An Act Granting Southeast/);
  });
  it("leaves normal titles alone", () => expect(toTitleCase("The Magna Carta of Young Farmers")).toBe("The Magna Carta of Young Farmers"));
});

describe("authors", () => {
  it("formats surname-first names", () => expect(displayAuthorName("HONTIVEROS, RISA")).toBe("Risa Hontiveros"));
  it("keeps lawmakers who share a surname apart", () => {
    const m = { authorCredits: [{ name: "TULFO, ERWIN T." }] } as BatasWatchMeasure;
    expect(authoredBy(m, { surname: "Tulfo", givenNames: ["Erwin"] })).toBe(true);
    expect(authoredBy(m, { surname: "Tulfo", givenNames: ["Raffy"] })).toBe(false);
  });
});

describe("statusTone", () => {
  it.each([
    ["PENDING IN THE COMMITTEE", "committee"],
    ["Approved on Third Reading on 2026-09-08", "moving"],
    ["Republic Act No. 12345", "law"],
    ["WITHDRAWN", "stalled"],
    [null, "unknown"],
  ])("%s → %s", (s, tone) => expect(statusTone(s)).toBe(tone));
});
