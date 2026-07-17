"use client";

import dynamic from "next/dynamic";

const Lightfall = dynamic(() => import("@/components/effects/lightfall"), {
  ssr: false,
});

export function LandingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(100vh,920px)] overflow-hidden"
    >
      <Lightfall
        className="h-full w-full"
        colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
        backgroundColor="#0A29FF"
        speed={0.5}
        streakCount={2}
        streakWidth={1}
        streakLength={1}
        glow={1}
        density={0.6}
        twinkle={1}
        zoom={3}
        backgroundGlow={0.5}
        opacity={1}
        mouseInteraction
        mouseStrength={0.5}
        mouseRadius={1}
        trackWindowPointer
      />
      {/* Soft fade so lower sections settle into the page bg without hiding the hero effect */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent" />
    </div>
  );
}
