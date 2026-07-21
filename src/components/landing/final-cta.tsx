"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SpecularButton from "@/components/effects/specular-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function FinalCTA() {
  const router = useRouter();

  return (
    <section className="bg-black px-6 py-24 md:py-28">
      <ScrollReveal className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <h2 className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
          Start your first streak today.
        </h2>
        <div className="mt-10">
          <SpecularButton
            size="lg"
            radius={18}
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
            onClick={() => router.push("/dashboard")}
          >
            Open Dashboard
          </SpecularButton>
        </div>
        {/* Keep crawlable link for no-JS / a11y fallback */}
        <Link href="/dashboard" className="sr-only">
          Open Dashboard
        </Link>
      </ScrollReveal>
    </section>
  );
}
