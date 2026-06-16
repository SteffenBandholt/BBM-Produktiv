# UI-Editor Surface Switching Konzept ohne Umsetzung

## Kurzfazit

Die read-only Surface-Phase ist abgeschlossen. Dieses Dokument bereitet nur
die fachlich und technisch kontrollierte Diskussion einer spaeteren echten
Surface-Umschaltung vor. Es aktiviert keine Umschaltung, keine Sichtbarkeits-
oder Interaktionsaenderung und keine Produktivlogik.

- keine echte Surface-Umschaltung

## Nachtrag G87

- Die fachliche Bedeutung der aktuell sichtbaren Surface-Auswahl ist jetzt in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_ENTSCHEIDUNG.md`
  festgelegt.
- Die Auswahl bleibt vorerst eine read-only Sichtbarkeits-/Kontextanzeige.

## Nachtrag G88

- Der Surface-Auswahl-Kontext ist jetzt als Referenzstand in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_REFERENZSTAND.md`
  abgesichert.
- Die read-only Surface-Phase bleibt unveraendert abgeschlossen.

## Ausgangsstand nach G85

```text
Host-/Bestandssurface:
- restarbeiten.ui.main

read-only sichtbar:
- pdf.plan.page.1
- plan.canvas.default

weiterhin blockiert:
- unbekannte SurfaceIds
- *
- leere IDs
```

SurfaceInfo zeigt weiterhin bewusst `restarbeiten.ui.main`. Der gesicherte
Klickpfad bleibt:

```text
Start -> Projekte -> Nr.: 04-2026 / UI-Polish fuer BBM -> Restarbeiten -> UI-Editor
```

## Problemstellung

Die sichtbaren read-only Surfaces sind fachlich bereits getrennt von der
Host-Ansicht, aber noch nicht aktiv umgeschaltet. Fuer eine spaetere echte
Surface-Umschaltung muss vorab geklaert werden, was die aktive Surface
technisch und fachlich genau bedeutet, wie sich SurfaceInfo verhält und wie
die Trennung zu Drag, Resize und Persistenz dauerhaft gesichert bleibt.

## Moegliche Umschaltvarianten

### A) Keine echte Umschaltung

- aktueller Stand bleibt bestehen
- read-only Surfaces sind sichtbar
- SurfaceInfo bleibt Hoststand `restarbeiten.ui.main`
- geringstes Risiko

### B) Surface-Auswahl steuert nur Anzeige-Kontext

- Auswahl wirkt auf sichtbare read-only Informationen
- keine Bearbeitung
- keine Persistenz
- SurfaceInfo kann optional separat bleiben

### C) Surface-Auswahl steuert SurfaceInfo

- SurfaceInfo zeigt die gewaehlte SurfaceId
- fachlich klarer
- Risiko: naehrt sich echter Umschaltung an
- eigene Electron-Sichtpruefung erforderlich

### D) Echte Surface-Umschaltung

- aktive SurfaceId wird tatsaechlich gewechselt
- hohes Risiko
- nur spaeter mit eigener Freigabe
- keine Kopplung an Drag/Resize/Persistenz

### E) Umschaltung plus Bearbeitung

- in dieser Projektphase ausdruecklich nicht freigegeben

## Technische Voraussetzungen

- klare Trennung zwischen Auswahlmodell, SwitchCommand und Persistenz
- definierte Quelle fuer aktive Surface
- explizite Blockade unbekannter SurfaceIds, `*` und leerer IDs
- gesonderte Tests fuer erlaubte und blockierte Wechselziele
- eigene Electron-Sichtpruefung vor sichtbarer UI-Aenderung
- keine Kopplung an Drag, Resize oder Speicherpfade

## Fachliche Voraussetzungen

- fachlich entschiedenes Zielbild fuer die aktive Surface
- geklaertes Verhalten von SurfaceInfo
- klarer Nutzwert fuer die Umschaltung vor einer Umsetzung
- abgestimmte Scope-Grenze fuer weitergehende Bedienung
- klare Freigabe, welche SurfaceIds ueberhaupt aktiv werden duerfen

## Risiken

- zu fruehe Umschaltung verwischt Host- und Zielkontext
- SurfaceInfo kann unklar oder widerspruechlich wirken
- Drag, Resize oder Persistenz koennen ungewollt mitziehen
- unbekannte SurfaceIds oder Wildcards koennen die Kontrolle aufweichen
- sichtbare UI-Aenderung ohne Sichtpruefung erzeugt Abnahmerisiko

## Harte Grenzen

Eine spaetere Umschaltung darf nicht automatisch aktivieren:

- Drag
- Resize
- Persistenz
- Bearbeitungsbuttons
- PDF-Bearbeitung
- Plan-/Canvas-Interaktion
- DB-/IPC-Schreibwege
- localStorage
- writeFile
- Wildcard
- Default-true

## Explizite Abgrenzung

- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht

## Stop-/Go-Kriterien

### Go

- genau definiert ist, was "aktive Surface" bedeutet
- SurfaceInfo-Verhalten vorher entschieden ist
- Auswahlmodell und SwitchCommand getrennt von Persistenz bleiben
- Tests alle blockierten Faelle absichern
- Electron-Sichtpruefung eingeplant ist
- Drag/Resize/Persistenz ausdrücklich weiterhin false bleiben

### Stop

- echte Umschaltung nebenbei entsteht
- Drag/Resize/Persistenz mit aktiviert werden
- unbekannte SurfaceIds akzeptiert werden
- Wildcard oder Default-true entsteht
- Schreibwege entstehen
- SurfaceInfo ohne Entscheidung umgebaut wird
- sichtbare UI ohne Electron-Sichtpruefung geaendert wird

## Empfohlene naechste Schritte

```text
Empfohlener naechster Schritt:
Vor einer echten Surface-Umschaltung zuerst SurfaceInfo und Auswahl-Kontext fachlich entscheiden.
Keine Drag-/Resize-/Persistenz-Arbeiten beginnen.
```

Danach kann ein separates technisches Umschaltpaket vorbereitet werden, das
die fachlichen Entscheidungen nur umsetzt, aber nicht erweitert.

## Nachtrag G89

- Die technische Guardrail-Absicherung ist jetzt zusaetzlich in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md`
  dokumentiert.
- Die Auswahl bleibt read-only Sichtbarkeits-/Kontextanzeige; sie ist keine
  aktive Surface-Umschaltung und keine Grundlage fuer Schreibwege.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface, waehrend
  `pdf.plan.page.1` und `plan.canvas.default` read-only sichtbar bleiben.
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`; Drag, Resize,
  Persistenz, Wildcard und Default-true bleiben blockiert.
