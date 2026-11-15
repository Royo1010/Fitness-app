# Gerichte UX-update en veilige PWA-updates

Vervolg: de Dark Mode- en bovenrandcorrectie staat in [TESTVERSLAG-DARK-MODE.md](TESTVERSLAG-DARK-MODE.md).

Deze wijziging verfijnt de bestaande Ritme 2.2-app. Het kleurenpalet, de navigatie, spiergroeplabels en grote invoervelden blijven behouden.

## Gewijzigde bestanden

| Onderdeel | Bestanden en wijziging |
| --- | --- |
| Interface | `dist/app.mjs`, `dist/training.css`: eenvoudige weekregel en oefeningentelling, geen voortgangsbalk, dubbele eenheden of onduidelijke kaartlabels; uitgelijnde pauze- en afrondknoppen; compact Schema; App-updates in Instellingen. |
| Namen | `dist/exercise-guides.mjs`: verkort alleen weergegeven namen. Apparaat- en uitvoeringsdetails blijven in de uitleg. De machine- en dumbbell-row blijven herkenbaar verschillend; een relevante neutrale greep blijft in de naam. |
| Status | `dist/core.mjs`: onderscheid tussen lege sessies, echte activiteit en expliciete voltooiing; hervatten kiest echte incomplete invoer boven een latere lege sessie. |
| Updatecoördinatie | Nieuw `dist/updates.mjs`: netwerkcontrole, controle van gereedstaande worker, bewaren vóór activeren/herladen, foutafhandeling en begrensde wachttijd bij netwerk/registratie. |
| Build en PWA | Nieuw `dist/build-info.mjs`, aangepast `dist/sw.js`, `scripts/build-pages.mjs` en `scripts/check.mjs`: automatische build-identiteit in app, worker en releasebestand; complete offlinecache; gecontroleerde activatie. |
| Tests | Nieuw `scripts/test-updates.mjs`, `tests/updates.test.mjs`, `tests/session-status.test.mjs`; aangepaste browser-, Pages-, naam- en workertests. `scripts/serve.mjs` kan voor de updateproef een geïsoleerd productie-artifact serveren. |
| Documentatie | Dit verslag en `README.md`. |

De programma-JSON, opslagmodule, statistiek-/analyse-exportmodule en PWA-manifest zijn ongewijzigd. De kalenderberekening, trainingsvolgorde, schema-inhoud, meetconventies, oefening-ID's en statistiekberekeningen zijn niet aangepast. Er is geen gegevensmigratie, reset of nieuwe fitnessoefening.

## Interface en status

- Training toont uitsluitend de ISO-week en het jaar, de bestaande trainingstitel/keuzelijst en het totale aantal oefeningen.
- De eerste open kaart blijft subtiel gemarkeerd. Afvinken, automatisch verplaatsen en hervatten blijven werken; de knop bevat alleen een vink en een beschrijvende toegankelijke naam.
- Alle eenheden staan één keer boven de velden. Bij halters blijft duidelijk dat het gewicht inclusief stang is; dumbbells blijven per dumbbell.
- Pauze en Training afronden hebben gelijke verticale uitlijning. De ondermarge houdt de bediening bereikbaar boven de vaste navigatie en safe-area.
- Schema heeft een compacte titel en één week-/datumregel met pijlen, zonder brandingheader of weektype-labels. Opslaginformatie staat ook bij de gegevenssectie in Instellingen.
- Niet gestart betekent geen echte invoer of expliciete activiteit. Een lege bewaarde sessie, het bekijken van Schema of alleen wisselen van keuzeoefening telt niet als gestart.
- Bezig omvat ingevoerde waarden (ook nul), notities, afvinken/overslaan, pauzeren of expliciet starten. Ook gearchiveerde keuze-invoer blijft meetellen. Afgerond vereist de expliciete voltooiingsstatus van de sessie.
- Lege of incomplete sessies worden niet verwijderd. Meerdere daadwerkelijk gedeeltelijke trainingen mogen Bezig zijn.

## Hoe updates werken

De productiebuild berekent een SHA-256-inhoudshash. De app krijgt deze ingebouwd via `build-info.mjs`; `release.json` op de server en de serviceworker gebruiken dezelfde hash. Nieuwe broncode geeft automatisch een andere build, ook als het programmaversienummer 2.2.0 blijft. Alleen de bronmap lezen verandert de geïnstalleerde identiteit niet in de online identiteit.

Controleer op updates vraagt `release.json` via het netwerk op met `cache: no-store` en een unieke queryparameter. De worker cachet dit bestand en zijn eigen script niet. De registratie gebruikt `updateViaCache: none` en de controle voert ook `registration.update()` uit. GitHub Pages ondersteunt hier geen repositorybestand waarmee willekeurige HTTP-cacheheaders worden ingesteld; de controle is daarom expliciet onafhankelijk van de gewone appcache. Bij een tijdelijk verschil tussen metadata en worker wordt geen succesvolle update gemeld.

Een nieuwe worker haalt de volledige appcache op en controleert of de gecachete buildmodule bij zijn eigen build hoort. Normale updates blijven daarna wachten. De knop verschijnt pas wanneer de worker voor de gepubliceerde inhoud klaarstaat; controleren zelf herlaadt niets en schrijft geen trainingsgegevens.

Bij Update installeren wordt de actuele publicatie opnieuw gecontroleerd. De invoer wordt tijdelijk vergrendeld, eventuele invoervalidatie en opslagfouten worden gecontroleerd en alle lopende saves worden afgewacht. Pas daarna wordt de juiste worker geactiveerd. Herladen gebeurt één keer en pas wanneer de controller de verwachte build bevestigt. Controllerwisselingen herladen andere tabbladen niet automatisch. Bij fouten wordt de interface weer vrijgegeven en blijft herstel/export mogelijk.

Alleen oude appbestanden in caches met het eigen padprefix worden opgeruimd. IndexedDB en localStorage worden niet gewist en de PWA-identiteit blijft gelijk.

### Eenmalige overgang van de bestaande PWA

De oude app kent alleen zijn bestaande banner bij een controllerwissel. Bij een cache zonder buildmodule activeert de nieuwe worker daarom eenmalig zonder pagina-herlaadactie. Daardoor krijgt de oude app zijn bestaande melding App bijwerken. Na die eerste veilige herlaadactie is de nieuwe updatefunctie beschikbaar. Volgende updates wachten op Update installeren.

## Validatie

- `node --test .github/scripts/*.test.cjs`: 36 geslaagd.
- `npm --prefix fitnessapp test`: 98 geslaagd.
- `npm --prefix fitnessapp run build:pages`: geslaagd; buildmodule, release-identiteit en alle offlinebestanden gecontroleerd.
- `scripts/test-browser.mjs` met Playwright 1.56.1 en lokaal Chromium 156: geslaagd. Dit is tevens de bestaande CI-ingang; hij voert de nieuwe productie-updateproef automatisch mee uit.

De browserproef controleert kaarten op 320/390/430/1024 pixels, Schema op 320/390 pixels, aanraakdoelen vanaf 44 pixels, geen horizontale overflow, uitlijning/bereikbaarheid van de afrondsectie en het ontbreken van verwijderde teksten. Alleen Schema openen creëert geen sessie. De bestaande controles op kleurcontrast licht/donker, plus/min, dubbel tikken zonder zoom, checklist, vier trainingen, keuzeoefeningen en gescheiden records, 37 uitleggidsen, geschiedenis, import/export en offlinegebruik blijven aanwezig.

De updateproef serveert echte productiebuilds op hetzelfde lokale adres in een geïsoleerde browsercontext:

1. Build A meldt terecht dat hij de nieuwste is.
2. Build B krijgt een andere inhoudshash en wordt gedetecteerd zonder dat controleren de app herlaadt of gegevens schrijft.
3. Een echte IndexedDB-save wordt bewust opengehouden. De nieuwe worker blijft wachten en er wordt niet herladen tot de save voltooid is.
4. Na activatie en herladen zijn de volledige sessiegegevens en instellingen exact gelijk aan de verwachte opgeslagen staat. Ook een gekozen donker thema, localStorage-marker en incomplete registratie blijven behouden.
5. Offline, HTTP 503 en ongeldige metadata geven duidelijke foutmeldingen; er volgt geen reset.
6. Bij build C wordt een echte opslagfout opgewekt: activatie/herladen wordt geblokkeerd, het bestaande logboek blijft intact en de nieuwe invoer kan na herstel alsnog worden opgeslagen.
7. Een aparte oude cache zonder buildmodule migreert naar build D zonder spontane pagina-herlaadactie of verlies van lokale gegevens.

Unitproeven controleren daarnaast statusgevallen, de bestaande maandaggrens/tijdzone/tweeweekse cyclus, namen met behouden ID's, incomplete publicaties, veranderende publicaties tussen controle en installatie, netwerk-/registratiefouten en niet-dubbele activatie. Testprofielen, servers en artifacts worden na afloop verwijderd; persoonlijke browsergegevens worden niet gebruikt.

Lokale voorbeeldscreenshots staan in `/tmp/ritme-ux-training.png`, `/tmp/ritme-ux-schema.png`, `/tmp/ritme-ux-afronden.png` en `/tmp/ritme-ux-updates.png`.

## Nog handmatig op iPhone

Er is geen fysieke iPhone/Safari beschikbaar. Controleer na merge en een geslaagde Pages-publicatie eenmalig de oude updatebanner (of sluit/open de app), daarna Meer → Instellingen → App-updates. Bekijk het buildnummer, controleer online en offline, en hervat een gedeeltelijke training. Controleer ook de ondermarge in de geïnstalleerde app. Een volgende publicatie kan vervolgens via Controleer op updates → Update installeren worden geladen. Wis geen sitegegevens en verwijder de app niet om te verversen.
