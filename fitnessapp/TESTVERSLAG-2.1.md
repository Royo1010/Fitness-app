# Ritme 2.1 — verificatie

## Uitgevoerd

- `npm test`: 75 tests geslaagd, 0 mislukt/overgeslagen. De bestaande rotatie-, back-up-, statistiek- en Pages-tests blijven actief. Zes nieuwe tests controleren één beste set, onafhankelijk afvinken, stabiele volgorde, heropenen, geldige afstand/tijd/lichaamsgewicht, behoud van historische losse sets/notities, PR bij gelijke gewichten en validatie van nieuwe optionele velden.
- `npm run build:pages`: geslaagd. De build gebruikt de pakketversie 2.1.0 en een inhoudshash voor de gegenereerde PWA-cache; bronbestanden blijven behouden.
- `actionlint` 1.7.7: geslaagd voor `.github/workflows/deploy.yml`.
- Automatische Chromium-browserproef met mobiele instellingen 390 × 844 CSS-pixels, touch, pixelschaal 3 en Europe/Amsterdam. Ook 320 pixels breed gecontroleerd op horizontale overloop.

De browserproef controleert:

1. Training opent zonder app-header, warming-upkaart en notitiesectie, met acht invoerregels voor acht oefeningen.
2. Gewicht/herhalingen invoeren vinkt de oefening niet automatisch af. Rechtstreeks typen, komma-invoer en plusknop werken.
3. Afvinken verplaatst de oefening onder de open oefeningen; oorspronkelijke indices en volgorde blijven behouden.
4. De eerste drie oefeningen afvinken, herladen, het hele browserproces sluiten en met hetzelfde profiel openen: oefening 4 staat bovenaan, gegevens blijven bewaard.
5. Een oefening opnieuw activeren behoudt haar prestatie en herstelt haar positie tussen de open oefeningen.
6. Farmer’s carry bewaart 30 kg per hand en 25 meter.
7. De eigen oefenillustratie laadt in de details, ook offline.
8. Zonder invoer afvinken maakt geen setprestatie aan. De oefening kan wel worden afgerond.
9. Na acht vinkjes verschijnt de compacte afrondmelding. Training afronden bewaart de sessie en selecteert Upper A1 binnen dezelfde week.
10. Offline herladen, Schema en Statistieken werken. De voltooide training en werkelijk geregistreerde gewichten zijn zichtbaar.
11. Een oude sessie met meerdere individuele sets en notities wordt via dezelfde IndexedDB-opslag ingelezen en in de historie/details geopend. Alle oorspronkelijke waarden blijven byte-voor-byte gelijk bij die weergave.
12. Een gesimuleerde opslagfout verschijnt in een waarschuwing zonder permanente opslagheader. Na herstel en Opnieuw opslaan verdwijnt de fout.
13. Geen JavaScript-pageerrors tijdens deze proef.

De proeven gebruiken eigen tijdelijke browserprofielen en een server met testdatum **30 november 2026**. Productiebestanden bevatten geen geïnjecteerde testklok. Er zijn geen persoonlijke trainingsgegevens gebruikt of gewist.

## Reproduceren

Vanuit `fitnessapp/`, met Node.js 24 en een beschikbare Chromium-browser:

```sh
npm test
npm run build:pages
npm install --prefix /tmp/ritme-browser --no-audit --no-fund playwright@1.56.1
CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_MODULE=/tmp/ritme-browser/node_modules/playwright/index.mjs node scripts/test-browser.mjs
```

De browsertest start en stopt zelf een geïsoleerde server op een vrije poort en verwijdert alleen zijn eigen tijdelijke browserprofiel. Gebruik `RITME_BROWSER_URL` alleen met een eigen geïsoleerde testserver en de bovengenoemde testdatum. Zonder `CHROMIUM_PATH` gebruikt Playwright zijn geïnstalleerde Chromium. De CI-workflow installeert deze browser expliciet en voert dezelfde proef uit vóór het Pages-artifact wordt gemaakt.

## Grenzen en publicatie

Dit is mobiele browseremulatie, geen proef op een fysieke iPhone 13 Pro/Safari. De iPhone-safe-area blijft via CSS `env(safe-area-inset-*)` ondersteund; fysieke beginscherminstallatie en iOS-opslagbeleid zijn niet op een echt toestel getest.

Slechts één originele, kleine SVG (Standing calf raise) is toegevoegd. Voor andere oefeningen zijn geen onbevestigde of mogelijk onjuiste beelden gebruikt. Alle technische tekstuitleg blijft beschikbaar. Zie `ILLUSTRATIES.md` voor herkomst en gebruiksrechten.

De bestaande GitHub Actions-pipeline is uitgebreid met de browsertest en blijft alleen na een geslaagde run op main publiceren op `/Fitness-app/`. Een lokale build bewijst geen uitgevoerde GitHub-publicatie. Controleer na merge de Actions-run en vervolgens `release.json` op het bestaande websiteadres. Gebruik de updateknop van de PWA; wis geen sitegegevens.
