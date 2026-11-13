# Codex → tests → PR → merge → GitHub Pages

Dit gebruikt uitsluitend de bestaande repository **Royo1010/Fitness-app** en website **https://royo1010.github.io/Fitness-app/**. De app, trainingsgegevens, IndexedDB en PWA-manifest worden door deze wijziging niet aangepast.

## Wat de workflows doen

1. Codex werkt op een branch `codex/<onderwerp>` en pusht met de bestaande GitHub-authenticatie. Andere branchnamen worden niet automatisch verwerkt.
2. `deploy.yml` voert op die push de automatiseringstests, app-tests, mobiele browser-/offlineproef en productiebuild uit. De job heet **build**.
3. Na succes start `codex-automation.yml` via `workflow_run`. Deze workflow wordt vanaf de standaardbranch uitgevoerd en checkt uitsluitend vertrouwde `main` uit. Hij voert geen branchcode uit en downloadt geen artifacts met schrijfrechten.
4. De handler controleert de echte GitHub-pusher en eventuele herstarter op zowel de vastgelegde eigenaar `Royo1010` als een expliciet ingesteld numeriek account-ID, dezelfde repository, huidige branchcommit en de juiste CI-workflow. Daarna maakt de eigen GitHub App een PR aan. Een bestaande PR wordt niet gedupliceerd of overgenomen.
5. Die App-aanmaak start de normale PR-controles, inclusief de samengevoegde PR-testversie. Na succes controleert de handler opnieuw de pushherkomst en actuele commit. Alleen een niet-draft PR van deze App naar main kan worden samengevoegd, met strikte verplichte **build**-controles van de GitHub Actions-app en een verplichte PR-regel.
6. De handler merge via de GitHub API uitsluitend de exact geteste SHA. Een wijziging tijdens de merge leidt tot weigering; er is geen geforceerde retry. Conflicten, achterlopen op main, mislukte/pending controles, strengere reviewregels en een onbekende merge-status blokkeren de merge.
7. De App-merge veroorzaakt een gewone push op main. De bestaande Pages-workflow test en bouwt opnieuw en publiceert alleen na succes. `release.json` maakt de gepubliceerde commit zichtbaar.

Er wordt geen blijvend auto-mergeverzoek ingeschakeld dat later een andere commit zou kunnen accepteren. De GitHub-instelling **Allow auto-merge** is voor deze implementatie niet nodig; **Allow squash merging** wel.

### Vertrouwen en grenzen

Een branchnaam, label, commit-auteursnaam of tekst “Codex” is geen authenticatie. Deze oplossing gebruikt de door GitHub bevestigde actor-ID van de push plus de vaste login `Royo1010` en de aparte App-identiteit van de PR. Alleen een variabele veranderen kan daardoor geen ander account vertrouwen. Standaard staat automatisering uit tot de beheerder de vereisten instelt.

**Als Codex en jijzelf via hetzelfde GitHub-account pushen, kan GitHub die twee niet onderscheiden.** Vertrouwen in dat account geldt dus ook voor handmatige pushes door dat account op `codex/*`. Gebruik deze namespace uitsluitend voor het vertrouwde werkproces. Voor een strikt aparte identiteit is een afzonderlijk GitHub-account of App voor de Codex-pushauthenticatie nodig; wijzig dan ook het expliciete identiteitsbeleid. Het meegeleverde beheerscript accepteert bewust alleen het expliciet opgegeven gebruikersaccount `Royo1010`; een andere identiteit vereist een handmatig beoordeelde beleidswijziging.

Handmatige PR’s, forks, andere afzenders en wijzigingen aan `.github/**`, iedere AGENTS.md of CODEOWNERS worden nooit automatisch gemerged. Ook hernoemen van zo'n bestand wordt herkend. Diffs met 300 of meer bestanden vragen handmatige beoordeling om afgekorte API-resultaten niet te vertrouwen. Bestaande organisatie-/repositoryregels blijven gelden; deze oplossing geeft de App geen bypass of zelfgoedkeuringsrecht.

## Eenmalig activeren als repositorybeheerder

Deze wijziging zelf moet **eenmalig handmatig via een PR naar main** worden samengevoegd. Hij wijzigt immers de beveiligde workflows. Daarna kunnen gewone appwijzigingen volledig automatisch verlopen.

### 1. Maak een aparte GitHub App

In GitHub → Settings → Developer settings → GitHub Apps:

- Maak een eigen App voor deze Ritme-publicatie. Een webhook is niet nodig.
- Geef repositoryrechten **Contents: Read and write**, **Pull requests: Read and write**, **Actions: Read-only** en het standaard **Metadata: Read-only**.
- Geef geen Workflows-schrijf-, administratie- of bypassrechten aan deze uitvoerende App.
- Installeer de App alleen op **Royo1010/Fitness-app**.
- Noteer de **App ID**, niet de Client ID. Genereer een private key en plaats die veilig via Settings → Secrets and variables → Actions als repositorysecret **CODEX_APP_PRIVATE_KEY**. Plaats de sleutel niet in chat, commits, commandoregelargumenten of de cloudconfiguratie.

De workflow maakt kortlevende installation tokens voor alleen deze repository en trekt ze na afloop in. De private key blijft in GitHub Secrets. Het standaard GITHUB_TOKEN blijft read-only in de automationworkflow. Het vinkje “Allow GitHub Actions to create and approve pull requests” is voor deze App-route niet nodig; er worden geen PR-goedkeuringen vervalst.

### 2. Pas regels en variabelen toe

Gebruik een terminal met GitHub API-toegang en geauthenticeerde beheerrechten op deze repository. Bepaal eerst welk account daadwerkelijk de Codex-push uitvoert. Voor de huidige accountgebonden werkwijze is `Royo1010` de te controleren keuze; de Git-commitnaam is daarvoor geen bewijs.

Vanaf de repositoryroot, na de eerste merge:

```sh
gh auth status
node .github/scripts/setup-codex.mjs --trusted-login Royo1010 --app-id JOUW_NUMERIEKE_APP_ID
```

Het script leest eerst de bestaande instellingen en secret-namen, zonder geheime waarden te lezen of tonen. Het vereist beheerrechten en een aanwezige private-keysecret. Daarna:

- voegt het de actieve ruleset **Ritme Codex main checks** toe voor uitsluitend `refs/heads/main`, zonder bypass-actoren;
- vereist het een PR en de strikte, up-to-date statuscheck **build** van GitHub Actions (integration ID 15368);
- blokkeert het branchverwijdering en niet-fast-forwardupdates;
- laat het goedkeuringsaantal van deze aanvullende regel op nul, maar bewaart het bestaande strengere reviewregels;
- schakelt het zo nodig squash merging in;
- bewaart het `CODEX_APP_ID`, de via GitHub opgezochte `CODEX_TRUSTED_ACTOR_ID` en als laatste `CODEX_AUTOMATION_ENABLED=true` als repositoryvariabelen.

Bestaande andere rulesets en instellingen worden niet vervangen. Een bestaande gelijknamige afwijkende ruleset wordt niet overschreven. Het script is herhaalbaar en zet de automatisering tijdens wijzigingen uit. Bij een fout ná die stap blijft ze uit. Regelondersteuning kan van het GitHub-abonnement afhangen; bij weigering wordt niet overgestapt op een onbeschermde merge.

Wil je het handmatig instellen, gebruik dezelfde ruleset en variabelen. Alleen een branch protection zonder equivalente effectieve ruleset wordt door de handler niet als voldoende beschouwd. Bestaande vereiste menselijke reviews blijven merges blokkeren; pas die uitsluitend bewust zelf aan als je voor deze repository onbeheerd publiceren wilt toestaan. Verleen de App geen bypass om dit op te lossen.

### 3. Controleer Actions en Pages

- Actions moet ingeschakeld zijn en de gebruikte `actions/*`-acties moeten toegestaan zijn. De CI blijft op Ubuntu 24.04 voor Playwright 1.56.1.
- Pages → Build and deployment → **Source: GitHub Actions**. Behoud het bestaande websiteadres.
- Een verplichte handmatige goedkeuring op de omgeving `github-pages` stopt onbeheerd publiceren. Verwijder die alleen als je automatische publicatie wilt; behoud eventuele andere passende beperkingen.
- Gebruik de App niet in een bypasslijst. Bij conflicten of achterlopen op main werkt Codex de branch bij en pusht opnieuw; er worden geen tests overgeslagen.

## Waarom geen workflowlus ontstaat

De privileged workflow luistert alleen naar voltooiing van **Controleer en publiceer Ritme**, niet naar zichzelf. Hij verwerkt alleen push-/PR-runs op eigen `codex/*`-branches. Main-publicaties en workflow_dispatch-runs worden genegeerd. Een bestaande PR veroorzaakt geen nieuwe PR, er zijn geen automatische commits/labels en geen automatische reruns of force-merges. De App-token is nodig omdat gebeurtenissen veroorzaakt door het standaard GITHUB_TOKEN doorgaans geen vervolgworkflows starten.

## Controleren en stoppen

De eerste keer: geef Codex een kleine gewone appwijziging. Controleer Actions: branch-build → App-PR → PR-build → merge → main-build → Pages-deploy. Controleer de commit in `/Fitness-app/release.json`. Een lokale test bewijst niet dat de live GitHub-keten al werkt.

Bij een geblokkeerde of onbekende merge-status: controleer de PR-melding, pas de branch aan of herstart de PR-CI als het alleen een tijdelijke API-status was. Er wordt bewust niet gemerged bij onbekende status. Een pipelinefout of conflict blijft zichtbaar en blokkeert publicatie.

Uitschakelen kan direct met repositoryvariabele `CODEX_AUTOMATION_ENABLED=false`. Ook de App-installatie intrekken of de private-keysecret verwijderen stopt toekomstige automatische wijzigingen. Bestaande branchregels en de normale Pages-publicatie blijven behouden.

## Verificatie en huidige beperking

De herkomst-/mergehandler en het beheerscript zijn met GitHub-API-fakes getest: vertrouwen, oude commits, nieuwe pushes tijdens merge, forks, drafts, conflicten, onbekende status, beschermde bestanden, strikte checks en idempotente configuratie met behoud van bestaande regels. Live-effecten zijn niet met mocks aangetoond.

De cloudomgeving blokkeert momenteel `api.github.com`. Daardoor konden de werkelijke beheerrechten, rulesets, App-installatie, secretstatus en Pages-goedkeuringsregels niet worden gelezen of aangepast. De configuratie is voorbereid in de repository, maar is nog niet live geactiveerd. Voor uitvoering hier moet `api.github.com` in de cloudnetwerkinstellingen worden toegestaan en moet de gebruikte GitHub-verbinding de betreffende API-/beheerrechten hebben. Git-push die al werkt bewijst die rechten niet. Extra tokenwaarden horen niet in chat.

GitHub-documentatie:

- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- https://docs.github.com/en/actions/reference/events-that-trigger-workflows#workflow_run
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow
- https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset
