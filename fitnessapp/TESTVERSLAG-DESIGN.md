# Design en oefenteksten · 14 november 2026

De bestaande Ritme 2.2-app heeft ruimere kaarten, een blauwgroene accentkleur, contrasterende invoervelden en acht rustige spiergroepkleuren. Status staat ook in tekst aangegeven. Plus/min en afvinken hebben aanraakdoelen van minimaal 44 × 44 CSS-pixels. Op zeer smalle schermen staat de afvinkknop onder de twee invoervelden.

Alle 37 oefeningen hebben een tekstgids met een korte introductie, herkenning en instelling van materiaal, de oorspronkelijke startpositie, concrete genummerde stappen, houdings- en ademhalingsaanwijzingen, drie relevante fouten en de oorspronkelijke gerichte klachtenaanpassingen. Fouten, aanpassingen en technische verdieping zijn uitklapbaar. Gelijke voorschriften uit meerdere trainingen worden compact gecombineerd, zonder sets, herhalingen, rust of inspanning te veranderen. Records, gemiddelden en grafieken blijven beschikbaar onder de instructies.

De nieuwe module `dist/exercise-guides.mjs` is uitsluitend voor weergave en wordt offline gecachet. Het programma, de trainingslogica, opslagmodule, statistiekberekeningen, analyse-export en PWA-manifest zijn byte voor byte gelijk aan de uitgangsversie. Weergavenamen verwijderen week-/varianttoevoegingen; bron- en historische namen blijven intact. Ook een onbekende oefening uit een oudere back-up behoudt zijn eigen instructies. De oefenillustratie, afbeeldingcode, afbeeldingtest en het SVG-bestand zijn verwijderd. Installatie-iconen en navigatie-iconen blijven behouden.

## Uitgevoerde controles

- `node --test .github/scripts/*.test.cjs`: 36 tests geslaagd.
- `npm --prefix fitnessapp test`: 84 tests geslaagd, inclusief vijf controles op volledige gidsdekking, spiergroepen/materiaal, weergavenamen, ongewijzigde gegevens en oudere oefening-ID's.
- `npm --prefix fitnessapp run build:pages`: geslaagd; alle nieuwe modules zitten in het statische artifact en de offlinecache. Het cachekenmerk volgt automatisch de bestandsinhoud.
- `scripts/test-browser.mjs` met Playwright 1.56.1 en lokaal Chromium 156: geslaagd, zonder JavaScript-fouten. Tijdelijk browserprofiel en vaste testklok, zonder persoonlijke browsergegevens.

De browserproef controleert:

1. Kaarten op breedtes 320, 390, 430 en 1024 pixels, zonder horizontale overflow; spiergroeplabels, opgeschoonde namen en aanraakdoelen.
2. Ten minste 4,5:1 tekstcontrast voor de basistekst, secundaire tekst, primaire knop, status en alle acht spiergroeplabels in licht en donker. Dit is een gerichte contrastcontrole, geen volledige toegankelijkheidsaudit.
3. Snel plus/min, komma-invoer, dubbel tikken zonder wijziging van zoom, onafhankelijk afvinken, hervatten en vier trainingen afronden.
4. Wisselen tussen deadlift en barbell row, bevestiging bij eerdere invoer, behoud van beide registraties en gescheiden PR's (40 en 80 kg in de fixture).
5. Alle 37 gidsen openen/sluiten, ten minste drie uitvoeringsstappen en drie gerichte fouten, geen oefenafbeeldingen of algemene armwaarschuwing in elke gids. Toetsenbordfocus en sluiten met Escape. Het verschil tussen curl en extension en de praktische lateral-raise-uitleg worden expliciet gecontroleerd.
6. Historische individuele sets en bewaarde instructies; alleen uitleggidsen lezen wijzigt niets in opslag.
7. Schema, statistiekgrafiek, navigatie, themaopslag, weekanker, veiligheidsuitleg en installatie-uitleg.
8. ChatGPT-JSON, volledige back-up, CSV, import zonder dubbele trainingen, herstel na gesimuleerde opslagfout, offline herladen en offline export. De gidsmodule staat aantoonbaar in de offlinecache.

De bestaande unitproeven controleren de maandaggrens in Europe/Amsterdam, de tweeweekse cyclus, vier trainingen per week, exacte v2.2-voorschriften en behoud van v2.1-historie.

## Reproduceren en beperkingen

Volg de commando's in `TESTVERSLAG-2.1.md`; de browserproef bevat nu bovenstaande designcontroles. Lokale schermafbeeldingen: `/tmp/ritme-design-training.png`, `/tmp/ritme-design-uitleg.png`, `/tmp/ritme-design-prestaties.png` en `/tmp/ritme-design-donker.png`.

De mobiele proef gebruikt Chromium-emulatie, geen fysieke iPhone/Safari. Safe-area, beginschermmetadata, touch-action en dezelfde PWA-identiteit zijn behouden. Publicatie vereist een geslaagde merge/build op main; een lokale geslaagde build bewijst geen online publicatie. Wis geen sitegegevens om de update te laden: gebruik de bestaande knop ‘App bijwerken’ zodra de nieuwe versie klaarstaat.
