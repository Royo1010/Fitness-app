import assert from 'node:assert/strict';

// Shared probes for Chromium/Playwright and WebKitGTK/WebDriver. These measure
// native document scroll ownership, not pixels produced by the iOS system UI.
export function positionAtEdge({ selector, offset = 2 }) {
  const el = document.querySelector(selector);
  window.scrollBy(0, el.getBoundingClientRect().top - offset);
}

export function scrollLayout({ selector }) {
  const el = document.querySelector(selector), app = document.querySelector('#app');
  const rect = el.getBoundingClientRect(), viewport = app.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const hit = document.elementFromPoint(x, Math.max(1, rect.top + 1));
  const layers = [];
  for (let node = el; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    layers.push({ filter: style.filter, backdrop: style.backdropFilter || style.webkitBackdropFilter || 'none', mask: style.maskImage || style.webkitMaskImage || 'none', opacity: style.opacity });
  }
  return {
    windowY: window.scrollY, rootTop: document.scrollingElement.scrollTop,
    rootHeight: document.scrollingElement.clientHeight, rootScrollHeight: document.scrollingElement.scrollHeight,
    rootOverflow: getComputedStyle(document.documentElement).overflowY,
    bodyPosition: getComputedStyle(document.body).position,
    appTop: viewport.top, appScroll: app.scrollTop,
    appWidth: app.clientWidth, appScrollWidth: app.scrollWidth,
    overflow: getComputedStyle(app).overflowY,
    cap: getComputedStyle(document.body, '::before').content,
    targetTop: rect.top, targetBottom: rect.bottom,
    hitVisible: hit === el || Boolean(hit && el.contains(hit)),
    layers,
  };
}

export function assertScrollLayout(layout, top) {
  assert.equal(layout.windowY, layout.rootTop, 'Het document is het enige pagina-scrollvlak');
  assert.ok(layout.rootScrollHeight >= layout.rootHeight);
  assert.notEqual(layout.rootOverflow, 'hidden', 'Root-scrolling is vanaf het openen beschikbaar');
  assert.equal(layout.bodyPosition, 'static', 'Body is geen vaste viewport');
  assert.equal(layout.overflow, 'visible', 'App maakt geen tweede overflow-scrollvlak');
  assert.equal(layout.appScroll, 0, 'App heeft geen eigen scrollpositie');
  assert.ok(Math.abs(layout.appTop + layout.windowY - top) < 1, 'Safe-area is één keer gewone documentruimte');
  assert.ok(layout.appScrollWidth <= layout.appWidth, 'Geen horizontale overflow');
  assert.equal(layout.cap, 'none', 'Geen afdekkende pseudo-laag');
  assert.ok(layout.hitVisible, 'Zichtbare tekst blijft bereikbaar aan de viewport-rand');
  for (const layer of layout.layers) assert.deepEqual(layer, { filter:'none', backdrop:'none', mask:'none', opacity:'1' });
}
