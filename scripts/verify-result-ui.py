"""Real built-page checks. Preview mode never submits a score or starts a ranked run.
Run: pip install playwright==1.55.0; playwright install chromium; pnpm build;
     python scripts/verify-result-ui.py --url http://127.0.0.1:4173/sabasaba/
"""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright


def contrast(foreground, background):
    def luminance(css):
        channels = [int(x) / 255 for x in re.findall(r"\d+", css)[:3]]
        linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
        return sum(c * weight for c, weight in zip(linear, [0.2126, 0.7152, 0.0722]))
    a, b = sorted([luminance(foreground), luminance(background)])
    return (b + 0.05) / (a + 0.05)


def verify(url, output):
    output.mkdir(parents=True, exist_ok=True)
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        for mode in ["normal", "endless"]:
            for width, height in [(390, 844), (402, 874), (430, 932), (844, 390), (1440, 900)]:
                context = browser.new_context(viewport={"width": width, "height": height}, locale="ja-JP", is_mobile=width < 900, has_touch=width < 900)
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"{url}?result&mode={mode}", wait_until="domcontentloaded")
                retry, share = page.get_by_test_id("retry-run"), page.get_by_test_id("share-result")
                retry.wait_for(timeout=30000)
                page.wait_for_timeout(250)
                for button in [retry, share]:
                    box = button.bounding_box()
                    assert box and 0 <= box["y"] and box["y"] + box["height"] <= height, (mode, width, height, box)
                    assert box["width"] >= 44 and box["height"] >= 44
                    style = button.evaluate("b => ({color:getComputedStyle(b).color, background:getComputedStyle(b).backgroundColor})")
                    ratio = contrast(style["color"], style["background"])
                    assert ratio >= 4.5, (mode, style, ratio)
                    assert button.evaluate("b => {const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}")
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                page.screenshot(path=str(output / f"result-{mode}-{width}x{height}.png"))
                card = page.get_by_test_id("evolution-result-card")
                card.scroll_into_view_if_needed()
                text = card.inner_text()
                assert "進化後のダメージ" in text and "420" in text and "10体" in text and "1,000点" in text, text
                assert "追加のボーナスではありません" in page.get_by_test_id("evolution-results").inner_text()
                # Top actions stay available while the long result report is scrolled.
                assert share.bounding_box()["y"] >= 0
                page.screenshot(path=str(output / f"evolution-{mode}-{width}x{height}.png"))
                assert not errors, errors
                report.append({"mode": mode, "width": width, "height": height, "result": "pass"})
                context.close()
        context = browser.new_context(viewport={"width": 390, "height": 844}, locale="ja-JP", is_mobile=True, has_touch=True)
        page = context.new_page()
        page.goto(f"{url}?result&mode=endless", wait_until="domcontentloaded")
        share = page.get_by_test_id("share-result"); share.wait_for(timeout=30000)
        page.evaluate('''() => {
          window.testShares = []; window.testCopies = [];
          Object.defineProperty(navigator, 'share', {configurable:true,value:async data => {window.testShares.push(data);}});
          Object.defineProperty(navigator, 'canShare', {configurable:true,value:() => true});
          Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async text => {window.testCopies.push(text);}}});
        }''')
        share.click(); page.wait_for_function("window.testShares.length === 1")
        shared = page.evaluate("window.testShares[0].text")
        assert "スコア" in shared and "ノヴァ・ソーハロ" in shared and "?result" not in shared
        assert page.evaluate("window.testCopies.length") == 0
        # Cancelling the native sheet must not silently copy or re-open anything.
        page.evaluate("navigator.share = async () => {throw new DOMException('cancelled', 'AbortError');}")
        share.click(); page.wait_for_function("!document.querySelector('[data-testid=share-result]').disabled")
        assert page.evaluate("window.testCopies.length") == 0
        # Unsupported native sharing uses the same full result text in clipboard.
        page.evaluate("navigator.share = undefined")
        share.click(); page.wait_for_function("window.testCopies.length === 1")
        assert page.evaluate("window.testCopies[0]") == shared
        # No native sheet and no clipboard access: present selectable text instead.
        page.evaluate("navigator.clipboard.writeText = async () => {throw new Error('denied');}")
        share.click()
        manual = page.get_by_role("textbox", name="コピー用のシェア文")
        manual.wait_for(); assert manual.input_value() == shared
        # A double click cannot create two native sheets while the first is open.
        page.evaluate('''() => {
          window.doubleShareCount=0;
          navigator.share=() => {window.doubleShareCount++;return new Promise(resolve => {window.finishShare=resolve;});};
          const button=document.querySelector('[data-testid=share-result]');button.click();button.click();
        }''')
        assert page.evaluate("window.doubleShareCount") == 1
        page.evaluate("window.finishShare()")
        page.wait_for_function("!document.querySelector('[data-testid=share-result]').disabled")
        page.get_by_test_id("retry-run").click()
        page.get_by_test_id("retry-run").wait_for(state="hidden")
        report.append({"share": "native, cancel, clipboard, manual fallback, duplicate guard", "replay": "pass"})
        context.close(); browser.close()
    (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:4173/sabasaba/")
    parser.add_argument("--output", type=Path, default=Path("artifacts/result-ui"))
    args = parser.parse_args()
    verify(args.url, args.output)
