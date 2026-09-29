import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // Hosted at https://civicsync.sanity.studio
  studioHost: "civicsync",
  deployment: {
    // Lets `npm run deploy` update the same studio without prompting.
    appId: "rgixuqhsrehf833jfbia42t2",
  },
});
