"""Extract the 460 questions from the official BAMF Gesamtfragenkatalog PDF.

Source of truth for question + option TEXT (Stand 07.05.2025).
Answers are not in the PDF; see build_dataset.py.

    python tools/extract_pdf.py
    -> data/pdf_questions.json
"""

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "gesamtfragenkatalog-lebenindeutschland.pdf"
OUT = ROOT / "data" / "pdf_questions.json"

WINGDINGS_BOX = ""  # the option marker used on most pages
PAGE = "\x00PAGE\x00"


def read_pdf():
    """Returns (page_texts, images_per_page).

    Every page carries the BAMF logo, so a page holding a picture question has
    2 images (one illustration, e.g. a map with four numbered regions) or 5
    (logo + four separate option pictures)."""
    reader = PdfReader(str(PDF))
    texts, images = [], []
    for page in reader.pages:
        texts.append(page.extract_text() or "")
        images.append(len(page.images))
    return texts, images


def clean(pages):
    """Join pages into one string with page sentinels, normalising PDF artefacts."""
    text = PAGE.join(pages)
    text = text.replace(WINGDINGS_BOX, "□")  # unify both option markers
    text = re.sub(r"Seite \d+ von 191", "", text)
    # "Aufgabe" gets split across a line break on some pages
    text = re.sub(r"Auf\s*\n\s*gabe", "Aufgabe", text)
    text = re.sub(r"A\s*\n\s*ufgabe", "Aufgabe", text)
    return text


def page_of(text, pos):
    return text.count(PAGE, 0, pos) + 1


# Bold styling (usually on the negation) makes the extractor split a neighbouring
# word, leaving a stray fragment: "keine s taatliche", "nicht z u den", "nicht wä
# hrend". These are repaired in build_dataset.py, where a clean reference text is
# available and the fix can be restricted to whitespace so it cannot alter content.


def split_merged(blob):
    """Some pages emit the four checkboxes before the four option texts, so the
    parser sees three empty options and one blob. Split the blob back into four
    on sentence boundaries."""
    parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÄÖÜa-zäöü])", blob.strip())
    return [p.strip() for p in parts] if len(parts) == 4 else None


def parse(block, scope, full, images):
    out = []
    chunks = re.split(r"\bAufgabe\s+(\d+)\b", block)
    offset = full.index(block)
    for i in range(1, len(chunks), 2):
        num = int(chunks[i])
        body = chunks[i + 1].split("Teil II")[0]
        pos = offset + block.index(chunks[i + 1])
        page = page_of(full, pos)
        cells = [c.strip() for c in body.split("□")]
        if len(cells) < 5:
            continue
        question = " ".join(cells[0].replace(PAGE, " ").split())
        # a couple of questions carry their own number into the body text
        question = re.sub(rf"^{num}\.\s*", "", question)
        options = [" ".join(c.replace(PAGE, " ").split()) for c in cells[1:5]]

        if sum(1 for o in options if not o) == 3:
            recovered = split_merged(max(options, key=len))
            if recovered:
                options = recovered

        # options are bare "1".."4" or "Bild 1".."Bild 4" only when the answer is a
        # picture; a page with just the logo means it is a numeric question instead
        # (e.g. "Für wie viele Jahre wird der Landtag gewählt?" -> 3/4/5/6)
        numeric = all(re.fullmatch(r"(Bild )?\d", o) for o in options)
        page_images = images[page - 1]

        out.append(
            {
                "scope": scope,
                "num": num,
                "page": page,
                "pageImages": page_images,
                "question": question,
                "options": options,
                "imageQuestion": numeric and page_images >= 2,
            }
        )
    return out


def main():
    texts, images = read_pdf()
    full = clean(texts)
    teil2 = full.index("Teil II")

    questions = parse(full[:teil2], "ALL", full, images)

    marks, seen = [], None
    for m in re.finditer(r"für das Bundesland ([A-ZÄÖÜ][\wäöüß]*(?:-[\wäöüß]+)*)", full[teil2:]):
        if m.group(1) != seen:
            marks.append((m.group(1), m.start() + teil2))
            seen = m.group(1)
    for i, (land, start) in enumerate(marks):
        end = marks[i + 1][1] if i + 1 < len(marks) else len(full)
        questions += parse(full[start:end], land, full, images)

    OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=1), encoding="utf8")

    general = sum(1 for q in questions if q["scope"] == "ALL")
    lands = sorted({q["scope"] for q in questions} - {"ALL"})
    empty = [q for q in questions if any(not o for o in q["options"])]
    picture = [q for q in questions if q["imageQuestion"]]
    print(f"{len(questions)} questions -> {OUT.relative_to(ROOT)}")
    print(f"  general: {general}   Bundesländer: {len(lands)}")
    print(f"  options empty: {len(empty)}   picture questions: {len(picture)}")
    assert len(questions) == 460 and general == 300 and len(lands) == 16, "unexpected shape"


if __name__ == "__main__":
    main()
