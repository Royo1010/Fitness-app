import assert from 'node:assert/strict';

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
      // Override the actual env() value, not the CSS being tested.
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
          await checkEdge(page, target, top);
          if (view === 'home') await page.screenshot({ path: `/tmp/ritme-edge-${theme}-${top}.png` });
        }
        await page.locator('.more-list [data-page="settings"]').click();
        await paint();
        await checkEdge(page, '.settings-grid h2', top);
        await page.locator('.mobile-nav [data-page="library"]').click();
        await paint();
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
        await page.locator('#modal [data-action="close-modal"]').first().click();
      }
    }
    assert.deepEqual(await savedState(), before, 'Weergavecontrole verandert geen opgeslagen gegevens');
    console.log('Weergave geslaagd: licht/donker, invoercontrast, scherpe scrollrand, zes schermen, dialoog en 0/47px iPhone-safe-area.');
  } finally {
    await context.close();
  }
}

async function checkEdge(page, selector, top) {
  const target = page.locator(selector).first();
  await target.evaluate((el, top) => { scrollTo(0, scrollY + el.getBoundingClientRect().top - top - 2); }, top);
  const edge = await target.evaluate(el => {
    const cap = getComputedStyle(document.body, '::before');
    const rect = el.getBoundingClientRect();
    const layers = [];
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      layers.push({ filter: style.filter, backdrop: style.backdropFilter, mask: style.maskImage, opacity: style.opacity });
    }
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(4, rect.height / 2));
    return { capHeight: parseFloat(cap.height), capBackground: cap.backgroundColor, capImage: cap.backgroundImage, capFilter: cap.backdropFilter, capPosition: cap.position, capTop: cap.top, capPointer: cap.pointerEvents, targetTop: rect.top, hit: hit === el || el.contains(hit), layers };
  });
  assert.equal(edge.capHeight, top, 'Afdekking blijft precies binnen de safe-area');
  assert.equal(edge.capImage, 'none');
  assert.equal(edge.capFilter, 'none');
  assert.match(edge.capBackground, /^rgb\(/, 'Afdekking is ondoorzichtig');
  assert.equal(edge.capPosition, 'fixed');
  assert.equal(edge.capTop, '0px');
  assert.equal(edge.capPointer, 'none');
  assert.ok(edge.targetTop >= top, 'Zichtbare tekst valt buiten de statusbalk');
  assert.ok(edge.hit, 'Geen bediening of overlay over de zichtbare tekst');
  for (const layer of edge.layers) assert.deepEqual(layer, { filter: 'none', backdrop: 'none', mask: 'none', opacity: '1' });
}
