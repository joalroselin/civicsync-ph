import type { IrrState } from "@/lib/laws";

const STYLE: Record<IrrState, { label: string; cls: string }> = {
  overdue: { label: "Past due (estimate)", cls: "bg-red-50 text-crimson-ink ring-red-200" },
  "due-soon": { label: "Due within 30 days", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  "not-yet-due": { label: "Not yet due", cls: "bg-blue-50 text-navy-ink ring-blue-200" },
  "no-deadline": { label: "No deadline set", cls: "bg-gray-100 text-gray-700 ring-gray-200" },
  "no-irr-section": { label: "No IRR required", cls: "bg-gray-100 text-gray-700 ring-gray-200" },
  unread: { label: "Not read yet", cls: "bg-gray-100 text-gray-700 ring-gray-200" },
};

export function IrrStatusBadge({ state }: { state: IrrState }) {
  const s = STYLE[state];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>{s.label}</span>;
}
