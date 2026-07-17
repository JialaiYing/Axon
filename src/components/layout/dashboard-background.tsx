"use client";

import dynamic from "next/dynamic";

const FloatingLines = dynamic(() => import("@/components/effects/floating-lines"), {
  ssr: false,
});

export function DashboardBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <FloatingLines
        className="h-full w-full"
        enabledWaves={["top", "middle", "bottom"]}
        lineCount={8}
        lineDistance={8}
        bendRadius={8}
        bendStrength={-2}
        interactive={false}
        parallax={false}
        animationSpeed={1}
        linesGradient={["#e945f5", "#6f6f6f", "#6a6a6a"]}
        mixBlendMode="normal"
      />
    </div>
  );
}
