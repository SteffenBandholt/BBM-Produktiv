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
Die Speicherfreigabe bleibt ebenfalls separat dokumentiert; aktuell gibt es
keinen Speicherbutton und keinen Schreibweg.

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
- G106 dokumentiert zusaetzlich das spaetere Speicherziel und den noch
  fehlenden BBM-Schreibweg; gebaut wird davon noch nichts.
- G107 ordnet die vorhandenen BBM-Schreibwege ein und nennt den
  Restarbeiten-Notizweg nur als naechsten fachlichen Kandidaten.
- G108 gibt diesen Restarbeiten-Notizweg als spaetere Zielrichtung frei,
  ohne den Speicherweg selbst zu bauen.
- G109 zeigt den Speicherbereich sichtbar an, laesst ihn aber gesperrt und
  deaktiviert.
- G110 ergaenzt dort einen sichtbaren Freigabecheck; der Speicherbutton
  bleibt deaktiviert und der Status bleibt rein lesend.
- G111 bestaetigt diesen Speicher-Vorbereitungsstand als Abschlusscheck;
  sichtbarer Speicherbereich, Freigabecheck und deaktivierter Button bleiben
  nur Anzeige.
- G112 dokumentiert den technischen Vertrag von `restarbeiten:createNote`,
  ohne den Speicherweg anzuschliessen.
- G113 klaert die Restarbeiten-Kontextzuordnung fuer spaetere Speicherung; die
  `restarbeitId` bleibt dabei der entscheidende Host-Faktor.
- G114 legt fest, dass der Host die Ziel-Restarbeit eindeutig uebergibt und
  der UI-Editor sie nicht selbst suchen oder raten darf.
- G115 zeigt den fehlenden Restarbeiten-Host-Kontext sichtbar an; das ist
  reine Anzeige und kein Speicherweg.
- G116 dokumentiert den spaeteren Host-Kontext-Datenvertrag; ohne Host-Daten
  bleibt der Speicherbutton weiterhin deaktiviert.
- G117 ordnet die sichtbare Restarbeit-Kontextanzeige an ein lokales
  Statusmodell; echte Host-Daten kommen weiterhin nicht im Renderer an.
- G118 normalisiert dieses lokale Statusmodell intern; die Anzeige bleibt
  read-only und es entsteht keine neue Host-Uebergabe.
- G119 bestaetigt den Host-Kontext nur als Abschlussstand; daraus folgt
  keine weitere UI-Freigabe.
- G120 bereitet nur eine optionale Host-Kontext-Aufnahme vor; der sichtbare
  Standard bleibt gleich.
- G121 dokumentiert die spaetere Host-Kontext-UEbergabe als
  Freigabeentscheidung; echte Quelle, Bedingungen und Speichergrenzen sind
  damit klar getrennt.
- G122 schliesst die echte Host-Kontext-UEbergabe aus dem Restarbeiten-Host
  an den UI-Editor an; der Default ohne eindeutige Restarbeit bleibt
  unveraendert.

## Stop-Regel

Bei unklarer UI-Grundlage, unklarer Surface-Freigabe oder noetigem Zugriff auf
verbotene Bereiche gilt: stoppen, nicht improvisieren.
