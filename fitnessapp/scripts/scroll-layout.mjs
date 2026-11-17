import assert from 'node:assert/strict';

// Shared DOM probes for Chromium/Playwright and WebKitGTK/WebDriver.
// These measure clipping and scroll ownership, not native iOS blur pixels.
export function positionAtEdge({ selector, offset = 2 }) {
  const el = document.querySelector(selector), app = document.querySelector('#app');
  app.scrollTop += el.getBoundingClientRect().top - app.getBoundingClientRect().top - offset;
}

export function scrollLayout({ selector }) {
  const el = document.querySelector(selector), app = document.querySelector('#app');
  const rect = el.getBoundingClientRect(), viewport = app.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const within = y => {
    const hit = document.elementFromPoint(x, y);
    return hit === el || Boolean(hit && el.contains(hit));
  };
  const layers = [];
  for (let node = el; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    layers.push({ filter: style.filter, backdrop: style.backdropFilter || style.webkitBackdropFilter || 'none', mask: style.maskImage || style.webkitMaskImage || 'none', opacity: style.opacity });
  }
  return {
    windowY: window.scrollY, rootTop: document.scrollingElement.scrollTop,
    rootHeight: document.scrollingElement.clientHeight, rootScrollHeight: document.scrollingElement.scrollHeight,
    appTop: viewport.top, appBottom: viewport.bottom, appScroll: app.scrollTop,
    appHeight: app.clientHeight, appWidth: app.clientWidth, appScrollWidth: app.scrollWidth,
    overflow: getComputedStyle(app).overflowY, viewportHeight: innerHeight,
    cap: getComputedStyle(document.body, '::before').content,
    targetTop: rect.top, targetBottom: rect.bottom,
    hitVisible: within(Math.max(viewport.top + 1, rect.top + 1)),
    hitAbove: viewport.top > 0 ? within(viewport.top - 1) : false,
    layers,
  };
}

export function assertScrollLayout(layout, top) {
  assert.equal(layout.windowY, 0, 'Document blijft stilstaan');
  assert.equal(layout.rootTop, 0, 'Root is niet het scrollvlak');
  assert.ok(layout.rootScrollHeight <= layout.rootHeight, 'Root heeft geen eigen verticale scrollruimte');
  assert.equal(layout.overflow, 'auto', 'App heeft het echte overflow-scrollvlak');
  assert.ok(Math.abs(layout.appTop - top) < 1, 'Scrollvlak begint direct onder de safe-area');
  assert.ok(Math.abs(layout.appBottom - layout.viewportHeight) < 1, 'Scrollvlak volgt de zichtbare viewporthoogte');
  assert.ok(layout.appScrollWidth <= layout.appWidth, 'Geen horizontale inhoud buiten het scrollvlak');
  assert.equal(layout.cap, 'none', 'Geen afdekkende pseudo-laag');
  assert.equal(layout.hitAbove, false, 'Tekst wordt echt afgeknipt buiten het scrollvlak');
  assert.ok(layout.hitVisible, 'Zichtbare tekst blijft bereikbaar binnen het scrollvlak');
  for (const layer of layout.layers) assert.deepEqual(layer, { filter:'none', backdrop:'none', mask:'none', opacity:'1' });
}
