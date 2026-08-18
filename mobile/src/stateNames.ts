import type { LangCode } from "./i18n";

/**
 * State IDs stay in German because they key questions, progress, and storage.
 * Only the user-facing label is localized.
 */
const POLISH_STATE_NAMES: Record<string, string> = {
  "Baden-Württemberg": "Badenia-Wirtembergia",
  Bayern: "Bawaria",
  Berlin: "Berlin",
  Brandenburg: "Brandenburgia",
  Bremen: "Brema",
  Hamburg: "Hamburg",
  Hessen: "Hesja",
  "Mecklenburg-Vorpommern": "Meklemburgia-Pomorze Przednie",
  Niedersachsen: "Dolna Saksonia",
  "Nordrhein-Westfalen": "Nadrenia Północna-Westfalia",
  "Rheinland-Pfalz": "Nadrenia-Palatynat",
  Saarland: "Saara",
  Sachsen: "Saksonia",
  "Sachsen-Anhalt": "Saksonia-Anhalt",
  "Schleswig-Holstein": "Szlezwik-Holsztyn",
  Thüringen: "Turyngia",
};

const STATE_NAMES: Partial<Record<LangCode, Record<string, string>>> = {
  pl: POLISH_STATE_NAMES,
};

export function stateName(state: string, lang: LangCode): string {
  return STATE_NAMES[lang]?.[state] ?? state;
}
