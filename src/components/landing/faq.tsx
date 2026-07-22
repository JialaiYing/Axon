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
      "Yes. A free account is required to open the dashboard. Signing in keeps your study data synced across devices so you can pick up where you left off.",
  },
  {
    question: "What happens to my data if I clear my browser?",
    answer:
      "Nothing lasting — your data lives in your account and re-syncs when you sign in again on any device. Clearing site data only removes the local cache in that browser.",
  },
  {
    question: "Can I use Axon on my phone?",
    answer:
      "The dashboard is responsive and works in a mobile browser, though it's designed primarily for focused desktop study sessions.",
  },
];

export function FAQContent() {
  return (
    <Accordion type="single" collapsible className="mx-auto w-full">
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
