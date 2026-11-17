# iOS-bovenrand: structurele scrollcorrectie

> Historisch verslag van build `a2363bc48019`. De gebruiker bevestigt juist op
> deze build nog startwaas. De stilstaande root was geen bewezen vereiste en de
> aparte app-scrollcontainer heeft het toestelprobleem niet opgelost. Zie de
> vergelijking met de werkende marathon-apps en de opvolgende correctie in
> [TESTVERSLAG-IOS-OPSTART.md](TESTVERSLAG-IOS-OPSTART.md).

## Versiecontrole en aanleiding

Onderzocht vanaf de actuele `origin/main`: `47abe8ec6cee2cd9c1533f2a8715fd5307f16422`, merge van PR #9. Het eerdere `TESTVERSLAG-DARK-MODE.md` is gelezen. De door GitHub als geslaagd gemelde Pages-publicatie gebruikt deze commit:
<https://github.com/Royo1010/Fitness-app/actions/runs/43708579892>.

De bron is met hetzelfde algoritme als `scripts/build-pages.mjs` gehasht: gesorteerde bestandsnamen, nulbyte en bestandsinhoud van `fitnessapp/dist`. Resultaat:

`a13373ed428f2f5c6995360eb5fe10133f42894d0bfc6993fdf83c74e171ad62`

Dat komt overeen met de door de gebruiker gemelde geïnstalleerde build `a13373ed428f`. Deze versie bevat het nieuwe donkere palet, de effen `body::before`-laag en de verwijdering van `dialog::backdrop`-blur. Het probleem wordt daarom als een nog bestaande scrollfout onderzocht. Het live `release.json` kon vanuit deze cloudomgeving niet onafhankelijk worden opgehaald: het Pages-domein wordt door de netwerkpolicy geblokkeerd. De vergelijking berust op de publicatierevisie, reproduceerbare bronhash en de door de gebruiker gemelde build.

## Aangetoonde tekortkoming van de vorige oplossing

De documentroot (`HTML`) was nog steeds het verticale scrollvlak. `#app` had geen eigen hoogte of overflow-begrenzing. `viewport-fit=cover` liet de pagina tot aan de schermrand lopen; de safe-area-afdekking schilderde alleen over de bovenste pixels. Zij wijzigde niet welk scrollvlak iOS voor scrollen/compositing ziet.

Een meting vóór de correctie, in Chromium met een echte CDP-override van `env(safe-area-inset-top)` naar 47px:

| Eigenschap | Voorheen | Na correctie bij dezelfde positie |
| --- | ---: | ---: |
| `window.scrollY` / root-scrollpositie | 457px | 0px |
| Bovenkant `#app` | -457px | 47px |
| `#app` overflow | visible | auto |
| `#app.scrollTop` | geen eigen scroll | 457px |
| Hoogte eigen viewport bij 844px scherm | geen begrenzing | 797px |
| Afdekkende `body::before` | 47px | verwijderd |

De oude proef plaatste tekst bewust vlak onder de afdekking en zocht naar CSS-filters. Dat kon slagen terwijl de pagina als geheel nog achter het systeemgedeelte doorliep. De melding van de gebruiker toont dat deze proef onvoldoende was.

Een native Safari/PWA-scroll-edge-effect is een passende verklaring voor de vervaging terwijl er geen CSS-blur op de tekst staat. **Het precieze native effect op de iPhone is hier niet gereproduceerd en de oorzaak op UIKit/compositorniveau is dus niet definitief bewezen.** Wel is de onbegrensde root-scrollarchitectuur aantoonbaar en nu structureel gewijzigd. Er wordt geen onbewezen CSS-opt-out voor iOS gebruikt.

## Codewijziging

- `dist/training.css`: `html` heeft geen scrollruimte; `body` is een vaste viewport met 100%-fallback en `100dvh` voor dynamische browserhoogten. Het bestaande `#app` is het begrensde overflow-scrollvlak, met bovenkant `env(safe-area-inset-top)`. De browser knipt inhoud buiten dat vlak af. Momentumscrolling en overscroll-containment staan op het eigen scrollvlak.
- De vaste afdekkende `body::before` is volledig verwijderd. Er is geen nieuwe overlay, gradient, masker, blur, transform of `will-change` toegevoegd.
- De bestaande bovenruimte blijft 22px onder de echte safe-area. De safe-area wordt niet nogmaals in Training, Schema of de mobiele topbar opgeteld. De topbar zelf blijft 56px. Onderste navigatie, padding voor de onderste safe-area en dialogen blijven behouden.
- `dist/styles.css`: `.shell` en `.boot` gebruiken de beschikbare containerhoogte in plaats van `100vh`. Daarmee creëren ze geen extra viewporthoogte onder de statusbalk.
- `dist/index.html`: het app-scrollvlak is focusbaar en benoemd voor toetsenbord-/hulpmiddelenbediening.
- `dist/app.mjs`: navigatie, openen van trainingen, afronden en scrollherstel gebruiken `#app.scrollTop`. Afvinken gebruikt de bestaande `scrollIntoView` in de nieuwe scrollancestor. Pauzeren/hervatten bewaart de echte app-scrollpositie. Focusherstel na een dialoog gebruikt `preventScroll`.

Het donkere kleurenpalet is niet aangepast. Programma-JSON, core/trainingslogica, opslagmodule, statistiek-/exportmodule, updatecoördinatie en PWA-manifest zijn bytegelijk aan de onderzochte main. Er is geen migratie of verwijdering van gegevens.

## Uitgevoerde tests

- 36 automatiseringstests geslaagd: `node --test .github/scripts/*.test.cjs`.
- 98 app-/gegevens-/publicatietests geslaagd: `npm --prefix fitnessapp test`.
- Productiebuild geslaagd: `npm --prefix fitnessapp run build:pages`.
- De bestaande volledige browserproef slaagt met Playwright 1.56.1 en Chromium 156: bediening, dubbel tikken, checklist, vier trainingen, keuzeoefeningen, records, uitleg, statistieken, geschiedenis, thema, import/export, opslagfouten, offlinegebruik en productie-updates met gegevensbehoud.
- `scripts/test-appearance.mjs` controleert nu de nieuwe scrollarchitectuur, met gedeelde DOM-probes in `scripts/scroll-layout.mjs`. De oude afdekkingsasserties zijn vervangen.

### Chromium

Werkelijke CDP-insetoverride van 0/47px boven en 34px onder, beide thema's en zes schermen. Gecontroleerd: root blijft nul en heeft geen scrollruimte; appviewport begint bij de inset en volgt de viewporthoogte; geen horizontale overflow; gedeeltelijk uit beeld geschoven tekst is buiten de viewport niet meer hit-testbaar; zichtbare tekst blijft bereikbaar; geen filters/maskers in de voorouders en geen pseudo-afdekking. De oorspronkelijke 22px bovenruimte wordt expliciet gemeten.

Extra gevallen: 320×568, 390×500, 844×390 en 390×844, PageDown, een gesynthetiseerde touchscroll, focus op lage invoer, pauzeren/hervatten zonder scrollsprong, dialoogscroll en sluiten zonder verplaatsing van de achtergrond. Ook pogingen om via `window.scrollTo` de root te verplaatsen laten die op nul staan.

Dit is geen reproductie van de native iOS-systeembalk of zijn blur-effect.

### Echte WebKit-engine op Linux

De gebruikelijke Playwright-WebKit-download is geprobeerd maar wordt door de cloudnetwerkpolicy geweigerd. Daarom is aanvullend **WebKitGTK MiniBrowser 2.52.6** met zijn W3C WebDriver gebruikt, verkregen uit de toegestane Debian-pakketten. De testinstallatie staat alleen onder `/tmp`; resourcepaden in de tijdelijke library zijn naar die tijdelijke directory verplaatst. Er zijn geen systeem- of projectbrowserprofielen gebruikt.

`scripts/test-webkit-scroll.mjs` is tegen het echte `.pages-dist`-productie-artifact uitgevoerd en slaagt. Dezelfde nieuwe proef is ook tegen een apart opgebouwde kopie van de oude publicatie `a13373ed428f` uitgevoerd. Daar faalt hij zoals verwacht op “Root heeft geen eigen verticale scrollruimte”. De nieuwe controle detecteert dus daadwerkelijk het ontbrekende structurele deel van de oude oplossing. Beide thema's, zes schermen, gedeeltelijke clipping, root-scrollpogingen, dialogen, toetsenbord/focus, window-resize en ongewijzigde IndexedDB-staat zijn gecontroleerd. De gecontroleerde productiebuild is `a2363bc48019…`.

GTK dwingt een minimale vensterbreedte af: de feitelijke eerste viewport was 447×806, resizegevallen 447×530, 447×462, 844×352 en 447×806. De 47px-inset is hier een expliciete CSS-testwaarde; het is geen echte iPhone-`env()`-waarde. Dit is **geen iOS Safari en geen geïnstalleerde iPhone-standalone-PWA**. Het bewijst WebKit-layout en scrollbegrenzing, niet het verdwijnen van native iOS-blurpixels.

### Reproduceren

De standaard Chrome-proef blijft de bestaande CI-ingang:

```sh
CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_MODULE=/tmp/ritme-browser/node_modules/playwright/index.mjs node fitnessapp/scripts/test-browser.mjs
```

Voor WebKitGTK: start een beschikbare `WebKitWebDriver --port=9515` en serveer de productiebuild via `scripts/serve.mjs` met `RITME_SERVE_ROOT` naar `.pages-dist`. Daarna:

```sh
RITME_BROWSER_URL=http://127.0.0.1:4194/Fitness-app/ WEBKIT_WEBDRIVER_URL=http://127.0.0.1:9515 npm --prefix fitnessapp run test:webkit-scroll
```

Als de driver een afwijkend MiniBrowser-pad nodig heeft, geef dat mee als `WEBKIT_BROWSER_BINARY`. De test maakt en sluit zelf een automation-sessie. De driver en testserver moeten afzonderlijk worden gestopt. Zonder beschikbare driver faalt deze aanvullende proef zichtbaar; hij wordt niet stilzwijgend als geslaagd overgeslagen.

Screenshots: `/tmp/ritme-ios-scroll-before.png`, `/tmp/ritme-ios-scroll-after.png`, `/tmp/ritme-edge-{light,dark}-{0,47}.png` en `/tmp/ritme-webkit-scroll-{light,dark}-{0,47}.png`.

## Nog op de fysieke iPhone 13 Pro te bewijzen

Er is hier geen fysieke iPhone, iOS-simulator of native standalone-PWA beschikbaar. Deze wijziging is een geïmplementeerde en in twee engines geteste structurele correctie, **geen definitief bewezen oplossing van het native iPhone-effect**.

Na merge en een geslaagde Pages-publicatie:

1. Gebruik in de bestaande app Instellingen → App-updates → Controleer op updates → Update installeren. Controleer dat de build verandert van `a13373ed428f` naar de nieuwe build; voor deze bron is dat `a2363bc48019`. Wis geen sitegegevens.
2. Herhaal precies het probleem: scroll langzaam en met snelle vegen omhoog langs oefeningstitels. Tekst hoort scherp te blijven tot zij aan de bovenste zichtbare rand wordt afgeknipt, zonder een wazige band eronder.
3. Vergelijk licht/donker, Training, Schema en een lange oefenuitleg. Controleer ook de geïnstalleerde beginschermapp naast Safari met zichtbare/ingeklapte browserbediening.
4. Controleer statusbalk, eventueel tikken op de statusbalk om omhoog te gaan, onderste navigatie, lage invoervelden met toetsenbord, draaien van het toestel, afvinken en hervatten. De native keyboard-/statusbarinteracties kunnen hier niet worden afgetekend.

De iOS-versie en of het effect in beide openmodi optreedt zijn aan de gebruiker gevraagd; deze gegevens waren bij het vastleggen van dit verslag nog niet beschikbaar.
