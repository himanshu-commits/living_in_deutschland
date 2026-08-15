import type { Question } from "./questions";

export type TopicGroup = "democracy" | "history" | "society";

export type Topic = {
  id: string;
  name: string;
  group: TopicGroup;
  questionNumbers: readonly number[];
};

const topic = (
  id: string,
  name: string,
  group: TopicGroup,
  questionNumbers: readonly number[]
): Topic => ({ id, name, group, questionNumbers });

/** Curriculum-based clusters for the 300 general questions. */
export const TOPICS: readonly Topic[] = [
  topic("constitutional-bodies", "Verfassungsorgane", "democracy", [
    13, 20, 28, 31, 42, 43, 44, 48, 55, 57, 58, 65, 70, 71, 72, 74, 75, 80, 81, 82,
    83, 84, 85, 86, 87, 88, 89, 90, 91, 98, 129,
  ]),
  topic("constitutional-principles", "Verfassungsprinzipien", "democracy", [
    3, 6, 11, 22, 26, 27, 30, 32, 34, 41, 51, 52, 53, 54, 60, 61, 63, 143, 144, 145,
    147, 148,
  ]),
  topic("federalism", "Föderalismus", "democracy", [24, 25, 37, 38, 39, 49, 64, 67]),
  topic("social-system", "Sozialsystem", "democracy", [23, 35, 36, 45, 97, 99, 100, 285]),
  topic("fundamental-rights", "Grundrechte", "democracy", [
    1, 2, 4, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19, 101, 135, 149, 262, 274, 277,
    278, 281, 289,
  ]),
  topic("elections", "Wahlen und Beteiligung", "democracy", [
    5, 62, 93, 94, 107, 108, 109, 110, 112, 113, 114, 115, 116, 117, 119, 120, 121,
    122, 123, 124, 125, 126, 127, 128, 130, 132, 133, 134,
  ]),
  topic("parties", "Parteien", "democracy", [73, 76, 78, 79, 92, 103]),
  topic("state-duties", "Aufgaben des Staates", "democracy", [46, 47, 68, 77]),
  topic("civic-duties", "Pflichten", "democracy", [95, 105, 106, 248, 249, 260, 282]),
  topic("state-symbols", "Staatssymbole", "democracy", [21, 29, 40, 214, 216]),
  topic("municipality", "Kommune", "democracy", [56, 69, 131, 253, 255, 256, 259, 265, 273]),
  topic("law-everyday", "Recht und Alltag", "democracy", [
    96, 102, 104, 111, 136, 137, 138, 139, 140, 141, 142, 146, 150, 241, 242, 243,
    245, 246, 247, 251, 252, 254, 258, 263, 266, 267, 268, 272, 275, 276, 279, 280,
    283, 286, 287, 290, 291,
  ]),
  topic("national-socialism", "Nationalsozialismus und seine Folgen", "history", [
    152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 170, 175, 176,
    177, 179, 184, 206, 220, 288,
  ]),
  topic("after-1945", "Wichtige Stationen nach 1945", "history", [
    50, 151, 165, 166, 167, 168, 169, 171, 172, 174, 178, 180, 181, 183, 185, 186,
    187, 188, 189, 190, 193, 199, 202, 203, 207, 208, 209, 210, 211, 212, 213, 215,
    217,
  ]),
  topic("reunification", "Wiedervereinigung", "history", [
    191, 192, 194, 195, 196, 197, 198, 200, 201, 204, 205, 218, 219, 228,
  ]),
  topic("germany-europe", "Deutschland in Europa", "history", [
    173, 213, 221, 222, 223, 224, 225, 226, 227, 229, 230, 231, 232, 233, 234, 235,
    236, 237, 238, 239, 240,
  ]),
  topic("religious-diversity", "Religiöse Vielfalt", "society", [
    33, 59, 66, 182, 292, 294, 295, 296,
  ]),
  topic("education", "Bildung", "society", [244, 250, 257, 261, 269, 270, 284]),
  topic("migration-history", "Migrationsgeschichte", "society", [297, 298, 299, 300]),
  topic("living-together", "Interkulturelles Zusammenleben", "society", [118, 264, 271, 293]),
];

export function questionsForTopic(
  topicId: string,
  questions: Question[],
  selectedState?: string
): Question[] {
  if (topicId === "state" && selectedState) {
    return questions.filter((question) => question.scope === selectedState);
  }
  const selected = TOPICS.find((entry) => entry.id === topicId);
  if (!selected) return [];
  const numbers = new Set(selected.questionNumbers);
  return questions.filter((question) => question.scope === "ALL" && numbers.has(question.num ?? -1));
}
