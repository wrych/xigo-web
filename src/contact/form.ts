export const CONTACT_ADDRESS = "info@xigo.ch";

export const FIELDS = ["name", "email", "organisation", "message"] as const;
export type Field = (typeof FIELDS)[number];
export type Values = Record<Field, string>;
export type Problems = Partial<Record<Field, string>>;

/** The name of the hidden field only robots fill in. */
export const TRAP_FIELD = "website";

/** The most characters each field takes. */
export const MAX_LENGTH: Record<Field, number> = {
  name: 120,
  email: 254,
  organisation: 160,
  message: 5000,
};

export const EMPTY: Values = {
  name: "",
  email: "",
  organisation: "",
  message: "",
};

const LABEL: Record<Field, string> = {
  name: "Your name",
  email: "Your email",
  organisation: "The organisation",
  message: "Your message",
};

const SINGLE_LINE = /^[^\p{Cc}]*$/u;
const ADDRESS =
  /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/u;

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
}

function problemWith(field: Field, value: string): string | undefined {
  const required = field !== "organisation";
  if (required && value === "") return `${LABEL[field]} is missing.`;
  if (value.length > MAX_LENGTH[field])
    return `${LABEL[field]} is longer than ${MAX_LENGTH[field]} characters.`;
  if (field !== "message" && !SINGLE_LINE.test(value))
    return `${LABEL[field]} must fit on one line.`;
  if (field === "email" && !ADDRESS.test(value))
    return "Your email does not look like an address, such as name@example.org.";
  return undefined;
}

/** Reads a posted contact form: its trimmed values, a problem per invalid
 * field, and whether the trap field was filled. */
export function readSubmission(form: FormData): {
  values: Values;
  problems: Problems;
  trapped: boolean;
} {
  const values = { ...EMPTY };
  const problems: Problems = {};
  for (const field of FIELDS) {
    values[field] = text(form, field);
    const problem = problemWith(field, values[field]);
    if (problem) problems[field] = problem;
  }
  return { values, problems, trapped: text(form, TRAP_FIELD) !== "" };
}

export interface Mail {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

/** The mail a valid submission sends to xigo. */
export function mailFor(values: Values): Mail {
  const from = values.organisation
    ? `${values.name}, ${values.organisation}`
    : values.name;
  return {
    to: CONTACT_ADDRESS,
    replyTo: values.email,
    subject: `Contact from ${from}`,
    text: [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Organisation: ${values.organisation || "—"}`,
      "",
      values.message,
      "",
      "—",
      "Sent with the contact form on xigo.ch. Reply to answer.",
    ].join("\n"),
  };
}

/** Whether one more mail may leave at `now`, given when the last ones did,
 * and the send times still inside the window. */
export function withinLimit(
  sentAt: readonly number[],
  now: number,
  max: number,
  windowMs: number,
): { allowed: boolean; recent: number[] } {
  const recent = sentAt.filter((time) => now - time < windowMs);
  return { allowed: recent.length < max, recent };
}
