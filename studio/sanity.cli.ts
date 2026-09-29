import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // Hosted at https://civicsync.sanity.studio (you'll be asked to confirm on first deploy).
  studioHost: "civicsync",
});
