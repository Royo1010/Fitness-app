# Ritme 2.0 — verificatie

## Geautomatiseerd

- **67 tests geslaagd, 0 mislukt** met `node --test tests/*.test.mjs`.
- Productie-/syntaxcontrole geslaagd met `node scripts/check.mjs`.
- De 41 oorspronkelijke tests blijven slagen.
- Nieuwe tests controleren de zes opgegeven weken vanaf ISO-week 49, 2026, het ISO-weekjaar, schrikkeldagen, beide zomertijdgrenzen, de vaste Lower–Upper-volgorde, automatische selectie, handmatig afwijkende volgorde, heropenen, vier afgeronde trainingen, lege voortgang in een nieuwe week, voorstartvoorbeelden en toekomstige registraties.
- Invoervoorstellen muteren geen sets en maken niets voltooid. Tests dekken komma-invoer, plus/min, gewichtsdefinities, bewaarde gewichtsstappen en gemiddelde herhalingen.
- Een v1-state en v1-JSON-back-up blijven zonder destructieve migratie bruikbaar. Samenvoegen behoudt bestaande 2.0-instellingen, ook zonder ingestelde oude ankermaandag.
- Manifest- en serviceworkertests controleren `/Fitness-app/`, relatieve assets, de nieuwe stylesheet en afscherming tegenover andere apps op dezelfde GitHub Pages-host.
- `dist/program.json` en `dist/storage.mjs` zijn ongewijzigd ten opzichte van de oorspronkelijke projectversie.

## Browserproeven

Er zijn twee gescheiden lokale origins gebruikt. De normale preview gebruikt de echte datum. Registratieproeven draaien met een lokale testklok op 30 november 2026. De testklok wordt alleen door de ontwikkelserver geïnjecteerd en is geen productiecode. Testregistraties staan uitsluitend in de gescheiden testbrowseropslag, niet in het pakket of het persoonlijke productielogboek.

Gecontroleerd:

1. Direct openen op Lower A1 met alle acht oefeningen en alle setvelden in één verticale lijst. Geen onboarding of marketingbanner.
2. De vijf hoofdtabbladen en Geschiedenis/Instellingen onder Meer.
3. Andere training kiezen zonder een sessie aan te maken; Geschiedenis bleef leeg.
4. Volgende schemaweek toont Lower A2, Upper A2, Lower B2, Upper B2. Toekomstige voorbeeldvelden zijn niet registreerbaar.
5. Snelle invoer van 60 kg, `62,5` typen, plus naar 65 kg en herhalingen van 10 naar 11. De set bleef onafgerond totdat het vinkje werd gekozen.
6. Na afronden van die set werden 65 kg en 11 herhalingen voorgesteld voor de volgende set. Die volgende set bleef onafgerond.
7. Gedeeltelijk afronden van Lower A1 selecteerde automatisch Upper A1; herladen behield deze selectie en de historische invoer.
8. Statistieken toonden 65 kg bij 11 herhalingen, gemiddeld 65 kg over precies één geregistreerde werkset, zonder open voorstellen mee te tellen.
9. Filteren op Lower A2 en zoeken op ‘extension’ werkte gezamenlijk. De gedeelde Hack squat-historie bleef via een andere trainingscategorie zichtbaar.
10. Oefeningdetails bevatten de volledige bronuitleg, PR/gemiddelden, gemiddeld 11 herhalingen en een grafiek van de echte testregistratie.
11. Alle vier trainingen konden handmatig worden afgerond. Daarna bleef een compact weekoverzicht staan, zonder voortijdige volgende week.
12. Voltooiing van Lower A1 herstellen maakte die training opnieuw de eerste open training. De geregistreerde 65 kg bleef behouden.
13. Een eerder geëxporteerde v1-back-up is via de interface gevalideerd en samengevoegd, zonder de vier 2.0-testregistraties te overschrijven en zonder de vaste weekrotatie te veranderen.
14. Ongeldige negatieve invoer kon een set niet afronden. Na geldige correctie bleef een nieuwe expliciete tik op het vinkje vereist.
15. De normale interface is visueel bekeken met een mobiele viewportinstelling van 390 × 844 pixels. In de ingebouwde preview was de gemeten inhoudsbreedte 375 CSS-pixels; ook op die smallere breedte waren alle acht oefeningen beschikbaar zonder horizontale overloop. Er waren tijdens de reguliere proeven geen JavaScript-consolefouten.

16. Beide lokale servers bewust gestopt. Daarna de normale app opnieuw geladen vanuit de serviceworkercache en tussen Training en Schema genavigeerd. Dit bleef werken onder `/Fitness-app/`.

## Verificatiegrenzen

Er is geen fysieke iPhone 13 Pro gebruikt. De mobiele afmetingen en safe-area-CSS zijn gecontroleerd in de browser; beginscherminstallatie op een echt toestel is niet uitgevoerd. Opslaggedrag bij een vol apparaat of het wissen van browserdata is niet fysiek gesimuleerd.

De daadwerkelijke GitHub-repository en Actions-workflow zijn nog niet beschikbaar. Een geslaagde lokale productiecontrole is geen bevestiging dat de bestaande GitHub Pages-website al is bijgewerkt. De oude website en publicatie-instellingen zijn niet veranderd.
