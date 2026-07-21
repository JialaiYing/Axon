import Image from "next/image";
import { cn } from "@/lib/utils";

export const AXON_ICON_SRC = "/axon_icon_only.png";

interface AxonLogoProps {
  className?: string;
  /** Icon size classes (defaults to h-7 w-7). */
  iconClassName?: string;
  /** Show the “Axon” wordmark beside the icon. */
  withWordmark?: boolean;
  /** Wordmark text color / size overrides. */
  wordmarkClassName?: string;
  priority?: boolean;
}

/**
 * Official Axon mark (`axon_icon_only.png`) with an optional text wordmark.
 */
export function AxonLogo({
  className,
  iconClassName,
  withWordmark = false,
  wordmarkClassName,
  priority = false,
}: AxonLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={AXON_ICON_SRC}
        alt={withWordmark ? "" : "Axon"}
        width={80}
        height={80}
        priority={priority}
        className={cn("h-7 w-7 shrink-0 select-none object-contain", iconClassName)}
      />
      {withWordmark && (
        <span
          className={cn(
            "whitespace-nowrap text-sm font-semibold tracking-tight text-foreground",
            wordmarkClassName
          )}
        >
          Axon
        </span>
      )}
    </span>
  );
}
