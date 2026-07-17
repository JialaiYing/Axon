"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";
import React, {
  Children,
  cloneElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import "./dock.css";

export type DockItemData = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  label?: string;
};

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn("dock-item", className)}
      tabIndex={0}
      role="button"
      aria-label={label}
    >
      {Children.map(children, (child) =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, {
              isHovered,
            })
          : child
      )}
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = "", isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("dock-label", className)}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: ReactNode;
  isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = "" }: DockIconProps) {
  return <div className={cn("dock-icon", className)}>{children}</div>;
}

export { DockItem, DockLabel, DockIcon };

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="dock-outer">
      <motion.div
        onMouseMove={({ pageX }) => {
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          mouseX.set(Infinity);
        }}
        className={cn("dock-panel", className)}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            label={item.label}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </div>
  );
}
