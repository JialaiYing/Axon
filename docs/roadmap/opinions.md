# My honest take

You asked for this to be direct and told me disagreement is fine. So: here's what I actually think, including where I think your own instincts and my own earlier draft are wrong.

## The big one: you're about to do a fourth "one more pass" instead of shipping

Look at the git log. Dozens of commits over what reads like months: theme sweeps, aesthetics passes, "locked in for 5 hours," "soft launch ready," "deployment-ready aesthetically-wise," and then — nothing deployed. No URL exists. The pattern is not "this project is missing one key feature." The pattern is **a solo dev iterating on a fully-built product in a vacuum, indefinitely, without ever putting it in front of a stranger.**

Now the plan for this round adds: a spaced-repetition engine, a full gamification rebuild with a new page and an art-production requirement (skyline + 4-6 theme skins), a Pomodoro rebuild, a Kanban color-system rebuild, and (in my own first draft, before you corrected me) two OAuth calendar integrations. That is not a "fix the beta" pass. That is another multi-week internal build cycle with the exact same failure mode as everything before it: more scope, still zero users, still no evidence any of it matters.

**My actual recommendation:** ship M1 from `development-process.md` (the cheap stuff — Pomodoro phases, goals default, decluttering, copy cuts) and the trust-pass copy fixes, deploy it, and get five real people using it before you touch the City page or spaced repetition. You will learn more from one week of a stranger actually using this than from another month of solo design iteration. I put City/spaced-repetition in M2 in the process doc because you clearly want them built, but if you asked me "should this ship before v1 goes live," my honest answer is no.

## On "is it differentiated enough" — I don't think that question has a documentation answer

You asked a real question: why not just use Google Tasks + Calendar + Quizlet + Notion + a phone clock. I wrote you a positioning statement and a competitive comparison table because that's what a PRD is supposed to have. But I want to be straight with you: **no amount of feature-checklist reasoning actually answers that question.** The real answer, for the first handful of users, is going to be some combination of "someone I trust told me to try it" and "it was less annoying to start using than configuring Notion from scratch" — not "I did a side-by-side comparison and Axon won on features." You cannot out-plan this. You can only find out by putting it in front of people. I'd treat the positioning section I wrote as a sanity check on messaging, not as proof the differentiation problem is solved.

## On the City/gamification rework specifically

I like the constraint you added (own page, not a background) — that was the right call, ambient gamification chrome is genuinely a bad idea for a focus tool. But I want to push back on the underlying premise a little: **swapping the rank ladder's skin for a skyline does not, by itself, make gamification more motivating.** The actual behavioral levers are the ones you already specified correctly — an explicit action-to-reward mapping, a visible loss (dimming on a broken streak), and a fixed external goal instead of a self-set one. Those would work about as well bolted onto the existing rank ladder as they would onto a new skyline. The skyline is a genuinely fresher visual than a numeric rank, and I don't think it's a bad idea — but be honest with yourself that you're choosing it for freshness/differentiation, not because it's mechanically more motivating than what's there. And gamification wears off. A brand-new visual gets attention for a week or two regardless of the underlying mechanic; the mechanic is what determines whether it's still doing anything a month in. Build the smallest version that proves the mechanic works before spending real time on skyline art across five theme skins nobody's asked for yet.

## On calendar sync — I was wrong to call it P1 in my first draft

I initially wrote "elevate calendar sync to a P1 differentiator" because Google/Microsoft have public APIs and it sounded like a reasonable scope bump. On reflection, that's a bad call and I'm correcting myself: OAuth review, token refresh, two different vendor APIs to maintain, and real conflict-resolution UX is a meaningful, ongoing engineering commitment for a product with zero current users. I moved it to "evidence-gated, not scheduled" in the updated PRD. If you disagree and want it sooner, I'd want to hear why before building it — not because it's technically hard, but because it's the kind of feature that's cheap to promise and expensive to maintain forever once it exists.

## On "spaced repetition built into the study system... not necessarily flashcards"

I narrowed this to Flashcards-only in the PRD, and I think that's the right call, not just a simplification. "Spaced repetition for objectives" doesn't actually make sense the way it does for flashcard content — you don't "forget" a completed task the way you forget a fact, so there's no forgetting curve to schedule against. If what you actually meant is "surface what I should work on next without me deciding," that's a different feature (a smart to-do prioritization/suggestion system), not spaced repetition, and it's worth being precise about which one you want before it gets built as the wrong thing.

## On music/streaming integration

Cut this from anything you build soon. Real Spotify/Apple Music playback control requires partner API approval in a lot of cases, and preview-only embeds are a worse experience than just tabbing to Spotify. If the actual goal is "reduce context-switching during focus sessions," bundling a handful of self-hosted ambient/lo-fi tracks gets you 90% of the value with none of the integration risk. Don't build a third-party integration on spec.

## On the Kanban rename

Small thing, but I agree with it and want to flag the tradeoff you're implicitly accepting: a labeled "Kanban board" is a slightly more distinctive, more visually memorable feature than a generic "to-do list," even though the underlying drag-and-drop columns barely change. You're trading a small amount of distinctiveness for copy that a non-technical user immediately understands. I think that trade is correct for this audience, but it is a trade, not a free win.

## Where I think you're right and I have no pushback

- Pomodoro not actually doing work/break cycling is a real, slightly embarrassing gap for an app centered on a Pomodoro timer. Fix this regardless of anything else in this document.
- The dashboard is genuinely cluttered — Up Next duplicating the agenda and a weekly chart on a "quick glance" page were both real mistakes, not stylistic nitpicks.
- The Settings-page AI-text-artifact copy is a real, cheap, obviously-correct fix. There's no version of this where keeping "Appearance, profile, privacy, and study preferences." under a page literally titled Settings is the right call.
- Fixed external goals over self-configured ones is good behavioral instinct for this specific audience, and it's also just less UI to build and maintain.

## Bottom line

If you want my one-sentence, no-hedging recommendation: **do M1 and the trust-copy fixes, deploy it, get real people on it, and let their behavior — not another planning pass — decide whether the City page and spaced repetition are worth building next.** Everything else in `product-requirements.md` is worth having written down so nothing gets lost, but I don't think it's the right order of operations if the actual goal is "move on from beta" soon rather than "keep making the beta more elaborate."
