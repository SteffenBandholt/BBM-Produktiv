# UI-Editor Hinweis-Infotext Speicherziel und BBM-Schreibweg Entscheidung

## Kurzfazit

Ein moegliches spaeteres Speicherziel ist beschrieben, aber noch nicht gebaut.
Der `Hinweis / Infotext`-Entwurf bleibt bis auf Weiteres lokal. Es gibt noch
keinen BBM-Schreibweg, der dieses Ziel sicher bedienen wuerde.
G108 macht daraus nun die dokumentarische Freigabe des Restarbeiten-Notizwegs
als spaeteren Ziel-Schreibweg.

## Aktueller Nicht-Speicher-Stand

- Speichern bleibt aus.
- `restarbeiten.ui.main` bleibt die aktuelle Hostsurface.
- Die Payload-Vorschau bleibt reine Anzeige.
- `persisted: false` bleibt der sichtbare lokale Stand.
- Es gibt keinen Speicherbutton und keinen aktivierten Schreibweg.

## Moegliches spaeteres Speicherziel

Zulässiger spaeterer Zielkontext:

```text
Zielkontext: Restarbeiten
SurfaceId: restarbeiten.ui.main
Elementtyp: Hinweis / Infotext
Status vor Speicherung: draft
Persistenz vor Speicherung: persisted: false
```

## Zulässige SurfaceId

- `restarbeiten.ui.main`

## Zulässiger Elementtyp

- `Hinweis / Infotext`

## Zulässige Payload-Felder

Moegliches spaeteres Entwurfsmodell:

```text
type: Hinweis / Infotext
surfaceId: restarbeiten.ui.main
status: draft
persisted: false
text: <aktueller Hinweistext>
createdFrom: ui-editor-draft
```

## Noch nicht vorhandener Schreibweg

- Es gibt noch keinen BBM-Schreibweg.
- Es gibt noch keinen IPC-Schreibweg.
- Es gibt noch keinen DB-Schreibweg.
- Es gibt noch keine persistente Element-Erstellung.
- Der naechste fachliche Kandidat wird in der BBM-Schreibweg-Analyse
  eingeordnet.

## Warum der Schreibweg noch nicht gebaut wird

- Das Ziel ist fachlich benannt, aber nicht als produktiver Weg freigegeben.
- Der Hinweistext bleibt aktuell ein lokaler Entwurf mit read-only Vorschauen.
- Ein falscher Schreibweg wuerde die klare BBM-Hostgrenze aufbrechen.
- Der Schreibweg muss erst separat getestet und abgesichert werden.

## Notwendige Guardrails vor Implementierung

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

## Notwendige Tests vor Implementierung

- Test fuer erlaubten Schreibweg
- Test fuer blockierte Wege
- Test fuer gueltigen und leeren Hinweistext
- Test fuer Zielkontext `Restarbeiten`
- Test fuer `restarbeiten.ui.main`

## Notwendige Electron-Sichtpruefung vor Implementierung

- Sichtpruefung ist bei einer spaeteren Einfuehrung des Speicherbuttons zwingend.
- Geprueft werden Aktivzustand, Rueckmeldung und Trennung von Anzeige und Speichern.

## Abgrenzung zum UI-Editor-kit

- Das `UI-Editor-kit` speichert nicht.
- Der hier beschriebene Schreibweg ist BBM-seitig und noch nicht gebaut.
- G109 zeigt den Speicherbereich sichtbar, aber weiterhin ohne aktive
  Speicherung.
- G110 ergaenzt dort einen sichtbaren Freigabecheck; der Schreibweg bleibt
  weiter deaktiviert.
- Keine Aenderung an `../UI-Editor-kit`.

## Empfohlener naechster Schritt

Die lokale Hinweis-/Infotext-Kette unveraendert halten und den BBM-Schreibweg
erst dann bauen, wenn Ziel, Test und Rueckmeldung fachlich sauber feststehen.
