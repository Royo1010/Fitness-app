# Ritme 2.0

Een gerichte doorontwikkeling van de bestaande Ritme-app: dezelfde identiteit, programmabron, oefening-ID’s en lokale opslag, met een directe trainingsinterface.

## Gebruiken

De app opent op **Training**. Bovenaan staan de ISO-kalenderweek en de eerstvolgende nog niet voltooide training. Alle oefeningen en setvelden staan direct onder elkaar. Het programma heeft geen toegewezen trainingsdagen.

De vijf hoofdtabbladen zijn:

- **Training**: uitvoeren en registreren. Via de compacte keuzelijst kun je een andere training uit dezelfde week kiezen.
- **Schema**: vier trainingen in vaste volgorde, hun status en de volgende training. Vorige en toekomstige weken kun je bekijken zonder registraties te maken.
- **Statistieken**: gewichten, herhalingen, volume, records en trainingsfrequentie uit werkelijk gelogde sets.
- **Oefeningen**: zoeken en filteren op alle acht trainingen; een oefening behoudt overal hetzelfde record en dezelfde historie.
- **Meer**: Geschiedenis, Instellingen, back-up en installatie.

### Registreren zonder extra startscherm

Je kunt meteen typen of de plus- en minknoppen gebruiken. De eerste echte invoer maakt een sessie aan. Alleen een training bekijken of kiezen maakt geen sessie aan.

- Komma en punt werken allebei: `62,5` en `62.5`.
- Kies per oefening een gewichtsstap van 0,5, 1, 2,5 of 5 kg.
- Zonder historie blijft gewicht leeg; snelle invoerknoppen besparen typen. Deze invoerwaarden zijn geen belastingsadvies.
- Een eerder ingevulde set of uitvoering levert een voorstel voor de volgende set. Voorstellen zijn gedempt weergegeven; ze zijn nog geen geregistreerde werksets.
- Alleen een bewuste tik op het vinkje rondt een set af. Een waarde wijzigen vinkt niets automatisch af.
- Via de drie puntjes onder een oefening kun je sets overslaan, verwijderen, als opwarmset markeren en notities/herhalingen over invoeren.
- Tik op de oefennaam of het informatie-icoon voor de volledige broninstructies, PR, gemiddelden, gemiddelde herhalingen, vorige uitvoering en ontwikkeling.
- Met **Training afronden** wordt de volgende open training automatisch geselecteerd. Bij resterende sets volgt een korte bevestiging. Na vier trainingen blijft een compact weekoverzicht staan; de volgende week begint pas bij de kalendergrens.
- Een onjuiste voltooiing kun je herstellen door de training in Schema of Geschiedenis te openen en **Voltooiing herstellen / registratie aanpassen** te kiezen.

Alle eenheden zijn behouden: per dumbbell, per hand, afgelezen machinegewicht of totale halterlast. Hangs gebruiken seconden, carries meters en kg, en lichaamsgewichtoefeningen herhalingen met eventueel een extra externe last. Ontbrekende waarden blijven leeg, nooit automatisch 0 kg.

## Vaste weekrotatie

De interne referentie is **30 november 2026**, ISO-week 49. Er is geen onboarding met een startdatum meer.

| Kalenderweek | Trainingsweek | Volgorde |
| --- | --- | --- |
| 49, 2026 | 1 | Lower A1, Upper A1, Lower B1, Upper B1 |
| 50, 2026 | 2 | Lower A2, Upper A2, Lower B2, Upper B2 |
| 51, 2026 | 3 | Lower A1, Upper A1, Lower B1, Upper B1 |
| 52, 2026 | 4 | Lower A2, Upper A2, Lower B2, Upper B2 |
| 53, 2026 | 5 | Lower A1, Upper A1, Lower B1, Upper B1 |
| 1, 2027 | 6 | Lower A2, Upper A2, Lower B2, Upper B2 |

De cyclus gebruikt het verschil tussen lokale kalendermaandagen in **Europe/Amsterdam**, inclusief zomer- en wintertijd. ISO-weeknummer en ISO-weekjaar worden apart berekend. ISO-weeknummerpariteit bepaalt de variant niet. De rotatie is onafhankelijk van je voltooide trainingen.

Voor de referentiestart is het programma alleen een voorbeeld: geen nieuwe officiële sessies of voortgang. Eerdere bestaande registraties worden behouden en blijven toegankelijk in Geschiedenis en Statistieken. Een nieuwe week neemt geen gemiste sessies over en markeert niets automatisch voltooid.

## Databehoud en back-up

De IndexedDB blijft **`ritme-fitness`**, databaseversie **1**, objectstore **`data`**, sleutel **`state`**. Back-ups behouden schema-versie 1. Een destructieve migratie is niet nodig.

Bestaande sessies behouden hun ID, datum, week, variant, bronversie, originele titel en alle instructie-/voorschriftsnapshots. De interface gebruikt de nieuwe duidelijke A1/B1-namen; opgeslagen oude titels worden niet herschreven. Een oude ingestelde ankermaandag blijft in de data staan voor compatibiliteit, maar bepaalt de nieuwe vaste rotatie niet.

De instellingen kunnen nu optionele gewichtsstappen per oefening bevatten. Die reizen mee in JSON-back-ups. Bij samenvoegen blijven bestaande sessies en instellingen behouden; ontbrekende sessie-ID’s worden toegevoegd. Alles vervangen vraagt een expliciete bevestiging. Revisioncontrole voorkomt stil overschrijven vanuit twee tabbladen.

Via **Meer → Instellingen & back-ups** kun je een volledige JSON-back-up of CSV-setexport maken en JSON herstellen. Een back-up bevat ook onafgeronde invoer en historische oefenuitleg. Lokale opslag synchroniseert niet tussen apparaten. Wis browsergegevens niet zonder back-up.

**Belangrijk voor een update:** behoud hetzelfde websiteadres en dezelfde browser. Verplaats de app niet naar een andere host; lokale opslag hoort bij de bestaande origin. Het nieuwe pakket kopieert geen browserdatabase en bevat geen voorbeeldrecords.

## Lokaal starten

Op deze Mac: dubbelklik op **Start Ritme.command**. Open daarna **http://localhost:4173/Fitness-app/**. De launcher gebruikt Node als dat is geïnstalleerd, of de Node-runtime van Codex op deze Mac.

Met Node.js 20 of nieuwer:

```sh
node scripts/serve.mjs
```

Ook beschikbaar als `npm start` of `npm run dev`; een dependency-installatie is niet nodig. Stoppen met `Ctrl+C`. De lokale server ondersteunt zowel de root als het echte `/Fitness-app/`-pad.

## Productie en GitHub Pages

`dist/` bevat rechtstreeks de volledige bijgewerkte productie-app. Er is geen transpileerstap. `npm run build` controleert syntaxis, bronverwijzingen en alle verplichte bestanden.

Alle assetpaden zijn relatief. Het manifest behoudt `id: "./"` en `scope: "./"`; `start_url: "./#home"` opent op Training. Dit werkt onder `/Fitness-app/`. De serviceworker heeft een nieuwe cacheversie, cachet ook `training.css`, begrenst verzoeken en cacheopruiming tot de eigen app en raakt IndexedDB niet aan. Bij een nieuwe versie verschijnt een compacte updateknop; die wacht op lopende opslag voordat er wordt herladen.

**Publicatiestatus:** in deze aangeleverde werkmap is geen GitHub-remote of GitHub Actions-workflow aanwezig. Daarom zijn de daadwerkelijke repository, Pages-publicatiebron en live GitHub-versie nog niet te verifiëren en is er niet naar GitHub gepusht. De oude Sites-configuratie is niet gewijzigd of gepubliceerd. Zie **PUBLICATIE-GITHUB.md** voor de concrete resterende stappen; bestaande correcte hostinginstellingen moeten behouden blijven.

## Installeren en offline gebruiken

Open je bestaande HTTPS-website in Safari op je iPhone. Gebruik **Deel → Zet op beginscherm**. Een bestaande installatie behoudt haar identiteit en opslag. Open de bijgewerkte app eenmaal online zodat de nieuwe cache klaarstaat; daarna werken programma, oefenuitleg, invoer en statistieken offline. Voor installatie op een telefoon is HTTPS nodig; een lokale HTTP-IP-verbinding is alleen geschikt voor een visuele preview.

## Testen

```sh
node --test tests/*.test.mjs
node scripts/check.mjs
```

Of: `npm test`, `npm run build`, `npm run lint`. Het lintscript is een syntax- en distributiecontrole, geen ESLint-configuratie. **67 tests slagen**, waaronder 41 bestaande tests en nieuwe regressietests voor de vaste rotatie, selectie, voorstartvoorbeeld, ISO-weekjaar, databehoud, voorstellen, gewichtsstappen, back-ups en Pages/PWA-paden.

Browsercontroles en hun grenzen staan in **TESTVERSLAG.md**. De ontwikkelserver heeft een expliciete `RITME_TEST_DATE`-optie voor een geïsoleerde testklok. Deze injectie zit uitsluitend in de lokale server en komt niet in `dist/` of GitHub Pages terecht.

## Bron en onderhoud

`dist/program.json`, alle oefening-ID’s, oefeningen, werksets, doelherhalingen, rusttijden en veiligheidsafspraken zijn inhoudelijk ongewijzigd. De JSON blijft leidend. Het reeds bekende verschil in warming-upduur met `PROGRAMMA.md` blijft vermeld in de app. Fysiotherapie is geen nieuw door de app voorgeschreven protocol. Afbeeldingen en 1RM-schattingen zijn weggelaten; de volledige betrouwbare bronuitleg en werkelijke prestaties staan centraal.

Belangrijkste code:

- `dist/core.mjs`: kalenderweken, vaste volgorde, selectie, invoervoorstellen, modellen, statistieken en back-ups.
- `dist/app.mjs`: bestaande schermen en opslagbediening met de nieuwe trainingsgerichte navigatie.
- `dist/training.css`: compacte 2.0-interface bovenop de bestaande visuele identiteit in `styles.css`.
- `dist/storage.mjs`: ongewijzigde IndexedDB- en revisionlogica.
- `dist/sw.js` en `manifest.webmanifest`: offlinecache, appidentiteit en subpadondersteuning.
- `tests/ritme-v2.test.mjs`: nieuwe regressietests; `tests/core.test.mjs` behoudt de eerdere tests.

Verhoog bij een volgende statische release de cacheversie in `dist/sw.js`. Wijzig schema-versie of database-identiteit alleen met een expliciete, geteste migratie.
