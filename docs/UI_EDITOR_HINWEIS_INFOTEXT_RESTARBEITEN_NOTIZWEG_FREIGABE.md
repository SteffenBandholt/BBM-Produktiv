# UI-Editor Hinweis-Infotext Restarbeiten-Notizweg-Freigabe

## Kurzfazit

Der spaetere Speicherweg fuer `Hinweis / Infotext` darf fachlich ueber den
bestehenden Restarbeiten-Notizweg vorbereitet werden. Das ist eine
Freigabeentscheidung fuer die Zielrichtung, noch keine technische Umsetzung.

## Entscheidung

```text
Entscheidung:
Der spaetere Speicherweg fuer `Hinweis / Infotext` darf fachlich nur ueber den
bestehenden Restarbeiten-Notizweg vorbereitet werden.

Ziel:
- Zielkontext: Restarbeiten
- SurfaceId: restarbeiten.ui.main
- Elementtyp: Hinweis / Infotext
- Kandidat: restarbeiten:createNote
- Schicht: BBM-Host, nicht UI-Editor-kit
```

## Fachlich zulassiger spaeterer Ziel-Schreibweg

- `restarbeiten:createNote`
- ueber `restarbeitenIpc`
- mit `restarbeitenRepo`

Warum geeignet:

- Der Pfad liegt im richtigen Hostkontext `restarbeiten.ui.main`.
- Der Weg ist bereits BBM-seitig vorhanden und kein neuer Schreibkanal.
- Der fachliche Inhalt ist naeher an einer Restarbeiten-Notiz als an einem
  Layout-Override.
- Die BBM-Hostgrenze bleibt klarer als bei `uiEditorLayoutOverrides:save`.

Warum Layout-Override-Speichern ungeeignet ist:

- `uiEditorLayoutOverrides:save` speichert nur Layout-Overrides.
- Es ist fachlich kein Inhaltsspeicher fuer `Hinweis / Infotext`.
- Es waere der falsche Zieltyp fuer einen Textentwurf mit Restarbeitenbezug.

## Notwendige Payload-Zuordnung

```text
UI-Editor-Draft:
- type: Hinweis / Infotext
- surfaceId: restarbeiten.ui.main
- status: draft
- persisted: false
- text: <aktueller Hinweistext>

Spaeterer Restarbeiten-Notizweg:
- projectId / restarbeiten-Kontext muss eindeutig aus dem Host kommen
- noteText / text muss aus dem gueltigen Hinweistext kommen
- Quelle muss als UI-Editor-Entwurf kenntlich sein
- Speichern darf nur durch sichtbare Nutzeraktion erfolgen
```

## Weiterhin nicht umgesetzt

```text
In G108 wird kein Speicherweg gebaut.
Es wird kein Speicherbutton eingefuehrt.
Es wird kein Submit eingefuehrt.
Es wird keine IPC-/DB-Schreibaktion angebunden.
Es wird keine persistente Element-Erstellung eingefuehrt.
Die Payload-Vorschau bleibt reine Anzeige.
`persisted: false` bleibt verbindlich.
```

## Notwendige Guardrails vor technischer Umsetzung

- Speicherbutton nur sichtbar/aktiv nach ausdruecklicher Freigabe.
- Speichern nur bei gueltigem Hinweistext.
- Speichern nur fuer `restarbeiten.ui.main`.
- Speichern nur fuer `Hinweis / Infotext`.
- Speichern nur ueber `restarbeiten:createNote`.
- Kein Speichern ueber `uiEditorLayoutOverrides:save`.
- Kein Speichern ueber Payload-Vorschau.
- Kein automatisches Speichern beim Tippen.
- Kein Speichern in PDF-/Plan-read-only-Kontexte.
- Kein localStorage.
- kein localStorage
- Kein writeFile.
- kein writeFile
- Keine Wildcards.
- keine Wildcards
- Keine Default-true-Freigaben.
- keine Default-true-Freigaben
- Erfolg und Fehler muessen sichtbar gemeldet werden.
- Tests muessen erlaubten und blockierten Schreibweg absichern.

## Notwendige Tests vor technischer Umsetzung

- Test fuer den erlaubten Restarbeiten-Notizweg.
- Test fuer blockierte Layout-Override-Nutzung.
- Test fuer gueltigen und leeren Hinweistext.
- Test fuer Zielkontext `Restarbeiten`.
- Test fuer `restarbeiten.ui.main`.

## Notwendige Electron-Sichtpruefung vor technischer Umsetzung

- Sichtpruefung ist bei einer spaeteren Einfuehrung des Speicherbuttons zwingend.
- Geprueft werden Aktivzustand, Rueckmeldung und Trennung von Anzeige und Speichern.

## Abgrenzung zum UI-Editor-kit

- Das `UI-Editor-kit` speichert nicht.
- Die Freigabe hier betrifft nur die BBM-Hostseite.
- Keine Aenderung an `../UI-Editor-kit`.
- G109 zeigt den Speicherbereich sichtbar an, aber weiterhin ohne aktive
  Speicherung.
- G110 legt darin einen sichtbaren Freigabecheck nach, ohne den Schreibweg
  zu aktivieren.

## Empfohlener naechster Schritt

Die Freigabe nur als dokumentarische Zielrichtung stehen lassen und die
spaetere technische Umsetzung erst nach eigener Detailfreigabe beginnen.
G109 kann darauf aufsetzen und den Speicherbereich sichtbar, aber gesperrt
anzeigen.

## G111: Abschlusscheck

- Der spaetere Restarbeiten-Notizweg bleibt nur die freigegebene Zielrichtung.
- Die Speicher-Vorbereitung ist weiterhin rein lesend und baut keinen neuen
  Schreibweg.

## G112: Vertragsbezug

- `restarbeiten:createNote` ist der dokumentierte technische Zielvertrag.
- Die Freigabe bleibt ohne angeschlossenen Speicherweg.
