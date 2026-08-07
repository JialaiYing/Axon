/**
 * Visual sanity check for the hairline-grid landing redesign.
 * Captures full-page screenshots of the marketing routes at 375 / 768 / 1024px.
 * Output: docs/landing-screenshots/redesign-check/
 */
import { chromium } from "playwright";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.LANDING_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "docs/landing-screenshots/redesign-check";

const VIEWPORTS = [
  { label: "375", width: 375, height: 900 },
  { label: "768", width: 768, height: 1000 },
  { label: "1024", width: 1024, height: 1000 },
];

const ROUTES = [
  { label: "home", path: "/" },
  { label: "login", path: "/login" },
  { label: "faq", path: "/faq" },
];

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready at ${url}`);
}

/** Scroll-triggered `whileInView` sections never animate in for an off-screen
 * fullPage screenshot unless we actually scroll past them first. */
async function scrollThroughPage(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  const step = 400;
  for (let y = 0; y < height; y += step) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
}

async function hideDevChrome(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-next-badge-root],
      [data-nextjs-dialog-overlay],
      #__next-build-watcher {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `,
  });
}

async function main() {
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  await waitForServer(BASE_URL);
  console.log("server ready");

  const browser = await chromium.launch({ headless: true });

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: "dark",
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const route of ROUTES) {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle" });
      await hideDevChrome(page);
      await page.waitForTimeout(600);
      await scrollThroughPage(page);
      const path = join(OUT_DIR, `${route.label}-${viewport.label}.png`);
      await page.screenshot({ path, type: "png", fullPage: true });
      console.log("wrote", path);
    }
    await context.close();
  }

  await browser.close();
  console.log("done →", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
