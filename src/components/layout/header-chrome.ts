import { cn } from "@/lib/utils";

/** Shared icon-button chrome for header actions (notif, fullscreen, theme). */
export function headerIconButtonClass(active = false) {
  return cn(
    "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150",
    "hover:bg-wash hover:text-foreground",
    "active:scale-95",
    active && "bg-wash-strong text-foreground"
  );
}
