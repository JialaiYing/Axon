import {
  LayoutDashboard,
  Kanban,
  Layers,
  Timer,
  BarChart3,
  Target,
  Settings,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NavItem } from "@/types";

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Primary href when the group itself is clicked (first child). */
  href: string;
  children: NavItem[];
}

/** Top-level destinations — Goals nests under Progress with Analytics. */
export const NAV_PRIMARY: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kanban", href: "/kanban", icon: Kanban },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Flashcards", href: "/flashcards", icon: Layers },
  { label: "Pomodoro", href: "/pomodoro", icon: Timer },
];

export const NAV_PROGRESS: NavGroup = {
  id: "progress",
  label: "Progress",
  icon: TrendingUp,
  href: "/analytics",
  children: [
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Goals", href: "/goals", icon: Target },
  ],
};

/** Flat list for mobile / command palette compatibility. */
export const NAV_ITEMS: NavItem[] = [
  ...NAV_PRIMARY,
  ...NAV_PROGRESS.children,
  { label: "Settings", href: "/settings", icon: Settings },
];
