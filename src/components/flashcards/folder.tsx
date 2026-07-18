"use client";

import * as React from "react";
import "./folder.css";

function darkenColor(hex: string, percent: number) {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export interface FolderIconProps {
  color?: string;
  size?: number;
  /** Optional user image rendered on the folder front. */
  imageSrc?: string;
  /** Label rendered under the folder. */
  title?: string;
  /** Paper contents shown when the folder opens (max 3). */
  items?: React.ReactNode[];
  /** When false the folder never toggles open on click — hover animation only. */
  openOnClick?: boolean;
  onClick?: () => void;
  className?: string;
}

const MAX_ITEMS = 3;

export function FolderIcon({
  color = "#5227FF",
  size = 1,
  imageSrc,
  title,
  items = [],
  openOnClick = true,
  onClick,
  className = "",
}: FolderIconProps) {
  const papers: (React.ReactNode | null)[] = items.slice(0, MAX_ITEMS);
  while (papers.length < MAX_ITEMS) papers.push(null);

  const [open, setOpen] = React.useState(false);
  const [paperOffsets, setPaperOffsets] = React.useState(
    Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 }))
  );

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor("#ffffff", 0.1);
  const paper2 = darkenColor("#ffffff", 0.05);
  const paper3 = "#ffffff";

  const handleClick = () => {
    if (openOnClick) {
      setOpen((prev) => !prev);
      if (open) {
        setPaperOffsets(Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 })));
      }
    }
    onClick?.();
  };

  const handlePaperMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (_e: React.MouseEvent<HTMLDivElement>, index: number) => {
    setPaperOffsets((prev) => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  const folderStyle = {
    "--folder-color": color,
    "--folder-back-color": folderBackColor,
    "--paper-1": paper1,
    "--paper-2": paper2,
    "--paper-3": paper3,
  } as React.CSSProperties;

  return (
    <div className={`folder-wrap ${className}`.trim()} style={{ transform: `scale(${size})` }}>
      <div
        className={`folder ${open ? "open" : ""}`.trim()}
        style={folderStyle}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-label={title ? `Open folder ${title}` : open ? "Close folder" : "Open folder"}
      >
        <div className="folder__back">
          {papers.map((paperItem, i) => (
            <div
              key={i}
              className={`paper paper-${i + 1}`}
              onMouseMove={(e) => handlePaperMouseMove(e, i)}
              onMouseLeave={(e) => handlePaperMouseLeave(e, i)}
              style={
                open
                  ? ({
                      "--magnet-x": `${paperOffsets[i]?.x || 0}px`,
                      "--magnet-y": `${paperOffsets[i]?.y || 0}px`,
                    } as React.CSSProperties)
                  : {}
              }
            >
              {paperItem}
            </div>
          ))}
          <div className="folder__front" />
          {/* Image lives on the topmost front pane so it stays visible when closed */}
          <div className="folder__front right">
            {imageSrc && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="folder__front-image" src={imageSrc} alt="" draggable={false} />
                <div className="folder__front-tint" />
              </>
            )}
          </div>
        </div>
      </div>
      {title && <span className="folder-label">{title}</span>}
    </div>
  );
}

export default FolderIcon;
