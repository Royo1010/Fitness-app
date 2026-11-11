# Verificatie — 11 november 2026

## Geautomatiseerd

- `node --test tests/*.test.mjs`: **41 geslaagd, 0 mislukt**.
- `node scripts/check.mjs`: geslaagd; JavaScript-syntaxis, beide weekprogramma’s, alle oefeningverwijzingen en PWA-bestanden gecontroleerd.
- De 8 tabellen en alle 35 volledige oefenbeschrijvingen in de Markdown programmabron zijn geautomatiseerd vergeleken met de JSON: geen inhoudelijke verschillen in de schema’s of oefeningen. Het verschil in warming-upduur is expliciet gedocumenteerd; de JSON is leidend.

## Browsercontrole

Uitgevoerd in de Codex-browser op desktop en met een viewport van 390 × 844 pixels:

- Eerste configuratie met maandag 9 november als start van week 1.
- Trainingsdashboard, weekbereik, vrije trainingkeuze en weeknavigatie. Volgende kalenderweek toont A2/B2 en begint op 0/4, terwijl de bestaande uitvoering bewaard blijft.
- Volledige oefeninstructies voor dumbbell press en de specifieke Technogym Reverse Fly met armkussens.
- Werksets ingevoerd met `22,5 kg × 10` en `25 kg × 8`; afronden en gedeeltelijke training afronden. Correcte PR: **25 kg bij 8 herhalingen**. Correct gemiddelde: **23,75 kg**.
- Interactief grafiekpunt geselecteerd; datum, training en waarde kloppen.
- Pagina herladen: invoer, records, gemiddelde en geschiedenis blijven aanwezig.
- Training opnieuw geopend en aangepast; rusttimer start op de bovengrens van de bronrust (3:00 voor 120–180 s).
- Volledige JSON-back-up via de interface gedownload, gevalideerd en opnieuw samengevoegd: bestaande training-ID bleef behouden, geen duplicaat.
- Lichte en donkere mobiele weergave, navigatie onderaan en zoekfunctie gecontroleerd.
- De lokale server bewust gestopt. App vervolgens herladen vanuit de serviceworkercache. Dashboard, oefeningenboek, zoeken en volledige Technogym-instructies bleven werken.
- Geen JavaScript-fouten in de console tijdens de reguliere controles.
- De zelf aangemaakte testtraining na export via de interface verwijderd. De opgeleverde app bevat geen voorbeeldrecords.

## Grenzen van de verificatie

Geen fysieke iPhone gebruikt; de mobiele weergave is in de browser op iPhone-formaat gecontroleerd. De installatiehandleiding en PNG-manifesticonen zijn aanwezig; installeren als beginschermapp op een echte iPhone is niet uitgevoerd. Offline openen is aantoonbaar getest met een gestopte server, zonder het netwerk van het apparaat uit te schakelen. Lokale opslag kan door browser- of apparaatbeheer worden opgeruimd; volledige JSON-back-ups blijven nodig.

Back-upvervanging, corrupte import, kalendertijdgrenzen en verschillende meettypen worden aanvullend door de geautomatiseerde tests gecontroleerd. Langdurig opslaggedrag bij een vol apparaat en herstel na browserverwijdering zijn niet fysiek gesimuleerd.
