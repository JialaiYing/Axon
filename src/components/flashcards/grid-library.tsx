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
  EyeOff,
  LayoutGrid,
  Layers,
  List,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";
import { FolderCoverTile } from "@/components/flashcards/folder-cover-tile";
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
  { id: "icons", label: "Icons", description: "Cover tiles", icon: LayoutGrid },
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
  onEditFolder?: (folder: FlashcardFolder) => void;
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

/** Pinned items float to the top (iMessage-style), then title. */
function pinFirst<T extends { pinned?: boolean; title: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    if (pin !== 0) return pin;
    return a.title.localeCompare(b.title);
  });
}

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
  onEditFolder,
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

  const sortedFolderSets = React.useMemo(() => pinFirst(folderSets), [folderSets]);

  /** Root library: pinned folders + pinned sets first, then the rest (iMessage-style). */
  const rootItems = React.useMemo(() => {
    type Item =
      | { kind: "folder"; folder: FlashcardFolder }
      | { kind: "set"; set: FlashcardSet };
    const pinned: Item[] = [];
    const rest: Item[] = [];
    for (const f of folders) {
      (f.pinned ? pinned : rest).push({ kind: "folder", folder: f });
    }
    for (const s of unfiledSets) {
      (s.pinned ? pinned : rest).push({ kind: "set", set: s });
    }
    const byTitle = (a: Item, b: Item) => {
      const aTitle = a.kind === "folder" ? a.folder.title : a.set.title;
      const bTitle = b.kind === "folder" ? b.folder.title : b.set.title;
      const aKind = a.kind === "folder" ? 0 : 1;
      const bKind = b.kind === "folder" ? 0 : 1;
      if (aKind !== bKind) return aKind - bKind;
      return aTitle.localeCompare(bTitle);
    };
    return [...pinned.sort(byTitle), ...rest.sort(byTitle)];
  }, [folders, unfiledSets]);

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
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-1.5 light:border-border">
        <div className="flex min-w-0 items-center gap-2">
          {folder ? (
            <>
              <RootDropZone onBack={onBack} active={Boolean(activeSetId)} />
              <FolderCoverTile
                title={folder.title}
                imageSrc={folder.imageDataUrl}
                size="sm"
              />
              <p className="truncate text-[13px] font-medium text-foreground">{folder.title}</p>
            </>
          ) : (
            <p className="text-[12px] font-medium text-muted-foreground">All items</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border/60 px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground light:border-border light:hover:bg-black/[0.04]"
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
              className="cursor-pointer rounded-md px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-danger light:hover:bg-black/[0.04]"
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
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center">
              <Layers className="h-7 w-7 text-muted-foreground" />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  {folder ? "No sets in this folder" : "No folders or sets yet"}
                </p>
                <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                  {folder
                    ? "Use Create below to add a set, or drag one here from another folder."
                    : "Use Create below to add a folder or an unfiled set."}
                </p>
              </div>
            </div>
          ) : layout === "icons" ? (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {folder
                ? sortedFolderSets.map((set) => (
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
                : rootItems.map((item) =>
                    item.kind === "folder" ? (
                      <li key={item.folder.id}>
                        <FolderItem
                          folder={item.folder}
                          setCount={setsInFolder(item.folder.id).length}
                          layout="icons"
                          onOpen={() => onOpenFolder(item.folder)}
                          onEdit={onEditFolder ? () => onEditFolder(item.folder) : undefined}
                          onTogglePin={() => onToggleFolderPin(item.folder.id)}
                          onRecycle={() => onRecycleFolder(item.folder)}
                          onToggleInDome={
                            onShowInDome ? () => onShowInDome(item.folder.id) : undefined
                          }
                        />
                      </li>
                    ) : (
                      <li key={item.set.id}>
                        <SetItem
                          set={item.set}
                          layout="icons"
                          onOpen={() => onOpenSet(item.set)}
                          onTogglePin={() => onToggleSetPin(item.set.id)}
                          onRecycle={() => onRecycleSet(item.set)}
                        />
                      </li>
                    )
                  )}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-md border border-border/50 light:border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_7rem_6rem] gap-2 border-b border-border/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground light:border-border">
                <span>Name</span>
                <span>Type</span>
                <span className="text-right">Details</span>
              </div>
              <ul>
                {folder
                  ? sortedFolderSets.map((set) => (
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
                  : rootItems.map((item) =>
                      item.kind === "folder" ? (
                        <li key={item.folder.id}>
                          <FolderItem
                            folder={item.folder}
                            setCount={setsInFolder(item.folder.id).length}
                            layout="list"
                            onOpen={() => onOpenFolder(item.folder)}
                            onEdit={onEditFolder ? () => onEditFolder(item.folder) : undefined}
                            onTogglePin={() => onToggleFolderPin(item.folder.id)}
                            onRecycle={() => onRecycleFolder(item.folder)}
                            onToggleInDome={
                              onShowInDome ? () => onShowInDome(item.folder.id) : undefined
                            }
                          />
                        </li>
                      ) : (
                        <li key={item.set.id}>
                          <SetItem
                            set={item.set}
                            layout="list"
                            onOpen={() => onOpenSet(item.set)}
                            onTogglePin={() => onToggleSetPin(item.set.id)}
                            onRecycle={() => onRecycleSet(item.set)}
                          />
                        </li>
                      )
                    )}
              </ul>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeSet ? (
            <div className="w-52 rounded-md border border-border bg-card px-3 py-2 shadow-[var(--shadow-elevation-1)]">
              <p className="truncate text-[13px] font-medium text-foreground">{activeSet.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
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
          ? "bg-foreground/[0.08] text-foreground light:bg-black/[0.06]"
          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground light:hover:bg-black/[0.04]"
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
          ? "text-muted-foreground hover:text-foreground"
          : "text-muted-foreground hover:text-foreground",
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
        "cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:text-danger",
        className
      )}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function MiniEditButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      title="Edit folder"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

const itemActionsClass =
  "flex shrink-0 items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100";

const itemActionsOverlayClass =
  "absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-md border border-border/50 bg-card p-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 light:border-border";

function FolderItem({
  folder,
  setCount,
  layout,
  onOpen,
  onEdit,
  onTogglePin,
  onRecycle,
  onToggleInDome,
}: {
  folder: FlashcardFolder;
  setCount: number;
  layout: GridLayoutMode;
  onOpen: () => void;
  onEdit?: () => void;
  onTogglePin: () => void;
  onRecycle: () => void;
  onToggleInDome?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: folderDropId(folder.id),
    data: { kind: "folder", folderId: folder.id },
  });
  const inDome = folder.showInDome !== false;

  if (layout === "list") {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "group grid grid-cols-[minmax(0,1fr)_7rem_6rem] items-center gap-2 border-b border-border/50 px-2 py-1.5 last:border-b-0 light:border-border",
          isOver && "bg-foreground/[0.04] light:bg-black/[0.04]"
        )}
      >
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpen}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-foreground/[0.03] light:hover:bg-black/[0.03]"
          >
            <FolderCoverTile
              title={folder.title}
              imageSrc={folder.imageDataUrl}
              size="sm"
            />
            <span className="truncate text-sm font-medium text-foreground">{folder.title}</span>
          </button>
          <div className={itemActionsClass}>
            {onEdit && <MiniEditButton label={folder.title} onClick={onEdit} />}
            {onToggleInDome && (
              <button
                type="button"
                aria-label={
                  inDome
                    ? `Hide ${folder.title} from dome gallery`
                    : `Show ${folder.title} in dome gallery`
                }
                title={inDome ? "Hide from visual gallery" : "Show in visual gallery"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleInDome();
                }}
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                {inDome ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
            <MiniPinButton pinned={folder.pinned} label={folder.title} onClick={onTogglePin} />
            <MiniTrashButton label={folder.title} onClick={onRecycle} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Folder</span>
        <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
          {setCount} set{setCount === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative rounded-md transition-colors",
        isOver && "ring-1 ring-inset ring-border"
      )}
    >
      <div className={itemActionsOverlayClass}>
        {onEdit && <MiniEditButton label={folder.title} onClick={onEdit} />}
        {onToggleInDome && (
          <button
            type="button"
            aria-label={
              inDome
                ? `Hide ${folder.title} from dome gallery`
                : `Show ${folder.title} in dome gallery`
            }
            title={inDome ? "Hide from visual gallery" : "Show in visual gallery"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleInDome();
            }}
            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {inDome ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        )}
        <MiniPinButton pinned={folder.pinned} label={folder.title} onClick={onTogglePin} />
        <MiniTrashButton label={folder.title} onClick={onRecycle} />
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex h-full w-full cursor-pointer flex-col rounded-md border border-border/50 bg-card p-3 text-left transition-colors hover:bg-foreground/[0.03] light:border-border light:hover:bg-black/[0.03]",
          isOver && "border-border bg-foreground/[0.04] light:bg-black/[0.04]"
        )}
      >
        <FolderCoverTile
          title={folder.title}
          imageSrc={folder.imageDataUrl}
          setCount={setCount}
          size="md"
        />
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
        className="group grid grid-cols-[minmax(0,1fr)_7rem_6rem] items-center gap-2 border-b border-border/50 px-2 py-1.5 last:border-b-0 light:border-border"
      >
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={onOpen}
            className="flex min-w-0 flex-1 cursor-grab items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-foreground/[0.03] active:cursor-grabbing light:hover:bg-black/[0.03]"
          >
            <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">{set.title}</span>
          </button>
          <div className={itemActionsClass}>
            <MiniPinButton pinned={set.pinned} label={set.title} onClick={onTogglePin} />
            <MiniTrashButton label={set.title} onClick={onRecycle} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Set</span>
        <span className="truncate text-right text-xs text-muted-foreground">
          {set.cards.length} card{set.cards.length === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative h-full">
      <div className={itemActionsOverlayClass}>
        <MiniPinButton pinned={set.pinned} label={set.title} onClick={onTogglePin} />
        <MiniTrashButton label={set.title} onClick={onRecycle} />
      </div>
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onOpen}
        className="flex h-full w-full cursor-grab flex-col rounded-md border border-border/50 bg-card p-3 text-left transition-colors hover:bg-foreground/[0.03] active:cursor-grabbing light:border-border light:hover:bg-black/[0.03]"
      >
        <p className="truncate pr-10 text-[13px] font-medium text-foreground">{set.title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {set.subject || "General"} · {set.cards.length} card
          {set.cards.length === 1 ? "" : "s"}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </button>
    </div>
  );
}
