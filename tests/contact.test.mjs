import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_ADDRESS,
  MAX_LENGTH,
  mailFor,
  readSubmission,
  withinLimit,
} from "../src/contact/form.ts";
import { MailConfigError, readMailConfig } from "../src/contact/config.ts";
import { createDesk } from "../src/contact/desk.ts";

const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

const VALID = {
  name: "  Ada Example ",
  email: "ada@example.org",
  organisation: "",
  message: "We run a meetup.\r\nCan you help?",
};

test("a complete form reads as trimmed values with no problems (R-CONTACT-3)", () => {
  const { values, problems, trapped } = readSubmission(form(VALID));
  assert.deepEqual(problems, {});
  assert.equal(trapped, false);
  assert.deepEqual(values, {
    name: "Ada Example",
    email: "ada@example.org",
    organisation: "",
    message: "We run a meetup.\nCan you help?",
  });
});

test("missing, malformed and overlong fields are each named (R-CONTACT-3)", () => {
  const { problems } = readSubmission(
    form({
      name: "",
      email: "not-an-address",
      organisation: "x".repeat(MAX_LENGTH.organisation + 1),
      message: "   ",
    }),
  );
  assert.match(problems.name, /name is missing/);
  assert.match(problems.email, /does not look like an address/);
  assert.match(problems.organisation, /longer than 160/);
  assert.match(problems.message, /message is missing/);
});

test("a line break in a one-line field is refused, so it cannot reach a header (R-CONTACT-3)", () => {
  const { problems } = readSubmission(
    form({ ...VALID, name: "Ada\nBcc: someone@example.org" }),
  );
  assert.match(problems.name, /one line/);
});

test("the trap field marks a submission as a robot's (R-CONTACT-4)", () => {
  assert.equal(
    readSubmission(form({ ...VALID, website: "https://spam" })).trapped,
    true,
  );
});

test("the mail goes to info@xigo.ch with the visitor as Reply-To (R-CONTACT-2)", () => {
  const mail = mailFor({
    name: "Ada Example",
    email: "ada@example.org",
    organisation: "Example Foundation",
    message: "Hello",
  });
  assert.equal(mail.to, CONTACT_ADDRESS);
  assert.equal(CONTACT_ADDRESS, "info@xigo.ch");
  assert.equal(mail.replyTo, "ada@example.org");
  assert.equal(mail.subject, "Contact from Ada Example, Example Foundation");
  assert.match(mail.text, /Organisation: Example Foundation\n\nHello\n/);
});

test("the hourly limit counts only sends inside the window (R-CONTACT-4)", () => {
  const hour = 3_600_000;
  assert.deepEqual(withinLimit([0, 10], hour + 5, 1, hour), {
    allowed: false,
    recent: [10],
  });
  assert.deepEqual(withinLimit([0, 10], hour + 11, 1, hour), {
    allowed: true,
    recent: [],
  });
});

test("a desk sends until the hour's limit, then holds back (R-CONTACT-4)", async () => {
  const sent = [];
  let now = 0;
  const desk = createDesk({
    send: async (mail) => void sent.push(mail),
    perHour: 2,
    now: () => now,
  });
  const values = readSubmission(form(VALID)).values;
  assert.equal(await desk.submit(values), "sent");
  assert.equal(await desk.submit(values), "sent");
  assert.equal(await desk.submit(values), "limited");
  now = 3_600_000;
  assert.equal(await desk.submit(values), "sent");
  assert.equal(sent.length, 3);
});

test("mails sent at the same moment share the hour's limit (R-CONTACT-4)", async () => {
  let release;
  const pending = new Promise((resolve) => (release = resolve));
  const desk = createDesk({
    send: () => pending,
    perHour: 1,
    now: () => 0,
  });
  const values = readSubmission(form(VALID)).values;
  const first = desk.submit(values);
  assert.equal(await desk.submit(values), "limited");
  release();
  assert.equal(await first, "sent");
});

test("a failed send is not counted against the limit", async () => {
  let fail = true;
  const desk = createDesk({
    send: async () => {
      if (fail) throw new Error("down");
    },
    perHour: 1,
    now: () => 0,
  });
  const values = readSubmission(form(VALID)).values;
  await assert.rejects(desk.submit(values));
  fail = false;
  assert.equal(await desk.submit(values), "sent");
});

const ENV = { SMTP_HOST: "mail.example.org", MAIL_FROM: "web@example.org" };

test("mail settings default to port 587 with STARTTLS and 20 mails an hour (R-RUN-3)", () => {
  assert.deepEqual(readMailConfig(ENV), {
    host: "mail.example.org",
    port: 587,
    secure: false,
    from: "web@example.org",
    perHour: 20,
  });
});

test("port 465 uses implicit TLS, and a login is passed on (R-RUN-3)", () => {
  const config = readMailConfig({
    ...ENV,
    SMTP_PORT: "465",
    SMTP_USER: "web@example.org",
    SMTP_PASSWORD: "secret",
    CONTACT_MAILS_PER_HOUR: "5",
  });
  assert.equal(config.secure, true);
  assert.deepEqual(config.auth, { user: "web@example.org", pass: "secret" });
  assert.equal(config.perHour, 5);
});

for (const [env, named] of [
  [{ MAIL_FROM: "web@example.org" }, /SMTP_HOST is not set/],
  [{ SMTP_HOST: "mail.example.org" }, /MAIL_FROM is not set/],
  [{ ...ENV, MAIL_FROM: "web" }, /MAIL_FROM must be an email address/],
  [{ ...ENV, SMTP_PORT: "0" }, /SMTP_PORT must be a positive whole number/],
  [{ ...ENV, CONTACT_MAILS_PER_HOUR: "many" }, /CONTACT_MAILS_PER_HOUR/],
  [{ ...ENV, SMTP_USER: "web" }, /SMTP_USER and SMTP_PASSWORD/],
]) {
  test(`an invalid mail setting is named: ${named.source} (R-RUN-3)`, () => {
    assert.throws(
      () => readMailConfig(env),
      (error) => error instanceof MailConfigError && named.test(error.message),
    );
  });
}
