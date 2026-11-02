import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GameCanvas from '../components/GameCanvas';
import { setLanguage } from './runtime';
import type { Language } from './language';

afterEach(() => vi.unstubAllGlobals());
function renderHome(saved = 'ja', search = '') {
 const storage = {getItem: (key: string) => key === 'sabasaba-language-v1' ? saved : key === 'sabasaba-player-name-v2' ? 'ランキング' : null, setItem: vi.fn()};
 vi.stubGlobal('window', {location: {search}, innerWidth: 393, innerHeight: 852, localStorage: storage});
 vi.stubGlobal('localStorage', storage);
 vi.stubGlobal('navigator', {languages: ['en-US'], maxTouchPoints: 1});
 setLanguage(saved as Language);
 return renderToStaticMarkup(<GameCanvas />);
}
describe('home language selector', () => {
 it('offers language on the home without replacing the saved player name', () => {
  const html = renderHome();
  expect(html).toContain('data-testid="language-select"');
  expect(html).toContain('value="ランキング"');
  expect(html).toContain('Xでシェア');
  expect(html).toContain('sabasaba_normal');
 });
});

it('uses the selected Endless mode for the home ranking link before a run exists', () => {
 const html = renderHome('ja', '?mode=endless');
 expect(html).toContain('ranking.html?game=sabasaba_endless');
 expect(html).not.toContain('ranking.html?game=sabasaba_normal');
});

it('renders English buttons while a Japanese-looking player name remains verbatim', () => {
 const html = renderHome('en');
 expect(html).toContain('Share on X');
 expect(html).toContain('Leaderboard');
 expect(html).toContain('value="ランキング"');
 expect(html).not.toContain('>Xでシェア<');
});

// Offered languages must render their own dictionary, not silently share English labels.
import { LANGUAGES } from './language';
import { SOURCE_MESSAGES } from './source';
import { dictionaries } from './dictionaries';
const shareKey = Object.keys(SOURCE_MESSAGES).find(key => SOURCE_MESSAGES[key] === 'Xでシェア')!;
for (const {id} of LANGUAGES) {
 it(`renders the ${id} home share label and preserves the player name`, () => {
  const expected = dictionaries[id]?.[shareKey];
  expect(expected).toBeTypeOf('string');
  const html = renderHome(id);
  expect(html).toContain(renderToStaticMarkup(<>{expected}</>));
  expect(html).toContain('value="ランキング"');
  expect(html).toContain('data-testid="home-experiment-lab"');
 });
}
