---
name: product-design-thinking
description: Analyze user goals, map user flows, review information architecture, and identify UX friction using product-design heuristics and psychology. Use when evaluating or redesigning any Axon feature, page, or flow for usability, clarity, or user experience quality.
metadata:
  scope: project
---

# Product Design Thinking (Axon)

Think like a senior product designer, not a UI painter: every visual decision should trace back to a user goal. Use this before touching pixels.

## Axon's core user flows

Axon's user is a student running a personal productivity loop. Map any change against where it sits in this loop:

1. **Capture** — add an objective (Kanban) or a flashcard set
2. **Schedule** — place it on the calendar / kanban due date
3. **Focus** — run a Pomodoro session against it
4. **Review** — check Dashboard/Analytics/Goals to see progress and get motivated to loop back to step 1

A change that doesn't make one of these four steps faster, clearer, or more motivating is decoration, not design. Say so explicitly if a proposed change only "looks nicer" without touching the loop.

## Step 1: Analyze user goals

For the page/component under review, answer before proposing anything:
- What is the user trying to accomplish in the next 10 seconds? (glance-and-go dashboard vs. deep-focus kanban vs. distraction-free pomodoro have different goals)
- What decision or action should this screen make easiest?
- What's the cost of the user leaving this screen confused, or not noticing the one thing that matters?

## Step 2: Map the user flow

For any multi-step interaction (creating an objective, starting a focus session, reviewing a goal), sketch the flow as a short numbered list of screens/states, not prose. Flag:
- Steps that could be merged or removed (fewer steps = less friction)
- Dead ends (a state with no obvious next action)
- Places the user has to remember something from a previous screen instead of seeing it restated

## Step 3: Review information architecture

- Is the most important information above the fold / at the top of the visual scan order?
- Does grouping match the user's mental model (e.g. "today" vs "this week" vs "all-time" on the dashboard), not just what data happens to be available?
- Is there a single clear primary action per screen, or are 3+ CTAs competing (check button/link density before adding another one)?

## Step 4: Identify UX friction — heuristic checklist

Run every reviewed surface through these, citing the specific element that violates each one (don't just recite the law):

- **Hick's Law** — too many equally-weighted choices slow decisions. If a component offers 5+ visually equal options, group or prioritize.
- **Fitts's Law** — frequent/important actions get large, close, easy-to-hit targets ("Start focus" should never be smaller or harder to reach than "New objective" if focus is the core loop). Check `Button` `size` usage in `src/components/ui/button.tsx` call sites.
- **Cognitive load** — is the user doing math or memorization the UI could do for them? (e.g. `GoalRow`/`PersonalGoalRow` in `dashboard-overview.tsx` already show `progress/target` instead of making the user compute it — replicate that pattern, don't regress it.)
- **Progressive disclosure** — dense screens (Kanban card dialogs, Analytics) should default to essentials and reveal detail on demand, not show everything at once.
- **Recognition over recall** — labels/icons should be self-explanatory in context; don't rely on the user remembering an icon's meaning from another page.
- **Consistency** — a pattern established once (e.g. the dashed-border empty state used across `dashboard-overview.tsx` and `today-agenda-panel.tsx`) must be reused, not reinvented, for new empty states.
- **Feedback visibility** — every user action (complete objective, start timer, drag a card) needs an immediate, visible response; check this is animated or stated, not silent.

## Step 5: Design decisions based on psychology

- **Motivation loop** — Axon is gamified (XP, streak, rank). Surface progress/near-misses ("1 more session for your streak") rather than raw numbers alone when it drives the user back into the loop.
- **Loss aversion** — streak/goal "at risk" states (see `goalPaceStatus` → `"behind"`) deserve a distinct, slightly urgent visual treatment, not the same neutral styling as "on track".
- **Peak-end rule** — completion moments (finishing a Pomodoro, completing an objective) are the highest-leverage place for a satisfying animation, see `motion-design` and `nextjs-react-patterns` for how to implement without regressing performance.

## Output format

When asked to analyze a page/flow, produce:
1. User goal (1-2 sentences)
2. Flow map (numbered steps, flag friction points inline)
3. IA issues (bullets)
4. Heuristic violations (bullets, each naming the specific element/file)
5. Prioritized recommendations (ordered by user-impact, not effort)

Do not write code in this step — this is analysis. Hand off to `dashboard-ux` for SaaS-layout specifics, `premium-frontend` for visual execution, and `nextjs-react-patterns`/`ui-styling` for implementation.
