"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-[1px] hover:scale-[1.015] active:translate-y-0 active:scale-[0.97] active:duration-100 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_8px_30px_-10px_rgba(59,130,246,0.35)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_14px_40px_-10px_rgba(59,130,246,0.55)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-secondary/90 hover:shadow-[0_10px_28px_-10px_rgba(168,85,247,0.45)]",
        outline:
          "border border-border bg-transparent text-foreground hover:border-border-strong hover:bg-card hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.5)]",
        ghost: "bg-transparent text-foreground hover:bg-card",
        destructive:
          "bg-danger text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-danger/90 hover:shadow-[0_10px_28px_-10px_rgba(239,68,68,0.5)]",
        link: "text-accent underline-offset-4 hover:underline p-0 h-auto hover:translate-y-0 hover:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Set false to disable the click ripple (e.g. for icon-only ghost buttons in dense UI). */
  ripple?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ripple = true, onClick, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const rippleId = React.useRef(0);

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (ripple && !asChild) {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const id = rippleId.current++;
        setRipples((prev) => [
          ...prev,
          { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
        ]);
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 650);
      }
      onClick?.(e);
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={asChild ? onClick : handleClick}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {variant === "default" || variant === undefined ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              />
            ) : null}
            {children}
            {ripples.map((r) => (
              <span
                key={r.id}
                aria-hidden
                className="animate-ripple pointer-events-none absolute rounded-full bg-white/25"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };