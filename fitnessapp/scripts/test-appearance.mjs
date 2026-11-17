import assert from 'node:assert/strict';
import {positionAtEdge,scrollLayout,assertScrollLayout} from './scroll-layout.mjs';

export async function testAppearance(browser, url, contrast) {
  // A separate context: never inspect or change a person's browser storage.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  try {
    const page = await context.newPage();
    await page.goto(url);
    await page.locator('.exercise-card').first().waitFor();
    const savedState = () => page.evaluate(async () => {
      const { LocalStore } = await import('./storage.mjs');
      const store = await new LocalStore().open();
      try { return await store.load(); } finally { store.db.close(); }
    });
    const before = await savedState();
    const cdp = await context.newCDPSession(page);
    for (const top of [0, 47]) {
      // Real env() override in Chromium. This cannot emulate the native iOS scroll-edge effect.
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top, bottom: 34, left: 0, right: 0 } });
      for (const theme of ['light', 'dark']) {
        // Inspect each palette without persisting a preference. The main browser
        // suite separately tests the actual theme selector and saved preference.
        const paint = () => page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        await page.locator('.mobile-nav [data-page="home"]').click();
        await paint();
        const surfaces = await page.evaluate(() => {
          const card = document.querySelector('.exercise-card');
          const field = card.querySelector('.number-stepper');
          const style = getComputedStyle(field);
          return { bg: getComputedStyle(document.documentElement).backgroundColor, card: getComputedStyle(card).backgroundColor, field: style.backgroundColor, border: style.borderTopColor, ink: getComputedStyle(field.querySelector('input')).color, placeholder: getComputedStyle(field.querySelector('input'), '::placeholder').color };
        });
        assert.notEqual(surfaces.bg, surfaces.card, 'Kaarten onderscheiden zich van de pagina');
        assert.notEqual(surfaces.card, surfaces.field, 'Invoer onderscheidt zich van kaarten');
        assert.ok(contrast(surfaces.ink, surfaces.field) >= 4.5, 'Invoer heeft AA-tekstcontrast');
        if (theme === 'dark') {
          assert.ok(contrast(surfaces.placeholder, surfaces.field) >= 4.5, 'Donkere placeholder heeft AA-tekstcontrast');
          assert.ok(contrast(surfaces.border, surfaces.field) >= 3, 'Donkere invoerrand heeft 3:1 contrast');
          assert.ok(contrast(surfaces.border, surfaces.card) >= 3, 'Donkere kaart-/invoerrand heeft 3:1 contrast');
          const completedBackground = await page.locator('.exercise-card').first().evaluate(card => {
            card.classList.add('exercise-done');
            card.querySelector('.set-row').classList.add('completed');
            const background = getComputedStyle(card.querySelector('.number-stepper')).backgroundColor;
            card.classList.remove('exercise-done');
            card.querySelector('.set-row').classList.remove('completed');
            return background;
          });
          assert.equal(completedBackground, surfaces.field);
        }
        for (const [view, target] of [['home', '.exercise-name'], ['schema', '.schema-row strong'], ['stats', 'h1'], ['library', '.library-item h3'], ['more', '.more-list strong']]) {
          await page.locator(`.mobile-nav [data-page="${view}"]`).click();
          await paint();
          assert.equal(await page.locator('#app').evaluate(el=>el.scrollTop),0,'Navigeren start bovenaan het eigen scrollvlak');
          if(view==='home')assert.ok(Math.abs((await page.locator('.training-weekline').boundingBox()).y-top-22)<1,'Alleen de bestaande 22px ruimte onder de statusbalk');
          await checkEdge(page, target, top);
          if (view === 'home') await page.screenshot({ path: `/tmp/ritme-edge-${theme}-${top}.png` });
        }
        await page.locator('.more-list [data-page="settings"]').click();
        await paint();
        await checkEdge(page, '.settings-grid h2', top);
        await page.locator('.mobile-nav [data-page="library"]').click();
        await paint();
        const backgroundY=await page.locator('#app').evaluate(el=>el.scrollTop);
        await page.locator('.library-item').first().click();
        const modal = await page.locator('#modal').evaluate(el => {
          const backdrop = getComputedStyle(el, '::backdrop');
          const header = getComputedStyle(el.querySelector('.modal-head'));
          return { top: el.getBoundingClientRect().top, blur: backdrop.backdropFilter, image: backdrop.backgroundImage, headerBlur: header.backdropFilter, headerImage: header.backgroundImage };
        });
        assert.ok(modal.top >= top, 'Dialoog blijft onder de statusbalk');
        assert.equal(modal.blur, 'none');
        assert.equal(modal.image, 'none');
        assert.equal(modal.headerBlur, 'none');
        assert.equal(modal.headerImage, 'none');
        await page.locator('#modal').evaluate(el=>{el.scrollTop=el.scrollHeight/2;});
        assert.equal(await page.evaluate(()=>scrollY),0,'Dialoog scrollt zonder de documentpagina te verplaatsen');
        assert.equal(await page.locator('#app').evaluate(el=>el.scrollTop),backgroundY,'Dialoog verplaatst de achterliggende app niet');
        await page.locator('#modal [data-action="close-modal"]').first().click();
        assert.equal(await page.locator('#app').evaluate(el=>el.scrollTop),backgroundY,'Sluiten behoudt de app-scrollpositie');
      }
    }
    await page.locator('.mobile-nav [data-page="home"]').click();
    for(const viewport of [{width:320,height:568},{width:390,height:500},{width:844,height:390},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      await page.evaluate(positionAtEdge,{selector:'.exercise-name',offset:-3});
      assertScrollLayout(await page.evaluate(scrollLayout,{selector:'.exercise-name'}),47);
    }
    await page.locator('#app').focus();
    const keyboardY=await page.locator('#app').evaluate(el=>el.scrollTop);
    await page.keyboard.press('PageDown');
    await page.waitForFunction(y=>document.querySelector('#app').scrollTop>y,keyboardY);
    assert.equal(await page.evaluate(()=>scrollY),0,'Toetsenbordscroll gebruikt uitsluitend het appvlak');
    await page.locator('#app').evaluate(el=>{el.scrollTop=0;});
    await cdp.send('Input.synthesizeScrollGesture',{x:380,y:600,yDistance:-300,speed:400,gestureSourceType:'touch'});
    assert.ok(await page.locator('#app').evaluate(el=>el.scrollTop>0),'Aanraking scrollt het appvlak');
    assert.equal(await page.evaluate(()=>scrollY),0,'Aanraking scrollt de documentpagina niet');
    await page.locator('.mobile-nav [data-page="home"]').click();
    const input=page.locator('input[data-set-field]').last();await input.focus();
    assert.equal(await page.evaluate(()=>scrollY),0,'Focus op een laag invoerveld verplaatst de root niet');
    await input.blur();
    assert.deepEqual(await savedState(), before, 'Weergavecontrole verandert geen opgeslagen gegevens');
    console.log('Scrollgeometrie geslaagd in Chromium: root stil, app begrensd op 0/47px, echte clipping, licht/donker, zes schermen, dialoog en gegevensbehoud. Geen bewijs van native iOS-pixels.');
  } finally {
    await context.close();
  }
}

async function checkEdge(page, selector, top) {
  for (const offset of [2, -3]) {
    await page.evaluate(positionAtEdge,{selector,offset});
    const layout=await page.evaluate(scrollLayout,{selector});
    assertScrollLayout(layout,top);
    if(offset<0 && layout.appScroll>0){
      assert.ok(layout.targetTop<top&&layout.targetBottom>top,'Tekst kan gedeeltelijk buiten beeld vallen en wordt daar afgeknipt');
    }
  }
  await page.evaluate(()=>{window.scrollTo(0,400);document.scrollingElement.scrollTop=400;});
  assertScrollLayout(await page.evaluate(scrollLayout,{selector}),top);
}
