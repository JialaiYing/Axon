import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const FAQS = [
  {
    id: "account",
    question: "Do I need an account to use it?",
    answer:
      "Yes. A free account is required to open the dashboard — there is no guest or offline-only mode. Signing in keeps your study data synced across devices so you can pick up where you left off.",
  },
  {
    id: "free",
    question: "Is it free?",
    answer:
      "Yes. There’s no paid tier and no credit card at signup — just a free account. Sync across devices is included.",
  },
  {
    id: "ai",
    question: "Does Axon use AI to make recommendations?",
    answer:
      "No. Streaks, XP, mastery, and Leitner review schedules come from rules applied to your own activity — not a model writing plans or coaching you.",
  },
  {
    id: "clear-data",
    question: "What happens to my data if I clear my browser?",
    answer:
      "Nothing lasting. Your data lives in your account and re-syncs when you sign in again on any device. Clearing site data only removes the local cache in that browser.",
  },
  {
    id: "mobile",
    question: "Can I use Axon on my phone?",
    answer:
      "The dashboard is responsive and works in a mobile browser, though it’s designed primarily for focused desktop study sessions. There isn’t a separate native app.",
  },
];

export function FAQContent({ items = FAQS }: { items?: typeof FAQS }) {
  return (
    <Accordion type="single" collapsible className="mx-auto w-full">
      {items.map((faq, i) => (
        <AccordionItem key={faq.id} value={`item-${i}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
