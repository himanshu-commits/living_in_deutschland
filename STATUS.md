# Status — 2026-08-10

Where the project stands, and what to pick up next.

## What this is

A study app for the German **Einbürgerungstest** / **"Leben in Deutschland"** test,
for iOS and Android. Offline, no account, no backend.

The real exam: **33 questions in 60 minutes** — 30 general plus 3 about your
Bundesland. Pass at **17/33** for naturalisation, 15/33 for the orientation course.
The full catalogue is 460 questions (300 general + 16 states × 10), but any one
person only ever faces **310** of them.

## Repository layout

```
gesamtfragenkatalog-lebenindeutschland.pdf   official BAMF catalogue, Stand 07.05.2025
tools/                                       the data pipeline (Python)
data/                                        generated dataset + review queue
mobile/                                      the Expo app (TypeScript)
.tools/                                      project-local Node 22 (gitignored)
.venv/                                       Python env (gitignored)
```

## Running it

The system Node is 18, too old for Expo SDK 54, so Node 22 lives in `.tools/`:

```sh
export PATH="$PWD/.tools/node/bin:$PATH"
cd mobile && npm install && npx expo start --port 8081
```

Then open `exp://<your-lan-ip>:8081` on the phone. On iOS **scan the QR with the
Camera app**, not from inside Expo Go — it has no built-in scanner. Get the IP with
`ipconfig getifaddr en0`; both devices must be on the same Wi-Fi.

Verifying a change without a device:

```sh
cd mobile && npx tsc --noEmit          # types
curl -s -H "expo-platform: ios" http://localhost:8081/   # manifest -> launchAsset.url
```

## Rebuilding the data

```sh
.venv/bin/python tools/extract_pdf.py       # PDF      -> data/pdf_questions.json
.venv/bin/python tools/build_dataset.py     # + answers, translations -> data/questions.json
.venv/bin/python tools/extract_images.py    # images   -> mobile/assets/images, data/images.json
.venv/bin/python tools/export_app_data.py   # trim     -> mobile/assets/questions.json
.venv/bin/python tools/validate.py          # invariants; non-zero exit on failure
```

Never hand-edit `data/questions.json` — it is regenerated. Verified answers belong in
`data/overrides.json`, which always wins and survives a rebuild.

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
   index. Get this wrong and translations scramble invisibly.
3. **Picture questions cannot be trusted from any dataset.** Their answer is an
   index into images, which only means something relative to the order actually
   rendered. All 36 need a human.

## Image rights

Five illustrations are credited press photos (© Deutscher Bundestag and others).
`extract_images.py` writes them to `data/images-restricted/`, which is **gitignored
and never bundled**; the app shows BAMF's official PDF/UA alt text instead. This repo
sits under `OSS/`, so shipping them would be redistribution. Maps and flags are fine.

## Current numbers

| | |
| --- | --- |
| Questions | 460 (300 general + 16 × 10) |
| Answers confirmed by both sources | 400 |
| Single-source | 60 |
| Conflicts | 0 |
| **Shipping as verified** | **382** |
| Needing a human | **78** (36 of them picture questions) |
| Questions with translations | 400, in 7 languages |
| Picture questions with images | 36 / 36 |
| Bundled assets | ~4.9 MB (921 KB data + 3.8 MB images) |

## The app

`mobile/` — Expo Router, offline, AsyncStorage only.

```
app/language.tsx    first screen: 8 languages, each in its own script
app/bundesland.tsx  state picker — decides which 310 questions exist
app/index.tsx       home: readiness card + five tiles
app/read.tsx        All questions — reader, answer always visible
app/attempt.tsx     Practice — answer, then see right/wrong
app/mistakes.tsx    auto-collected wrong answers, cleared by answering right
app/marked.tsx      manually starred questions
app/exam.tsx        33 questions, 60:00, pass at 17
src/reader.tsx      the shared pager (read + attempt modes)
src/analysis.ts     readiness projection
src/i18n.ts         interface strings, 8 languages
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

## Next up, in order

1. **Arabic does not mirror the layout.** Text is correct but the layout stays
   left-to-right, which reads as broken. Needs `I18nManager.forceRTL()`, a restart
   prompt on the language screen, and `start`/`end` instead of `left`/`right`.
2. **Verify the 78 unverified answers** — see `data/review-queue.md`. The only
   remaining correctness risk. The 36 picture questions must be checked against the
   images actually rendered.
3. **60 questions have no translation** (below the match threshold). Would need
   translating from the German directly.
4. **Marked has no drill mode** — it is read-only while Mistakes is attempt mode.

## Git

Six commits on `feat/question-dataset-and-app`, **not yet merged**:

```sh
git checkout main && git merge feat/question-dataset-and-app
```
