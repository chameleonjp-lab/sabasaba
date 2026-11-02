const placeholderNames = (text: string) => Array.from(text.matchAll(/\{(p\d+)\}/g)).map(match => match[1]);
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Only call at authored UI-message boundaries, never on names, IDs, or saved data. */
export function createTranslator(source: Record<string, string>, target: Record<string, string>) {
  const exact = new Map<string, string>();
  const patterns: { regex: RegExp; names: string[]; translated: string; specificity: number }[] = [];
  for (const [key, original] of Object.entries(source)) {
    const translated = target[key];
    if (typeof translated !== 'string' || !translated.trim()) continue;
    const names = placeholderNames(original);
    if ([...names].sort().join(',') !== placeholderNames(translated).sort().join(',')) continue;
    if (!names.length) { exact.set(original, translated); continue; }
    let position = 0;
    let pattern = '^';
    for (const match of Array.from(original.matchAll(/\{p\d+\}/g))) {
      pattern += escapeRegex(original.slice(position, match.index)) + '([\\s\\S]*?)';
      position = match.index! + match[0].length;
    }
    pattern += escapeRegex(original.slice(position)) + '$';
    patterns.push({ regex: new RegExp(pattern), names, translated, specificity: original.replace(/\{p\d+\}/g, '').length });
  }
  // Match the most explicit authored sentence before a short unit such as "{p0}秒".
  patterns.sort((a, b) => b.specificity - a.specificity);
  const translate = (message: string, depth = 0): string => {
    if (exact.has(message)) return exact.get(message)!;
    const trimmed = message.trim();
    if (trimmed !== message && exact.has(trimmed)) {
      return (message.match(/^\s*/)?.[0] ?? '') + exact.get(trimmed)! + (message.match(/\s*$/)?.[0] ?? '');
    }
    if (depth >= 4) return message;
    for (const pattern of patterns) {
      const match = pattern.regex.exec(message);
      if (!match) continue;
      const values = Object.fromEntries(pattern.names.map((name, index) => [name, translate(match[index + 1], depth + 1)]));
      return pattern.translated.replace(/\{(p\d+)\}/g, (_match, name: string) => values[name]);
    }
    return message;
  };
  return (message: string) => translate(message);
}
