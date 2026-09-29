import { aboutPage } from "./aboutPage";
import { getInvolvedPage } from "./getInvolvedPage";
import { pressKit } from "./pressKit";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [siteSettings, aboutPage, getInvolvedPage, pressKit];

/** One document each, with a fixed ID the app reads by. */
export const SINGLETONS = [
  { id: "siteSettings", title: "Site settings" },
  { id: "aboutPage", title: "About page" },
  { id: "getInvolvedPage", title: "Get involved page" },
  { id: "pressKit", title: "Press kit" },
] as const;
