import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes, SINGLETONS } from "./schemaTypes";
import { structure } from "./structure";

const singletonIds = new Set(SINGLETONS.map((s) => s.id));

export default defineConfig({
  name: "default",
  title: "CivicSync PH",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Singletons are edited, never created from the "+" menu.
    templates: (templates) => templates.filter((t) => !singletonIds.has(t.schemaType)),
  },
  document: {
    // No duplicate/delete on singletons, so the app always finds them.
    actions: (actions, { schemaType }) =>
      singletonIds.has(schemaType)
        ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : actions,
  },
});
