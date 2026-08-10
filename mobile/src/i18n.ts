/** Interface language. Question text always stays German — the exam is in German —
 *  and the translation of a question is served separately from the dataset. */

export type LangCode = "de" | "en" | "tr" | "ru" | "uk" | "ar" | "fr" | "hi";

export type Language = {
  code: LangCode;
  /** the language's name in itself: someone who cannot read German yet
   *  cannot be asked to find their language written in German */
  native: string;
  /** English name, shown as a secondary hint for non-Latin scripts */
  latin?: string;
  rtl?: boolean;
};

export const LANGUAGES: Language[] = [
  { code: "de", native: "Deutsch" },
  { code: "en", native: "English" },
  { code: "tr", native: "Türkçe", latin: "Turkish" },
  { code: "ru", native: "Русский", latin: "Russian" },
  { code: "uk", native: "Українська", latin: "Ukrainian" },
  { code: "ar", native: "العربية", latin: "Arabic", rtl: true },
  { code: "fr", native: "Français", latin: "French" },
  { code: "hi", native: "हिन्दी", latin: "Hindi" },
];

type Strings = {
  chooseLanguage: string;
  languageNote: string;
  chooseState: string;
  stateNote: string;
  home: string;
  allQuestions: string;
  allQuestionsNote: string;
  practice: string;
  practiceNote: string;
  readiness: string;
  readyYes: string;
  readyNo: string;
  strong: string;
  shaky: string;
  unseen: string;
  basedOn: string;
  accuracy: string;
  showAnswer: string;
  yourScore: string;
  marked: string;
  markedNote: string;
  test: string;
  testNote: string;
  lastTest: string;
  passed: string;
  notPassed: string;
  noTestYet: string;
  passAt: string;
  questionOf: string;
  general: string;
  correct: string;
  wrong: string;
  answerIs: string;
  continue_: string;
  back: string;
  next: string;
  submit: string;
  result: string;
  unverified: string;
  notAnswered: string;
  yourAnswer: string;
  change: string;
  noMarked: string;
  startReview: string;
};

const en: Strings = {
  chooseLanguage: "Language",
  languageNote: "The questions stay in German. You can see a translation at any time.",
  chooseState: "Where will you take the test?",
  stateNote: "The exam includes 3 questions about your federal state.",
  home: "Leben in Deutschland",
  allQuestions: "All questions",
  allQuestionsNote: "Read and prepare",
  practice: "Practice",
  practiceNote: "Answer and check yourself",
  readiness: "Readiness",
  readyYes: "Ready for the exam",
  readyNo: "Keep practising",
  strong: "Strong",
  shaky: "Shaky",
  unseen: "Not seen",
  basedOn: "{n} of {total} answered",
  accuracy: "{p}% correct",
  showAnswer: "Show answer",
  yourScore: "Correct {n} of {total}",
  marked: "Marked questions",
  markedNote: "The ones you flagged",
  test: "Test",
  testNote: "33 questions · 60 minutes",
  lastTest: "Last test",
  passed: "Passed",
  notPassed: "Not passed",
  noTestYet: "No test taken yet",
  passAt: "pass 17",
  questionOf: "Question {n} of {total}",
  general: "General",
  correct: "Correct.",
  wrong: "Wrong",
  answerIs: "the answer is {letter}.",
  continue_: "Continue",
  back: "Back",
  next: "Next",
  submit: "Submit",
  result: "Result",
  unverified: "Unchecked",
  notAnswered: "Not answered",
  yourAnswer: "Your answer",
  change: "Change",
  noMarked: "Nothing marked yet. Tap the star on a question to add it here.",
  startReview: "Start review",
};

const de: Strings = {
  chooseLanguage: "Sprache",
  languageNote: "Die Fragen bleiben auf Deutsch. Die Übersetzung ist jederzeit verfügbar.",
  chooseState: "Wo machst du den Test?",
  stateNote: "Im Test bekommst du 3 Fragen zu deinem Bundesland.",
  home: "Leben in Deutschland",
  allQuestions: "Alle Fragen",
  allQuestionsNote: "Lesen und vorbereiten",
  practice: "Üben",
  practiceNote: "Antworten und selbst prüfen",
  readiness: "Bereitschaft",
  readyYes: "Bereit für die Prüfung",
  readyNo: "Weiter üben",
  strong: "Sicher",
  shaky: "Unsicher",
  unseen: "Noch offen",
  basedOn: "{n} von {total} beantwortet",
  accuracy: "{p}% richtig",
  showAnswer: "Antwort zeigen",
  yourScore: "{n} von {total} richtig",
  marked: "Markierte Fragen",
  markedNote: "Deine markierten Fragen",
  test: "Test",
  testNote: "33 Fragen · 60 Minuten",
  lastTest: "Letzter Test",
  passed: "Bestanden",
  notPassed: "Nicht bestanden",
  noTestYet: "Noch kein Test gemacht",
  passAt: "bestanden ab 17",
  questionOf: "Frage {n} von {total}",
  general: "Allgemein",
  correct: "Richtig.",
  wrong: "Falsch",
  answerIs: "richtig ist {letter}.",
  continue_: "Weiter",
  back: "Zurück",
  next: "Weiter",
  submit: "Abgeben",
  result: "Ergebnis",
  unverified: "Ungeprüft",
  notAnswered: "Nicht beantwortet",
  yourAnswer: "Deine Antwort",
  change: "Ändern",
  noMarked: "Noch nichts markiert. Tippe auf den Stern einer Frage.",
  startReview: "Wiederholen",
};

const tr: Strings = {
  ...en,
  chooseLanguage: "Dil",
  languageNote: "Sorular Almanca kalır. Çeviriyi istediğin zaman görebilirsin.",
  chooseState: "Testi nerede gireceksin?",
  stateNote: "Sınavda eyaletinle ilgili 3 soru var.",
  allQuestions: "Tüm sorular",
  allQuestionsNote: "Oku ve hazırlan",
  practice: "Alıştırma",
  practiceNote: "Cevapla ve kendini sına",
  readiness: "Hazırlık",
  readyYes: "Sınava hazırsın",
  readyNo: "Çalışmaya devam",
  strong: "Sağlam",
  shaky: "Zayıf",
  unseen: "Görülmedi",
  basedOn: "{total} sorudan {n} cevaplandı",
  accuracy: "%{p} doğru",
  showAnswer: "Cevabı göster",
  yourScore: "{total} sorudan {n} doğru",
  marked: "İşaretli sorular",
  markedNote: "İşaretlediklerin",
  test: "Sınav",
  testNote: "33 soru · 60 dakika",
  lastTest: "Son sınav",
  passed: "Geçti",
  notPassed: "Geçmedi",
  noTestYet: "Henüz sınav yok",
  questionOf: "Soru {n} / {total}",
  general: "Genel",
  correct: "Doğru.",
  wrong: "Yanlış",
  answerIs: "doğru cevap {letter}.",
  continue_: "Devam",
  back: "Geri",
  next: "İleri",
  submit: "Bitir",
  result: "Sonuç",
  unverified: "Doğrulanmadı",
  notAnswered: "Cevaplanmadı",
  yourAnswer: "Cevabın",
  change: "Değiştir",
  noMarked: "Henüz işaret yok. Bir sorudaki yıldıza dokun.",
  startReview: "Tekrarla",
};

const ru: Strings = {
  ...en,
  chooseLanguage: "Язык",
  languageNote: "Вопросы остаются на немецком. Перевод доступен в любой момент.",
  chooseState: "Где вы сдаёте тест?",
  stateNote: "В тесте 3 вопроса о вашей федеральной земле.",
  allQuestions: "Все вопросы",
  allQuestionsNote: "Читать и готовиться",
  practice: "Практика",
  practiceNote: "Отвечайте и проверяйте себя",
  readiness: "Готовность",
  readyYes: "Готовы к экзамену",
  readyNo: "Продолжайте практику",
  strong: "Уверенно",
  shaky: "Неуверенно",
  unseen: "Не пройдено",
  basedOn: "Отвечено {n} из {total}",
  accuracy: "{p}% верно",
  showAnswer: "Показать ответ",
  yourScore: "Верно {n} из {total}",
  marked: "Отмеченные вопросы",
  markedNote: "То, что вы отметили",
  test: "Тест",
  testNote: "33 вопроса · 60 минут",
  lastTest: "Последний тест",
  passed: "Сдано",
  notPassed: "Не сдано",
  noTestYet: "Тест ещё не пройден",
  questionOf: "Вопрос {n} из {total}",
  general: "Общие",
  correct: "Верно.",
  wrong: "Неверно",
  answerIs: "правильный ответ {letter}.",
  continue_: "Далее",
  back: "Назад",
  next: "Далее",
  submit: "Завершить",
  result: "Результат",
  unverified: "Не проверено",
  notAnswered: "Нет ответа",
  yourAnswer: "Ваш ответ",
  change: "Изменить",
  noMarked: "Пока ничего не отмечено. Нажмите на звёздочку у вопроса.",
  startReview: "Повторить",
};

const uk: Strings = {
  ...ru,
  chooseLanguage: "Мова",
  languageNote: "Питання залишаються німецькою. Переклад доступний будь-коли.",
  chooseState: "Де ви складаєте тест?",
  stateNote: "У тесті 3 питання про вашу федеральну землю.",
  allQuestions: "Усі питання",
  allQuestionsNote: "Читати і готуватися",
  practice: "Практика",
  practiceNote: "Відповідайте та перевіряйте себе",
  readiness: "Готовність",
  readyYes: "Готові до іспиту",
  readyNo: "Продовжуйте практику",
  strong: "Впевнено",
  shaky: "Невпевнено",
  unseen: "Не пройдено",
  basedOn: "Відповіли на {n} з {total}",
  accuracy: "{p}% правильно",
  showAnswer: "Показати відповідь",
  yourScore: "Правильно {n} з {total}",
  marked: "Позначені питання",
  markedNote: "Те, що ви позначили",
  test: "Тест",
  testNote: "33 питання · 60 хвилин",
  lastTest: "Останній тест",
  passed: "Складено",
  notPassed: "Не складено",
  noTestYet: "Тест ще не пройдено",
  questionOf: "Питання {n} з {total}",
  general: "Загальні",
  correct: "Правильно.",
  wrong: "Неправильно",
  answerIs: "правильна відповідь {letter}.",
  continue_: "Далі",
  back: "Назад",
  next: "Далі",
  submit: "Завершити",
  result: "Результат",
  unverified: "Не перевірено",
  notAnswered: "Немає відповіді",
  yourAnswer: "Ваша відповідь",
  change: "Змінити",
  noMarked: "Поки нічого не позначено. Торкніться зірочки біля питання.",
  startReview: "Повторити",
};

const ar: Strings = {
  ...en,
  chooseLanguage: "اللغة",
  languageNote: "تبقى الأسئلة بالألمانية. يمكنك رؤية الترجمة في أي وقت.",
  chooseState: "أين ستؤدي الاختبار؟",
  stateNote: "يتضمن الاختبار ٣ أسئلة عن ولايتك.",
  allQuestions: "كل الأسئلة",
  allQuestionsNote: "اقرأ واستعد",
  practice: "تدريب",
  practiceNote: "أجب وتحقق بنفسك",
  readiness: "الجاهزية",
  readyYes: "جاهز للاختبار",
  readyNo: "واصل التدريب",
  strong: "قوي",
  shaky: "ضعيف",
  unseen: "لم يُقرأ",
  basedOn: "تمت الإجابة على {n} من {total}",
  accuracy: "{p}% صحيحة",
  showAnswer: "أظهر الإجابة",
  yourScore: "{n} صحيحة من {total}",
  marked: "الأسئلة المُعلَّمة",
  markedNote: "ما قمت بتعليمه",
  test: "الاختبار",
  testNote: "٣٣ سؤالاً · ٦٠ دقيقة",
  lastTest: "آخر اختبار",
  passed: "ناجح",
  notPassed: "غير ناجح",
  noTestYet: "لم تؤدِّ اختباراً بعد",
  questionOf: "السؤال {n} من {total}",
  general: "عام",
  correct: "صحيح.",
  wrong: "خطأ",
  answerIs: "الإجابة الصحيحة {letter}.",
  continue_: "متابعة",
  back: "رجوع",
  next: "التالي",
  submit: "إنهاء",
  result: "النتيجة",
  unverified: "غير مُتحقَّق",
  notAnswered: "بدون إجابة",
  yourAnswer: "إجابتك",
  change: "تغيير",
  noMarked: "لا يوجد شيء مُعلَّم بعد. اضغط على النجمة بجانب السؤال.",
  startReview: "المراجعة",
};

const fr: Strings = {
  ...en,
  chooseLanguage: "Langue",
  languageNote: "Les questions restent en allemand. La traduction est disponible à tout moment.",
  chooseState: "Où passez-vous le test ?",
  stateNote: "Le test comprend 3 questions sur votre Land.",
  allQuestions: "Toutes les questions",
  allQuestionsNote: "Lire et se préparer",
  practice: "Entraînement",
  practiceNote: "Répondez et vérifiez",
  readiness: "Préparation",
  readyYes: "Prêt pour l'examen",
  readyNo: "Continuez à réviser",
  strong: "Solide",
  shaky: "Fragile",
  unseen: "Non vues",
  basedOn: "{n} sur {total} répondues",
  accuracy: "{p}% correctes",
  showAnswer: "Voir la réponse",
  yourScore: "{n} sur {total} correctes",
  marked: "Questions marquées",
  markedNote: "Celles que vous avez marquées",
  test: "Test",
  testNote: "33 questions · 60 minutes",
  lastTest: "Dernier test",
  passed: "Réussi",
  notPassed: "Échoué",
  noTestYet: "Aucun test effectué",
  questionOf: "Question {n} sur {total}",
  general: "Général",
  correct: "Correct.",
  wrong: "Faux",
  answerIs: "la bonne réponse est {letter}.",
  continue_: "Continuer",
  back: "Retour",
  next: "Suivant",
  submit: "Terminer",
  result: "Résultat",
  unverified: "Non vérifié",
  notAnswered: "Sans réponse",
  yourAnswer: "Votre réponse",
  change: "Modifier",
  noMarked: "Rien de marqué. Touchez l'étoile d'une question.",
  startReview: "Réviser",
};

const hi: Strings = {
  ...en,
  chooseLanguage: "भाषा",
  languageNote: "प्रश्न जर्मन में ही रहेंगे। अनुवाद कभी भी देख सकते हैं।",
  chooseState: "आप टेस्ट कहाँ देंगे?",
  stateNote: "टेस्ट में आपके राज्य से 3 प्रश्न आते हैं।",
  allQuestions: "सभी प्रश्न",
  allQuestionsNote: "पढ़ें और तैयारी करें",
  practice: "अभ्यास",
  practiceNote: "उत्तर दें और जाँचें",
  readiness: "तैयारी",
  readyYes: "परीक्षा के लिए तैयार",
  readyNo: "अभ्यास जारी रखें",
  strong: "मजबूत",
  shaky: "कमजोर",
  unseen: "नहीं देखा",
  basedOn: "{total} में से {n} के उत्तर दिए",
  accuracy: "{p}% सही",
  showAnswer: "उत्तर दिखाएँ",
  yourScore: "{total} में से {n} सही",
  marked: "चिह्नित प्रश्न",
  markedNote: "जो आपने चिह्नित किए",
  test: "टेस्ट",
  testNote: "33 प्रश्न · 60 मिनट",
  lastTest: "पिछला टेस्ट",
  passed: "उत्तीर्ण",
  notPassed: "अनुत्तीर्ण",
  noTestYet: "अभी कोई टेस्ट नहीं",
  questionOf: "प्रश्न {n} / {total}",
  general: "सामान्य",
  correct: "सही।",
  wrong: "गलत",
  answerIs: "सही उत्तर {letter} है।",
  continue_: "आगे",
  back: "पीछे",
  next: "आगे",
  submit: "जमा करें",
  result: "परिणाम",
  unverified: "अपुष्ट",
  notAnswered: "उत्तर नहीं दिया",
  yourAnswer: "आपका उत्तर",
  change: "बदलें",
  noMarked: "अभी कुछ चिह्नित नहीं। किसी प्रश्न के तारे पर टैप करें।",
  startReview: "दोहराएँ",
};

const TABLE: Record<LangCode, Strings> = { de, en, tr, ru, uk, ar, fr, hi };

export function strings(code: LangCode): Strings {
  return TABLE[code] ?? en;
}

export function isRTL(code: LangCode): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}

/** Fill {placeholders}. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}
