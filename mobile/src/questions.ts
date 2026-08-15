import data from "../assets/questions.json";

export type Media = {
  /** options = four pictures are the answers; map/illustration = one picture above them */
  kind: "options" | "map" | "illustration";
  /** empty when the picture is a licensed press photo we describe instead of ship */
  files: string[];
  alt: string[];
};

export type Translation = { question: string; options: string[] };

export type Question = {
  id: string;
  num?: number;
  scope: string; // "ALL" or a Bundesland name
  question: string;
  options: string[];
  answer: number | null;
  image: boolean;
  verified: boolean;
  /** per-language question + options, already in OUR option order */
  tr?: Record<string, Translation>;
  media?: Media;
};

export const CATALOGUE_VERSION: string = data.version;
export const ALL: Question[] = data.questions as Question[];

export const BUNDESLAENDER: string[] = [...new Set(ALL.map((q) => q.scope))]
  .filter((s) => s !== "ALL")
  .sort((a, b) => a.localeCompare(b, "de"));

export const BUNDESLAND_CODES: Record<string, string> = {
  "Baden-Württemberg": "BW",
  Bayern: "BY",
  Berlin: "BE",
  Brandenburg: "BB",
  Bremen: "HB",
  Hamburg: "HH",
  Hessen: "HE",
  "Mecklenburg-Vorpommern": "MV",
  Niedersachsen: "NI",
  "Nordrhein-Westfalen": "NRW",
  "Rheinland-Pfalz": "RP",
  Saarland: "SL",
  Sachsen: "SN",
  "Sachsen-Anhalt": "ST",
  "Schleswig-Holstein": "SH",
  Thüringen: "TH",
};

/** The real exam draws 30 general + 3 state questions, in 60 minutes, pass at 17. */
export const EXAM = { general: 30, state: 3, minutes: 60, pass: 17 } as const;

/** A user only ever faces 310 of the 460: the 300 general plus their state's 10. */
export function poolFor(state: string): Question[] {
  return ALL.filter((q) => q.scope === "ALL" || q.scope === state);
}

function sample<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function shuffle<T>(items: T[]): T[] {
  return sample(items, items.length);
}

/** Display order only: every value remains the option's canonical dataset index. */
export function shuffledOptionIndices(length: number): number[] {
  return shuffle(Array.from({ length }, (_, index) => index));
}

/** One exam paper: 30 general + 3 from the chosen state, in random order. */
export function examPaper(state: string): Question[] {
  const general = sample(ALL.filter((q) => q.scope === "ALL"), EXAM.general);
  const local = sample(ALL.filter((q) => q.scope === state), EXAM.state);
  return sample([...general, ...local], EXAM.general + EXAM.state);
}
