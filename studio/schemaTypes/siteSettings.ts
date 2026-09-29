import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "contactEmail",
      title: "Press / contact email",
      description: "Shown on the Press kit page. Leave empty to point people to GitHub instead.",
      type: "string",
      validation: (r) => r.email(),
    }),
    defineField({
      name: "homeSuggestions",
      title: "Home page search suggestions",
      description: "The quick-search chips under the search bar. Keep them short.",
      type: "array",
      of: [{ type: "string" }],
      validation: (r) => r.max(8),
    }),
    defineField({
      name: "stats",
      title: "Headline numbers",
      description: "Used on the About and Press pages. Update when the figures change.",
      type: "object",
      fields: [
        defineField({ name: "currentCongressBills", title: "Bills in the current Congress", type: "string", placeholder: "13,600+" }),
        defineField({ name: "totalRecords", title: "Total legislative records", type: "string", placeholder: "165,000+" }),
        defineField({ name: "asOf", title: "Figures as of", type: "date" }),
      ],
    }),
    defineField({
      name: "announcement",
      title: "Announcement banner",
      description: "An optional one-line banner shown at the top of every page.",
      type: "object",
      fields: [
        defineField({ name: "enabled", title: "Show the banner", type: "boolean", initialValue: false }),
        defineField({ name: "message", type: "string", validation: (r) => r.max(140) }),
        defineField({ name: "linkLabel", title: "Link text (optional)", type: "string" }),
        defineField({
          name: "linkUrl",
          title: "Link URL (optional)",
          type: "url",
          validation: (r) => r.uri({ allowRelative: true, scheme: ["http", "https"] }),
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
