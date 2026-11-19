import { existsSync } from "node:fs";
import { chromium } from "playwright";

const PREINSTALLED = "/opt/pw-browsers/chromium";

/** Chromium for the browser tests: Playwright's own build where it is
 * installed, as in CI; otherwise the one `CHROMIUM_EXECUTABLE` names, or the
 * Chromium a cloud session ships at /opt/pw-browsers, when a session cannot
 * download Playwright's build. */
export function launchChromium() {
  if (existsSync(chromium.executablePath())) return chromium.launch();
  const executablePath = process.env.CHROMIUM_EXECUTABLE ?? PREINSTALLED;
  if (!existsSync(executablePath)) {
    throw new Error(
      `No Chromium for the browser tests: run \`npx playwright install chromium\`, or set CHROMIUM_EXECUTABLE (tried ${chromium.executablePath()} and ${executablePath}).`,
    );
  }
  return chromium.launch({ executablePath });
}
