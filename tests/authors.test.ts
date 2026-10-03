import { describe, expect, it } from "vitest";
import { shortName } from "@/app/components/AuthorList";

describe("shortName", () => {
  it.each([
    ["Andrew Julian K. Romualdez", "Andrew Romualdez"],
    ['Julius Cesar "Jay" V. Vergara', "Julius Vergara"],
    ["Leila M. De Lima", "Leila De Lima"],
    ["Ricardo Jr. S. Cruz", "Ricardo Cruz Jr."],
    ["Emigdio III P. Tanjuatco", "Emigdio Tanjuatco III"],
    ["Atty. Miro S. Quimbo", "Miro Quimbo"],
    ["Brian Poe", "Brian Poe"],
  ])("%s → %s", (full, short) => expect(shortName(full)).toBe(short));
});

import { matchByName, parseCanonical } from "@/lib/authorMatch";

describe("author matching", () => {
  const people = [
    { id: "go1", first_name: "Christopher Lawrence", last_name: "Go", aliases: ["Bong"] },
    { id: "go2", first_name: "Ed Christopher", last_name: "Go", aliases: null },
    { id: "jinggoy", first_name: "Jose", last_name: "Ejercito-Estrada", aliases: ["Jinggoy"] },
    { id: "sotto", first_name: "Vicente", last_name: "Sotto", aliases: ["Tito"] },
    { id: "roman1", first_name: "Antonino", last_name: "Roman", aliases: null },
    { id: "roman2", first_name: "Antonino", last_name: "Roman", aliases: ["Tony"] },
    { id: "grace", first_name: "Grace", last_name: "Poe", aliases: null },
  ];
  it("parses suffixes and nicknames", () => expect(parseCanonical('SOTTO III, VICENTE C.')).toEqual({ surname: ["SOTTO"], given: ["VICENTE"], nick: [] }));
  it("picks the right Go by name and nickname", () => expect(matchByName('GO, CHRISTOPHER LAWRENCE "BONG" T.', people)?.id).toBe("go1"));
  it("matches hyphenated two-word surnames", () => expect(matchByName("EJERCITO ESTRADA, JINGGOY", people)?.id).toBe("jinggoy"));
  it("ignores suffixes", () => expect(matchByName("SOTTO III, VICENTE C.", people)?.id).toBe("sotto"));
  it("treats duplicate records as one person", () => expect(matchByName("ROMAN, ANTONINO III B.", people)?.id).toMatch(/roman/));
  it("never guesses a different person", () => expect(matchByName("POE, BRIAN", people)).toBeNull());
});
