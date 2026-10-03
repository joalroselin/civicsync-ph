import { lookupTerm } from "@/lib/glossary";
import { Term } from "./Term";

/** Renders text with [[term]] or [[shown text|term]] marks as tappable definitions. */
export function GlossaryText({ text }: { text: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
        if (!m) return part;
        const definition = lookupTerm(m[2] ?? m[1]);
        return definition ? (
          <Term key={i} definition={definition}>
            {m[1]}
          </Term>
        ) : (
          m[1]
        );
      })}
    </>
  );
}
