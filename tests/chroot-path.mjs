import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROOT_TOOLS = [
  "bash",
  "chmod",
  "cp",
  "curl",
  "date",
  "du",
  "env",
  "false",
  "grep",
  "groups",
  "gunzip",
  "gzip",
  "head",
  "id",
  "less",
  "ln",
  "ls",
  "mkdir",
  "more",
  "mv",
  "pwd",
  "rm",
  "rmdir",
  "rsync",
  "scp",
  "sh",
  "tail",
  "tar",
  "touch",
  "true",
  "unzip",
  "vi",
  "wget",
  "zip",
];

/** A PATH holding only the tools the hosting's SSH chroot has (`echo /bin/*`
 * on the server, November 2026), so a test fails when the deploy script
 * reaches for one the server lacks. Tools missing here are left out. */
export function chrootPath() {
  const dir = join(mkdtempSync(join(tmpdir(), "xigo-chroot-")), "bin");
  mkdirSync(dir);
  for (const tool of CHROOT_TOOLS) {
    const found = spawnSync("bash", ["-c", `command -v ${tool}`], {
      encoding: "utf8",
    }).stdout.trim();
    if (found.startsWith("/")) symlinkSync(found, join(dir, tool));
  }
  return dir;
}
