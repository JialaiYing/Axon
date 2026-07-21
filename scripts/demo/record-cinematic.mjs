// Records real screen footage of every major Axon feature for a "cinematic"
// 15s highlight reel (not currently linked from the README — kept here for
// whenever a demo video is needed again). Drives actual interactions — a
// kanban drag, a calendar tab switch, a running pomodoro ring, a flashcard
// flip, a chart hover, a filling goal bar — so the editing pass
// (build-cinematic.mjs) has real motion to cut, speed-ramp, and whip-pan
// between instead of animating dead screenshots.
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { buildSeedData } from "./seed-data.mjs";

const BASE_URL = process.env.DEMO_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "docs/demo/raw";
const VIEWPORT = { width: 1920, height: 1080 };

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const ONBOARDING_SEEN = {
  dashboard: true,
  kanban: true,
  calendar: true,
  flashcards: true,
  pomodoro: true,
  analytics: true,
  goals: true,
  gamification: true,
  rank: true,
};

async function seed(page, extra = {}) {
  const data = {
    ...buildSeedData(),
    "axon:onboarding:seen": ONBOARDING_SEEN,
    ...extra,
  };
  await page.evaluate((seedData) => {
    for (const [key, value] of Object.entries(seedData)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, data);
}

// Video encoding overhead under `recordVideo` measurably slows down
// hydration/entrance-animation timing versus a plain screenshot run, so
// every clip gets this buffer *before* its designed action sequence starts.
// It only pads the front of the recording — since every shot is later
// trimmed from the raw clip's *end* backwards, this never shifts where the
// designed action lands inside that tail window.
const HYDRATE_BUFFER_MS = 1600;

async function withClip(browser, name, fn) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "dark",
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
  });
  const page = await context.newPage();
  // Establish the origin before touching localStorage.
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
  await fn(page);
  const video = page.video();
  await context.close();
  const savedPath = `${OUT_DIR}/${name}.webm`;
  if (video) await video.saveAs(savedPath);
  return { name, savedPath };
}

async function dragCard(page, fromText, toColumnHeading) {
  // The card's title is a <button> with its own onPointerDown
  // stopPropagation (opens the edit dialog on click), so starting the drag
  // there never reaches dnd-kit's listener on the card container. Grab the
  // container itself and start the drag from its bottom padding strip
  // instead, which is guaranteed-empty space below any card's content.
  const card = page.locator(".touch-none", { hasText: fromText }).first();
  const column = page.getByRole("heading", { name: toColumnHeading });
  const from = await card.boundingBox();
  const to = await column.boundingBox();
  if (!from || !to) return;

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height - 10;
  const endX = to.x + to.width / 2;
  const endY = to.y + to.height + 45;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Small initial jiggle clears dnd-kit's 6px activation constraint, then
  // ease across in more steps than needed so the capture reads smoothly at
  // whatever the final edit's playback speed ends up being.
  await page.mouse.move(startX + 10, startY - 6, { steps: 4 });
  await page.waitForTimeout(120);
  const steps = 26;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(startX + (endX - startX) * ease, startY + (endY - startY) * ease);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(500);
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  results.push(
    await withClip(browser, "1-dashboard", async (page) => {
      await seed(page);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "load" });
      await page.waitForTimeout(HYDRATE_BUFFER_MS);
      await page.waitForTimeout(1900);
      await page.mouse.move(660, 420);
      await page.mouse.move(900, 520, { steps: 20 });
      await page.waitForTimeout(1400);
    })
  );

  results.push(
    await withClip(browser, "2-kanban", async (page) => {
      await seed(page);
      await page.goto(`${BASE_URL}/kanban`, { waitUntil: "load" });
      await page.waitForTimeout(HYDRATE_BUFFER_MS);
      await page.waitForTimeout(1100);
      await dragCard(page, "Recursion practice set", "Finished");
      await page.waitForTimeout(600);
    })
  );

  results.push(
    await withClip(browser, "3-calendar", async (page) => {
      await seed(page);
      await page.goto(`${BASE_URL}/calendar`, { waitUntil: "load" });
      await page.waitForTimeout(HYDRATE_BUFFER_MS);
      const monthTab = page.getByRole("tab", { name: "Month" });
      if (await monthTab.count()) await monthTab.click();
      await page.waitForTimeout(700);
      const weekTab = page.getByRole("tab", { name: "Week" });
      if (await weekTab.count()) {
        await weekTab.click();
        await page.waitForTimeout(900);
      }
      const dayTab = page.getByRole("tab", { name: "Day" });
      if (await dayTab.count()) {
        await dayTab.click();
        await page.waitForTimeout(900);
      }
    })
  );

  results.push(
    await withClip(browser, "4-pomodoro", async (page) => {
      await seed(page, {
        // The fullscreen Focus Mode overlay (fixed + backdrop-blur-xl) renders
        // solid black under Playwright's CDP screencast video capture even
        // though live screenshots of the exact same DOM state are fine — a
        // known backdrop-filter/screencast compositing mismatch in headless
        // Chromium. Disabling auto-enter keeps us on the plain grid TimerCard,
        // which has no such overlay and records correctly.
        "axon:focus:preferences": { autoEnterFocusMode: false, showBlocklistReminder: true },
        "axon:pomodoro:displayMode": "blob",
        "axon:pomodoro:timers": [
          {
            id: "demo-t1",
            source: "objective",
            label: "Org chem problem set",
            objectiveId: "demo-o1",
            durationSeconds: 50 * 60,
            endAt: Date.now() + 41 * 60 * 1000 + 12 * 1000,
            pausedRemainingSeconds: null,
            status: "running",
            createdAt: new Date().toISOString(),
          },
        ],
      });
      await page.goto(`${BASE_URL}/pomodoro`, { waitUntil: "load" });
      await page.waitForTimeout(HYDRATE_BUFFER_MS);
      await page.waitForTimeout(2600);
    })
  );

  results.push(
    await withClip(browser, "5-flashcards", async (page) => {
      await seed(page);
      await page.goto(`${BASE_URL}/flashcards`, { waitUntil: "load" });
      await page.waitForTimeout(HYDRATE_BUFFER_MS);
      await page.waitForTimeout(1300);
      const setCard = page.getByText("Functional Groups", { exact: true }).first();
      if (await setCard.count()) {
        // Clicking the set opens the single-card study view inline (no
        // separate "Study" button/dialog in this flow).
        await setCard.click();
        await page.waitForTimeout(1300);
        const flip = page.getByRole("button", { name: "Show back of card" });
        if (await flip.count()) {
          await flip.click();
          await page.waitForTimeout(950);
        }
      }
    })
  );

  results.push(
    await withClip(browser, "6-analytics", async (page) => {
      await seed(page);
      await page.goto(`${BASE_URL}/analytics`, { waitUntil: "load" });
      await page.waitForTimeout(HYDRATE_BUFFER_MS);
      await page.waitForTimeout(1700);
      const area = page.locator(".recharts-area, .recharts-bar-rectangle").first();
      if (await area.count()) {
        const box = await area.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
          await page.waitForTimeout(300);
          await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.3, { steps: 12 });
        }
      }
      await page.waitForTimeout(900);
    })
  );

  results.push(
    await withClip(browser, "7-goals", async (page) => {
      await seed(page);
      await page.goto(`${BASE_URL}/goals`, { waitUntil: "load" });
      await page.waitForTimeout(HYDRATE_BUFFER_MS);
      await page.waitForTimeout(1400);
      await page.mouse.move(500, 400);
      await page.waitForTimeout(900);
    })
  );

  await browser.close();
  for (const r of results) console.log(`recorded ${r.name} -> ${r.savedPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
