"use client";

import { useEffect, useState } from "react";

export type ThemeChoice = "system" | "light" | "dark";
export const THEME_KEY = "civicsync:theme";

/**
 * Runs in <head> before first paint (see layout.tsx) so the page never
 * flashes the wrong theme. Kept as a string: it can't import anything.
 */
export const themeScript = `(function(){try{var c=localStorage.getItem("${THEME_KEY}");var d=c==="dark"||(c!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const ORDER: ThemeChoice[] = ["system", "light", "dark"];
const LABEL: Record<ThemeChoice, string> = { system: "System", light: "Light", dark: "Dark" };
const ICON: Record<ThemeChoice, React.ReactNode> = {
  system: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  light: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
};

/**
 * One icon, styled like the social icons beside it. Shows the current
 * theme; each click moves System → Light → Dark. "System" follows the
 * phone or computer setting, live.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") setChoice(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (choice !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
  const cycle = () => {
    setChoice(next);
    apply(next);
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[choice]}. Switch to ${LABEL[next]}`}
      title={`Theme: ${LABEL[choice]} (click for ${LABEL[next]})`}
      className={`block text-gray-400 transition hover:text-navy-ink ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {ICON[choice]}
      </svg>
    </button>
  );
}
