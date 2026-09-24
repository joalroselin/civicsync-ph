export function Credit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-gray-400 ${className}`}>
      Built by <span className="font-semibold text-gray-500">HelloJoal</span> · assisted by AI
    </p>
  );
}
