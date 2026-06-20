# UI-Elementkatalog

## Kurzfazit

Dieser Katalog legt fest, welche UI-Elemente im UI-Editor aktuell bekannt und
zulassig sind. Im jetzigen Stand geht es nur um read-only oder
kontextbezogene Elemente; bearbeitbare UI-Elemente kommen erst mit eigener
Freigabe dazu. Die PDF-/Plan-Entwurfsentscheidung ist separat geregelt und liegt
ebenfalls vor.

## Zweck des Elementkatalogs

Der Katalog verhindert Raten. Er sagt klar, welche Elementarten der Editor
ueberhaupt anfassen darf und welche Angaben spaeter fuer editorrelevante
Elemente zwingend vorhanden sein muessen.

## Aktueller Stand

- UI-Elemente im Editor-Kontext sind aktuell read-only oder kontextbezogen.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` sind nur read-only Zusatzkontexte.
- Der Surface-Auswahl-Hinweis ist nur lesende Kontextanzeige.
- Die kompakte Statuszeile ist nur lesende Bedienzustandsanzeige.
- Die neue Elementkatalog-Übersicht ist nur lesende Einordnung.
- Die neue Entwurfs-Vorschau fuer `Hinweis / Infotext` bleibt nur Vorschau,
  nicht gespeichert und ohne neue Bedienlogik.
- Die Live-Vorschau mit `Hinweistext` bleibt lokal und ohne Persistenz.
- Die Host-Vorschau bleibt im Restarbeiten-Kontext lokal und ohne Persistenz.
- Die Elementmodell-Vorschau bleibt read-only und ohne Persistenz.
- Die Payload-Vorschau bleibt read-only und ohne Persistenz.
- Die Entwurfspruefung bleibt lokal, zeigt nur gueltig/leer plus
  `Speichern: nicht aktiv` und speichert nichts.
- Der Reset-Button fuer den Hinweis-/Infotext-Entwurf bleibt lokal und
  stellt nur den Standardtext wieder her.
- G102 bestaetigt diese lokale Hinweis-/Infotext-Kette als Abschlussstand.
- Die spaetere Kit-Extraktionsgrenze bleibt dokumentiert; die aktuelle
  BBM-Auspraegung ist noch nicht neutralisiert.
- Eine spaetere Speicherfreigabe bleibt ebenfalls separat; aktuell gibt es
  keinen Speicherbutton und keine Persistenz.
- G107 ordnet den moeglichen spaeteren BBM-Schreibweg nur ein; der
  Restarbeiten-Notizweg ist der naechste Kandidat, aber noch nicht aktiv.
- G108 gibt den Restarbeiten-Notizweg nur als spaetere Zielrichtung frei;
  die Aktivierung bleibt getrennt.

## Zulaessige Element- und Kontextarten

- Host-/Bestandssurface-Kontext
- read-only Surface-Kontext
- reine Hinweis-/Infotexte nach Freigabe
- nicht-persistente Entwurfs-Vorschau fuer Hinweis-/Infotext
- nicht-persistente Entwurfspruefung fuer Hinweis-/Infotext
- Test-/Doku-/Guardrail-Elemente
- read-only Elementkatalog-Übersichten

## Pflichtangaben fuer spaetere UI-Elemente

- eindeutige ID
- Surface-Zuordnung
- read-only oder bearbeitbar
- erlaubte Aktionen
- Persistenzstatus
- Testabdeckung

## Aktuell nicht zulaessig ohne eigene Freigabe

- bearbeitbare PDF-/Plan-Elemente
- kein Drag
- kein Resize
- keine Persistenz
- keine Wildcard
- kein Default-true
- Das spaetere Speicherziel und der BBM-Schreibweg bleiben dokumentiert; sie
  sind noch nicht aktiv.
- G109 zeigt einen gesperrten Speicherbereich im Editor-Kontext; das ist nur
  Anzeige, kein Speicherziel.
- G110 ergaenzt dort einen sichtbaren Freigabecheck; der Speicherbutton bleibt
  deaktiviert und es entsteht kein neues Speicherziel.
- G111 bestaetigt diesen Vorbereitungsstand als Abschlusscheck; sichtbarer
  Speicherbereich und Freigabecheck bleiben lesend und erzeugen kein neues
  Editor-Ziel.
- G112 dokumentiert den spaeteren `restarbeiten:createNote`-Vertrag nur
  lesend; daraus entsteht noch kein neues Elementziel.
- G113 zeigt die Luecke zwischen Draft und Restarbeiten-Zielkontext; ohne
  `restarbeitId` bleibt Speichern blockiert.
- G114 legt fest, dass die Ziel-Restarbeit vom Host kommt und nicht im
  UI-Editor gesucht oder geraten wird.
- G115 zeigt den fehlenden Host-Kontext nur als lesende Kontextanzeige; daraus
  entsteht noch kein neues Elementziel.
- G116 ergaenzt dazu nur den spaeteren Host-Kontext-Datenvertrag; ein
  Speicherziel entsteht daraus noch nicht.

## Stop-Regel

Unbekannte Elementtypen nicht improvisieren. Wenn ein Element nicht klar in
diesen Katalog passt, bleibt es blockiert, bis eine eigene Entscheidung vorliegt.
