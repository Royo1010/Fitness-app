# Ritme 2.2 — Dark Mode en scherpe bovenrand

## Gecontroleerde bron

Voor wijzigingen is `origin/main` opnieuw opgehaald en vergeleken met de checkout:
`69b5d10b6df4b750c94f6d7b6eec29806549cc89` (merge van PR #8).
`package.json` vermeldt 2.2.0. `dist` is de actuele bronmap, zoals ook beschreven in
`scripts/build-pages.mjs`. Het bestaande `TESTVERSLAG-UX-UPDATES.md` is gecontroleerd.

## Wijzigingen

- Alleen Dark Mode krijgt een antracietpalet met groene ondertoon: pagina
  `#131917`, kaarten `#242e29`, invoer `#111a15`, turquoise accent `#71dfc5`.
  Tekst, hulptekst, placeholders, focus, invoerranden, grafieken en rusttimer
  sluiten daarop aan. Afgeronde kaarten houden herkenbare donkere invoervelden.
- De lichte kleurwaarden en spiergroeplabels zijn behouden. De gezamenlijke
  correctie voor de bovenrand geldt voor beide thema's.
- Een effen, vaste `body::before` bedekt uitsluitend
  `env(safe-area-inset-top)`. Geen extra hoogte, verloop, masker of blur; de laag
  onderschept geen aanrakingen. Training en Schema krijgen hun normale 22px
  bovenruimte **naast** de safe-area. Mobiele dialogen blijven eronder.
- De bestaande dimlaag van dialogen blijft behouden; de bijbehorende
  `backdrop-filter: blur(4px)` is verwijderd.

## Onderzoek naar de vervaging

De bron bevatte geen bovenste fade-gradient, tekstmasker of vaste blur-header.
De enige CSS-blur stond op `dialog::backdrop`. De gradient in de statistiek-SVG
kleurt alleen de oppervlakte onder de grafieklijn en bedekt geen schermtekst.
De sticky dialoogheader heeft een effen kaartachtergrond.

`viewport-fit=cover` blijft behouden, evenals de PWA-identiteit en
`apple-mobile-web-app-status-bar-style=default`. De bestaande bovenmarge was een
minimum (`max(22px, safe-area)`), geen blijvende afdekking tijdens scrollen.
Daarom kon inhoud onder de statusbalk terechtkomen.

WebKit beschrijft dat Safari zelf een zachte blur onder de browserbediening kan
toepassen en effen achtergronden aan vaste schermranden kan doortrekken:
<https://bugs.webkit.org/show_bug.cgi?id=301756#c2>.
Dit ondersteunt de safe-area-correctie; de precieze oorzaak op het toestel van
de gebruiker is zonder fysieke reproductie niet bewezen. Er wordt geen
browserinstelling gewijzigd en geen niet-bestaande CSS-opt-out voor Safari geclaimd.

## Validatie

- `node --test .github/scripts/*.test.cjs`: 36 geslaagd.
- `npm --prefix fitnessapp test`: 98 geslaagd.
- `npm --prefix fitnessapp run build:pages`: geslaagd; apart `.pages-dist`-artifact
  met automatisch nieuwe inhoudshash, zonder bronbestanden te overschrijven.
- De volledige `scripts/test-browser.mjs` met Playwright 1.56.1 en lokaal
  Chromium slaagt: 320/390/430/1024px, bediening, checklist, vier trainingen,
  keuzeoefeningen, 37 gidsen, statistieken, historie, import/export, opslagfouten,
  offlinegebruik en de volledige productie-updateproef met gegevensbehoud.
- Nieuwe `scripts/test-appearance.mjs`, aangeroepen door dezelfde browserproef:
  390 × 844, pixelschaal 3, licht/donker, zes schermen en dialogen. CDP simuleert
  de echte `env()`-waarden met 0/47px boven en 34px onder. De proef controleert
  de begrenzing en ondoorzichtigheid van de afdekking, zichtbare tekst na scrollen,
  afwezigheid van filters/maskers op tekst, invoercontrast, afgeronde velden en
  ongewijzigde opgeslagen gegevens in een eigen browsercontext.
- Donkere hoofdtekst op kaarten: 12,71:1; hulptekst op kaarten: 8,12:1;
  invoerranden tegen velden: 4,04:1 en tegen kaarten: 3,19:1.
- Zes volledige Light Mode-screenshots (Training, Schema, Statistieken,
  Oefeningen, Meer, Instellingen) zijn bij 0px safe-area bytegelijk aan
  screenshots van dezelfde `main`-bron. De gedeelde safe-area-/dialoogcorrectie
  is hiervan uitgezonderd. Donkere en lichte scrollscreenshots zijn bekeken.

Programma-JSON, opslag-, statistiek-, sessie- en updatecode, pakketversie en
manifest zijn ongewijzigd. Er is geen migratie, reset of wijziging van
trainingsgegevens. Alle browserproeven gebruiken geïsoleerde testcontexten.

## Nog op het echte toestel

Er is geen fysieke iPhone 13 Pro/Safari beschikbaar. Controleer na publicatie
scrollen in Safari en de geïnstalleerde PWA, in beide thema's, met de statusbalk
en browserbalk zichtbaar/ingeklapt. Controleer Training, Schema en een lange
oefenuitleg; zichtbare tekst hoort scherp te blijven tot aan de safe-area.
Installeer de update via de bestaande app-updatefunctie; wis geen sitegegevens.
