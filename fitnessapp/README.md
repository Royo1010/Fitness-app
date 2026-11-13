# Ritme 2.1

Een compact Upper/Lower-trainingslogboek dat lokaal en offline werkt. De bestaande website blijft **https://royo1010.github.io/Fitness-app/**.

## Trainen als checklist

Training opent rechtstreeks met je week, actieve training en voortgang. De grote app-header, warming-upkaart en notitiesectie staan niet meer op dit hoofdscherm. De vijf tabbladen blijven Training, Schema, Statistieken, Oefeningen en Meer.

Per oefening zie je het oorspronkelijke voorschrift (sets, herhalingen en rust) en één invoerregel voor **je beste uitgevoerde set**. Train alle voorgeschreven sets, maar registreer alleen de zwaarste set; bij gelijk gewicht kies je de meeste herhalingen. Bij carries registreer je kg per hand en de echte afstand; hangs gebruiken seconden. De bestaande gewichtsdefinities blijven gelden.

Typ rechtstreeks, gebruik komma of punt, of pas waarden aan met plus/min. De vorige beste set wordt indien beschikbaar gedempt voorgesteld. Een voorstel is nog geen registratie. Geldige werkelijk ingevoerde waarden worden lokaal opgeslagen; het vinkje staat hier los van. Bij het afvinken kan een gedeeltelijk ingevoerde prestatie worden aangevuld met het zichtbare voorstel. Zonder enige invoer wordt uitsluitend de oefening afgevinkt, zonder prestatie of record te verzinnen.

Open oefeningen staan in de oorspronkelijke volgorde bovenaan, afgevinkte oefeningen onderaan. Tik opnieuw op het vinkje om een oefening te activeren; je invoer blijft staan. Je trainingskeuze, vinkjes en invoer worden bewaard. Bij heropenen staat de eerstvolgende open oefening bovenaan. Wanneer alles afgevinkt is verschijnt een compacte afrondmelding. Training afronden selecteert de volgende open training binnen dezelfde kalenderweek.

De informatieknop bevat alle oorspronkelijke technische instructies, aandachtspunten, fouten, spiergroepen, eerdere prestaties en records. Veiligheidsinformatie blijft daar en via Meer → Instellingen beschikbaar. Voor Standing calf raise is een kleine originele offline SVG toegevoegd; voor de overige oefeningen worden geen onbevestigde afbeeldingen getoond. Zie `ILLUSTRATIES.md`.

## Rotatie en gegevensbehoud

De interne referentie blijft **30 november 2026**, ISO-week 49, in Europe/Amsterdam. Elke week heeft vier trainingen zonder vaste trainingsdagen: Lower A1 → Upper A1 → Lower B1 → Upper B1, daarna dezelfde volgorde met suffix 2. De kalender bepaalt het weektype, niet je voortgang. Vóór de referentiestart toont de app een voorbeeld; toekomstige weken zijn niet registreerbaar.

IndexedDB blijft `ritme-fitness`, versie 1, objectstore `data`, sleutel `state`. Back-ups blijven schema-versie 1. Nieuwe sessies hebben de aanvullende velden `recordingMode: "best"` en per oefening een eigen boolean `exerciseCompleted`. Er is geen destructieve migratie. Bestaande individuele sets, notities, instructiesnapshots, titels en sessie-ID’s blijven behouden. Bij oude trainingen toont de kaart één beste set; de oorspronkelijke losse sets blijven in de details en statistieken terug te vinden. Bestaande registraties worden niet automatisch samengevouwen.

PR’s en gemiddelden gebruiken uitsluitend geldige geregistreerde waarden. Nieuwe registraties tellen eenmaal per oefening mee; oude losse werksets blijven meetellen. Gelogd volume is uitsluitend de som van werkelijk geregistreerde kg × herhalingen, nooit een schatting van alle voorgeschreven sets. Het werkelijke totale trainingsvolume vanaf 2.1 is onbekend.

Exporteer via Meer → Instellingen & back-ups een JSON-back-up of CSV. Back-ups bewaren ook onafgeronde invoer, notities en oefenvinkjes. Lokale opslag synchroniseert niet tussen apparaten. Behoud hetzelfde websiteadres en dezelfde browser. **Wis geen sitegegevens om een update te forceren.** Opslagfouten blijven zichtbaar met een mogelijkheid om opnieuw op te slaan of een back-up te downloaden.

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

De GitHub Actions-workflow controleert pull requests met unit-, browser- en offlineproeven en de productiebuild. Alleen een geslaagde run op `main` publiceert op het bestaande Pages-adres. Zie `PUBLICATIE-GITHUB.md` voor Pages-instellingen en `TESTVERSLAG-2.1.md` voor actuele controles en grenzen.
