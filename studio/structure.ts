import type { StructureResolver } from "sanity/structure";
import { SINGLETONS } from "./schemaTypes";
import { INTAKE_KINDS } from "./schemaTypes/intakeSubmission";

/** Sidebar: an Inbox for form submissions, then one entry per singleton. */
export const structure: StructureResolver = (S) => {
  const inboxList = (title: string, filter: string, params: Record<string, string> = {}) =>
    S.documentList()
      .title(title)
      .schemaType("intakeSubmission")
      .filter(`_type == "intakeSubmission" && ${filter}`)
      .params(params)
      .defaultOrdering([{ field: "submittedAt", direction: "desc" }]);

  return S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Inbox")
        .id("inbox")
        .child(
          S.list()
            .title("Inbox")
            .items([
              S.listItem().title("New").id("inbox-new").child(inboxList("New", 'status == "new"')),
              ...INTAKE_KINDS.map((k) =>
                S.listItem().title(`${k.title}s`).id(`inbox-${k.value}`).child(inboxList(`${k.title}s`, "kind == $kind", { kind: k.value }))
              ),
              S.divider(),
              S.listItem().title("All").id("inbox-all").child(inboxList("All", "true")),
            ])
        ),
      S.divider(),
      ...SINGLETONS.map(({ id, title }) =>
        S.listItem().title(title).id(id).child(S.document().schemaType(id).documentId(id).title(title))
      ),
    ]);
};
