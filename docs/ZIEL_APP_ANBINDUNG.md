# Ziel-App-Anbindung BBM-Produktiv

## Kurzfazit

BBM-Produktiv bleibt der Host fuer den UI-Editor. Das UI-Editor-kit liefert
generische Runtime-Bausteine, speichert aber nicht. Die aktuelle Anbindung ist
read-only begrenzt und aktiviert keine neue Persistenz, keine Schreibwege und
keine Aenderungen ausserhalb des UI-Editor-Kontextes. Zusammen mit
Elementkatalog, Bau-/Pruefregeln und PDF-/Plan-Entwurfsentscheidung ist die
Minimalgrundlage jetzt abgeschlossen.

## Ziel-App-Kontext BBM-Produktiv

- BBM-Produktiv ist die Host-App.
- Der UI-Editor laeuft im BBM-Kontext ueber bestehende Launcher-/Panelpfade.
- Fachlogik, Registry-Freigaben, DB/IPC und spaetere Persistenz bleiben
  BBM-seitige Host-Verantwortung.
- Das externe `UI-Editor-kit` wird in diesem Paket nicht geaendert.
- Der kleine Surface-Auswahl-Hinweis im Panel bleibt BBM-seitig und ist nur
  informativ.
- Die kompakte Statuszeile bleibt BBM-seitig und rein informativ.
- Das spaetere Speicherziel und der BBM-Schreibweg bleiben ebenfalls separat
  dokumentiert.
- G106 beschreibt dieses spaetere Speicherziel nur dokumentarisch; es ist
  noch nicht aktiv.
- G107 analysiert die vorhandenen BBM-Schreibwege und stuetzt die
  Einordnung, dass der Restarbeiten-Notizweg erst spaeter und getrennt
  freigegeben werden muesste.
- G108 gibt diese Zielrichtung dokumentarisch frei; BBM bleibt Host und der
  Schreibweg bleibt ungebaut.

## Host-/Bestandssurface

- `restarbeiten.ui.main`

Diese Surface bleibt der Hoststand und die Quelle fuer die SurfaceInfo.

## Read-only Zusatzkontexte

- `pdf.plan.page.1`
- `plan.canvas.default`

Diese Zusatzkontexte duerfen nur read-only sichtbar sein. Sie sind keine aktive
Bearbeitungsflaeche.

## Zulaessige Integrationspunkte

- bestehender BBM-Launcher/Panel
- bestehende read-only Surface-Modelle
- bestehende Tests und Guardrails
- dokumentierte BBM-Bridge zum installierten UI-Editor-kit

## Nicht zulaessige Integrationspunkte ohne eigene Freigabe

- neue DB-Schreibwege
- neue IPC-Schreibwege
- Persistenz
- Dateischreiben
- `localStorage`
- `writeFile`
- Ziel-App-Aenderungen ausserhalb des UI-Editor-Kontextes
- Wildcard- oder Default-true-Freigaben

## Abgrenzung

- UI-Editor-kit speichert nicht.
- BBM-Produktiv bleibt Host und entscheidet ueber Freigaben.
- Keine Aenderung an `../UI-Editor-kit`.
- Keine echte Surface-Umschaltung.
- kein Drag.
- kein Resize.
- keine Persistenz.
- Die spaetere Kit-Extraktionsgrenze fuer den Hinweis-/Infotext bleibt in BBM
  dokumentiert und ist noch keine Umstellung.
- Eine spaetere Speicherfreigabe fuer den Hinweis-/Infotext bleibt ebenfalls
  separat und ist noch keine Umstellung.
- G109 zeigt den gesperrten Speicherbereich in BBM, ohne einen aktiven
  Schreibweg anzubinden.
- G110 ergaenzt dort einen sichtbaren Freigabecheck; der Speicherbutton bleibt
  deaktiviert und `UI-Editor-kit` speichert weiterhin nicht.
- G111 bestaetigt die Speicher-Vorbereitung als Abschlussstand; BBM bleibt
  Host, `UI-Editor-kit` speichert weiterhin nicht und es wird kein neuer
  Schreibweg freigegeben.
- G112 beschreibt den `restarbeiten:createNote`-Vertrag als BBM-seitige
  Grundlage, aber noch ohne angeschlossenen Speicherweg.
- G113 betont die notwendige Host-Zuordnung von `restarbeitId`; der UI-Editor
  bekommt diesen Kontext nicht aus sich selbst heraus.
- G114 legt die spaetere Uebergabeentscheidung fest: `restarbeitId` kommt aus
  `RestarbeitenScreen` bzw. `notesPopup.restarbeitId`, nicht aus einer Suche im
  UI-Editor.
- G115 zeigt den fehlenden Host-Kontext im UI-Editor sichtbar an; die Anzeige
  bleibt read-only und speichert nichts.
- G116 legt den spaeteren Host-Kontext-Datenvertrag fest; `projectId` und
  `restarbeitId` kommen spaeter nur aus dem BBM-Host.
- G117 zeigt die Host-Anzeige weiter nur als lokales Statusmodell; der BBM-
  Host liefert die echten Werte weiterhin nicht.
- G118 normalisiert diese Host-Anzeige intern; BBM bleibt Host und es
  entsteht keine neue Schreib- oder Speicherfreigabe.
- G119 bestaetigt den Host-Kontext nur als Abschlussstand; es gibt keine
  neue Ziel-App-Anbindung.
- G120 erlaubt nur eine optionale interne Aufnahme; eine echte Host-
  Uebergabe bleibt ausgespart.
- G121 dokumentiert die spaetere Host-Kontext-UEbergabe als
  Freigabeentscheidung; `UI-Editor-kit` bleibt speicherfrei und BBM bleibt
  Host.
- G122 schliesst die echte Host-Kontext-UEbergabe aus dem Restarbeiten-Host
  an den UI-Editor an; `UI-Editor-kit` bleibt speicherfrei und der Default
  bleibt gesperrt.

## Pruefpflicht

- Passende Tests ausfuehren.
- Bei sichtbarer UI-Aenderung ist eine Electron-Sichtpruefung erforderlich.
- Ohne sichtbare UI-Aenderung ist eine Electron-Sichtpruefung nicht noetig,
  muss aber im Abschlussbericht ausdruecklich benannt werden.
