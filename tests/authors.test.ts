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
