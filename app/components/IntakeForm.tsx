"use client";

import { useRef, useState } from "react";
import { INTAKE_FORMS, type IntakeField, type IntakeKind } from "@/lib/intake";

/**
 * Inline form on a Get involved card. Posts to /api/intake, which stores the
 * submission privately in Sanity (Studio → Inbox).
 */
export function IntakeForm({
  kind,
  label,
  buttonClassName,
  email,
}: {
  kind: IntakeKind;
  label: string;
  buttonClassName: string;
  email: string;
}) {
  const form = INTAKE_FORMS[kind];
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<IntakeField["name"], string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const startedAt = useRef(0);

  const openForm = () => {
    startedAt.current = Date.now();
    setOpen(true);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    setMessage(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, kind, startedAt: startedAt.current }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setState("sent");
        return;
      }
      if (json.errors) setErrors(json.errors);
      setMessage(json.error ?? (json.errors ? "Please check the highlighted fields." : "Something went wrong. Please try again."));
      setState("error");
    } catch {
      setMessage("Couldn’t reach the server. Check your connection and try again.");
      setState("error");
    }
  }

  if (!open) {
    return (
      <button type="button" className={buttonClassName} onClick={openForm}>
        {label}
      </button>
    );
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
        <p className="font-semibold">Salamat! We’ve got it.</p>
        <p className="mt-1">We’ll reply to the email you gave us.</p>
      </div>
    );
  }

  const input =
    "mt-1 w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy";

  return (
    <form onSubmit={submit} noValidate className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
      <p className="font-display text-base font-semibold text-gray-900">{form.title}</p>
      <div className="mt-3 space-y-3">
        {form.fields.map((f) => {
          const id = `${kind}-${f.name}`;
          const err = errors[f.name];
          return (
            <div key={f.name}>
              <label htmlFor={id} className="block text-xs font-semibold text-gray-700">
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea id={id} name={f.name} rows={4} maxLength={f.max} required={f.required} placeholder={f.placeholder} className={input} aria-invalid={!!err} />
              ) : f.type === "select" ? (
                <select id={id} name={f.name} required={f.required} defaultValue="" className={input} aria-invalid={!!err}>
                  <option value="" disabled>
                    Choose one
                  </option>
                  {f.options!.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  name={f.name}
                  type={f.type ?? "text"}
                  maxLength={f.max}
                  required={f.required}
                  placeholder={f.placeholder}
                  autoComplete={f.name === "name" ? "name" : f.name === "email" ? "email" : f.name === "organisation" ? "organization" : "off"}
                  className={input}
                  aria-invalid={!!err}
                />
              )}
              {err && <p className="mt-1 text-xs font-semibold text-crimson">{err}</p>}
            </div>
          );
        })}
        {/* Honeypot: hidden from people, often filled by bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
        We’ll only use this to reply to you about this request. It’s stored privately and deleted on request.
      </p>
      {message && (
        <p role="alert" className="mt-2 text-xs font-semibold text-crimson">
          {message}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === "sending"} className={`${buttonClassName} disabled:opacity-60`}>
          {state === "sending" ? "Sending…" : form.submitLabel}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
          Cancel
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Prefer email?{" "}
        <a href={`mailto:${email}?subject=${encodeURIComponent(form.title + ": CivicSync PH")}`} className="font-semibold text-navy underline">
          {email}
        </a>
      </p>
    </form>
  );
}
