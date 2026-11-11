# Ritme 2.0 naar de bestaande GitHub Pages-website

## Wat klaarstaat

De bijgewerkte productieversie staat volledig in `dist/`. Paden zijn relatief en zijn lokaal gecontroleerd op `/Fitness-app/`. Het bestaande logboek gebruikt dezelfde IndexedDB-identiteit en hetzelfde back-upformaat. Er is niets gewist, gecommit of naar GitHub gepusht.

## Wat nog ontbreekt

De lokale projectmap bevat geen GitHub-remote en geen `.github/workflows/` met de werkelijk gebruikte Pages-workflow. De repository-URL en de GitHub Pages-URL zijn nog niet aangeleverd. Daarom kan de bestaande publicatiebron niet worden geïnspecteerd en is geen live GitHub-publicatie bevestigd.

Er is geen nieuwe website, nieuw adres of alternatieve Sites-publicatie gemaakt voor deze update.

## Bijwerken zodra de repository bekend is

1. Open de bestaande GitHub-repository en controleer de werkelijke publicatieworkflow. Gebruik de huidige repository en het bestaande `/Fitness-app/`-adres.
2. Neem de gewijzigde bronbestanden en de volledige bijgewerkte `dist/` over. Behoud bestaande correcte publicatie-instellingen en workflows.
3. Voer in de projectmap `npm test` en `npm run build` uit. Er zijn geen npm-dependencies te installeren.
4. Als de bestaande workflow een vooraf gebouwde distributie publiceert, controleer dat de upload de vernieuwde `dist` gebruikt. Een statisch Pages-artifact wordt via `actions/upload-pages-artifact` aangeboden en via `actions/deploy-pages` gepubliceerd; zie de [officiële GitHub-documentatie](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
5. Commit en push alleen via de al ingerichte toegang. Wacht op een geslaagde Actions-run en controleer het bestaande websiteadres.
6. Open de bestaande PWA eenmaal online en gebruik eventueel **App bijwerken**. Controleer daarna Training, Schema en een bestaande historische registratie. Wis geen sitegegevens om een update af te dwingen.

Als de repository een andere mapstructuur bevat, pas alleen de benodigde bron- en distributiepaden aan. Overschrijf geen bestaande GitHub-workflow met een generiek voorbeeld voordat die is gecontroleerd. De oude `.openai/hosting.json` hoort bij de eerdere afzonderlijke Sites-versie en is niet nodig voor GitHub Pages.

## Controle van de gepubliceerde versie

- De eerste navigatietab heet **Training**.
- Er staat een direct bewerkbare verticale oefenlijst, zonder welkomstbanner.
- **Schema** toont Lower A1, Upper A1, Lower B1, Upper B1 in die volgorde; de daaropvolgende kalenderweek gebruikt de 2-varianten.
- Voor 30 november 2026 toont de app uitsluitend een voorbeeld en maakt de nieuwe interface geen officiële sessies aan.
- Oude trainingsgegevens zijn beschikbaar via **Meer → Geschiedenis**.
- De serviceworker en het manifest blijven binnen `/Fitness-app/` en offline openen werkt na de eerste online opening.
