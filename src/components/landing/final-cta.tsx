"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BorderGlow from "@/components/effects/border-glow";
import ScrollFloat from "@/components/effects/scroll-float";
import TextType from "@/components/effects/text-type";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function FinalCTA() {
  return (
    <section className="px-6 py-24 md:py-28">
      <ScrollReveal className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4),0_32px_64px_-24px_rgba(0,0,0,0.6)] md:p-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(59,130,246,0.16),transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
          />
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="relative flex justify-center"
            textClassName="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Start your first streak today
          </ScrollFloat>
          <TextType
            text="No signup, no setup, no AI subscription. Just open the dashboard and add your first objective."
            typingSpeed={40}
            showCursor
            cursorCharacter="_"
            startOnVisible
            className="relative mx-auto mt-3.5 max-w-md text-sm leading-relaxed text-muted md:text-base"
            as="p"
          />
          <div className="relative mt-9 flex justify-center">
            <BorderGlow
              asButton
              edgeSensitivity={28}
              glowColor="210 90 75"
              backgroundColor="#1d3a66"
              borderRadius={10}
              glowRadius={28}
              glowIntensity={1}
              coneSpread={25}
              colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
              fillOpacity={0.45}
            >
              <Button
                size="lg"
                asChild
                className="rounded-[9px] border-0 shadow-none hover:shadow-none"
              >
                <Link href="/dashboard">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </BorderGlow>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
