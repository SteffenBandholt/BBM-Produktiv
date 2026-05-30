# Restarbeiten V2 Leseweg-Entscheidung

## 1. Zweck
Dieses Dokument entscheidet den spaeteren ReadOnly-Leseweg.

- Es baut noch keine technische Anbindung.
- Es ist Grundlage fuer M17.x.

## 2. Ausgangslage
- `RestarbeitenV2Screen` arbeitet ohne IPC.
- `RestarbeitenV2ReadOnlyAdapter` existiert.
- `RestarbeitenV2LegacyReadBridge` existiert.
- Der Mapper existiert.
- Das Lesewege-Inventar existiert.

## 3. Gewaehlter Kandidat
Gewaehlter Kandidat fuer den spaeteren ReadOnly-Leseweg ist:

- Datei: `src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js`
- Funktion: `listRestarbeitenByProject(projectId)`
- Ebene: Renderer / DataSource
- erwarteter Parameter: `projectId`
- erwartete Rueckgabeform: `Array` von Restarbeiten-Rohzeilen
- Bewertung: geeignet, weil die Funktion bereits lesend arbeitet, die eigentlichen Restarbeiten-Zeilen liefert und sich spaeter ueber eine injizierte Lesefunktion an die LegacyReadBridge anbinden laesst.

## 4. Nicht gewaehlte Kandidaten
Nicht gewaehlte Kandidaten:

- `getRestarbeitenProjectSettings(projectId)` aus `restarbeitenDataSource.js`
  - nicht gewaehlte Hauptquelle, weil es Projekt-Einstellungen liefert und nicht die eigentliche Restarbeiten-Liste.
- `listRestarbeitAttachments(restarbeitId)` aus `restarbeitenDataSource.js`
  - nicht gewaehlte Hauptquelle, weil es nur Attachments liefert und keine Listenquelle ist.
- `listResponsibleProjectFirms(projectId)` aus `restarbeitenDataSource.js`
  - nicht gewaehlte Hauptquelle, weil es nur Begleitdaten fuer die Workbench liefert.
- `RestarbeitenScreen.render()` aus der alten UI
  - nicht gewaehlte Quelle, weil sie UI-nah ist und bereits die alte Restarbeiten-UI aufbaut.
- Schreibwege wie `createRestarbeitItem(...)`, `updateRestarbeitItem(...)`, `softDeleteRestarbeitItem(...)`, `importRestarbeitAttachments(...)`
  - nicht gewaehlte Kandidaten, weil sie schreiben oder Upload/Delete ausloesen.

## 5. Spaetere Zielkette
Projektkontext / `projectId`
→ bestehender lesender Weg (`listRestarbeitenByProject(projectId)`)
→ `RestarbeitenV2LegacyReadBridge`
→ `RestarbeitenV2ReadOnlyAdapter`
→ Mapper
→ `RestarbeitenV2Screen`

## 6. Grenzen
- `RestarbeitenV2Screen` bleibt frei von IPC.
- `RestarbeitenV2Screen` importiert keine alte Restarbeiten-UI.
- `RestarbeitenV2ReadOnlyAdapter` bleibt DataSource-Ebene.
- `RestarbeitenV2LegacyReadBridge` nimmt nur eine injizierte Lesefunktion.
- Der Mapper normalisiert Daten.
- Kein Speichern in dieser Kette.

## 7. Risiken
- Moegliche Feldabweichungen zwischen Legacy- und V2-Schema.
- Moegliche `projectId`-Abhaengigkeit der Quelle.
- Moegliche unterschiedliche Rueckgabeformen je nach Legacy-Weg.
- Moegliche Kopplung an das Altmodul ueber `window.bbmDb`.
- Moeglicherweise fehlen spaeter Attachments oder sie kommen aus einer separaten Quelle.

## 8. Naechster Schritt
M17.0:

- ReadOnly-Leseanbindung als eng begrenztes Paket vorbereiten
- nur Lesen
- keine Schreibwege
- keine UI-Umbauten
- keine Speicherung

## 9. M17.8 Abschluss
- Die M17-ReadOnly-Phase ist dokumentiert und fachlich eingeordnet.
- Freigegeben ist nur der lesende Pfad unter der bestehenden Freigabebedingung.
- Nicht freigegeben sind Speichern, Create, Update, Delete, Upload, Import, Autosave, neue IPC-Wege und die vollstaendige Ablösung der alten Restarbeiten-UI.
- Ohne Freigabe bleibt der alte Restarbeiten-Pfad erhalten.

## 10. M18.0 Startentscheidung
- M18 beginnt nicht mit Schreiben.
- M18 beginnt mit einer kontrollierten ReadOnly-Produktivfreigabe oder ihrer fachlichen Vorbereitung.
- Schreib-, Upload- und Autosave-Themen bleiben gesperrt, bis sie eigene Meilensteine erhalten.
- Die weitere Ablösung der alten Restarbeiten-UI wird erst danach gesondert entschieden.

## 11. M18.1 Technische Freigabestruktur
- Der Router unterscheidet jetzt lokal zwischen drei Zuständen: Altpfad als Standard, DEV-/Testfreigabe fuer den ReadOnly-Flow und spaetere produktive ReadOnly-Freigabe.
- Die DEV-/Testfreigabe bleibt an `bbm.uiMode = "new"` gebunden.
- Produktiv-ReadOnly-Freigabe ist strukturell vorbereitet, aber ohne ausdruecklichen spaeteren Freigabeschalter nicht aktiv.
- Als lesender Weg bleibt `listRestarbeitenByProject(projectId)` die Grundlage.
- Schreib-, Upload-, Import-, Autosave- und neue IPC-Wege bleiben gesperrt.
- Ohne Freigabe bleibt der alte Restarbeiten-Pfad Standard.

## 12. M18.2 Expliziter Produktiv-ReadOnly-Schalter
- Der spaetere explizite Schalter ist die produktive Freigabe fuer `restarbeiten` in der vorhandenen Mutter-/Kind-Freigabelogik.
- Das ist eine separate Produktivfreigabeebene und nicht die normale Restarbeiten-Lizenz allein.
- Ohne diesen spaeteren Schalter bleibt die produktive ReadOnly-Freigabe technisch aus.
- Kein neuer Settings-Schalter, kein neuer IPC, keine automatische Aktivierung.

## 13. M18.3 Technische Vorbereitung
- Der Router besitzt jetzt einen klar benannten Vorbereitungs-Checkpoint fuer die explizite Produktivfreigabe.
- Der Checkpoint ist absichtlich hart deaktiviert und liefert weiter `false`.
- DEV-/Testfreigabe bleibt an `bbm.uiMode = "new"` gebunden.
- Die normale Restarbeiten-Lizenz allein reicht weiterhin nicht.
- Keine neue Persistenz, kein neuer IPC, keine produktive Aktivierung.
