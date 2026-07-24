"use client";

/**
 * Linear-inspired Kanban toolbar (§1).
 * Backup: kanban-toolbar.pre-linear.bak
 */

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PRIORITY_OPTIONS } from "@/constants/kanban";

interface KanbanToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onAdd: () => void;
}

export function KanbanToolbar({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  onAdd,
}: KanbanToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="h-8 border-border/60 bg-transparent pl-8 text-[13px] shadow-none light:border-border"
          />
        </div>

        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="h-8 w-full border-border/60 bg-transparent text-[13px] shadow-none light:border-border sm:w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button size="sm" onClick={onAdd} className="shadow-none">
        <Plus className="h-3.5 w-3.5" />
        New objective
      </Button>
    </div>
  );
}
