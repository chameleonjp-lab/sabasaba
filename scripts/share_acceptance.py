"""Additional isolated X checks; result preview and normal material stay separate."""
import os
import json
import re
from urllib.parse import urlsplit, parse_qs

LANGUAGES = ['ja','en','es','pt-BR','zh-Hans','fr','de','ko','ru','it','zh-Hant','id','tr','vi','th']
MEASURE = '''el => {const r=el.getBoundingClientRect(),s=getComputedStyle(el);let opacity=1,visible=true,ancestorClipped=false;for(let n=el;n;n=n.parentElement){const c=getComputedStyle(n);opacity*=Number(c.opacity);if(n.hidden||c.display==='none'||['hidden','collapse'].includes(c.visibility))visible=false;if(n!==el){const b=n.getBoundingClientRect(),left=b.left+n.clientLeft,top=b.top+n.clientTop;if(['hidden','clip','auto','scroll'].includes(c.overflowX)&&(r.left<left||r.right>left+n.clientWidth))ancestorClipped=true;if(['hidden','clip','auto','scroll'].includes(c.overflowY)&&(r.top<top||r.bottom>top+n.clientHeight))ancestorClipped=true;}}const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,vw:innerWidth,vh:innerHeight,opacity,visible,hit:hit===el||el.contains(hit),disabled:el.disabled,clipped:ancestorClipped||el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1,text:el.textContent.trim(),background:s.backgroundColor,color:s.color};}'''
SETTLE = '''async el => {let previous='',stable=0;for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);let active=false;for(let n=el;n;n=n.parentElement)if(n.getAnimations().some(a=>a.effect?.getTiming().iterations!==Infinity&&(a.pending||a.playState==='running')))active=true;const r=el.getBoundingClientRect(),key=JSON.stringify([r.x,r.y,r.width,r.height]);stable=!active&&key===previous?stable+1:0;previous=key;if(stable>=2)return;}throw Error('X layout unstable '+previous);}'''
STUB = '''{window.shareIntents=[];window.open=value=>{window.shareIntents.push(String(value));return{opener:null};};}'''


def accept(page, button, language, screen, output):
    sizes=[(393,852),(852,393),(393,600)] if language in ['ja','en','de'] else [(393,852)]
    for width,height in sizes:
        prefix=f'{language}-{screen}-{width}x{height}'
        page.set_viewport_size({'width':width,'height':height})
        page.mouse.move(0,0)
        button.scroll_into_view_if_needed()
        button.evaluate("el=>el.scrollIntoView({block:'center',inline:'center',behavior:'instant'})")
        try:
            button.evaluate(SETTLE)
            m=button.evaluate(MEASURE)
            (output/f'{prefix}.json').write_text(json.dumps(m,ensure_ascii=False),encoding='utf-8')
            page.screenshot(path=str(output/f'{prefix}.png'))
            assert m['visible'] and m['opacity']==1 and m['hit'] and not m['disabled'],m
            assert m['width']>=44 and m['height']>=44,m
            assert m['left']>=0 and m['top']>=0 and m['right']<=m['vw']+1 and m['bottom']<=m['vh']+1,m
            assert not m['clipped'] and 'X' in m['text'],m
            if language=='ja':assert m['text']=='Xでシェア',m
            for state in ['normal','hover','pressed']:
                if state=='hover':page.mouse.move((m['left']+m['right'])/2,(m['top']+m['bottom'])/2)
                if state=='pressed':page.mouse.down()
                button.evaluate(SETTLE)
                color=button.evaluate("el=>({bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})")
                assert color=={'bg':'rgb(0, 0, 0)','color':'rgb(255, 255, 255)'},(prefix,state,color)
            if language in ['ja','en','de']:page.screenshot(path=str(output/f'{prefix}-pressed.png'))
            page.mouse.move(0,0);page.mouse.up()
            count=page.evaluate('window.shareIntents.length')
            button.tap()
            page.wait_for_function('(n)=>window.shareIntents.length===n+1',arg=count,timeout=5000)
            intent=urlsplit(page.evaluate('window.shareIntents.at(-1)'))
            assert intent.scheme=='https' and intent.netloc=='x.com' and intent.path=='/intent/post'
            text=parse_qs(intent.query)['text'][0]
            assert text.count('#サバサバ')==1 and text.count('#ゲーム制作')==1 and '#サバサバ #ゲーム制作' in text and text.endswith('https://chameleonjp-lab.github.io/sabasaba/')
            assert '\\n' not in text and text.count('\n')>=2
            assert '確認用' not in text and 'ランキング' not in text
            non_url=re.sub(r'https?://[^\s]+','',text)
            weighted=23+sum(1 if ord(c)<=0x10ff or 0x2000<=ord(c)<=0x200d or 0x2010<=ord(c)<=0x201f or 0x2032<=ord(c)<=0x2037 else 2 for c in non_url)
            assert weighted<=280,(language,screen,weighted)
            if screen=='result':assert page.locator('.result-summary b').first.inner_text().strip() in text
        except Exception:
            page.screenshot(path=str(output/f'{prefix}-failure.png'))
            raise


def verify_extra(browser, url, output, isolated_context):
    for language in LANGUAGES:
        blocked=[]
        context=isolated_context(browser,url,blocked,viewport={'width':393,'height':852},locale='ja-JP',is_mobile=True,has_touch=True)
        context.add_init_script(STUB)
        page=context.new_page();errors=[];writes=[]
        page.on('pageerror',lambda _:errors.append('pageerror'))
        page.on('request',lambda r:writes.append(r.method) if r.method not in ('GET','HEAD') else None)
        try:
            page.goto(url,wait_until='domcontentloaded')
            page.get_by_test_id('language-select').select_option(language)
            assert page.get_by_test_id('player-name').input_value()==''
            button=page.get_by_test_id('share-home')
            if language=='ja':
                for prop,value in [('opacity','0'),('display','none')]:
                    old=button.evaluate('''(el,args)=>{const p=el.parentElement,old=p.style.getPropertyValue(args[0]);p.style.setProperty(args[0],args[1]);return old;}''',[prop,value])
                    try:
                        m=button.evaluate(MEASURE);assert not m['visible'] or m['opacity']==0
                    finally:button.evaluate('(el,args)=>el.parentElement.style.setProperty(args[0],args[1])',[prop,old])
            accept(page,button,language,'home',output)
            page.goto(f'{url}?result&mode=normal',wait_until='domcontentloaded')
            page.get_by_test_id('share-result').wait_for(timeout=30000)
            accept(page,page.get_by_test_id('share-result'),language,'result',output)
            assert not blocked and not writes and not errors,(blocked,writes,errors)
        finally:context.close()
    if os.environ.get('SABASABA_CAPTURE_SHARE_MATERIAL')=='1':
        blocked=[];context=isolated_context(browser,url,blocked,viewport={'width':1200,'height':800},locale='ja-JP')
        page=context.new_page();writes=[]
        page.on('request',lambda r:writes.append(r.method) if r.method not in ('GET','HEAD') else None)
        try:
            page.goto(url,wait_until='domcontentloaded')
            assert page.get_by_test_id('player-name').input_value()==''
            page.get_by_test_id('start-run').click()
            page.locator('canvas').wait_for(timeout=30000)
            page.get_by_test_id('run-countdown').wait_for(state='hidden',timeout=15000)
            # Real runtime frames only, no preview query, forced draw/spawn or clock change.
            page.wait_for_timeout(5000)
            canvas=page.locator('canvas')
            assert canvas.is_visible() and canvas.evaluate('c=>c.width>0&&c.height>0')
            canvas.screenshot(path=str(output/'actual-normal-game-canvas.png'))
            page.screenshot(path=str(output/'actual-normal-game-screen.png'))
            assert not writes and not blocked,(writes,blocked)
        finally:context.close()
