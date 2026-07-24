"use client";

import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";

export type FolderCoverSize = "sm" | "md" | "lg";

interface FolderCoverTileProps {
  title: string;
  imageSrc?: string;
  setCount?: number;
  size?: FolderCoverSize;
  className?: string;
}

const MARK: Record<FolderCoverSize, string> = {
  sm: "h-5 w-5",
  md: "h-9 w-9",
  lg: "h-14 w-14",
};

const FOLDER_ICON: Record<FolderCoverSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

/**
 * Quiet folder mark — outline icon by default, optional cover image.
 * No per-folder color; identity comes from title + optional cover.
 */
export function FolderCoverTile({
  title,
  imageSrc,
  setCount,
  size = "md",
  className,
}: FolderCoverTileProps) {
  const mark = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md",
        MARK[size],
        imageSrc
          ? "bg-wash"
          : "border border-border/50 text-muted-foreground light:border-border"
      )}
      aria-hidden
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- local/data-url covers
        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        <Folder className={FOLDER_ICON[size]} strokeWidth={1.5} />
      )}
    </span>
  );

  if (size === "sm") {
    return (
      <span className={cn("inline-flex items-center", className)}>
        {imageSrc ? (
          mark
        ) : (
          <Folder
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
      </span>
    );
  }

  const centered = size === "lg";

  return (
    <div
      className={cn(
        "flex w-full",
        centered ? "flex-col items-center text-center" : "flex-col items-start text-left",
        className
      )}
    >
      {mark}
      <p
        className={cn(
          "w-full truncate text-foreground",
          centered ? "mt-3 text-base font-semibold" : "mt-2 text-[13px] font-medium"
        )}
      >
        {title || "Untitled"}
      </p>
      {typeof setCount === "number" && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {setCount} set{setCount === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
