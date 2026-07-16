import {
  LayoutDashboard,
  Kanban,
  Layers,
  Timer,
  BarChart3,
  Target,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kanban", href: "/kanban", icon: Kanban },
  { label: "Flashcards", href: "/flashcards", icon: Layers },
  { label: "Pomodoro", href: "/pomodoro", icon: Timer },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];
