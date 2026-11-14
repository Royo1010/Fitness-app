# Ritme: ontwikkelen en automatisch publiceren

Gebruik de bestaande checkout; de cloudtaak is al geïsoleerd. Maak alleen een Git-worktree als de gebruiker dat expliciet vraagt. Behoud bestaande gebruikerswijzigingen.

Voor nieuwe implementatieopdrachten: werk op een eigen branch `codex/<onderwerp>` vanaf de actuele `origin/main`. Push met de bestaande platformauthenticatie zodra de wijziging volledig is uitgevoerd en gecontroleerd, tenzij de gebruiker alleen lokaal werk vraagt of publicatie uitsluit. Een push op deze namespace kan na eenmalige activering automatisch tot samenvoegen en publicatie leiden. Gebruik `main` nooit als ontwikkelbranch.

Voer uit vanaf de repositoryroot:

- `node --test .github/scripts/*.test.cjs`
- `npm --prefix fitnessapp test`
- `npm --prefix fitnessapp run build:pages`
- De browserproef volgens `fitnessapp/TESTVERSLAG-2.1.md` bij wijzigingen aan de app; CI voert die altijd uit.

Behoud websiteadres `/Fitness-app/`, de PWA-identiteit, de oorspronkelijke trainingsrotatie en bestaande trainingsgegevens. Wijzig geen persoonlijke browseropslag voor tests.

De workflow maakt voor vertrouwde pushes zelf een PR en voegt alleen de exact geteste commit samen. Forceer geen merge en omzeil geen statuscontroles, branchregels of reviews. Meld ontbrekende rechten of activering als blokkade. Wijzigingen aan `.github/`, AGENTS.md of CODEOWNERS vereisen handmatige beoordeling; verwacht daarvoor geen automatische merge.

Zie `AUTOMATISERING.md` voor de eenmalige GitHub App-installatie, beheerinstellingen, herkomstcontrole en uitschakeling. Gebruik geen zelfbedachte actor-ID's of tokens. Geheimen horen in GitHub Secrets, nooit in broncode of chat.
