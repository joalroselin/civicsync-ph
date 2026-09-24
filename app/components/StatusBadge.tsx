import { statusTone, type StatusTone } from "@/lib/batasWatch";

const toneClasses: Record<StatusTone, string> = {
  law: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  moving: "bg-blue-50 text-navy ring-blue-200",
  committee: "bg-amber-50 text-amber-800 ring-amber-200",
  stalled: "bg-red-50 text-crimson ring-red-200",
  unknown: "bg-gray-100 text-gray-600 ring-gray-200",
};

export function StatusBadge({ status, size = "sm" }: { status: string | null; size?: "sm" | "md" }) {
  const tone = statusTone(status);
  const raw = status ?? "Status unavailable";
  // Senate statuses arrive in ALL CAPS; sentence-case them for readability.
  const full = raw === raw.toUpperCase() ? raw.charAt(0) + raw.slice(1).toLowerCase() : raw;
  // House statuses carry a "(Filed last 2026-09-09)" suffix — keep chips short.
  const text = size === "sm" ? full.replace(/\s*\(.*\)\s*$/, "") : full;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full ring-1 ring-inset ${toneClasses[tone]} ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"
      } font-medium`}
      title={full}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      <span className="truncate">{text}</span>
    </span>
  );
}
