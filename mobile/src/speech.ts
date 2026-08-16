import * as Speech from "expo-speech";
import type { LangCode } from "./i18n";

/** BCP-47 locale used to pick a system TTS voice for each interface
 *  language. The OS may not have every voice installed, in which case it
 *  falls back to its own default rather than staying silent. bs uses a
 *  Latin-script Balkan locale as a reasonable stand-in for the combined
 *  Bosnian/Croatian/Serbian entry. */
const LOCALE: Record<LangCode, string> = {
  de: "de-DE",
  en: "en-US",
  tr: "tr-TR",
  ru: "ru-RU",
  uk: "uk-UA",
  ar: "ar-SA",
  fr: "fr-FR",
  hi: "hi-IN",
  pl: "pl-PL",
  ro: "ro-RO",
  fa: "fa-IR",
  ur: "ur-PK",
  sq: "sq-AL",
  bs: "bs-BA",
  bg: "bg-BG",
  it: "it-IT",
  zh: "zh-CN",
  el: "el-GR",
};

export type Segment = { text: string; lang: LangCode };

/** Speaks a sequence of segments back to back, each in its own locale, so a
 *  German line and a translated line underneath it are read in voices that
 *  actually match their language. Calls onDone once every segment has
 *  played to completion (not if stopped early). Returns a stop() function. */
export function speakSegments(segments: Segment[], onDone: () => void): () => void {
  let cancelled = false;

  function next(i: number) {
    if (cancelled) return;
    if (i >= segments.length) {
      onDone();
      return;
    }
    Speech.speak(segments[i].text, {
      language: LOCALE[segments[i].lang],
      // a voice missing for one language shouldn't silence the rest
      onDone: () => next(i + 1),
      onError: () => next(i + 1),
    });
  }

  next(0);

  return () => {
    cancelled = true;
    Speech.stop();
  };
}
