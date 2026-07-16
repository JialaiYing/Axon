import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
    <section id="faq" className="px-6 py-20">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Frequently asked
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-5">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
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
