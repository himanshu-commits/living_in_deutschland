"""Assert the invariants of data/questions.json. Run in CI before shipping a build.

    python tools/validate.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAENDER = 16
GENERAL = 300
PER_LAND = 10


def main():
    questions = json.loads((ROOT / "data" / "questions.json").read_text(encoding="utf8"))
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
