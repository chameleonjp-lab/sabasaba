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
const browserLanguage = (value: unknown): Language | null => {
  if (typeof value !== 'string') return null;
  const parts = value.trim().toLowerCase().replaceAll('_', '-').split('-');
  const base = parts[0];
  if (base === 'zh') {
    const extension = parts.findIndex((part, index) => index > 0 && part.length === 1);
    const core = extension < 0 ? parts : parts.slice(0, extension);
    const script = core.find(part => part === 'hans' || part === 'hant');
    if (script) return script === 'hant' ? 'zh-Hant' : 'zh-Hans';
    return core.some(part => ['tw', 'hk', 'mo'].includes(part)) ? 'zh-Hant' : 'zh-Hans';
  }
  if (base === 'pt') return 'pt-BR';
  return supported(base) ? base : null;
};
export const resolveLanguage = (saved: string | null, browser: readonly (string | undefined)[]): Language => {
  if (supported(saved)) return saved;
  const preferences = browser.filter(candidate => typeof candidate === 'string' && candidate.trim());
  for (const candidate of preferences) {
    const language = browserLanguage(candidate);
    if (language) return language;
  }
  return preferences.length ? 'en' : 'ja';
};
export const readLanguage = (storage: Pick<Storage, 'getItem'>, browser: readonly (string | undefined)[]): Language => {
  let saved: string | null = null;
  try { saved = storage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* Private browsing uses memory. */ }
  return resolveLanguage(saved, browser);
};
export const saveLanguage = (storage: Pick<Storage, 'setItem'>, language: Language): void => {
  try { storage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Keep the current in-memory selection. */ }
};
export const localeForLanguage = (language: Language) => LANGUAGES.find(item => item.id === language)!.locale;
