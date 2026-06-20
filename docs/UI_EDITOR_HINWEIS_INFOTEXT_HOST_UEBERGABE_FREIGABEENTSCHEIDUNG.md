# UI-Editor Hinweis-Infotext Host-Uebergabe Freigabeentscheidung

## Kurzfazit

G121 gibt noch keine Umsetzung frei. Es legt nur fest, unter welchen harten
Bedingungen eine echte Host-Kontext-UEbergabe fuer `Hinweis / Infotext`
spaeter ueberhaupt verantwortbar waere.

## Ausgangslage nach G120

- Der Launcher kann optional einen Host-Kontext aufnehmen.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
- SurfaceInfo bleibt `restarbeiten.ui.main`.
- Es gibt noch keine echte Host-Uebergabe, keinen Speicherweg und keine neue
  Freigabe.

## Zweck der echten Host-Kontext-UEbergabe

Die spaetere UEbergabe soll eine eindeutig gemeinte Restarbeit an den
`Hinweis / Infotext`-Entwurf binden, damit ein spaeterer Speicherweg nicht
raten, suchen oder auf einen Default ausweichen muss.

## Zulässige spätere Quelle

```text
Host-Kontext darf nur aus dem BBM-Restarbeiten-Host kommen.
restarbeitId nur aus eindeutig ausgewählter Restarbeit.
Zulaessiger Kandidat ist der konkrete Restarbeiten-Kontext im RestarbeitenScreen.
notesPopup.restarbeitId nur dann als Quelle, wenn die UI bewusst aus genau
dieser Restarbeit heraus geoeffnet wird oder wenn die gleiche Eindeutigkeit
durch explizite Host-Uebergabe hergestellt ist.
```

## Zwingende Bedingungen vor Umsetzung

```text
projectId eindeutig vom Host
restarbeitId eindeutig vom Host
targetContext exakt Restarbeiten
targetSurfaceId exakt restarbeiten.ui.main
elementType exakt Hinweis / Infotext
targetLabel sichtbar und nicht leer
Uebergabe nur ueber vorbereiteten optionalen Host-Kontext des Launchers
geprueft durch normalizeHostContextStatus
ungueltige Uebergaben fallen auf isPresent: false
```

## Ausdruecklich verbotene Ableitungen

```text
nicht zulässig:
- globale Suche
- erste gefundene
- zuletzt geoeffnete ohne explizite Uebergabe
- Ableitung aus Hinweistext
- Ableitung aus SurfaceId allein
- Ableitung aus Projekttitel allein
- Default-Restarbeit
- Wildcard
- Default-true
```

## Erlaubter späterer technischer Zielpfad

- der Host liefert `projectId` und `restarbeitId` explizit mit
- der Launcher normalisiert den Host-Kontext nur intern
- die bestehende read-only Anzeige bleibt unveraendert
- eine spaetere echte Freigabe darf erst dann an den Speicherweg
  anschliessen

## Weiterhin nicht freigegebene Speicherfunktionen

- aktiver Speicherbutton
- kein Submit
- Speichern
- persistente Element-Erstellung
- keine IPC-/DB-Schreibaktion
- kein localStorage
- kein writeFile
- direkte Dateischreibung
- automatische Persistenz beim Tippen
- Speichern ueber Payload-Vorschau
- Speichern ohne eindeutige `restarbeitId`
- Speichern in PDF-/Plan-read-only-Kontexte

## Notwendige Tests vor Umsetzung

- Test fuer die dokumentierte Host-UEbergabequelle
- Test fuer `projectId` und `restarbeitId` als Host-Daten
- Test fuer `normalizeHostContextStatus`
- Test fuer `isPresent: false` bei ungueltiger UEbergabe
- Test fuer die blockierten Speicherwege

## Notwendige Electron-Sichtpruefung bei Umsetzung

Nur noetig, wenn spaeter sichtbare UI oder ein aktiver Speicherweg gebaut
wird. Dann sind Zielkontext, Ziel-Restarbeit, Buttonzustand und die Trennung
von Anzeige und Speichern visuell zu pruefen.

## Abgrenzung zum UI-Editor-kit

- `UI-Editor-kit` speichert nicht.
- BBM-Produktiv bleibt Host.
- Keine Aenderung an `../UI-Editor-kit`.

## Empfohlener naechster Schritt

Die Freigabe nur dokumentarisch stehen lassen und erst nach einer bewussten
Host-Freigabe in Code verdrahten.
