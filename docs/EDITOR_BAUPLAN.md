# UI-Editor Bauplan

## Kurzfazit

Der UI-Editor in BBM-Produktiv bleibt aktuell ein kontrollierter read-only
Kontext fuer den bestehenden Restarbeiten-Host. Er zeigt bekannte Surfaces und
Kontextinformationen an, aktiviert aber keine echte Surface-Umschaltung, kein Drag,
kein Resize und keine Persistenz.

## Zweck des UI-Editors

Der UI-Editor soll spaeter freigegebene UI-Elemente kontrolliert anzeigen und
bearbeitbar machen. In der aktuellen BBM-Phase dient er nur als sicherer
Host-Kontext fuer read-only Surface-Informationen und Guardrails.

## Aktueller Stand

- Host-/Bestandssurface: `restarbeiten.ui.main`
- Read-only sichtbar: `pdf.plan.page.1`, `plan.canvas.default`
- Die Surface-Auswahl ist nur read-only Sichtbarkeits-/Kontextanzeige.
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
- Es gibt keine aktive Surface-Umschaltung.

## Aufbau des Editor-Panels

- Launcher/Panel bleiben BBM-Hostintegration.
- Das Panel darf den aktuellen Editor-Kontext anzeigen.
- Surface-Auswahl und SurfaceInfo sind getrennt zu betrachten:
  - Auswahl: sichtbare read-only Kontextliste.
  - SurfaceInfo: Host-/Bestandssurface `restarbeiten.ui.main`.
- Fachaktionen und Schreibwege duerfen nicht ueber das Panel ausgeloest werden.

## Erlaubte Arbeiten

- Read-only Kontext anzeigen.
- Kleine Hinweise anzeigen, sofern sie ausdruecklich freigegeben sind.
- Tests, Doku und Guardrails pflegen.
- Bestehende read-only Surface-Modelle pruefen.

## Nicht erlaubte Arbeiten ohne eigene Freigabe

- aktive Surface-Umschaltung
- Drag
- Resize
- Persistenz
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege
- `localStorage`
- `writeFile`
- Wildcard-Freigaben
- Default-true-Freigaben

## Pruefpflicht

- Passende Tests ausfuehren.
- `git diff --check` ausfuehren.
- Bei sichtbarer UI-Aenderung ist eine Electron-Sichtpruefung erforderlich.
- Wenn keine technische Pruefung existiert, muss das offen gemeldet werden.

## Stop-Regel

Bei unklarer UI-Grundlage, unklarer Surface-Freigabe oder noetigem Zugriff auf
verbotene Bereiche gilt: stoppen, nicht improvisieren.
