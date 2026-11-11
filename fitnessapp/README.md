# Ritme — jouw persoonlijke fitnessapp

Een Nederlandstalige, installeerbare Upper/Lower-app met het exacte aangeleverde programma. Geen accountsysteem in de app, geen externe databank, geen voorbeeldregistraties en geen afhankelijkheden van een framework of CDN.

## Meteen gebruiken

Open je privéwebsite in Safari op je iPhone. Meld je zo nodig aan met het account waarmee de website is gemaakt. Kies bij de eerste opening de maandag waarop **week 1** begint.

1. Kies een van de vier trainingskaarten. De volgorde en trainingsdag bepaal je zelf.
2. Open de warming-up en tik op een oefennaam voor de volledige uitvoering.
3. Tik op **Start deze training**. Noteer per set het gewicht en de herhalingen en tik op het vinkje. Zowel `22,5` als `22.5` werkt.
4. Via de drie puntjes bij een set kun je herhalingen over, een notitie en het type werkset/opwarmset instellen. Je kunt sets toevoegen, overslaan en verwijderen.
5. **Pauzeren & bewaren** bewaart een gedeeltelijke training. De invoer wordt ook tijdens het typen opgeslagen. Wacht op ‘Opgeslagen op dit apparaat’ voordat je de app sluit.
6. Rond een training expliciet af als je klaar bent. Niet-uitgevoerde sets zijn geen afgeronde sets. Je mag afronden zonder alle oefeningen te doen.
7. Bekijk records, gemiddelden, je vorige uitvoering en interactieve grafieken bij **Statistieken**. **Geschiedenis** bewaart alle uitvoeringen en biedt invoer achteraf.

Iedere maandag om 00:00 in **Europe/Amsterdam** wisselt het schema automatisch, ook na weken afwezigheid. Een open app controleert de weekgrens elke seconde en bij terugkeer naar het venster. Elke kalenderweek heeft zelfstandige voortgang. Eerdere trainingen blijven bewaard.

## Installeren op iPhone en offline trainen

Open de HTTPS-website in **Safari**, tik op **Deel → Zet op beginscherm** en start Ritme via het icoon. Open de app minstens eenmaal online om alle bestanden klaar te zetten. Daarna werken het schema, alle oefenuitleg, registratie en statistieken ook offline. Op Android/desktop kun je de installatieoptie van de browser gebruiken.

De serviceworker bewaart uitsluitend de appbestanden; trainingsgegevens staan in IndexedDB. Er zijn geen externe lettertypen, afbeeldingen of scripts nodig. Een eerste bezoek en eventuele aanmelding voor de privéwebsite vragen wel internet.

## Back-up en herstel

Ga naar **Instellingen → Volledige back-up**. Bewaar het JSON-bestand bijvoorbeeld in iCloud Drive. Het bevat instellingen, bronprogramma, alle sessies, onafgeronde invoer en historische snapshots van oefenuitleg en voorschriften.

Via **Back-up selecteren** wordt het bestand eerst streng gecontroleerd. Standaard voegt **Samenvoegen** alleen ontbrekende training-ID’s toe. Bestaande trainingen worden niet overschreven. **Alles vervangen** vraagt een afzonderlijke bevestiging; exporteer eerst je huidige logboek. Bij samenvoegen van dezelfde training-ID blijft de bestaande versie behouden, ook als de geïmporteerde training later is aangepast.

**CSV van je sets** exporteert alle sets met datum, weekvariant, oefening-ID, gewichtdefinitie, meetwaarden en status. CSV is voor analyse; gebruik JSON voor volledig herstel.

Opslag is lokaal per website, browser en apparaat, zonder automatische synchronisatie. De lokale preview en de gepubliceerde website hebben dus afzonderlijke logboeken. Browsergegevens wissen of opslagopruiming kan lokale data verwijderen. Een back-up is de manier om je gegevens onafhankelijk van die opslag te bewaren. De app vraagt waar ondersteund om duurzame browseropslag.

## Lokaal starten op deze Mac

Dubbelklik op **Start Ritme.command** in deze map. Dit gebruikt een aanwezige Node-installatie of de Node-runtime die bij Codex op deze Mac beschikbaar is. Open daarna **http://localhost:4173**. Houd het terminalvenster open zolang je de lokale app gebruikt. Stoppen: `Ctrl+C`.

Met Node.js 20 of nieuwer kun je ook in deze map uitvoeren:

```sh
node scripts/serve.mjs
```

Of gebruik `npm start` als npm is geïnstalleerd. Er is geen `npm install` nodig. Open `dist/index.html` niet rechtstreeks via `file://`: modules, opslag en PWA-functies vereisen een webserver.

De ontwikkelserver luistert op poort 4173. Een telefoon op hetzelfde netwerk kan de app via het lokale IP-adres van de Mac openen; installatie/offlinefunctionaliteit op een telefoon vereist HTTPS. Gebruik daarvoor de gepubliceerde website.

## Controles uitvoeren

```sh
node --test tests/*.test.mjs
node scripts/check.mjs
```

Ook beschikbaar als `npm test`, `npm run build` en `npm run lint`. Het project is een buildless ES-module-app. `dist/` bevat meteen de complete distributie; de build-/lintopdracht controleert JavaScript-syntaxis, programmastructuur en alle PWA-assets. Er is geen transpileer- of bundelstap.

De **41 tests** controleren onder andere Amsterdamse maandaggrenzen, jaren met 53 ISO-weken, jaarwisseling, zomer- en wintertijd, gemiste weken, vrije trainingsvolgorde, historische snapshots, aparte oefening-ID’s, gewichtsdefinities, ongeldige/opwarm-/overgeslagen sets, PR’s, werksetgemiddelden, laatste vijf uitvoeringen en veilig back-upherstel. Zie `TESTVERSLAG.md` voor de browsercontroles en verificatiegrenzen.

## Definities en bronkeuzes

- `dist/program.json` is een ongewijzigde kopie van de aangeleverde primaire bron, versie 1.0. De acht trainingen, alle 64 oefenplaatsen, alle 35 oefenbeschrijvingen en de zes week-2-varianten zijn behouden. `PROGRAMMA.md` is de meegeleverde toelichting; `SPECIFICATIE.md` bevat de opdracht.
- **Bronverschil:** de JSON noemt 3–6 minuten lichte beweging voor Upper en 3–5 minuten voor Lower. De Markdown noemt respectievelijk 2–3 en 3–4 minuten, binnen een totale warming-up van 5–7 minuten. De app volgt de JSON en vermeldt dit ook onder Instellingen.
- Herhalingen over zijn algemene richtlijnen uit de bron, geen verzonnen oefenspecifiek voorschrift. Ze worden voluit uitgelegd en als algemene richtlijn gelabeld.
- Dumbbells: kg per dumbbell; carries: kg per hand; machines/kabels: afgelezen kg op machine/gewichtsstapel; halters: totale kg inclusief stang. Wrist curls worden consequent met één dumbbell geregistreerd. Ondersteunde beenoefeningen/back extensions kunnen zonder externe last; optionele last is het totaal. Deze laatste invoerafspraken vullen de ontbrekende gewichtsdefinities van de bron expliciet aan.
- Eenzijdige oefeningen: links + rechts samen één set; noteer gewicht en herhalingen per kant. Houd dezelfde belasting aan en beschrijf verschillen in de setnotitie. Hierdoor worden verschillende definities niet onzichtbaar gemengd.
- Gewichtsrecord = hoogste geldige, afgeronde werkset voor exact dezelfde oefening-ID en gewichtsdefinitie, met datum en reps. Gemiddelden zijn rekenkundige gemiddelden van werksets. Het recente gemiddelde gebruikt werksets uit maximaal vijf laatste uitvoeringen, geen gemiddelde van sessiegemiddelden. Ook een afgeronde set in een nog niet voltooide training telt mee.
- Hangs gebruiken seconden; lichaamsgewichtoefeningen gebruiken reps; carries tonen afstand én een afzonderlijk gewichtsrecord/gemiddelde en een gewichtsgrafiek. Ontbrekende kg blijven `null`, nooit automatisch nul.
- Volume = som van ingevoerde kg × reps; per dumbbell of per kant waar van toepassing, zonder verdubbeling. Alleen vergelijken binnen dezelfde oefening en definitie. Geen schattingen van spiermassa of 1RM.
- Verander je je ankermaandag, dan verandert de weekweergave. Opgeslagen datums, originele weekvariant, instructies en resultaten worden niet herschreven. Historie kan daardoor afwijken van een opnieuw berekend schema.
- Scapular push-ups staan in alle Upper-warming-ups; ondersteund hangen is optioneel; de dead hang is uitsluitend een optionele Upper B-finisher. Bestaande fysiotherapie-instructies zijn alleen zichtbaar als broninformatie en worden niet omgezet in een nieuw revalidatieschema.

## Projectstructuur en onderhoud

```text
dist/
  index.html, styles.css, app.mjs   schermen en bediening
  core.mjs                        pure kalender-, model-, statistiek- en back-uplogica
  storage.mjs                     IndexedDB met revisioncontrole
  program.json                    exacte trainingsbron
  sw.js, manifest.webmanifest      offlinecache en installatie
  icon*.png, icon.svg              eigen appicoon
scripts/                          lokale server en buildcontrole
tests/                            logica-tests met Node’s ingebouwde test runner
.openai/hosting.json               identiteit van de privéwebsite en statische distributiemap
```

Opslag heeft schema-versie 1. Elke training bewaart een eigen datum, kalenderweek, variant, bronversie, tijdzone en instructie-/voorschriftsnapshot. Gelijktijdig schrijven vanuit twee tabbladen wordt door een transactionele revisioncontrole geweigerd; de app biedt dan export en herladen aan. Beschadigde bestaande opslag wordt niet stilzwijgend vervangen door lege data.

Bij wijzigingen aan appbestanden: verhoog de cacheversie in `dist/sw.js`. Bij datamodelwijzigingen: voeg een expliciete migratie toe en behoud ondersteuning voor bestaande exports. Er is geen analytics, tracking of trainingsdata-API. De privéhosting beschermt toegang tot de website; het trainingslogboek zelf blijft lokaal.
