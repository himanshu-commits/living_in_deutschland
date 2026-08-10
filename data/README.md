# Dataset

`questions.json` — all 460 questions of the Einbürgerungstest / "Leben in Deutschland"
test, with answers.

## Provenance

Question and option **text** comes from the official BAMF *Gesamtfragenkatalog*,
Stand 07.05.2025 (`gesamtfragenkatalog-lebenindeutschland.pdf`). That PDF contains
no answers — all 1840 checkboxes are empty.

The **answers** are merged from two independent MIT-licensed open datasets, and an
answer is only marked `verified` when both agree:

| Source | Repo |
| --- | --- |
| flexsurfer | <https://github.com/flexsurfer/einburgerungstest> |
| leben-in-deutschland | <https://github.com/leben-in-deutschland/leben-in-deutschland-scrapper> |

Do not take question text from those datasets — both carry pre-2025 wording (e.g.
the old gender ordering "den Regierungschef / die Regierungschefin", where the
current catalogue has "die Regierungschefin/den Regierungschef").

## Schema

```jsonc
{
  "id": "ALL-032",          // "ALL-###" for general, "<Bundesland>-##" for state questions
  "scope": "ALL",           // "ALL" or the Bundesland name
  "num": 32,                // Aufgabe number within its scope
  "page": 15,               // page in the source PDF, for cross-checking
  "pageImages": 1,          // images on that page (1 = the BAMF logo only)
  "question": "Was ist keine staatliche Gewalt in Deutschland?",
  "options": ["Gesetzgebung", "Regierung", "Presse", "Rechtsprechung"],
  "answer": 2,              // index into options, or null if unresolved
  "imageQuestion": false,   // answer is a picture, not text
  "confidence": "confirmed",// confirmed | single-source | conflict | unmatched
  "verified": true,         // safe to ship
  "sources": ["flexsurfer", "lid"],
  "scores": { "flexsurfer": 0.98, "lid": 0.97 }  // match quality, for auditing
}
```

`verified: false` means **do not ship this answer yet**. See `review-queue.md`.

## Caveats

- **36 picture questions** have options `1`–`4` / `Bild 1`–`Bild 4`. Their answer
  index only means something relative to the image order *you* render, so every one
  must be checked by hand even where both sources agree.
- The catalogue contains **variant questions sharing a stem but differing in
  options** — "Was ist keine staatliche Gewalt in Deutschland?" exists with both
  `Gesetzgebung/Regierung/Presse/Rechtsprechung` and
  `Legislative/Judikative/Exekutive/Direktive`. Matching on question text alone
  pairs the wrong variant; `build_dataset.py` matches on stem + option set together.
- A user only ever sees 310 of these 460: the 300 general questions plus the 10 for
  their Bundesland.

## Rebuilding

```sh
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
.venv/bin/python tools/extract_pdf.py     # PDF  -> data/pdf_questions.json
.venv/bin/python tools/build_dataset.py   # + answer keys -> data/questions.json
.venv/bin/python tools/validate.py        # invariants; non-zero exit on failure
```

`build_dataset.py` caches the upstream datasets in `data/.cache/`; delete it to refetch.

## Recording verified answers

Never edit `questions.json` by hand — it is regenerated. Put confirmed answers in
`data/overrides.json`, which always wins over the scraped sources and survives a
rebuild:

```json
{
  "ALL-021": 2,
  "Bayern-01": 1
}
```

The value is the index into `options` (0-3). Those questions come out as
`"confidence": "hand-verified", "verified": true`. If an override contradicts two
agreeing sources the build prints a NOTE — worth a second look, since that is either
a genuine upstream error or a typo in the override.
