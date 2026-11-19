import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { smtpSink } from "./smtp-sink.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const servers = [];
let sink;
let site;

const VISITOR = {
  name: "Ada Example",
  email: "ada.visitor@example.org",
  organisation: "Example Foundation",
  message: "We run a meetup of 40 people <and> need a sign-up tool.",
};

function freePort() {
  return new Promise((resolve) => {
    const probe = createServer().listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function start(env) {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn("node", ["dist/server/entry.mjs"], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      HOST: "127.0.0.1",
      PORT: String(port),
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = { text: "" };
  child.stdout.on("data", (chunk) => (output.text += chunk));
  child.stderr.on("data", (chunk) => (output.text += chunk));
  servers.push(child);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await fetch(origin);
      return { origin, output };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`${origin} did not answer`);
}

const mailEnv = (extra = {}) => ({
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: String(sink.port),
  MAIL_FROM: "website@xigo.ch",
  ...extra,
});

function post(server, fields, headers = {}) {
  return fetch(`${server.origin}/contact`, {
    method: "POST",
    redirect: "manual",
    headers: {
      origin: server.origin,
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: new URLSearchParams(fields),
  });
}

before(async () => {
  const build = spawnSync("npm", ["run", "build", "--silent"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  sink = await smtpSink();
  site = await start(mailEnv());
});

after(async () => {
  for (const child of servers) child.kill();
  await sink?.close();
});

test("Contact is a form beside the mailto address, saying where it goes (R-CONTACT-1)", async () => {
  const response = await fetch(`${site.origin}/contact`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<form method="post" action="\/contact"/);
  for (const field of ["name", "email", "organisation", "message"]) {
    assert.match(html, new RegExp(`<label for="${field}"`));
    assert.match(html, new RegExp(`name="${field}"`));
  }
  assert.match(html, /href="mailto:info@xigo\.ch"/);
  assert.match(html, /goes to info@xigo\.ch and nowhere else/);
  assert.doesNotMatch(html, /<script/);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("sending mails info@xigo.ch with the visitor as Reply-To, then thanks them (R-CONTACT-2)", async () => {
  const before = sink.mails.length;
  const response = await post(site, VISITOR);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/contact/sent");
  assert.equal(sink.mails.length, before + 1);
  const mail = sink.mails.at(-1);
  assert.deepEqual(mail.to, ["info@xigo.ch"]);
  assert.equal(mail.from, "website@xigo.ch");
  assert.match(mail.data, /^Reply-To: ada\.visitor@example\.org$/m);
  assert.match(
    mail.data,
    /^Subject: Contact from Ada Example, Example Foundation$/m,
  );
  assert.match(mail.data, /need a sign-up tool/);

  const thanks = await fetch(`${site.origin}/contact/sent`);
  assert.equal(thanks.status, 200);
  assert.match(await thanks.text(), /Thank you/);
});

test("a form with problems is not sent, keeps the text and names each problem (R-CONTACT-3)", async () => {
  const before = sink.mails.length;
  const response = await post(site, { ...VISITOR, email: "ada", name: "" });
  assert.equal(response.status, 400);
  const html = await response.text();
  assert.equal(sink.mails.length, before);
  assert.match(html, /2 things to fix/);
  assert.match(html, /href="#name"[^>]*>Your name is missing\.<\/a>/);
  assert.match(html, /href="#email"[^>]*>Your email does not look like/);
  assert.match(
    html,
    /id="email"[^>]*aria-invalid="true"[^>]*aria-describedby="email-hint email-problem"/,
  );
  assert.match(html, /value="Example Foundation"/);
  assert.match(
    html,
    />We run a meetup of 40 people &lt;and&gt; need a sign-up tool\.<\/textarea>/,
  );
});

test("a filled trap field is answered as sent and mails nothing (R-CONTACT-4)", async () => {
  const before = sink.mails.length;
  const response = await post(site, { ...VISITOR, website: "spam.example" });
  assert.equal(response.status, 303);
  assert.equal(sink.mails.length, before);
});

test("no more than the configured mails leave per hour (R-CONTACT-4)", async () => {
  const limited = await start(mailEnv({ CONTACT_MAILS_PER_HOUR: "1" }));
  assert.equal((await post(limited, VISITOR)).status, 303);
  const response = await post(limited, VISITOR);
  assert.equal(response.status, 429);
  const html = await response.text();
  assert.match(html, /pausing/);
  assert.match(html, /need a sign-up tool/);
});

test("a failed send keeps the text, offers the address, and logs nothing typed (R-CONTACT-5)", async () => {
  sink.failNext();
  const response = await post(site, VISITOR);
  assert.equal(response.status, 502);
  const html = await response.text();
  assert.match(html, /could not be sent/);
  assert.match(html, /need a sign-up tool/);
  assert.match(html, /href="mailto:info@xigo\.ch"/);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.match(site.output.text, /contact: the mail could not be sent/);
  for (const typed of Object.values(VISITOR)) {
    assert.ok(!site.output.text.includes(typed), "the log repeats a field");
  }
});

test("a submission from another site is refused", async () => {
  const before = sink.mails.length;
  const response = await post(site, VISITOR, {
    origin: "https://elsewhere.example",
    "sec-fetch-site": "cross-site",
  });
  assert.equal(response.status, 403);
  assert.equal(sink.mails.length, before);
});

test("without mail settings, Contact offers the address and logs which is missing (R-RUN-3)", async () => {
  const bare = await start({});
  const response = await fetch(`${bare.origin}/contact`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.doesNotMatch(html, /<form/);
  assert.match(html, /href="mailto:info@xigo\.ch"/);
  assert.match(bare.output.text, /contact: SMTP_HOST is not set/);
});

test("a visitor sends the form in a browser, at phone width (R-CONTACT-2, R-WEB-3)", async () => {
  const before = sink.mails.length;
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({
      viewport: { width: 360, height: 740 },
      javaScriptEnabled: false,
    });
    await tab.goto(`${site.origin}/contact`);
    const width = await tab.evaluate(
      () => document.documentElement.scrollWidth,
    );
    assert.ok(width <= 360, `/contact is ${width}px wide`);
    await tab.getByLabel("Your name").fill(VISITOR.name);
    await tab.getByLabel("Your email").fill(VISITOR.email);
    await tab.getByLabel("How can we help?").fill(VISITOR.message);
    await tab.getByRole("button", { name: "Send message" }).click();
    await tab.waitForURL("**/contact/sent");
    assert.equal(sink.mails.length, before + 1);
  } finally {
    await browser.close();
  }
});
