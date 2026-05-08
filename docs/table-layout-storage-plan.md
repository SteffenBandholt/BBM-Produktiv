# Tabellenlayout-Speicherplan

Status: Planungsdokument, keine Umsetzung
Stand: 2026-05-08
Bezug:
- `docs/UI-TECH-CONTRACT.md`
- `docs/table-layout-service.md`
- `docs/table-layout-audit-plan.md`
- `docs/table-layout-audit-report.md`
- `docs/table-layout-protokoll-tops.md`
- `docs/print-orientation-audit.md`

---

## 1. Ziel

Tabellenlayouts sollen spaeter intern bearbeitbar und speicherbar werden, ohne dass normale Nutzer dafuer eine neue UI bekommen.

Die vorhandenen Standardlayouts bleiben die fachliche Basis.
Gespeicherte Layouts sollen nur als Ueberschreibungen / Abweichungen dazukommen.

Wichtig:

- Standardlayout bleibt im Repo als Referenz erhalten
- gespeicherte Layouts duerfen Standardwerte nur gezielt ueberlagern
- portrait und landscape werden getrennt behandelbar
- die spaetere Speicherung soll intern, validierbar und ruecksetzbar sein

---

## 2. Nicht-Ziel

Noch nicht vorgesehen:

- keine Datenbank-Migration jetzt
- keine Editor-UI jetzt
- kein Tabelleneditor jetzt
- keine Header-/Footer-Aenderung
- keine normale Querformat-UI
- keine zweite PDF-Logik
- keine Aenderung an bestehenden Drucklayouts
- keine normale Nutzerfunktion

---

## 3. Ausgangslage im Repo

Die aktuelle Struktur zeigt drei wichtige Muster:

1. `app_settings` ist ein globales Key-Value-Repository fuer einzelne App- und Druckeinstellungen.
2. `project_settings` ist ein projektbezogenes Key-Value-Repository fuer wenige freigegebene Werte.
3. Tabellenlayouts sind fachlich strukturierter als normale Settings und brauchen mehr als nur `key/value`.

Aus der Sichtung:

- `src/main/db/database.js` legt `app_settings` und `project_settings` direkt in der DB an.
- `src/main/db/appSettingsRepo.js` und `src/main/db/projectSettingsRepo.js` arbeiten nur mit flachen Werten.
- `src/main/ipc/settingsIpc.js` und `src/main/ipc/projectSettingsIpc.js` zeigen, wie Settings derzeit transportiert werden.
- `src/shared/tableLayouts/protokollTopsLayout.js` ist bereits die zentrale Standarddefinition fuer `protokoll_tops`.
- `orientation` ist im Druckweg bereits vorhanden, also kann ein gespeichertes Layout spaeter direkt pro Format greifen.

Bewertung:

- `app_settings` und `project_settings` sind fuer Tabellenlayouts nicht gut genug.
- Tabellenlayouts sollten als eigene fachliche Datenart behandelt werden.

---

## 4. Empfohlene Speicherung

Empfehlung:

- eigene SQLite-Tabelle fuer Tabellenlayouts
- Speichern in der Haupt-DB unter `src/main/db/database.js`
- Zugriff ueber ein eigenes Repository, z.B. `src/main/db/tableLayoutsRepo.js`
- spaeter Anbindung an einen internen IPC-Bereich, nicht an normale Nutzer-Settings

Warum nicht `app_settings`?

- dort liegen nur flache globale Werte
- Layouts sind strukturierte Daten mit Spalten, Breiten, Regeln und evtl. Sichtbarkeit

Warum nicht `project_settings`?

- Projekt-Settings sind fuer projektspezifische Drucktexte und wenige Freigabewerte gedacht
- Tabellenlayouts sollen zuerst global und modulbezogen funktionieren
- projektbezogene Ausnahmen koennen spaeter als erweiterte Ebene kommen

Empfohlene Grundregel:

- globaler Standard pro Tabelle und Orientierung
- optional spaeter projektbezogene Ueberschreibung

---

## 5. Vorgeschlagene DB-Struktur

Empfohlen ist eine eigene Tabelle `table_layouts`.

Vorschlag:

```sql
CREATE TABLE IF NOT EXISTS table_layouts (
  table_key TEXT NOT NULL,
  module_id TEXT NOT NULL,
  orientation TEXT NOT NULL CHECK (orientation IN ('portrait', 'landscape')),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'project')),
  scope_id TEXT NOT NULL DEFAULT '',
  schema_version INTEGER NOT NULL DEFAULT 1,
  layout_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (table_key, module_id, orientation, scope_type, scope_id)
);
```

Begruendung:

- `table_key` identifiziert die fachliche Tabelle, z.B. `protokoll_tops`
- `module_id` trennt Tabellen je Modul
- `orientation` trennt portrait und landscape
- `scope_type` und `scope_id` halten die Struktur fuer spaetere Projekt-Overrides offen
- `layout_json` speichert den eigentlichen Layout-Overlay
- `schema_version` erlaubt spaetere Weiterentwicklungen ohne sofortige Zwangsmigration

Minimaler Start waere auch moeglich mit nur globalen Eintraegen.
Die Empfehlung oben laesst aber die spaetere Erweiterung ohne neuen Modellbruch zu.

---

## 6. Datenmodell als Beispiel

Gespeichert werden sollte nicht der gesamte Standard neu, sondern nur die Abweichung vom Standardlayout.

Beispiel fuer `layout_json`:

```json
{
  "columns": {
    "number": {
      "width": "64px"
    },
    "text": {
      "width": "1fr"
    },
    "meta": {
      "width": "minmax(50px, 74px)"
    }
  },
  "labels": {
    "text": "Gegenstand"
  }
}
```

Beispiel fuer die fachliche Identitaet:

```json
{
  "tableKey": "protokoll_tops",
  "moduleId": "protokoll",
  "orientation": "portrait",
  "scope": {
    "type": "global",
    "id": ""
  }
}
```

Wichtig:

- das Standardlayout bleibt weiterhin die volle Quelle der Wahrheit
- die DB speichert nur die Ueberschreibung
- ein gespeicherter Eintrag darf nie ohne Standardbasis angewendet werden

---

## 7. Lade-/Speicherfluss

### Laden

1. Standardlayout aus dem Repo laden, z.B. `src/shared/tableLayouts/protokollTopsLayout.js`.
2. Ggf. globale gespeicherte Layout-Ueberschreibung aus der DB laden.
3. Ggf. projektbezogene Ueberschreibung laden, falls spaeter aktiv.
4. Validierte Layoutwerte mit dem Standard zusammenfuehren.
5. Erst das zusammengefuehrte Ergebnis an UI oder PDF weitergeben.

### Speichern

1. Layout im internen Editor aendern.
2. Eingaben gegen erlaubte Felder und Werte pruefen.
3. Nur die Abweichung als `layout_json` speichern.
4. Timestamps aktualisieren.
5. Ueber IPC oder Repository neu laden, damit UI und PDF denselben Stand sehen.

### Ruecksetzen

1. Den gespeicherten Override-Eintrag fuer die betroffene Kombination loeschen.
2. Beim naechsten Laden wieder nur das Repo-Standardlayout verwenden.

Das Standardlayout im Repo wird dabei nicht geaendert.

---

## 8. Fallback auf Standardlayout

Empfohlene Reihenfolge beim Laden:

1. exakter Override fuer `table_key + module_id + orientation + scope`
2. falls `landscape` fehlt: Fallback auf `portrait`
3. falls kein Override existiert: Repo-Standardlayout
4. falls gespeicherte Daten ungueltig sind: Standardlayout behalten und Fehler protokollieren

Damit bleibt die App auch bei kaputten Layoutdaten lauffaehig.

---

## 9. portrait / landscape Behandlung

Die Orientierung sollte als fester Teil des Layoutschluessels gespeichert werden.

Empfehlung:

- ein Layout pro Tabelle und Orientierung
- `portrait` als Default
- `landscape` nur dann separat speichern, wenn es wirklich abweicht

Praktisches Verhalten:

- wenn nur `portrait` existiert, gilt es als Standard fuer diese Tabelle
- wenn `landscape` existiert, wird es nur im Landscape-Druckpfad geladen
- wenn `landscape` nicht existiert, faellt die Logik auf `portrait` oder das Repo-Standardlayout zurueck

---

## 10. Schutz vor fehlerhaften Layoutdaten

Damit fehlerhafte Layoutdaten die App nicht kaputt machen, braucht die Speicherung drei Schutzschichten:

1. Schema-/Feldvalidierung beim Speichern
2. Merge nur auf whitelisted Layoutfelder
3. sichere Rueckfallebene auf Standardlayout beim Laden

Zusatzregeln:

- unbekannte Felder ignorieren
- ungueltige Breitenwerte ablehnen oder auf Default setzen
- fehlende Orientierung immer als `portrait` behandeln
- fehlerhaftes JSON nie direkt rendern
- bei Validierungsfehlern kein teilweises Chaos in UI/PDF erzeugen

---

## 11. Spätere IPC-Endpunkte

Fuer die spaetere Editor-/Service-Anbindung sind voraussichtlich diese IPC-Endpunkte sinnvoll:

- `tableLayouts:getMany`
- `tableLayouts:getOne`
- `tableLayouts:save`
- `tableLayouts:reset`
- `tableLayouts:listTables`
- `tableLayouts:listScopes` oder `tableLayouts:listLayouts`

Moegliche Payload-Felder:

- `tableKey`
- `moduleId`
- `orientation`
- `scopeType`
- `scopeId`
- `layoutPatch`
- `schemaVersion`

Wichtig:

- diese IPCs sind nur fuer interne Werkzeuge gedacht
- normale Nutzer sollen keinen direkten Zugriff bekommen

---

## 12. Wo das Repository spaeter hinpasst

Empfohlene Platzierung:

- DB-Repository: `src/main/db/tableLayoutsRepo.js`
- DB-Schema-Anlage: in `src/main/db/database.js`
- IPC: eigenes `src/main/ipc/tableLayoutsIpc.js`
- spaeterer interner Renderer-Zugriff nur ueber freigegebene APIs

Das Repository sollte fachlich zwischen Standarddefinition und Editor/IPC stehen:

Standardlayout -> Repository -> Validierung/Merge -> Renderer oder PDF

---

## 13. Empfohlene naechste Umsetzungsphase

Die kleinste sinnvolle naechste Phase ist:

1. nur das Repo- und Schema-Konzept fuer `table_layouts` anlegen
2. nur `protokoll_tops` als Pilot vorbereiten
3. nur globale Overrides speichern
4. nur portrait als ersten Persistenzfall zulassen
5. erst danach landscape als gespeicherte Variante aktivieren

Diese Phase bleibt noch ohne Editor-UI.

---

## 14. Explizit keine normale Nutzerfunktion

Das spaetere Speichern von Tabellenlayouts ist eine interne Fachfunktion.

Es ist keine normale Nutzerfunktion und soll auch nicht so wirken.

Insbesondere:

- keine sichtbare Alltags-UI im Hauptworkflow
- kein freier Layout-Designer fuer normale Anwender
- keine schnelle Klick-Umschaltung in der Fachoberflaeche
- keine Vermischung mit Projektstammdaten oder allgemeinen Settings

---

## 15. Kurzempfehlung

Fuer den ersten technisch sauberen Schritt gilt:

- eigene Tabelle `table_layouts`
- globaler Standard als Basis
- layoutbezogene Overrides nur als Delta
- `portrait` und `landscape` getrennt speichern
- Fallback immer auf Repo-Standard
- normale Nutzer nicht einbeziehen

