import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chrootPath } from "./chroot-path.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url));
const sha = "c".repeat(40);
let app;

function freePort() {
  return new Promise((resolve) => {
    const probe = createServer().listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

after(() => app?.kill());

test("the webserver package deploys and starts the way Passenger starts it", async () => {
  const work = mkdtempSync(join(tmpdir(), "xigo-webserver-"));
  const archive = join(work, "release.tgz");
  const packed = spawnSync("bash", ["scripts/package.sh", archive], {
    cwd: repo,
    encoding: "utf8",
  });
  assert.equal(packed.status, 0, packed.stderr);

  const root = join(work, "server");
  mkdirSync(join(root, "xigo-web/bin"), { recursive: true });
  mkdirSync(join(root, "staging.xigo.ch"));
  copyFileSync(
    join(repo, "deploy/server/deploy"),
    join(root, "xigo-web/bin/deploy"),
  );
  const deployed = spawnSync("bash", [join(root, "xigo-web/bin/deploy")], {
    input: readFileSync(archive),
    env: { PATH: chrootPath(), SSH_ORIGINAL_COMMAND: `receive ${sha}` },
  });
  assert.equal(deployed.status, 0, deployed.stderr.toString());

  const port = await freePort();
  app = spawn("node", ["app.js"], {
    cwd: join(root, "staging.xigo.ch"),
    env: { PATH: process.env.PATH, HOST: "127.0.0.1", PORT: String(port) },
    stdio: "ignore",
  });

  let response;
  for (let attempt = 0; attempt < 100 && !response; attempt += 1) {
    response = await fetch(`http://127.0.0.1:${port}/`).catch(() => undefined);
    if (!response) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(response, "the deployed app did not answer");
  assert.equal(response.status, 200);
  assert.match(
    await response.text(),
    /Software for the people who bring people together/,
  );
});
