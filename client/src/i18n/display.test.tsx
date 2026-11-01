import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PauseLoadoutPanel from '../components/PauseLoadoutPanel';
import EvolutionResults from '../components/EvolutionResults';
import { setLanguage } from './runtime';
import { UPGRADE_CATALOG } from '../game/types';

describe('translated authored game-data display boundaries', () => {
 it('renders loadout names, details and synergy progress without Japanese leftovers in English', () => {
  setLanguage('en');
  const html = renderToStaticMarkup(<PauseLoadoutPanel attacks={[{id:'rail',label:'レールパルス',detail:'自動追尾',iconId:'rail',tier:1,active:true}]} weaponCount={1} weaponLimit={6} utilityCount={0} utilityLimit={4} evolvedWeapons={[]} />);
  expect(html).not.toMatch(/[\u3040-\u30ff\u3400-\u9fff]/);
 });
 it('renders evolution names and source weapon names at the display boundary', () => {
  setLanguage('en');
  const html = renderToStaticMarkup(<EvolutionResults stats={[{id:'vector',iconId:'vector',label:'ベクター・イオンランス',tier:3,damage:12,kills:1,evolutionId:'vector-laser',evolvedDamage:12,evolvedKills:1,sourceLabels:['vector','laser'].map(id => UPGRADE_CATALOG.find(item => item.id === id)!.title)}]} />);
  expect(html).not.toMatch(/[\u3040-\u30ff\u3400-\u9fff]/);
  expect(html).toContain('12');
 });
});

it('keeps all real upgrade IDs and codes unchanged while the display language changes', () => {
 const before = UPGRADE_CATALOG.map(item => ({id:item.id, code:item.code, title:item.title}));
 setLanguage('es');
 expect(UPGRADE_CATALOG.map(item => ({id:item.id, code:item.code, title:item.title}))).toEqual(before);
});

import { t } from './runtime';
it('localizes display-code prefixes without altering the stored catalog code or stable id', () => {
 setLanguage('en');
 const entry = UPGRADE_CATALOG.find(item => item.id === 'vector')!;
 expect(entry.code).toBe('補助-10');
 expect(t(entry.code)).not.toMatch(/[\u3040-\u30ff\u3400-\u9fff]/);
 expect(t(entry.code)).toContain('10');
 expect(entry.id).toBe('vector');
 expect(entry.code).toBe('補助-10');
});
