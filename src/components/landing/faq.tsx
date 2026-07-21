import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const FAQS = [
  {
    question: "Does Axon use AI to make recommendations?",
    answer:
      "No. Every insight — streaks, productivity index, mastery percentages — comes from statistics and rules applied to your own activity, not a model.",
  },
  {
    question: "Do I need an account to use it?",
    answer:
      "No. Axon stores your data in your browser's localStorage, so you can start immediately with zero signup. Creating a free account is optional and only unlocks syncing that data across devices.",
  },
  {
    question: "What happens to my data if I clear my browser?",
    answer:
      "If you're signed in, nothing — your data lives in the cloud and re-syncs on any device you log into. If you're using Axon fully offline (no account), clearing site data does remove it, since it only exists in that browser's localStorage.",
  },
  {
    question: "Can I use Axon on my phone?",
    answer:
      "The dashboard is responsive and works in a mobile browser, though it's designed primarily for focused desktop study sessions.",
  },
];

export function FAQContent() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((faq, i) => (
        <AccordionItem key={faq.question} value={`item-${i}`} className="border-white/10">
          <AccordionTrigger className="text-white hover:text-white/80">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-white/55">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
