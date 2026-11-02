import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import postcss from 'postcss';
const css=postcss.parse(readFileSync(new URL('../index.css',import.meta.url),'utf8'));
function lastRuleValue(selector:string,property:string){let value:string|undefined;css.walkRules(rule=>{if(rule.selectors.includes(selector))rule.walkDecls(property,decl=>{value=decl.value;});});return value;}
for(const selector of ['.share-button','.share-button:hover','.share-button:focus-visible','.share-button:active','.result-primary-actions .share-button','.result-primary-actions .share-button:hover','.result-primary-actions .share-button:focus-visible','.result-primary-actions .share-button:active']){
 it(`${selector} explicitly keeps X sharing black with white text`,()=>{
  expect(lastRuleValue(selector,'background')).toBe('#000');expect(lastRuleValue(selector,'color')).toBe('#fff');
 });
}
