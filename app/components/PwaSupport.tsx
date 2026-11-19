"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "civicsync:install-dismissed";

/** Registers the service worker and offers an install banner where supported. */
export function PwaSupport() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.error("SW registration failed", e));
    }

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDeferred(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 print:hidden px-4 md:inset-x-auto md:bottom-6 md:right-6 md:px-0">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl bg-surface p-3 pl-4 text-gray-900 shadow-lg ring-1 ring-gray-300 md:w-96">
        <p className="flex-1 text-sm">
          <span className="font-semibold text-navy-ink">Install CivicSync</span>
          <span className="block text-xs text-gray-600">Quick access, works offline.</span>
        </p>
        <button onClick={dismiss} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-navy-ink">
          Not now
        </button>
        <button
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            dismiss();
          }}
          className="rounded-lg bg-crimson px-3 py-2 text-sm font-semibold text-white hover:bg-red-900"
        >
          Install
        </button>
      </div>
    </div>
  );
}
