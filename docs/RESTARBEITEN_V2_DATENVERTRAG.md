# Restarbeiten V2 Datenvertrag

## 1. Grundsatz
Restarbeiten V2 darf echte Daten erst ueber einen eigenen Adapter oder eine eigene DataSource erhalten.

- UI-Komponenten greifen nicht direkt auf IPC oder DB zu.
- `RestarbeitenV2Screen` bleibt Renderer-UI.
- Fachlogik liegt in ViewModel- und Adapter-Grenzen.
- Editor V2 bleibt fachneutral und bekommt nur Registry- und DOM-Bezug.
- Es gibt keinen Restarbeiten-Fachcode im Editor V2.

## 2. Datenmodell Restarbeit V2
### Pflichtfelder
- `id`
- `nummer`
- `kurztext`
- `status`
- `verortung`

### Optionale Felder
- `langtext`
- `meta`
- `notiz`
- `fotos`
- `responsibleFirmId`
- `responsibleFirmName`
- `dueDate`
- `createdAt`
- `updatedAt`
- `completedAt`

### Statuswerte
- `offen`
- `erledigt`

Optional spaeter:
- `in_pruefung`
- `entfallen`

Fuer den aktuellen DEV-Skeleton-Stand nutzt Restarbeiten V2 nur `offen` und `erledigt`.

## 3. Listenansicht
Die Liste braucht mindestens:

- `nummer`
- `kurztext`
- `verortung`
- `status`
- optional `meta`

## 4. Workbench
Die Workbench braucht:

- `kurztext`
- `langtext`
- `verortung`
- `status`
- `meta`
- `fotos`
- `notiz`

## 5. Foto-Regel
Fuer M16.0 gilt nur der Vertrag:

- Fotos bleiben optional.
- Es gibt keine Upload- oder Delete-Funktion.
- Fotos duerfen spaeter ueber eine eigene Attachment-Schicht kommen.
- Keine Foto-Logik direkt im Screen.

## 6. Adapter-Grenze
Die spaetere technische Struktur soll so aussehen:

- `restarbeitenV2DataSource.js`
- `restarbeitenV2Mapper.js`
- `restarbeitenV2ReadOnlyAdapter.js`
- `restarbeitenV2RepositoryBridge.js` nur falls sinnvoll

Regeln:

- Der Screen ruft keine IPC-Funktion direkt.
- Der Screen arbeitet mit einem DataSource-Interface.
- Die DataSource normalisiert IPC- oder Backend-Antworten.
- Der Mapper uebersetzt alte oder echte Daten in Restarbeiten-V2-DTOs.
- Ein ReadOnly-Adapter kann spaeter lesend auf eine injizierte Legacy-Quelle zugreifen, ohne Schreibpfade zu oeffnen.

## 7. Vorgeschlagenes DataSource-Interface
Noch nicht implementieren:

- `listRestarbeitenV2(projectId)`
- `createRestarbeitV2(projectId, draft)`
- `updateRestarbeitV2(id, patch)`
- `deleteRestarbeitV2(id)`
- `listRestarbeitV2Attachments(id)`

## 8. DTOs
### RestarbeitV2Dto
- `id: string`
- `nummer: string`
- `kurztext: string`
- `langtext: string`
- `verortung: string`
- `status: "offen" | "erledigt"`
- `meta: string`
- `notiz: string`
- `fotos: array`
- `responsibleFirmId: string|null`
- `responsibleFirmName: string`
- `dueDate: string|null`
- `createdAt: string|null`
- `updatedAt: string|null`
- `completedAt: string|null`

### RestarbeitV2Draft
- `kurztext`
- `langtext`
- `verortung`
- `status`
- `meta`
- `notiz`

### RestarbeitV2Patch
- alle Draft-Felder optional

## 9. Migrations- und Altmodul-Regel
- Die alte Restarbeiten-UI wird in M16.0 nicht geaendert.
- Die alte Restarbeiten-DataSource wird nicht direkt in den neuen Screen importiert.
- Falls spaeter alte Datenwege genutzt werden, dann nur ueber Mapper oder Adapter.
- Kein Import aus `src/renderer/modules/restarbeiten/**` in `RestarbeitenV2Screen.js`.

## 10. Projektkontext
- Der DEV-Zugang braucht weiterhin keinen Projektkontext.
- Die echte Modul-Anbindung braucht spaeter `projectId`.
- Ohne `projectId` darf die echte DataSource spaeter nicht laden oder speichern.
- Der DEV-Dummy-Modus bleibt unabhaengig.

## 11. Editor-V2-Grenze
- Editor V2 veraendert Layout-Vorschau.
- Editor V2 veraendert keine Restarbeiten-Daten.
- Editor V2 speichert keine Restarbeiten.
- Editor V2 kennt keine Fachlogik fuer `status`, `kurztext` oder `verortung`.

## 12. Reihenfolge nach M16.0
- M16.1: DataSource-Interface als Stub anlegen, noch ohne IPC
- M16.2: Mapper fuer bestehende Restarbeiten-Daten pruefen
- M16.3: DEV-Screen optional mit injizierter DataSource betreiben
- M16.4: echte Projektmodul-Anbindung vorbereiten
- M16.5: ReadOnly-Adapter fuer bestehende Daten vorbereiten
- M16.6: DEV-Zugang ueber ReadOnly-Adapter pruefen
- M16.7: Legacy-Lese-Bridge fuer vorhandene Lesefunktionen vorbereiten

## 13. Abgrenzung
Diese Festlegung betrifft nur den Vertrag und die technische Grenze.

- Kein Produktivcode.
- Keine UI-Aenderung.
- Keine IPC-Anbindung.
- Keine DB-Anbindung.
- Kein Speichern.
- Kein Autosave.
- Keine Projektmodul-Anbindung.
- Kein alter uiInspector.
