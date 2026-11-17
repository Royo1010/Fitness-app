# Herstel van de door de gebruiker gemelde PR #11-regressie

Onderzocht vanaf `main` op `f4c5f402c5b01b9113b93a44d8ad2dab926b703f`.
De gebruiker meldt een permanente waas na PR #11, tegenover een startwaas die
vóór die wijziging na enkele scrollbewegingen verdween. De eerdere Linux-tests
reproduceerden geen van beide native iPhone-effecten. Hun geslaagde layouttests
waren onvoldoende om een verbetering op het toestel te claimen.

PR #11 maakte het document scrollbaar, verplaatste de bovenste safe-area naar
body-padding en veranderde de initiële thema-/PWA-metadata. De viewport-meta en
Apple-statusbalkinstelling veranderden niet. Documentinhoud kan daardoor tijdens
scrollen bij de systeemrand komen, ook wanneer de startpositie juist is.
De permanente vervaging past bij een native scroll-edge-effect; het exacte
UIKit/compositormechanisme is hier niet aangetoond.

De twee marathon-repositories zijn opnieuw aan hun actuele HEAD gecontroleerd:
`0484ab457e5fdda0b7504922124a060805bf0dc9` en
`107da7bbe9f3b6fa8f4b9cb0de161880b02f1988`. Zij gebruiken document-scrolling,
maar hebben beide een blijvende sticky bovenbalk. Hun gedrag is daarom geen
bewijs dat diezelfde scrollarchitectuur geschikt is voor Ritmes Training-scherm.

Conform de expliciete terugvalopdracht wordt de laatst bekende situatie van
vóór PR #11 hersteld. `training.css`, `index.html` en `manifest.webmanifest` zijn
bytegelijk aan de eerste parent van de merge, `1fe58ed…`. `app.mjs` is eveneens
gelijk, met één bewuste uitzondering: de zinloze `scrollPageTo()` na de eerste
render blijft verwijderd. De startproeven bewaken nul scrollaanroepen tijdens
het laden en heropenen. Er is geen automatische scrollbeweging, extra overlay,
masker, filter of nieuwe viewport-/statusbalkinstelling toegevoegd.

Programma, trainingslogica, opslag, statistiek/export, oefengidsen, updatecode,
serviceworker, Light/Dark-paletten en PWA-identiteit zijn ongewijzigd. Er is
geen datamigratie of reset. Navigatie en behoud van de scrollpositie bij
pauzeren/hervatten gebruiken weer het app-scrollvlak.

De browserproeven controleren de herstelde architectuur vóór programma/IndexedDB
klaar zijn, ook na heropenen met opgeslagen voorkeuren. Zij controleren echte
clipping onder de safe-area en nul root-scrollruimte. Deze nieuwe verwachting
faalt terecht op de exacte PR #11-bron. Dit bewijst detectie van de regressie
in de architectuur, niet reproductie van de native iPhone-waas.

Validatie: 36 automatiseringstests, 98 apptests, volledige Chromium-proef,
productiebuild en WebKitGTK 2.52.6-proef op de productiebuild slagen.
WebKit omvat beginframes via een lokale testproxy, 0/47px synthetische inset,
beide thema's, zes schermen, dialoogscroll, focus/toetsenbord en resize.
Linux WebKitGTK is geen fysieke iPhone of native iOS-standalone-PWA.

Aanvullend is de exacte PR #11-bron afzonderlijk tot productiebuild
`5e2228d495fb…` gebouwd en via de bestaande PWA-updateknoppen vervangen door
de herstelbuild. Een werkelijk ingevulde en afgeronde training, 25kg/10 reps,
donkere voorkeur, de volledige IndexedDB-staat en een localStorage-marker bleven
exact behouden. Ook offline herladen na de overgang slaagt. Dit gebruikt een
nieuw geïsoleerd testprofiel, geen persoonlijke browseropslag.

Productie-inhoudshash:
`cdd920a699ce0e5b7902b5b1f0813029a74267025e27dd504e314de1ca3c820b`.

Dit is een herstel van de verslechtering, geen bewezen volledige oplossing van
de oorspronkelijke startwaas. De toestelcontrole na publicatie blijft nodig:
update via de bestaande updatefunctie, sluit de beginschermapp volledig,
open opnieuw en bekijk de bovenkant eerst zonder interactie en daarna tijdens
scrollen. Geen sitegegevens wissen en de bestaande installatie niet verwijderen.
