# Lizenzverwaltung

## Projektauftrag

### Zielbild
Die Lizenzverwaltung wird ein eigenstaendiges Admin-/Mutter-App-Modul.
Sie ersetzt langfristig die lose Lizenzbearbeitung im bisherigen Bereich `Einstellungen / Entwicklung`.
Der neue Adminbereich wird schrittweise aufgebaut.
Die bestehende Entwicklung-UI bleibt nur Uebergang.
Die Lizenzverwaltung ist keine normale Nutzer-Einstellung, sondern verwaltet Kunden, Produktumfang, Lizenzdateien und Historie.
Sie darf nicht dauerhaft lose in `SettingsView` gerendert werden.

### Zielort
App:
`Einstellungen -> Adminbereich -> Lizenzverwaltung`

Code-Ziel:
`src/renderer/modules/lizenzverwaltung/`

### Kernfunktionen
- Kunden anlegen
- Kunden bearbeiten
- Kunden wiederfinden
- Lizenzen je Kunde verwalten
- bestehende Lizenz laden
- Produktumfang ändern
- Lizenz verlängern
- Lizenz neu ausgeben
- Lizenzhistorie anzeigen
- Lizenzdateien erzeugen

### Produktumfang
Standardumfang:
- `app`
- `pdf`
- `export`

Zusatzfunktionen:
- `mail`
- `Dictate`

Module:
- `Protokoll`
- `Dummy`

### Regeln
- Standardumfang ist immer enthalten.
- Zusatzfunktionen sind zuschaltbar.
- Module sind einzeln auswählbar.
- `Protokoll` ist aktuell das einzige echte Fachmodul.
- `Dummy` ist nur Struktur-/Testmodul.
- `Dictate` ersetzt fachlich die alte sichtbare Bezeichnung `audio`.
- `audio` darf intern nur aus Kompatibilitätsgründen weiter beachtet werden, falls alte Lizenzdaten das benötigen.
- `Diktieren` ist der Technik-/Entwicklungsbereich.
- `Whisper` ist die aktuelle Engine unter `Diktierprodukt`.
- `Wörterbuch` ist ein vorbereiteter Baustein.
- `Audio / Diktat` bleibt Maschinenraum.

### Abgrenzung
Nicht Teil dieses Moduls:
- Diktierfunktion bauen
- Whisper umbauen
- Wörterbuch implementieren
- Projekt-Arbeitsbereich ändern
- Protokoll-Modul ändern
- normale Nutzer-Settings ausbauen
- Sidebar-Entscheidung fuer Endnutzer treffen

### Migrationsweg
1. Adminbereich als geschuetzten Zielbereich dokumentieren.
2. Lizenzverwaltung als eigenes Renderer-Modul anlegen.
3. Bestehende Lizenzbearbeitung aus `SettingsView` schrittweise herausloesen.
4. Produktumfang in Standardumfang, Zusatzfunktionen und Module trennen.
5. Bestehende Lizenzdaten kompatibel uebernehmen.
6. Kunden-/Lizenzdatenmodell ergaenzen.
7. Historie erzeugter Lizenzdateien ergaenzen.
8. Erst danach App-seitige Freischaltungen auswerten.

### Erste Umsetzungspakete
- Paket 1: Adminbereich und Lizenzverwaltungs-Modul-Skeleton vorbereiten.
- Paket 2: Bestehendes Lizenz-bearbeiten-Popup optisch/fachlich in Produktumfang gliedern.
- Paket 3: Produktumfang intern als Standardumfang, Zusatzfunktionen und Module abbilden.
- Paket 4: Kunden- und Lizenzdatensatz vorbereiten.
- Paket 5: Bestehende Lizenz laden, aendern und neu ausgeben.
- Paket 6: Lizenzhistorie ergaenzen.

### Abnahmekriterien
- `SettingsView` ist nicht mehr fachlicher Besitzer der Lizenzverwaltung.
- Lizenzverwaltung hat ein eigenes Modulverzeichnis.
- Produktumfang ist nicht mehr eine flache Feature-Liste.
- Standardumfang, Zusatzfunktionen und Module sind getrennt.
- `Dictate` ist als Produktfeature sauber benannt.
- `Protokoll` und `Dummy` sind als Module getrennt von Zusatzfunktionen.
- Alte Lizenzdaten bleiben kompatibel.
- Keine Adminfunktion erscheint als Projektmodul.

## Speicher- und Datenkonzept

### Grundsatz
Kunden, Lizenzen und Historie sind Admin-/Mutter-App-Daten.
Die Lizenzdatei ist nur das exportierte Ergebnis für die jeweilige App.
Die Kind-App erhält später nur Lizenzstatus, Lizenzimport und Lizenzprüfung, nicht die vollständige Adminverwaltung.

### Kundendaten
Kunden dienen dazu, Lizenznehmer wiederzufinden und Lizenzen später zu erweitern, zu verlängern oder neu auszugeben.
Vorgesehene Felder:
- Kundennummer
- Firma / Kundenname
- Ansprechpartner
- E-Mail
- Telefon optional
- Notizen

### Lizenzdaten
Lizenzen hängen fachlich an Kunden.
Vorgesehene Felder:
- Lizenz-ID
- Kunde
- Produktumfang
- gültig von
- gültig bis
- Lizenzmodus: Soft-Lizenz / Vollversion
- Machine-ID optional
- Notizen

### Historie
Die Historie dokumentiert erzeugte oder neu ausgegebene Lizenzdateien.
Vorgesehene Felder:
- erzeugt am
- Lizenz-ID
- Kunde
- Produktumfang
- gültig bis
- Datei / Ausgabeort
- Notizen

### Lizenzdatei
Die Lizenzdatei enthält nur die Daten, die die Ziel-App zur Lizenzprüfung benötigt.
Sie ist nicht die Kundenverwaltung.
Sie ist nicht die Historie.
Sie ist nicht die vollständige Admin-Datenbank.

### Bestandsaufnahme vorhandene Speicherung
1. Gefundene bestehende Speicherwege
   - Hauptspeicherweg der App: lokale SQLite-Datenbank `app.db` unter `app.getPath("userData")` via `better-sqlite3`; darin liegen u. a. Projekte, Meetings, Tops, App-Settings, Projekt-Settings, Firmen/Personen, Audio- und Wörterbuchdaten.
   - Dateibasierte Speicherung ist vorhanden:
     - installierte Laufzeitlizenz als `license.json` unter `userData`
     - Import/Export- und Arbeitsdateien als JSON/ZIP/PDF in Dateisystempfaden (u. a. Downloads/Temp/Projektordner).
   - Renderer-seitig gibt es kleine `localStorage`-Nutzung für UI-Zustände/Fallbacks (z. B. UI-Modus, letztes Projekt, einzelne View-Settings).
   - Aktuelles Lizenzverwaltungs-Modul (`licenseStorageService.js`) ist nur In-Memory (Arrays im Prozess) und derzeit nicht dauerhaft.

2. Bewertung für Lizenzverwaltung
   - Für Kunden-/Lizenz-/Historien-Daten ist In-Memory ungeeignet (kein Neustart-Überleben, kein belastbarer Admin-Bestand).
   - `localStorage` ist für Admin-Fachdaten ungeeignet (Renderer-gebunden, nur für leichte UI-Zustände sinnvoll).
   - Reine Dateiablage (einzelne JSON-Dateien) ist für Exporte/Transfer gut, aber für relationale Admin-Verwaltung (Kunde ↔ Lizenzen ↔ Historie) fehleranfälliger als strukturierte Tabellen.
   - Der bestehende App-Speicherpfad über SQLite ist bereits produktiv etabliert und passt fachlich zum benötigten Datenmodell.

3. Empfehlung für den nächsten technischen Schritt
   - Als nächstes nur ein technisches Speicherkonzept festziehen (ohne Implementierung): Zielrichtung `app.db` mit klar getrennten Admin-Tabellen für Kunden, Lizenzen und Lizenzhistorie.
   - Parallel Datenabgrenzung dokumentieren: welche Felder nur Admin-intern sind und welche Felder später in exportierte Lizenzdateien dürfen.
   - Danach erst Migrations-/IPC-Schnitt planen (weiterhin noch ohne Persistenzbau in diesem Paket).

4. Abgrenzung Kind-App / Admin-App
   - Bleibt in der Admin-/Mutter-App: vollständige Kundenstammdaten, interne Notizen, Verlängerungs-/Neuausgabe-Historie, interne Bearbeitungsmetadaten.
   - Darf in die Kind-App: nur prüfrelevante Lizenzdaten (z. B. Lizenz-ID, Gültigkeit, freigegebener Umfang, ggf. Binding/Machine-ID) plus Status/Import/Prüfung.
   - Darf die Kind-App nicht mitbekommen: Kundenliste, Gesamt-Lizenzhistorie, interne Admin-Notizen, Daten anderer Kunden/Installationen.

### Technisches Speicherkonzept
- Zielrichtung: Die bestehende lokale `app.db` wird später genutzt.
- Trennung: Lizenzverwaltungsdaten liegen in eigenen Admin-Tabellen und werden nicht mit Projekt-/Meeting-/Protokolldaten vermischt.
- Mutter-/Kind-Prinzip: Die vollständige Adminverwaltung bleibt in der Mutter-App; die Kind-App erhält später nur prüfrelevante Lizenzdaten.
- Renderer-Schnittstelle: `licenseStorageService` bleibt die Renderer-Fassade.
- Persistenzpfad (später): Renderer -> IPC/Preload -> Main-Process-Service -> `app.db`.
- Kein Direktzugriff: Der Renderer schreibt später nicht direkt in die Datenbank.

#### Vorgeschlagene spätere Tabellen
- `license_customers`
- `license_records`
- `license_history`

#### Tabellenfelder (Zielbild, noch ohne Implementierung)
`license_customers`
- `id`
- `customer_number`
- `company_name`
- `contact_person`
- `email`
- `phone`
- `notes`
- `created_at`
- `updated_at`

`license_records`
- `id`
- `license_id`
- `customer_id`
- `product_scope_json`
- `valid_from`
- `valid_until`
- `license_mode`
- `machine_id`
- `notes`
- `created_at`
- `updated_at`

`license_history`
- `id`
- `license_record_id`
- `generated_at`
- `product_scope_json`
- `valid_until`
- `output_path`
- `notes`
- `created_at`

#### Datenabgrenzung
- `product_scope_json` bleibt zunächst ein JSON-Feld, da der Produktumfang aus Standardumfang, Zusatzfunktionen und Modulen besteht.
- `customer_id` und `license_record_id` sind die vorgesehenen späteren Verknüpfungen.
- Die Lizenzdatei bleibt Exportprodukt und ist nicht identisch mit den Admin-Tabellen.
- Die Kind-App erhält später nur prüfrelevante Lizenzdaten, keine Kundenliste und keine Historie.

#### Spätere Umsetzungsschritte (nach diesem Doku-Paket)
1. DB-Schema/Migration vorbereiten.
2. Main-Process-Service für Admin-Lizenzdaten ergänzen.
3. IPC/Preload-Schnitt ergänzen.
4. Renderer-`licenseStorageService` von In-Memory auf IPC umstellen.
5. Danach erst Masken wirklich dauerhaft speichern.

Kurzstand (Paket DB-Schema/Migration):
- Die Tabellen `license_customers`, `license_records` und `license_history` sind in `src/main/db/database.js` als nicht-destruktive Tabellenanlage vorbereitet.
- Main-Process-Service ist vorbereitet und per IPC angebunden (`src/main/licensing/licenseAdminService.js`, `src/main/ipc/licenseIpc.js`, `src/main/preload.js`).
- IPC-/Preload-Schnitt ist vorbereitet und angebunden; Renderer-`licenseStorageService` nutzt jetzt IPC/Preload, sodass Kunden, Lizenzen und Historie dauerhaft in `app.db` gespeichert werden.
- Lizenzen koennen jetzt einem gespeicherten Kunden zugeordnet werden (`customer_id` / `customerId`) und die Listenansicht zeigt Kundendaten lesbar an.

### Abgrenzung
Nicht Teil dieses Schritts:
- Kunden speichern
- Lizenzen speichern
- Historie speichern
- Lizenzdateien umbauen
- App-Sperrlogik
- Online-Aktivierung
- Preis-/Rechnungsverwaltung

Grenzen:
- Nur docs/modules/lizenzverwaltung.md ändern.
- Keine UI ändern.
- Kein Code.
- Keine Tests.
- ARCHITECTURE.md, PLAN.md und STATUS.md nicht aufblasen.
