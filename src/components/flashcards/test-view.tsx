"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ListChecks,
  Play,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Flashcard, FlashcardSet } from "@/types";
import { cn } from "@/lib/utils";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

type QuestionType = "written" | "multipleChoice" | "trueFalse";

interface TypeOption {
  value: QuestionType;
  label: string;
  description: string;
  /** Minimum cards in the set required for this type to produce a fair question. */
  minCards: number;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "written",
    label: "Written answer",
    description: "Type the answer from memory.",
    minCards: 1,
  },
  {
    value: "multipleChoice",
    label: "Multiple choice",
    description: "Pick the right answer from a few options.",
    minCards: 2,
  },
  {
    value: "trueFalse",
    label: "True / False",
    description: "Decide if the shown answer matches the term.",
    minCards: 2,
  },
];

interface WrittenQuestion {
  id: string;
  type: "written";
  card: Flashcard;
}
interface MultipleChoiceQuestion {
  id: string;
  type: "multipleChoice";
  card: Flashcard;
  options: string[];
}
interface TrueFalseQuestion {
  id: string;
  type: "trueFalse";
  card: Flashcard;
  shownAnswer: string;
  isTrue: boolean;
}
type Question = WrittenQuestion | MultipleChoiceQuestion | TrueFalseQuestion;

interface AnswerRecord {
  question: Question;
  correct: boolean;
  userAnswerText: string;
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildQuestions(cards: Flashcard[], enabledTypes: QuestionType[], count: number): Question[] {
  const chosen = shuffle(cards).slice(0, count);
  const typesToUse = enabledTypes.length > 0 ? enabledTypes : ["written"];

  return chosen.map((card, i) => {
    const type = typesToUse[Math.floor(Math.random() * typesToUse.length)]!;

    if (type === "multipleChoice") {
      const pool = Array.from(new Set(cards.filter((c) => c.id !== card.id).map((c) => c.back)));
      const distractors = shuffle(pool).slice(0, 3);
      const options = shuffle([card.back, ...distractors]);
      return { id: `${card.id}-${i}`, type, card, options };
    }

    if (type === "trueFalse") {
      const others = cards.filter((c) => c.id !== card.id);
      const showCorrect = others.length === 0 || Math.random() < 0.5;
      const shownAnswer = showCorrect
        ? card.back
        : others[Math.floor(Math.random() * others.length)]!.back;
      return { id: `${card.id}-${i}`, type, card, shownAnswer, isTrue: shownAnswer === card.back };
    }

    return { id: `${card.id}-${i}`, type: "written", card };
  });
}

interface TestViewProps {
  set: FlashcardSet;
  onBack: () => void;
  onRecordResult: (cardId: string, correct: boolean) => void;
  onComplete: (result: { correct: number; total: number }) => void;
}

type Phase = "setup" | "running" | "results";

export function TestView({ set, onBack, onRecordResult, onComplete }: TestViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const cards = set.cards;

  const [phase, setPhase] = React.useState<Phase>("setup");
  const [enabledTypes, setEnabledTypes] = React.useState<Set<QuestionType>>(
    new Set(["written", "multipleChoice", "trueFalse"])
  );
  const [questionCount, setQuestionCount] = React.useState(Math.min(cards.length, 10) || 1);

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<AnswerRecord[]>([]);
  const [revealed, setRevealed] = React.useState(false);
  const [pendingCorrect, setPendingCorrect] = React.useState(false);
  const [pendingAnswerText, setPendingAnswerText] = React.useState("");
  const [writtenValue, setWrittenValue] = React.useState("");
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null);
  const [selectedBool, setSelectedBool] = React.useState<boolean | null>(null);

  const toggleType = (type: QuestionType) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const startTest = () => {
    const types = TYPE_OPTIONS.filter((t) => enabledTypes.has(t.value) && cards.length >= t.minCards).map(
      (t) => t.value
    );
    setQuestions(buildQuestions(cards, types, Math.min(questionCount, cards.length)));
    setCurrent(0);
    setAnswers([]);
    setRevealed(false);
    setWrittenValue("");
    setSelectedChoice(null);
    setSelectedBool(null);
    setPhase("running");
  };

  const question = questions[current];
  const isLast = current === questions.length - 1;

  const reveal = (correct: boolean, userAnswerText: string) => {
    if (revealed) return;
    setRevealed(true);
    setPendingCorrect(correct);
    setPendingAnswerText(userAnswerText);
  };

  const handleWrittenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || question.type !== "written") return;
    const correct = normalize(writtenValue) === normalize(question.card.back);
    reveal(correct, writtenValue.trim() || "(blank)");
  };

  const handleChoiceSelect = (option: string) => {
    if (!question || question.type !== "multipleChoice" || revealed) return;
    setSelectedChoice(option);
    reveal(option === question.card.back, option);
  };

  const handleTrueFalse = (choice: boolean) => {
    if (!question || question.type !== "trueFalse" || revealed) return;
    setSelectedBool(choice);
    reveal(choice === question.isTrue, choice ? "True" : "False");
  };

  const handleNext = () => {
    if (!question) return;
    onRecordResult(question.card.id, pendingCorrect);
    const nextAnswers = [
      ...answers,
      { question, correct: pendingCorrect, userAnswerText: pendingAnswerText },
    ];
    setAnswers(nextAnswers);

    if (isLast) {
      const correctCount = nextAnswers.filter((a) => a.correct).length;
      onComplete({ correct: correctCount, total: nextAnswers.length });
      setPhase("results");
      return;
    }

    setCurrent((i) => i + 1);
    setRevealed(false);
    setWrittenValue("");
    setSelectedChoice(null);
    setSelectedBool(null);
  };

  const retake = () => {
    setPhase("setup");
  };

  const score = React.useMemo(() => {
    const correct = answers.filter((a) => a.correct).length;
    const total = answers.length;
    return { correct, total, percent: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }, [answers]);

  if (cards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Add cards to this set before testing.</p>
        <Button size="sm" variant="outline" onClick={onBack} className="cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to study
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" className="shrink-0 cursor-pointer" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" /> Study
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{set.title} · Test</h2>
            {phase === "running" && (
              <p className="truncate text-xs text-muted-foreground">
                Question {current + 1} of {questions.length}
              </p>
            )}
          </div>
        </div>
        {phase === "running" && (
          <div className="hidden w-40 shrink-0 sm:block">
            <ProgressBar value={((current + (revealed ? 1 : 0)) / questions.length) * 100} size="sm" />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex min-h-[clamp(360px,calc(100dvh-19rem),640px)] flex-1 flex-col items-center justify-center gap-6 px-2 text-center"
          >
            <div className="flex items-center gap-2 text-accent">
              <ListChecks className="h-5 w-5" />
              <h3 className="text-lg font-semibold text-foreground">Test yourself</h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              A mixed-format test — written, multiple choice, and true/false — the same way Quizlet
              tests a set. Answers feed back into each card&apos;s mastery.
            </p>

            <div className="w-full max-w-sm space-y-2.5 text-left">
              {TYPE_OPTIONS.map((opt) => {
                const disabled = cards.length < opt.minCards;
                const checked = enabledTypes.has(opt.value) && !disabled;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 px-3.5 py-2.5 transition-colors",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {disabled ? "Needs at least 2 cards in this set." : opt.description}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleType(opt.value)}
                      className="h-4 w-4 shrink-0 accent-accent"
                    />
                  </label>
                );
              })}
            </div>

            <div className="w-full max-w-sm">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Number of questions</span>
                <span className="font-mono font-medium tabular-nums text-foreground">{questionCount}</span>
              </div>
              <input
                type="range"
                min={1}
                max={cards.length}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full cursor-pointer accent-accent"
              />
            </div>

            <Button
              size="lg"
              className="cursor-pointer"
              disabled={
                Array.from(enabledTypes).filter((t) =>
                  TYPE_OPTIONS.some((o) => o.value === t && cards.length >= o.minCards)
                ).length === 0
              }
              onClick={startTest}
            >
              <Play className="h-4 w-4" /> Start test
            </Button>
          </motion.div>
        )}

        {phase === "running" && question && (
          <motion.div
            key={question.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex min-h-[clamp(360px,calc(100dvh-19rem),640px)] flex-1 flex-col items-center justify-center gap-6 px-2 text-center"
          >
            <Badge variant="secondary">
              {question.type === "written"
                ? "Written answer"
                : question.type === "multipleChoice"
                  ? "Multiple choice"
                  : "True / False"}
            </Badge>
            <p className="max-w-2xl text-balance text-center text-2xl font-semibold leading-snug text-foreground md:text-3xl">
              {question.card.front}
            </p>

            {question.type === "written" && (
              <form onSubmit={handleWrittenSubmit} className="w-full max-w-md">
                <Input
                  autoFocus
                  value={writtenValue}
                  disabled={revealed}
                  onChange={(e) => setWrittenValue(e.target.value)}
                  placeholder="Type the answer"
                  className="text-center"
                />
                {!revealed && (
                  <Button type="submit" className="mt-3 w-full cursor-pointer">
                    Check answer
                  </Button>
                )}
                {revealed && (
                  <div
                    className={cn(
                      "mt-3 rounded-lg border p-3 text-sm",
                      pendingCorrect
                        ? "border-success/30 bg-success-muted text-success"
                        : "border-danger/30 bg-danger-muted text-danger"
                    )}
                  >
                    <p className="flex items-center justify-center gap-1.5 font-medium">
                      {pendingCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {pendingCorrect ? "Correct" : "Not quite"}
                    </p>
                    {!pendingCorrect && (
                      <p className="mt-1 text-foreground/80">
                        Correct answer: <span className="font-medium">{question.card.back}</span>
                      </p>
                    )}
                  </div>
                )}
              </form>
            )}

            {question.type === "multipleChoice" && (
              <div className="grid w-full max-w-md grid-cols-1 gap-2.5 sm:grid-cols-2">
                {question.options.map((option) => {
                  const isCorrectOption = option === question.card.back;
                  const isSelected = selectedChoice === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={revealed}
                      onClick={() => handleChoiceSelect(option)}
                      className={cn(
                        "cursor-pointer rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-default",
                        !revealed && "border-border bg-surface/40 hover:border-border-strong",
                        revealed &&
                          isCorrectOption &&
                          "border-success/40 bg-success-muted text-success",
                        revealed &&
                          !isCorrectOption &&
                          isSelected &&
                          "border-danger/40 bg-danger-muted text-danger",
                        revealed && !isCorrectOption && !isSelected && "border-border opacity-50"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {question.type === "trueFalse" && (
              <>
                <div className="glass-panel w-full max-w-md rounded-xl p-4 text-center text-sm font-medium text-foreground">
                  {question.shownAnswer}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    disabled={revealed}
                    onClick={() => handleTrueFalse(true)}
                    className={cn(
                      "cursor-pointer",
                      revealed &&
                        question.isTrue &&
                        "border-success/40 bg-success-muted text-success",
                      revealed &&
                        !question.isTrue &&
                        selectedBool === true &&
                        "border-danger/40 bg-danger-muted text-danger"
                    )}
                  >
                    True
                  </Button>
                  <Button
                    variant="outline"
                    disabled={revealed}
                    onClick={() => handleTrueFalse(false)}
                    className={cn(
                      "cursor-pointer",
                      revealed &&
                        !question.isTrue &&
                        "border-success/40 bg-success-muted text-success",
                      revealed &&
                        question.isTrue &&
                        selectedBool === false &&
                        "border-danger/40 bg-danger-muted text-danger"
                    )}
                  >
                    False
                  </Button>
                </div>
                {revealed && !pendingCorrect && (
                  <p className="text-sm text-foreground/80">
                    Correct answer: <span className="font-medium">{question.card.back}</span>
                  </p>
                )}
              </>
            )}

            {revealed && (
              <Button onClick={handleNext} className="cursor-pointer">
                {isLast ? "See results" : "Next question"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div
            key="results"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex min-h-[clamp(360px,calc(100dvh-19rem),640px)] flex-1 flex-col items-center gap-6 overflow-y-auto px-2 py-2 text-center"
          >
            <Trophy className="h-8 w-8 text-accent" />
            <div>
              <h3 className="text-2xl font-semibold text-foreground">
                {score.correct} / {score.total} correct
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{score.percent}% on this run</p>
            </div>

            {answers.some((a) => !a.correct) && (
              <div className="w-full max-w-lg text-left">
                <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Review missed answers
                </h4>
                <ul className="space-y-2">
                  {answers
                    .filter((a) => !a.correct)
                    .map((a, i) => (
                      <li
                        key={`${a.question.id}-${i}`}
                        className="rounded-lg border border-danger/20 bg-danger-muted/40 p-3 text-sm"
                      >
                        <p className="font-medium text-foreground">{a.question.card.front}</p>
                        <p className="mt-1 text-foreground/70">
                          You answered: <span className="text-danger">{a.userAnswerText}</span>
                        </p>
                        <p className="text-success">Correct: {a.question.card.back}</p>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={retake} className="cursor-pointer">
                <RotateCcw className="h-3.5 w-3.5" /> Retake test
              </Button>
              <Button variant="outline" onClick={onBack} className="cursor-pointer">
                Back to study
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
