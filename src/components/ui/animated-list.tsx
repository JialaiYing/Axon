"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

function AnimatedItem({
  children,
  delay = 0,
  index,
  onMouseEnter,
  onClick,
}: {
  children: React.ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: () => void;
  onClick?: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListProps<T> {
  items: T[];
  /** Renders one row. `selected` reflects the hovered / keyboard-focused row. */
  renderItem: (item: T, index: number, selected: boolean) => React.ReactNode;
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  /** Applied to the scrollable list, e.g. to control max height. */
  listClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
  /** Tailwind `from-*` class matching the backdrop the list sits on. */
  gradientFromClassName?: string;
  /** Stagger delay per item (seconds). */
  itemDelay?: number;
  /** Stable React key per item; defaults to the index. */
  getItemKey?: (item: T, index: number) => React.Key;
}

export function AnimatedList<T>({
  items,
  renderItem,
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = false,
  className,
  listClassName,
  displayScrollbar = true,
  initialSelectedIndex = -1,
  gradientFromClassName = "from-card",
  itemDelay = 0.05,
  getItemKey,
}: AnimatedListProps<T>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = React.useState(false);
  const [topGradientOpacity, setTopGradientOpacity] = React.useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = React.useState(1);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  }, []);

  // Hide the bottom gradient when the list doesn't scroll at all.
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setBottomGradientOpacity(el.scrollHeight <= el.clientHeight ? 0 : 1);
  }, [items.length]);

  React.useEffect(() => {
    if (!enableArrowNavigation) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Don't steal keys from form fields.
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        const item = items[selectedIndex];
        if (item !== undefined) {
          e.preventDefault();
          onItemSelect?.(item, selectedIndex);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  // Keep the keyboard-selected row visible inside the scroll container.
  React.useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: "smooth" });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: "smooth",
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={listRef}
        onScroll={handleScroll}
        className={cn(
          "max-h-96 space-y-2.5 overflow-y-auto pr-1",
          displayScrollbar
            ? "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10"
            : "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          listClassName
        )}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={getItemKey ? getItemKey(item, index) : index}
            delay={itemDelay}
            index={index}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => {
              setSelectedIndex(index);
              onItemSelect?.(item, index);
            }}
          >
            {renderItem(item, index, selectedIndex === index)}
          </AnimatedItem>
        ))}
      </div>

      {showGradients && (
        <>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b to-transparent transition-opacity duration-300",
              gradientFromClassName
            )}
            style={{ opacity: topGradientOpacity }}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent transition-opacity duration-300",
              gradientFromClassName
            )}
            style={{ opacity: bottomGradientOpacity }}
          />
        </>
      )}
    </div>
  );
}
