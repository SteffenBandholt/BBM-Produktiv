# UI-Editor Hinweis-Infotext Create-Note-Vertrag

## Kurzfazit

Der fachliche Zielweg fuer spaetere Speicherung von `Hinweis / Infotext` liegt
im bestehenden Restarbeiten-Notizpfad. `restarbeiten:createNote` nimmt bereits
einen Restarbeit-Bezug und einen Text entgegen, schreibt ueber `restarbeitenIpc`
in `restarbeitenRepo` und liefert das angelegte Notizobjekt zurueck. G112
beschreibt nur diesen Vertrag, keinen neuen Speicherweg.

## Gefundene Dateien / Module

- `src/main/ipc/restarbeitenIpc.js`
- `src/main/db/restarbeitenRepo.js`
- `src/main/preload.js`
- `src/main/db/database.js`
- `src/renderer/modules/restarbeiten/RestarbeitenEditbox.js`
- `scripts/tests/restarbeitenModule.test.cjs`

## Aktueller technischer Vertrag von `restarbeiten:createNote`

- IPC-Channel: `restarbeiten:createNote`
- Handler: `ipcMain.handle("restarbeiten:createNote", ...)`
- Renderer-Bruecke: `window.bbmDb.restarbeitenCreateNote(...)`
- Aufrufweg: `ipcRenderer.invoke("restarbeiten:createNote", data)`
- Eingabekontext: Objekt-Payload aus dem Renderer
- Pflichtwerte im Handler:
  - `restarbeitId`
  - `noteText` oder `note_text`
- Repo-Aufruf:
  - `repo.createRestarbeitNote(restarbeitId, noteText)`
- Rueckgabeform:
  - `{ ok: true, note }`
  - bei Fehlern `{ ok: false, error }`

## Erwartete Eingabefelder

- `restarbeitId`
- `noteText` / `note_text`
- optional spaeter im Repo, nicht im aktuellen IPC-Aufruf:
  - `id`
  - `created_at`
  - `created_by`

## Rueckgabewert / Ergebnisform

- bei Erfolg das gespeicherte Notizobjekt aus `restarbeiten_notes`
- die Tabelle fuehrt aktuell:
  - `id`
  - `restarbeit_id`
  - `note_text`
  - `created_at`
  - `created_by`
  - `deleted_at`
- Rueckgabewerte bleiben objektbasiert, nicht als neuer Fachzustand im UI

## Fehlerfaelle

- fehlende `restarbeitId`
- fehlendes oder leeres `noteText`
- unbekannte `restarbeitId`
- generischer Fehler mit Fallback-Meldung `Notiz konnte nicht gespeichert werden.`

## Notwendige Kontextdaten aus dem BBM-Host

- `projectId`
- Restarbeiten-Kontext / zugehoeriger Datensatz
- ggf. Benutzer-/Zeit-/Quelle-Information
- G113 klaert dazu, woher die eindeutige `restarbeitId` kommen kann.

## Moegliche spaetere Zuordnung vom UI-Editor-Draft

```text
UI-Editor-Draft:
- type: Hinweis / Infotext
- surfaceId: restarbeiten.ui.main
- status: draft
- persisted: false
- text: <aktueller Hinweistext>
```

## Weiterhin nicht umgesetzte Punkte

In G112 wird kein Speicherweg angeschlossen.
Der Button `Entwurf speichern` bleibt deaktiviert.
Es wird kein Submit eingefuehrt.
Es wird keine IPC-/DB-Schreibaktion ausgelöst.
Es wird keine persistente Element-Erstellung eingefuehrt.
Die Payload-Vorschau bleibt reine Anzeige.
`persisted: false` bleibt verbindlich.

## Guardrails vor spaeterer Aktivierung

- Speicherbutton nur mit expliziter fachlicher Freigabe
- Speichern nur bei gueltigem Hinweistext
- Speichern nur auf `restarbeiten.ui.main`
- Speichern nur fuer `Hinweis / Infotext`
- Speichern nur ueber `restarbeiten:createNote`
- kein Speichern ueber Payload-Vorschau
- keine automatische Persistenz beim Tippen
- kein localStorage
- kein writeFile
- keine Wildcards
- keine Default-true-Freigaben
- sichtbare Erfolg- und Fehlerrueckmeldung

## Notwendige Tests vor spaeterer Aktivierung

- Test fuer den erlaubten Restarbeiten-Notizweg
- Test fuer fehlende `restarbeitId`
- Test fuer leeren Hinweistext
- Test fuer die Rueckgabeform `{ ok: true, note }`
- Test fuer blockierte Layout-Override-Nutzung
- Test fuer `restarbeiten.ui.main`

## Notwendige Electron-Sichtpruefung vor spaeterer Aktivierung

- Sichtpruefung ist bei einer spaeteren Einfuehrung des Speicherbuttons
  zwingend
- Geprueft werden Aktivzustand, Rueckmeldung und Trennung von Anzeige und
  Speichern

## Abgrenzung zum UI-Editor-kit

- Das `UI-Editor-kit` speichert nicht
- BBM-Produktiv bleibt Host und traegt den Restarbeiten-Vertrag
- keine Aenderung an `../UI-Editor-kit`

## Empfohlener naechster Schritt

Den analysierten Vertrag nur als dokumentarische Grundlage stehen lassen und
erst nach eigener Freigabe einen echten Speicherweg bauen.

## G113: Kontextbezug

- G113 ergaenzt die Analyse um die Frage, woher die passende `restarbeitId`
  kommen kann.
- Ohne diesen Host-Kontext bleibt der technische Vertrag zwar klar, aber noch
  nicht sicher an die richtige Restarbeit gebunden.

## G114: Uebergabestrategie

- Die spaetere `restarbeitId` muss vom BBM-Restarbeiten-Host kommen.
- Der UI-Editor selbst darf die Ziel-Restarbeit nicht suchen oder raten.
