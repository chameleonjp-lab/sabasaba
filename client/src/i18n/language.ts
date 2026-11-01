/** IDs match Sainome 79b1e573; locales are presentation-only, never game IDs. */
export const LANGUAGES = [
  { id: 'ja', label: '日本語', locale: 'ja-JP' },
  { id: 'en', label: 'English', locale: 'en-US' },
  { id: 'es', label: 'Español', locale: 'es-ES' },
  { id: 'pt-BR', label: 'Português (Brasil)', locale: 'pt-BR' },
  { id: 'zh-Hans', label: '简体中文', locale: 'zh-CN' },
  { id: 'fr', label: 'Français', locale: 'fr-FR' },
  { id: 'de', label: 'Deutsch', locale: 'de-DE' },
  { id: 'ko', label: '한국어', locale: 'ko-KR' },
  { id: 'ru', label: 'Русский', locale: 'ru-RU' },
  { id: 'it', label: 'Italiano', locale: 'it-IT' },
  { id: 'zh-Hant', label: '繁體中文', locale: 'zh-TW' },
  { id: 'id', label: 'Bahasa Indonesia', locale: 'id-ID' },
  { id: 'tr', label: 'Türkçe', locale: 'tr-TR' },
  { id: 'vi', label: 'Tiếng Việt', locale: 'vi-VN' },
  { id: 'th', label: 'ไทย', locale: 'th-TH' },
] as const;
export type Language = typeof LANGUAGES[number]['id'];
export const LANGUAGE_STORAGE_KEY = 'sabasaba-language-v1';
const supported = (value: string | null): value is Language => LANGUAGES.some(item => item.id === value);
const browserLanguage = (value: string): Language | null => {
  const lower = value.toLowerCase().replaceAll('_', '-');
  if (lower.startsWith('zh')) return /hant|tw|hk|mo/.test(lower) ? 'zh-Hant' : 'zh-Hans';
  if (lower === 'pt' || lower.startsWith('pt-')) return 'pt-BR';
  const base = lower.split('-')[0];
  return supported(base) ? base : null;
};
export const resolveLanguage = (saved: string | null, browser: readonly string[]): Language => {
  if (supported(saved)) return saved;
  for (const candidate of browser) {
    const language = browserLanguage(candidate);
    if (language) return language;
  }
  return 'en';
};
export const readLanguage = (storage: Pick<Storage, 'getItem'>, browser: readonly string[]): Language => {
  let saved: string | null = null;
  try { saved = storage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* Private browsing uses memory. */ }
  return resolveLanguage(saved, browser);
};
export const saveLanguage = (storage: Pick<Storage, 'setItem'>, language: Language): void => {
  try { storage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Keep the current in-memory selection. */ }
};
export const localeForLanguage = (language: Language) => LANGUAGES.find(item => item.id === language)!.locale;
