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
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-4">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-gray-900 p-3 pl-4 text-white shadow-lg">
        <p className="flex-1 text-sm">
          <span className="font-semibold">Install CivicSync</span>
          <span className="block text-xs text-gray-300">Quick access, works offline.</span>
        </p>
        <button onClick={dismiss} className="rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white">
          Not now
        </button>
        <button
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            dismiss();
          }}
          className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-navy"
        >
          Install
        </button>
      </div>
    </div>
  );
}
