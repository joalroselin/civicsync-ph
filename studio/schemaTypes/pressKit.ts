import { defineArrayMember, defineField, defineType } from "sanity";

export const pressKit = defineType({
  name: "pressKit",
  title: "Press kit",
  type: "document",
  fieldsets: [{ name: "boilerplate", title: "Descriptions", description: "Copy-ready text for journalists." }],
  fields: [
    defineField({ name: "oneLine", title: "One line", type: "text", rows: 2, fieldset: "boilerplate", validation: (r) => r.required().max(160) }),
    defineField({ name: "short", title: "Short (~50 words)", type: "text", rows: 4, fieldset: "boilerplate", validation: (r) => r.required() }),
    defineField({ name: "long", title: "Long (~140 words)", type: "text", rows: 8, fieldset: "boilerplate", validation: (r) => r.required() }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({ name: "question", type: "string", validation: (r) => r.required() }),
            defineField({ name: "answer", type: "text", rows: 4, validation: (r) => r.required() }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Press kit" }) },
});
