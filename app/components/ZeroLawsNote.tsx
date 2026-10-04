import { ROADMAP_URL } from "@/lib/content-defaults";

/**
 * "0 became law" isn't "never passed a law". Explains why, and says what
 * we're doing about it: the official sites don't make this easy either.
 */
export function ZeroLawsNote({ chamber, compact = false }: { chamber: "senate" | "house"; compact?: boolean }) {
  return (
    <p className={`leading-relaxed text-gray-600 ${compact ? "text-xs" : "text-[13px]"}`}>
      <strong className="font-semibold text-gray-800">Zero here doesn’t mean they’ve never passed a law.</strong> We only count bills from this Congress
      that are already Republic Acts in our data.
      {chamber === "senate" && " When the Senate and House pass versions of the same bill, the law is usually recorded under the House bill, so senators rarely show up here."}{" "}
      Earlier congresses aren’t counted yet, and the official sites don’t make this easy to check either, so we’re building our own law tracker to make
      every lawmaker’s laws easy for anyone to see. Built by HelloJoal.{" "}
      <a href={ROADMAP_URL} target="_blank" rel="noreferrer" className="font-semibold text-navy-ink underline underline-offset-2">
        Follow its progress on our roadmap ↗
      </a>
    </p>
  );
}
