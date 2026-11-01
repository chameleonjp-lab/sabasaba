import { useEffect, useSyncExternalStore } from 'react';
import { LANGUAGES, localeForLanguage, readLanguage, saveLanguage, type Language } from './language';
export { LANGUAGES };
let current: Language | null = null;
const listeners = new Set<() => void>();
export function getLanguage(): Language {
  if (current) return current;
  const browser = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language];
  try { current = readLanguage(window.localStorage, browser); }
  catch { current = readLanguage({getItem: () => null}, browser); }
  return current;
}
export function setLanguage(language: Language) {
  if (!LANGUAGES.some(item => item.id === language)) return;
  current = language;
  try { saveLanguage(window.localStorage, language); } catch { /* Memory-only mode. */ }
  if (typeof document !== 'undefined') document.documentElement.lang = language;
  listeners.forEach(listener => listener());
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const useLanguage = () => {
  const language = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return language;
};
export const getLocale = () => localeForLanguage(getLanguage());

import { SOURCE_MESSAGES } from './source';
import { dictionaries } from './dictionaries';
export { dictionaries } from './dictionaries';
import { createTranslator } from './translate';
// Translation bundles are integrated only after key/placeholder verification.
const translators = new Map<Language, ReturnType<typeof createTranslator>>();
export function t(message: string): string {
  const language = getLanguage();
  if (language === 'ja') return message;
  let translate = translators.get(language);
  if (!translate) {
    translate = createTranslator(SOURCE_MESSAGES, dictionaries[language] ?? dictionaries.en ?? {});
    translators.set(language, translate);
  }
  return translate(message);
}
