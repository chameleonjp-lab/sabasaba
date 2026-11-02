import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RankingList from './RankingList';

describe('unverified participant identity in ranking display', () => {
 it('does not label the same display name as the current person', () => {
  const html = renderToStaticMarkup(<RankingList rows={[{rank: 1, displayName: 'ランキング', bestScore: 123, playCount: 2}]} />);
  expect(html).toContain('ランキング');
  expect(html).not.toContain('あなた');
  expect(html).not.toContain('is-current-player');
 });
 it('escapes names as text and preserves server ranks and scores including ties', () => {
  const html = renderToStaticMarkup(<RankingList rows={[{rank: 1, displayName: '<img src=x onerror=alert(1)>', bestScore: 100, playCount: 1},{rank: 1, displayName:'同点',bestScore:100,playCount:2}]} />);
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img');
  expect((html.match(/<b[^>]*>1<\/b>/g) ?? []).length).toBe(2);
  expect((html.match(/<strong[^>]*>100<\/strong>/g) ?? []).length).toBe(2);
 });
});

it('distinguishes loading, empty and failure before showing any records', () => {
 const loading = renderToStaticMarkup(<RankingList rows={[]} loading />);
 const empty = renderToStaticMarkup(<RankingList rows={[]} />);
 const error = renderToStaticMarkup(<RankingList rows={[]} error="offline" />);
 expect(loading).toContain('data-ranking-state="loading"');
 expect(empty).toContain('data-ranking-state="empty"');
 expect(error).toContain('data-ranking-state="error"');
 expect(error).toContain('offline');
});

it('keeps the previous integer rounding and non-finite fallback for displayed scores', () => {
 const rows = [1.6, -1.6, Number.NaN, Number.POSITIVE_INFINITY].map((bestScore,index) => ({rank:index+1,displayName:String(index),bestScore,playCount:1}));
 const html = renderToStaticMarkup(<RankingList rows={rows} />);
 const numbers = Array.from(html.matchAll(/<strong[^>]*>([^<]*)<\/strong>/g), match => match[1]);
 expect(numbers).toEqual(['2','-2','0','0']);
});
