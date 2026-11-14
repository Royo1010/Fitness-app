# Codex — werk mijn bestaande fitnessapp bij naar vast fitnessprogramma v2.2

Je werkt in mijn **bestaande** fitnessapp/repository. Bouw geen nieuwe app en vervang mijn huidige interface niet zonder noodzaak. Analyseer eerst de bestaande code, datastructuren, weekwisseling, registratie, statistieken en oefeningdetailpagina's. Voer daarna de onderstaande wijziging zorgvuldig door.

## Bronnen
1. `fitnessprogramma_v2_2.json` — **leidende bron** voor de exacte 8 trainingen, 2 weken, aantallen, rust en inspanning.
2. `fitnessprogramma_v2_2_volledig.md` — leesbare versie met context en extra uitvoeringstechniek voor de nieuwe oefening.
3. De bestaande app en bestaande oefeninstructies blijven de basis voor de overige oefeningdetails. Verwijder of verkort de bestaande gedetailleerde techniekcues niet.

## Opdracht

1. Toon **uitsluitend vier fitnessworkouts per kalenderweek**, zonder vaste trainingsdagen of jiu-jitsu. Week 1: Upper A, Lower A, Upper B, Lower B. Week 2: Upper A2, Lower A2, Upper B2, Lower B2. De app kiest de juiste trainingsweek en houdt de volgorde overzichtelijk. Bij de eerste installatie of bij een bestaande ingestelde startweek moet het week-1-anker behouden blijven; verzin geen nieuwe startdatum als er al een is.
2. **Automatische weekwisseling:** maandag om 00:00 in `Europe/Amsterdam` gaat de app van variant 1 naar 2 of omgekeerd. De overgang moet correct worden bepaald bij het openen/heropenen van de app, ook zonder actieve timer, en ook bij zomer-/wintertijd en jaarwisseling. Baseer de cyclus op het aantal kalenderweken sinds het bestaande opgeslagen startanker, niet uitsluitend op het ISO-weeknummer. De eigen loghistorie mag niet verdwijnen wanneer de cyclus wisselt.
3. Neem **exact** de oefeningen, sets, herhalingen/tijd/afstand en de vijf wisselingen van de bijgevoegde v2.2-gegevens over. Belangrijkste wijzigingen: seated leg curl op Lower A naar 3 sets; leg press op Lower B naar 4 sets; external rotation met 2 sets van Upper B naar Lower A; Upper B bevat daarom nog 7 oefeningen. Lower A heeft 7 oefenplaatsen, Upper A 8, Upper B 7 en Lower B 7.
4. **Keuzeoefening op Lower A en Lower A2:** eerste positie biedt een duidelijke keuze tussen (A) conventional barbell deadlift, `2 × 5–8` met circa 2–3 technisch goede herhalingen over, en (B) barbell bent-over row, `2 × 8–12` met circa 2–3 technisch goede herhalingen over. De gebruiker kiest per trainingssessie **slechts één** alternatief. Toon niet beide alsof ze moeten worden uitgevoerd. Keuze kan vóór registratie worden veranderd en wordt per sessie opgeslagen. Als een keuze wordt gewijzigd nadat sets zijn gelogd: vraag om bevestiging of behoud de eerdere data bij de betreffende oefening; verlies geen gelogde gegevens.
5. De deadlift en bent-over row zijn **verschillende oefening-ID's**. Houd hun registratie, vorige gewicht, persoonlijke records, gemiddelden en grafieken volledig gescheiden. Verplaats bestaande deadliftgeschiedenis niet naar de bent-over row. Behoud bestaande oefening-ID's waar mogelijk en maak alleen voor echt nieuwe oefeningen een stabiele ID. Als de bestaande app per oefening één representatieve set vastlegt in plaats van alle werksets, **behoud dat bestaande invoerontwerp**; wijzig het loggedrag niet ongevraagd. Toon wel het voorgeschreven aantal werksets.
6. De nieuwe bent-over barbell row krijgt een volledige Nederlandse oefenbeschrijving (startpositie, voeten, heupscharnier, knieën, neutrale rug, brace van de core, stangpad, elleboog-/polspositie, ademhaling, excentrische fase, vaak gemaakte fouten, waarschuwing bij linkerarmklachten). Haal de cues uit het meegeleverde Markdown-bestand, verbeter de tegenstrijdige greeptaal waar nodig: **bovenhandse greep**. Behoud alle bestaande gedetailleerde uitleg bij de andere oefeningen; zorg dat ieder oefeningdetail openklapbaar/aanklikbaar is.
7. De app noemt de inspanningsindicator consequent begrijpelijk, bijvoorbeeld `Nog 2 goede herhalingen over` (niet uitsluitend `RIR 2`). Voor carries en hangs: tijd/afstand, geen onzinnige 'herhalingen over'. Maak de bijbehorende rusttijd zichtbaar zonder een overvolle interface.
8. Scapular push-ups staan als **normale werksets** op Upper A/A2, niet alleen in een warming-up. Dead hang is **normale werkset** op Upper B/B2, niet alleen een optionele warming-up. De tweeweekse 80/20-cyclus blijft: vijf wisselende oefeningen per 29 oefenplaatsen per week. De externe-rotatie-variatie is voortaan op Lower A/A2, niet meer Upper B/B2.
9. Bewaar de huidige mooie, rustige, mobielvriendelijke vormgeving, navigatie, back-up/export/import, bestaande sessiehistorie en alle bestaande statistieken. Het aanpassen van de schema-data mag oude resultaten niet overschrijven. Pas eventuele opslagmigraties zorgvuldig en achterwaarts compatibel toe. Verwijder geen gebruikersdata of oefeningen die in oude sessies voorkomen.
10. Geen nieuwe fysiotherapie- of revalidatiemodule; het voorgeschreven bicepsrevalidatieprogramma staat los van het vaste hypertrofieschema. Geen straps-regel opnemen: de gebruiker regelt dat zelf. Geen opbouwschema toevoegen; deze wijziging betreft uitsluitend het vaste schema.

## Validatie vóór oplevering

- Week 1 en week 2 tonen exact de acht trainingen uit de JSON; per trainingsweek 8/7/7/7 oefenplaatsen en 18/16/16/17 geplande werksets (waarbij deadlift/row samen één keuzeplek van twee sets zijn).
- Alle vijf oefenwisselingen staan op de **juiste** trainingsdag; de side-lying external rotation verschijnt in Lower A2.
- Lower A heeft precies één actieve keuze: deadlift of row, niet allebei; keuzeopslag werkt onafhankelijk van de kalenderweekvariant.
- Persoonlijke records, gemiddelden en laatst gebruikte gewichten blijven correct en afzonderlijk, ook voor de twee keuzeoefeningen.
- Test lokaal de weekwisseling op zondag 23:59 en maandag 00:00 (Europe/Amsterdam), rond de jaarwisseling en rond zomer-/wintertijd; eerder ingestelde week-1-ankers blijven intact.
- Trainingsgeschiedenis en export/import blijven na de update bruikbaar; bestaande gegevens verdwijnen niet.
- Bij het reviewen van de code: wijs op eventuele reële tijdsproblemen met 60-minutensessies; wijzig de vastgestelde aantallen niet eigenmachtig. Meld concrete afwijkingen of blokkades in je eindrapport.

**Voer de wijzigingen daadwerkelijk in het project door.** Geef daarna kort een overzicht van gewijzigde bestanden, controles/tests, eventuele migraties en wat ik moet doen om de nieuwe versie van mijn app te openen.
