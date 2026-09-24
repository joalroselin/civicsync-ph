const REPO_URL = "https://github.com/joalroselin/civicsync-ph";

export function Credit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-gray-400 ${className}`}>
      Built by{" "}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-navy hover:decoration-navy"
      >
        HelloJoal
      </a>{" "}
      · assisted by AI
    </p>
  );
}
