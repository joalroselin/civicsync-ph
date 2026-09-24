export function Logo({ size = 22, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill={inverted ? "white" : "#1E3A8A"} />
      <path d="M9 11h14M9 16h14M9 21h9" stroke={inverted ? "#1E3A8A" : "white"} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="23" cy="21" r="3" fill="#991B1B" />
    </svg>
  );
}
