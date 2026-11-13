# Ritme 2.0 publiceren op GitHub Pages

## Bestaande website en gegevens

Repository: `Royo1010/Fitness-app`. Website: **https://royo1010.github.io/Fitness-app/**.
Behoud dit adres, manifest-id `./`, scope `./` en IndexedDB `ritme-fitness`, versie 1, store `data`, sleutel `state`. De publicatie verandert geen trainingsregistraties. Wis geen browsergegevens om een update af te dwingen. Maak voor de zekerheid via Meer → Instellingen & back-ups een JSON-back-up op het apparaat met je logboek.

## Vastgesteld op 13 november 2026

- `main` op `05249975c3dd911eb38cf38a6ecfadf137ed47b7` bevat Ritme 2.0, inclusief `training.css`, nieuwe kalenderlogica en regressietests.
- Alle 25 aanwezige bestanden uit `Ritme-2.0-GitHub.zip` waren bytegelijk aan de checkout. Alleen `.gitignore` en `dist/.nojekyll` ontbraken; die zijn overgenomen. Deze bestanden verklaren geen run die al vóór uitvoering op Queued blijft staan.
- De patch toegepast op `Ritme-fitnessapp.zip` levert dezelfde actuele appbestanden op. Er staan geen extra appwijzigingen uitsluitend in ZIP of patch. De oude `.openai/hosting.json` is niet nodig voor GitHub Pages en is niet overgenomen.
- [Run #1](https://github.com/Royo1010/Fitness-app/actions/runs/43085894039) voor commit `dfac0df` slaagde; die commit bevatte versie 1.0.0.
- [Run #2](https://github.com/Royo1010/Fitness-app/actions/runs/43095816373) voor `0524997` stond bij onderzoek op Queued, zonder artifact of duur. Die run heeft dus nog geen nieuwe website gepubliceerd.
- De openbare runpagina geeft geen oorzaak voor het wachten. Runnercapaciteit, accountbeperkingen, concurrency en GitHub-storingen zijn zonder job/API-details niet te onderscheiden. De melding “Failed to cancel workflow” bewijst op zichzelf geen fout in de app of YAML.
- De cloudnetwerkpolicy blokkeerde tijdens dit onderzoek `api.github.com` en `royo1010.github.io`. API-details, Pages-instellingen, annulering en de actuele livebestanden konden daardoor niet worden bevestigd. Domeintoegang is als omgevingsconcept voorgesteld; dat wijzigt de GitHub-repositoryinstellingen niet.

## Nieuwe publicatiewerkwijze

De actieve workflow staat uitsluitend in `.github/workflows/deploy.yml`. Een oude kopie onder `.github/work/workflows/` is verwijderd; GitHub voerde die kopie niet uit.

Bij iedere pull request naar `main` worden Node.js 24, `npm test` en `npm run build:pages` uitgevoerd. Een PR publiceert niets. Na samenvoegen op `main` volgt dezelfde controle en daarna publicatie van **`fitnessapp/.pages-dist`** via het Pages-artifact. Handmatig starten via Actions → Controleer en publiceer Ritme → Run workflow kan ook; alleen `main` mag publiceren.

`dist/` bevat de daadwerkelijke statische broncode; er is geen frameworktranspilatie of npm-installatie. Bewerk die bestanden rechtstreeks, niet alleen een ZIP. `npm run build:pages` controleert de bron en kopieert deze naar de genegeerde uitvoermap `.pages-dist/`. De build geeft de serviceworker een cacheversie gebaseerd op alle bronbestanden, zodat een gewijzigde release automatisch een nieuwe offlinecache krijgt. `release.json` toont versie, commit en inhoudshash voor controle na publicatie. De bronbestanden, manifestidentiteit en opslagcode blijven daarbij intact.

Builds mogen oudere builds op dezelfde branch annuleren. Publicaties gebruiken een aparte concurrencygroep en worden niet halverwege geannuleerd. De nieuwe groep deelt geen workflowlock met de oude `github-pages`-groep. Dit is geen bewijs dat een vastgelopen GitHub-run of een probleem met GitHubs runnerdienst daarmee is opgelost. Time-outs begrenzen draaiende jobs; ze begrenzen geen wachttijd vóór toewijzing van een runner.

## Eenmalige controle en herstel op GitHub

1. Controleer en merge de pull request naar `main`.
2. Controleer **Settings → Pages → Build and deployment → Source: GitHub Actions**. Behoud het bestaande websiteadres en eventuele correcte andere instellingen.
3. Controleer **Actions → Controleer en publiceer Ritme**. De build moet slagen vóór de deploy begint. Controleer bij Waiting of de omgeving `github-pages` een goedkeuring vereist.
4. Blijft de oude run hangen, probeer als repositorybeheerder annuleren. Als normaal annuleren faalt, kan een beheerder met geschikte Actions-schrijfbevoegdheid de officiële force-cancel-API gebruiken: `gh api --method POST repos/Royo1010/Fitness-app/actions/runs/43095816373/force-cancel`. Doe dit alleen zolang deze specifieke run nog actief is. Een nieuwe run wordt niet automatisch gestart door annulering.
5. Blijven ook nieuwe jobs vóór uitvoering Queued, bekijk de jobmelding, Settings → Actions → General, account-/Actions-gebruik en [GitHub Status](https://www.githubstatus.com/). Neem bij aanhoudende mislukte annulering contact op met GitHub Support met de runlink. Appcode kan een GitHub-wachtrijprobleem niet zelfstandig herstellen.
6. Controleer na een geslaagde deploy `https://royo1010.github.io/Fitness-app/release.json`: de commit moet overeenkomen met de gepubliceerde main-commit. Open daarna de bestaande PWA online en kies zo nodig **App bijwerken**. Controleer Training, Schema en bestaande geschiedenis, en vervolgens offline openen. Verwijder geen PWA of sitegegevens.

Vóór **30 november 2026** toont Ritme 2.0 bewust een programmavoorbeeld zonder nieuwe officiële registraties. Dit is geen teken van een mislukte update.

## Lokaal reproduceren

Vanuit `fitnessapp/`:

```sh
npm test
npm run build:pages
npm run dev
```

De ontwikkelserver gebruikt `dist/`; het publicatie-artifact staat in `.pages-dist/`. De tests controleren ook de gegenereerde serviceworker, de offline-assets onder `/Fitness-app/`, automatisch wisselende cacheversies en ongewijzigde opslagcode. Een succesvolle lokale test is geen bevestiging van een afgeronde GitHub-publicatie.
