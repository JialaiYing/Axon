"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Kanban,
  Layers,
  LayoutDashboard,
  ListPlus,
  Search,
  Target,
  Timer,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  href?: string;
  keywords?: string[];
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, href: "/dashboard", keywords: ["home"] },
  { id: "kanban", label: "Go to Kanban", icon: Kanban, href: "/kanban", keywords: ["board", "tasks", "objectives"] },
  { id: "pomodoro", label: "Go to Pomodoro", icon: Timer, href: "/pomodoro", keywords: ["focus", "timer"] },
  { id: "flashcards", label: "Go to Flashcards", icon: Layers, href: "/flashcards", keywords: ["cards", "study"] },
  { id: "calendar", label: "Go to Calendar", icon: CalendarDays, href: "/calendar", keywords: ["schedule"] },
  { id: "analytics", label: "Go to Analytics", icon: BarChart3, href: "/analytics", keywords: ["stats", "charts"] },
  { id: "goals", label: "Go to Goals", icon: Target, href: "/goals" },
  { id: "settings", label: "Go to Settings", icon: Settings, href: "/settings" },
  {
    id: "add-task",
    label: "Add objective",
    hint: "Open Kanban to create",
    icon: ListPlus,
    href: "/kanban?new=1",
    keywords: ["create", "new", "task"],
  },
  {
    id: "start-focus",
    label: "Start focus session",
    hint: "Open Pomodoro",
    icon: Timer,
    href: "/pomodoro",
    keywords: ["pomodoro", "timer"],
  },
];

function isModK(e: KeyboardEvent) {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
}

function platformShortcutLabel() {
  if (typeof navigator === "undefined") return "⌘K";
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((cmd) => {
      const haystack = [cmd.label, cmd.hint, ...(cmd.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function run(cmd: CommandItem) {
    onOpenChange(false);
    if (cmd.href) router.push(cmd.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) run(cmd);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page or action…"
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted sm:inline">
            Esc
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</li>
          ) : (
            filtered.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <li key={cmd.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => run(cmd)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      index === activeIndex
                        ? "bg-accent-muted text-foreground"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate font-medium">{cmd.label}</span>
                    {cmd.hint && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">{cmd.hint}</span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Wires ⌘K / Ctrl+K and renders the header search trigger. */
export function CommandPaletteTrigger() {
  const [open, setOpen] = React.useState(false);
  const [shortcut, setShortcut] = React.useState("⌘K");

  React.useEffect(() => {
    setShortcut(platformShortcutLabel());
    function onKeyDown(e: KeyboardEvent) {
      if (!isModK(e)) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden items-center gap-2 rounded-lg border border-border/50 bg-surface/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:border-border-strong hover:bg-surface/55 md:flex md:w-72"
      >
        <Search className="h-3.5 w-3.5 transition-colors duration-200 group-hover:text-foreground" />
        <span className="text-xs">Search Axon...</span>
        <kbd className="ml-auto rounded-md border border-border/50 bg-card/40 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {shortcut}
        </kbd>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
