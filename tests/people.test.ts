import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPerson, searchPeople, type OpenCongressPerson } from "@/lib/openCongress";
import { findLawmakers, getLawmakerRecord, loadLawmaker } from "@/lib/people";

vi.mock("@/lib/openCongress", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/openCongress")>(),
  getPerson: vi.fn(),
  searchPeople: vi.fn(),
}));

vi.mock("@/lib/authorIndex", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/authorIndex")>(),
  withProfiles: async (people: OpenCongressPerson[]) => people,
}));

const AQUINO = "01K5S6MAZ4YBST5GDJV827A0HM";

describe("lawmaker lookup", () => {
  beforeEach(() => {
    vi.mocked(getPerson).mockReset().mockRejectedValue(new Error("Open Congress unavailable"));
    vi.mocked(searchPeople).mockReset().mockRejectedValue(new Error("Open Congress unavailable"));
  });

  it("finds Bam Aquino by nickname and opens the saved profile during an outage", async () => {
    const matches = await findLawmakers("Bam Aquino");
    expect(matches.map((person) => person.id)).toEqual([AQUINO]);
    const profile = await loadLawmaker(matches[0].id);
    expect(profile?.full_name).toContain('"Bam" Aquino');
    expect(profile?.congresses_served?.map((term) => term.congress_number)).toContain(20);
    expect(profile?.profile?.officialProfileUrl).toContain("senate.gov.ph");
    expect(profile?.profile?.snapshotAsOf).toBeTruthy();
    expect(await getLawmakerRecord(profile!)).toMatchObject({
      totalOnRecord: expect.any(Number),
      snapshotAsOf: expect.any(String),
      current: { filed: expect.any(Number) },
    });
  });

  it("keeps live records and does not fabricate profiles for unknown IDs", async () => {
    const live = {
      id: AQUINO, first_name: "Paolo", last_name: "Aquino", middle_name: null,
      full_name: "Paolo Benigno Aquino IV", aliases: ["Bam"],
    };
    vi.mocked(getPerson).mockResolvedValueOnce(live);
    vi.mocked(searchPeople).mockResolvedValueOnce([live]);
    expect(await findLawmakers("Bam Aquino")).toEqual([live]);
    expect(await loadLawmaker(AQUINO)).toMatchObject(live);
    expect(await loadLawmaker("missing-person")).toBeNull();
    expect(await findLawmakers("zzzz-no-lookup")).toEqual([]);
  });
});
