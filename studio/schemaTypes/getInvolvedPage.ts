import { defineArrayMember, defineField, defineType } from "sanity";

export const getInvolvedPage = defineType({
  name: "getInvolvedPage",
  title: "Get involved page",
  type: "document",
  fields: [
    defineField({ name: "kicker", title: "Small heading", type: "string", initialValue: "Bayanihan" }),
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "intro", type: "text", rows: 3, validation: (r) => r.required().max(320) }),
    defineField({
      name: "ways",
      title: "Ways to help",
      description: "Shown as cards in this order. Mark one “Coming soon” to show it without a button.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "way",
          fields: [
            defineField({ name: "title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "description", type: "text", rows: 3, validation: (r) => r.required() }),
            defineField({ name: "effort", title: "Time needed", type: "string", placeholder: "5 minutes" }),
            defineField({
              name: "icon",
              type: "string",
              options: {
                list: [
                  { title: "Megaphone (share)", value: "megaphone" },
                  { title: "Flag (report)", value: "flag" },
                  { title: "Lightbulb (ideas)", value: "lightbulb" },
                  { title: "Language (translate)", value: "language" },
                  { title: "Code (build)", value: "code" },
                  { title: "Handshake (partner)", value: "handshake" },
                  { title: "Briefcase (business)", value: "briefcase" },
                ],
              },
              initialValue: "lightbulb",
            }),
            defineField({
              name: "action",
              title: "Button does",
              type: "string",
              options: {
                list: [
                  { title: "Opens an email", value: "email" },
                  { title: "Opens a link", value: "link" },
                  { title: "Shares CivicSync", value: "share" },
                ],
                layout: "radio",
              },
              initialValue: "email",
              validation: (r) => r.required(),
            }),
            defineField({ name: "buttonLabel", title: "Button text", type: "string", validation: (r) => r.required() }),
            defineField({
              name: "emailSubject",
              title: "Email subject",
              description: "Pre-filled so you can sort offers in your inbox.",
              type: "string",
              hidden: ({ parent }) => parent?.action !== "email",
            }),
            defineField({
              name: "url",
              title: "Link",
              type: "url",
              validation: (r) => r.uri({ allowRelative: true, scheme: ["http", "https"] }),
              hidden: ({ parent }) => parent?.action !== "link",
            }),
            defineField({ name: "comingSoon", title: "Coming soon", type: "boolean", initialValue: false }),
          ],
          preview: {
            select: { title: "title", effort: "effort", soon: "comingSoon" },
            prepare: ({ title, effort, soon }) => ({ title, subtitle: [effort, soon && "Coming soon"].filter(Boolean).join(" · ") }),
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Get involved page" }) },
});
