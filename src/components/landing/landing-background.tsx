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
      {/* Keep the fluid simulation viewport-sized. A document-height WebGL
          drawing buffer becomes extremely expensive on long landing pages. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <LiquidEther
          className="h-full w-full"
          style={{ width: "100%", height: "100%", position: "relative" }}
          colors={["#5227FF", "#FF9FFC", "#B497CF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={16}
          iterationsPoisson={16}
          resolution={0.4}
          isBounce={false}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Mask the bottom of Lightfall to transparent so it dissolves into the
          LiquidEther layer underneath instead of fading to a solid color band. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(100vh,920px)] overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.6) 78%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.6) 78%, transparent 100%)",
        }}
      >
        <Lightfall
          className="h-full w-full"
          dpr={1.25}
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
      </div>
    </>
  );
}
