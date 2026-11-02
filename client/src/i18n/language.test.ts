import { describe, expect, it } from 'vitest';
import { resolveLanguage, readLanguage, saveLanguage, LANGUAGE_STORAGE_KEY, LANGUAGES } from './language';

describe('saved language and browser language resolution', () => {
  it('keeps the 15 Sainome language IDs distinct from locales', () => {
    expect(LANGUAGES.map(item => item.id)).toEqual(['ja','en','es','pt-BR','zh-Hans','fr','de','ko','ru','it','zh-Hant','id','tr','vi','th']);
  });
  it('prefers saved choice and normalizes supported browser regions', () => {
    expect(resolveLanguage('ja', ['en-US'])).toBe('ja');
    expect(resolveLanguage(null, ['pt-PT'])).toBe('pt-BR');
    expect(resolveLanguage(null, ['zh-TW'])).toBe('zh-Hant');
    expect(resolveLanguage(null, ['zh-CN'])).toBe('zh-Hans');
    expect(resolveLanguage(null, ['zh-Hant-HK'])).toBe('zh-Hant');
    expect(resolveLanguage(null, ['xx', 'fr-CA'])).toBe('fr');
    expect(resolveLanguage('invalid', ['xx'])).toBe('en');
  });
  it('tolerates disabled storage without changing name, score or sound keys', () => {
    const writes: string[] = [];
    const storage = {getItem: () => { throw Error('blocked'); }, setItem: (key: string) => { writes.push(key); throw Error('blocked'); }};
    expect(readLanguage(storage, ['ja-JP'])).toBe('ja');
    expect(() => saveLanguage(storage, 'en')).not.toThrow();
    expect(writes).toEqual([LANGUAGE_STORAGE_KEY]);
  });
});
