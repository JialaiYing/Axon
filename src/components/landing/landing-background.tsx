"use client";

import dynamic from "next/dynamic";

const Lightfall = dynamic(() => import("@/components/effects/lightfall"), {
  ssr: false,
});

const LiquidEther = dynamic(() => import("@/components/effects/liquid-ether"), {
  ssr: false,
});

export function LandingBackground() {
  return (
    <>
      {/* Full-page fluid layer beneath Lightfall */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <LiquidEther
          className="h-full w-full"
          style={{ width: "100%", height: "100%", position: "relative" }}
          colors={["#5227FF", "#FF9FFC", "#B497CF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(100vh,920px)] overflow-hidden"
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
        {/* Fade Lightfall out so LiquidEther reads underneath on lower sections */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
    </>
  );
}
