# UI-Editor Bauplan

## Kurzfazit

Der UI-Editor in BBM-Produktiv bleibt aktuell ein kontrollierter read-only
Kontext fuer den bestehenden Restarbeiten-Host. Er zeigt bekannte Surfaces und
Kontextinformationen an, aktiviert aber keine echte Surface-Umschaltung, kein
Drag, kein Resize und keine Persistenz. Mit dem Elementkatalog, den Bau-
und Pruefregeln sowie der PDF-/Plan-Entwurfsentscheidung ist die minimale
Grundlagenreihe jetzt vollstaendig.

## Zweck des UI-Editors

Der UI-Editor soll spaeter freigegebene UI-Elemente kontrolliert anzeigen und
bearbeitbar machen. In der aktuellen BBM-Phase dient er nur als sicherer
Host-Kontext fuer read-only Surface-Informationen und Guardrails. Der
sichtbare Hinweis unter der Surface-Auswahl bleibt rein informativ und loest
keine aktive Umschaltung aus. Die kompakte Statuszeile bleibt ebenso rein
informativ und zeigt nur den Bedienzustand. Die kleine Elementkatalog-
Uebersicht bleibt ebenfalls rein informativ und benennt nur erlaubte und
gesperrte Elementarten. Die neue Entwurfs-Vorschau fuer `Hinweis / Infotext`
bleibt nur eine nicht-persistente Vorschau im Restarbeiten-Kontext. Die
Live-Vorschau dazu bleibt lokal, nimmt nur den eingegebenen Hinweistext an und
speichert nichts. Die Host-Vorschau im Restarbeiten-Kontext bleibt ebenfalls
temporaer und zeigt denselben Text. Die Elementmodell-Vorschau bleibt
read-only, zeigt Typ, Surface, Status und denselben Text und speichert nichts.
Die Payload-Vorschau bleibt read-only, zeigt die technische Payload-Form des
aktuellen Entwurfs und speichert nichts.
Die Entwurfspruefung bleibt ebenfalls lokal, zeigt nur gueltig/leer plus
`Speichern: nicht aktiv` und speichert nichts.
Der Button `Entwurf zuruecksetzen` stellt den Standardtext lokal wieder her
und speichert nichts.
Die spaetere Kit-Extraktionsgrenze fuer diesen Entwurf ist separat
dokumentiert und aendert an diesem Hoststand nichts.

## Aktueller Stand

- Host-/Bestandssurface: `restarbeiten.ui.main`
- Read-only sichtbar: `pdf.plan.page.1`, `plan.canvas.default`
- Die Surface-Auswahl ist nur read-only Sichtbarkeits-/Kontextanzeige.
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`.
- Es gibt keine aktive Surface-Umschaltung.

## Aufbau des Editor-Panels

- Launcher/Panel bleiben BBM-Hostintegration.
- Das Panel darf den aktuellen Editor-Kontext anzeigen.
- Surface-Auswahl und SurfaceInfo sind getrennt zu betrachten.
- Fachaktionen und Schreibwege duerfen nicht ueber das Panel ausgeloest werden.

## Erlaubte Arbeiten

- Read-only Kontext anzeigen.
- Kleine Hinweise anzeigen, sofern sie ausdruecklich freigegeben sind.
- Tests, Doku und Guardrails pflegen.
- Bestehende read-only Surface-Modelle pruefen.

## Nicht erlaubte Arbeiten ohne eigene Freigabe

- aktive Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
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
- G102 bestaetigt den lokalen Hinweis-/Infotext-Entwurf als Abschlusscheck.

## Stop-Regel

Bei unklarer UI-Grundlage, unklarer Surface-Freigabe oder noetigem Zugriff auf
verbotene Bereiche gilt: stoppen, nicht improvisieren.
