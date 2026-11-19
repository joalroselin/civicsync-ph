"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Ctrl+/ jumps to search from anywhere: focuses the page's search box, or
 * opens Receipts if the page has none. Ignored while typing in a field.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || !e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || t.closest("input, textarea, select, dialog[open]"))) return;
      e.preventDefault();
      const box = document.querySelector<HTMLInputElement>('form[role="search"] input');
      if (box) {
        box.focus();
        box.select();
      } else router.push("/receipts");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
