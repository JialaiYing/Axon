"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SpecularButton from "@/components/effects/specular-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function FinalCTA() {
  const router = useRouter();

  return (
    <section className="border-t border-white/[0.06] bg-black px-6 py-24 md:py-32">
      <ScrollReveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
          Start your first streak today.
        </h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/60 md:text-lg">
          Create a free account and turn one quiet session into a habit.
        </p>
        <div className="mt-10">
          <SpecularButton
            size="lg"
            radius={16}
            tint="#ffffff"
            tintOpacity={0}
            blur={0}
            textColor="#f5f5f5"
            lineColor="#ffffff"
            baseColor="#525252"
            intensity={1}
            shineSize={10}
            shineFade={40}
            thickness={1}
            speed={0.35}
            followMouse
            proximity={250}
            autoAnimate={false}
            onClick={() => router.push("/login?mode=signup")}
          >
            Create account
          </SpecularButton>
        </div>
        {/* Keep crawlable link for no-JS / a11y fallback */}
        <Link href="/login?mode=signup" className="sr-only">
          Create account
        </Link>
      </ScrollReveal>
    </section>
  );
}
