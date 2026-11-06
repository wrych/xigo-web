import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chrootPath } from "./chroot-path.mjs";

const script = fileURLToPath(
  new URL("../deploy/server/deploy", import.meta.url),
);
const sha = (digit) => digit.repeat(40);
const PATH = chrootPath();

function server() {
  const root = mkdtempSync(join(tmpdir(), "xigo-deploy-"));
  mkdirSync(join(root, "xigo-web/bin"), { recursive: true });
  copyFileSync(script, join(root, "xigo-web/bin/deploy"));
  mkdirSync(join(root, "staging.xigo.ch"));
  mkdirSync(join(root, "xigo.ch"));
  return root;
}

function packageFile(files, extraCount = 0) {
  const dir = mkdtempSync(join(tmpdir(), "xigo-package-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true });
    if (typeof content === "string") writeFileSync(join(dir, path), content);
    else symlinkSync(content.link, join(dir, path));
  }
  for (let index = 0; index < extraCount; index += 1) {
    mkdirSync(join(dir, "padding"), { recursive: true });
    writeFileSync(join(dir, "padding", `file-${index}.txt`), "x");
  }
  const archive = join(dir, "..", `${dir.split("/").pop()}.tgz`);
  const tar = spawnSync("tar", ["-czf", archive, "-C", dir, "."]);
  assert.equal(tar.status, 0);
  return readFileSync(archive);
}

const goodPackage = () =>
  packageFile({
    "dist/server/entry.mjs": "export {};\n",
    "package.json": "{}",
  });

function run(root, request, input) {
  return spawnSync(join(PATH, "bash"), [join(root, "xigo-web/bin/deploy")], {
    input,
    encoding: input === undefined ? "utf8" : undefined,
    env: { PATH, SSH_ORIGINAL_COMMAND: request },
  });
}

const text = (result) => ({
  status: result.status,
  stdout: result.stdout.toString(),
  stderr: result.stderr.toString(),
});

test("a received release goes live on staging", () => {
  const root = server();
  const result = text(run(root, `receive ${sha("a")}`, goodPackage()));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /staging now runs a{40}/);

  const app = join(root, "staging.xigo.ch");
  assert.equal(
    readlinkSync(join(app, "current")),
    `../xigo-web/releases/${sha("a")}`,
  );
  assert.ok(existsSync(join(app, "current/dist/server/entry.mjs")));
  assert.match(
    readFileSync(join(app, "app.js"), "utf8"),
    /current\/dist\/server\/entry\.mjs/,
  );
  assert.ok(existsSync(join(app, "tmp/restart.txt")));
  assert.equal(text(run(root, "running staging")).stdout.trim(), sha("a"));
  assert.ok(!lstatSync(join(root, "xigo.ch")).isSymbolicLink());
  assert.ok(!existsSync(join(root, "xigo.ch/current")));
});

test("promoting switches production to a release staging received", () => {
  const root = server();
  run(root, `receive ${sha("a")}`, goodPackage());
  const result = text(run(root, `promote ${sha("a")}`));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readlinkSync(join(root, "xigo.ch/current")),
    `../xigo-web/releases/${sha("a")}`,
  );
  assert.equal(text(run(root, "running production")).stdout.trim(), sha("a"));
  assert.match(text(run(root, "releases")).stdout, /a{40} staging production/);
});

test("without a staging app folder nothing is received, so nothing can be promoted", () => {
  const root = server();
  rmSync(join(root, "staging.xigo.ch"), { recursive: true });
  const result = text(run(root, `receive ${sha("a")}`, goodPackage()));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no app folder for staging/);
  assert.ok(!existsSync(join(root, `xigo-web/releases/${sha("a")}`)));
  assert.equal(run(root, `promote ${sha("a")}`).status, 1);
});

test("promoting a release the server does not have changes nothing", () => {
  const root = server();
  const result = text(run(root, `promote ${sha("b")}`));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no release b{40}/);
  assert.ok(!existsSync(join(root, "xigo.ch/current")));
});

for (const [name, request] of [
  ["a malformed commit id", "promote abc"],
  ["an unknown command", "sh"],
  ["extra words", `promote ${sha("a")} ; rm -rf /`],
  ["an unknown target", "running elsewhere"],
  ["no command at all", ""],
]) {
  test(`${name} is refused`, () => {
    const result = text(run(server(), request));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^deploy: /);
  });
}

for (const [name, upload, reason] of [
  ["an empty upload", Buffer.alloc(0), /empty/],
  ["an upload that is not a tar", Buffer.from("hello"), /not a gzipped tar/],
  [
    "an upload with a link in it",
    packageFile({
      "dist/server/entry.mjs": "export {};\n",
      "dist/escape": { link: "/xigo.ch" },
    }),
    /contains links/,
  ],
  [
    "a large upload with a link in it",
    packageFile(
      {
        "dist/server/entry.mjs": "export {};\n",
        "dist/escape": { link: "/xigo.ch" },
      },
      3000,
    ),
    /contains links/,
  ],
  [
    "an upload without the server entry",
    packageFile({ "package.json": "{}" }),
    /no dist\/server\/entry\.mjs/,
  ],
]) {
  test(`${name} is refused and leaves staging as it was`, () => {
    const root = server();
    run(root, `receive ${sha("a")}`, goodPackage());
    const result = text(run(root, `receive ${sha("b")}`, upload));
    assert.equal(result.status, 1);
    assert.match(result.stderr, reason);
    assert.equal(text(run(root, "running staging")).stdout.trim(), sha("a"));
    assert.ok(!existsSync(join(root, `xigo-web/releases/${sha("b")}`)));
    assert.ok(!existsSync(join(root, `xigo-web/releases/.${sha("b")}.tgz`)));
  });
}

test("a link left over from an interrupted switch does not misdirect the next", () => {
  const root = server();
  run(root, `receive ${sha("a")}`, goodPackage());
  symlinkSync(
    `../xigo-web/releases/${sha("a")}`,
    join(root, "staging.xigo.ch/current.new"),
  );
  const result = text(run(root, `receive ${sha("b")}`, goodPackage()));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readlinkSync(join(root, "staging.xigo.ch/current")),
    `../xigo-web/releases/${sha("b")}`,
  );
  assert.ok(
    !existsSync(join(root, `xigo-web/releases/${sha("a")}/current.new`)),
  );
});

test("receiving a commit again never touches the release production runs", () => {
  const root = server();
  run(root, `receive ${sha("a")}`, goodPackage());
  run(root, `promote ${sha("a")}`);
  const rebuilt = packageFile({
    "dist/server/entry.mjs": "export const rebuilt = true;\n",
  });
  const result = text(run(root, `receive ${sha("a")}`, rebuilt));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /already on the server/);
  assert.equal(
    readFileSync(join(root, "xigo.ch/current/dist/server/entry.mjs"), "utf8"),
    "export {};\n",
  );
});

test("a deploy is refused while another holds the lock", () => {
  const root = server();
  run(root, `receive ${sha("a")}`, goodPackage());
  mkdirSync(join(root, "xigo-web/lock"));

  for (const [request, upload] of [
    [`receive ${sha("b")}`, goodPackage()],
    [`promote ${sha("a")}`, undefined],
  ]) {
    const result = text(run(root, request, upload ?? Buffer.alloc(0)));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /another deploy holds .*lock; try again/);
  }
  assert.equal(text(run(root, "running staging")).stdout.trim(), sha("a"));
  assert.equal(text(run(root, "running production")).stdout.trim(), "");
  assert.ok(
    existsSync(join(root, "xigo-web/lock")),
    "another run's lock is left alone",
  );
});

test("a run that is cut off while uploading releases its lock", () => {
  const root = server();
  const sleep = spawnSync("bash", ["-c", "command -v sleep"], {
    encoding: "utf8",
  }).stdout.trim();
  const result = spawnSync(
    join(PATH, "bash"),
    [
      "-c",
      '"$1" 5 | bash "$0" & pid=$!; "$1" 0.5; kill -HUP "$pid"; wait "$pid"',
      join(root, "xigo-web/bin/deploy"),
      sleep,
    ],
    {
      env: { PATH, SSH_ORIGINAL_COMMAND: `receive ${sha("a")}` },
      encoding: "utf8",
    },
  );
  assert.notEqual(result.status, 0);
  assert.ok(!existsSync(join(root, "xigo-web/lock")), "the lock is released");
  assert.ok(!existsSync(join(root, `xigo-web/releases/.${sha("a")}.tgz`)));
});

function withLimit(root, config) {
  writeFileSync(join(root, "xigo-web/bin/deploy.conf"), config);
  return root;
}

test("an upload as large as the configured limit is refused", () => {
  const upload = goodPackage();
  for (const limit of [upload.length, upload.length - 1]) {
    const root = withLimit(server(), `# bytes\nmax_bytes=${limit}\n`);
    const result = text(run(root, `receive ${sha("a")}`, upload));
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`not smaller than ${limit} bytes`));
    assert.equal(text(run(root, "running staging")).stdout.trim(), "");
  }
});

test("an upload under the configured limit is received", () => {
  const upload = goodPackage();
  const root = withLimit(server(), `max_bytes=${upload.length + 1}\n`);
  assert.equal(run(root, `receive ${sha("a")}`, upload).status, 0);
});

for (const [config, reason] of [
  ["max_bytes=lots\n", /max_bytes must be a positive whole number/],
  ["max_bytes=0\n", /max_bytes must be a positive whole number/],
  ["limit=5\n", /unknown setting limit/],
]) {
  test(`a broken deploy.conf (${config.trim()}) refuses every upload`, () => {
    const root = withLimit(server(), config);
    const result = text(run(root, `receive ${sha("a")}`, goodPackage()));
    assert.equal(result.status, 1);
    assert.match(result.stderr, reason);
  });
}

test("old releases are pruned, but never one production runs", () => {
  const root = server();
  const shas = ["1", "2", "3", "4", "5", "6", "7"].map(sha);
  run(root, `receive ${shas[0]}`, goodPackage());
  run(root, `promote ${shas[0]}`);
  for (const id of shas.slice(1)) run(root, `receive ${id}`, goodPackage());

  const kept = text(run(root, "releases")).stdout.trim().split("\n");
  assert.equal(kept.length, 6);
  assert.ok(kept.some((line) => line.startsWith(`${shas[0]} production`)));
  assert.ok(!existsSync(join(root, `xigo-web/releases/${shas[1]}`)));
  assert.ok(kept[0].startsWith(`${shas[6]} staging`));
});
