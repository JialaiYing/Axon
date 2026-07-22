"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FolderCoverSize = "sm" | "md" | "lg";

interface FolderCoverTileProps {
  title: string;
  color: string;
  imageSrc?: string;
  setCount?: number;
  size?: FolderCoverSize;
  className?: string;
}

/** Icon fills ~80% of the tile width so covers are easy to see. */
const ICON: Record<FolderCoverSize, string> = {
  sm: "h-5 w-5",
  md: "aspect-square w-[80%]",
  lg: "aspect-square w-[80%] max-w-[11rem]",
};

/** Full folder silhouette used for fill + image clip. */
const FOLDER_PATH =
  "M3.5 7.25c0-.97.78-1.75 1.75-1.75h4.12c.4 0 .78.14 1.09.39l1.14.93c.31.25.69.39 1.09.39h6.06c.97 0 1.75.78 1.75 1.75V17.5c0 .97-.78 1.75-1.75 1.75H5.25c-.97 0-1.75-.78-1.75-1.75V7.25Z";

/**
 * Quizlet-style folder — cover image is clipped to the full folder frame
 * and scaled with object-cover so it fills the icon interior.
 */
export function FolderCoverTile({
  title,
  color,
  imageSrc,
  setCount,
  size = "md",
  className,
}: FolderCoverTileProps) {
  const icon = (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", ICON[size])}
      style={{ color }}
      aria-hidden
    >
      <FolderGlyph imageSrc={imageSrc} className="h-full w-full" />
    </span>
  );

  if (size === "sm") {
    return <span className={cn("inline-flex", className)}>{icon}</span>;
  }

  return (
    <div className={cn("flex w-full flex-col items-center text-center", className)}>
      {icon}
      <p
        className={cn(
          "mt-2 w-full truncate text-foreground",
          size === "lg" ? "text-base font-semibold" : "text-sm font-medium"
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

function FolderGlyph({
  imageSrc,
  className,
}: {
  imageSrc?: string;
  className?: string;
}) {
  const rawId = React.useId();
  const clipId = `folder-shape-${rawId.replace(/:/g, "")}`;

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path d={FOLDER_PATH} />
        </clipPath>
      </defs>

      {imageSrc ? (
        <>
          {/* Image fills the entire folder silhouette */}
          <image
            href={imageSrc}
            x="3.5"
            y="5.5"
            width="17"
            height="13.75"
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
          {/* Light veil so busy photos still read as a folder */}
          <path d={FOLDER_PATH} fill="currentColor" opacity="0.12" />
        </>
      ) : (
        <path d={FOLDER_PATH} fill="currentColor" opacity="0.96" />
      )}

      {/* Crisp outline — keeps the frame readable with or without a cover */}
      <path
        d={FOLDER_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity={imageSrc ? 0.75 : 0.4}
      />

      {/* Tab crease for depth */}
      <path
        d="M3.5 9.35h17"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity={imageSrc ? 0.35 : 0.25}
      />
    </svg>
  );
}
