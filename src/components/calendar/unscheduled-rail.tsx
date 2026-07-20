"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Inbox } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { priorityBadgeVariant } from "@/lib/kanban-utils";
import { SchedulePopover, type ScheduleInput } from "@/components/calendar/schedule-popover";
import type { Objective } from "@/types";

interface UnscheduledRailProps {
  objectives: Objective[];
  defaultStart: Date;
  onSchedule: (objective: Objective, input: ScheduleInput) => void;
}

/** A lightweight, always-available way to browse and schedule the objectives that
 *  aren't on the Calendar yet — without leaving the page or opening the full picker. */
export function UnscheduledRail({ objectives, defaultStart, onSchedule }: UnscheduledRailProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const unscheduled = React.useMemo(
    () =>
      objectives.filter(
        (o) => !o.scheduledStart && o.status !== "done" && o.status !== "recycled" && o.showOnKanban !== false
      ),
    [objectives]
  );

  return (
    <Panel variant="interactive" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
          Unscheduled
          <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {unscheduled.length}
          </span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", !collapsed && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto p-3">
              {unscheduled.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                  Everything active is on the Calendar.
                </p>
              ) : (
                unscheduled.map((objective) => (
                  <div
                    key={objective.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{objective.title}</p>
                      <Badge variant={priorityBadgeVariant(objective.priority)} className="mt-1 capitalize">
                        {objective.priority}
                      </Badge>
                    </div>
                    <SchedulePopover
                      objective={objective}
                      defaultStart={defaultStart}
                      onSchedule={(input) => onSchedule(objective, input)}
                      align="end"
                      trigger={({ toggle }) => (
                        <button
                          type="button"
                          onClick={toggle}
                          className="shrink-0 rounded-md border border-dashed border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-all duration-150 hover:border-accent/40 hover:text-accent"
                        >
                          Schedule
                        </button>
                      )}
                    />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
