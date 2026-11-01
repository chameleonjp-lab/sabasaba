import { describe, expect, it } from 'vitest';
import { createTranslator } from './translate';

describe('display-only dictionary translation', () => {
  const source = { mode: '通常', exact: 'ランキング', seconds: '{p0}秒', damage: '全攻撃ダメージ +4%（×{p0} → ×{p1}）', boss: 'ボス出現：{p0}', title: '監視者' };
  const target = { mode: 'Normal', exact: 'Ranking', seconds: '{p0} seconds', damage: 'All damage +4% (×{p0} → ×{p1})', boss: 'Boss: {p0}', title: 'Watcher' };
  it('translates exact known UI messages and leaves unknown text untouched', () => {
    const t = createTranslator(source, target);
    expect(t('ランキング')).toBe('Ranking');
    expect(t('unmapped')).toBe('unmapped');
    expect(t('sabasaba_normal')).toBe('sabasaba_normal');
  });
  it('preserves dynamic numbers and translates known display parameters', () => {
    const t = createTranslator(source, target);
    expect(t('1.2秒')).toBe('1.2 seconds');
    expect(t('全攻撃ダメージ +4%（×1.04 → ×1.08）')).toBe('All damage +4% (×1.04 → ×1.08)');
    expect(t('ボス出現：監視者')).toBe('Boss: Watcher');
  });
  it('rejects a target with missing or extra placeholders without losing the source', () => {
    const t = createTranslator(source, { ...target, damage: '{p0}', seconds: '{p0} {p1}' });
    expect(t('全攻撃ダメージ +4%（×1.04 → ×1.08）')).toBe('全攻撃ダメージ +4%（×1.04 → ×1.08）');
    expect(t('1.2秒')).toBe('1.2秒');
  });
});

it('translates nested authored result suffixes without changing result values', () => {
 const t = createTranslator(
  { result: '結果 {p0}点{p1}', suffix: ' / 武器：{p0}', weapon: '主砲' },
  { result: 'Result {p0}{p1}', suffix: ' / Weapon: {p0}', weapon: 'Cannon' },
 );
 expect(t('結果 120点 / 武器：主砲')).toBe('Result 120 / Weapon: Cannon');
});

it('preserves boundary whitespace around authored connector strings', () => {
 const t = createTranslator({ join: 'と', suffix: '/ 獲得済み' }, { join: 'and', suffix: '/ Acquired' });
 expect(t(' と ')).toBe(' and ');
 expect(t(' / 獲得済み')).toBe(' / Acquired');
});

it('preserves reordered and repeated template values without evaluating user-like text', () => {
 const t = createTranslator({pair:'左{p0}・右{p1}'},{pair:'Right {p1}; left {p0}'});
 expect(t('左<script>・右42')).toBe('Right 42; left <script>');
});
