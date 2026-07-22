"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  LayoutGrid,
  Layers,
  List,
  Pin,
  Trash2,
} from "lucide-react";
import { FolderIcon } from "@/components/flashcards/folder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FlashcardFolder, FlashcardSet } from "@/types";
import { cn } from "@/lib/utils";

export type GridLayoutMode = "icons" | "list";

const LAYOUT_OPTIONS: {
  id: GridLayoutMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "icons", label: "Icons", description: "Large tiles", icon: LayoutGrid },
  { id: "list", label: "List", description: "Name and details", icon: List },
];

interface FlashcardsGridLibraryProps {
  folders: FlashcardFolder[];
  unfiledSets: FlashcardSet[];
  folder: FlashcardFolder | null;
  folderSets: FlashcardSet[];
  layout: GridLayoutMode;
  onLayoutChange: (layout: GridLayoutMode) => void;
  onOpenFolder: (folder: FlashcardFolder) => void;
  onBack: () => void;
  onOpenSet: (set: FlashcardSet) => void;
  onToggleFolderPin: (id: string) => void;
  onToggleSetPin: (id: string) => void;
  onShowInDome?: (id: string) => void;
  onDeleteFolder: () => void;
  onRecycleFolder: (folder: FlashcardFolder) => void;
  onRecycleSet: (set: FlashcardSet) => void;
  onMoveSet: (setId: string, folderId: string | undefined) => void;
  setsInFolder: (folderId: string) => FlashcardSet[];
}

function setDragId(id: string) {
  return `set:${id}`;
}
function folderDropId(id: string) {
  return `folder:${id}`;
}
const ROOT_DROP_ID = "library-root";

function parseSetDragId(id: string | number) {
  const value = String(id);
  return value.startsWith("set:") ? value.slice(4) : null;
}
function parseFolderDropId(id: string | number) {
  const value = String(id);
  return value.startsWith("folder:") ? value.slice(7) : null;
}

export function FlashcardsGridLibrary({
  folders,
  unfiledSets,
  folder,
  folderSets,
  layout,
  onLayoutChange,
  onOpenFolder,
  onBack,
  onOpenSet,
  onToggleFolderPin,
  onToggleSetPin,
  onShowInDome,
  onDeleteFolder,
  onRecycleFolder,
  onRecycleSet,
  onMoveSet,
  setsInFolder,
}: FlashcardsGridLibraryProps) {
  const [activeSetId, setActiveSetId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeSet = React.useMemo(() => {
    if (!activeSetId) return null;
    return (
      folderSets.find((s) => s.id === activeSetId) ??
      unfiledSets.find((s) => s.id === activeSetId) ??
      null
    );
  }, [activeSetId, folderSets, unfiledSets]);

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const setId = parseSetDragId(event.active.id);
    if (setId) setActiveSetId(setId);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveSetId(null);
      const setId = parseSetDragId(event.active.id);
      if (!setId || !event.over) return;

      if (String(event.over.id) === ROOT_DROP_ID) {
        const current = folderSets.find((s) => s.id === setId) ?? unfiledSets.find((s) => s.id === setId);
        if (current?.folderId) onMoveSet(setId, undefined);
        return;
      }

      const targetFolderId = parseFolderDropId(event.over.id);
      if (!targetFolderId) return;
      const current =
        folderSets.find((s) => s.id === setId) ?? unfiledSets.find((s) => s.id === setId);
      if (!current || current.folderId === targetFolderId) return;
      onMoveSet(setId, targetFolderId);
    },
    [folderSets, onMoveSet, unfiledSets]
  );

  const empty =
    folder != null
      ? folderSets.length === 0
      : folders.length === 0 && unfiledSets.length === 0;

  const layoutOption = LAYOUT_OPTIONS.find((o) => o.id === layout) ?? LAYOUT_OPTIONS[0]!;
  const LayoutIcon = layoutOption.icon;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-foreground/8 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {folder ? (
            <>
              <RootDropZone onBack={onBack} active={Boolean(activeSetId)} />
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: folder.color }}
              />
              <p className="truncate text-sm font-medium text-foreground">{folder.title}</p>
            </>
          ) : (
            <p className="text-xs font-medium text-foreground/50">All items</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-foreground/10 bg-foreground/[0.03] px-2 text-[11px] font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                aria-label="Change library view"
              >
                <LayoutIcon className="h-3.5 w-3.5" />
                {layoutOption.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              {LAYOUT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = layout === option.id;
                return (
                  <DropdownMenuItem
                    key={option.id}
                    onSelect={() => onLayoutChange(option.id)}
                    className="justify-between gap-3"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </span>
                    {selected ? <Check className="h-3.5 w-3.5 text-accent" /> : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {folder ? (
            <button
              type="button"
              aria-label={`Move folder ${folder.title} to recycle bin`}
              onClick={onDeleteFolder}
              className="cursor-pointer rounded-md px-2 py-1.5 text-[11px] text-foreground/35 transition-colors hover:bg-foreground/[0.06] hover:text-destructive"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveSetId(null)}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {empty ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <Layers className="h-8 w-8 text-foreground/35" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {folder ? "No sets in this folder" : "No folders or sets yet"}
                </p>
                <p className="mt-1 max-w-xs text-xs text-foreground/45">
                  {folder
                    ? "Use Create below to add a set, or drag one here from another folder."
                    : "Use Create below to add a folder or an unfiled set."}
                </p>
              </div>
            </div>
          ) : layout === "icons" ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {folder
                ? folderSets.map((set) => (
                    <li key={set.id}>
                      <SetItem
                        set={set}
                        layout="icons"
                        onOpen={() => onOpenSet(set)}
                        onTogglePin={() => onToggleSetPin(set.id)}
                        onRecycle={() => onRecycleSet(set)}
                      />
                    </li>
                  ))
                : (
                    <>
                      {folders.map((f) => (
                        <li key={f.id}>
                          <FolderItem
                            folder={f}
                            setCount={setsInFolder(f.id).length}
                            layout="icons"
                            onOpen={() => onOpenFolder(f)}
                            onTogglePin={() => onToggleFolderPin(f.id)}
                            onRecycle={() => onRecycleFolder(f)}
                            onShowInDome={
                              f.showInDome === false && onShowInDome
                                ? () => onShowInDome(f.id)
                                : undefined
                            }
                          />
                        </li>
                      ))}
                      {unfiledSets.map((set) => (
                        <li key={set.id}>
                          <SetItem
                            set={set}
                            layout="icons"
                            onOpen={() => onOpenSet(set)}
                            onTogglePin={() => onToggleSetPin(set.id)}
                            onRecycle={() => onRecycleSet(set)}
                          />
                        </li>
                      ))}
                    </>
                  )}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-xl border border-foreground/10">
              <div className="grid grid-cols-[minmax(0,1fr)_7rem_6rem] gap-2 border-b border-foreground/8 bg-foreground/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
                <span>Name</span>
                <span>Type</span>
                <span className="text-right">Details</span>
              </div>
              <ul>
                {folder
                  ? folderSets.map((set) => (
                      <li key={set.id}>
                        <SetItem
                          set={set}
                          layout="list"
                          onOpen={() => onOpenSet(set)}
                          onTogglePin={() => onToggleSetPin(set.id)}
                          onRecycle={() => onRecycleSet(set)}
                        />
                      </li>
                    ))
                  : (
                      <>
                        {folders.map((f) => (
                          <li key={f.id}>
                            <FolderItem
                              folder={f}
                              setCount={setsInFolder(f.id).length}
                              layout="list"
                              onOpen={() => onOpenFolder(f)}
                              onTogglePin={() => onToggleFolderPin(f.id)}
                              onRecycle={() => onRecycleFolder(f)}
                              onShowInDome={
                                f.showInDome === false && onShowInDome
                                  ? () => onShowInDome(f.id)
                                  : undefined
                              }
                            />
                          </li>
                        ))}
                        {unfiledSets.map((set) => (
                          <li key={set.id}>
                            <SetItem
                              set={set}
                              layout="list"
                              onOpen={() => onOpenSet(set)}
                              onTogglePin={() => onToggleSetPin(set.id)}
                              onRecycle={() => onRecycleSet(set)}
                            />
                          </li>
                        ))}
                      </>
                    )}
              </ul>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeSet ? (
            <div className="w-52 rounded-xl border border-accent/40 bg-card px-3 py-2.5 shadow-[var(--shadow-elevation-3)]">
              <p className="truncate text-sm font-semibold text-foreground">{activeSet.title}</p>
              <p className="mt-0.5 text-[11px] text-foreground/45">
                {activeSet.subject || "General"} · {activeSet.cards.length} card
                {activeSet.cards.length === 1 ? "" : "s"}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function RootDropZone({ onBack, active }: { onBack: () => void; active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT_DROP_ID });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onBack}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors",
        isOver && active
          ? "bg-accent/15 text-accent"
          : "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground"
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {isOver && active ? "Move to library" : "Back"}
    </button>
  );
}

function MiniPinButton({
  pinned,
  label,
  onClick,
  className,
}: {
  pinned?: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "cursor-pointer rounded-md p-1.5 transition-colors",
        pinned
          ? "text-accent"
          : "text-foreground/30 opacity-0 group-hover:opacity-100 hover:text-foreground/70 focus-visible:opacity-100",
        className
      )}
    >
      <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
    </button>
  );
}

function MiniTrashButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Move ${label} to recycle bin`}
      title="Move to recycle bin"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "cursor-pointer rounded-md p-1.5 text-foreground/30 opacity-0 transition-colors group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100",
        className
      )}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function FolderItem({
  folder,
  setCount,
  layout,
  onOpen,
  onTogglePin,
  onRecycle,
  onShowInDome,
}: {
  folder: FlashcardFolder;
  setCount: number;
  layout: GridLayoutMode;
  onOpen: () => void;
  onTogglePin: () => void;
  onRecycle: () => void;
  onShowInDome?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: folderDropId(folder.id),
    data: { kind: "folder", folderId: folder.id },
  });

  if (layout === "list") {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "group grid grid-cols-[minmax(0,1fr)_7rem_6rem] items-center gap-2 border-b border-foreground/6 px-2 py-1.5 last:border-b-0",
          isOver && "bg-accent/10"
        )}
      >
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpen}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-foreground/[0.05]"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-[3px]"
              style={{ backgroundColor: folder.color }}
            />
            <span className="truncate text-sm font-medium text-foreground">{folder.title}</span>
          </button>
          <div className="flex shrink-0 items-center">
            {onShowInDome && (
              <button
                type="button"
                aria-label={`Show ${folder.title} in dome gallery`}
                title="Show in visual gallery"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowInDome();
                }}
                className="cursor-pointer rounded-md p-1.5 text-foreground/35 transition-colors hover:text-foreground/70"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
            <MiniPinButton pinned={folder.pinned} label={folder.title} onClick={onTogglePin} />
            <MiniTrashButton label={folder.title} onClick={onRecycle} />
          </div>
        </div>
        <span className="text-xs text-foreground/45">Folder</span>
        <span className="text-right font-mono text-xs tabular-nums text-foreground/45">
          {setCount} set{setCount === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative rounded-xl transition-colors",
        isOver && "ring-2 ring-accent/50 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5">
        {onShowInDome && (
          <button
            type="button"
            aria-label={`Show ${folder.title} in dome gallery`}
            title="Show in visual gallery"
            onClick={(e) => {
              e.stopPropagation();
              onShowInDome();
            }}
            className="cursor-pointer rounded-md p-1.5 text-foreground/35 transition-colors hover:text-foreground/70"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
        <MiniPinButton pinned={folder.pinned} label={folder.title} onClick={onTogglePin} />
        <MiniTrashButton label={folder.title} onClick={onRecycle} />
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex h-full w-full cursor-pointer flex-col items-center rounded-xl border border-foreground/10 bg-foreground/[0.04] p-4 pt-5 text-center transition-colors hover:border-foreground/20 hover:bg-foreground/[0.07]",
          isOver && "border-accent/40 bg-accent/10"
        )}
      >
        <FolderIcon
          color={folder.color}
          size={0.72}
          imageSrc={folder.imageDataUrl}
          openOnClick={false}
        />
        <p className="mt-2 w-full truncate text-sm font-semibold text-foreground">{folder.title}</p>
        <p className="mt-1 text-xs text-foreground/45">
          {setCount} set{setCount === 1 ? "" : "s"}
        </p>
      </button>
    </div>
  );
}

function SetItem({
  set,
  layout,
  onOpen,
  onTogglePin,
  onRecycle,
}: {
  set: FlashcardSet;
  layout: GridLayoutMode;
  onOpen: () => void;
  onTogglePin: () => void;
  onRecycle: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: setDragId(set.id),
    data: { kind: "set", setId: set.id, folderId: set.folderId },
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
  };

  if (layout === "list") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group grid grid-cols-[minmax(0,1fr)_7rem_6rem] items-center gap-2 border-b border-foreground/6 px-2 py-1.5 last:border-b-0"
      >
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={onOpen}
            className="flex min-w-0 flex-1 cursor-grab items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-foreground/[0.05] active:cursor-grabbing"
          >
            <Layers className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="truncate text-sm font-medium text-foreground">{set.title}</span>
          </button>
          <MiniPinButton pinned={set.pinned} label={set.title} onClick={onTogglePin} />
          <MiniTrashButton label={set.title} onClick={onRecycle} />
        </div>
        <span className="text-xs text-foreground/45">Set</span>
        <span className="truncate text-right text-xs text-foreground/45">
          {set.cards.length} card{set.cards.length === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative h-full">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5">
        <MiniPinButton pinned={set.pinned} label={set.title} onClick={onTogglePin} />
        <MiniTrashButton label={set.title} onClick={onRecycle} />
      </div>
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onOpen}
        className="flex h-full w-full cursor-grab flex-col rounded-xl border border-foreground/10 bg-foreground/[0.04] p-4 text-left transition-colors hover:border-foreground/20 hover:bg-foreground/[0.07] active:cursor-grabbing"
      >
        <p className="truncate pr-14 text-sm font-semibold text-foreground">{set.title}</p>
        <p className="mt-1 text-xs text-foreground/45">
          {set.subject || "General"} · {set.cards.length} card
          {set.cards.length === 1 ? "" : "s"}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
          Study <ArrowRight className="h-3 w-3" />
        </span>
      </button>
    </div>
  );
}
