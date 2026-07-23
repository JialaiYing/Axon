import { cn } from "@/lib/utils";

/** Shared icon-button chrome for header actions (notif, fullscreen, theme). */
export function headerIconButtonClass(active = false) {
  return cn(
    "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150",
    "hover:bg-foreground/[0.04] hover:text-foreground light:hover:bg-black/[0.04]",
    "active:scale-95",
    active && "bg-foreground/[0.08] text-foreground light:bg-black/[0.06]"
  );
}
