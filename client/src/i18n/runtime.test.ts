import { afterEach, expect, it, vi } from 'vitest';
import { getLanguage, setLanguage } from './runtime';

afterEach(() => vi.unstubAllGlobals());
it('updates only the language preference and never submits a result or touches game records', () => {
 const saved = new Map([['sabasaba-player-name-v2','名前'],['sabasaba-best-score-v2','{"normal":123}'],['neon-siege-player-audio-v1','off'],['sabasaba.audio-volume.v1','0']]);
 const before = new Map(saved);
 const storage = {getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key,value)};
 const fetch = vi.fn();
 vi.stubGlobal('window',{localStorage: storage});
 vi.stubGlobal('document',{documentElement:{lang:'ja'}});
 vi.stubGlobal('fetch',fetch);
 setLanguage('de');
 expect(getLanguage()).toBe('de');
 expect(saved.get('sabasaba-language-v1')).toBe('de');
 for(const [key,value] of before) expect(saved.get(key)).toBe(value);
 expect(fetch).not.toHaveBeenCalled();
 expect(document.documentElement.lang).toBe('de');
});
