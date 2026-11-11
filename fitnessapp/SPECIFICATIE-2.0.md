# CODEX-OPDRACHT — RITME 2.0
## Herontwerp mijn fitness-webapp tot een snelle, elegante en intuïtieve trainingsapp

### Project en uitgangspunt

Ik wil mijn bestaande fitness-webapp **Ritme** grondig verbeteren. De nadruk ligt op de startpagina, trainingsnavigatie, trainingsplanning, oefeningregistratie en gebruiksvriendelijkheid tijdens het sporten.

De app bestaat al en is gepubliceerd via GitHub Pages. Bouw verder op de bestaande code, het huidige trainingsprogramma, de gegevensstructuur en de visuele identiteit. **Maak geen nieuwe app vanaf nul.**

De centrale ontwerpfilosofie is:

**Open de app. Zie je training. Train. Registreer. Klaar.**

Mijn belangrijkste gebruiksscenario:

Ik sta in de sportschool, haal mijn iPhone 13 Pro tevoorschijn en open Ritme vanaf het beginscherm. Ik wil onmiddellijk mijn actuele training zien, inclusief alle oefeningen. Ik wil kunnen scrollen, mijn sets registreren en mijn volgende oefening vinden zonder onnodige navigatie.

De app moet aanvoelen als een hoogwaardige, minimalistische native fitness-app, niet als een website met marketingteksten en dashboards.

Functionele eenvoud, snelheid en overzicht zijn belangrijker dan decoratie.

---

## 1. Maak de actuele training de startpagina

De huidige startpagina bevat grote introductieteksten, zoals "Vind jouw ritme" en "Sterker, op jouw ritme", gevolgd door voortgangsinformatie en trainingskaarten.

Dat ziet er mooi uit, maar is niet praktisch genoeg.

**Verwijder de grote welkomstbanner en alle overbodige introductie-elementen.**

De nieuwe startpagina moet direct tonen:

- Het huidige kalenderweeknummer.
- De eerstvolgende nog niet voltooide training, bijvoorbeeld "Lower A1".
- Een korte omschrijving van de training.
- De voortgang binnen deze training.
- Direct daaronder de volledige lijst met oefeningen.
- Mogelijkheden om sets, herhalingen en gewichten meteen te registreren.

Ik wil de app openen en zonder extra klikken door alle oefeningen kunnen scrollen.

Gebruik één verticale kolom. Geen raster met vier grote trainingskaarten op het beginscherm.

Noem het eerste navigatietabblad **Training**, niet "Vandaag". Er is namelijk niet noodzakelijk een training aan de huidige kalenderdag gekoppeld.

Houd de bovenkant compact. De naam van de training en de oefeningen moeten visueel de hoofdrol spelen.

## 2. Definitieve trainingsstructuur: vier trainingen zonder vaste trainingsdagen

**Dit is een harde ontwerpregel: geen enkele training krijgt een vaste weekdag toegewezen.**

Ik bepaal zelf wanneer ik train.

De app bepaalt uitsluitend welke vier trainingen bij een bepaalde trainingsweek horen en in welke volgorde ze staan.

De vaste rotatie is:

### Weektype 1

1. Lower A1
2. Upper A1
3. Lower B1
4. Upper B1

### Weektype 2

1. Lower A2
2. Upper A2
3. Lower B2
4. Upper B2

Deze twee weektypen blijven elkaar afwisselen.

De eerste training van iedere week is dus altijd Lower.

Er mogen nergens vaste trainingsdagen zoals maandag, dinsdag of donderdag aan individuele trainingen worden gekoppeld.

Maak ook geen automatische aanbevelingen voor specifieke trainingsdagen.

Ik kan mijn eerste Lower-training bijvoorbeeld op maandag doen, maar ook op woensdag. Dat verandert niets aan de trainingsvolgorde.

**De app bepaalt welke training aan de beurt is. Ik bepaal wanneer ik train.**

Verander de bestaande oefeningen, sets, doelherhalingen, rusttijden, intensiteitsvoorschriften en veiligheidsafspraken niet zonder duidelijke inhoudelijke noodzaak.

## 3. Interne startdatum en automatische weekrotatie

Het trainingsprogramma begint officieel op:

**30 november 2026 — ISO-kalenderweek 49.**

Deze datum moet als interne referentiedatum worden vastgelegd.

Gebruik deze voor de berekening van trainingsweken en de tweeweekse rotatie.

De eerste weken zijn:

| Kalenderweek | Trainingsweek | Weektype |
|---|---|---|
| Week 49, 2026 | 1 | A1/B1 |
| Week 50, 2026 | 2 | A2/B2 |
| Week 51, 2026 | 3 | A1/B1 |
| Week 52, 2026 | 4 | A2/B2 |
| Week 53, 2026 | 5 | A1/B1 |
| Week 1, 2027 | 6 | A2/B2 |

De interne trainingsweek loopt van maandag 00.00 uur tot de daaropvolgende maandag 00.00 uur volgens de tijdzone Europe/Amsterdam.

Gebruik betrouwbare ISO-weekberekeningen die correct omgaan met jaarwisselingen, schrikkeljaren en zomer-/wintertijd.

Belangrijk:

- De startdatum is een technische referentiedatum.
- Toon geen grote aankondiging over 30 november.
- Toon geen teksten die zeggen dat ik op maandag moet trainen.
- Het kalenderweeknummer en eventueel het trainingsweeknummer mogen gewoon zichtbaar zijn.
- Voor de startdatum mag het programma als voorbeeld bekeken worden, zonder officiële voortgang te creëren.
- De rotatie wordt bepaald door de kalenderweek, niet door het aantal trainingen dat ik heb afgerond.

De gebruiker mag niets hoeven instellen om deze rotatie te laten functioneren.

## 4. Automatisch de eerstvolgende training selecteren

Ritme moet zelfstandig bepalen welke training binnen de huidige trainingsweek aan de beurt is.

Gebruik standaard de eerste nog niet voltooide training uit de vaste volgorde.

Voorbeeld:

- Bij het openen staat Lower A1 klaar.
- Ik voer de training uit en markeer deze als voltooid.
- Daarna verschijnt Upper A1 automatisch als mijn volgende training.
- Na Upper A1 volgt Lower B1.
- Daarna Upper B1.

Dit gebeurt onafhankelijk van de dag waarop ik train.

Een voltooide training blijft altijd toegankelijk via Schema of Geschiedenis.

Als alle vier de trainingen voltooid zijn, toon dan een subtiele felicitatie en een compact weekoverzicht. Begin niet voortijdig aan de volgende trainingsweek.

Bij een nieuwe kalenderweek wordt automatisch het juiste volgende weektype actief.

Als ik niet alle trainingen heb afgerond, bewaar dan de werkelijke voortgang in de historie. Markeer gemiste trainingen niet automatisch als voltooid en neem ze niet stilzwijgend over naar een andere week.

De nieuwe kalenderweek krijgt gewoon de vier trainingen van het bijbehorende weektype.

Ik moet daarnaast handmatig een andere training binnen mijn huidige week kunnen kiezen.

Maak daarbij onderscheid tussen een training bekijken en daadwerkelijk een training uitvoeren. Het openen van een training mag nooit automatisch de voortgang veranderen.

## 5. Voeg een afzonderlijk tabblad Schema toe

Ik wil een duidelijk onderscheid tussen het daadwerkelijk trainen en het bekijken van mijn volledige trainingsprogramma.

Het tabblad **Training** is actiegericht.

Het nieuwe tabblad **Schema** is overzichtgericht.

### Het tabblad Schema bevat:

- De huidige kalenderweek.
- Alle vier de trainingen van die week.
- Hun vaste volgorde.
- De voltooiingsstatus van iedere training.
- Een duidelijke aanduiding van de eerstvolgende training.
- De mogelijkheid om iedere training te bekijken.
- Navigatie naar eerdere en toekomstige weken.
- Inzicht in de afwisseling tussen weektype 1 en weektype 2.

Gebruik trainingsnamen en volgordenummers, geen toegewezen weekdagen.

Maak een overzichtelijke interface met vier visueel onderscheidbare trainingskaarten of compacte rijen.

Voorbeeld:

**Week 49 — Trainingsweek 1**

1. Lower A1
2. Upper A1
3. Lower B1
4. Upper B1

**Week 50 — Trainingsweek 2**

1. Lower A2
2. Upper A2
3. Lower B2
4. Upper B2

Bij het bekijken van toekomstige weken mag de bestaande trainingsvoortgang niet veranderen.

Een toekomstige training mag als voorbeeld geopend worden, maar dat mag geen onbedoelde trainingssessie of registratie aanmaken.

Het scherm moet overzichtelijk blijven en gemakkelijk met één hand te bedienen zijn.

## 6. Nieuwe onderste navigatie

Gebruik maximaal vijf hoofdtabbladen:

1. **Training**
2. **Schema**
3. **Statistieken**
4. **Oefeningen**
5. **Meer**

Het tabblad Training is standaard geselecteerd wanneer ik de app open vanaf het beginscherm van mijn iPhone.

Plaats de bestaande onderdelen Geschiedenis en Instellingen onder Meer.

Behoud alle functionaliteit daarvan.

De onderste navigatie moet compact, visueel rustig en consistent zijn.

Zorg dat deze correct werkt met de safe areas van de iPhone en geen belangrijke inhoud bedekt.

## 7. Ontwerp de oefenlijst voor daadwerkelijk gebruik in de sportschool

Dit is het belangrijkste functionele onderdeel van de app.

Iedere oefening krijgt een eigen compact, mooi vormgegeven onderdeel.

Toon minimaal:

- Oefeningnummer en naam.
- Voorgeschreven aantal sets.
- Doelherhalingen.
- Rusttijd, wanneer relevant.
- Laatst gebruikte gewicht en herhalingen, indien beschikbaar.
- Registratievelden voor gewicht en herhalingen per set.
- Een eenvoudige manier om een set als voltooid te markeren.
- Een duidelijke voortgangsindicator.
- Een subtiele knop voor uitgebreide oefeninginformatie.

Ik wil de verschillende oefeningen tijdens het scrollen duidelijk kunnen onderscheiden.

Gebruik hiervoor:

- Subtiele achtergrondverschillen.
- Rustige scheidingslijnen.
- Afgeronde hoeken.
- Consistente witruimte.
- De bestaande kleuren van Ritme.
- Duidelijke typografische hiërarchie.

Voorkom dat iedere oefening onnodig veel schermruimte inneemt.

**De registratievelden moeten direct op het trainingsscherm beschikbaar zijn.**

Ik wil niet voor iedere set een aparte pagina of pop-up moeten openen.

Gebruik waar mogelijk de vorige set als uitgangspunt voor de volgende set.

Registreer nooit automatisch een set als voltooid wanneer ik alleen een gewicht of herhalingsaantal verander.

## 8. Maak gewicht en herhalingen bijzonder eenvoudig in te voeren

Ik wil bij iedere set het gewicht in kilogrammen en het aantal herhalingen kunnen registreren.

Ondersteun twee invoermethoden:

1. Direct een getal typen via het numerieke toetsenbord.
2. Snel een waarde aanpassen via een slimme selector, scrollbediening of plus- en minknoppen.

Laat Codex beoordelen welke combinatie het meest geschikt is voor snelle bediening met één hand.

### Slimme gewichtsselectie

Voorkom dat ik vanaf 0,5 kg langs honderden waarden moet scrollen om bijvoorbeeld 60 kg te bereiken.

Gebruik daarom:

- Het laatst geregistreerde gewicht als standaardvoorstel.
- Het gewicht van de vorige set wanneer dat relevant is.
- Een logische, aanpasbare beginwaarde als er nog geen historie is.
- Passende stappen van bijvoorbeeld 0,5, 1, 2,5 of 5 kg.
- Snelle invoer van grote waarden, zoals 40, 60, 80 of 100 kg.
- De mogelijkheid om ieder geldig gewicht rechtstreeks in te typen.
- Correcte ondersteuning voor decimalen en de Nederlandse komma.

Gebruik een gewichtselector die zich richt op een relevante waarde en niet automatisch bij nul begint.

### Herhalingen

Maak het eveneens gemakkelijk om herhalingen te verhogen, verlagen of rechtstreeks in te voeren.

Hergebruik waar mogelijk de vorige setwaarden.

Voorkom onnodige bevestigingsvensters, toetsenborden en extra handelingen.

### Registratieconventies

Bij dumbbell-oefeningen moet duidelijk zijn of het gewicht per dumbbell wordt geregistreerd.

Ondersteun oefeningen met lichaamsgewicht op een logische manier.

Gebruik bestaande registratieconventies consequent, zodat historische gegevens vergelijkbaar blijven.

Bewaar iedere uitgevoerde set afzonderlijk, inclusief relevante context voor de trainingshistorie.

## 9. Uitgebreide oefeningdetails achter één tik

Het trainingsscherm moet minimalistisch blijven.

Uitgebreide informatie verschijnt pas wanneer ik daarom vraag.

Wanneer ik op een oefening of informatieknop tik, open dan een elegant detailscherm.

Dit mag een bottom sheet, modal of andere goed gekozen mobiele oplossing zijn.

Laat Codex zelf bepalen welke UX-oplossing het beste is.

### A. Technische uitvoering

Toon duidelijke, praktische informatie over:

- De correcte uitgangspositie.
- De beweging zelf.
- De bewegingsuitslag.
- Belangrijke aandachtspunten.
- Veelgemaakte fouten.
- De belangrijkste betrokken spiergroepen.
- Relevante veiligheidsaanwijzingen.

De uitleg moet concreet, begrijpelijk en bruikbaar zijn in de sportschool.

### B. Visuele ondersteuning

Voeg indien mogelijk een passende illustratie toe.

De afbeelding moet daadwerkelijk de juiste oefening tonen.

Gebruik uitsluitend afbeeldingen met geschikte gebruiksrechten en vermeld waar nodig de bron.

Gebruik geen misleidende, willekeurige of anatomisch onjuiste afbeeldingen.

Als er geen geschikte afbeelding beschikbaar is, heeft een goede tekstuele uitleg de voorkeur.

### C. Persoonlijke prestaties

Laat op basis van mijn werkelijk geregistreerde gegevens zien:

- Mijn hoogste geregistreerde trainingsgewicht.
- Mijn persoonlijk record.
- Mijn gemiddelde gebruikte gewicht.
- Mijn gemiddelde aantal herhalingen.
- Mijn vorige uitvoering van deze oefening.
- Mijn ontwikkeling in gewicht, herhalingen of trainingsvolume.
- Eventueel een geschatte 1RM, als dat zinvol en betrouwbaar genoeg is.

Definieer persoonlijk records en gemiddelden consequent. Maak duidelijk waarop een berekening is gebaseerd.

Een geschatte 1RM moet herkenbaar een schatting zijn, geen daadwerkelijk gemeten record.

Toon geen verzonnen prestaties wanneer er nog geen historie bestaat.

Het detailscherm moet snel openen, soepel werken en eenvoudig te sluiten zijn.

## 10. Verbeter het tabblad Oefeningen

Behoud het bestaande tabblad Oefeningen, maar maak het veel overzichtelijker.

Het moet functioneren als een complete oefeningbibliotheek.

Maak filteren mogelijk op:

- Lower A1
- Upper A1
- Lower B1
- Upper B1
- Lower A2
- Upper A2
- Lower B2
- Upper B2

Gebruik bijvoorbeeld een compacte filter of horizontaal scrollbare categorieën.

Voeg daarnaast een zoekfunctie toe waarmee ik oefeningen op naam kan vinden.

Een oefening die in verschillende trainingen voorkomt, mag in meerdere categorieën zichtbaar zijn, maar moet één gedeeld oefeningrecord en één consistente prestatiehistorie behouden.

Vanuit dit tabblad moet ik dezelfde technische uitleg, afbeeldingen en persoonlijke prestaties kunnen bekijken als vanuit het trainingsscherm.

Zorg voor duidelijke navigatie tussen de oefeningbibliotheek en de training.

## 11. Behoud de visuele identiteit van Ritme

De huidige uitstraling van Ritme vind ik erg mooi.

Behoud daarom:

- Het Ritme-logo.
- De zachte, rustige achtergrond.
- De donkergroene kleurstelling.
- De subtiele lichtgroene accenten.
- De bestaande elegante typografie.
- De afgeronde kaarten.
- De premium, minimalistische uitstraling.

Vereenvoudig echter de interface.

Verwijder:

- Grote marketingbanners.
- Overbodige welkomstteksten.
- Dubbele informatieblokken.
- Decoratieve elementen zonder functionele waarde.
- Onnodig grote lege ruimtes.
- Extra navigatiestappen die het trainen vertragen.

Het ontwerp moet aanvoelen als een hoogwaardige fitness-app, niet als een promotionele landingspagina.

Gebruik animaties spaarzaam en alleen wanneer ze de gebruikerservaring verbeteren.

**Functionaliteit en overzicht gaan altijd voor decoratie.**

## 12. Optimaliseer specifiek voor iPhone 13 Pro

Mijn belangrijkste apparaat is een iPhone 13 Pro.

Ik open de webapp meestal via een icoon op mijn beginscherm.

Optimaliseer de volledige ervaring voor mobiel gebruik.

Vereisten:

- Uitstekende weergave rond 390 CSS-pixels schermbreedte.
- Correcte ondersteuning voor notch, statusbalk en safe areas.
- Geen tekst of bediening achter de onderste navigatie.
- Grote, goed te bedienen aanraakvlakken.
- Soepel verticaal scrollen.
- Geen horizontaal scrollende oefenlijsten.
- Intuïtieve bediening met één hand.
- Snelle numerieke invoer.
- Goed leesbare oefeningnamen en registratievelden.
- Geen onnodige schermwisselingen.
- Correct gedrag in standalone PWA-modus.
- Behoud van de bestaande offlinefunctionaliteit.

De app moet snel openen en direct bruikbaar zijn.

Gebruik zo min mogelijk onnodige interfaces die het trainingsproces onderbreken.

## 13. Behoud trainingsgegevens en voorkom dataverlies

Ritme registreert mijn trainingshistorie, gewichten, herhalingen en voortgang.

Deze gegevens zijn belangrijk en moeten betrouwbaar bewaard blijven.

Zorg ervoor dat:

- Bestaande opgeslagen trainingsgegevens behouden blijven.
- Updates geen onbedoelde reset veroorzaken.
- Iedere set afzonderlijk wordt opgeslagen.
- Trainingen aan de juiste trainingsweek gekoppeld blijven.
- De weekrotatie onafhankelijk van historische voltooiingen werkt.
- Gemiste trainingen nooit automatisch als voltooid worden beschouwd.
- Ik een training handmatig als voltooid kan markeren.
- Ik een onjuiste voltooiingsstatus kan herstellen.
- Statistieken uitsluitend op daadwerkelijke registraties zijn gebaseerd.
- De bestaande lokale opslag behouden blijft.
- Bestaande export- en importfunctionaliteit behouden blijft.

Controleer of een datamigratie noodzakelijk is en voer die veilig uit.

Voeg bij voorkeur een eenvoudige mogelijkheid toe om mijn trainingsgegevens te exporteren en later opnieuw te importeren, als dit nog niet bestaat.

De app hoeft geen accountsysteem, online database of complexe synchronisatie te krijgen.

Houd er wel rekening mee dat lokale browsergegevens niet automatisch tussen apparaten synchroniseren.

## 14. Zorg voor consistente statistieken en geschiedenis

De bestaande onderdelen Statistieken en Geschiedenis moeten blijven werken.

Werk ze waar nodig bij zodat ze aansluiten op de nieuwe trainingsstructuur.

Toon uitsluitend gegevens die gebaseerd zijn op daadwerkelijk geregistreerde trainingen.

Mogelijke statistieken zijn:

- Aantal voltooide trainingen.
- Trainingsvolume per oefening.
- Vooruitgang in gewicht.
- Vooruitgang in herhalingen.
- Persoonlijke records.
- Trainingsfrequentie.
- Historische prestaties per oefening.

Voorkom dat toekomstige trainingen als afgerond worden meegeteld.

Bewaar historische trainingsgegevens ook wanneer een nieuwe kalenderweek begint.

Zorg dat het nieuwe tabblad Schema en de statistieken dezelfde berekeningslogica gebruiken.

## 15. Technische uitvoering

Inspecteer eerst de bestaande projectstructuur, componenten, trainingsdata, opslag, configuratie en GitHub-publicatieworkflow.

Voer vervolgens alle wijzigingen daadwerkelijk door in de bestaande applicatie.

Werk zorgvuldig, hergebruik bestaande componenten waar dat zinvol is en voorkom onnodige complexiteit.

Belangrijke technische controles:

1. De bestaande oefeningen en het trainingsprogramma blijven intact.
2. De startpagina opent direct op de juiste training.
3. De vaste Lower–Upper–Lower–Upper-volgorde werkt.
4. De tweeweekse A1/B1- en A2/B2-rotatie klopt.
5. De interne startdatum van 30 november 2026 wordt correct toegepast.
6. De ISO-weekberekening werkt bij jaarwisselingen.
7. Geen enkele training wordt aan een specifieke weekdag gekoppeld.
8. Het tabblad Schema toont juiste actuele en toekomstige trainingen.
9. De volgende training verschijnt na voltooiing automatisch.
10. Handmatige selectie veroorzaakt geen onbedoelde registraties.
11. Gewicht en herhalingen kunnen snel worden ingevoerd.
12. Sets en trainingen worden betrouwbaar opgeslagen.
13. Oefeningdetails, PR's en gemiddelden functioneren correct.
14. De mobiele interface werkt op iPhone-formaat.
15. Er ontstaan geen JavaScript-fouten.
16. De productiebuild slaagt.
17. Bestaande PWA-functionaliteit en offlineondersteuning blijven werken.

Schrijf of werk waar passend automatische tests bij voor weekrotatie, trainingsselectie, voltooiingsstatus, databehoud en invoerlogica.

## 16. GitHub Pages en publicatie

De bestaande app wordt gepubliceerd via GitHub Pages onder:

`/Fitness-app/`

Controleer de werkelijke repositorystructuur, configuratie en GitHub Actions-workflow.

Controleer onder andere:

- De juiste base path.
- De serviceworker.
- De PWA-manifestinstellingen.
- Assetpaden.
- De productiebuild.
- De map die door GitHub Pages gepubliceerd wordt.

Als de workflow een vooraf gebouwde `dist`-map publiceert, zorg dan dat de bijgewerkte productiebuild daadwerkelijk in die map terechtkomt.

Voorkom dat GitHub Pages na de wijzigingen een oude versie van de app blijft tonen.

Behoud het bestaande websiteadres.

Wijzig geen publicatie-instellingen die al correct functioneren, tenzij dat noodzakelijk is.

Maak de gewijzigde bestanden gereed voor GitHub. Commit en push alleen als de omgeving daarvoor is ingericht en de benodigde toegang beschikbaar is.

## 17. Eindresultaat en acceptatietest

Het belangrijkste doel is de volgende gebruikerservaring:

Ik sta in de sportschool en open Ritme vanaf het beginscherm van mijn iPhone.

De app opent rechtstreeks op **Training**.

Ik zie onmiddellijk welke training aan de beurt is.

Daaronder staan alle oefeningen, overzichtelijk onder elkaar.

Ik kan mijn gewicht en herhalingen invoeren zonder onnodig te typen of eindeloos te scrollen.

Bij iedere oefening kan ik met één tik mijn eerdere prestaties, persoonlijk record en technische uitleg bekijken.

Ik werk mijn sets af en markeer de training als voltooid.

Wanneer ik opnieuw de app open, staat automatisch mijn volgende training klaar.

Via **Schema** kan ik rustig bekijken welke trainingen nog openstaan en hoe de volgende trainingsweken eruitzien.

De app vertelt mij nooit op welke weekdag ik moet trainen.

Ik bepaal mijn eigen trainingsdagen.

**Het eindresultaat moet een snelle, elegante, minimalistische en uiterst praktische fitness-app zijn die ik zonder frustratie tijdens iedere training kan gebruiken.**

Maak zelf weloverwogen UX-keuzes zolang deze de bovenstaande uitgangspunten respecteren.

Behoud wat goed werkt, verwijder wat overbodig is en verbeter wat omslachtig is.

**Voer de aanpassingen daadwerkelijk uit en beperk je niet tot aanbevelingen of een ontwerpvoorstel.**

Lever na afloop een compact overzicht met:

- Welke functionaliteit is gewijzigd.
- Hoe de nieuwe navigatie werkt.
- Hoe de trainingsrotatie is geïmplementeerd.
- Welke tests zijn uitgevoerd en wat de resultaten waren.
- Of de productiebuild geslaagd is.
- Welke bestanden zijn gewijzigd.
- Of de nieuwe versie naar GitHub is gepubliceerd of welke stappen daarvoor nog nodig zijn.
