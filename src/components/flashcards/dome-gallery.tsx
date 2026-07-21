"use client";

import * as React from "react";
import { useGesture } from "@use-gesture/react";
import { Layers, Plus } from "lucide-react";
import type { FlashcardFolder, FlashcardSet } from "@/types";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import "./dome-gallery.css";

/** Rows of tiles visible in the section at once. */
const VISIBLE_ROWS = 5;
/** Minimum columns around the sphere so it never looks sparse. */
const MIN_COLUMNS = 16;
/** Degrees per frame while idle-spinning. */
const IDLE_SPIN_DEG_PER_FRAME = 0.045;
/** Height (px) reserved at the top of the section for column labels. */
const LABEL_BAND = 44;
/** Per-frame easing factor for smooth column scrolling (0-1). */
const SCROLL_SMOOTHING = 0.16;
/** Hold duration before a set tile becomes draggable. */
const LONG_PRESS_MS = 420;
/** Pointer movement (px) that cancels a pending long-press. */
const LONG_PRESS_MOVE_CANCEL = 8;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const toRad = (deg: number) => (deg * Math.PI) / 180;
const mod = (n: number, m: number) => ((n % m) + m) % m;

type Tile =
  | { kind: "set"; set: FlashcardSet }
  | { kind: "plus"; folderId?: string };

interface Column {
  /** Stable identity so scroll offsets survive re-renders and data changes. */
  key: string;
  lon: number;
  folder?: FlashcardFolder;
  /** Label shown above the column — moves horizontally, never with scroll. */
  label?: string;
  tiles: Tile[];
}

/**
 * Plus-tiles are DERIVED from the sets array (the single source of truth).
 *
 * Fewer than VISIBLE_ROWS sets → pad to exactly VISIBLE_ROWS with pluses,
 * split evenly on either side of the cards (floor above, ceil below):
 *   1 set → 2 + 1 + 2
 *   2 sets → 1 + 2 + 2
 *   3 sets → 1 + 3 + 1
 *   4 sets → 0 + 4 + 1
 *
 * VISIBLE_ROWS or more → all sets plus one trailing plus for adding more.
 * Zero sets → a full column of VISIBLE_ROWS pluses (empty folder / placeholder).
 */
function makeTiles(groupSets: FlashcardSet[], folderId?: string): Tile[] {
  const setTiles: Tile[] = groupSets.map((set) => ({ kind: "set", set }));
  const plus = (): Tile => ({ kind: "plus", folderId });

  if (groupSets.length === 0) {
    return Array.from({ length: VISIBLE_ROWS }, plus);
  }
  if (groupSets.length < VISIBLE_ROWS) {
    const plusCount = VISIBLE_ROWS - groupSets.length;
    const above = Math.floor(plusCount / 2);
    const below = Math.ceil(plusCount / 2);
    return [
      ...Array.from({ length: above }, plus),
      ...setTiles,
      ...Array.from({ length: below }, plus),
    ];
  }
  return [...setTiles, plus()];
}

/**
 * One column per dome-visible folder (empty ones included). Each unfiled
 * set gets its OWN column. Placeholder columns of create-tiles fill the
 * remaining longitudes.
 */
function buildColumns(sets: FlashcardSet[], folders: FlashcardFolder[]): Column[] {
  const folderById = new Map(folders.map((f) => [f.id, f]));
  const visibleFolders = folders.filter((f) => f.showInDome !== false);

  const content: Omit<Column, "lon">[] = [];
  for (const folder of visibleFolders) {
    const inFolder = sets.filter((s) => s.folderId === folder.id);
    content.push({
      key: `folder-${folder.id}`,
      folder,
      label: folder.title,
      tiles: makeTiles(inFolder, folder.id),
    });
  }

  const unfiled = sets.filter((s) => !s.folderId || !folderById.has(s.folderId));
  for (const set of unfiled) {
    content.push({
      key: `set-${set.id}`,
      tiles: makeTiles([set]),
    });
  }

  const totalColumns = Math.max(MIN_COLUMNS, content.length + 4);
  const lonStep = 360 / totalColumns;

  return Array.from({ length: totalColumns }, (_, c) => {
    const base = content[c];
    if (base) return { ...base, lon: c * lonStep };
    return {
      key: `placeholder-${c}`,
      lon: c * lonStep,
      tiles: Array.from({ length: VISIBLE_ROWS }, () => ({ kind: "plus" as const })),
    };
  });
}

export interface DomeGalleryProps {
  sets: FlashcardSet[];
  folders: FlashcardFolder[];
  onSetClick?: (set: FlashcardSet) => void;
  /** Called with the folder to preselect when a plus-tile is clicked. */
  onCreateSet?: (folderId?: string) => void;
  /** Move a set into a folder, or pass undefined to unfile it as its own column. */
  onMoveSet?: (setId: string, folderId: string | undefined) => void;
  dragSensitivity?: number;
  dragDampening?: number;
  idleSpinDelayMs?: number;
  /** Background color the horizon fades into. Defaults to the active theme canvas. */
  backgroundColor?: string;
}

type DropTarget =
  | { kind: "folder"; folderId: string; label: string }
  | { kind: "unfile" };

type SetDragState = {
  set: FlashcardSet;
  sourceFolderId?: string;
  x: number;
  y: number;
  drop: DropTarget | null;
};

export default function DomeGallery({
  sets,
  folders,
  onSetClick,
  onCreateSet,
  onMoveSet,
  dragSensitivity = 5,
  dragDampening = 2,
  idleSpinDelayMs = 10000,
  backgroundColor,
}: DomeGalleryProps) {
  const { theme } = useTheme();
  const sphereBg =
    backgroundColor ?? (theme === "light" ? "#f7f6f2" : "#0a0a0a");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const tileRefs = React.useRef(new Map<string, HTMLDivElement>());
  const labelRefs = React.useRef(new Map<string, HTMLDivElement>());
  const sizeRef = React.useRef({ w: 0, h: 0 });

  const rotationRef = React.useRef(0);
  /** Per-column vertical scroll offsets (px), keyed by stable column key. */
  const scrollOffsetsRef = React.useRef(new Map<string, number>());
  /** Wheel deltas accumulate here; offsets ease toward these targets. */
  const scrollTargetsRef = React.useRef(new Map<string, number>());
  const scrollAnimRAF = React.useRef<number | null>(null);
  const startRotRef = React.useRef(0);
  const draggingRef = React.useRef(false);
  const movedRef = React.useRef(false);
  const inertiaRAF = React.useRef<number | null>(null);
  const lastDragEndAt = React.useRef(0);
  const lastInteractionAt = React.useRef(
    typeof performance !== "undefined" ? performance.now() : 0
  );

  /** True while a set card is being held/dragged — blocks sphere rotation. */
  const setDraggingRef = React.useRef(false);
  const longPressTimerRef = React.useRef<number | null>(null);
  const pressOriginRef = React.useRef<{ x: number; y: number } | null>(null);
  const pendingSetRef = React.useRef<FlashcardSet | null>(null);

  const [setDrag, setSetDrag] = React.useState<SetDragState | null>(null);

  const columns = React.useMemo(() => buildColumns(sets, folders), [sets, folders]);

  // Tiles live in the band below the label strip at the top.
  const rowSpacing = React.useCallback(() => {
    const { h } = sizeRef.current;
    return h > 0 ? (h - LABEL_BAND) / VISIBLE_ROWS : 96;
  }, []);

  /**
   * Projects every tile onto the sphere's visible face. Horizontal placement
   * comes from the column's longitude; vertical placement is the tile's slot
   * plus the column's scroll offset, ALWAYS wrapping cyclically so scrolling
   * animates regardless of how many tiles the column holds.
   *
   * Folder labels share the column's X / opacity / scale but sit at a fixed
   * Y — they travel with horizontal drag, never with vertical scroll.
   */
  const applyLayout = React.useCallback(
    (rot: number) => {
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;
      const Rx = w * 0.44;
      const spacing = rowSpacing();

      columns.forEach((column) => {
        const d = wrapAngleSigned(column.lon + rot);
        const cosD = Math.cos(toRad(d));
        const rows = column.tiles.length;
        const offset = scrollOffsetsRef.current.get(column.key) ?? 0;
        const x = Math.sin(toRad(d)) * Rx;
        const faceScale = 0.55 + 0.45 * cosD;
        const faceOpacity = clamp(cosD * 1.5, 0, 1);
        const hidden = cosD <= 0.04;

        // Folder label — pinned in the reserved band at the very top of the
        // section, above every tile. Moves with drag (x), never with scroll.
        const label = labelRefs.current.get(column.key);
        if (label) {
          if (hidden) {
            label.style.opacity = "0";
            label.dataset.hidden = "true";
          } else {
            const labelY = -(h / 2) + LABEL_BAND / 2;
            label.style.transform = `translate(-50%, -50%) translate(${x}px, ${labelY}px) scale(${Math.max(faceScale, 0.7)})`;
            label.style.opacity = String(faceOpacity);
            label.style.zIndex = String(200 + Math.round(cosD * 10));
            label.dataset.hidden = "false";
          }
        }

        const tileAreaH = h - LABEL_BAND;
        const tileTotalH = Math.max(rows * spacing, tileAreaH);
        for (let r = 0; r < rows; r++) {
          const node = tileRefs.current.get(`${column.key}-${r}`);
          if (!node) continue;

          if (hidden) {
            node.style.opacity = "0";
            node.dataset.hidden = "true";
            continue;
          }

          const base = (r - (rows - 1) / 2) * spacing;
          // Always cyclic — even a 5-tile column wraps so scroll always moves.
          const yInBand = mod(base + offset + tileTotalH / 2, tileTotalH) - tileTotalH / 2;
          // Shift down so the tile band sits below the label strip.
          const y = yInBand + LABEL_BAND / 2;

          if (Math.abs(yInBand) > tileAreaH / 2 + spacing) {
            node.style.opacity = "0";
            node.dataset.hidden = "true";
            continue;
          }

          const vFall = 1 - 0.12 * Math.min(1, Math.abs(yInBand) / (tileAreaH / 2));
          const scale = faceScale * vFall;
          node.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
          node.style.opacity = String(faceOpacity);
          node.style.zIndex = String(Math.round(cosD * 100));
          node.dataset.hidden = "false";
        }
      });
    },
    [columns, rowSpacing]
  );

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      sizeRef.current = { w: cr.width, h: cr.height };
      applyLayout(rotationRef.current);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [applyLayout]);

  React.useEffect(() => {
    applyLayout(rotationRef.current);
  }, [applyLayout]);

  const stopInertia = React.useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = React.useCallback(
    (vx: number) => {
      let v = clamp(vx, -1.4, 1.4) * 80;
      let frames = 0;
      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        v *= frictionMul;
        if (Math.abs(v) < stopThreshold || ++frames > maxFrames) {
          inertiaRAF.current = null;
          return;
        }
        rotationRef.current = wrapAngleSigned(rotationRef.current + v / 200);
        applyLayout(rotationRef.current);
        lastInteractionAt.current = performance.now();
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [applyLayout, dragDampening, stopInertia]
  );

  useGesture(
    {
      onDragStart: () => {
        if (setDraggingRef.current) return;
        stopInertia();
        draggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = rotationRef.current;
        lastInteractionAt.current = performance.now();
      },
      onDrag: ({ last, movement, velocity = [0, 0], direction = [0, 0] }) => {
        if (setDraggingRef.current) return;
        if (!draggingRef.current) return;
        const [mx] = movement as [number, number];
        if (!movedRef.current && Math.abs(mx) > 4) movedRef.current = true;
        rotationRef.current = wrapAngleSigned(startRotRef.current + mx / dragSensitivity);
        applyLayout(rotationRef.current);
        lastInteractionAt.current = performance.now();
        if (last) {
          draggingRef.current = false;
          const vx = (velocity as [number, number])[0] * (direction as [number, number])[0];
          if (Math.abs(vx) > 0.005) startInertia(vx);
          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      },
    },
    { target: rootRef, eventOptions: { passive: true } }
  );

  /** Any visible column nearest the pointer — including placeholders. */
  const columnAtPointerX = React.useCallback(
    (clientX: number): Column | null => {
      const root = rootRef.current;
      if (!root) return null;
      const rect = root.getBoundingClientRect();
      const px = clientX - rect.left - rect.width / 2;
      const Rx = rect.width * 0.44;
      let best: Column | null = null;
      let bestDist = Infinity;
      for (const column of columns) {
        const d = wrapAngleSigned(column.lon + rotationRef.current);
        if (Math.cos(toRad(d)) <= 0.04) continue;
        const x = Math.sin(toRad(d)) * Rx;
        const dist = Math.abs(px - x);
        if (dist < 180 && dist < bestDist) {
          best = column;
          bestDist = dist;
        }
      }
      return best;
    },
    [columns]
  );

  /** Resolve where a dragged set would land under the pointer. */
  const resolveDropTarget = React.useCallback(
    (clientX: number): DropTarget => {
      const column = columnAtPointerX(clientX);
      if (column?.folder) {
        return { kind: "folder", folderId: column.folder.id, label: column.folder.title };
      }
      return { kind: "unfile" };
    },
    [columnAtPointerX]
  );

  const clearLongPress = React.useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pendingSetRef.current = null;
    pressOriginRef.current = null;
  }, []);

  const endSetDrag = React.useCallback(
    (drop: DropTarget | null, source: FlashcardSet, sourceFolderId?: string) => {
      setDraggingRef.current = false;
      setSetDrag(null);
      lastDragEndAt.current = performance.now();
      lastInteractionAt.current = performance.now();
      rootRef.current?.classList.remove("sphere-face--dragging-set");

      if (!drop || !onMoveSet) return;

      const nextFolderId = drop.kind === "folder" ? drop.folderId : undefined;
      const currentFolderId = sourceFolderId;
      // No-op if nothing changed.
      if (nextFolderId === currentFolderId) return;
      // Also no-op when already unfiled and dropping to unfile.
      if (nextFolderId === undefined && !currentFolderId) return;

      onMoveSet(source.id, nextFolderId);
    },
    [onMoveSet]
  );

  const beginSetDrag = React.useCallback(
    (set: FlashcardSet, clientX: number, clientY: number) => {
      stopInertia();
      draggingRef.current = false;
      setDraggingRef.current = true;
      clearLongPress();
      rootRef.current?.classList.add("sphere-face--dragging-set");
      setSetDrag({
        set,
        sourceFolderId: set.folderId,
        x: clientX,
        y: clientY,
        drop: resolveDropTarget(clientX),
      });
      // Light haptic where available.
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          /* ignore */
        }
      }
    },
    [clearLongPress, resolveDropTarget, stopInertia]
  );

  const onSetPointerDown = React.useCallback(
    (set: FlashcardSet, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      // Don't steal multi-touch.
      if (e.pointerType === "touch" && e.isPrimary === false) return;
      clearLongPress();
      pendingSetRef.current = set;
      pressOriginRef.current = { x: e.clientX, y: e.clientY };
      longPressTimerRef.current = window.setTimeout(() => {
        const pending = pendingSetRef.current;
        const origin = pressOriginRef.current;
        if (!pending || !origin) return;
        beginSetDrag(pending, origin.x, origin.y);
      }, LONG_PRESS_MS);
    },
    [beginSetDrag, clearLongPress]
  );

  // Global pointer tracking while a long-press is pending or a set is mid-drag.
  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      const origin = pressOriginRef.current;
      if (origin && !setDraggingRef.current) {
        const dx = e.clientX - origin.x;
        const dy = e.clientY - origin.y;
        if (dx * dx + dy * dy > LONG_PRESS_MOVE_CANCEL * LONG_PRESS_MOVE_CANCEL) {
          clearLongPress();
        }
        return;
      }
      if (!setDraggingRef.current) return;
      lastInteractionAt.current = performance.now();
      setSetDrag((prev) =>
        prev
          ? {
              ...prev,
              x: e.clientX,
              y: e.clientY,
              drop: resolveDropTarget(e.clientX),
            }
          : null
      );
    }

    function onUp(e: PointerEvent) {
      if (setDraggingRef.current) {
        setSetDrag((prev) => {
          if (prev) {
            // Resolve drop at release position for accuracy.
            const drop = resolveDropTarget(e.clientX);
            // Defer mutation so React can clear the ghost first.
            queueMicrotask(() => endSetDrag(drop, prev.set, prev.sourceFolderId));
          } else {
            setDraggingRef.current = false;
            rootRef.current?.classList.remove("sphere-face--dragging-set");
          }
          return null;
        });
        return;
      }
      clearLongPress();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && setDraggingRef.current) {
        setDraggingRef.current = false;
        setSetDrag(null);
        rootRef.current?.classList.remove("sphere-face--dragging-set");
        clearLongPress();
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [clearLongPress, endSetDrag, resolveDropTarget]);

  React.useEffect(() => {
    return () => clearLongPress();
  }, [clearLongPress]);

  /** Eases every column's offset toward its wheel target for buttery scroll. */
  const runScrollAnimation = React.useCallback(() => {
    if (scrollAnimRAF.current !== null) return;
    const step = () => {
      let active = false;
      scrollTargetsRef.current.forEach((target, key) => {
        const current = scrollOffsetsRef.current.get(key) ?? 0;
        const delta = target - current;
        if (Math.abs(delta) < 0.4) {
          scrollOffsetsRef.current.set(key, target);
        } else {
          scrollOffsetsRef.current.set(key, current + delta * SCROLL_SMOOTHING);
          active = true;
        }
      });
      applyLayout(rotationRef.current);
      scrollAnimRAF.current = active ? requestAnimationFrame(step) : null;
    };
    scrollAnimRAF.current = requestAnimationFrame(step);
  }, [applyLayout]);

  React.useEffect(() => {
    return () => {
      if (scrollAnimRAF.current !== null) cancelAnimationFrame(scrollAnimRAF.current);
    };
  }, []);

  // Wheel ALWAYS stays inside the gallery and ALWAYS scrolls a column —
  // including empty folders and placeholder columns. Deltas feed a target
  // that the offset eases toward instead of jumping.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      e.stopPropagation();
      let column = columnAtPointerX(e.clientX);
      // Fallback: if the pointer isn't near any column, scroll the frontmost one.
      if (!column) {
        let bestCos = -1;
        for (const c of columns) {
          const cos = Math.cos(toRad(wrapAngleSigned(c.lon + rotationRef.current)));
          if (cos > bestCos) {
            bestCos = cos;
            column = c;
          }
        }
      }
      if (!column) return;
      const prevTarget =
        scrollTargetsRef.current.get(column.key) ??
        scrollOffsetsRef.current.get(column.key) ??
        0;
      const nextTarget = prevTarget - e.deltaY;
      scrollTargetsRef.current.set(column.key, nextTarget);
      lastInteractionAt.current = performance.now();
      if (reducedMotion) {
        scrollOffsetsRef.current.set(column.key, nextTarget);
        applyLayout(rotationRef.current);
      } else {
        runScrollAnimation();
      }
    }
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [applyLayout, columnAtPointerX, columns, runScrollAnimation]);

  // Idle auto-spin after `idleSpinDelayMs` without interaction.
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let timer: number | null = null;
    let visible = true;
    let disposed = false;

    const cancelScheduled = () => {
      if (raf) cancelAnimationFrame(raf);
      if (timer !== null) window.clearTimeout(timer);
      raf = 0;
      timer = null;
    };

    const schedule = (delay = 0) => {
      if (disposed || !visible || document.hidden || raf || timer !== null) return;
      if (delay > 0) {
        timer = window.setTimeout(step, delay);
      } else {
        raf = requestAnimationFrame(step);
      }
    };

    const step = () => {
      raf = 0;
      timer = null;
      if (disposed || !visible || document.hidden) return;

      const idleFor = performance.now() - lastInteractionAt.current;
      const idle =
        !draggingRef.current &&
        !setDraggingRef.current &&
        inertiaRAF.current === null &&
        idleFor > idleSpinDelayMs;
      if (idle) {
        rotationRef.current = wrapAngleSigned(rotationRef.current + IDLE_SPIN_DEG_PER_FRAME);
        applyLayout(rotationRef.current);
        schedule();
      } else {
        // There is no reason to poll at display refresh rate while waiting for
        // the idle-spin delay to expire.
        schedule(Math.min(500, Math.max(100, idleSpinDelayMs - idleFor)));
      }
    };

    const syncLoop = () => {
      if (visible && !document.hidden) schedule();
      else cancelScheduled();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        syncLoop();
      },
      { threshold: 0 }
    );
    observer.observe(root);
    document.addEventListener("visibilitychange", syncLoop);
    syncLoop();

    return () => {
      disposed = true;
      cancelScheduled();
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncLoop);
    };
  }, [applyLayout, idleSpinDelayMs]);

  const guardClick = () => {
    if (setDraggingRef.current || draggingRef.current || movedRef.current) return false;
    if (performance.now() - lastDragEndAt.current < 120) return false;
    lastInteractionAt.current = performance.now();
    return true;
  };

  const registerTile = (key: string) => (node: HTMLDivElement | null) => {
    if (node) tileRefs.current.set(key, node);
    else tileRefs.current.delete(key);
  };

  const registerLabel = (key: string) => (node: HTMLDivElement | null) => {
    if (node) labelRefs.current.set(key, node);
    else labelRefs.current.delete(key);
  };

  const dropFolderId = setDrag?.drop?.kind === "folder" ? setDrag.drop.folderId : null;
  const droppingToUnfile = setDrag?.drop?.kind === "unfile";

  return (
    <div
      ref={rootRef}
      className={`sphere-face${setDrag ? " sphere-face--dragging-set" : ""}`}
      style={{ "--sphere-bg": sphereBg } as React.CSSProperties}
      data-drop={
        setDrag
          ? setDrag.drop?.kind === "folder"
            ? `folder:${setDrag.drop.folderId}`
            : "unfile"
          : undefined
      }
    >
      {columns.map((column) => {
        const isDropFolder =
          !!dropFolderId && column.folder?.id === dropFolderId;
        return (
          <React.Fragment key={column.key}>
            {column.label && (
              <div
                ref={registerLabel(column.key)}
                className={`sphere-face__label${isDropFolder ? " sphere-face__label--drop" : ""}`}
                style={{ opacity: 0 }}
              >
                {column.folder && (
                  <span
                    className="sphere-face__label-dot"
                    style={{ backgroundColor: column.folder.color }}
                  />
                )}
                <span className="sphere-face__label-text">{column.label}</span>
              </div>
            )}
            {column.tiles.map((tile, r) => {
              const isSource =
                tile.kind === "set" && setDrag?.set.id === tile.set.id;
              return (
                <div
                  key={
                    tile.kind === "set"
                      ? `set-${tile.set.id}`
                      : `${column.key}-plus-${r}`
                  }
                  ref={registerTile(`${column.key}-${r}`)}
                  className={`sphere-face__tile${isSource ? " sphere-face__tile--source" : ""}${
                    isDropFolder ? " sphere-face__tile--drop-col" : ""
                  }`}
                  style={{ opacity: 0 }}
                >
                  {tile.kind === "set" ? (
                    <button
                      type="button"
                      onPointerDown={(e) => onSetPointerDown(tile.set, e)}
                      onClick={() => {
                        if (guardClick()) onSetClick?.(tile.set);
                      }}
                      className="glass-panel glass-panel-hover flex h-[84px] w-40 cursor-pointer flex-col justify-between rounded-xl p-3 text-left touch-none select-none"
                    >
                      <div>
                        <p className="truncate text-xs font-semibold text-foreground">
                          {tile.set.title}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {tile.set.subject}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Layers className="h-3 w-3" />
                        {tile.set.cards.length}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={
                        tile.folderId
                          ? `Create a new set in ${column.folder?.title ?? "this folder"}`
                          : "Create a new flashcard set"
                      }
                      onClick={() => {
                        if (guardClick()) onCreateSet?.(tile.folderId);
                      }}
                      className={cn(
                        "flex h-[84px] w-40 cursor-pointer items-center justify-center rounded-xl border border-dashed backdrop-blur-md transition-colors duration-200",
                        isDropFolder
                          ? "border-accent/50 bg-accent/10"
                          : "border-border bg-card/60 hover:border-border-strong hover:bg-card"
                      )}
                    >
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {setDrag && (
        <>
          <div className="sphere-face__drop-hint" aria-live="polite">
            {droppingToUnfile
              ? "Release to unfile as its own column"
              : setDrag.drop?.kind === "folder"
                ? `Release to move into ${setDrag.drop.label}`
                : "Drag onto a folder — or away from folders to unfile"}
          </div>
          <div
            className="sphere-face__ghost"
            style={{
              left: setDrag.x,
              top: setDrag.y,
            }}
          >
            <div className="glass-panel flex h-[84px] w-40 flex-col justify-between rounded-xl p-3 text-left shadow-[var(--shadow-elevation-3)]">
              <div>
                <p className="truncate text-xs font-semibold text-foreground">{setDrag.set.title}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{setDrag.set.subject}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Layers className="h-3 w-3" />
                {setDrag.set.cards.length}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="sphere-face__vignette" />
    </div>
  );
}
