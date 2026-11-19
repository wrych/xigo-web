import { mailFor, withinLimit, type Mail, type Values } from "./form.ts";

const HOUR_MS = 60 * 60 * 1000;

/** Sends a contact mail, or keeps it back once the hour's limit is met. */
export interface Desk {
  submit(values: Values): Promise<"sent" | "limited">;
}

/** A desk sending with `send`, at most `perHour` mails an hour by `now`. */
export function createDesk(deps: {
  send: (mail: Mail) => Promise<void>;
  perHour: number;
  now: () => number;
}): Desk {
  let sentAt: number[] = [];
  return {
    async submit(values) {
      const now = deps.now();
      const { allowed, recent } = withinLimit(
        sentAt,
        now,
        deps.perHour,
        HOUR_MS,
      );
      sentAt = recent;
      if (!allowed) return "limited";
      sentAt.push(now);
      try {
        await deps.send(mailFor(values));
      } catch (error) {
        sentAt.splice(sentAt.lastIndexOf(now), 1);
        throw error;
      }
      return "sent";
    },
  };
}
