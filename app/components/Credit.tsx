const REPO_URL = "https://github.com/joalroselin/civicsync-ph";

/** "Built by HelloJoal". The AI note is shown only where `showAiCredit` is set (the sidebar). */
export function Credit({ className = "", showAiCredit = false }: { className?: string; showAiCredit?: boolean }) {
  return (
    <p className={`text-[11px] text-gray-400 ${className}`}>
      Built by{" "}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-navy-ink hover:decoration-navy-ink"
      >
        HelloJoal
      </a>
      {showAiCredit && " · assisted by AI"}
    </p>
  );
}
