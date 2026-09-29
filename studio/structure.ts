import type { StructureResolver } from "sanity/structure";
import { SINGLETONS } from "./schemaTypes";

/** Sidebar with one entry per singleton instead of document lists. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items(
      SINGLETONS.map(({ id, title }) =>
        S.listItem().title(title).id(id).child(S.document().schemaType(id).documentId(id).title(title))
      )
    );
