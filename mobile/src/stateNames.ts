import type { LangCode } from "./i18n";

type StateId =
  | "Baden-Württemberg"
  | "Bayern"
  | "Berlin"
  | "Brandenburg"
  | "Bremen"
  | "Hamburg"
  | "Hessen"
  | "Mecklenburg-Vorpommern"
  | "Niedersachsen"
  | "Nordrhein-Westfalen"
  | "Rheinland-Pfalz"
  | "Saarland"
  | "Sachsen"
  | "Sachsen-Anhalt"
  | "Schleswig-Holstein"
  | "Thüringen";

/**
 * State IDs stay in German because they key questions, progress, and storage.
 * Only the user-facing label is localized.
 */
const STATE_NAMES: Record<Exclude<LangCode, "de">, Record<StateId, string>> = {
  en: {
    "Baden-Württemberg": "Baden-Württemberg", Bayern: "Bavaria", Berlin: "Berlin", Brandenburg: "Brandenburg",
    Bremen: "Bremen", Hamburg: "Hamburg", Hessen: "Hesse", "Mecklenburg-Vorpommern": "Mecklenburg-Vorpommern",
    Niedersachsen: "Lower Saxony", "Nordrhein-Westfalen": "North Rhine-Westphalia", "Rheinland-Pfalz": "Rhineland-Palatinate",
    Saarland: "Saarland", Sachsen: "Saxony", "Sachsen-Anhalt": "Saxony-Anhalt", "Schleswig-Holstein": "Schleswig-Holstein", Thüringen: "Thuringia",
  },
  tr: {
    "Baden-Württemberg": "Baden-Württemberg", Bayern: "Bavyera", Berlin: "Berlin", Brandenburg: "Brandenburg",
    Bremen: "Bremen", Hamburg: "Hamburg", Hessen: "Hessen", "Mecklenburg-Vorpommern": "Mecklenburg-Vorpommern",
    Niedersachsen: "Aşağı Saksonya", "Nordrhein-Westfalen": "Kuzey Ren-Vestfalya", "Rheinland-Pfalz": "Ren-Pfalz",
    Saarland: "Saarland", Sachsen: "Saksonya", "Sachsen-Anhalt": "Saksonya-Anhalt", "Schleswig-Holstein": "Schleswig-Holstein", Thüringen: "Türingiya",
  },
  ru: {
    "Baden-Württemberg": "Баден-Вюртемберг", Bayern: "Бавария", Berlin: "Берлин", Brandenburg: "Бранденбург",
    Bremen: "Бремен", Hamburg: "Гамбург", Hessen: "Гессен", "Mecklenburg-Vorpommern": "Мекленбург-Передняя Померания",
    Niedersachsen: "Нижняя Саксония", "Nordrhein-Westfalen": "Северный Рейн-Вестфалия", "Rheinland-Pfalz": "Рейнланд-Пфальц",
    Saarland: "Саар", Sachsen: "Саксония", "Sachsen-Anhalt": "Саксония-Анхальт", "Schleswig-Holstein": "Шлезвиг-Гольштейн", Thüringen: "Тюрингия",
  },
  uk: {
    "Baden-Württemberg": "Баден-Вюртемберг", Bayern: "Баварія", Berlin: "Берлін", Brandenburg: "Бранденбург",
    Bremen: "Бремен", Hamburg: "Гамбург", Hessen: "Гессен", "Mecklenburg-Vorpommern": "Мекленбург-Передня Померанія",
    Niedersachsen: "Нижня Саксонія", "Nordrhein-Westfalen": "Північний Рейн-Вестфалія", "Rheinland-Pfalz": "Рейнланд-Пфальц",
    Saarland: "Саарланд", Sachsen: "Саксонія", "Sachsen-Anhalt": "Саксонія-Ангальт", "Schleswig-Holstein": "Шлезвіг-Гольштейн", Thüringen: "Тюрингія",
  },
  ar: {
    "Baden-Württemberg": "بادن-فورتمبيرغ", Bayern: "بافاريا", Berlin: "برلين", Brandenburg: "براندنبورغ",
    Bremen: "بريمن", Hamburg: "هامبورغ", Hessen: "هسن", "Mecklenburg-Vorpommern": "مكلنبورغ فوربومرن",
    Niedersachsen: "سكسونيا السفلى", "Nordrhein-Westfalen": "شمال الراين-وستفاليا", "Rheinland-Pfalz": "راينلند بالاتينات",
    Saarland: "سارلاند", Sachsen: "سكسونيا", "Sachsen-Anhalt": "سكسونيا أنهالت", "Schleswig-Holstein": "شلسفيغ هولشتاين", Thüringen: "تورينغن",
  },
  fr: {
    "Baden-Württemberg": "Bade-Wurtemberg", Bayern: "Bavière", Berlin: "Berlin", Brandenburg: "Brandebourg",
    Bremen: "Brême", Hamburg: "Hambourg", Hessen: "Hesse", "Mecklenburg-Vorpommern": "Mecklembourg-Poméranie-Occidentale",
    Niedersachsen: "Basse-Saxe", "Nordrhein-Westfalen": "Rhénanie-du-Nord-Westphalie", "Rheinland-Pfalz": "Rhénanie-Palatinat",
    Saarland: "Sarre", Sachsen: "Saxe", "Sachsen-Anhalt": "Saxe-Anhalt", "Schleswig-Holstein": "Schleswig-Holstein", Thüringen: "Thuringe",
  },
  hi: {
    "Baden-Württemberg": "बाडेन-व्युर्टेमबर्ग", Bayern: "बायर्न", Berlin: "बर्लिन", Brandenburg: "ब्रान्डेनबुर्ग",
    Bremen: "ब्रेमन", Hamburg: "हैम्बुर्ग", Hessen: "हेसेन", "Mecklenburg-Vorpommern": "मेक्लेनबुर्ग-फ़ोरपोमर्न",
    Niedersachsen: "निडरज़ाक्सन", "Nordrhein-Westfalen": "नॉर्डराइन-वेस्टफ़ालेन", "Rheinland-Pfalz": "राइनलांड-फ़ाल्त्स",
    Saarland: "ज़ारलांड", Sachsen: "ज़ाक्सन", "Sachsen-Anhalt": "ज़ाक्सन-आनहाल्ट", "Schleswig-Holstein": "श्लेस्विश-होल्श्टाइन", Thüringen: "थ्युरिंगन",
  },
  pl: {
    "Baden-Württemberg": "Badenia-Wirtembergia", Bayern: "Bawaria", Berlin: "Berlin", Brandenburg: "Brandenburgia",
    Bremen: "Brema", Hamburg: "Hamburg", Hessen: "Hesja", "Mecklenburg-Vorpommern": "Meklemburgia-Pomorze Przednie",
    Niedersachsen: "Dolna Saksonia", "Nordrhein-Westfalen": "Nadrenia Północna-Westfalia", "Rheinland-Pfalz": "Nadrenia-Palatynat",
    Saarland: "Saara", Sachsen: "Saksonia", "Sachsen-Anhalt": "Saksonia-Anhalt", "Schleswig-Holstein": "Szlezwik-Holsztyn", Thüringen: "Turyngia",
  },
  ro: {
    "Baden-Württemberg": "Baden-Württemberg", Bayern: "Bavaria", Berlin: "Berlin", Brandenburg: "Brandenburg",
    Bremen: "Bremen", Hamburg: "Hamburg", Hessen: "Hessa", "Mecklenburg-Vorpommern": "Mecklenburg-Pomerania Anterioară",
    Niedersachsen: "Saxonia Inferioară", "Nordrhein-Westfalen": "Renania de Nord-Westfalia", "Rheinland-Pfalz": "Renania-Palatinat",
    Saarland: "Saarland", Sachsen: "Saxonia", "Sachsen-Anhalt": "Saxonia-Anhalt", "Schleswig-Holstein": "Schleswig-Holstein", Thüringen: "Turingia",
  },
  fa: {
    "Baden-Württemberg": "بادن-وورتمبرگ", Bayern: "بایرن", Berlin: "برلین", Brandenburg: "براندنبورگ",
    Bremen: "برمن", Hamburg: "هامبورگ", Hessen: "هسن", "Mecklenburg-Vorpommern": "مکلنبورگ-فورپومرن",
    Niedersachsen: "نیدرزاکسن", "Nordrhein-Westfalen": "نوردراین-وستفالن", "Rheinland-Pfalz": "راینلاند-فالتس",
    Saarland: "زارلند", Sachsen: "زاکسن", "Sachsen-Anhalt": "زاکسن-آنهالت", "Schleswig-Holstein": "اشلسویگ-هولشتاین", Thüringen: "تورینگن",
  },
  ur: {
    "Baden-Württemberg": "بادن-وورتمبرگ", Bayern: "بواریا", Berlin: "برلن", Brandenburg: "برندنبرگ",
    Bremen: "بریمین", Hamburg: "ہامبرگ", Hessen: "ہیسے", "Mecklenburg-Vorpommern": "مکلنبرگ-ورپورمرن",
    Niedersachsen: "نیدرزاکسن", "Nordrhein-Westfalen": "نوردرائن-ویسٹ فالیا", "Rheinland-Pfalz": "رائن لینڈ-پلاتینیت",
    Saarland: "سارلنڈ", Sachsen: "زاکسن", "Sachsen-Anhalt": "زاکسن-آنہالت", "Schleswig-Holstein": "شلسویگ-ہولشتائن", Thüringen: "تورینگن",
  },
  sq: {
    "Baden-Württemberg": "Baden-Vyrtemberg", Bayern: "Bavaria", Berlin: "Berlin", Brandenburg: "Brandenburg",
    Bremen: "Bremen", Hamburg: "Hamburg", Hessen: "Heseni", "Mecklenburg-Vorpommern": "Mecklenburg-Pomerania e Përparme",
    Niedersachsen: "Saksonia e Ulët", "Nordrhein-Westfalen": "Ren-Vestfalia e Veriut", "Rheinland-Pfalz": "Rinland-Pfalc",
    Saarland: "Zarland", Sachsen: "Saksonia", "Sachsen-Anhalt": "Saksonia-Anhalt", "Schleswig-Holstein": "Shlezvig-Holshtajn", Thüringen: "Tyringjia",
  },
  bs: {
    "Baden-Württemberg": "Baden-Württemberg", Bayern: "Bavarska", Berlin: "Berlin", Brandenburg: "Brandenburg",
    Bremen: "Bremen", Hamburg: "Hamburg", Hessen: "Hessen", "Mecklenburg-Vorpommern": "Mecklenburg-Zapadno Pomorje",
    Niedersachsen: "Donja Saska", "Nordrhein-Westfalen": "Sjeverna Rajna-Vestfalija", "Rheinland-Pfalz": "Porajnje-Falačka",
    Saarland: "Sarska", Sachsen: "Saksonija", "Sachsen-Anhalt": "Saksonija-Anhalt", "Schleswig-Holstein": "Šlezvig-Holštajn", Thüringen: "Tiringija",
  },
  bg: {
    "Baden-Württemberg": "Баден-Вюртемберг", Bayern: "Бавария", Berlin: "Берлин", Brandenburg: "Бранденбург",
    Bremen: "Бремен", Hamburg: "Хамбург", Hessen: "Хесен", "Mecklenburg-Vorpommern": "Мекленбург-Предна Померания",
    Niedersachsen: "Долна Саксония", "Nordrhein-Westfalen": "Северен Рейн-Вестфалия", "Rheinland-Pfalz": "Рейнланд-Пфалц",
    Saarland: "Саарланд", Sachsen: "Саксония", "Sachsen-Anhalt": "Саксония-Анхалт", "Schleswig-Holstein": "Шлезвиг-Холщайн", Thüringen: "Тюрингия",
  },
  it: {
    "Baden-Württemberg": "Baden-Württemberg", Bayern: "Baviera", Berlin: "Berlino", Brandenburg: "Brandeburgo",
    Bremen: "Brema", Hamburg: "Amburgo", Hessen: "Assia", "Mecklenburg-Vorpommern": "Meclemburgo-Pomerania Anteriore",
    Niedersachsen: "Bassa Sassonia", "Nordrhein-Westfalen": "Renania Settentrionale-Vestfalia", "Rheinland-Pfalz": "Renania-Palatinato",
    Saarland: "Saarland", Sachsen: "Sassonia", "Sachsen-Anhalt": "Sassonia-Anhalt", "Schleswig-Holstein": "Schleswig-Holstein", Thüringen: "Turingia",
  },
  zh: {
    "Baden-Württemberg": "巴登-符腾堡州", Bayern: "巴伐利亚州", Berlin: "柏林州", Brandenburg: "勃兰登堡州",
    Bremen: "不来梅州", Hamburg: "汉堡州", Hessen: "黑森州", "Mecklenburg-Vorpommern": "梅克伦堡-前波美拉尼亚州",
    Niedersachsen: "下萨克森州", "Nordrhein-Westfalen": "北莱茵-威斯特法伦州", "Rheinland-Pfalz": "莱茵兰-普法尔茨州",
    Saarland: "萨尔州", Sachsen: "萨克森州", "Sachsen-Anhalt": "萨克森-安哈尔特州", "Schleswig-Holstein": "石勒苏益格-荷尔斯泰因州", Thüringen: "图林根州",
  },
  el: {
    "Baden-Württemberg": "Βάδη-Βυρτεμβέργη", Bayern: "Βαυαρία", Berlin: "Βερολίνο", Brandenburg: "Βρανδεμβούργο",
    Bremen: "Βρέμη", Hamburg: "Αμβούργο", Hessen: "Έσση", "Mecklenburg-Vorpommern": "Μεκλεμβούργο-Δυτική Πομερανία",
    Niedersachsen: "Κάτω Σαξονία", "Nordrhein-Westfalen": "Βόρεια Ρηνανία-Βεστφαλία", "Rheinland-Pfalz": "Ρηνανία-Παλατινάτο",
    Saarland: "Σάαρλαντ", Sachsen: "Σαξονία", "Sachsen-Anhalt": "Σαξονία-Άνχαλτ", "Schleswig-Holstein": "Σλέσβιχ-Χόλσταϊν", Thüringen: "Θουριγγία",
  },
};

export function stateName(state: string, lang: LangCode): string {
  if (lang === "de") return state;
  return state in STATE_NAMES[lang] ? STATE_NAMES[lang][state as StateId] : state;
}
