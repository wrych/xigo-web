/** How the contact form reaches the SMTP server, from the environment. */
export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
  perHour: number;
}

/** A missing or invalid setting; its message names the variable, never a
 * value. */
export class MailConfigError extends Error {}

const DEFAULT_PORT = 587;
const IMPLICIT_TLS_PORT = 465;
const DEFAULT_PER_HOUR = 20;

type Env = Record<string, string | undefined>;

function required(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new MailConfigError(`${name} is not set`);
  return value;
}

function wholeNumber(env: Env, name: string, fallback: number): number {
  const value = env[name]?.trim();
  if (!value) return fallback;
  if (!/^[1-9][0-9]*$/.test(value))
    throw new MailConfigError(`${name} must be a positive whole number`);
  return Number(value);
}

/** Reads and checks the mail settings; throws MailConfigError naming the
 * first one missing or invalid. */
export function readMailConfig(env: Env): MailConfig {
  const host = required(env, "SMTP_HOST");
  const port = wholeNumber(env, "SMTP_PORT", DEFAULT_PORT);
  const from = required(env, "MAIL_FROM");
  if (!/^[^\s@]+@[^\s@]+$/.test(from))
    throw new MailConfigError("MAIL_FROM must be an email address");
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASSWORD;
  if (Boolean(user) !== Boolean(pass))
    throw new MailConfigError(
      "SMTP_USER and SMTP_PASSWORD must be set together",
    );
  return {
    host,
    port,
    secure: port === IMPLICIT_TLS_PORT,
    ...(user && pass ? { auth: { user, pass } } : {}),
    from,
    perHour: wholeNumber(env, "CONTACT_MAILS_PER_HOUR", DEFAULT_PER_HOUR),
  };
}
