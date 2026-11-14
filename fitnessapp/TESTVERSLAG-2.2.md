# Ritme 2.2 — verificatie

## Bronnen en behoud

De drie aangeleverde bestanden staan ongewijzigd in `sources/`. De JSON is leidend; de leesbare bron levert de volledige nieuwe row-techniek. De app normaliseert de bestaande oefening-ID’s om oude historie te behouden. Alle 35 bestaande gedetailleerde instructies blijven inhoudelijk exact gelijk; deadlift en barbell row voegen twee eigen beschrijvingen en ID’s toe.

`dist/program.json` bevat de nieuwe voorschriften. `core.mjs` bewaart bestaande sessies met hun eigen instructie- en voorschriftsnapshots. Een gewijzigde keuze bewaart gelogde gegevens als `archivedExercises` bij dezelfde sessie. Die gegevens blijven bereikbaar in statistieken en exports en keren terug als de gebruiker het eerdere alternatief weer kiest. Er is geen database-upgrade of destructieve migratie: IndexedDB `ritme-fitness`, versie 1, store `data`, sleutel `state`; back-upschema blijft 1.

Het bestaande anker wordt niet automatisch veranderd. De app gebruikt `settings.anchorMonday` indien aanwezig, anders de oorspronkelijke standaard 30 november 2026. De oude blokkade vóór die standaarddatum is verwijderd, zodat de gebruiker nu kan registreren. De kalenderrotatie loopt vóór het anker achterwaarts door. Een expliciete ankerwijziging is mogelijk via Instellingen en overschrijft geen sessies.

## Geautomatiseerde controles

- `npm test`: 79 tests geslaagd. Bestaande historische gegevens worden getest met een bewaarde v2.1-programmafixture; actuele v2.2-voorschriften worden apart exact vergeleken met de aangeleverde bron.
- De nieuwe broncontroles controleren alle acht trainingen: 8/7/7/7 oefenplaatsen, 18/16/16/17 werksets, vijf wisselingen, de twee keuzeopties, tijd/afstand en inspanningsinstructies.
- Keuzeopslag, herstel en back-up/import behouden deadlift- en row-prestaties onder afzonderlijke ID’s. PR’s, voorstellen en analyse-export blijven gescheiden. Voorgeschreven sets worden niet als uitgevoerd volume geschat.
- Ankerbehoud, zondag/maandag 00:00, beide zomertijdgrenzen, jaarwisseling en registratie vóór het standaardanker zijn getest.
- `npm run build:pages`: productiebuild, modules, programma, offline-assets en inhoudsafhankelijke PWA-cacheversie gecontroleerd.
- `actionlint` controleert de bestaande Pages-workflow. Die blijft PR’s testen en na merge naar main publiceren op het bestaande adres.

## Mobiele browserproef

`node scripts/test-browser.mjs` gebruikt een eigen tijdelijk browserprofiel en start zelf een testserver. De proef wordt uitgevoerd met Chromium, touch, 390 × 844 CSS-pixels en pixelschaal 3 (iPhone 13 Pro-afmetingen). Ook 320 px breed is gecontroleerd op horizontale overloop.

Geteste routes:

- Knoppen zijn actief op 14 november, met behoud van het standaardanker; weektype 2 wordt correct teruggeteld.
- Dubbel tikken op plus telt twee stappen en verandert de visuele zoom niet. Dezelfde knop blijft in de DOM staan. Min, komma-invoer en directe invoer werken. Een gewijzigde prestatie vinkt de oefening niet automatisch af; een bestaande oefenvink wordt ook niet door een gewijzigde invoer gewist.
- Dubbel tikken op afvinken rondt niet per ongeluk twee opeenvolgende oefeningen af. Afvinken/reactiveren, volgorde, gegevensbehoud na herladen en volledig sluiten/herstarten van de browser zijn gecontroleerd.
- Alle vier trainingen worden afgerond. De volgende training volgt de nieuwe volgorde; na vier sessies volgt geen vroegtijdige weekwisseling.
- Lower A bevat één keuzeplek. Wisselen zonder invoer, annuleren/bevestigen na invoer, herstellen van het eerdere alternatief en herstel na herladen werken.
- Hang-seconden en carry-kg/afstand blijven correct bewaard.
- Schemaweekknoppen, statistiekfilters, grafiekknoppen/-punten, zoeken, trainingsfilter en alle 37 oefeninfo-knoppen zijn gecontroleerd.
- Thema, weekanker (ongeldige zondag en geldige maandag), installatiedialoog en veiligheidsdialoog werken.
- De ChatGPT-export, normale JSON-back-up en CSV worden werkelijk gedownload en inhoudelijk gecontroleerd; export verandert de opslag niet. Een back-up wordt opnieuw geïmporteerd zonder duplicaten. De analyse-export werkt ook offline.
- Een historische multi-setsessie wordt ingelezen en bekeken zonder wijziging van de oude waarden. Daarna worden herstellen van voltooiing, behoud van het oefenvinkje bij gewijzigde invoer, een gesimuleerde opslagfout, opnieuw opslaan, training afronden met bevestiging en datumbeheer gecontroleerd. Verwijderen wordt eerst geannuleerd; daarna wordt uitsluitend de eigen testfixture verwijderd en uit de zojuist gemaakte back-up hersteld. Persoonlijke gebruikersdata worden nooit verwijderd.
- Offline herladen, navigatie en de bestaande SVG-illustratie werken. Er worden geen persoonlijke browsergegevens gebruikt of verwijderd.

De eerste proef gebruikt 14 november 2026 als geïsoleerde testklok (weektype 2). De tweede gebruikt 30 november 2026 (weektype 1). De testklok zit uitsluitend in de lokale testserver en wordt niet in de productiebuild geïnjecteerd.

Reproduceren vanuit de repositoryroot met de al geïnstalleerde lokale Chromium en aparte Playwright-installatie:

```sh
npm --prefix fitnessapp test
npm --prefix fitnessapp run build:pages
CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_MODULE=/tmp/ritme-browser/node_modules/playwright/index.mjs node fitnessapp/scripts/test-browser.mjs
CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_MODULE=/tmp/ritme-browser/node_modules/playwright/index.mjs RITME_BROWSER_DATE=2026-11-30T12:00:00Z node fitnessapp/scripts/test-browser.mjs
```

CI installeert Playwright en Chromium zelf volgens de bestaande workflow. De app zelf heeft geen npm-dependencies.

## Grenzen en publicatie

Dit is mobiele Chromium-emulatie, geen fysieke iPhone/Safari-test. `touch-action: manipulation`, 16 px invoertekst, safe-area-insets, standalone manifest en de bestaande Apple-metatags ondersteunen appachtig gedrag; pinch-zoom is niet uitgeschakeld.

60 minuten is een streefgrens. De 67 werksets per week, opwarmsets, eenzijdige uitvoering en wachttijd kunnen sessies laten uitlopen. De voorgeschreven sets en rust zijn niet eigenmachtig aangepast.

Git-fetch en Git-push zijn bereikbaar. De GitHub API is in de cloudnetwerkpolicy geblokkeerd. Daardoor is een nieuwe live Pages-publicatie niet bevestigd en kan PR-aanmaak via de API geblokkeerd blijven. Sta voor API-toegang `api.github.com` toe in de cloudnetwerkinstellingen en sla op; controleer daarna de benodigde GitHub API-rechten. Als alternatief kan de gebruiker de gepushte branch via GitHub als PR openen en samenvoegen. De bestaande workflow publiceert vervolgens na geslaagde tests.

Behoud https://royo1010.github.io/Fitness-app/ en wis geen sitegegevens. Open na een geslaagde deploy de bestaande PWA online en kies zo nodig App bijwerken. `release.json` hoort versie 2.2.0 en de gepubliceerde commit te tonen.

## Reparatie van de CI-themarace

De GitHub-browsertest las vóór de export nog revisie 54 met het donkere thema, terwijl de zojuist gekozen lichte modus nog werd opgeslagen. De export wachtte terecht op het opslaan; de vergelijking erna las revisie 55 met het lichte thema. De export wijzigde de trainingsgegevens niet.

De test sluit na iedere themawisseling de focus op het keuzemenu af, wacht op de werkelijk opgeslagen themavoorkeur én op een lege opslagwachtrij, en controleert daarna de zichtbare weergave. Een kunstmatige opslagvertraging van 200 ms maakt deze situatie ook lokaal reproduceerbaar. De asynchrone IndexedDB-controle wordt vanuit Node expliciet afgewacht; een Promise wordt niet als een direct geslaagd wachtpredicaat behandeld. Daarnaast controleert de test dat export zelf geen nieuwe opslagaanroepen start. De volledige vergelijking van de opslag vóór en na export, inclusief revisie, instellingen en sessies, blijft behouden. Er worden geen assertions overgeslagen of gegevens buiten de vergelijking gehouden. De app- en opslagcode zijn voor deze reparatie ongewijzigd.
