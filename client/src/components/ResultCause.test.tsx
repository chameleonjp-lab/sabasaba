import { describe,it,expect } from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ResultCause} from './ResultCause';
import {setLanguage} from '../i18n/runtime';
for(const language of ['ja','en'] as const) describe(language,()=>{
 it('hides clear cause independently from translated success label',()=>{setLanguage(language);expect(renderToStaticMarkup(<ResultCause outcome="clear" cause="最終ボスを撃破"/>)).toBe('');});
 it('shows retirement cause',()=>{setLanguage(language);expect(renderToStaticMarkup(<ResultCause outcome="retired" cause="test reason"/>)).toContain('test reason');});
});
