# Status — 2026-08-11

Where the project stands, and what to pick up next.

## What this is

A study app for the German **Einbürgerungstest** / **"Leben in Deutschland"** test,
for iOS and Android. Offline-first, no account required — but accounts now exist,
optionally, to sync progress across devices (see below).

The real exam: **33 questions in 60 minutes** — 30 general plus 3 about your
Bundesland. Pass at **17/33** for naturalisation, 15/33 for the orientation course.
The full catalogue is 460 questions (300 general + 16 states × 10), but any one
person only ever faces **310** of them.

Deeper working notes live in [`memory/`](memory/) — the reasoning that is not
recoverable from the code.

## Repository layout

```
gesamtfragenkatalog-lebenindeutschland.pdf   official BAMF catalogue, Stand 07.05.2025
memory/                                      working notes: why the pipeline is shaped this way
tools/                                       the data pipeline (Python)
data/                                        generated dataset + review queue
mobile/                                      the Expo app (TypeScript)
supabase/migrations/                         SQL for the optional sync backend
.venv/                                       Python env (gitignored)
```

## Running it

```sh
cd mobile && npm install && npx expo start --port 8081
```

Then open `exp://<your-lan-ip>:8081` on the phone. On iOS **scan the QR with the
Camera app**, not from inside Expo Go — it has no built-in scanner. Get the IP with
`ipconfig getifaddr en0`; both devices must be on the same Wi-Fi.

**Once PR #11 (Settings + accounts) lands**, the app also needs a Supabase project:
copy `mobile/.env.example` to `mobile/.env` with your project's URL + anon key, and
run `supabase/migrations/0001_progress_sync.sql` in the Supabase SQL editor. Without
this, auth/login screens still render but sign-in will fail — the rest of the app is
unaffected, it's purely additive.

Verifying a change without a device:

```sh
cd mobile && npx tsc --noEmit          # types
curl -s -H "expo-platform: ios" http://localhost:8081/   # manifest -> launchAsset.url
```

## Rebuilding the data

```sh
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
.venv/bin/python tools/extract_pdf.py       # PDF      -> data/pdf_questions.json
.venv/bin/python tools/build_dataset.py     # + answers, translations -> data/questions.json
.venv/bin/python tools/extract_images.py    # images   -> mobile/assets/images, data/images.json
.venv/bin/python tools/export_app_data.py   # trim     -> mobile/assets/questions.json
.venv/bin/python tools/validate.py          # invariants; non-zero exit on failure
```

Never hand-edit `data/questions.json` — it is regenerated. Verified answers belong in
`data/overrides.json`, which always wins and survives a rebuild.

**Careful re-running `extract_images.py`**: the image filenames are content hashes of
the *raw bytes pypdf hands back*, and that can differ slightly by installed Pillow
version even though the visual image is identical — producing a large, spurious
diff across `mobile/assets/images/*` and `data/images.json`. If you only need to
change something like alt text, patch the JSON directly rather than re-running the
full extraction, or double-check the image diff is really visual before committing it.

## Data provenance — read before touching the pipeline

The **PDF is authoritative for question and option text only**. It contains no
answers: all 1840 checkboxes are empty. Answers and translations are merged from two
independent MIT-licensed datasets and trusted only where both agree:

- <https://github.com/flexsurfer/einburgerungstest>
- <https://github.com/leben-in-deutschland/leben-in-deutschland-scrapper>

Do **not** take question text from them — both carry pre-2025 wording.

Three traps this pipeline is built around:

1. **Variant questions.** The catalogue holds questions sharing a stem but differing
   in options — "Was ist keine staatliche Gewalt in Deutschland?" exists with both
   `Gesetzgebung/Regierung/Presse/Rechtsprechung` and
   `Legislative/Judikative/Exekutive/Direktive`. Matching on the stem alone silently
   pairs the wrong variant. Matching is on stem **and** option set together.
2. **Option order differs between sources.** The correct answer *and* every
   translated option are mapped through the winning permutation, never copied by
   index. Get this wrong and translations scramble invisibly. (The *app* now also
   reshuffles the on-screen order every time a question is opened, on top of this —
   see below. That shuffle is presentation-only and doesn't touch the data.)
3. **Picture questions cannot be trusted from any dataset.** Their answer is an
   index into images, which only means something relative to the order actually
   rendered. All 36 need a human. **Not started yet** — see Next up.

## Image rights

Five illustrations are credited press photos (© Deutscher Bundestag and others).
`extract_images.py` writes them to `data/images-restricted/`, which is **gitignored
and never bundled**; the app shows BAMF's official PDF/UA alt text instead. This repo
sits under `OSS/`, so shipping them would be redistribution. Maps and flags are fine.

That alt-text path had a bug (PR #14, open): the PDF's alt strings decode through
cp1252, which let a trailing NUL byte survive into all 43 image entries. It only
broke visibly on these 5 restricted questions, since they're the only ones where the
alt text is rendered as on-screen text rather than just an accessibility label.

## Current numbers

| | |
| --- | --- |
| Questions | 460 (300 general + 16 × 10) |
| Answers confirmed by both sources | 400 |
| Single-source | 60 |
| Conflicts | 0 |
| **Shipping as verified** | **382** |
| Needing a human | **78** (36 of them picture questions) — unchanged, see Next up |
| Interface languages | 11 once PR #12 lands (was 8): de, en, tr, ru, uk, ar, fr, hi, + pl, ro, fa |
| Picture questions with images | 36 / 36 |
| Bundled assets | ~4.9 MB (921 KB data + 3.8 MB images) |

## The app

`mobile/` — Expo Router, offline-first, AsyncStorage + optional Supabase sync.

```
app/language.tsx    first screen: languages, each in its own script
app/bundesland.tsx  state picker — decides which 310 questions exist
app/index.tsx       home: readiness card + five tiles
app/read.tsx        All questions — reader, answer always visible
app/attempt.tsx     Practice — answer, then see right/wrong
app/mistakes.tsx    auto-collected wrong answers, cleared by answering right
app/marked.tsx      manually starred questions
app/exam.tsx        33 questions, 60:00, pass at 17
app/settings.tsx    language, appearance, translations, about, reset      [PR #11]
app/help.tsx        small in-app FAQ                                      [PR #11]
app/login.tsx       email/password sign up + sign in                      [PR #11]
app/profile.tsx     signed-in state, sync status, sign out                [PR #11]
src/reader.tsx      the shared pager (read + attempt modes) + jump list   [PR #13]
src/header.tsx       every screen's own header (see "Headers" below)      [PR #11]
src/side-menu.tsx    ☰ slide-in panel: Home / Profile-or-Login / Settings / Help [PR #11]
src/supabase.ts, src/sync.ts   Supabase client + push/pull sync engine    [PR #11]
src/analysis.ts      readiness projection
src/i18n.ts           interface strings, 11 languages once #12 lands
```

Design decisions worth preserving:

- **Language is asked first**, before the state, and every language is named in its
  own script — someone who cannot read German cannot find their language in German.
- **Translation is added beneath the German, never replacing it.** The exam is sat in
  German; swapping the text out trains the wrong reflex.
- **No translation during the exam.** The real test has none, so offering it would
  flatter the score.
- **Readiness counts unseen questions against you** rather than extrapolating from a
  handful of answers. It reads pessimistic early, which is the honest direction.
- **Mistakes is what the app observed; Marked is what the user decided.** Both exist
  on purpose.
- **Answer options are reshuffled every time a question is opened** (PR #13), so the
  right answer can't be learned by its on-screen slot. Purely presentational — all
  recording/checking still happens against the original, unshuffled option index,
  remapped only at render time. Applies in the reader, practice, and the exam.
- **Accounts are additive, never required** (PR #11). Signing in only turns on
  Supabase sync of progress/marked/mistakes; everything still works fully offline
  with no account, same as before.
- **Headers are drawn by the app itself, not the native Stack header** (PR #11,
  `src/header.tsx`). iOS 26's "Liquid Glass" wraps any custom view placed in a native
  header's `headerLeft`/`headerRight` in a system pill background with no current
  opt-out (confirmed via
  [react-native-screens#3226](https://github.com/software-mansion/react-native-screens/issues/3226)).
  A fully custom header sidesteps it. Same PR also replaced `@react-navigation/drawer`
  with a hand-rolled slide-in panel (`src/side-menu.tsx`) — the native Drawer's
  gesture-handler/reanimated dependency chain crashed unpredictably in Expo Go on
  this SDK regardless of reanimated version.

## Next up, in order

1. **Verify the 78 unverified answers** — see `data/review-queue.md`. Started but
   paused: the 42 text-only ones are confirmed correct (cross-checked against
   published sources, e.g. no German Land has an Außenminister — that's federal-only,
   which resolves all 16 "which minister does X not have" questions). **The 36
   picture questions still need a human** to check the answer against the image
   order actually rendered — not started.
2. **Arabic (and now Persian) don't mirror the layout.** Text is correct but the
   layout stays left-to-right, which reads as broken for RTL languages. Needs
   `I18nManager.forceRTL()`, a restart prompt on the language screen, and
   `start`/`end` instead of `left`/`right`.
3. **60 questions have no translation** (below the match threshold). Would need
   translating from the German directly.
4. **Marked has no drill mode** — it is read-only while Mistakes is attempt mode.
5. Untouched GitHub issues, besides #2 Dataset (item 1 above): **#1 Cluster**
   (group similar topics), **#4 Marked** (add a "Marked" label near the top of that
   screen), **#6 deployment**, **#8 Hint section** (toggle explaining the
   question/answer).

## Git

**Five open PRs against `main`, all pending review — nothing has been merged since
PR #10.** They're independent and can merge in any order:

| PR | Closes | What |
| --- | --- | --- |
| [#11](https://github.com/himanshu-commits/living_in_deutschland/pull/11) | #7 | Settings screen, accounts + sync, custom side menu & headers |
| [#12](https://github.com/himanshu-commits/living_in_deutschland/pull/12) | #9 | Polish, Romanian, Persian |
| [#13](https://github.com/himanshu-commits/living_in_deutschland/pull/13) | #5 | Question navigator (jump to any question by number, colored by status) + answer shuffling |
| [#14](https://github.com/himanshu-commits/living_in_deutschland/pull/14) | — | Fix: NUL byte breaking alt text on the 5 restricted-photo questions |
| [#15](https://github.com/himanshu-commits/living_in_deutschland/pull/15) | — | Fix: picture questions rendering zoomed-in/clipped on native |

PR #10 (manual light/dark toggle, closed #3) is already merged into `main`.

A local-only `preview/all-features` branch (never pushed) merges all five together,
for testing the combined result before they land for real — recreate it with:

```sh
git checkout main && git checkout -b preview/all-features
git merge feat/settings-screen feat/add-languages feat/question-jump-list \
  fix/image-alt-text-null-byte fix/illustration-image-clipping
cd mobile && npm install
```

(`feat/settings-screen` ↔ `feat/add-languages` and `feat/question-jump-list` ↔
`fix/image-alt-text-null-byte` / `fix/illustration-image-clipping` each touch
`i18n.ts` / `exam.tsx` / `media.tsx` respectively — expect small, easy conflicts;
the answer is always "keep both sides.")
