import {afterEach,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
const fixture=vi.hoisted(()=>({names:[] as string[]}));
vi.mock('react',async()=>({...await vi.importActual('react'),useState:()=>[fixture.names,()=>{}],useEffect:()=>{}}));
import EvolutionNotice from './EvolutionNotice';
import {EVOLUTION_RECIPES} from '@/game/rules';
import {setLanguage,t} from '@/i18n/runtime';
afterEach(()=>setLanguage('ja'));
it('translates authored evolution names without changing recipe identity or names',()=>{
 const recipe=EVOLUTION_RECIPES[0];const original={id:recipe.id,name:recipe.name};fixture.names=[recipe.name];setLanguage('en');
 expect(t(recipe.name)).not.toBe(recipe.name);
 const html=renderToStaticMarkup(<EvolutionNotice weapons={[recipe.id]} visible/>);
 expect(html).toContain(t(recipe.name));expect(html).not.toContain(recipe.name);expect({id:recipe.id,name:recipe.name}).toEqual(original);
});
