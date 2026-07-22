# Pomodoro audit findings (post-fix)

**Surface:** `/pomodoro` — timer cards, ring, notifications watcher, finish/summary dialogs  
**Date:** 2026-07-22  
**Passes:** notify + personal finish UX → aesthetics (MagicCard / indigo removal)

---

## User goal

Run a focus timer (objective or personal) and know when it ends — visibly enough to act — then log or dismiss the session.

---

## Strengths (after this pass)

- Completion toast + bell always fire, including while focused on `/pomodoro` ([`timer-notifications-watcher.tsx`](../src/components/layout/timer-notifications-watcher.tsx)).
- `markNotified` runs only after the in-app channel is enqueued; OS notif remains background-only.
- Toast dismiss closes the alert only (does not remove the Ready timer); dismiss control is always visible.
- Pure personal timers open [`SessionSummaryDialog`](../src/components/pomodoro/session-summary-dialog.tsx) on settle (and on Stop after Ready); objective timers keep [`FinishSessionDialog`](../src/components/pomodoro/finish-session-dialog.tsx) on Stop.
- Timer cards use flat `Panel` glass (no MagicCard indigo hover). Ring + picker selection use `var(--color-accent)` / danger tokens.

---

## Findings (remaining)

- **[Nice to have]** Toast auto-expire does not clear the bell entry — intentional for history; could offer “clear toast + mark read” later.
- **[Nice to have]** Objective settle still waits for Stop before finish dialog (by design); toast covers the immediate signal.

---

## Explicit non-findings

- Do **not** restore MagicCard indigo glow on timer cards.
- Do **not** skip toast/bell on `/pomodoro`.
- Do **not** treat toast dismiss as `removeTimer`.
