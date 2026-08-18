"""Apply durable translation overrides to an existing generated dataset.

This is the fast path for translation-only review work. It avoids refetching the
upstream answer sources; a full ``build_dataset.py`` run remains the canonical
way to rebuild everything from scratch.
"""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def main():
    questions_path = DATA / "questions.json"
    overrides_path = DATA / "translation_overrides.json"
    questions = json.loads(questions_path.read_text(encoding="utf8"))
    overrides = json.loads(overrides_path.read_text(encoding="utf8"))

    by_id = {question["id"]: question for question in questions}
    applied = 0
    for language, entries in overrides.items():
        if language.startswith("_"):
            continue
        for question_id, translation in entries.items():
            if question_id not in by_id:
                raise ValueError(f"unknown question ID in {language}: {question_id}")
            by_id[question_id].setdefault("translations", {})[language] = translation
            applied += 1

    questions_path.write_text(
        json.dumps(questions, ensure_ascii=False, indent=1), encoding="utf8"
    )
    print(f"Applied {applied} durable translation overrides")


if __name__ == "__main__":
    main()
