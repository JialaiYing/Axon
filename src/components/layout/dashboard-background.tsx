"use client";

import dynamic from "next/dynamic";
import { useDashboardBackground } from "@/hooks/use-dashboard-background";
import { cn } from "@/lib/utils";

const FloatingLines = dynamic(() => import("@/components/effects/floating-lines"), {
  ssr: false,
});
const LiquidEther = dynamic(() => import("@/components/effects/liquid-ether"), {
  ssr: false,
});
const Lightfall = dynamic(() => import("@/components/effects/lightfall"), {
  ssr: false,
});

export function DashboardBackground() {
  const { backgroundId, palette, theme } = useDashboardBackground();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {(backgroundId === "mesh" || backgroundId === "aurora") && (
        <div
          className="absolute inset-0 transition-colors duration-500"
          style={{
            background:
              theme === "light"
                ? `radial-gradient(ellipse at 20% 20%, ${palette.gradient[0]} 0%, transparent 50%),
                   radial-gradient(ellipse at 80% 30%, ${palette.gradient[1]} 0%, transparent 45%),
                   radial-gradient(ellipse at 50% 80%, ${palette.gradient[2]} 0%, transparent 50%),
                   #f4f6fa`
                : `radial-gradient(ellipse at 20% 20%, ${palette.gradient[0]}55 0%, transparent 50%),
                   radial-gradient(ellipse at 80% 30%, ${palette.gradient[1]}44 0%, transparent 45%),
                   radial-gradient(ellipse at 50% 80%, ${palette.gradient[2]}33 0%, transparent 50%),
                   #08090c`,
          }}
        />
      )}

      {(backgroundId === "lines" || backgroundId === "aurora") && (
        <FloatingLines
          className={cn("h-full w-full", backgroundId === "aurora" && "opacity-40")}
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={8}
          lineDistance={8}
          bendRadius={8}
          bendStrength={-2}
          interactive={false}
          parallax={false}
          animationSpeed={1}
          maxFps={30}
          linesGradient={palette.gradient}
          mixBlendMode="normal"
        />
      )}

      {backgroundId === "ether" && (
        <LiquidEther
          className="h-full w-full"
          style={{ width: "100%", height: "100%", position: "relative" }}
          colors={palette.gradient}
          mouseForce={12}
          cursorSize={80}
          isViscous
          viscous={30}
          iterationsViscous={12}
          iterationsPoisson={12}
          resolution={0.35}
          autoDemo
          autoSpeed={0.4}
          autoIntensity={1.6}
        />
      )}

      {backgroundId === "lightfall" && (
        <Lightfall className="h-full w-full" />
      )}
    </div>
  );
}
