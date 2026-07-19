// Captures real screenshots of the running dev server (localhost:3000) for
// each feature page, using a seeded throwaway browser profile so every
// screen has realistic-looking data instead of empty states. Output frames
// feed the ffmpeg slideshow that becomes the README demo.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { buildSeedData } from "./seed-data.mjs";

const BASE_URL = process.env.DEMO_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "docs/demo/frames";

const ROUTES = [
  { path: "/dashboard", name: "1-dashboard" },
  { path: "/kanban", name: "2-kanban" },
  { path: "/calendar", name: "3-calendar" },
  { path: "/flashcards", name: "4-flashcards" },
  { path: "/pomodoro", name: "5-pomodoro" },
  { path: "/analytics", name: "6-analytics" },
  { path: "/goals", name: "7-goals" },
];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  // Note: reducedMotion: "reduce" makes the Kanban board's DnD context
  // never mount its columns, so entrance motion is left on and captures
  // just wait long enough for it to settle instead.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // Establish the origin, then seed localStorage before any app code reads it.
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
  const seed = buildSeedData();
  await page.evaluate((data) => {
    for (const [key, value] of Object.entries(data)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, seed);

  for (const route of ROUTES) {
    // "load" rather than "networkidle" — Next's dev-server HMR websocket
    // stays open forever, which would otherwise time this out on every route.
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "load" });
    // Let hydration + entrance motion finish so nothing is caught mid-transition.
    await page.waitForTimeout(1800);

    // Week/day views auto-scroll to "now" and only show scheduled items at
    // that exact hour band, so most of the grid is empty in a screenshot.
    // Month view spreads everything across the whole month instead.
    if (route.path === "/calendar") {
      const monthTab = page.getByRole("tab", { name: "Month" });
      if (await monthTab.count()) {
        await monthTab.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: `${OUT_DIR}/${route.name}.png` });
    console.log(`captured ${route.path}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
