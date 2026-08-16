"""Merge the PDF questions with answer keys from two independent open datasets.

The PDF is authoritative for question/option TEXT but contains no answers.
Two MIT-licensed datasets supply the answers. We match each PDF question against
both, then only trust an answer when the two sources independently agree.

Matching is done on the question stem AND the full option set together: the
catalogue contains variant questions sharing a stem but differing in options
(e.g. "Was ist keine staatliche Gewalt in Deutschland?" exists with both
Gesetzgebung/Regierung/Presse/Rechtsprechung and Legislative/Judikative/...).
Matching on the stem alone silently pairs the wrong variant.

Because option ORDER differs between sources, the correct answer is mapped back
through the winning option permutation rather than copied by index.

    python tools/build_dataset.py
    -> data/questions.json      the dataset
    -> data/review-queue.md     the questions still needing a human
"""

import difflib
import json
import re
import urllib.request
from itertools import permutations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = DATA / ".cache"

SOURCES = {
    "flexsurfer": (
        "https://raw.githubusercontent.com/flexsurfer/einburgerungstest/"
        "main/app/mobile/assets/data.json"
    ),
    "lid": (
        "https://raw.githubusercontent.com/leben-in-deutschland/"
        "leben-in-deutschland-scrapper/main/data/question.json"
    ),
}

# joint question+options similarity required to accept a source's answer
THRESHOLD = 0.80


def fetch(name, url):
    """Load a named JSON source, downloading and caching it when necessary."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{name}.json"
    if not path.exists():
        print(f"  downloading {name}...")
        urllib.request.urlretrieve(url, path)
    return json.loads(path.read_text(encoding="utf8"))


def norm(s):
    """Normalize German text for fuzzy matching."""
    s = s.lower().replace("ß", "ss")
    return " ".join(re.sub(r"[^a-z0-9äöü ]", " ", s).split())


def sim(a, b):
    """Return the normalized similarity ratio for two strings."""
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def align(mine, theirs):
    """Best 1-1 option mapping. Returns (score, permutation) where
    permutation[their_index] == my_index."""
    best = (-1.0, None)
    for perm in permutations(range(4)):
        score = sum(sim(theirs[k], mine[perm[k]]) for k in range(4)) / 4
        if score > best[0]:
            best = (score, perm)
    return best


def match(question, pool, get_question, get_options, get_correct):
    """Find the pool entry for `question` and translate its answer into our
    option order. Returns (joint_score, answer_index_or_None, entry, permutation)
    where permutation[their_index] == our_index."""
    shortlist = sorted(
        ((sim(question["question"], get_question(p)), i) for i, p in enumerate(pool)),
        reverse=True,
    )[:6]

    best = (0.0, None, None, None)
    for q_score, i in shortlist:
        entry = pool[i]
        options = get_options(entry)
        correct = get_correct(entry)
        if len(options) != 4 or correct is None:
            continue
        o_score, perm = align(question["options"], options)
        joint = 0.35 * q_score + 0.65 * o_score
        if joint > best[0]:
            assert perm is not None
            best = (joint, perm[correct], entry, perm)
    return best


def translations_of(entry, perm):
    """Lift an entry's translations into our option order.

    The sources order their options differently from the PDF, so a translated
    option list copied by index would be silently scrambled. `perm` maps their
    index onto ours, the same mapping the answer rides."""
    out = {}
    for code, block in (entry.get("translation") or {}).items():
        options: list[str | None] = [None] * 4
        for k, letter in enumerate("abcd"):
            text = block.get(letter)
            if text:
                options[perm[k]] = " ".join(text.split())
        if not block.get("question") or any(o is None for o in options):
            continue
        out[code] = {
            "question": " ".join(block["question"].split()),
            "options": options,
        }
    return out


def respace(mine, reference):
    """Adopt the reference's spacing when the two texts are identical apart from
    whitespace.

    Bold styling in the PDF splits words: the extractor yields "keine s taatliche
    Gewalt" and "nicht wä hrend". Guessing where the space belongs from a word list
    is unsafe -- it also "fixes" the legitimate "Richter in Deutschland" into
    "Richterin Deutschland" and changes the meaning. Requiring the two strings to be
    equal once all whitespace is removed means this can only ever move spaces, never
    letters, so the PDF stays the authority on content."""
    if mine == reference:
        return mine, False
    def squeeze(text):
        """Remove whitespace so spacing-only differences can be detected."""
        return re.sub(r"\s+", "", text)

    if squeeze(mine) == squeeze(reference) and squeeze(mine):
        return reference, True
    return mine, False


def load_overrides():
    """Hand-verified answers, so a rebuild never discards human work.

    data/overrides.json: {"ALL-021": 2, "Bayern-01": 1, ...}  (index into options)
    """
    path = DATA / "overrides.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf8"))


def load_translation_overrides():
    """Question translations for languages neither scraper covers, so a
    rebuild never discards that work either.

    data/translation_overrides.json: {"pl": {"ALL-021": {"question": ...,
    "options": [...]}, ...}}  Always wins over a scraper match for that
    language, same as load_overrides() does for answers.
    """
    path = DATA / "translation_overrides.json"
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf8"))
    return {lang: entries for lang, entries in raw.items() if not lang.startswith("_")}


def main():
    """Build the merged question dataset and its human review queue."""
    questions = json.loads((DATA / "pdf_questions.json").read_text(encoding="utf8"))
    flex = fetch("flexsurfer", SOURCES["flexsurfer"])
    lid = fetch("lid", SOURCES["lid"])
    overrides = load_overrides()
    translation_overrides = load_translation_overrides()
    letter = {"a": 0, "b": 1, "c": 2, "d": 3}
    contradicted = []

    out = []
    for q in questions:
        f_score, f_ans, _f_entry, _f_perm = match(
            q, flex, lambda p: p["question"], lambda p: p["answers"], lambda p: p["correct"]
        )
        l_score, l_ans, l_entry, l_perm = match(
            q,
            lid,
            lambda p: p["question"],
            lambda p: [p["a"], p["b"], p["c"], p["d"]],
            lambda p: letter.get(p["solution"]),
        )

        # translations ride the same match and permutation as the answer, so a
        # wrong-variant match cannot quietly attach the wrong translation
        tr = translations_of(l_entry, l_perm) if l_entry and l_score >= THRESHOLD else {}

        f_ok = f_score >= THRESHOLD and f_ans is not None
        l_ok = l_score >= THRESHOLD and l_ans is not None

        if f_ok and l_ok and f_ans == l_ans:
            answer, confidence, sources = f_ans, "confirmed", ["flexsurfer", "lid"]
        elif f_ok and l_ok:
            answer, confidence, sources = None, "conflict", ["flexsurfer", "lid"]
        elif f_ok:
            answer, confidence, sources = f_ans, "single-source", ["flexsurfer"]
        elif l_ok:
            answer, confidence, sources = l_ans, "single-source", ["lid"]
        else:
            answer, confidence, sources = None, "unmatched", []

        image = q["imageQuestion"]
        # a picture question's answer index is meaningless unless it refers to the
        # same image order we ship, so it always needs a human
        verified = confidence == "confirmed" and not image

        if q["scope"] == "ALL":
            qid = f"{q['scope']}-{q['num']:03d}"
        else:
            qid = f"{q['scope']}-{q['num']:02d}"

        # a translation override always wins over whatever a scraper matched
        # for that language, same reasoning as the answer overrides below
        for lang, entries in translation_overrides.items():
            if qid in entries:
                tr[lang] = entries[qid]

        # a human always wins over the scrapers
        if qid in overrides:
            if answer is not None and overrides[qid] != answer:
                contradicted.append((qid, answer, overrides[qid]))
            answer, confidence, verified = overrides[qid], "hand-verified", True
            sources = ["human"]

        out.append(
            {
                "id": qid,
                "scope": q["scope"],
                "num": q["num"],
                "page": q["page"],
                "pageImages": q["pageImages"],
                "question": q["question"],
                "options": q["options"],
                "answer": answer,
                "imageQuestion": image,
                "confidence": confidence,
                "verified": verified,
                "sources": sources,
                "translations": tr,
                "scores": {"flexsurfer": round(f_score, 3), "lid": round(l_score, 3)},
            }
        )

    (DATA / "questions.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1), encoding="utf8"
    )

    todo = [q for q in out if not q["verified"]]
    lines = [
        "# Review queue",
        "",
        f"{len(todo)} of {len(out)} questions need a human. Check each against BAMF's",
        "official tool: <https://oet.bamf.de/ords/oetut/f?p=534:1> (it reveals the",
        "correct answer immediately after you answer).",
        "",
        "Set `answer` (0-3) and `verified: true` in `data/questions.json`.",
        "",
    ]
    for group, title in (
        ("image", "Image questions — MUST be checked against your own picture order"),
        ("text", "Text questions — only one source matched"),
    ):
        rows = [q for q in todo if q["imageQuestion"] == (group == "image")]
        lines += [f"## {title} ({len(rows)})", ""]
        for q in rows:
            guess = "?" if q["answer"] is None else "abcd"[q["answer"]]
            lines.append(
                f"- [ ] `{q['id']}` (PDF p.{q['page']}) — "
                f"{q['question'][:80]}  → guess **{guess}** ({q['confidence']})"
            )
        lines.append("")
    (DATA / "review-queue.md").write_text("\n".join(lines), encoding="utf8")

    counts = {}
    for q in out:
        counts[q["confidence"]] = counts.get(q["confidence"], 0) + 1
    print(f"{len(out)} questions -> data/questions.json")
    for k in ("confirmed", "hand-verified", "single-source", "conflict", "unmatched"):
        if counts.get(k):
            print(f"  {k:>14}: {counts[k]}")
    print(f"  {'verified':>14}: {sum(1 for q in out if q['verified'])}")
    print(f"  {'review queue':>14}: {len(todo)}  -> data/review-queue.md")

    # a human disagreeing with two agreeing scrapers is worth a second look:
    # either the datasets are wrong, or the override is a typo
    for qid, was, now in contradicted:
        print(f"  NOTE  {qid}: override {'abcd'[now]} overrules sources' {'abcd'[was]}")


if __name__ == "__main__":
    main()
