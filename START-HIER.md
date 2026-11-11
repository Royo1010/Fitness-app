# Je fitnessapp is klaar

**[Open Ritme](https://ritme-fitness-roy-nov26.elvencoconut2.chatgpt.site)**

De website is privé. Klik op ‘Ga verder met ChatGPT’ en gebruik het account waarmee deze app is gemaakt.

1. Open de website op je iPhone in Safari.
2. Kies bij de eerste opening de maandag waarop week 1 begint.
3. Kies een training, lees de warming-up en tik op **Start deze training**.
4. Noteer je sets en vink ze af. Je kunt tussendoor bewaren en later verdergaan.
5. Voor installatie: **Deel → Zet op beginscherm**. Open de app eerst een keer online; daarna zijn het schema, de oefenuitleg en je logboek offline bruikbaar.

Je gegevens worden lokaal op je apparaat opgeslagen. Maak regelmatig een volledige JSON-back-up via **Instellingen**. Er is geen automatische synchronisatie tussen apparaten.

Het project staat in `fitnessapp/` en is ook verpakt als `Ritme-fitnessapp.zip`. Op deze Mac kun je lokaal starten door in de projectmap op **Start Ritme.command** te dubbelklikken en daarna `http://localhost:4173` te openen. Volledige uitleg staat in `fitnessapp/README.md`.

De 41 logica-tests en de buildcontrole zijn geslaagd. Opslag na herladen, komma-invoer, grafiekpunten, back-upimport, mobiel formaat, donkere weergave en offline openen zijn in de browser gecontroleerd. Een fysieke iPhone-installatie is niet uitgevoerd. Zie `fitnessapp/TESTVERSLAG.md`.

De JSON is leidend. Het bronverschil in warming-upduur is zichtbaar vermeld in de app en de handleiding. Er zijn geen voorbeeldrecords in je logboek opgenomen.
