import { describe, expect, it } from "vitest";
import { buildShareText, buildXIntent } from "./ShareButton";

describe("ShareButton share text", () => {
  it("adds the game URL as a plain-text line", () => {
    expect(buildShareText("【サバサバ】通常 / 生存時間 10:00 / スコア 12,345", "https://chameleonjp-lab.github.io/sabasaba/"))
      .toBe("【サバサバ】通常 / 生存時間 10:00 / スコア 12,345\n#サバサバ #ゲーム制作\nhttps://chameleonjp-lab.github.io/sabasaba/");
  });

  it("removes trailing whitespace before the URL", () => {
    expect(buildShareText("ゲームをシェアします。  \n", "https://example.com/game/"))
      .toBe("ゲームをシェアします。\n#サバサバ #ゲーム制作\nhttps://example.com/game/");
  });
});

it('X intent keeps non-ASCII text, punctuation and newlines intact', () => {
 const text = 'サバサバ & #\n123点';
 const url = new URL(buildXIntent(text));
 expect(url.origin).toBe('https://x.com');
 expect(url.searchParams.get('text')).toBe(text);
});
