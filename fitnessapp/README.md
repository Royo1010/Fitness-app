# Ritme 2.2

Een compact Upper/Lower-trainingslogboek dat lokaal en offline werkt. De bestaande website blijft **https://royo1010.github.io/Fitness-app/**.

## Trainen als checklist

Training opent rechtstreeks met je week, actieve training en voortgang. De grote app-header, warming-upkaart en notitiesectie staan niet meer op dit hoofdscherm. De vijf tabbladen blijven Training, Schema, Statistieken, Oefeningen en Meer.

Het v2.2-programma volgt de meegeleverde JSON in `sources/`: Upper A, Lower A, Upper B en Lower B, zonder vaste dagen. Per week zijn er 8/7/7/7 oefenplaatsen en 18/16/16/17 werksets. Op Lower A kies je per sessie deadlift of barbell bent-over row; eerdere invoer blijft bij het oorspronkelijke alternatief bewaard als je met bevestiging wisselt. Deadlift- en row-geschiedenis worden nooit samengevoegd.

Per oefening zie je het oorspronkelijke voorschrift (sets, herhalingen en rust) en één invoerregel voor **je beste uitgevoerde set**. Train alle voorgeschreven sets, maar registreer alleen de zwaarste set; bij gelijk gewicht kies je de meeste herhalingen. Bij carries registreer je kg per hand en de echte afstand; hangs gebruiken seconden. De bestaande gewichtsdefinities blijven gelden.

Typ rechtstreeks, gebruik komma of punt, of pas waarden aan met plus/min. De vorige beste set wordt indien beschikbaar gedempt voorgesteld. Een voorstel is nog geen registratie. Plus/min wijzigen het bestaande invoerveld direct en verwerken herhaalde tikken zonder de kaart te vervangen. Knoppen gebruiken `touch-action: manipulation`, zodat dubbel tikken niet inzoomt; pinch-zoom blijft beschikbaar. Geldige werkelijk ingevoerde waarden worden lokaal opgeslagen; het vinkje staat hier los van. Bij het afvinken kan een gedeeltelijk ingevoerde prestatie worden aangevuld met het zichtbare voorstel. Zonder enige invoer wordt uitsluitend de oefening afgevinkt, zonder prestatie of record te verzinnen.

Open oefeningen staan in de oorspronkelijke volgorde bovenaan, afgevinkte oefeningen onderaan. Tik opnieuw op het vinkje om een oefening te activeren; je invoer blijft staan. Je trainingskeuze, vinkjes en invoer worden bewaard. Bij heropenen staat de eerstvolgende open oefening bovenaan. Wanneer alles afgevinkt is verschijnt een compacte afrondmelding. Training afronden selecteert de volgende open training binnen dezelfde kalenderweek.

Elke oefenkaart toont een Nederlands spiergroeplabel. De informatieknop opent een tekstgids met herkenning van het apparaat, startpositie, genummerde uitvoering, aandachtspunten, gerichte klachtenaanpassingen en je ongewijzigde prestaties. De 37 gidsen werken ook offline. Algemene veiligheidsinformatie staat onder Meer → Instellingen; in de gids staan alleen oefenspecifieke aanpassingen. Oefenafbeeldingen zijn verwijderd; app- en navigatie-iconen blijven behouden. Week- en varianttoevoegingen verdwijnen uitsluitend uit weergegeven namen, niet uit bewaarde registraties. Zie `TESTVERSLAG-DESIGN.md`.

## Rotatie en gegevensbehoud

De interne standaardreferentie blijft **30 november 2026**, ISO-week 49, in Europe/Amsterdam. Een bestaande opgeslagen ankermaandag blijft leidend. In Instellingen kun je die maandag bewust aanpassen. Elke kalenderweek begint op maandag 00:00 en heeft Upper A → Lower A → Upper B → Lower B; de volgende variant gebruikt suffix 2. De kalender bepaalt het weektype, niet je voortgang. Registratie werkt ook vóór het anker; de tweeweekse rotatie wordt dan teruggeteld. Toekomstige datums blijven niet-registreerbaar. De oude blokkade vóór 30 november is opgeheven zodat de knoppen nu bruikbaar zijn zonder het anker stilzwijgend te verplaatsen.

IndexedDB blijft `ritme-fitness`, versie 1, objectstore `data`, sleutel `state`. Back-ups blijven schema-versie 1. Nieuwe sessies hebben de aanvullende velden `recordingMode: "best"` en per oefening een eigen boolean `exerciseCompleted`. Er is geen destructieve migratie. Bestaande individuele sets, notities, instructiesnapshots, titels en sessie-ID’s blijven behouden. Bij oude trainingen toont de kaart één beste set; de oorspronkelijke losse sets blijven in de details en statistieken terug te vinden. Bestaande registraties worden niet automatisch samengevouwen.

PR’s en gemiddelden gebruiken uitsluitend geldige geregistreerde waarden. Nieuwe registraties tellen eenmaal per oefening mee; oude losse werksets blijven meetellen. Gelogd volume is uitsluitend de som van werkelijk geregistreerde kg × herhalingen, nooit een schatting van alle voorgeschreven sets. Het werkelijke totale trainingsvolume vanaf 2.1 is onbekend.

Via Meer → Instellingen & back-ups kun je **Voortgang voor ChatGPT downloaden**. Dit is een leesbaar JSON-rapport met datums, meeteenheden, afzonderlijke PR’s, gemiddelden, gelogde prestaties en alle oorspronkelijke sessies, inclusief bewaarde keuze-alternatieven. Er wordt niets geüpload: jij kiest of je het bestand aan ChatGPT geeft. Een gewone JSON-back-up en CSV blijven daarnaast beschikbaar. Back-ups bewaren ook onafgeronde invoer, notities en oefenvinkjes. Lokale opslag synchroniseert niet tussen apparaten. Behoud hetzelfde websiteadres en dezelfde browser. **Wis geen sitegegevens om een update te forceren.** Opslagfouten blijven zichtbaar met een mogelijkheid om opnieuw op te slaan of een back-up te downloaden.

## Ontwikkelen en publiceren

Node.js 20 of nieuwer; CI gebruikt Node.js 24. De app heeft geen npm-dependencies en geen transpileerstap. `dist/` bevat de daadwerkelijke statische broncode.

Vanuit `fitnessapp/`:

```sh
npm test
npm run build:pages
npm run dev
```

`npm run build` controleert syntax, programma en assets. `npm run build:pages` maakt `.pages-dist/` met een inhoudsafhankelijke PWA-cacheversie en `release.json` met pakketversie, commit en bronhash. Wijzig bronbestanden in `dist/`, niet alleen een ZIP.

De ontwikkelserver gebruikt standaard poort 4173 en ondersteunt root en `/Fitness-app/`. `PORT` kiest een andere poort. Voor geïsoleerde proeven bestaat `RITME_TEST_DATE=2026-11-30T12:00:00Z`; die testklok wordt nooit in de statische productiebuild opgenomen.

De GitHub Actions-workflow controleert pull requests met unit-, browser- en offlineproeven en de productiebuild. Alleen een geslaagde run op `main` publiceert op het bestaande Pages-adres. Zie `PUBLICATIE-GITHUB.md` voor Pages-instellingen en `TESTVERSLAG-2.2.md` voor actuele controles en grenzen.

## Praktische sessieduur

60 minuten blijft een streefgrens, geen gegarandeerde uitkomst. Vier trainingen bevatten samen 67 voorgeschreven werksets. Opwarmsets, eenzijdige uitvoering, toestelwissels en wachttijd komen daar in tijd nog bij. De vastgestelde aantallen en rusttijden zijn niet verkort om een tijdsdoel te claimen.

## App-updates en compacte bediening

Onder Meer → Instellingen → App-updates staan de geïnstalleerde versie en het automatisch gemaakte buildnummer. Controleer op updates vergelijkt die build met de online publicatie; Update installeren bewaart openstaande invoer voordat de nieuwe serviceworker wordt geactiveerd en de app herlaadt. Bij geen internet, een onvolledige publicatie of een opslagfout verschijnt een melding en blijven gegevens bewaard. Gebruik geen browsergegevens wissen om de app bij te werken.

Training en Schema tonen minder dubbele tekst; statussen op Schema volgen echte activiteit. Volledige wijzigingen, reproductie en de resterende iPhone-controle: [TESTVERSLAG-UX-UPDATES.md](TESTVERSLAG-UX-UPDATES.md).

## Begrensd scrollvlak op iPhone

De documentpagina scrollt niet meer. De bestaande appcontainer scrollt zelf en begint onder de bovenste safe-area; inhoud wordt daar echt afgeknipt. De eerdere afdekkende pseudo-laag is verwijderd. Navigeren, pauzeren/hervatten en dialogen gebruiken het app-scrollvlak. Onderzoek, WebKitGTK-/Chromium-controles en de nog noodzakelijke fysieke iPhone-proef: [TESTVERSLAG-IOS-SCROLL.md](TESTVERSLAG-IOS-SCROLL.md).
