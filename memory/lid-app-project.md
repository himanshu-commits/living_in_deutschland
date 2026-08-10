# Project, exam format and data provenance

*Goal, exam format and data-provenance rules for the Einbürgerungstest quiz app (living_in_deutschland repo)*

Himanshu is building a cross-platform (iOS + Android) study app for the German
Einbürgerungstest / "Leben in Deutschland" test, aiming for a strong UI. Reference
competitor: the Play Store app `com.meri.dovlatyan.leben.in.de` ("Leben in DE").

Exam format that drives the app: 33 questions in 60 minutes, 30 general + 3 from
the user's Bundesland; pass at 17/33 for naturalisation, 15/33 for the orientation
course. The full pool is 460 (300 general + 16 Länder × 10), but any one user only
ever sees 310 of them.

**Data provenance rule, decided 2026-08-10:** the BAMF PDF
(`gesamtfragenkatalog-lebenindeutschland.pdf`, Stand 07.05.2025) is authoritative
for question and option TEXT only — it contains no answers, all 1840 checkboxes are
empty. Answers and translations come from two independent MIT-licensed GitHub
datasets (`flexsurfer/einburgerungstest` and `leben-in-deutschland-scrapper`),
trusted only where both agree. Never take question text from those datasets: they
carry pre-2025 wording.

**Why this is delicate:** the catalogue contains variant questions sharing a stem
but differing in options (e.g. "Was ist keine staatliche Gewalt in Deutschland?"
exists with both Gesetzgebung/Regierung/Presse/Rechtsprechung and
Legislative/Judikative/Exekutive/Direktive). Matching on question text alone
silently pairs the wrong variant. The sources also order their options differently
from the PDF, so **the correct answer and every translated option must be mapped
through the winning permutation**, never copied by index. Picture questions
("Bild 1"–"Bild 4") can never be trusted from a dataset at all, because the index
only means something relative to the image order actually rendered.

**Rights:** five illustrations are credited press photos (© Deutscher Bundestag and
others). They are extracted to `data/images-restricted/`, gitignored, and never
bundled; the app shows BAMF's official PDF/UA alt text instead. The repo lives
under `OSS/`, so shipping them would be redistribution.

**How to apply:** rebuild via `tools/extract_pdf.py` → `build_dataset.py` →
`extract_images.py` → `export_app_data.py` → `validate.py`. Hand-verified answers go
in `data/overrides.json` (never edit `data/questions.json`, it is regenerated).

See [Development environment](lid-dev-environment.md), [Open items](lid-open-items.md), [Working style](lid-working-style.md).
