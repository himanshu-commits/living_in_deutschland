# Memory

Working notes for this project — the things that are **not** recoverable by reading
the code, and that would cost time or cause a silent bug if forgotten.

Read [`../STATUS.md`](../STATUS.md) first for where the project stands and how to
run it. These notes go deeper on the *why*.

| Note | Read it when |
| --- | --- |
| [Project, exam format and data provenance](lid-app-project.md) | Before touching anything in `tools/` or `data/`. Explains why answers and translations must ride the option permutation rather than being copied by index. |
| [Development environment](lid-dev-environment.md) | Before trying to run the app. The system Node is too old; a working one is hidden in a gitignored folder. |
| [Open items](lid-open-items.md) | When picking up work. What is unfinished, in priority order. |
| [Working style](lid-working-style.md) | How the work is expected to be delivered and reviewed. |

## Why these exist

Three facts about this project are invisible from the source and each one, if
forgotten, produces a plausible-looking wrong answer rather than an error:

1. The catalogue contains **variant questions sharing a stem** but differing in
   options, so matching on question text alone pairs the wrong variant.
2. The answer sources **order their options differently** from the official PDF, so
   answers and translations must be remapped, never copied by index.
3. A **picture question's answer is an index into images**, meaningless outside the
   order actually rendered — no dataset can be trusted for those.

A wrong answer in a study app is the kind of bug nobody reports and everybody
suffers, so the reasoning lives here rather than only in commit messages.

These notes are duplicated in the assistant's own memory directory outside the repo,
so they load automatically in a new session. If you edit one copy, the other will
drift — this one is the shareable record.
