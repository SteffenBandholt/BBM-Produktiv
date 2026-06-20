# UI-Editor Hinweis-Infotext Speicherfreigabe-Entscheidung

## Kurzfazit

Speichern ist fuer den `Hinweis / Infotext`-Entwurf weiterhin nicht aktiv.
Der Stand bleibt lokal, read-only und ohne Schreibweg. Eine spaetere
Freigabe braucht eine eigene, klare Entscheidung und saubere Guardrails.
G108 ordnet die Zielrichtung nun auf den Restarbeiten-Notizweg ein, ohne
damit einen Speicherweg zu bauen.

## Aktueller Nicht-Speicher-Stand

- Speichern ist weiterhin nicht aktiv.
- Der Hinweis-/Infotext-Entwurf bleibt lokal.
- Die Payload-Vorschau bleibt reine Anzeige.
- `persisted: false` ist verbindlich.
- Es gibt noch keinen Speicherbutton.
- Es gibt noch keinen Submit.
- Es gibt noch keinen IPC-Schreibweg.
- Es gibt noch keinen DB-Schreibweg.
- Es gibt noch keine persistente Element-Erstellung.
- Die BBM-Schreibweg-Analyse ist separat dokumentiert.
- kein Speicherbutton
- kein Submit
- kein IPC-Schreibweg
- kein DB-Schreibweg
- keine persistente Element-Erstellung
- kein localStorage
- kein writeFile
- keine IPC-/DB-Aktion
- keine Wildcards
- keine Default-true-Freigaben
- PDF-/Plan-read-only

## Warum Speichern noch blockiert bleibt

- Es gibt noch keine freigegebene Speicherstelle.
- Es gibt noch keine freigegebene SurfaceId fuer einen Speicherweg.
- Der Entwurf dient aktuell nur als lokale Vorschau und Pruefstruktur.
- Die Payload-Vorschau ist technisch, nicht speichernd.
- PDF-/Plan-Kontexte bleiben read-only und duerfen nicht als Ziel dienen.

## Voraussetzungen fuer spaetere Speicherfreigabe

- Zielkontext: Restarbeiten
- SurfaceId: restarbeiten.ui.main
- Elementtyp: Hinweis / Infotext
- Status vor Speicherung: draft
- Persistenz vor Speicherung: persisted: false
- eindeutige Entscheidung, wohin gespeichert wird
- eindeutige Entscheidung, welche SurfaceId gespeichert werden darf
- Validierung muss gueltigen Entwurf erzwingen
- Speicherbutton darf nur bei gueltigem Entwurf aktiv sein
- Speichern darf nur ueber einen definierten, getesteten BBM-Schreibweg laufen
- keine Wildcards
- keine Default-true-Freigaben
- keine Speicherung in PDF-/Plan-read-only-Kontexte
- klare Rueckmeldung nach erfolgreichem Speichern
- klare Fehlermeldung bei fehlgeschlagenem Speichern
- Tests muessen Schreibweg und blockierte Wege absichern
- Electron-Sichtpruefung ist bei Einfuehrung eines Speicherbuttons zwingend

## Erlaubter spaeterer Zielzustand

- Ein klar benannter Speicherbutton ist nur bei gueltigem Entwurf aktiv.
- Der Speicherweg ist bewusst und getestet.
- Nach erfolgreichem Speichern erscheint eine klare Rueckmeldung.
- Nach Fehlern erscheint eine klare Fehlermeldung.
- Die Vorschau bleibt Anzeige, der Speicherweg bleibt separat.

## Weiterhin verbotene Speicherwege

- localStorage
- writeFile
- direkte Dateischreibung
- unkontrollierte IPC-Aufrufe
- unkontrollierte DB-Schreibwege
- Speichern in read-only PDF-/Plan-Kontexte
- Speichern bei leerem Hinweistext
- Speichern ohne sichtbare Nutzeraktion
- Speichern ueber Payload-Vorschau
- automatische Persistenz beim Tippen
- Default-true-Freigaben
- Wildcard-Freigaben
- kein automatisches Speichern beim Tippen
- kein Speichern ueber Payload-Vorschau

## Notwendige Guardrails vor Speicherbutton

- keine Speicherfreigabe ohne dokumentierte Zielsurface
- kein Speicherbutton ohne gueltigen Entwurf
- kein Schreibweg ohne expliziten BBM-Contract
- keine Freigabe fuer read-only PDF-/Plan-Kontexte
- keine automatische Persistenz
- keine Nutzung der Payload-Vorschau als Speicherausloeser
- Speichern nur bei gueltigem Hinweistext
- Speichern nur auf `restarbeiten.ui.main`
- Speichern nur fuer Elementtyp `Hinweis / Infotext`
- Speichern nur durch sichtbare Nutzeraktion
- kein automatisches Speichern beim Tippen
- kein Speichern ueber Payload-Vorschau
- kein Speichern in PDF-/Plan-read-only-Kontexte
- keine Wildcards
- keine Default-true-Freigaben
- klarer Erfolgshinweis
- klare Fehlermeldung

## Notwendige Tests vor Speicherbutton

- Guardrail-Test fuer das neue Speicherfreigabe-Dokument
- Test fuer gueltigen und leeren Hinweistext
- Test fuer aktiv/nicht aktiv des Speicherbuttons
- Test fuer den definierten BBM-Schreibweg
- Test fuer blockierte Wege wie `localStorage`, `writeFile`, IPC und DB
- Test fuer blockierte PDF-/Plan-read-only-Kontexte
- Tests fuer erlaubten und blockierten Schreibweg

## Notwendige Electron-Sichtpruefung vor Speicherbutton

- Sichtpruefung ist bei Einfuehrung eines Speicherbuttons zwingend.
- Geprueft werden Sichtbarkeit, Aktivzustand, Fehlerzustand und Rueckmeldung.
- Geprueft wird die Trennung zwischen Vorschau und Speichern.

## Abgrenzung zu UI-Editor-kit

- Das `UI-Editor-kit` speichert nicht.
- BBM-Produktiv bleibt Host und entscheidet ueber eine spaetere Freigabe.
- Die aktuelle Doku legt nur die Grenze fest, nicht den Speicherpfad.
- G109 zeigt den Speicherbereich sichtbar an, aber weiterhin ohne aktive
  Speicherung.
- G110 ergaenzt dort einen sichtbaren Freigabecheck; der Speicherbutton bleibt
  deaktiviert und es wird weiter nichts gespeichert.
- Keine Aenderung an `../UI-Editor-kit`.
- Das spaetere Speicherziel ist getrennt dokumentiert und beschreibt noch
  keinen gebauten Schreibweg.
- Der konkrete BBM-Schreibweg bleibt in
  `docs/UI_EDITOR_HINWEIS_INFOTEXT_SPEICHERZIEL_SCHREIBWEG_ENTSCHEIDUNG.md`
  dokumentiert.
- Der Ziel-/Schreibweg-Stand bleibt damit bewusst getrennt und deaktiviert.

## Empfohlener naechster Schritt

Die aktuelle lokale Hinweis-/Infotext-Kette weiter stabil halten und erst dann
eine eigenstaendige Speicherentscheidung vorbereiten, wenn Zielsurface und
Schreibweg wirklich fachlich feststehen. Der Schreibweg selbst bleibt noch
nicht gebaut.
