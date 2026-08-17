import type { Question } from "./questions";
import type { Progress } from "./storage";
import { questionsForTopic, TOPICS } from "./topics";

export type AdaptiveDrill = {
  questions: Question[];
  focusTopics: string[];
  diagnostic: boolean;
};

const DRILL_SIZE = 20;
const FOCUS_TOPIC_COUNT = 3;

/** Builds a drill from the learner's saved answer history. */
export function adaptiveDrill(
  questions: Question[],
  progress: Progress,
  selectedState?: string,
): AdaptiveDrill {
  const topics = [
    ...TOPICS.map((topic) => ({
      name: topic.name,
      questions: questionsForTopic(topic.id, questions),
    })),
    ...(selectedState
      ? [{ name: selectedState, questions: questionsForTopic("state", questions, selectedState) }]
      : []),
  ].map((topic) => {
    const stats = topic.questions.map((question) => progress[question.id]).filter(Boolean);
    const correct = stats.reduce((sum, stat) => sum + stat.correct, 0);
    const wrong = stats.reduce((sum, stat) => sum + stat.wrong, 0);
    const activeMistakes = topic.questions.filter((question) => {
      const stat = progress[question.id];
      return stat && stat.wrong > stat.correct;
    }).length;
    return { ...topic, correct, wrong, activeMistakes, attempts: correct + wrong };
  });

  const weak = topics
    .filter((topic) => topic.wrong > 0)
    .sort((a, b) => {
      if (b.activeMistakes !== a.activeMistakes) return b.activeMistakes - a.activeMistakes;
      const rateDifference = b.wrong / b.attempts - a.wrong / a.attempts;
      return rateDifference || b.wrong - a.wrong;
    })
    .slice(0, FOCUS_TOPIC_COUNT);

  // With no mistakes yet, start with a broad least-seen diagnostic session.
  const diagnostic = weak.length === 0;
  const topicRank = new Map<string, number>();
  weak.forEach((topic, index) => {
    topic.questions.forEach((question) => {
      topicRank.set(question.id, Math.max(topicRank.get(question.id) ?? 0, weak.length - index));
    });
  });

  const candidates = diagnostic
    ? questions.filter((question) => question.scope === "ALL" || question.scope === selectedState)
    : [...new Map(weak.flatMap((topic) => topic.questions).map((question) => [question.id, question])).values()];

  const score = (question: Question) => {
    const stat = progress[question.id] ?? { seen: 0, correct: 0, wrong: 0 };
    return (
      (topicRank.get(question.id) ?? 0) * 5 +
      (stat.wrong > stat.correct ? 500 : 0) +
      (stat.wrong - stat.correct) * 20 -
      stat.seen
    );
  };
  const ranked = candidates.sort(
    (a, b) => score(b) - score(a) || a.id.localeCompare(b.id),
  );

  return {
    questions: ranked.slice(0, DRILL_SIZE),
    focusTopics: weak.map((topic) => topic.name),
    diagnostic,
  };
}
