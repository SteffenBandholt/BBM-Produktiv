# M63C Layout-Control-Konsole

## Ziel

M63C stellt eine kleine Bedienkonsole fuer das bereits ausgewaehlte UI-Editor-Element bereit.
Die Konsole fuehrt nur explizit freigegebene neutrale Layoutoperationen aus.

## Fuehrende Auswahl und Registry

- Fuehrende Auswahl bleibt der vorhandene M52-`selectedElement`-Pfad.
- Fuehrende Registry bleibt die vorhandene M51-Ziel-App-Registry.
- Konkrete Layoutoperationen duerfen nur aus explizitem `allowedOps` kommen.
- `capabilities: ["layout"]` ist keine Freigabe fuer `move` oder `resize`.
- Pilotfreigabe in M63C: nur `bbm.main.navigation` mit `allowedOps: ["move", "resize"]`.

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

- links: `move` mit `x: -1`
- rechts: `move` mit `x: +1`
- oben: `move` mit `y: -1`
- unten: `move` mit `y: +1`

### Breite

- links: `resize` mit `width: -1`
- rechts: `resize` mit `width: +1`
- oben: deaktiviert
- unten: deaktiviert

### Hoehe

- oben: `resize` mit `height: +1`
- unten: `resize` mit `height: -1`
- links: deaktiviert
- rechts: deaktiviert

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
