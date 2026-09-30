import { defineField, defineType } from "sanity";

export const INTAKE_KINDS = [
  { title: "Translator", value: "translator" },
  { title: "Partnership", value: "partner" },
  { title: "Commercial licence", value: "commercial" },
] as const;

/** Submitted from forms on the Get involved page (app/api/intake). Private dataset. */
export const intakeSubmission = defineType({
  name: "intakeSubmission",
  title: "Inbox submission",
  type: "document",
  fields: [
    defineField({
      name: "status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Contacted", value: "contacted" },
          { title: "Done", value: "done" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "new",
    }),
    defineField({ name: "kind", type: "string", options: { list: [...INTAKE_KINDS] }, readOnly: true }),
    defineField({ name: "name", type: "string", readOnly: true }),
    defineField({ name: "email", type: "string", readOnly: true }),
    defineField({ name: "organisation", type: "string", readOnly: true }),
    defineField({ name: "languages", title: "Languages", type: "string", readOnly: true }),
    defineField({ name: "experience", type: "string", readOnly: true }),
    defineField({ name: "availability", title: "Hours a month", type: "string", readOnly: true }),
    defineField({ name: "expectedUsers", title: "Expected users", type: "string", readOnly: true }),
    defineField({ name: "message", type: "text", rows: 6, readOnly: true }),
    defineField({ name: "notes", title: "Your notes (private)", type: "text", rows: 3 }),
    defineField({ name: "submittedAt", type: "datetime", readOnly: true }),
  ],
  orderings: [{ title: "Newest first", name: "newest", by: [{ field: "submittedAt", direction: "desc" }] }],
  preview: {
    select: { name: "name", org: "organisation", kind: "kind", status: "status", at: "submittedAt" },
    prepare: ({ name, org, kind, status, at }) => ({
      title: [name, org].filter(Boolean).join(" · ") || "Submission",
      subtitle: [
        INTAKE_KINDS.find((k) => k.value === kind)?.title,
        status === "new" ? "● New" : status,
        at && new Date(at).toLocaleDateString(),
      ]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
