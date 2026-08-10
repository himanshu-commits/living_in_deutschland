# Open items

*Outstanding work on the Einbürgerungstest app as of 2026-08-10, in priority order*

State on 2026-08-10: the app runs on device with language-first onboarding, a
five-tile home (All questions, Practice, Mistakes, Marked, Test), a paged reader,
translations in 7 languages, and an exam simulator. Six commits sit on branch
`feat/question-dataset-and-app`, **not yet merged to main**.

Outstanding, in the order recommended:

1. **Arabic does not mirror the layout.** Choosing العربية gives correct text in a
   left-to-right layout, which reads as broken rather than unbuilt. Needs
   `I18nManager.forceRTL()` plus a restart prompt on the language screen, and
   `start`/`end` instead of `left`/`right` throughout.
2. **78 answers are unverified** (`data/review-queue.md`), 36 of them picture
   questions. This is the only remaining *correctness* risk. Himanshu deferred
   verification to focus on the app; a visual review sheet showing all 36 picture
   questions with their four images was offered and not yet built.
3. **60 of 460 questions have no translation** — their match against the
   translation source fell below the 0.80 threshold, so none was attached rather
   than risking a wrong-variant one. They show German with the toggle on.
4. **Marked is read-only while Mistakes is attempt mode.** Passing
   `mode="attempt"` would let people drill flagged questions, though there is an
   argument the two should stay different.

Also unresolved: ~30 cosmetic space artefacts in question text (`keine s taatliche`)
where the PDF's bold styling splits a word. Display only, never affects answers; a
frequency-based auto-repair was tried and **reverted** because it corrupted
"Richter in Deutschland" into "Richterin Deutschland".

See [Project, exam format and data provenance](lid-app-project.md) and [Development environment](lid-dev-environment.md).
