import type { Progress } from "./storage";
import type { Question } from "./questions";
import { persistentErrors } from "./analysis";
import { questionsForTopic, TOPICS, type TopicGroup } from "./topics";

export type FocusKind = "category" | "errors";

function categoryQuestions(pool: Question[], category: string, selectedState?: string): Question[] {
  if (category === "state") return questionsForTopic("state", pool, selectedState);
  const topicIds = TOPICS.filter((topic) => topic.group === category as TopicGroup).map((topic) => topic.id);
  const unique = new Map<string, Question>();
  topicIds.forEach((id) => questionsForTopic(id, pool).forEach((question) => unique.set(question.id, question)));
  return [...unique.values()];
}

export function focusQuestions(
  pool: Question[],
  progress: Progress,
  kind: FocusKind,
  category?: string,
  selectedState?: string,
  limit = 20,
): Question[] {
  if (kind === "errors") return persistentErrors(pool, progress, limit);
  const candidates = categoryQuestions(pool, category ?? "", selectedState);
  const score = (question: Question) => {
    const stat = progress[question.id] ?? { seen: 0, correct: 0, wrong: 0 };
    const unstable = stat.wrong > 0 && (stat.streak ?? 0) < 2;
    return (unstable ? 1000 : 0) + (stat.seen === 0 ? 200 : 0) + (stat.wrong - stat.correct) * 20 - stat.seen;
  };
  return candidates.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id)).slice(0, limit);
}

export function focusCategoryName(category: string, selectedState?: string): string {
  if (category === "state") return selectedState ?? "Your state";
  if (category === "democracy") return "Politics and democracy";
  if (category === "history") return "History and responsibility";
  return "People and society";
}
