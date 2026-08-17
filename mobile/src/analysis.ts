import { EXAM, type Question } from "./questions";
import type { Progress } from "./storage";
import { questionsForTopic, TOPICS, type TopicGroup } from "./topics";

export type Analysis = {
  pool: number;
  /** answered at least once in practice */
  attempted: number;
  /** answered, and right at least as often as wrong */
  strong: number;
  /** answered, but wrong more often than right */
  shaky: number;
  unseen: number;
  /** share of practice answers that were correct, 0-1; null before any attempt */
  accuracy: number | null;
  /** expected score out of 33 */
  projected: number;
  ready: boolean;
};

/** What the user would score today.
 *
 * Unseen questions count against you rather than being extrapolated from the
 * ones you happen to have answered: a 90% accuracy over 12 attempts says almost
 * nothing about the other 298, and a study app that opens with a flattering
 * number is worse than useless before a real exam. The projection therefore
 * starts near zero and climbs only as coverage does. */
export function analyse(pool: Question[], progress: Progress): Analysis {
  let attempted = 0;
  let strong = 0;
  let correct = 0;
  let total = 0;

  for (const q of pool) {
    const stat = progress[q.id];
    if (!stat || stat.seen === 0) continue;
    attempted += 1;
    correct += stat.correct;
    total += stat.correct + stat.wrong;
    if (stat.correct > 0 && stat.correct >= stat.wrong) strong += 1;
  }

  const size = pool.length || 1;
  const projected = Math.round((strong / size) * (EXAM.general + EXAM.state));

  return {
    pool: pool.length,
    attempted,
    strong,
    shaky: attempted - strong,
    unseen: pool.length - attempted,
    accuracy: total > 0 ? correct / total : null,
    projected,
    ready: projected >= EXAM.pass,
  };
}

export type TopicAnalysis = {
  id: string;
  name: string;
  questions: number;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
  mastery: number;
};

/** Detailed per-topic performance used by the Premium analytics screen. */
export function analyseTopics(
  questions: Question[],
  progress: Progress,
  selectedState?: string,
): TopicAnalysis[] {
  const topics = [
    ...TOPICS.map((topic) => ({
      id: topic.id,
      name: topic.name,
      questions: questionsForTopic(topic.id, questions),
    })),
    ...(selectedState
      ? [{ id: "state", name: selectedState, questions: questionsForTopic("state", questions, selectedState) }]
      : []),
  ];

  return topics.map((topic) => {
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let mastery = 0;
    for (const question of topic.questions) {
      const stat = progress[question.id];
      if (!stat?.seen) continue;
      attempted += 1;
      correct += stat.correct;
      wrong += stat.wrong;
      if (stat.correct > 0 && stat.correct >= stat.wrong) mastery += 1;
    }
    const answers = correct + wrong;
    return {
      id: topic.id,
      name: topic.name,
      questions: topic.questions.length,
      attempted,
      correct,
      wrong,
      accuracy: answers > 0 ? correct / answers : null,
      mastery,
    };
  });
}

export type ReadinessConfidence = {
  level: "Low" | "Medium" | "High";
  evidence: number;
  repeated: number;
};

/** How much evidence supports the projection: breadth matters most, repetition adds confidence. */
export function readinessConfidence(pool: Question[], progress: Progress): ReadinessConfidence {
  const attempted = pool.filter((question) => (progress[question.id]?.seen ?? 0) > 0).length;
  const repeated = pool.filter((question) => (progress[question.id]?.seen ?? 0) >= 2).length;
  const size = Math.max(1, pool.length);
  const evidence = Math.min(1, (attempted / size) * 0.75 + (repeated / size) * 0.25);
  return {
    level: evidence >= 0.7 ? "High" : evidence >= 0.35 ? "Medium" : "Low",
    evidence,
    repeated,
  };
}

/** Additional catalogue questions that must become strong for a rounded 17/33 projection. */
export function questionsNeededToPass(pool: Question[], progress: Progress): number {
  const current = analyse(pool, progress);
  let targetStrong = current.strong;
  while (targetStrong < current.pool && Math.round((targetStrong / current.pool) * 33) < EXAM.pass) {
    targetStrong += 1;
  }
  return Math.max(0, targetStrong - current.strong);
}

export type CategoryAnalysis = TopicAnalysis & { group: TopicGroup | "state" };

/** Summary of the three catalogue domains plus the learner's selected state. */
export function analyseCategories(
  questions: Question[],
  progress: Progress,
  selectedState?: string,
): CategoryAnalysis[] {
  const groups: { group: TopicGroup | "state"; id: string; name: string; questions: Question[] }[] = (
    ["democracy", "history", "society"] as TopicGroup[]
  ).map((group) => {
    const ids = new Set(
      TOPICS.filter((topic) => topic.group === group).flatMap((topic) =>
        questionsForTopic(topic.id, questions).map((question) => question.id),
      ),
    );
    return {
      group,
      id: group,
      name: group === "democracy" ? "Politics and democracy" : group === "history" ? "History and responsibility" : "People and society",
      questions: questions.filter((question) => ids.has(question.id)),
    };
  });
  if (selectedState) {
    groups.push({
      group: "state",
      id: "state",
      name: selectedState,
      questions: questionsForTopic("state", questions, selectedState),
    });
  }

  return groups.map((category) => {
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let mastery = 0;
    for (const question of category.questions) {
      const stat = progress[question.id];
      if (!stat?.seen) continue;
      attempted += 1;
      correct += stat.correct;
      wrong += stat.wrong;
      if (stat.correct > 0 && stat.correct >= stat.wrong) mastery += 1;
    }
    const answers = correct + wrong;
    return {
      group: category.group,
      id: category.id,
      name: category.name,
      questions: category.questions.length,
      attempted,
      correct,
      wrong,
      accuracy: answers ? correct / answers : null,
      mastery,
    };
  });
}

/** Previously missed questions that have not yet been answered correctly twice in a row. */
export function persistentErrors(pool: Question[], progress: Progress, limit = 5): Question[] {
  return pool
    .filter((question) => {
      const stat = progress[question.id];
      return stat && stat.wrong > 0 && (stat.streak ?? 0) < 2;
    })
    .sort((a, b) => {
      const aStat = progress[a.id]!;
      const bStat = progress[b.id]!;
      return (bStat.wrong - bStat.correct) - (aStat.wrong - aStat.correct) || bStat.wrong - aStat.wrong;
    })
    .slice(0, limit);
}
