"""Extract the catalogue's illustrations and bind them to questions.

Three kinds of picture appear in the PDF:

  options       four pictures side by side; the answer is "which picture"
  map           one map of Germany with four numbered regions, same idea
  illustration  one photo the question asks *about*, with ordinary text options

Every page also carries the BAMF logo, which is skipped.

Images are deduplicated by content hash (the same map is reused across states) and
written as PNG, because the source mixes PNG, JPEG and JPEG 2000, and React Native
cannot display JPEG 2000.

    python tools/extract_images.py
    -> mobile/assets/images/*.png
    -> data/images.json
"""

import hashlib
import json
import re
from pathlib import Path

from pypdf import PdfReader
from pypdf.generic import ContentStream, IndirectObject

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "gesamtfragenkatalog-lebenindeutschland.pdf"
QUESTIONS = ROOT / "data" / "questions.json"
OUT_JSON = ROOT / "data" / "images.json"
OUT_DIR = ROOT / "mobile" / "assets" / "images"
HELD_DIR = ROOT / "data" / "images-restricted"

LOGO = "/Im0"  # the BAMF logo, drawn on all 191 pages
MAX_EDGE = 700  # displayed at ~350pt at most, so this covers 2x density
JPEG_QUALITY = 82

# A "©" credit in the question text marks a licensed press photo. BAMF's licence
# does not extend to us, so these are extracted for reference but never bundled --
# the official /Alt description carries the question instead.
CREDIT = re.compile(r"©")

# for a page holding two questions where only one has a picture
PICTURE_WORDS = re.compile(
    r"\bBild\b|zeigt|Foto|[Aa]bgebildet|Flagge|Wappen|Symbol|Karte|Grafik", re.I
)


def placements(page):
    """(xobject_name, x, y) for each image drawn, in content-stream order."""
    ctm = [1, 0, 0, 1, 0, 0]
    stack, out = [], []

    def mul(m, n):
        a, b, c, d, e, f = m
        A, B, C, D, E, F = n
        return [a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D,
                e * A + f * C + E, e * B + f * D + F]

    for operands, op in ContentStream(page.get_contents(), page.pdf).operations:
        if op == b"q":
            stack.append(list(ctm))
        elif op == b"Q":
            ctm = stack.pop() if stack else [1, 0, 0, 1, 0, 0]
        elif op == b"cm":
            ctm = mul([float(x) for x in operands], ctm)
        elif op == b"Do":
            out.append((str(operands[0]), ctm[4], ctm[5]))
    return out


def alt_by_page(reader):
    """Page number -> the /Alt descriptions on it, in document order.

    The catalogue is PDF/UA tagged, so every illustration carries an official text
    description. pypdf mis-detects these as UTF-16, so decode the raw bytes."""
    pages = {p.indirect_reference.idnum: i + 1 for i, p in enumerate(reader.pages)}
    out, seen = {}, set()

    def decode(value):
        raw = getattr(value, "original_bytes", None)
        text = raw.decode("cp1252", "replace") if raw else str(value)
        return " ".join(text.split())

    def walk(node, page=None):
        if isinstance(node, IndirectObject):
            if node.idnum in seen:
                return
            seen.add(node.idnum)
            node = node.get_object()
        if isinstance(node, list):
            for child in node:
                walk(child, page)
            return
        if not hasattr(node, "get"):
            return
        pg = node.get("/Pg")
        if isinstance(pg, IndirectObject):
            page = pages.get(pg.idnum, page)
        if "/Alt" in node:
            out.setdefault(page, []).append(decode(node["/Alt"]))
        if "/K" in node:
            walk(node["/K"], page)

    walk(reader.trailer["/Root"]["/StructTreeRoot"]["/K"])
    return out


def save(image, directory, digest):
    """Downscale and write. JPEG unless the image genuinely uses transparency --
    the source mixes PNG, JPEG and JPEG 2000, and React Native cannot read JP2."""
    pic = image.image
    pic.thumbnail((MAX_EDGE, MAX_EDGE))

    transparent = False
    if pic.mode in ("RGBA", "LA", "P"):
        pic = pic.convert("RGBA")
        alpha = pic.getchannel("A")
        transparent = alpha.getextrema()[0] < 255

    directory.mkdir(parents=True, exist_ok=True)
    if transparent:
        path = directory / f"{digest}.png"
        pic.save(path, optimize=True)
    else:
        path = directory / f"{digest}.jpg"
        pic.convert("RGB").save(path, quality=JPEG_QUALITY, optimize=True, progressive=True)
    return path


def owner(questions_on_page, has_four):
    """Which question on the page the picture belongs to."""
    picture = [q for q in questions_on_page if q["imageQuestion"]]
    if picture:
        return picture[0]
    if has_four:
        return None
    referring = [q for q in questions_on_page if PICTURE_WORDS.search(q["question"])]
    if len(referring) == 1:
        return referring[0]
    return questions_on_page[0] if questions_on_page else None


def main():
    reader = PdfReader(str(PDF))
    questions = json.loads(QUESTIONS.read_text(encoding="utf8"))
    by_page = {}
    for q in questions:
        by_page.setdefault(q["page"], []).append(q)

    alts = alt_by_page(reader)
    for directory in (OUT_DIR, HELD_DIR):
        directory.mkdir(parents=True, exist_ok=True)
        for stale in list(directory.glob("*.png")) + list(directory.glob("*.jpg")):
            stale.unlink()

    saved, bound, unclaimed = {}, {}, []

    for number, page in enumerate(reader.pages, 1):
        drawn = [p for p in placements(page) if p[0] != LOGO]
        if not drawn:
            continue

        # left-to-right is the order the options are numbered 1..4
        drawn.sort(key=lambda p: p[1])

        here = by_page.get(number, [])
        target = owner(here, has_four=len(drawn) == 4)
        if target is None:
            unclaimed.append((number, len(drawn)))
            continue

        restricted = bool(CREDIT.search(target["question"]))
        directory = HELD_DIR if restricted else OUT_DIR

        # pypdf reports "Im0.png" where the content stream refers to "/Im0"
        xobjects = {im.name.rsplit(".", 1)[0]: im for im in page.images}

        files = []
        for name, _x, _y in drawn:
            image = xobjects.get(name.lstrip("/"))
            if image is None:
                continue
            digest = hashlib.sha1(image.data).hexdigest()[:12]
            if digest not in saved:
                saved[digest] = save(image, directory, digest)
            files.append(saved[digest].name)

        if not files:
            continue

        kind = "options" if len(files) == 4 else ("map" if target["imageQuestion"] else "illustration")
        bound[target["id"]] = {
            "kind": kind,
            "files": files,
            "alt": [a for a in alts.get(number, []) if "Logo Bundesamt" not in a],
            "page": number,
            "restricted": restricted,
        }

    OUT_JSON.write_text(json.dumps(bound, ensure_ascii=False, indent=1), encoding="utf8")

    kinds = {}
    for entry in bound.values():
        kinds[entry["kind"]] = kinds.get(entry["kind"], 0) + 1
    bundled = sum(p.stat().st_size for p in saved.values() if p.parent == OUT_DIR) / 1024
    held = [p for p in saved.values() if p.parent == HELD_DIR]
    picture_questions = [q for q in questions if q["imageQuestion"]]
    missing = [q["id"] for q in picture_questions if q["id"] not in bound]
    no_alt = [qid for qid, e in bound.items() if not e["alt"]]

    print(f"{len(saved) - len(held)} images -> {OUT_DIR.relative_to(ROOT)} ({bundled:.0f} KB bundled)")
    print(f"{len(held)} licensed press photos held back -> {HELD_DIR.relative_to(ROOT)} (not shipped)")
    print(f"{len(bound)} questions bound: {kinds}")
    print(f"  picture questions covered: {len(picture_questions) - len(missing)}/{len(picture_questions)}")
    if missing:
        print(f"  MISSING: {missing}")
    if no_alt:
        print(f"  no alt text: {no_alt}")
    if unclaimed:
        print(f"  unclaimed pages: {unclaimed}")


if __name__ == "__main__":
    main()
