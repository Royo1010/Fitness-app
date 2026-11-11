# Ritme 2.0 — wijzigingen en oplevering

De bestaande app is doorontwikkeld. Er is geen nieuwe app, website of database gemaakt.

## Functionaliteit

- Training opent direct met de eerste open training en alle setvelden in één verticale lijst.
- Vaste volgorde Lower A1, Upper A1, Lower B1, Upper B1 en de 2-varianten.
- Referentie 30 november 2026, Amsterdamse kalenderweken en afzonderlijk ISO-weekjaar; voorstartvoorbeelden maken geen officiële voortgang.
- Automatisch volgende training na afronden; vier afgeronde trainingen blijven een afgeronde kalenderweek.
- Schema bekijkt vorige en toekomstige weken zonder sessies te maken.
- Vijf hoofdtabbladen; Geschiedenis en Instellingen staan onder Meer.
- Directe invoer, Nederlandse komma, plus/min, bewaarde gewichtsstappen en niet-gelogde voorstellen uit vorige sets of uitvoeringen.
- Oefeningdetails met volledige bronuitleg, echte prestaties en ontwikkeling; bibliotheekfilters voor alle acht trainingen plus zoeken.
- Dezelfde IndexedDB-identiteit en back-upversie, zonder destructieve migratie. Originele records, data en oefening-ID’s blijven behouden.
- Relatieve Pages-assets, PWA-identiteit behouden, nieuwe cacheversie en veilige updateknop.

## Controle

67 tests geslaagd. Productie-/syntaxcontrole geslaagd. Browserproeven bevestigen selectie, invoer, herladen, records, filters, voltooiing herstellen, v1-back-upimport en offline openen met gestopte servers. Geen fysieke iPhone gebruikt; de ingebouwde preview heeft een gemeten inhoudsbreedte van 375 CSS-pixels bij de mobiele viewportinstelling. Zie TESTVERSLAG.md.

## Publicatie

Niet naar GitHub gecommit of gepusht: er is geen GitHub-remote of aanwezige Pages-workflow en de repository-URL is nog niet beschikbaar. De lokale productieversie in dist/ is bijgewerkt en gereed. Het huidige websiteadres en de publicatie-instellingen zijn niet aangepast. Zie PUBLICATIE-GITHUB.md voor de resterende stappen.

## Gewijzigde of toegevoegde bestanden

- `PUBLICATIE-GITHUB.md`
- `README.md`
- `SPECIFICATIE-2.0.md`
- `TESTVERSLAG.md`
- `dist/.nojekyll`
- `dist/app.mjs`
- `dist/core.mjs`
- `dist/index.html`
- `dist/manifest.webmanifest`
- `dist/sw.js`
- `dist/training.css`
- `package.json`
- `scripts/check.mjs`
- `scripts/serve.mjs`
- `tests/ritme-v2.test.mjs`
- `WIJZIGINGEN-2.0.md`
