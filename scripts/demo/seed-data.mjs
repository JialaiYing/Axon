// Builds a realistic-looking dataset for the demo screenshots/video only.
// Never used by the real app — this is injected straight into a throwaway
// Playwright browser profile's localStorage before each route is captured,
// so a fresh clone's actual default (empty) state is untouched.

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isoDaysAgo(days, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoDaysFromNow(days, hour = 9, minute = 0) {
  return isoDaysAgo(-days, hour, minute);
}

function isoMinutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function localDateKeyDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function buildSeedData() {
  const objectives = [
    {
      id: "demo-o1",
      title: "Org chem problem set",
      description: "Functional groups + naming practice ahead of Thursday's midterm.",
      subject: "Organic Chemistry",
      priority: "high",
      dueDate: isoDaysFromNow(1, 17, 0),
      estimatedStudyTime: 90,
      progress: 45,
      labels: ["midterm"],
      status: "in-progress",
      createdAt: isoDaysAgo(4),
      updatedAt: isoDaysAgo(0, 8, 10),
      // Relative to capture time (not a fixed clock hour) so this never
      // renders as "missed" no matter when the demo script actually runs.
      scheduledStart: isoMinutesFromNow(40),
      scheduledDurationMinutes: 50,
      showOnKanban: true,
      studySessions: [{ id: uid("ss"), date: isoDaysAgo(1, 16, 0), minutes: 40 }],
    },
    {
      id: "demo-o2",
      title: "Spanish vocab quiz prep",
      subject: "Spanish",
      priority: "urgent",
      dueDate: isoDaysFromNow(1, 9, 0),
      estimatedStudyTime: 30,
      progress: 0,
      labels: ["quiz"],
      status: "todo",
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2),
    },
    {
      id: "demo-o3",
      title: "Read ch. 6 — thermodynamics",
      subject: "Physics",
      priority: "medium",
      dueDate: isoDaysFromNow(3, 23, 59),
      estimatedStudyTime: 60,
      progress: 0,
      labels: [],
      status: "todo",
      createdAt: isoDaysAgo(3),
      updatedAt: isoDaysAgo(3),
      scheduledStart: isoDaysFromNow(3, 14, 0),
      scheduledDurationMinutes: 60,
    },
    {
      id: "demo-o4",
      title: "History essay draft — Cold War",
      subject: "History",
      priority: "low",
      dueDate: isoDaysFromNow(6, 23, 59),
      estimatedStudyTime: 120,
      progress: 10,
      labels: ["essay"],
      status: "todo",
      createdAt: isoDaysAgo(5),
      updatedAt: isoDaysAgo(1),
      scheduledStart: isoDaysFromNow(5, 15, 0),
      scheduledDurationMinutes: 90,
    },
    {
      id: "demo-o5",
      title: "Recursion practice set",
      subject: "Computer Science",
      priority: "medium",
      dueDate: isoDaysFromNow(2, 23, 59),
      estimatedStudyTime: 75,
      progress: 30,
      labels: [],
      status: "in-progress",
      createdAt: isoDaysAgo(3),
      updatedAt: isoDaysAgo(0, 7, 0),
    },
    {
      id: "demo-o6",
      title: "Calc II problem set 4",
      subject: "Calculus II",
      priority: "medium",
      dueDate: isoDaysAgo(1, 23, 59),
      estimatedStudyTime: 60,
      progress: 100,
      labels: [],
      status: "done",
      createdAt: isoDaysAgo(6),
      updatedAt: isoDaysAgo(1, 18, 0),
      completedAt: isoDaysAgo(1, 18, 0),
      scheduledStart: isoDaysAgo(1, 17, 0),
      scheduledDurationMinutes: 60,
    },
    {
      id: "demo-o7",
      title: "Bio lab report — osmosis",
      subject: "Biology",
      priority: "high",
      dueDate: isoDaysAgo(2, 23, 59),
      estimatedStudyTime: 90,
      progress: 100,
      labels: [],
      status: "done",
      createdAt: isoDaysAgo(7),
      updatedAt: isoDaysAgo(2, 15, 0),
      completedAt: isoDaysAgo(2, 15, 0),
      scheduledStart: isoDaysAgo(2, 14, 0),
      scheduledDurationMinutes: 90,
    },
    {
      id: "demo-o8",
      title: "Spanish flashcard review",
      subject: "Spanish",
      priority: "low",
      progress: 100,
      labels: [],
      status: "done",
      createdAt: isoDaysAgo(1),
      updatedAt: isoDaysAgo(0, 8, 0),
      completedAt: isoDaysAgo(0, 8, 0),
      scheduledStart: isoDaysAgo(0, 7, 30),
      scheduledDurationMinutes: 20,
    },
    {
      id: "demo-o9",
      title: "Lab report due — thermo",
      subject: "Physics",
      priority: "medium",
      progress: 0,
      labels: [],
      status: "todo",
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2),
      scheduledStart: isoMinutesFromNow(210),
      scheduledDurationMinutes: 60,
      showOnKanban: false,
    },
  ];

  // ~10 days of work sessions (keeps the streak, weekday/hour charts, and
  // "Focus this week" chart all populated), plus a couple of break sessions
  // and one intentionally partial/stopped-early session.
  const sessions = [];
  const dayPattern = [
    [{ h: 9, m: 30, min: 45 }, { h: 20, m: 0, min: 30 }],
    [{ h: 10, m: 0, min: 50 }],
    [{ h: 9, m: 15, min: 35 }, { h: 19, m: 30, min: 40 }],
    [{ h: 14, m: 0, min: 25 }],
    [{ h: 9, m: 0, min: 55 }, { h: 21, m: 0, min: 20 }],
    [{ h: 11, m: 0, min: 40 }],
    [{ h: 9, m: 45, min: 60 }],
    [{ h: 15, m: 0, min: 30 }],
    [{ h: 9, m: 30, min: 45 }, { h: 20, m: 15, min: 35 }],
    [{ h: 10, m: 30, min: 50 }],
  ];
  dayPattern.forEach((blocks, dayIndex) => {
    blocks.forEach(({ h, m, min }) => {
      sessions.push({
        id: uid("s"),
        date: isoDaysAgo(dayIndex, h, m),
        durationMinutes: min,
        type: "work",
        completed: true,
        objectiveId: dayIndex % 3 === 0 ? "demo-o1" : undefined,
        label: dayIndex % 3 === 0 ? "Org chem problem set" : "Personal focus session",
      });
      sessions.push({
        id: uid("s"),
        date: isoDaysAgo(dayIndex, h, m + min + 1),
        durationMinutes: 5,
        type: "short-break",
        completed: true,
      });
    });
  });
  // One stopped-early session earlier today, still counts toward minutes/streak.
  sessions.push({
    id: uid("s"),
    date: isoDaysAgo(0, 7, 40),
    durationMinutes: 18,
    type: "work",
    completed: false,
    label: "Personal focus session",
  });

  const folders = [
    {
      id: "demo-f1",
      title: "Organic Chemistry",
      color: "#3b82f6",
      createdAt: isoDaysAgo(20),
      lastOpenedAt: isoDaysAgo(0, 8, 5),
      showInDome: true,
      pinned: true,
    },
    {
      id: "demo-f2",
      title: "Spanish",
      color: "#a855f7",
      createdAt: isoDaysAgo(18),
      lastOpenedAt: isoDaysAgo(1, 17, 0),
      showInDome: true,
      pinned: false,
    },
  ];

  function makeCards(n, masteredCount) {
    return Array.from({ length: n }, (_, i) => {
      const mastered = i < masteredCount;
      const correct = mastered ? 5 + i : 1;
      const incorrect = mastered ? 1 : 3;
      return {
        id: uid("c"),
        front: `Term ${i + 1}`,
        back: `Definition ${i + 1}`,
        correctCount: correct,
        incorrectCount: incorrect,
        masteryPercent: Math.round((correct / (correct + incorrect)) * 100),
      };
    });
  }

  const sets = [
    {
      id: "demo-set1",
      title: "Functional Groups",
      description: "Naming + reactivity of common functional groups.",
      subject: "Organic Chemistry",
      folderId: "demo-f1",
      createdAt: isoDaysAgo(19),
      updatedAt: isoDaysAgo(0, 8, 5),
      lastOpenedAt: isoDaysAgo(0, 8, 5),
      pinned: true,
      cards: makeCards(10, 7),
    },
    {
      id: "demo-set2",
      title: "Reaction Mechanisms",
      subject: "Organic Chemistry",
      folderId: "demo-f1",
      createdAt: isoDaysAgo(15),
      updatedAt: isoDaysAgo(6),
      lastOpenedAt: isoDaysAgo(6),
      cards: makeCards(8, 3),
    },
    {
      id: "demo-set3",
      title: "Common Verbs — Present Tense",
      subject: "Spanish",
      folderId: "demo-f2",
      createdAt: isoDaysAgo(17),
      updatedAt: isoDaysAgo(1, 17, 0),
      lastOpenedAt: isoDaysAgo(1, 17, 0),
      pinned: true,
      cards: makeCards(12, 9),
    },
    {
      id: "demo-set4",
      title: "Cell Biology Basics",
      subject: "Biology",
      createdAt: isoDaysAgo(10),
      updatedAt: isoDaysAgo(4),
      lastOpenedAt: isoDaysAgo(4),
      cards: makeCards(6, 4),
    },
  ];

  const timers = [
    {
      id: "demo-t1",
      source: "objective",
      label: "Org chem problem set",
      objectiveId: "demo-o1",
      durationSeconds: 50 * 60,
      endAt: Date.now() + 32 * 60 * 1000,
      pausedRemainingSeconds: null,
      status: "running",
      createdAt: isoDaysAgo(0, 9, 30),
    },
  ];

  const goals = [
    {
      id: "goal-daily-focus",
      title: "Focus time",
      type: "daily",
      target: 90,
      unit: "min",
      progress: 0,
      completed: false,
      createdAt: isoDaysAgo(20),
    },
    {
      id: "goal-weekly-objectives",
      title: "Finish objectives",
      type: "weekly",
      target: 5,
      unit: "objectives",
      progress: 0,
      completed: false,
      createdAt: isoDaysAgo(20),
    },
  ];

  const progress = {
    xp: 2907,
    longestStreak: 9,
    intervalsCompleted: sessions.filter((s) => s.type === "work" && s.completed).length,
    awardedObjectiveIds: ["demo-o6", "demo-o7", "demo-o8"],
    lastBonusDate: localDateKeyDaysAgo(1),
  };

  return {
    "axon:kanban:objectives": objectives,
    "axon:pomodoro:sessions": sessions,
    "axon:pomodoro:timers": timers,
    "axon:flashcards:folders": folders,
    "axon:flashcards:sets": sets,
    "axon:goals": goals,
    "axon:progress:v1": progress,
  };
}
