# Ziel-App-Anbindung BBM-Produktiv

## Kurzfazit

BBM-Produktiv bleibt der Host fuer den UI-Editor. Das UI-Editor-kit liefert
generische Runtime-Bausteine, speichert aber nicht. Die aktuelle Anbindung ist
read-only begrenzt und aktiviert keine neue Persistenz, keine Schreibwege und
keine Aenderungen ausserhalb des UI-Editor-Kontextes. Die naechste
Grundlagenstufe ergaenzt diese Host-Anbindung um Elementkatalog und Bau-/Pruefregeln.

## Ziel-App-Kontext BBM-Produktiv

- BBM-Produktiv ist die Host-App.
- Der UI-Editor laeuft im BBM-Kontext ueber bestehende Launcher-/Panelpfade.
- Fachlogik, Registry-Freigaben, DB/IPC und spaetere Persistenz bleiben
  BBM-seitige Host-Verantwortung.
- Das externe `UI-Editor-kit` wird in diesem Paket nicht geaendert.

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

## Pruefpflicht

- Passende Tests ausfuehren.
- Bei sichtbarer UI-Aenderung ist eine Electron-Sichtpruefung erforderlich.
- Ohne sichtbare UI-Aenderung ist eine Electron-Sichtpruefung nicht noetig,
  muss aber im Abschlussbericht ausdruecklich benannt werden.
