# My honest take

You asked for this to be direct and told me disagreement is fine. So: here's what I actually think, including where I think your own instincts and my own earlier draft are wrong.

## The big one: you're about to do a fourth "one more pass" instead of shipping

Look at the git log. Dozens of commits over what reads like months: theme sweeps, aesthetics passes, "locked in for 5 hours," "soft launch ready," "deployment-ready aesthetically-wise," and then — nothing deployed. No URL exists. The pattern is not "this project is missing one key feature." The pattern is **a solo dev iterating on a fully-built product in a vacuum, indefinitely, without ever putting it in front of a stranger.**

Now the plan for this round still adds: a spaced-repetition engine, unlockable app-wide palettes (replacing ambient backgrounds), a Kanban color-system rebuild, and (in my own first draft, before you corrected me) two OAuth calendar integrations. Dropping the City/skyline cut a real art sink — good — but M2 is still a multi-feature build cycle with the same failure mode risk: more scope, still zero users, still no evidence any of it matters.

**My actual recommendation:** M1 from `development-process.md` is largely done — take the trust-pass copy fixes, deploy, and get five real people using it before you treat palette unlocks or spaced repetition as launch blockers. You will learn more from one week of a stranger actually using this than from another month of solo design iteration. I left palettes + spaced-repetition in M2 because you want them built, but if you asked me "should this ship before v1 goes live," my honest answer is still no.

## On "is it differentiated enough" — I don't think that question has a documentation answer

You asked a real question: why not just use Google Tasks + Calendar + Quizlet + Notion + a phone clock. I wrote you a positioning statement and a competitive comparison table because that's what a PRD is supposed to have. But I want to be straight with you: **no amount of feature-checklist reasoning actually answers that question.** The real answer, for the first handful of users, is going to be some combination of "someone I trust told me to try it" and "it was less annoying to start using than configuring Notion from scratch" — not "I did a side-by-side comparison and Axon won on features." You cannot out-plan this. You can only find out by putting it in front of people. I'd treat the positioning section I wrote as a sanity check on messaging, not as proof the differentiation problem is solved.

## On gamification — City dropped, palettes instead

Dropping the City/skyline was the right call. A growth-metaphor page with custom art was high cost for a weak causal claim: **a fresher visual does not, by itself, make gamification more motivating.** The useful levers were always the boring ones — XP tied to real completions, a fixed external daily goal, brief same-session feedback, streak visibility on Rank — not a new metaphor.

Unlockable **dark-only, quiet IDE-style, app-wide palettes** (manual equip, never auto-apply) are a sane replacement for the ambient Dashboard-background catalog: same "progress unlocks cosmetics" fantasy, far less production risk, and aligned with how students already think about editor themes. Constraints that matter: tokenized swaps only, subject colors stay independent, Dashboard does not become a theme gallery, ship default + ~3 unlocks before a long catalog.

Be honest about what this is: **retention sugar, not differentiation.** "Unlock Nord" will not answer "why not four other apps." Spaced repetition on Flashcards is still the stronger positioning bet in M2; palettes should not crowd it out or multiply into six skins before contrast is proven.

## On calendar sync — I was wrong to call it P1 in my first draft

I initially wrote "elevate calendar sync to a P1 differentiator" because Google/Microsoft have public APIs and it sounded like a reasonable scope bump. On reflection, that's a bad call and I'm correcting myself: OAuth review, token refresh, two different vendor APIs to maintain, and real conflict-resolution UX is a meaningful, ongoing engineering commitment for a product with zero current users. I moved it to "evidence-gated, not scheduled" in the updated PRD. If you disagree and want it sooner, I'd want to hear why before building it — not because it's technically hard, but because it's the kind of feature that's cheap to promise and expensive to maintain forever once it exists.

## On "spaced repetition built into the study system... not necessarily flashcards"

I narrowed this to Flashcards-only in the PRD, and I think that's the right call, not just a simplification. "Spaced repetition for objectives" doesn't actually make sense the way it does for flashcard content — you don't "forget" a completed task the way you forget a fact, so there's no forgetting curve to schedule against. If what you actually meant is "surface what I should work on next without me deciding," that's a different feature (a smart to-do prioritization/suggestion system), not spaced repetition, and it's worth being precise about which one you want before it gets built as the wrong thing.

## On music/streaming integration

Cut this from anything you build soon. Real Spotify/Apple Music playback control requires partner API approval in a lot of cases, and preview-only embeds are a worse experience than just tabbing to Spotify. If the actual goal is "reduce context-switching during focus sessions," bundling a handful of self-hosted ambient/lo-fi tracks gets you 90% of the value with none of the integration risk. Don't build a third-party integration on spec.

## On the Kanban rename

Small thing, but I agree with it and want to flag the tradeoff you're implicitly accepting: a labeled "Kanban board" is a slightly more distinctive, more visually memorable feature than a generic "to-do list," even though the underlying drag-and-drop columns barely change. You're trading a small amount of distinctiveness for copy that a non-technical user immediately understands. I think that trade is correct for this audience, but it is a trade, not a free win.

## Where I think you're right and I have no pushback

- Pomodoro not actually doing work/break cycling was a real, slightly embarrassing gap for an app centered on a Pomodoro timer — fixing it in M1 was correct regardless of everything else.
- The dashboard was genuinely cluttered — Up Next duplicating the agenda and a weekly chart on a "quick glance" page were both real mistakes, not stylistic nitpicks.
- The Settings-page AI-text-artifact copy was a real, cheap, obviously-correct fix.
- Fixed external goals over self-configured ones is good behavioral instinct for this specific audience, and it's also just less UI to build and maintain.
- Dark-only unlockable palettes, quiet like IDE themes, unlock ≠ equip — that's a coherent, buildable cosmetic track. Don't let it sprawl.

## Bottom line

If you want my one-sentence, no-hedging recommendation: **deploy what M1 already shipped, run the trust-copy fixes, get real people on it, and let their behavior — not another planning pass — decide how deep palette unlocks and spaced repetition need to go.** Everything in `product-requirements.md` is worth having written down so nothing gets lost, but I don't think M2 has to be "complete" before a public URL exists if the actual goal is "move on from beta" soon rather than "keep making the beta more elaborate."
