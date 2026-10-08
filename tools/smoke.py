"""Browser regression checks. Requires Python Playwright and /usr/bin/chromium."""
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

root = Path(__file__).resolve().parent.parent
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        page = browser.new_page(viewport={'width':960,'height':540}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        now = datetime(2026, 10, 8, tzinfo=timezone.utc)
        page.clock.install(time=now)
        page.clock.pause_at(now + timedelta(seconds=1))
        response = page.goto(url)
        assert response.status == 200
        page.clock.run_for(400)
        assert page.title() == 'Điểm Kỳ Dị — Trò chơi trọng lực'
        assert page.locator('#menu').is_visible()
        assert page.evaluate("getComputedStyle(document.querySelector('.title')).backgroundClip === 'text'")
        page.click('#menuSkinBtn')
        assert page.locator('#skinGrid .skCard').count() == 8
        page.click('#skinBackBtn')
        page.click('#startBtn')
        page.clock.run_for(3000)
        assert page.evaluate("state === 'play' && __lastErr === null")
        item = page.evaluate("(()=>{const i=items.find(i=>!i.dead&&i.state==='loose');return i&&{x:i.x,y:i.y}})()")
        assert item, 'A source must produce a draggable object'
        rect = page.locator('#cv').bounding_box()
        def xy(x,y):
            return rect['x']+x*rect['width']/960, rect['y']+y*rect['height']/540
        page.mouse.move(*xy(item['x'],item['y']))
        assert page.evaluate('hovered !== null')
        page.mouse.down()
        assert page.evaluate('grabbed !== null && activePointer !== null')
        page.mouse.move(*xy(480,322), steps=8)
        page.mouse.up()
        assert page.evaluate('runMoney > 0 && runCollected > 0 && activePointer === null')
        page.keyboard.press('Escape')
        assert page.locator('#pause').is_visible()
        before = page.evaluate('save.playSeconds')
        page.clock.run_for(500)
        assert page.evaluate('save.playSeconds') == before
        page.keyboard.press('Escape')
        page.evaluate('for(let i=0;i<48*60;i++)tickGame(1/60)');page.clock.run_for(400)
        assert page.evaluate("state === 'roundEnd'")
        assert page.evaluate("JSON.parse(localStorage.getItem('holeGameV5')).round === 2")
        page.click('#toShopBtn')
        page.clock.run_for(400)
        assert page.locator('#treeBox .nd[role=button]').count() == 8
        page.evaluate('save.pts=1000;renderShop()')
        page.locator('#treeBox .nd[role=button]').first.focus()
        page.keyboard.press('Enter')
        assert page.locator('#ndName').inner_text() != 'Chọn nâng cấp'
        credits = page.evaluate('save.pts')
        page.click('#buyBtn')
        assert page.evaluate('save.pts') < credits
        assert page.evaluate('lv("junk2")') == 1
        assert page.locator('#treeBox .nd[role=button]').count() == 9
        page.click('#nextRoundBtn')
        assert page.evaluate("state === 'play'")

        # A completed tree must render and remain navigable in a small landscape viewport.
        page.evaluate("pauseGame();NODES.forEach(n=>save.lv[n.id]=n.max);state='shop';renderShop();showOverlay('shop')")
        page.set_viewport_size({'width':844,'height':390})
        page.clock.run_for(400)
        assert page.locator('#treeBox .nd[role=button]').count() == 33
        assert page.locator('#nextRoundBtn').bounding_box()['y'] < 390
        assert page.evaluate("document.getElementById('treeBox').scrollHeight > document.getElementById('treeBox').clientHeight")
        assert page.locator('#treeBox').evaluate("e=>{e.scrollTop=e.scrollHeight;return e.scrollTop>0}")
        page.locator('#treeBox .nd[role=button]').last.click()
        assert page.locator('#ndName').inner_text() != 'Chọn nâng cấp'
        assert page.locator('#buyBtn').is_disabled()
        page.click('#nextRoundBtn')
        page.evaluate('for(let i=0;i<15*60;i++)tickGame(1/60)');page.clock.run_for(500)
        assert page.evaluate('__lastErr === null')
        assert page.evaluate('parts.length <= 320 && rings.length <= 32 && arcs.length <= 48 && texts.length <= 32')
        page.screenshot(path='/tmp/game03-campaign-play.png', animations='disabled')

        # Mouse and touch share the same pointer capture and release implementation.
        page.evaluate('pauseGame();save.lv={};startRound()')
        page.clock.run_for(3000)
        item=page.evaluate("(()=>{const i=items.find(i=>!i.dead&&i.state==='loose');return i&&{x:i.x,y:i.y}})()")
        assert item
        rect=page.locator('#cv').bounding_box()
        session=page.context.new_cdp_session(page)
        x,y=xy(item['x'],item['y'])
        session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        assert page.evaluate('grabbed !== null')
        x,y=xy(480,322)
        session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y}]})
        session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        assert page.evaluate('runCollected > 0 && activePointer === null')
        page.evaluate("pauseGame();state='shop';renderShop();showOverlay('shop')")
        page.clock.run_for(400)
        page.screenshot(path='/tmp/game03-campaign-shop.png', animations='disabled')
        page.set_viewport_size({'width':390,'height':844})
        page.clock.run_for(100)
        assert page.locator('#rotate').is_visible()
        assert not errors, errors
        browser.close()
        print('PASS: HTTP, menu, skins, drag, touch, pause/timing, natural round, saved rewards, keyboard/purchase, 33-node tree, small-screen scrolling, max-upgrade rendering; no console errors')
finally:
    server.shutdown()
    server.server_close()
