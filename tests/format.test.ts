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

describe("fixHomoglyphs", () => {
  it("replaces Cyrillic look-alikes in Latin titles", async () => {
    const { fixHomoglyphs } = await import("@/lib/format");
    expect(fixHomoglyphs("AN ACТ STRENGTHENING")).toBe("AN ACT STRENGTHENING");
    expect(toTitleCase("AN ACТ STRENGTHENING THE COAST GUARD")).toBe("An Act Strengthening the Coast Guard");
  });
  it("leaves fully Cyrillic text alone", async () => {
    const { fixHomoglyphs } = await import("@/lib/format");
    expect(fixHomoglyphs("Тест")).toBe("Тест");
  });
});

describe("suffixes", () => {
  it("doesn't double the period on Jr.", () => {
    expect(displayAuthorName("CRUZ, RICARDO JR. S.")).toBe("Ricardo Jr. S. Cruz");
    expect(displayAuthorName("TANJUATCO, EMIGDIO III P.")).toBe("Emigdio III P. Tanjuatco");
    expect(displayAuthorName("MOMO, ROMEO SR. S.")).toBe("Romeo Sr. S. Momo");
  });
});

describe("malformed author names", () => {
  it("treats a period after the surname as the comma", () => {
    expect(displayAuthorName("MADRONA. ELEANDRO JESUS F.")).toBe("Eleandro Jesus F. Madrona");
  });
});

describe("seatLabel", () => {
  it("labels party-list groups", async () => {
    const { seatLabel } = await import("@/lib/format");
    expect(seatLabel("4Ps")).toBe("4Ps (party-list)");
    expect(seatLabel("1-RIDER PARTYLIST")).toBe("1-RIDER (party-list)");
    expect(seatLabel("Manila, 6th District")).toBe("Manila, 6th District");
    expect(seatLabel(null)).toBeNull();
  });
});

describe("parseLaw", () => {
  it("reads both status formats and finds the signed text", async () => {
    const { parseLaw } = await import("@/lib/bills");
    expect(parseLaw("Republic Act RA12314 enacted on 2026-01-05", [{ label: "RA12314", url: "https://x/RA12314.pdf" }])).toEqual({
      ra: "12314", date: "2026-01-05", how: "enacted", textUrl: "https://x/RA12314.pdf",
    });
    expect(parseLaw("REPUBLIC ACT RA12324 (Lapsed into law on 2026-08-30)")).toEqual({ ra: "12324", date: "2026-08-30", how: "lapsed", textUrl: null });
    expect(parseLaw("PENDING IN THE COMMITTEE")).toBeNull();
  });
});

describe("displayStatus", () => {
  it("shortens laws and cleans caps", async () => {
    const { displayStatus } = await import("@/lib/format");
    expect(displayStatus("REPUBLIC ACT RA12324 (Lapsed into law on 2026-08-30)")).toBe("Became law · RA 12324");
    expect(displayStatus("PENDING IN THE COMMITTEE")).toBe("Pending in the committee");
    expect(displayStatus("Filed (Filed last 2026-09-09)")).toBe("Filed");
  });
});
