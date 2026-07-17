import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import ScrollFloat from "@/components/effects/scroll-float";

const FAQS = [
  {
    question: "Does Axon use AI to make recommendations?",
    answer:
      "No. Every insight — streaks, productivity index, mastery percentages — comes from statistics and rules applied to your own activity, not a model.",
  },
  {
    question: "Do I need an account to use it?",
    answer:
      "Not right now. Axon stores your data in your browser's localStorage, so you can start immediately. The architecture is built to make adding a real backend later straightforward.",
  },
  {
    question: "What happens to my data if I clear my browser?",
    answer:
      "Since everything currently lives in localStorage, clearing site data will remove it. A database-backed version is on the roadmap for persistence across devices.",
  },
  {
    question: "Can I use Axon on my phone?",
    answer:
      "The dashboard is responsive and works in a mobile browser, though it's designed primarily for focused desktop study sessions.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal className="mb-12 text-center md:mb-14">
          <ScrollFloat
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=50%"
            scrollEnd="bottom bottom-=40%"
            stagger={0.03}
            containerClassName="flex justify-center"
            textClassName="text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
          >
            Frequently Asked Questions
          </ScrollFloat>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.question} value={`item-${i}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
