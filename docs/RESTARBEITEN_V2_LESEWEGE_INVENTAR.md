# Restarbeiten V2 Lesewege Inventar

## 1. Zweck
Dieses Dokument ist nur ein Inventar.

- Es baut keine neue Anbindung.
- Es veraendert keine bestehende Logik.
- Es ist die Grundlage fuer eine spaetere ReadOnly-Anbindung.

## 2. Gefundene bestehende Lesewege

| Datei | Funktion / Methode | Ebene | Zweck | Liest | Schreibt | Parameter | Rueckgabe |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/main/ipc/restarbeitenIpc.js` | `ipcMain.handle("restarbeiten:listByProject")` in `registerRestarbeitenIpc` | Main / IPC | Laedt die Restarbeiten eines Projekts aus dem Repo | ja | nein | `payload.projectId`, optional `includeArchived`, `includeDeleted` | `{ ok: true, items: [...] }` |
| `src/main/ipc/restarbeitenIpc.js` | `ipcMain.handle("restarbeiten:getProjectSettings")` in `registerRestarbeitenIpc` | Main / IPC | Laedt projektbezogene Restarbeiten-Einstellungen | ja | nein | `payload.projectId` | `{ ok: true, settings: {...} }` |
| `src/main/ipc/restarbeitenIpc.js` | `ipcMain.handle("restarbeiten:listAttachments")` in `registerRestarbeitenIpc` | Main / IPC | Laedt Attachments einer Restarbeit | ja | nein | `payload.restarbeitId` | `{ ok: true, attachments: [...] }` |
| `src/main/preload.js` | `restarbeitenListByProject` | Preload | Renderer-Bruecke fuer die Restarbeiten-Liste | ja, ueber IPC | nein | `data` / `projectId` | Promise aus `ipcRenderer.invoke("restarbeiten:listByProject", ...)` |
| `src/main/preload.js` | `restarbeitenGetProjectSettings` | Preload | Renderer-Bruecke fuer Restarbeiten-Einstellungen | ja, ueber IPC | nein | `data` / `projectId` | Promise aus `ipcRenderer.invoke("restarbeiten:getProjectSettings", ...)` |
| `src/main/preload.js` | `restarbeitenListAttachments` | Preload | Renderer-Bruecke fuer Attachment-Liste | ja, ueber IPC | nein | `data` / `restarbeitId` | Promise aus `ipcRenderer.invoke("restarbeiten:listAttachments", ...)` |
| `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js` | `listRestarbeitenByProject(projectId)` | Renderer / DataSource | Liest die Restarbeiten-Liste ueber `window.bbmDb` | ja | nein | `projectId` | `Array` von Rohzeilen |
| `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js` | `getRestarbeitenProjectSettings(projectId)` | Renderer / DataSource | Liest projektbezogene Restarbeiten-Einstellungen | ja | nein | `projectId` | `Object` mit Settings oder `{}` |
| `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js` | `listRestarbeitAttachments(restarbeitId)` | Renderer / DataSource | Liest Attachments einer Restarbeit | ja | nein | `restarbeitId` | `Array` von Attachments |
| `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js` | `listResponsibleProjectFirms(projectId)` | Renderer / DataSource | Liest Firmen fuer die Workbench-Auswahl | ja | nein | `projectId` | `Array` von Firmenobjekten |
| `src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js` | `toRestarbeitenListItems(rows, today)` | Renderer / ViewModel | Formatiert Restarbeiten-Rohdaten fuer die Liste | ja, nur Transformation | nein | `rows`, optional `today` | `Array` von Listeneintraegen |
| `src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js` | `render()` / interne Ladepfade | Renderer / UI | Nutzt die DataSource und baut die sichtbare Restarbeiten-UI | ja | ja, ueber UI-Aktionen | `router`, `projectId`, `project` | DOM-Root |

## 3. Reine Lesewege

Die folgenden Wege sind fuer eine spaetere ReadOnly-Kette besonders interessant:

- `listRestarbeitenByProject(projectId)`
- `getRestarbeitenProjectSettings(projectId)`
- `listRestarbeitAttachments(restarbeitId)`
- `listResponsibleProjectFirms(projectId)` als unterstuetzender Leseweg fuer die Workbench

Diese Wege liefern Daten oder Rohobjekte zurueck und sind lesend.

## 4. Nicht geeignete Wege

Die folgenden Wege sind fuer eine ReadOnly-Kette nicht geeignet, weil sie schreiben oder Fachaktionen ausloesen:

- `restarbeiten:createItem`
- `restarbeiten:updateItem`
- `restarbeiten:softDeleteItem`
- `restarbeiten:importAttachments`
- `restarbeiten:deleteAttachment`
- `restarbeiten:setPrimaryAttachment`
- `createRestarbeitItem(...)`
- `updateRestarbeitItem(...)`
- `softDeleteRestarbeitItem(...)`
- `addRestarbeitAttachment(...)`
- `deleteRestarbeitAttachment(...)`
- `setPrimaryRestarbeitAttachment(...)`
- `importRestarbeitAttachments(...)`

UI-nahe oder navigierende Wege sind ebenfalls keine Datenquellen fuer M16.9:

- `ProjectWorkspaceScreen.openProjectModule("restarbeiten")`
- `RestarbeitenScreen.render()`

## 5. Kandidaten fuer M16.9

Am ehesten geeignet fuer `RestarbeitenV2LegacyReadBridge` ist:

- `listRestarbeitenByProject(projectId)` aus `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js`

Warum:

- die Funktion ist bereits lesend
- sie liefert die Restarbeiten-Rohzeilen
- sie kennt `projectId`
- sie kann spaeter als injizierte Quelle uebergeben werden, ohne die UI direkt mit IPC zu koppeln

Moegliche Begleitkandidaten:

- `getRestarbeitenProjectSettings(projectId)` wenn spaeter Projekt-Einstellungen mitgeliefert werden sollen
- `listRestarbeitAttachments(restarbeitId)` wenn Attachment-Daten spaeter auch lesend in V2 gebraucht werden

Erforderliche spaetere Anpassungen:

- Bridge statt Direktimport verwenden
- keine direkte `window`-Abhaengigkeit im V2-ReadOnly-Adapter
- Legacy-Rohdaten nur ueber den Mapper in V2-DTOs ueberfuehren

Risiken:

- Die Quelle ist an `window.bbmDb` gebunden.
- Die Rohdaten sind noch im Legacy-Schema mit `short_text`, `long_text`, `location_level_*`, `responsible_label` und aehnlichen Feldern.
- Attachment- und Projektsettings-Daten sind getrennt von der eigentlichen Listenquelle.

## 6. Grenze fuer spaetere Anbindung

- Die kaputte sichtbare `RestarbeitenV2Screen`-UI ist entfernt.
- Eine spaetere neue Restarbeitenliste bleibt frei von direktem IPC.
- Eine spaetere neue Restarbeitenliste bleibt frei von alter Restarbeiten-UI.
- `RestarbeitenV2ReadOnlyAdapter` bleibt die DataSource-Ebene.
- `RestarbeitenV2LegacyReadBridge` bekommt nur eine injizierte Lesefunktion.
- Das Mapping bleibt im Mapper.

## 7. NO-GO-Regeln

- Kein Import aus `src/renderer/modules/restarbeiten/**` in eine spaetere neue Restarbeitenliste.
- Keine direkte DB im Renderer.
- Kein neuer IPC ohne eigenes spaeteres Paket.
- Keine Schreibfunktion in der ReadOnly-Kette.
- Kein `create`, `update`, `delete`, `upload` oder `attachment delete` in der ReadOnly-Kette.
