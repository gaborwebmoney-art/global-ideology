"""v10.25 regression: (1) phone Whole-map view: thumb-sized (10 px off-centre) taps collect Clout bubbles; (2) HU: the Snap Election card and
outcome translate with an empty suffix. usage: python3 tools/bubble-tap-test.py http://localhost:8765   (exit 0 = all passed)"""
import sys
from playwright.sync_api import sync_playwright
BASEURL=sys.argv[1]
def start(page):
    page.goto(BASEURL+'/index.html?debug'); page.wait_for_timeout(1500)
    page.click('#authGuest'); page.wait_for_timeout(500)
    if page.is_visible('#resumeOv'): page.click('#resumeNew'); page.wait_for_timeout(300)
    if page.is_visible('[data-pskip]'): page.click('[data-pskip]'); page.wait_for_timeout(300)
    if page.is_visible('#introGo'): page.click('#introGo'); page.wait_for_timeout(300)
    page.evaluate("window.__gi.select('celestia')"); page.wait_for_timeout(300)
    page.click('#startHere'); page.wait_for_timeout(1200)
FAILS=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--no-sandbox'])
    for view in ['fit','zoom']:
        ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2); page=ctx.new_page()
        page.add_init_script(f"try{{localStorage.setItem('gi.view','{view}')}}catch(e){{}}"); start(page)
        ids=[i for i in page.evaluate("Object.keys(window.__gi.S.inf)") if i!='celestia']
        for n,oid in enumerate(ids[:8]):
            page.evaluate(f"window.__gi.S.bubbles.push({{key:{9001+n},id:'{oid}',value:2,until:9999}}); window.__gi.S.bubbleSeq={9001+n}")
        page.wait_for_timeout(1500)
        ok=0; tot=0; px=0
        for n in range(8):
            bb=page.locator(f'.bubble[data-key="{9001+n}"] circle:not(.bhit)')
            if bb.count()==0: continue
            bx=bb.first.bounding_box(); x=bx['x']+bx['width']/2+10; y=bx['y']+bx['height']/2+10; px=bx['width']
            if not (0<=x<390 and 0<=y<700): continue   # off-screen / under the HUD
            c0=page.evaluate("window.__gi.S.clout"); tot+=1
            page.touchscreen.tap(x,y); page.wait_for_timeout(350)
            if page.evaluate("window.__gi.S.clout")>c0+1.5: ok+=1
        print(view,'bubble ~%dpx'%px,'thumb-offset taps collected',ok,'/',tot); FAILS.append(not (tot>0 and ok==tot)); ctx.close()
    ctx=b.new_context(viewport={'width':1280,'height':720}); page=ctx.new_page(); page.add_init_script("try{localStorage.setItem('gi.lang','hu')}catch(e){}"); start(page)
    for en,hu in [("Pay 10 Clout. 55% chance: +12 support. 45% chance: −6 support.","Fizess 10 befolyást. 55% esély: +12 támogatás. 45% esély: −6 támogatás."),("Your candidate loses in Koryn, loudly. Support −6.","A jelöltetek veszít itt: Koryn, hangosan. Támogatás −6.")]:
        got=page.evaluate("s=>window.GI_I18N.tr(s)",en); print('HU',got==hu,got); FAILS.append(got!=hu)
    ctx.close(); b.close()
sys.exit(1 if any(FAILS) else 0)
