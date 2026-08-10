import { EXAM, type Question } from "./questions";
import type { Progress } from "./storage";

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
