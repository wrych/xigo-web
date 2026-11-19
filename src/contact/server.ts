import nodemailer from "nodemailer";
import { MailConfigError, readMailConfig, type MailConfig } from "./config";
import { createDesk, type Desk } from "./desk";
import type { Mail } from "./form";

function smtpSender(config: MailConfig): (mail: Mail) => Promise<void> {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  return async (mail) => {
    await transport.sendMail({ from: config.from, ...mail });
  };
}

let desk: Desk | null | undefined;

/** The server's one desk, built from the environment on first use; null,
 * after logging which setting is wrong, when the mail settings are invalid. */
export function serverDesk(): Desk | null {
  if (desk !== undefined) return desk;
  try {
    const config = readMailConfig(process.env);
    desk = createDesk({
      send: smtpSender(config),
      perHour: config.perHour,
      now: Date.now,
    });
  } catch (error) {
    if (!(error instanceof MailConfigError)) throw error;
    console.error(`contact: ${error.message}; the form is not offered`);
    desk = null;
  }
  return desk;
}

/** Logs that a mail failed, naming only the error's code: its message can
 * carry the visitor's address. */
export function logSendFailure(error: unknown): void {
  const { code, responseCode } = (error ?? {}) as {
    code?: unknown;
    responseCode?: unknown;
  };
  console.error(
    `contact: the mail could not be sent (${String(code ?? "unknown")}${
      responseCode ? ` ${String(responseCode)}` : ""
    })`,
  );
}
