import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../scripts/deploy-is-current.sh", import.meta.url),
);

function ask({ head, sha, ghFails = false }) {
  const dir = mkdtempSync(join(tmpdir(), "xigo-current-"));
  const gh = join(dir, "gh");
  writeFileSync(
    gh,
    ghFails
      ? "#!/bin/sh\necho 'gh: network down' >&2\nexit 1\n"
      : `#!/bin/sh\n[ "$2" = "repos/wrych/xigo-web/git/ref/heads/main" ] || exit 2\necho ${head}\n`,
  );
  chmodSync(gh, 0o755);
  const output = join(dir, "output");
  writeFileSync(output, "");
  const result = spawnSync("bash", [script], {
    encoding: "utf8",
    env: {
      PATH: `${dir}:${process.env.PATH}`,
      REPO: "wrych/xigo-web",
      SHA: sha,
      GITHUB_OUTPUT: output,
    },
  });
  return { ...result, output: readFileSync(output, "utf8") };
}

test("main's head is the commit to deploy", () => {
  const result = ask({ head: "a".repeat(40), sha: "a".repeat(40) });
  assert.equal(result.status, 0);
  assert.equal(result.output, "current=true\n");
});

test("a commit main has moved past is not deployed, and says why", () => {
  const result = ask({ head: "b".repeat(40), sha: "a".repeat(40) });
  assert.equal(result.status, 0);
  assert.equal(result.output, "current=false\n");
  assert.match(result.stdout, /Not deploying a{40}: main is at b{40}/);
});

test("when GitHub cannot answer, the job fails rather than deploying", () => {
  const result = ask({ sha: "a".repeat(40), ghFails: true });
  assert.notEqual(result.status, 0);
  assert.equal(result.output, "");
});
