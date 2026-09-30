/**
 * Intake forms on the Get involved page. Shared by the form (client) and
 * app/api/intake (server) so both validate the same way. Submissions are
 * stored as `intakeSubmission` documents in the private Sanity dataset.
 */
export type IntakeKind = "translator" | "partner" | "commercial";

export interface IntakeField {
  name: "name" | "email" | "organisation" | "languages" | "experience" | "availability" | "expectedUsers" | "message";
  label: string;
  type?: "text" | "email" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  max: number;
}

const NAME: IntakeField = { name: "name", label: "Your name", required: true, max: 120 };
const EMAIL: IntakeField = { name: "email", label: "Email", type: "email", required: true, max: 200 };
const ORG: IntakeField = { name: "organisation", label: "Organisation", required: true, max: 160 };

export const INTAKE_FORMS: Record<IntakeKind, { title: string; submitLabel: string; fields: IntakeField[] }> = {
  translator: {
    title: "Join the translator list",
    submitLabel: "Join the list",
    fields: [
      NAME,
      EMAIL,
      { name: "languages", label: "Language(s) you can translate into", placeholder: "e.g. Filipino, Cebuano", required: true, max: 200 },
      {
        name: "experience",
        label: "Your experience",
        type: "select",
        options: ["Native speaker", "Fluent", "Professional translator", "Student / learning"],
        required: true,
        max: 60,
      },
      { name: "availability", label: "Hours a month you could help (optional)", placeholder: "e.g. 2–4", max: 40 },
      { name: "message", label: "Anything else? (optional)", type: "textarea", max: 1500 },
    ],
  },
  partner: {
    title: "Partner with us",
    submitLabel: "Send",
    fields: [
      NAME,
      EMAIL,
      ORG,
      { name: "message", label: "What would you like to do together?", type: "textarea", required: true, max: 3000 },
    ],
  },
  commercial: {
    title: "Ask about a commercial licence",
    submitLabel: "Send enquiry",
    fields: [
      NAME,
      EMAIL,
      ORG,
      { name: "message", label: "What do you plan to build with CivicSync’s code?", type: "textarea", required: true, max: 3000 },
      { name: "expectedUsers", label: "Roughly how many users will it serve? (optional)", placeholder: "e.g. 5,000", max: 60 },
    ],
  },
};

export const isIntakeKind = (k: unknown): k is IntakeKind => typeof k === "string" && k in INTAKE_FORMS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns cleaned values or a field → error map. */
export function validateIntake(kind: IntakeKind, input: Record<string, unknown>) {
  const values: Partial<Record<IntakeField["name"], string>> = {};
  const errors: Partial<Record<IntakeField["name"], string>> = {};
  for (const f of INTAKE_FORMS[kind].fields) {
    const raw = typeof input[f.name] === "string" ? (input[f.name] as string).trim() : "";
    if (!raw) {
      if (f.required) errors[f.name] = "Required";
      continue;
    }
    if (raw.length > f.max) errors[f.name] = `Keep it under ${f.max} characters`;
    else if (f.type === "email" && !EMAIL_RE.test(raw)) errors[f.name] = "Enter a valid email";
    else if (f.options && !f.options.includes(raw)) errors[f.name] = "Choose an option";
    else values[f.name] = raw;
  }
  return { values, errors, ok: Object.keys(errors).length === 0 };
}
