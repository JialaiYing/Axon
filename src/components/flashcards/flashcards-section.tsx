"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  FolderPlus,
  Layers,
  Pin,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlashcards } from "@/hooks/use-flashcards";
import { CreateFolderDialog } from "@/components/flashcards/create-folder-dialog";
import { CreateSetDialog } from "@/components/flashcards/create-set-dialog";
import { FolderViewDialog } from "@/components/flashcards/folder-view-dialog";
import { SetViewDialog } from "@/components/flashcards/set-view-dialog";
import { StudyView } from "@/components/flashcards/study-view";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import type { FlashcardFolder, FlashcardSet } from "@/types";
import { cn } from "@/lib/utils";

/**
 * The dome view pulls in Three.js/OGL + gesture libs, but the default view
 * is the plain grid — defer that whole chunk until someone actually opens
 * "Visual gallery" instead of shipping it on every Flashcards page load.
 */
const DomeGallery = dynamic(() => import("@/components/flashcards/dome-gallery"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  ),
});

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** How long the cinematic loading state shows between dome and study view. */
const STUDY_LOAD_MS = 700;

type LibraryView = "grid" | "dome";

type LibraryMode =
  | { type: "library"; view: LibraryView }
  | { type: "loading"; setId: string }
  | { type: "study"; setId: string };

function HomePanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("glass-panel glass-panel-hover rounded-2xl p-4", className)}>{children}</div>
  );
}

function StudyLoader() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative h-12 w-12">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-foreground/10"
          aria-hidden
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
        className="text-xs uppercase tracking-[0.2em] text-foreground/50"
      >
        Preparing your set
      </motion.p>
    </div>
  );
}

export function FlashcardsSection() {
  const prefersReducedMotion = useReducedMotion();
  const {
    folders,
    sets,
    hydrated,
    addFolder,
    deleteFolder,
    touchFolder,
    addSet,
    updateSet,
    deleteSet,
    touchSet,
    addCard,
    deleteCard,
    setsInFolder,
    recents,
    lastStudiedSet,
    totalCards,
    toggleFolderInDome,
    toggleFolderPinned,
    toggleSetPinned,
    pinned,
  } = useFlashcards();

  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [createSetOpen, setCreateSetOpen] = React.useState(false);
  const [createSetFolderId, setCreateSetFolderId] = React.useState<string | undefined>(undefined);
  const [viewFolderId, setViewFolderId] = React.useState<string | null>(null);
  const [editSetId, setEditSetId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<LibraryMode>({ type: "library", view: "grid" });
  const [libraryView, setLibraryView] = React.useState<LibraryView>("grid");
  const loadTimerRef = React.useRef<number | null>(null);

  // Resolve live objects from ids so views always show fresh data.
  const viewFolder = folders.find((f) => f.id === viewFolderId) ?? null;
  const editSet = sets.find((s) => s.id === editSetId) ?? null;
  const studySet =
    mode.type === "study" || mode.type === "loading"
      ? sets.find((s) => s.id === mode.setId) ?? null
      : null;

  React.useEffect(() => {
    return () => {
      if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
    };
  }, []);

  const openFolder = React.useCallback(
    (folder: FlashcardFolder) => {
      touchFolder(folder.id);
      setViewFolderId(folder.id);
    },
    [touchFolder]
  );

  /** Enter study view — skip the cinematic loader when opening from the grid. */
  const openSetForStudy = React.useCallback(
    (set: FlashcardSet) => {
      touchSet(set.id);
      setViewFolderId(null);
      if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
      if (libraryView === "dome" && !prefersReducedMotion) {
        setMode({ type: "loading", setId: set.id });
        loadTimerRef.current = window.setTimeout(
          () => setMode({ type: "study", setId: set.id }),
          STUDY_LOAD_MS
        );
      } else {
        setMode({ type: "study", setId: set.id });
      }
    },
    [libraryView, prefersReducedMotion, touchSet]
  );

  const backToLibrary = React.useCallback(() => {
    if (loadTimerRef.current) window.clearTimeout(loadTimerRef.current);
    setMode({ type: "library", view: libraryView });
  }, [libraryView]);

  // If the studied set gets deleted (via the edit dialog), fall back to the library.
  React.useEffect(() => {
    if ((mode.type === "study" || mode.type === "loading") && !studySet) {
      backToLibrary();
    }
  }, [mode.type, studySet, backToLibrary]);

  const avgMastery = React.useMemo(() => {
    const allCards = sets.flatMap((s) => s.cards);
    if (allCards.length === 0) return 0;
    return Math.round(allCards.reduce((sum, c) => sum + c.masteryPercent, 0) / allCards.length);
  }, [sets]);

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[calc(100dvh-13rem)] min-h-[480px] rounded-2xl lg:col-span-3" />
      </div>
    );
  }

  return (
    <>
      <FeatureIntro feature="flashcards" />
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-4"
      >
        {/* ── Home column (1/4) ─────────────────────────────────────── */}
        <div className="flex max-h-[calc(100dvh-13rem)] min-h-[480px] flex-col gap-4 overflow-y-auto pr-0.5">
          <h2 className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/50">
            Home
          </h2>
          {/* Jump right back in */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Jump right back in
              </h2>
            </div>
            {lastStudiedSet ? (
              <button
                type="button"
                onClick={() => openSetForStudy(lastStudiedSet)}
                className="w-full cursor-pointer rounded-xl border border-foreground/8 bg-foreground/[0.04] p-3.5 text-left transition-all duration-200 hover:border-foreground/16 hover:bg-foreground/[0.07]"
              >
                <p className="truncate text-sm font-medium text-foreground">{lastStudiedSet.title}</p>
                <p className="mt-1 text-xs text-foreground/45">
                  {lastStudiedSet.subject} · {lastStudiedSet.cards.length} card
                  {lastStudiedSet.cards.length === 1 ? "" : "s"}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Continue <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            ) : (
              <p className="rounded-xl border border-dashed border-foreground/10 p-3.5 text-xs leading-relaxed text-foreground/45">
                Open a set and it will show up here for quick access.
              </p>
            )}
          </HomePanel>

          {/* Create */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Create
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-pointer justify-start"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlus className="h-3.5 w-3.5" /> New folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-pointer justify-start"
                onClick={() => {
                  setCreateSetFolderId(undefined);
                  setCreateSetOpen(true);
                }}
              >
                <Layers className="h-3.5 w-3.5" /> New flashcard set
              </Button>
            </div>
          </HomePanel>

          {/* Pinned */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Pin className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Pinned
              </h2>
            </div>
            {pinned.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/10 p-3.5 text-xs leading-relaxed text-foreground/45">
                Pin folders or sets below for quick access.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {pinned.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (entry.kind === "folder") {
                          const folder = folders.find((f) => f.id === entry.id);
                          if (folder) openFolder(folder);
                        } else {
                          const set = sets.find((s) => s.id === entry.id);
                          if (set) openSetForStudy(set);
                        }
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.06]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {entry.kind === "folder" && entry.color && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: entry.color }}
                          />
                        )}
                        <span className="truncate text-xs font-medium text-foreground/80">
                          {entry.title}
                        </span>
                      </span>
                      <Badge variant={entry.kind === "folder" ? "secondary" : "accent"}>
                        {entry.kind}
                      </Badge>
                    </button>
                    <button
                      type="button"
                      aria-label={`Unpin ${entry.title}`}
                      onClick={() =>
                        entry.kind === "folder"
                          ? toggleFolderPinned(entry.id)
                          : toggleSetPinned(entry.id)
                      }
                      className="cursor-pointer rounded-md p-1.5 text-accent opacity-70 transition-opacity hover:opacity-100"
                    >
                      <Pin className="h-3 w-3 fill-current" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </HomePanel>

          {/* Dome visibility — hide / add folders to the gallery */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Dome folders
              </h2>
            </div>
            {folders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/10 p-3.5 text-xs leading-relaxed text-foreground/45">
                Create a folder to place it in the dome.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {folders.map((folder) => {
                  const visible = folder.showInDome !== false;
                  return (
                    <li
                      key={folder.id}
                      className="flex items-center gap-1 rounded-lg px-1 py-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => openFolder(folder)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-foreground/[0.06]"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate text-xs font-medium text-foreground/80">
                          {folder.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={folder.pinned ? `Unpin ${folder.title}` : `Pin ${folder.title}`}
                        onClick={() => toggleFolderPinned(folder.id)}
                        className={cn(
                          "cursor-pointer rounded-md p-1.5 transition-colors",
                          folder.pinned
                            ? "text-accent"
                            : "text-foreground/35 hover:text-foreground/70"
                        )}
                      >
                        <Pin className={cn("h-3 w-3", folder.pinned && "fill-current")} />
                      </button>
                      <button
                        type="button"
                        aria-label={
                          visible
                            ? `Hide ${folder.title} from dome`
                            : `Show ${folder.title} in dome`
                        }
                        onClick={() => toggleFolderInDome(folder.id)}
                        className={cn(
                          "cursor-pointer rounded-md p-1.5 transition-colors",
                          visible ? "text-accent" : "text-foreground/35 hover:text-foreground/70"
                        )}
                      >
                        {visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {sets.length > 0 && (
              <div className="mt-3 border-t border-foreground/8 pt-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-foreground/40">
                  Pin sets
                </p>
                <ul className="max-h-36 space-y-1 overflow-y-auto">
                  {sets.map((set) => (
                    <li key={set.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openSetForStudy(set)}
                        className="min-w-0 flex-1 cursor-pointer truncate rounded-lg px-1.5 py-1.5 text-left text-xs text-foreground/75 transition-colors hover:bg-foreground/[0.06]"
                      >
                        {set.title}
                      </button>
                      <button
                        type="button"
                        aria-label={set.pinned ? `Unpin ${set.title}` : `Pin ${set.title}`}
                        onClick={() => toggleSetPinned(set.id)}
                        className={cn(
                          "cursor-pointer rounded-md p-1.5 transition-colors",
                          set.pinned ? "text-accent" : "text-foreground/35 hover:text-foreground/70"
                        )}
                      >
                        <Pin className={cn("h-3 w-3", set.pinned && "fill-current")} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </HomePanel>

          {/* Recents */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Recents
              </h2>
            </div>
            {recents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-foreground/10 p-3.5 text-xs leading-relaxed text-foreground/45">
                Folders and sets you open will appear here.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {recents.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        if (entry.kind === "folder") {
                          const folder = folders.find((f) => f.id === entry.id);
                          if (folder) openFolder(folder);
                        } else {
                          const set = sets.find((s) => s.id === entry.id);
                          if (set) openSetForStudy(set);
                        }
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.06]"
                    >
                      <span className="min-w-0 truncate text-xs font-medium text-foreground/80">
                        {entry.title}
                      </span>
                      <Badge variant={entry.kind === "folder" ? "secondary" : "accent"}>
                        {entry.kind}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </HomePanel>

          {/* Library stats */}
          <HomePanel>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">
                At a glance
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-2">
              {[
                { label: "Folders", value: folders.length },
                { label: "Sets", value: sets.length },
                { label: "Cards", value: totalCards },
                { label: "Mastery", value: `${avgMastery}%` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-foreground/8 bg-foreground/[0.04] p-2.5 text-center"
                >
                  <p className="text-sm font-semibold tabular-nums text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-foreground/45">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </HomePanel>
        </div>

        {/* ── Library (3/4): grid (default) ↔ dome ↔ study ──────────── */}
        <div
          className={cn(
            "relative h-[calc(100dvh-13rem)] min-h-[480px] rounded-2xl border border-foreground/8 bg-background/40 lg:col-span-3",
            mode.type === "study" ? "overflow-y-auto p-5 md:p-6" : "overflow-hidden"
          )}
        >
          <AnimatePresence mode="wait">
            {mode.type === "library" && (
              <motion.div
                key={`library-${mode.view}`}
                className="flex h-full flex-col"
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <div className="flex items-center justify-between gap-2 border-b border-foreground/8 bg-foreground/[0.02] px-4 py-2.5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/50">
                    Library
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-0.5 rounded-lg border border-foreground/10 bg-foreground/[0.03] p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLibraryView("grid");
                          setMode({ type: "library", view: "grid" });
                        }}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors",
                          mode.view === "grid"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/50 hover:text-foreground"
                        )}
                      >
                        Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLibraryView("dome");
                          setMode({ type: "library", view: "dome" });
                        }}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors",
                          mode.view === "dome"
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/50 hover:text-foreground"
                        )}
                      >
                        Visual gallery
                      </button>
                    </div>
                    <span className="text-[10px] tabular-nums text-foreground/35">
                      {sets.length} set{sets.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {mode.view === "grid" ? (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {sets.length === 0 ? (
                      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                        <Layers className="h-8 w-8 text-foreground/35" />
                        <div>
                          <p className="text-sm font-medium text-foreground">No flashcard sets yet</p>
                          <p className="mt-1 max-w-xs text-xs text-foreground/45">
                            Create a set from the Home column, then study with simple flip cards.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setCreateSetFolderId(undefined);
                            setCreateSetOpen(true);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create first set
                        </Button>
                      </div>
                    ) : (
                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {sets.map((set) => (
                          <li key={set.id}>
                            <button
                              type="button"
                              onClick={() => openSetForStudy(set)}
                              className="flex h-full w-full cursor-pointer flex-col rounded-xl border border-foreground/10 bg-foreground/[0.04] p-4 text-left transition-colors hover:border-foreground/20 hover:bg-foreground/[0.07]"
                            >
                              <p className="truncate text-sm font-semibold text-foreground">{set.title}</p>
                              <p className="mt-1 text-xs text-foreground/45">
                                {set.subject || "General"} · {set.cards.length} card
                                {set.cards.length === 1 ? "" : "s"}
                              </p>
                              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
                                Study <ArrowRight className="h-3 w-3" />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="relative min-h-0 flex-1">
                      <DomeGallery
                        sets={sets}
                        folders={folders}
                        onSetClick={openSetForStudy}
                        onCreateSet={(folderId) => {
                          setCreateSetFolderId(folderId);
                          setCreateSetOpen(true);
                        }}
                        onMoveSet={(setId, folderId) => updateSet(setId, { folderId })}
                        dragDampening={2}
                        idleSpinDelayMs={10000}
                      />
                    </div>
                    <div className="flex w-full items-center justify-center border-t border-foreground/8 bg-foreground/[0.02] py-2.5">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">
                        Drag to explore · Hold a set to move it · Scroll a column to browse
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {mode.type === "loading" && (
              <motion.div
                key="loading"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <StudyLoader />
              </motion.div>
            )}

            {mode.type === "study" && studySet && (
              <motion.div
                key={`study-${studySet.id}`}
                className="min-h-full"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <StudyView
                  set={studySet}
                  onBack={backToLibrary}
                  onEdit={() => setEditSetId(studySet.id)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={(input) => addFolder(input)}
      />

      <CreateSetDialog
        open={createSetOpen}
        onOpenChange={setCreateSetOpen}
        folders={folders}
        defaultFolderId={createSetFolderId}
        onCreateFolder={(title) => addFolder({ title })}
        onCreate={(input) => {
          // Deliberately not touchSet() here — creating a set opens it for
          // editing (adding cards), not studying it, so it shouldn't jump
          // to the top of "Recents" or become the dashboard's "Jump back
          // in" target until it's actually been opened to study.
          const set = addSet(input);
          setEditSetId(set.id);
        }}
      />

      <FolderViewDialog
        folder={viewFolder}
        sets={viewFolder ? setsInFolder(viewFolder.id) : []}
        onOpenChange={(open) => {
          if (!open) setViewFolderId(null);
        }}
        onOpenSet={openSetForStudy}
        onNewSet={() => {
          if (viewFolder) {
            setCreateSetFolderId(viewFolder.id);
            setViewFolderId(null);
            setCreateSetOpen(true);
          }
        }}
        onDeleteFolder={deleteFolder}
      />

      <SetViewDialog
        set={editSet}
        onOpenChange={(open) => {
          if (!open) setEditSetId(null);
        }}
        onAddCard={addCard}
        onDeleteCard={deleteCard}
        onDeleteSet={deleteSet}
      />
    </>
  );
}
