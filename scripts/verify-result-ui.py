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


def isolated_context(browser, **options):
    context = browser.new_context(**options)
    # Even a regression in preview mode must never send production ranking data.
    context.route("https://*.supabase.co/**", lambda route: route.abort())
    return context


def verify_share_colors(page, button):
    def assert_colors():
        style = button.evaluate("b => {const s=getComputedStyle(b);return {color:s.color,background:s.backgroundColor,image:s.backgroundImage};}")
        assert style == {"color": "rgb(255, 255, 255)", "background": "rgb(0, 0, 0)", "image": "none"}, style
    button.scroll_into_view_if_needed()
    assert_colors()
    button.hover(); assert_colors()
    button.focus(); assert_colors()
    # Check :active without activating X: release the pointer outside the button.
    box = button.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    try:
        assert_colors()
    finally:
        page.mouse.move(0, 0)
        page.mouse.up()


def verify(url, output):
    output.mkdir(parents=True, exist_ok=True)
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        for mode in ["normal", "endless"]:
            for width, height in [(390, 844), (402, 874), (430, 932), (844, 390), (1440, 900)]:
                context = isolated_context(browser, viewport={"width": width, "height": height}, locale="ja-JP", is_mobile=width < 900, has_touch=width < 900)
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"{url}?result&mode={mode}", wait_until="domcontentloaded")
                retry, share = page.get_by_test_id("retry-run"), page.get_by_test_id("share-result")
                retry.wait_for(timeout=30000)
                page.wait_for_timeout(250)
                verify_share_colors(page, share)
                page.screenshot(path=str(output / f"initial-{mode}-{width}x{height}.png"))
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
        context = isolated_context(browser, viewport={"width": 390, "height": 844}, locale="ja-JP", is_mobile=True, has_touch=True)
        page = context.new_page()
        page.goto(f"{url}?result&mode=endless", wait_until="domcontentloaded")
        share = page.get_by_test_id("share-result"); share.wait_for(timeout=30000)
        page.evaluate('''() => {
          window.testShares = []; window.testCopies = [];
          window.open = value => {const url=new URL(value); if(url.origin!=="https://x.com" || url.pathname!=="/intent/post") throw new Error("Unexpected share URL");window.testShares.push(url.searchParams.get("text"));return {opener:null};};
          Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async text => {window.testCopies.push(text);}}});
        }''')
        share.click(); page.wait_for_function("window.testShares.length === 1")
        shared = page.evaluate("window.testShares[0]")
        assert "スコア" in shared and "ノヴァ・ソーハロ" in shared and "?result" not in shared
        assert page.evaluate("window.testCopies.length") == 0
        # A blocked popup copies the same full result text.
        page.evaluate("window.open = () => null")
        share.click(); page.wait_for_function("window.testCopies.length === 1")
        assert page.evaluate("window.testCopies[0]") == shared
        # No popup and no clipboard access: present selectable text instead.
        page.evaluate("() => { navigator.clipboard.writeText = async () => {throw new Error('denied');}; }")
        share.click()
        manual = page.get_by_role("textbox", name="コピー用のシェア文")
        manual.wait_for(); assert manual.input_value() == shared
        # A second click cannot duplicate a still-pending clipboard operation.
        page.evaluate('''() => {
          window.doubleShareCount=0;
          navigator.clipboard.writeText=() => {window.doubleShareCount++;return new Promise(resolve => {window.finishShare=resolve;});};
          const button=document.querySelector('[data-testid=share-result]');button.click();button.click();
        }''')
        assert page.evaluate("window.doubleShareCount") == 1
        page.evaluate("window.finishShare()")
        page.wait_for_function("!document.querySelector('[data-testid=share-result]').disabled")
        page.get_by_test_id("retry-run").click()
        page.get_by_test_id("retry-run").wait_for(state="hidden")
        report.append({"share": "X intent, clipboard, manual fallback, duplicate guard", "replay": "pass"})
        context.close()
        languages = ["ja", "en", "es", "pt-BR", "zh-Hans", "fr", "de", "ko", "ru", "it", "zh-Hant", "id", "tr", "vi", "th"]
        for language in languages:
            context = isolated_context(browser, viewport={"width": 393, "height": 852}, locale="ja-JP", is_mobile=True, has_touch=True)
            context.add_init_script("""{
              if (!localStorage.getItem('sabasaba-player-name-v2')) localStorage.setItem('sabasaba-player-name-v2','ランキング');
              localStorage.setItem('neon-siege-player-audio-v1','off');
              localStorage.setItem('sabasaba.audio-volume.v1','0');
            }""")
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded")
            selector = page.get_by_test_id("language-select")
            selector.select_option(language)
            verify_share_colors(page, page.get_by_test_id("share-home"))
            page.wait_for_function("language => document.documentElement.lang === language", arg=language)
            assert page.get_by_test_id("player-name").input_value() == "ランキング"
            assert not page.get_by_test_id("sound-toggle").is_checked()
            assert page.get_by_test_id("sound-volume").input_value() == "0"
            page.get_by_test_id("mode-endless").click()
            assert "sabasaba_endless" in page.get_by_test_id("home-experiment-lab").get_attribute("href")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.reload(wait_until="domcontentloaded")
            assert page.get_by_test_id("language-select").input_value() == language
            page.goto(f"{url}?result&mode=endless", wait_until="domcontentloaded")
            share = page.get_by_test_id("share-result")
            share.wait_for(timeout=30000)
            label = share.inner_text().strip()
            assert label
            if language != "ja":
                assert label != "Xでシェア"
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            for button in [share, page.get_by_test_id("retry-run")]:
                box = button.bounding_box()
                assert box and box["height"] >= 44 and box["width"] >= 44
                assert 0 <= box["x"] and box["x"] + box["width"] <= 394
            report.append({"language": language, "savedChoice": "pass", "nameAndMutedZeroPreserved": "pass", "selectedModeLink": "pass", "resultLayout": "pass"})
            context.close()
        browser.close()
    (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:4173/sabasaba/")
    parser.add_argument("--output", type=Path, default=Path("artifacts/result-ui"))
    args = parser.parse_args()
    verify(args.url, args.output)
