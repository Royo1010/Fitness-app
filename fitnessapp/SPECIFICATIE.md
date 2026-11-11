# Opdracht voor Codex — Bouw mijn persoonlijke fitnessapp

Je bent een ervaren fullstackontwikkelaar, productontwerper en UX/UI-designer. Bouw een volledig werkende, verzorgde **Nederlandstalige fitnessapp** voor mijn persoonlijke **vaste vierdaagse Upper/Lower-trainingsprogramma**. Maak een echte bruikbare applicatie, geen mock-up of uitsluitend een ontwerpvoorstel. Neem zelfstandig verstandige product- en ontwerpbeslissingen waar de opdracht ruimte laat.

## 1. Brondocumenten en scope

Ik lever je de bestanden `vast_fitnessprogramma_codex.json` en `vast_fitnessprogramma_volledig.md` aan. Gebruik **de JSON als primaire, exacte bron** voor alle oefeningen, oefening-ID's, weekvarianten, sets, herhalingen, rusttijden, warming-up, optionele finisher, instructies en veiligheidsinformatie. De Markdown-versie is leesbare toelichting. Controleer beide, en meld inhoudelijke tegenstrijdigheden in plaats van zelf stilzwijgend een ander programma te verzinnen. Sla brondata gestructureerd op en verbind de interface eraan; hardcode niet tientallen losse schermen.

**Bouw uitsluitend het vaste trainingsprogramma.** Geen zesweeks opbouwschema, geen jiu-jitsu, hardlopen, calorieën, voeding, sociale functies of andere ongevraagde trainingsmodules. De app bevat vier vrije trainingstypen per week: `Upper A`, `Lower A`, `Upper B`, `Lower B` en in de afwisselende week `Upper A2`, `Lower A2`, `Upper B2`, `Lower B2`. Beide varianten komen uit de JSON. Het principe is ongeveer **80% vaste oefeningen / 20% variatie**; verander het programma niet zelf.

## 2. Trainingsweek, automatische afwisseling en datums

- Een trainingsweek loopt **maandag 00:00:00 tot en met zondag 23:59:59**, gerekend in de tijdzone **Europe/Amsterdam** (inclusief correcte zomertijd-/wintertijdomschakelingen).
- Vanaf maandag om **00:00 lokale tijd** is automatisch de volgende weekvariant actief: week 1 -> week 2 -> week 1 -> week 2, doorlopend, ook bij een jaarwisseling. Een open app moet zijn weergave bijwerken; een gesloten app moet bij openen direct de juiste week tonen. Baseer dit op lokale kalenderweekgrenzen, niet op een 7×24-uurs stopwatch, ISO-weeknummerpariteit of een handmatige reset.
- Laat de gebruiker **bij de eerste configuratie kiezen wanneer week 1 begint** (standaard: maandag van de huidige week). Bewaar deze **ankermaandag**. Bereken de variant uit het aantal volledige lokale kalenderweken sinds deze ankermaandag. Laat de ankermaandag later via instellingen aanpassen met een heldere waarschuwing over de weergave van historische weken.
- **Geen vaste weekdagen aan trainingen koppelen.** Geen ‘maandag = Upper A’. Toon alleen de vier trainingen van de actieve week in logische volgorde. Ik bepaal zelf op welke dag ik welke training uitvoer, en ik mag ze in andere volgorde afronden.
- Iedere kalenderweek heeft zijn **eigen voortgang**: bijvoorbeeld 0/4, 1/4 enzovoort. Bij een nieuwe maandag begint de nieuwe voortgang op 0/4; bestaande trainingsdata blijven ongewijzigd bewaard. Niet-uitgevoerde sessies worden niet als voltooid gemarkeerd en worden ook niet automatisch ingehaald.
- Bied een duidelijke geschiedenis met terugkijken en desgewenst een training achteraf invoeren bij de juiste datum/week. Een uitvoering van dezelfde trainingsvariant twee weken later is een **nieuw trainingsmoment**, niet een overschrijving van de oude invoer.

## 3. Hoofdscherm en navigatie

Ontwerp een elegante, moderne, rustige, **mobile-first** app die prettig werkt op iPhone én op grotere schermen. Je hebt veel vrijheid in vormgeving, kleuren, typografie, iconen, micro-interacties, kaarten en navigatie. Liever een overzichtelijke interface met doordachte detailschermen, uitklapbare onderdelen en weinig primaire knoppen dan drukke tabellen. Ondersteun waar redelijk lichte en donkere weergave.

Het hoofdscherm toont meteen:
1. De huidige weekvariant: **Week 1** of **Week 2**, plus het bijbehorende maandag-zondagdatumbereik.
2. De vier trainingen, elk met naam, aantal oefeningen, indicatieve duur en status (nog niet begonnen / bezig / voltooid).
3. Voortgang van de huidige week, bijvoorbeeld **2 van 4 trainingen voltooid**.
4. Een eenvoudige ingang naar **Statistieken**, **Geschiedenis** en **Instellingen**.

Een trainingsdetail toont de oefeningen in de juiste volgorde, met oefennaam, aantal werksets, repbereik, rustadvies en **voluit geschreven herhalingen over**. Geen onverklaarde afkorting ‘RIR’. Bijvoorbeeld: ‘Stop als je nog ongeveer 2 technisch goede herhalingen zou kunnen uitvoeren’. Voor de precieze richtlijnen: gebruik de programmabron; waar geen oefenspecifiek getal beschikbaar is, label een eenvoudige algemene standaard als richtlijn, niet als bronfeit.

## 4. Training daadwerkelijk registreren

Bij een oefening moet ik eenvoudig per **werkset** kunnen invoeren:
- Gebruikt gewicht in **kilogram**, inclusief decimalen en Nederlandse komma-invoer, voor oefeningen met externe weerstand.
- Werkelijk uitgevoerde **herhalingen**.
- Optioneel: ingeschat aantal **herhalingen dat ik nog over had**, korte notitie en voltooid/niet-voltooid.
- Optioneel extra werksets toevoegen of ongedaan maken zonder de oorspronkelijke programmavoorschriften te wijzigen.

Gebruik waar passend andere invoertypen: **seconden** voor hangs, **meters** en gewicht voor farmers carries, herhalingen voor lichaamsgewichtoefeningen en eventueel toegevoegde externe last. Gebruik nooit fictieve ‘0 kg’ als vervanging voor ontbrekende gegevens.

Maak duidelijk wat een gewicht betekent, bijvoorbeeld **kg per dumbbell / per hand** bij dumbbelloefeningen, **kg op de machine/gewichtsstapel** bij machineoefeningen, of **totale externe last** bij een halter. Houd deze betekenis consistent en vermeld ze bij invoer en statistiek. Voor eenzijdige oefeningen zijn links/rechts apart registreren of een gezamenlijke set met beide zijden mogelijk; kies een logische UX en voorkom dat gewichten met verschillende definities onzichtbaar door elkaar worden vergeleken.

Laat de laatste gebruikte belasting en de laatst gelogde sets van **exact dezelfde oefening-ID** zien bij de volgende uitvoering. Maak aanpassen en verwijderen van foutieve invoer mogelijk, met bescherming tegen onbedoeld dataverlies. Een training kan worden gestart, gepauzeerd, gedeeltelijk opgeslagen, hervat en expliciet afgerond. Laat de gebruiker niet verplicht alle vier de trainingen doen voordat een nieuwe week kan starten.

Een optionele, onopdringerige **rusttimer** is welkom, afgestemd op de rusttijd uit het programma. Maak dit niet de dominante functie.

## 5. Persoonlijke records, gemiddelde gewichten en voortgang

Toon per oefening op het trainingsscherm en het oefendetailscherm:
- **Gewichtsrecord (PR):** het hoogste daadwerkelijk geregistreerde gewicht van een geldige afgeronde werkset voor **precies deze oefening**, met datum en aantal herhalingen. Dit is een record in gebruikt gewicht, niet per definitie een record in spierkracht of een berekende 1RM.
- **Gemiddeld gebruikt gewicht:** het rekenkundig gemiddelde van de geldige geregistreerde **werksets** voor dezelfde oefening, met helder label ‘gemiddelde over alle geregistreerde werksets’. Toon zo mogelijk ook ‘gemiddelde laatste 5 uitvoeringen’ om recente progressie zichtbaar te maken.
- **Laatste uitvoering:** gewicht, herhalingen en datum, zodat ik snel kan zien wat ik de vorige keer deed.
- Bij nog geen data: een nette lege toestand zoals ‘Nog geen trainingsgegevens’, zonder verzonnen waarden.

Bereken gewichtstatistieken alleen voor oefeningen waar gewichtsregistratie betekenisvol is. Voor hangs, oefeningen met lichaamsgewicht en andere metingen toon je toepasselijke records en gemiddelden (bijvoorbeeld seconden, herhalingen, meters) in plaats van geforceerde kilogramcijfers. Tel opwarmsets en niet-afgeronde/ongeldige sets niet mee voor PR of gemiddelden. Houd verschillende oefening-ID's — ook week-2-alternatieven — standaard afzonderlijk, zelfs als ze op elkaar lijken.

Maak een fraai **Statistieken**-scherm met onder andere:
- Grafiek van gemiddeld werksetgewicht **per trainingssessie**, per oefening, over de tijd.
- Persoonlijke gewichtsrecords en nieuwe records; per meettype de passende eenheid.
- Oefeninggeschiedenis, trend in herhalingen/werksets en — waar zinvol en duidelijk gedefinieerd — trainingsvolume.
- Aantal voltooide trainingen per kalenderweek en langere termijn.
- Heldere filters (oefening, periode) en nette weergave als er nog weinig data is.

Wees kritisch bij het interpreteren van gewicht: een machinegewicht is niet vergelijkbaar met kilogrammen dumbbells; een zwaardere set met minder herhalingen betekent niet automatisch meer spiergroei. Gebruik geen onbewezen claims over fysiologische groei. Toon trainingstrends, geen verzonnen spiermassametingen.

## 6. Uitgebreide oefeninstructies

**Iedere oefening moet aanklikbaar zijn.** Open dan een zorgvuldig ontworpen oefenpagina, modal of uitklapbaar detail met de volledige informatie uit `exercises[exercise_id]` van de JSON. Presenteer minstens:
- Oefennaam en getrainde spieren.
- **Startpositie en opstelling**: staan/zitten/liggen, voeten, knieën, heupen, rug, schouders, ellebogen, armen en polsen, waar de bron dat beschrijft.
- **Stap-voor-stap uitvoering** en bewegingsrichting.
- **Belangrijkste aandachtspunten**: wat aanspannen, hoe je je core stabiliseert, houding en ademhaling.
- **Veelgemaakte fouten / vermijden**.
- **Aanpassingen** bij ongemak of beperkingen.
- Voorgeschreven sets, reps, rust en herhalingen over; eventuele instructies voor warming-up of finisher.

Gebruik exact de broninformatie; laat de uitgebreide tekst toegankelijk zonder het hoofdscherm vol te zetten. Optionele oefenafbeeldingen/illustraties of eenvoudige bewegingsdiagrammen zijn welkom wanneer de rechten en herkomst duidelijk zijn; geen misleidende generieke afbeelding die een andere oefening toont. De **Technogym Reverse Fly met armkussens** is bewust een andere uitvoering dan een standaard reverse pec deck: behandel deze niet automatisch als hetzelfde toestel.

## 7. Schoudergezondheid en bestaande blessures

Houd alle relevante waarschuwingen uit de trainingsbestanden zichtbaar maar niet overheersend. De Scapular push-up hoort bij de warming-up van Upper A en Upper B; dead hang is een **optioneel** onderdeel, alleen wanneer klachten het toelaten. Biceps curls, hammer curls, hanging knee raises en farmers carries maken deel uit van het vastgestelde beoogde schema, maar belasten mogelijk een gevoelige linkerarm/elleboog. De bestaande door de fysiotherapeut gegeven excentrische bicepsrevalidatie mag **niet** door de app worden vervangen, verzwaard of zelfstandig voorgeschreven. Voeg geen diagnose of beloftes van blessurepreventie toe.

Maak het mogelijk een oefening over te slaan of als ‘overgeslagen wegens klachten’ te markeren, zonder dat dit als een afgeronde werkset telt. Geef waar nodig een discrete veiligheidsnotitie. Forceer niet dat elke set voltooid wordt.

## 8. Techniek, opslag, betrouwbaarheid en kwaliteit

- Kies een moderne, goed onderhoudbare stack die bij de bestaande repository past. Als er geen bestaande app is, bouw bij voorkeur een **installeerbare mobiele webapp (PWA)** die ook offline bruikbaar is. De precieze architectuur en het design mag je zelf kiezen.
- Sla trainingsdata **duurzaam lokaal** op, bij voorkeur met IndexedDB of gelijkwaardig. Maak duidelijk dat lokale opslag niet automatisch tussen apparaten synchroniseert.
- Maak **export en import van een volledige back-up** mogelijk, bijvoorbeeld JSON, en bied eventueel CSV-export voor trainingssets en statistieken. Controleer import op geldigheid en voorkom onbedoeld overschrijven.
- Zorg voor stabiele oefening-ID's, expliciete eenheden, datum/tijdzone, schema-versie en historische trainingsmomenten in het datamodel. Bewaar historisch gelogde resultaten als de trainingsbron later wordt bijgewerkt.
- Toon geen fictieve trainingsregistraties of records buiten een expliciete optionele demo-modus.
- Zorg voor goede toegankelijkheid, heldere foutmeldingen, voldoende contrast, ruime aanraakdoelen en betrouwbare invoer op iOS.
- Maak tests voor de kritieke logica: maandag 00:00 uur Europe/Amsterdam, omslag van week 1 naar week 2, jaarwisseling, zomer-/wintertijd, onafhankelijke trainingvolgorde, historische opslag, PR-berekening, gemiddelde gewichten en back-up/import.
- Maak het project daadwerkelijk start- en buildbaar; controleer waar mogelijk build, lint en tests. Voeg beknopte `README.md` toe met instructies voor lokaal starten, installeren als PWA en maken/terugzetten van een back-up.

## 9. Wanneer is het klaar?

Lever een **volledig werkende versie** op waarin ik op mijn telefoon mijn huidige trainingsweek kan zien, een van de vier trainingen kan openen, per set gewicht en herhalingen kan invoeren, mijn vorige prestatie/PR/gemiddelde kan zien, de uitgebreide oefenuitleg kan lezen en mijn voortgang in grafieken kan volgen. De app schakelt op maandag automatisch naar de andere trainingsweek zonder oude gegevens te verliezen.

Neem zelf initiatief voor een fraai, intuïtief eindresultaat. Werk niet alleen een plan uit: **implementeer de app**. Meld na afronding welke onderdelen klaar zijn, hoe ik hem start, welke tests je hebt gedraaid en eventuele beperkingen. Stel alleen vragen wanneer een werkelijk onmisbare technische keuze niet redelijk zelfstandig te maken is.
