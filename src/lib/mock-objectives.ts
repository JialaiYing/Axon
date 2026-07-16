import type { Objective } from "@/types";

const now = new Date();
const iso = (daysOffset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};

export const MOCK_OBJECTIVES: Objective[] = [
  {
    id: "seed-1",
    title: "Read Chapter 7 — Cellular Respiration",
    description: "Focus on the electron transport chain diagrams for the quiz.",
    subject: "Biology",
    priority: "high",
    dueDate: iso(2),
    estimatedStudyTime: 45,
    progress: 0,
    labels: ["reading", "quiz-prep"],
    status: "todo",
    createdAt: iso(-1),
    updatedAt: iso(-1),
    color: "#22c55e",
  },
  {
    id: "seed-2",
    title: "Practice integration by parts",
    description: "Work through the odd-numbered problems in section 5.3.",
    subject: "Math",
    priority: "medium",
    dueDate: iso(4),
    estimatedStudyTime: 60,
    progress: 40,
    labels: ["practice-set"],
    status: "in-progress",
    createdAt: iso(-3),
    updatedAt: iso(0),
    color: "#3b82f6",
  },
  {
    id: "seed-3",
    title: "Outline essay on the Cold War",
    description: "Thesis, three supporting arguments, and counterpoint.",
    subject: "History",
    priority: "urgent",
    dueDate: iso(1),
    estimatedStudyTime: 90,
    progress: 70,
    labels: ["essay"],
    status: "in-progress",
    createdAt: iso(-5),
    updatedAt: iso(0),
    color: "#f59e0b",
  },
  {
    id: "seed-4",
    title: "Review recursion & Big-O flashcards",
    description: "Already reviewed twice — just needs a final pass before the exam.",
    subject: "Computer Science",
    priority: "low",
    estimatedStudyTime: 20,
    progress: 100,
    labels: ["review"],
    status: "done",
    createdAt: iso(-7),
    updatedAt: iso(-1),
    color: "#a855f7",
  },
];
