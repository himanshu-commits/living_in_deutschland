"""Assert the invariants of data/questions.json. Run in CI before shipping a build.

    python tools/validate.py
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAENDER = 16
GENERAL = 300
PER_LAND = 10
TRANSLATION_LANGUAGES = {
    "ar", "bg", "bs", "el", "en", "fa", "fr", "hi", "it",
    "pl", "ro", "ru", "sq", "tr", "uk", "ur", "zh",
}


def main():
    questions = json.loads((ROOT / "data" / "questions.json").read_text(encoding="utf8"))
    app_asset = json.loads(
        (ROOT / "mobile" / "assets" / "questions.json").read_text(encoding="utf8")
    )["questions"]
    errors, warnings = [], []

    if len(questions) != GENERAL + LAENDER * PER_LAND:
        errors.append(f"expected 460 questions, found {len(questions)}")

    scopes = Counter(q["scope"] for q in questions)
    if scopes.get("ALL") != GENERAL:
        errors.append(f"expected {GENERAL} general questions, found {scopes.get('ALL')}")
    lands = {s: c for s, c in scopes.items() if s != "ALL"}
    if len(lands) != LAENDER:
        errors.append(f"expected {LAENDER} Bundesländer, found {len(lands)}")
    for land, count in sorted(lands.items()):
        if count != PER_LAND:
            errors.append(f"{land}: expected {PER_LAND} questions, found {count}")

    ids = Counter(q["id"] for q in questions)
    for qid, count in ids.items():
        if count > 1:
            errors.append(f"duplicate id {qid} ({count}x)")

    app_by_id = {q["id"]: q for q in app_asset}
    if set(app_by_id) != set(ids):
        errors.append("mobile question IDs do not match data/questions.json")

    for q in questions:
        if len(q["options"]) != 4:
            errors.append(f"{q['id']}: {len(q['options'])} options, expected 4")
        if any(not o.strip() for o in q["options"]):
            errors.append(f"{q['id']}: has an empty option")
        if len(set(q["options"])) != 4:
            errors.append(f"{q['id']}: duplicate option text")
        if not q["question"].strip():
            errors.append(f"{q['id']}: empty question")
        if q["answer"] is not None and not 0 <= q["answer"] <= 3:
            errors.append(f"{q['id']}: answer {q['answer']} out of range")
        if q["verified"] and q["answer"] is None:
            errors.append(f"{q['id']}: marked verified but has no answer")
        if q["answer"] is None:
            warnings.append(f"{q['id']}: no answer yet ({q['confidence']})")
        elif not q["verified"]:
            warnings.append(f"{q['id']}: unverified answer ({q['confidence']})")

        translations = q.get("translations", {})
        missing_languages = TRANSLATION_LANGUAGES - translations.keys()
        extra_languages = translations.keys() - TRANSLATION_LANGUAGES
        if missing_languages:
            errors.append(f"{q['id']}: missing translations: {sorted(missing_languages)}")
        if extra_languages:
            errors.append(f"{q['id']}: unexpected translations: {sorted(extra_languages)}")

        for lang, translation in translations.items():
            question = translation.get("question", "")
            options = translation.get("options", [])
            if not question.strip():
                errors.append(f"{q['id']} [{lang}]: empty translated question")
            if len(options) != 4:
                errors.append(f"{q['id']} [{lang}]: {len(options)} translated options, expected 4")
            elif any(not option.strip() for option in options):
                errors.append(f"{q['id']} [{lang}]: empty translated option")
            translated_text = [question, *options]
            if any("\ufffd" in text or "\x00" in text for text in translated_text):
                errors.append(f"{q['id']} [{lang}]: invalid replacement or NUL character")
            if question.count("(") != question.count(")"):
                errors.append(f"{q['id']} [{lang}]: unbalanced parentheses")
            # A space before punctuation is normal French typography.
            if lang != "fr" and re.search(r"\s+[?!.,;:]$", question):
                errors.append(f"{q['id']} [{lang}]: whitespace before final punctuation")

        bundled = app_by_id.get(q["id"])
        if bundled and bundled.get("tr", {}) != translations:
            errors.append(f"{q['id']}: bundled translations are stale")

    # a healthy key is not lopsided towards one letter
    spread = Counter(q["answer"] for q in questions if q["answer"] is not None)
    print("answer spread:", {"abcd"[k]: v for k, v in sorted(spread.items())})

    verified = sum(1 for q in questions if q["verified"])
    print(f"{len(questions)} questions | {verified} verified | {len(warnings)} to review")

    for e in errors:
        print(f"ERROR   {e}")
    if errors:
        print(f"\nFAILED: {len(errors)} error(s)")
        return 1
    print("\nOK: all structural invariants hold")
    if warnings:
        print(f"({len(warnings)} answers still need review — see data/review-queue.md)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
