// Edits the raw screen recordings from record-cinematic.mjs into a single
// ~15s cinematic highlight reel for the README: Ken Burns/focus-pull moves,
// two speed-ramped shots, a horizontal dolly, and eight built-in ffmpeg
// xfade transitions chosen to read as wipes/whip-pans/dissolves rather than
// gimmicky wipes. No paid APIs, no narration — silent, captioned montage.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const RAW_DIR = path.join(ROOT, "docs", "demo", "raw");
const WORK_DIR = path.join(ROOT, "docs", "demo", "work");
const FONT_DIR = "C:/Windows/Fonts";
const FPS = 30;
const TRANSITION = 0.3;

mkdirSync(WORK_DIR, { recursive: true });

function ff(args) {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    stdio: "inherit",
  });
}

function fontPath(name) {
  // ffmpeg on Windows needs the drive-letter colon escaped inside filter args.
  return `${FONT_DIR}/${name}`.replace(":", "\\:");
}

const GRADE = "eq=contrast=1.06:saturation=1.1:brightness=0.01,vignette=PI/5.2";

function captionFilter(text, dur) {
  const fadeIn = 0.18;
  const fadeOut = 0.32;
  const alpha = `if(lt(t,${fadeIn}),t/${fadeIn},if(gt(t,${(dur - fadeOut).toFixed(3)}),(${dur.toFixed(3)}-t)/${fadeOut},1))`;
  const font = fontPath("seguisb.ttf");
  return [
    // Small accent tick, then the uppercase label — echoes the app's own
    // eyebrow-label convention (e.g. "Today" above "Your agenda").
    `drawbox=x=80:y=h-124:w=30:h=4:color=0x3b82f6:t=fill`,
    `drawtext=fontfile='${font}':text='${text}':fontcolor=white:fontsize=40:x=80:y=h-108:alpha='${alpha}'`,
  ].join(",");
}

function kenBurnsFilter(dur, { zoomTo = 1.08, focusX = 0.5, focusY = 0.5 } = {}) {
  const frames = Math.round(dur * FPS);
  const step = ((zoomTo - 1) / frames).toFixed(6);
  return (
    `zoompan=z='min(zoom+${step}\\,${zoomTo})':` +
    `x='(iw-iw/zoom)*${focusX}':y='(ih-ih/zoom)*${focusY}':` +
    `d=1:s=1920x1080:fps=${FPS}`
  );
}

function dollyFilter(dur, { zoom = 1.12, direction = 1 } = {}) {
  // Constant-zoom horizontal pan (camera-movement transition) rather than a
  // growing zoom — reads as the camera tracking across the calendar grid.
  // Uses zoompan (not crop+eval=frame, unsupported on ffmpeg 4.3) with a
  // fixed zoom level and an `on` (output frame index)-driven x offset.
  const frames = Math.round(dur * FPS);
  const from = direction > 0 ? 0.08 : 0.92;
  const to = direction > 0 ? 0.92 : 0.08;
  return (
    `zoompan=z='${zoom}':` +
    `x='(iw-iw/zoom)*(${from}+(${to}-${from})*(on/${frames}))':` +
    `y='(ih-ih/zoom)/2':d=1:s=1920x1080:fps=${FPS}`
  );
}

function tailInput(raw, tailSeconds) {
  return ["-sseof", `-${tailSeconds}`, "-i", path.join(RAW_DIR, raw)];
}

function slug(caption) {
  return caption.toLowerCase().replace(/\W+/g, "-").replace(/-+$/, "");
}

function buildSimpleShot({ raw, tailSeconds, dur, caption, visual }) {
  const outPath = path.join(WORK_DIR, `${slug(caption)}.mp4`);
  const vf = [visual, GRADE, captionFilter(caption, dur), "format=yuv420p"].join(",");
  ff([
    ...tailInput(raw, tailSeconds),
    "-t",
    String(dur),
    "-vf",
    vf,
    "-an",
    "-r",
    String(FPS),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    outPath,
  ]);
  return { path: outPath, dur };
}

function buildSpeedRampShot({ raw, tailSeconds, seg1SourceSec, seg1Speed, seg2Speed, caption }) {
  // Cuts the tail window into an anticipation segment (held/slowed) and a
  // snap segment (sped through the action) — the soccer-kick speed-ramp
  // pattern, applied to the kanban drag and the flashcard flip. The output
  // duration is *derived* from the speed math (not force-truncated) so nothing
  // gets cut off mid-action.
  const seg2SourceSec = tailSeconds - seg1SourceSec;
  const dur = seg1SourceSec / seg1Speed + seg2SourceSec / seg2Speed;
  const outPath = path.join(WORK_DIR, `${slug(caption)}.mp4`);
  const filter =
    `[0:v]trim=start=0:end=${seg1SourceSec},setpts=(PTS-STARTPTS)/${seg1Speed}[s1];` +
    `[0:v]trim=start=${seg1SourceSec},setpts=(PTS-STARTPTS)/${seg2Speed}[s2];` +
    `[s1][s2]concat=n=2:v=1:a=0[cc];` +
    `[cc]${GRADE},${captionFilter(caption, dur)},format=yuv420p[vout]`;
  ff([
    ...tailInput(raw, tailSeconds),
    "-filter_complex",
    filter,
    "-map",
    "[vout]",
    "-t",
    (dur - 0.02).toFixed(3),
    "-an",
    "-r",
    String(FPS),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    outPath,
  ]);
  return { path: outPath, dur: dur - 0.02 };
}

function buildTitleCard({ image, dur, zoomTo }) {
  const outPath = path.join(WORK_DIR, `${path.basename(image, ".png")}-clip.mp4`);
  const vf = [kenBurnsFilter(dur, { zoomTo }), GRADE, "format=yuv420p"].join(",");
  ff([
    "-loop",
    "1",
    "-i",
    path.join(WORK_DIR, image),
    "-t",
    String(dur),
    "-vf",
    vf,
    "-an",
    "-r",
    String(FPS),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    outPath,
  ]);
  return { path: outPath, dur };
}

const shots = [];

shots.push(buildTitleCard({ image: "intro.png", dur: 1.2, zoomTo: 1.04 }));

shots.push({
  ...buildSimpleShot({
    raw: "1-dashboard.webm",
    tailSeconds: 3.4,
    dur: 2.0,
    caption: "DASHBOARD",
    visual: kenBurnsFilter(2.0, { zoomTo: 1.09, focusY: 0.42 }),
  }),
  transitionOut: "smoothleft",
});

shots.push({
  ...buildSpeedRampShot({
    raw: "2-kanban.webm",
    tailSeconds: 3.3,
    seg1SourceSec: 2.0,
    seg1Speed: 0.85,
    seg2Speed: 1.9,
    caption: "KANBAN BOARD",
  }),
  transitionOut: "wiperight",
});

shots.push({
  ...buildSimpleShot({
    raw: "3-calendar.webm",
    tailSeconds: 3.0,
    dur: 1.8,
    caption: "CALENDAR",
    visual: dollyFilter(1.8, { zoom: 1.12, direction: 1 }),
  }),
  transitionOut: "circleopen",
});

shots.push({
  ...buildSimpleShot({
    raw: "4-pomodoro.webm",
    tailSeconds: 2.7,
    dur: 1.7,
    caption: "FOCUS TIMER",
    visual: kenBurnsFilter(1.7, { zoomTo: 1.18, focusY: 0.48 }),
  }),
  transitionOut: "radial",
});

shots.push({
  ...buildSpeedRampShot({
    raw: "5-flashcards.webm",
    tailSeconds: 3.4,
    seg1SourceSec: 1.5,
    seg1Speed: 0.85,
    seg2Speed: 1.6,
    caption: "FLASHCARDS",
  }),
  transitionOut: "dissolve",
});

shots.push({
  ...buildSimpleShot({
    raw: "6-analytics.webm",
    tailSeconds: 2.9,
    dur: 1.6,
    caption: "ANALYTICS",
    visual: kenBurnsFilter(1.6, { zoomTo: 1.1, focusY: 0.4 }),
  }),
  transitionOut: "smoothright",
});

shots.push({
  ...buildSimpleShot({
    raw: "7-goals.webm",
    tailSeconds: 2.5,
    dur: 1.5,
    caption: "GOALS & STREAKS",
    visual: kenBurnsFilter(1.5, { zoomTo: 1.07 }),
  }),
  transitionOut: "fadeblack",
});

shots.push(buildTitleCard({ image: "outro.png", dur: 1.7, zoomTo: 1.03 }));

console.log("Shot durations:", shots.map((s) => s.dur.toFixed(2)).join(", "));

// ── Final assembly: chain every shot with an xfade transition ──
const inputs = shots.flatMap((s) => ["-i", s.path]);
let filter = "";
let cumulative = shots[0].dur;
let prevLabel = "0:v";
for (let i = 1; i < shots.length; i++) {
  const transition = shots[i - 1].transitionOut ?? "fade";
  const offset = (cumulative - TRANSITION).toFixed(3);
  const outLabel = i === shots.length - 1 ? "outv" : `x${i}`;
  filter += `[${prevLabel}][${i}:v]xfade=transition=${transition}:duration=${TRANSITION}:offset=${offset}[${outLabel}];`;
  prevLabel = outLabel;
  cumulative += shots[i].dur - TRANSITION;
}
filter = filter.slice(0, -1);

const finalOut = path.join(ROOT, "docs", "demo", "axon-demo.mp4");
ff([
  ...inputs,
  "-filter_complex",
  filter,
  "-map",
  "[outv]",
  "-r",
  String(FPS),
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "17",
  "-pix_fmt",
  "yuv420p",
  finalOut,
]);

console.log(`Final master duration: ${cumulative.toFixed(2)}s`);
console.log(`Wrote ${finalOut}`);

// ── GIF for the README's inline preview ──
const gifOut = path.join(ROOT, "docs", "demo", "axon-demo.gif");
const palette = path.join(WORK_DIR, "palette.png");
const gifFps = 10;
const gifWidth = 640;
ff([
  "-i",
  finalOut,
  "-vf",
  `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos,palettegen=max_colors=160:stats_mode=diff`,
  palette,
]);
ff([
  "-i",
  finalOut,
  "-i",
  palette,
  "-lavfi",
  `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a`,
  gifOut,
]);
console.log(`Wrote ${gifOut}`);
