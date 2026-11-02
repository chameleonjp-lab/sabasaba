import { describe, expect, it } from 'vitest';
import { LANGUAGES } from './language';
import { SOURCE_MESSAGES } from './source';
import { dictionaries } from './runtime';
const slots = (text: string) => Array.from(text.matchAll(/\{p\d+\}/g), match => match[0]).sort();

describe('complete authored message coverage for every offered language', () => {
 for (const {id} of LANGUAGES) {
  it(`${id} has every source key, nonempty text and unchanged interpolation parameters`, () => {
   const messages = dictionaries[id] ?? {};
   expect(Object.keys(messages).sort()).toEqual(Object.keys(SOURCE_MESSAGES).sort());
   for (const [key,source] of Object.entries(SOURCE_MESSAGES)) {
    expect(messages[key].trim(),`${id}/${key}`).not.toBe('');
    expect(slots(messages[key]),`${id}/${key}`).toEqual(slots(source));
   }
  });
 }
});
