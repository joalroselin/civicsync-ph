"use client";

import { useEffect, useState } from "react";
import { disablePush, enablePush, pushEnabled, pushSupported } from "@/lib/pushClient";

/** "Notify me when these bills move" (CS-201). Browser push; no account. */
export function NotifyToggle({ bills }: { bills: string[] }) {
  const [state, setState] = useState<"unsupported" | "off" | "on" | "busy" | "denied">("off");
  const [installHint, setInstallHint] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      // iPhone/iPad: push works only for the app installed to the Home Screen.
      setInstallHint(/iphone|ipad/i.test(navigator.userAgent));
      return setState("unsupported");
    }
    setState(Notification.permission === "denied" ? "denied" : pushEnabled() ? "on" : "off");
  }, []);

  if (state === "unsupported")
    return installHint ? (
      <p className="text-xs text-gray-600">To get notified when these bills move, add CivicSync to your Home Screen (Share → Add to Home Screen), then open it from there.</p>
    ) : null;

  const toggle = async () => {
    setState("busy");
    try {
      if (pushEnabled()) {
        await disablePush();
        setState("off");
      } else setState((await enablePush(bills)) ? "on" : Notification.permission === "denied" ? "denied" : "off");
    } catch {
      setState(pushEnabled() ? "on" : "off");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">{state === "on" ? "Notifications on" : "Get notified when these bills move"}</p>
        <p className="text-xs text-gray-600">
          {state === "denied"
            ? "Notifications are blocked for this site in your browser settings."
            : "We check every bill daily. Only this device’s push address and the bills you follow are stored, with no name or email."}
        </p>
      </div>
      {state !== "denied" && (
        <button
          type="button"
          onClick={toggle}
          disabled={state === "busy" || bills.length === 0}
          aria-pressed={state === "on"}
          className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold disabled:opacity-60 ${state === "on" ? "bg-surface text-navy-ink ring-1 ring-gray-200" : "bg-navy text-white"}`}
        >
          {state === "busy" ? "…" : state === "on" ? "Turn off" : "Notify me"}
        </button>
      )}
    </div>
  );
}
