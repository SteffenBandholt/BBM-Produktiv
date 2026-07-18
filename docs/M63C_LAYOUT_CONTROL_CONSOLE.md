# M63C Layout-Control-Konsole

## Ziel

M63C stellt eine kleine Bedienkonsole fuer das bereits ausgewaehlte UI-Editor-Element bereit.
Die Konsole fuehrt nur explizit freigegebene neutrale Layoutoperationen aus.

## Fuehrende Auswahl und Registry

- Fuehrende Auswahl bleibt der vorhandene M52-`selectedElement`-Pfad.
- Fuehrende Registry bleibt die vorhandene M51-Ziel-App-Registry.
- Konkrete Layoutoperationen duerfen nur aus explizitem `allowedOps` kommen.
- `capabilities: ["layout"]` ist keine Freigabe fuer `move` oder `resize`.
- Pilotfreigabe in M63C: nur `bbm.uiEditorTest.card` (`Testkarte`) mit `allowedOps: ["move", "resize"]`.
- `bbm.main.navigation`, Header, Main und Sidebar bleiben grobe auswaehlbare CoreShell-Bereiche ohne aktive Layoutbearbeitung.

## Zielbild der sichtbaren UI

Die sichtbare Konsole besteht exakt aus:

```text
Elementname

[ Move ] [ Breite ] [ Hoehe ]

        ▲
     ◀  ●  ▶
        ▼
```

## Moduslogik

Lokaler Bedienzustand:

- `activeMode = "move" | "width" | "height"`
- Standard: `move`

Der Modus ist nur UI-Bedienzustand.
Er ist kein Layoutzustand, keine Auswahlhaltung und keine Persistenz.

## Pfeilwirkung

### Move

- links: `move` mit `x: -5`
- rechts: `move` mit `x: +5`
- oben: `move` mit `y: -5`
- unten: `move` mit `y: +5`

### Breite

- links: `resize` mit `width: -5`
- rechts: `resize` mit `width: +5`
- oben: deaktiviert
- unten: deaktiviert

### Hoehe

- oben: `resize` mit `height: +5`
- unten: `resize` mit `height: -5`
- links: deaktiviert
- rechts: deaktiviert

## Ausgangswerte fuer Groesse

Beim ersten Breiten- oder Hoehenschritt darf kein `0`-Startwert verwendet werden.
Der HostAdapter ermittelt den sicheren Ausgangswert in dieser Reihenfolge:

1. expliziter Registry-/Layout-Standard des Elements
2. bereits vorhandener gespeicherter Layoutwert
3. einmalige aktuelle Groesse des explizit registrierten M54-HTMLElement-Refs per `getBoundingClientRect()`

Nach dem ersten Groessenschritt ist der gespeicherte `EditorLayoutStore`-Wert fuehrend.
Es gibt keinen zweiten dauerhaften Layoutzustand.

Mindestgroessen:

- Breite mindestens 20 px
- Hoehe mindestens 20 px

Registry-Standards fuer Mindestgroessen haben Vorrang, sofern sie vorhanden sind.

## Mittelpunkt

Der Mittelpunkt bleibt deaktiviert, solange kein sicherer operationsbezogener Reset existiert.
Bei M63C ist nur ein allgemeiner Reset im vorhandenen Pfad bekannt; deshalb darf der Mittelpunkt keine Layoutwerte loeschen.

Pflichttext fuer Tooltip/ARIA:

```text
Standard derzeit nicht verfügbar
```

## Technischer Weg

Jede aktive Pfeilbedienung nutzt den vorhandenen Weg:

```text
EditorScopeInspector
→ EditorLayoutControls
→ ChangeRequestValidator
→ BBM main HostAdapter
→ vorhandener EditorLayoutStore
→ sichtbare Anwendung am registrierten M54-Ziel
```

Das Panel und die Bridge duerfen keine direkte DOM- oder Style-Manipulation ausfuehren.
Die sichtbare Anwendung erfolgt im HostAdapter ueber explizite M54-Refs.

## Ausdruecklich ausgeschlossen

- keine freie Werteingabe
- keine Textgroesse
- keine Textposition
- kein Drag-and-drop
- keine zweite Registry
- keine zweite Auswahlhaltung
- keine neue Persistenz
- keine lokale Map in der Bridge fuer Layoutzustand
- keine automatische DOM-Suche
- keine Simulation mit `executed: false`

## Pilotgrenze und naechster Schritt

- CoreShell-Bereiche wie Hauptnavigation, Header, Main und Sidebar sind keine geeigneten visuellen Resize-Piloten, weil sie Teil des festen Shell-/Grid-Layouts sind.
- M63C wird deshalb an der freien Entwicklungs-Testkarte `bbm.uiEditorTest.card` validiert.
- Die Testkarte liegt sichtbar in der UI-Editor-Testflaeche, hat einen eigenen M54-Ref und darf als einziges Element aktiv bewegt und in Breite/Hoehe veraendert werden.
- Die Start-UI enthaelt ansonsten nur grobe registrierte Bereiche der BBM-Hauptoberflaeche.
- M64 erweitert diese kleine Testflaeche spaeter um: Ueberschrift, Text, Button, Eingabefeld, Auswahlfeld, Tabelle und verschachtelte Elemente.
