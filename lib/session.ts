export const languageOptions = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" }
] as const;

export type PreferredLanguage = (typeof languageOptions)[number]["code"];

export type UserProfile = {
  name: string;
  language: PreferredLanguage;
};

type WelcomeCopy = {
  greeting: string;
  message: string;
};

const storageKey = "guardrail:user-profile";
export const sessionChangedEvent = "guardrail:session-changed";

const welcomeCopy: Record<PreferredLanguage, WelcomeCopy> = {
  en: { greeting: "Welcome", message: "I am ready to help you review this change." },
  hi: { greeting: "Namaste", message: "Main aapke code change ka review karne ke liye taiyar hoon." },
  ta: { greeting: "Vanakkam", message: "Ungal code maatrathai mathippida naan thayaaraga irukkiren." },
  te: { greeting: "Namaskaram", message: "Mee code marpunu sameekshinchadaniki nenu siddhanga unnanu." },
  bn: { greeting: "Nomoshkar", message: "Ami apnar code poriborton review korte prostut." },
  mr: { greeting: "Namaskar", message: "Mi tumchya code badalache review karnyasathi tayar ahe." },
  es: { greeting: "Bienvenido", message: "Estoy listo para ayudarte a revisar este cambio." },
  fr: { greeting: "Bienvenue", message: "Je suis pret a vous aider a examiner cette modification." },
  de: { greeting: "Willkommen", message: "Ich bin bereit, Ihnen bei der Prufung dieser Anderung zu helfen." },
  pt: { greeting: "Bem-vindo", message: "Estou pronto para ajudar a revisar esta alteracao." },
  ja: { greeting: "Yokoso", message: "Kono code henko no review o otesudai shimasu." },
  ko: { greeting: "Hwan-yeonghamnida", message: "I code byeongyeong-eul geomtohal junbi-ga doeeotseumnida." },
  zh: { greeting: "Huan ying", message: "Wo yi jing zhunbei hao bang nin shen cha ci dai ma geng gai." },
  ar: { greeting: "Ahlan wa sahlan", message: "Ana mustaidd limusaadatik fi murajaat hadha altaghyir." }
};

export function isPreferredLanguage(value: string): value is PreferredLanguage {
  return languageOptions.some((language) => language.code === value);
}

function notifySessionChange() {
  window.dispatchEvent(new Event(sessionChangedEvent));
}

export function browserLanguage(): PreferredLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const candidate = navigator.language.toLowerCase().split("-")[0];
  return isPreferredLanguage(candidate) ? candidate : "en";
}

export function readUserProfile(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<UserProfile>;
    if (typeof parsed.name !== "string" || !parsed.name.trim() || typeof parsed.language !== "string" || !isPreferredLanguage(parsed.language)) {
      return null;
    }

    return { name: parsed.name.trim(), language: parsed.language };
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile) {
  localStorage.setItem(storageKey, JSON.stringify(profile));
  notifySessionChange();
}

export function clearUserProfile() {
  localStorage.removeItem(storageKey);
  notifySessionChange();
}

export function getWelcomeCopy(language: PreferredLanguage): WelcomeCopy {
  return welcomeCopy[language];
}
