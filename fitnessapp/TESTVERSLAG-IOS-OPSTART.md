# Ritme: startwaas vergelijken met de werkende marathon-PWA's

> Achterhaald door toestelfeedback: na PR #11 bleef de waas permanent zichtbaar.
> De overeenkomst met de marathon-apps bleek onvoldoende onderbouwing voor deze
> wijziging. De productieonderdelen worden teruggedraaid volgens de expliciete
> terugvalopdracht; zie [HERSTEL-PR11.md](HERSTEL-PR11.md). De onderstaande
> geslaagde Linux-proeven hebben de native iPhone-waas niet gereproduceerd.

## Gecontroleerde versies

Onderzocht op 17 november 2026, vanaf de actuele `origin/main`:

- Fitness-app: `1fe58ed21025dfd7295bc0e6d18afb72ed50c62b`, merge van PR #10.
- marathon03-08-2026: `0484ab457e5fdda0b7504922124a060805bf0dc9`.
- marathon-330: `107da7bbe9f3b6fa8f4b9cb0de161880b02f1988`.

De marathon-repositories zijn uitsluitend gelezen. Hun interface, opslagcode en
serviceworkers zijn niet gekopieerd. `TESTVERSLAG-DARK-MODE.md` en het eerdere
`TESTVERSLAG-IOS-SCROLL.md` zijn gelezen; dit verslag vervangt hun hypothese over
de nog bestaande vervaging.

De gebruiker bevestigt nu **2.2.0 · build `a2363bc48019`**. De bron op main heeft
de reproduceerbare inhoudshash
`a2363bc480195cf6b46ed82008f9d39247b7840f61f6acbb52c7227a428ddbe6`.
De [Pages-run voor die merge](https://github.com/Royo1010/Fitness-app/actions/runs/44072828744)
meldt succes. Deze versie bevat het nieuwe donkere palet, de verwijderde
`body::before`-afdekking en de vorige correctie met een apart app-scrollvlak.
Dit is dus geen achtergebleven installatie van build `a13373ed428f`.

Het live Pages-`release.json` is vanuit deze omgeving niet onafhankelijk
bereikbaar. De versiecontrole berust op de actuele main, de inhoudshash, de
zichtbare publicatierun en het door de gebruiker afgelezen buildnummer.
De precieze iOS-versie is nog niet bekend.

## Daadwerkelijke verschillen

| Onderdeel | Ritme vóór deze wijziging | marathon03-08-2026 | marathon-330 |
| --- | --- | --- | --- |
| Pagina-scrollvlak | `#app`, absolute positie, `overflow-y:auto` | Document | Document |
| Document/body | HTML: vaste 100%-hoogte, overflow hidden; body: fixed, 100%/100dvh, overflow hidden | Normale flow, minimumhoogten | Normale flow, minimumhoogten |
| Safe-area boven | Bovenrand eigen appviewport op de inset | Padding van sticky bovenbalk | Padding van sticky bovenbalk |
| Viewport | `viewport-fit=cover` | Hetzelfde | Hetzelfde |
| PWA-weergave | standalone | standalone | standalone |
| Apple-statusbalk | default | default | black-translucent |
| Pagina-/themakleur | Licht `#eef2f5`, donker `#131917`; meta nog `#1d4239` | Beide `#f3f6f8` | Beide `#0f141a` |
| Eerste inhoud | Laadscherm; programma en IndexedDB asynchroon; thema pas daarna | Statische shell/bovenbalk, synchrone render vóór PWA-services | Statische shell/bovenbalk, synchrone render vóór SW-registratie |
| Startscrollopdracht | `app.scrollTop=0` na eerste render | Geen gemeten startopdracht | Geen gemeten startopdracht |

De laatste CSS-override van marathon03 schakelt backdrop-blur van de bovenbalk
uit. marathon-330 heeft juist een eigen sticky balk met `blur(16px)`. De
aanwezigheid van CSS-backdrop-blur op zichzelf verklaart dit verschil dus niet.
Ritmes normale Training-scherm heeft geen blijvende bovenbalk. De referenties
verschillen ook daarin: zij zijn geen gecontroleerd experiment met één variabele.

## Hypothese en gecontroleerde varianten

Het specifieke symptoom is nu **waas bij openen, die na enkele korte scrolls
verdwijnt**. De sterkste werkhypothese is een probleem bij de initiële
scroll-/randcompositing van de iOS-standalone-shell: de documentroot staat stil,
terwijl een tweede, asynchroon gevulde overflow-laag moet scrollen. De afwijkende
themakleur en de late achtergrondinitialisatie zijn aanvullende ongunstige
startcondities. Het verdwijnen na scrollen past bij opnieuw opgebouwde
scroll/compositorinformatie, maar bewijst dit mechanisme niet.

Er is geen native iOS-waas gereproduceerd. We kunnen dus niet bewijzen welke
UIKit/WebKit-laag de waas tekent of dat themakleur de waas veroorzaakt. De
werkende apps laten bovendien zien dat document-scrolling niet op zichzelf
een fout is. De eerdere conclusie dat een stilstaande root noodzakelijk was,
was te sterk en is door de toestelmelding niet bevestigd.

Vier tijdelijke kopieën van dezelfde Ritme-bron zijn afzonderlijk gemeten:
huidige code, alleen document-flow, alleen vroege kleurinitialisatie, combinatie.
Het laden van `program.json` is vertraagd om de beginweergave te observeren.
Chromium: 390×844, CDP-inset 47px. WebKitGTK: feitelijk 447×806, synthetische
CSS-inset 47px. Metingen gebeurden vóór tikken of scrollen.

| Variant | Body / app-overflow bij starten | Root-/apphoogte na laden, Chromium | Meta sluit aan op pagina | Startscrollaanroepen |
| --- | --- | --- | --- | --- |
| Huidige code | fixed / auto | 844 / 797px | Nee | 1× app.scrollTop=0 |
| Alleen document-flow | static / visible | 2568 / 2521px | Nee | 0 |
| Alleen kleurinitialisatie | fixed / auto | 844 / 797px | Ja | 1× app.scrollTop=0 |
| Combinatie | static / visible | 2568 / 2521px | Ja | 0 |

WebKit bevestigde dezelfde scheiding tussen de varianten; de uiteindelijke
productieproef houdt het programma expliciet vast totdat startframes zijn
gemeten. Zo is de proef niet afhankelijk van toevallig snelle netwerklading.
Deze metingen onderbouwen de architectuurkeuze, niet een claim over native
iPhone-blurpixels. De gekozen combinatie sluit aan bij beide werkende apps en
verwijdert de afwijkende startcondities zonder hun interface over te nemen.

## Implementatie

- `dist/training.css`: normale document-scrolling vanaf de eerste weergave.
  Geen fixed body, vastgezette root of absoluut overflow-scrollvlak voor `#app`.
  De safe-area is gewone body-padding, één keer toegepast. `100vh`/`100dvh`
  bepalen minimumhoogten in normale flow; zij zetten de viewport niet vast.
  De bestaande 22px bovenruimte blijft behouden. Onderste navigatie, zijbalk,
  dialoogbegrenzing en onderste safe-area blijven behouden.
- `dist/app.mjs`: navigatie en pauze/herstel gebruiken de document-scrollpositie.
  Alleen de reset na de eerste render is verwijderd. Er is geen scroll-nudge,
  gesimuleerde gebruikersbeweging of timer toegevoegd aan de app. De gewone
  scrollopdrachten na een gebruikersactie, waaronder naar de volgende oefening,
  blijven werken. `applyTheme()` synchroniseert nu ook de themakleur met `--bg`.
- `dist/index.html`: een klein synchroon head-script kiest vóór modules en
  IndexedDB een bijpassende systeemachtergrond/themakleur. Zodra de opgeslagen
  voorkeur beschikbaar is, krijgen pagina en metadata samen dat thema. Dit
  introduceert geen tweede voorkeurenopslag. Bij een afwijkende opgeslagen
  voorkeur kan het laadscherm dus kort het systeemthema gebruiken.
- `dist/manifest.webmanifest`: achtergrond- en themakleur volgen de bestaande
  lichte paginakleur. ID, start-URL, scope, display, iconen en websiteadres zijn
  ongewijzigd. iOS kan manifest-/startschermkleuren afzonderlijk cachen; dat
  wordt niet opgelost door gebruikersgegevens te wissen of de app te verwijderen.

Er is geen nieuwe afdeklaag, verloop, masker of blur toegevoegd. De donkere en
lichte paletten zijn niet gewijzigd. Programma, core/trainingslogica,
opslagmodule, statistiek/exportmodule, updatecoördinatie en serviceworker zijn
bytegelijk aan de onderzochte main. Geen datamigratie of verwijdering.

## Validatie

- 36 automatiseringstests en 98 apptests geslaagd.
- Productiebuild geslaagd, inhoudshash
  `5e2228d495fbff02a0f1192be9c965f7a83a8906d3af261d048611bff782176b`.
- Volledige Chromium-browserproef geslaagd: 320–1024px, snelle plus/min,
  dubbel tikken, checklist, vier trainingen/keuze, gidsen, statistieken,
  geschiedenis, import/export, opslagfouten, offlinegebruik en echte
  productie-updates A→B met bewaarde gegevens.
- `scripts/test-startup.mjs`: programma bewust geblokkeerd tijdens beginframes;
  eerste opening én herladen; beide systeemthema's en een tegenovergestelde
  opgeslagen voorkeur. Controleert document-flow, één inset, passende
  achtergrond/meta en nul aanroepen van scrollTo/scrollBy/scrollIntoView of
  scrollTop-setters tijdens opstarten. De opgeslagen staat blijft exact gelijk.
  In een eigen context wordt alleen de standalone-JS-vlag ingesteld; dit
  emuleert niet de native iOS-shell. Dezelfde nieuwe proef faalt op de oude
  architectuur met “Body is bij de eerste weergave niet vastgezet”.
- `scripts/scroll-layout.mjs` en `test-appearance.mjs`: één document-scrollvlak,
  geen horizontale overflow, zichtbare tekst aan de viewport-rand, geen
  filters/maskers, licht/donker, zes schermen, aanraking, toetsenbord/focus,
  viewport-resize, dialogen en gegevensbehoud. De oude eis “root blijft nul”
  is bewust vervangen door de nieuwe architectuurcontrole.
- `scripts/test-webkit-scroll.mjs`: geslaagd op het echte productie-artifact
  met **WebKitGTK MiniBrowser 2.52.6** en zijn W3C-driver. Een lokale testproxy
  voegt uitsluitend de observer en expliciete testwaarden voor inset,
  kleurvoorkeur en standalone-vlag aan de HTML toe; de app-assets blijven
  dezelfde productie-assets. Het programma blijft vastgehouden tot de eerste
  frames gecontroleerd zijn, ook bij herladen. Daarna volgt de gewone
  productie-URL met beide thema's, zes schermen, 0/47px, dialogen,
  toetsenbord/focus, resize en ongewijzigde IndexedDB-staat.

De volledige Chromium-proef blijft de bestaande CI-ingang:

```sh
CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_MODULE=/tmp/ritme-browser/node_modules/playwright/index.mjs node fitnessapp/scripts/test-browser.mjs
```

Voor de aanvullende WebKit-proef: bouw Pages, serveer `.pages-dist` met
`scripts/serve.mjs` via `RITME_SERVE_ROOT` en start een beschikbare
`WebKitWebDriver`. Voer daarna uit:

```sh
RITME_BROWSER_URL=http://127.0.0.1:4214/Fitness-app/ WEBKIT_WEBDRIVER_URL=http://127.0.0.1:9518 npm --prefix fitnessapp run test:webkit-scroll
```

Een afwijkend MiniBrowser-pad kan via `WEBKIT_BROWSER_BINARY`. De benodigde
driver moet beschikbaar zijn; de proef wordt niet stilzwijgend overgeslagen.
De tijdelijke WebKit-installatie onder `/tmp` is beschreven in het vorige
scrollverslag. GTK dwingt hier minimaal 447px breedte af; de feitelijke
resizegevallen waren 447×530, 447×462, 844×352 en 447×806.

## Nog op de iPhone te bevestigen

Er is geen fysieke iPhone, iOS-simulator of native Safari-standalone-shell
beschikbaar. Dit is een geteste structurele correctie op basis van de
referentie-apps, **geen definitief bewezen oplossing van het native effect**.

Na merge en succesvolle Pages-publicatie:

1. Installeer via Meer → Instellingen → App-updates. Controleer build
   **`5e2228d495fb`**, in plaats van `a2363bc48019`. Wis geen sitegegevens en
   verwijder de bestaande beginschermapp niet.
2. Sluit Ritme via de appkiezer en open opnieuw vanaf het beginscherm. Raak
   het scherm eerst circa tien seconden niet aan: controleer juist deze
   beginweergave op waas. Herhaal ook na een volledige sluiting en in beide thema's.
3. Vergelijk daarna korte en lange scrollbewegingen langs oefeningstitels,
   Schema en oefenuitleg. Controleer statusbalk, onderste navigatie en draaien.
4. Controleer lage invoervelden met toetsenbord, plus/min, afvinken,
   pauzeren/hervatten en je bestaande geschiedenis/voortgang. Vergelijk de
   beginschermapp met Safari. Native keyboard-, statusbalk- en compositinggedrag
   kunnen hier niet worden afgetekend.
