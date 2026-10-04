import { describe, expect, it } from "vitest";
import { effectivityDays, findIrr, irrDue } from "@/lib/irr";

// Real OCR text from RA 12320
const RA12320 =
  "thereby raising awareness and fostering love of country, especially among the youth. SEC. 6. Implementing Rules and Regulations. — Within ninety (90) days from the effectivity of this Act, the PVAO, DND, DILG, DOH, and DepEd shall promulgate comprehensive implementing rules and regulations necessary to carry out the provisions of this Act. SEC. 7. Separability Clause. — If any provision of this Act is declared invalid… SEC. 9. Effectivity. — This Act shall take effect after fifteen (15) days following its publication in the Official Gazette or in a newspaper of general circulation in the Philippines.";

describe("IRR extraction", () => {
  it("finds agency, deadline and basis", () => {
    const irr = findIrr(RA12320)!;
    expect(irr.agency).toBe("the PVAO, DND, DILG, DOH, and DepEd");
    expect([irr.amount, irr.unit, irr.from]).toEqual([90, "days", "effectivity"]);
    expect(irr.clause).toMatch(/^Implementing Rules and Regulations/);
    expect(irr.clause).not.toMatch(/Separability/);
  });
  it("handles 'in consultation with' and months", () => {
    const irr = findIrr(
      "SEC. 20. Implementing Rules and Regulations. – The Department of Education, in consultation with the Commission on Higher Education, shall issue the implementing rules within six (6) months from the approval of this Act. SEC. 21."
    )!;
    expect(irr.agency).toBe("the Department of Education");
    expect([irr.amount, irr.unit, irr.from]).toEqual([6, "months", "approval"]);
  });
  it("returns null without an IRR section", () => expect(findIrr("SEC. 1. Short title. SEC. 2. Effectivity.")).toBeNull());
  it("reads effectivity", () => {
    expect(effectivityDays(RA12320)).toBe(15);
    expect(effectivityDays("This Act shall take effect immediately upon its publication")).toBe(0);
  });
  it("estimates the due date", () => {
    // law 2026-05-26 + 15 days effectivity + 90 days
    expect(irrDue("2026-05-26", 15, { amount: 90, unit: "days", from: "effectivity" })).toBe("2026-09-08");
    expect(irrDue("2026-05-26", 15, { amount: 6, unit: "months", from: "approval" })).toBe("2026-11-26");
  });
});

describe("IRR extraction, passive voice", () => {
  it("finds the agency after 'by'", () => {
    const irr = findIrr(
      "SEC. 12. Implementing Rules and Regulations. — Within sixty (60) days from the effectivity of this Act, the implementing rules and regulations (IRR) necessary for the effective and efficient enforcement of this Act shall be formulated, promulgated, and implemented by the UniFAST Board, in consultation with the CHED, TESDA, DepEd, DSWD, DBM, and other relevant stakeholders. SEC. 13."
    )!;
    expect(irr.agency).toBe("the UniFAST Board");
    expect([irr.amount, irr.unit, irr.from]).toEqual([60, "days", "effectivity"]);
  });
});
