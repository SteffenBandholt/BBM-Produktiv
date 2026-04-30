# STATUS.md — BBM-Produktiv

## Zweck
Diese Datei hält den tatsächlichen Fortschritt fest.

Sie ergänzt:
- `AGENTS.md` = Arbeitsregeln
- `PLAN.md` = Soll-Ablauf / Meilensteine

`STATUS.md` beschreibt den Ist-Stand:
- was bereits erledigt ist,
- woran zuletzt gearbeitet wurde,
- was als Nächstes dran ist,
- wo es Hindernisse gibt.

---

## Aktueller Gesamtstand

- Meilenstein externe Lizenz-App-Vorbereitung ist umgesetzt:
  - BBM registriert keine `license-admin:*`-IPCs mehr und startet keine Generator-/Customer-Setup-Registrierung aus `registerLicenseIpc`.
  - Preload exportiert keine Generator-/license-admin-Methoden mehr; aktive Kundenfunktionen (Status/Import/Delete/Request) bleiben.
  - Renderer zeigt keine Lizenzverwaltung/Kundenverwaltung mehr im Adminbereich; Entwicklerbereich bleibt unverändert erreichbar.
  - Uebergangsbereich `tools/license-app/` wurde angelegt inkl. Zielarchitektur-README und Extrakten (`licenseAdminService`, `licenseRecords`, `licenseIpc.reference`).
- Nächster offener Schritt: Extrakte in `tools/license-app/` später in eigenständige externe Lizenz-App überführen.
- Admin-Lizenzverwaltung kann die erzeugte Antwortlizenz jetzt direkt als Outlook-Entwurf vorbereiten:
  - Neuer Button `Antwortlizenz per Outlook senden` im Lizenzeditor.
  - Sichtbarkeit nur fuer Vollversion + vorhandenen `license_file_path` mit `.bbmlic`.
  - Main-IPC `license-admin:send-response-license-mail` prueft Kunden-E-Mail, Dateipfad, Dateiendung und Datei-Existenz.
  - Outlook-Entwurf wird unter Windows via PowerShell/COM erstellt (`Outlook.Application`, `CreateItem`, `Attachments.Add`, `Display()`), ohne automatisches Senden.
  - Erfolgs-/Fehlermeldungen sind umgesetzt: `Outlook-Mail wurde vorbereitet.`, `Keine Kunden-E-Mail hinterlegt.`, `Antwortlizenz-Datei wurde nicht gefunden.`, `Outlook konnte nicht geöffnet werden.`.
  - Fallback im UI bei Outlook-Fehler: `Ausgabeordner öffnen` und `Mailtext kopieren`.
- Nächster offener Schritt: manuelle Endpruefung am Windows-Zielsystem mit installiertem Outlook (Entwurf anzeigen inkl. Anhang, ohne Auto-Send).
- Admin-Lizenzverwaltung dokumentiert den Machine-Setup-Lebenszyklus jetzt direkt am Vollversions-Lizenzdatensatz:
  - `Machine-Setup erstellen` speichert vor dem Build zuerst einen Vollversionsdatensatz (`license_edition=full`, `license_binding=machine`, `license_mode=full`) im aktuellen Kundenkontext.
  - Wenn diese Vorab-Speicherung nicht moeglich ist, wird klar abgebrochen mit `Vollversion muss vor Machine-Setup gespeichert werden.`.
  - Nach erfolgreichem Machine-Setup-Build werden im Lizenzdatensatz gespeichert: `setup_type=machine`, `setup_status=waiting_for_machine_id`, `setup_file_path`, `setup_created_at`.
  - Nach Mailtext-Uebernahme wird `setup_status=machine_id_received` gespeichert.
  - Nach erfolgreicher Antwortlizenz-Erzeugung wird `setup_status=response_license_created` gespeichert; `license_file_path` bleibt wie bisher erhalten.
  - In UI/Lizenzliste und Lizenzeditor gibt es jetzt den sichtbaren `Machine-Binding-Status` mit den 4 Statusstufen.
- Nächster offener Schritt: manuelle Endpruefung des kompletten Ablaufes (Vollversion speichern -> Machine-Setup -> Mailtext -> Antwortlizenz) gegen eine reale lokale Mutter-Datenbank.
- Admin-Lizenzverwaltung kann Machine-ID direkt aus Kunden-E-Mailtext uebernehmen:
  - Neuer Vollversions-Button `Lizenzanforderung aus E-Mail übernehmen` im Lizenzformular.
  - Eingabebereich `Mailtext einfügen` parst robust die Zeilen `Kunde`, `Kundennummer`, `Lizenz-ID`, `Machine-ID`, `App-Version` (case-insensitive, tolerant bei Leerzeichen, CRLF/LF).
  - Bei Erfolg meldet die UI `Lizenzanforderung erkannt.` und `Machine-ID wurde übernommen.` und uebernimmt die Machine-ID in das Formular.
  - Bei Abweichung von Kundennummer oder Lizenz-ID erscheint die Warnung `Achtung: Die Lizenzanforderung passt möglicherweise nicht zur geöffneten Lizenz.` ohne Blockierung.
  - Wenn keine Machine-ID enthalten ist, erscheint `Keine Machine-ID im Mailtext gefunden.`.
  - Bestehender Ablauf bleibt unveraendert: Lizenz erstellen -> `.bbmlic` erzeugen -> Antwortlizenz zurueck an den Kunden.
- Nächster offener Schritt: manuelle Sichtpruefung im Adminbereich mit echtem Mailtext-Paste aus einer Kundenanfrage.
- Alter Machine-Setup-Lizenz-Startblock wurde entfernt:
  - `src/renderer/main.js` enthaelt keine `isMachineSetupWithoutLicense`-, `renderMachineSetupLicenseRequired`-, `renderMachineSetupLicenseFallback`- oder `MACHINE_SETUP_LICENSE`-Logik mehr.
  - Der Core startet wieder normal; Lizenzstatus, Lizenzanforderung und Lizenzimport gehoeren nicht mehr in den App-Start.
  - Regressionen in `scripts/tests/licenseRequest.test.cjs` und `scripts/tests/projektverwaltungModule.test.cjs` sichern ab, dass der alte Startblock nicht zurueckkommt.
  - `npm test` ist gruen.
- Lizenzverwaltung Loeschfunktion fuer Lizenzdatensaetze ist umgesetzt:
  - Im Lizenzformular gibt es den Button `Lizenz löschen`, sichtbar nur bei bestehender gespeicherter Lizenz.
  - Vor dem Loeschen erscheint die Sicherheitsabfrage mit Klartext, dass nur der Lizenzdatensatz in der Lizenzverwaltung entfernt wird.
  - Nach Bestaetigung wird nur `license_records` geloescht; danach Rueckkehr ins Kundendetail mit Meldung `Lizenz wurde gelöscht.`.
  - Bei Fehler erscheint `Lizenz konnte nicht gelöscht werden.`; bei Abbruch wird nichts geloescht.
  - Neuer Main-Service `deleteLicenseRecord(id)` + IPC `license-admin:delete-license-record` + Preload `licenseAdminDeleteLicenseRecord(id)` + Renderer-Service `deleteLicense(record)` sind verbunden.
  - Tests decken Main-Service-Loeschfall, fehlende ID, IPC-Registration/-Aufruf, Preload/API, Renderer-Service und UI-Texte ab; `npm test` bleibt gruen.
- PR #46 Bugfix (Testversion speichern ohne sichtbares Datumsfeld) ist umgesetzt:
  - Bei `Lizenztyp = Testversion` setzt `buildLicenseEditorPayload` `valid_from` jetzt automatisch auf das technische Ausstellungsdatum (`YYYY-MM-DD`), wenn das Feld leer ist.
  - `valid_until` bleibt bei Testversion leer; `trial_duration_days` bleibt der fachliche Laufzeitwert.
  - Dadurch tritt beim Speichern/Erstellen der Testlizenz kein `valid_from required` mehr auf, obwohl `gueltig von/bis` in der Test-UI weiterhin nicht als Nutzerpflicht gezeigt wird.
  - Der bestehende Testlaufzeit-Start bei erster Installation / erstem Start bleibt unveraendert.
- PR #46 Bugfix (Testversion ohne validUntil im gesamten Erzeugungsweg) ist umgesetzt:
  - Save-Payload erzwingt fuer Testversion intern `license_edition=test`, `license_binding=none`, `license_mode=soft`, `machine_id=""` und laesst `valid_until` leer.
  - Damit wird Testversion ohne `validUntil` durch Save -> Generator-Payload -> Main-IPC konsistent akzeptiert; Vollversion ohne `validUntil` bleibt weiterhin Fehlerfall.
- PR #46 Bugfix (Generator-Input fuer Testversion ohne validUntil-Feld) ist umgesetzt:
  - Main-IPC `license:generate` schreibt fuer Testversion `validUntil` nicht mehr in die Input-JSON an den Generator.
  - Die alte Hilfslogik zur Ableitung `validUntil` aus `validFrom + Dauer` wurde entfernt; kein Rueckfall auf das Altmodell.
- PR #46 Hinweis externer Generator ist dokumentiert:
  - Der produktive Generator liegt extern unter `C:\\license-tool\\generate-license.cjs` und hat keine gepflegte Repo-Quelle in diesem Projekt.
  - Falls der externe Generator weiter `validUntil` fuer Testversion erzwingt, liefert die App jetzt klar den Hinweis: `Externer Lizenzgenerator ist nicht kompatibel mit Testversion ohne validUntil.`
  - In diesem Fall muss `C:\\license-tool\\generate-license.cjs` manuell kompatibel angepasst werden (Testversion ohne `validUntil`, mit Pflicht `trialDurationDays`).
- Lizenzverwaltung Nachsteuerung fuer PR #46 ist umgesetzt:
  - Lizenzformular fuehrt jetzt zwei fachlich getrennte Wege ueber `Lizenztyp`: `Testversion` und `Vollversion`.
  - `Testversion` bleibt ohne Machine-ID, zeigt Testdauer, nutzt weiter `Lizenz erstellen` + `Kunden-Setup erstellen` mit eingebetteter fertiger `customer.bbmlic`.
  - `Vollversion` ist fest an Machine-Binding gekoppelt, blendet den freien Binding-Mix aus und fuehrt in den Schritten `Machine-Setup erstellen` -> `Lizenzanforderung importieren` -> `Antwortlizenz erstellen`.
  - `Machine-Setup erstellen` baut bewusst ohne eingebettete `customer.bbmlic`; die Antwortlizenz wird weiterhin erst nach Import der Machine-ID ueber `Lizenz erstellen` erzeugt.
  - Dist-/IPC-Flow wurde minimal erweitert, damit Kunden-Setups wahlweise mit (Testversion) oder ohne (Machine-Setup) eingebettete Lizenz gebaut werden koennen.
  - Testabdeckung wurde fuer UI-Trennung, Payload-/Setup-Typ und Build-Embedding (mit/ohne `customer.bbmlic`) erweitert; `npm test` bleibt Pflicht.
- Machine-Binding Schritt 3 (Antwortlizenz-UI-Fuehrung) ist umgesetzt:
  - Admin-Lizenzformular zeigt bei `Gerätebindung = An Machine-ID binden` den Hinweis `Gerätegebundene Vollversion` mit klarer Schrittfuehrung (Import Lizenzanforderung -> `Lizenz erstellen` -> Antwortlizenz).
  - Nach erfolgreichem `Lizenz erstellen` wird bei Vollversion + Machine-Binding + vorhandener Machine-ID zusaetzlich angezeigt: `Antwortlizenz wurde erstellt.` sowie `Diese .bbmlic-Datei an den Kunden zurückgeben.`.
  - Ausgabepfadanzeige und Button `Ausgabeordner öffnen` bleiben unveraendert im bestehenden Generator-Hauptablauf.
  - Kunden-Lizenzstatusbereich ergaenzt den Hinweis `Antwortlizenz erhalten?` mit Verweis auf den bestehenden Lizenzimport; kein neuer Import-Mechanismus, keine neue Navigation.
  - Tests wurden auf die neuen UI-Texte erweitert; bestehende Flows (`licenseGenerate`, Lizenzimport) bleiben unveraendert und `npm test` bleibt Pflichtpruefung.
- Machine-Binding Schritt 2 (Admin-Import) ist umgesetzt:
  - Admin-Lizenzformular hat den Button `Lizenzanforderung importieren` (nur im Lizenzformular, keine Kundenliste/Projektbereich).
  - Neuer Main-IPC `license-admin:import-license-request` oeffnet Datei-Dialog, liest JSON, validiert (`schemaVersion`, `requestType`, `product`, `machineId`, `createdAt`, `appVersion`) und liefert strukturierte Request-Daten.
  - Preload stellt `window.bbmDb.licenseAdminImportLicenseRequest()` bereit.
  - Nach erfolgreichem Import werden im Formular `Machine-ID`, `Gerätebindung=machine` und `Lizenzart=full` gesetzt; es erfolgt **kein** automatisches Speichern.
  - UI zeigt klare Erfolg-/Fehlerhinweise inkl. Produktfehler, fehlender Machine-ID sowie optional `customerName`/`licenseId`.
  - Bestehender Generatorfluss bleibt bestehen und nutzt danach weiterhin den bestehenden Ablauf `Lizenz erstellen`.
  - Keine Aenderung an `licenseVerifier.js EXPECTED_PRODUCT`, keine Setup-/Mail-/Online-Aktivierungs-Erweiterung.
  - Testabdeckung fuer Import-IPC, Preload und UI-Texte wurde erweitert; `npm test` bleibt Pflichtpruefung.
- Neuer Machine-Binding-Baustein ist umgesetzt:
  - Kunden-App kann jetzt eine Lizenzanforderungsdatei `bbm-license-request.json` speichern (nur Anfrage, keine Lizenz-/Signatur-Erzeugung).
  - Main-IPC `license:create-request` baut ein strukturiertes Request-JSON mit `schemaVersion`, `requestType`, `product`, `appVersion`, `createdAt`, `machineId` sowie optional `customerName`/`licenseId`/`notes`.
  - Machine-ID wird weiter ueber die bestehende `deviceIdentity`-Funktion geholt; Produkt bleibt fest `bbm-protokoll`.
  - Save-Dialog nutzt jetzt den vorgeschlagenen Dateinamen `bbm-license-request.json`.
  - Lizenzstatus-UI zeigt den Einstieg `Lizenzanforderung` mit Button `Lizenzanforderung speichern` und klaren Erfolgs-/Fehlermeldungen.
  - Keine Admin-Import-/Antwortlizenz-/Mail-/Setup-Aenderungen und keine Aenderung an `EXPECTED_PRODUCT`.
  - Tests fuer Payload, IPC, Preload, UI-Texte und Abgrenzungen wurden ergaenzt; `npm test` ist gruen.
- Lizenzverwaltung PR #41 Nachbesserung (Testlizenz-Startzeitpunkt) ist umgesetzt:
  - Testlizenzen tragen jetzt `trialDurationDays` signiert im Generator-Payload; der Testzeitraum startet erst bei erster erfolgreicher Lizenzinstallation/-nutzung.
  - Laufzeitpruefung fuer Testlizenzen nutzt `trialStartedAt + trialDurationDays` statt `valid_from + Dauer`; Vollversion bleibt bei `validUntil`.
  - Admin-UI zeigt fuer Testlizenz den Bereich `Testzeitraum` (14/30/60/90/Individuell, 1..365) inkl. Hinweis auf Start bei erster Installation/erstem Start; `gueltig von/bis` wird fuer Test nicht mehr als fachlicher Start/Ende dargestellt.
  - Formularlayout im Lizenzeditor wurde auf klare Feld-zu-Beschriftung-Blocks umgebaut; bei Testlizenz ist `Machine-ID` ausgeblendet.
  - Alte Entwicklungs-Parallel-Logik fuer Nutzungstage (`trial.enabled`, `trial.daysLimit`, `trial.firstStartAt`, `enforceTrialLimit`) ist aus UI/Runtime entfernt.
  - Lizenz-Admin-Datenmodell wurde minimal um `trial_duration_days` erweitert; Kunden-Setup-Fluss blieb unveraendert.
  - Testabdeckung erweitert (Generator-/Verifier-/Storage-/UI/IPC-Faelle); `npm test` ist gruen.
- Die Projektverwaltung ist als Renderer-Modul abgeschlossen.
- Ausgabe / Drucken / E-Mail ist als Renderer-Modul aufgestellt.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Drucktechnik bleibt im Main-Prozess.
- Audio / Diktat ist als Renderer-Modul begonnen.
  - `Dictate` ist das zugehoerige Lizenz-/Produktfeature; das sichtbare Feature `audio` wird fachlich als `Dictate` gefuehrt.
  - `Diktieren` ist der Entwicklungs-/Technikbereich unter `Einstellungen -> Entwicklung`.
  - `Diktierprodukt` ist die austauschbare fachliche Einheit unter `Diktieren`.
  - `Whisper` ist aktuell nur die technische Engine unter dem `Diktierprodukt`.
  - `Woerterbuch` ist ein vorbereiteter Baustein innerhalb von `Diktieren`.
  - `TranscriptionService` ist als Renderer-Adapter verankert.
  - Entwicklungs-UI fuer `Einstellungen -> Entwicklung -> Diktieren` ist als Modul-Baustein angebunden.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverändert.
- Im Bereich `Lizenz / bearbeiten` wird das Feature `audio` sichtbar als `Dictate` angezeigt.
  - `Audio / Diktat` bleibt Maschinenraum und ist kein auswählbares Projektmodul.
  - Der interne Key bleibt `audio`.
  - Die sichtbare Feature-Liste zeigt kein `audio` und `Dictate` nebeneinander.
- Im Bereich `Lizenz / bearbeiten` ist `Produktumfang` jetzt sichtbar gegliedert:
  - `Standardumfang` (app, pdf, export) ist immer enthalten und nicht abwaehlbar.
  - `Zusatzfunktionen` (mail, Dictate) bleiben auswaehlbar.
  - `Module` (Protokoll, Dummy) sind als vorbereitet markiert und noch nicht aktiv angebunden.
- Lizenzverwaltung ist als eigenes Zielmodul geplant; die Detailbeschreibung liegt unter `docs/modules/lizenzverwaltung.md`.
  - Dort ist jetzt auch der geplante Machine-Binding-Ablauf fuer Vollversionen mit Machine-ID verbindlich beschrieben.
  - Lizenzart (`Testlizenz` / `Vollversion`) und Gerätebindung (`Ohne Gerätebindung` / `An Machine-ID gebunden`) sind dort fachlich getrennt festgehalten.
- Lizenzverwaltung Paket 1 ist vorbereitet:
  - neues Modulverzeichnis `src/renderer/modules/lizenzverwaltung/` mit Skeleton-Screen
  - Einstieg `Adminbereich` als eigene Kachel auf oberster Ebene in `Einstellungen` angebunden
  - `Adminbereich` oeffnet als eigenes Popup mit Kachel `Lizenzverwaltung`
  - weiterhin kein Modulkatalog-/Projektmodul-Eintrag
- Lizenzverwaltung Paket 4 ist umgesetzt:
  - die bisherige UI `Lizenz verlaengern / bearbeiten` wurde aus `SettingsView` in das Modul `src/renderer/modules/lizenzverwaltung/` verschoben
  - `LicenseAdminScreen` enthaelt jetzt den Einstieg `Lizenz erstellen / bearbeiten`
  - der Einstieg oeffnet die verschobene UI im Adminbereich
  - `SettingsView` bleibt Host/Einstieg und zeigt keinen sichtbaren Entwicklungs-Tab `Lizenz / bearbeiten`

- Lizenzverwaltung Paket 4 (Datensatz-Vorbereitung) ist umgesetzt:
  - zentrale Datei `licenseRecords.js` fuer Kunden- und Lizenzdatensatz vorbereitet
  - Feldlisten, Default-Strukturen und Normalisierungsfunktionen fuer Kunde/Lizenz vorhanden
  - `LicenseAdminScreen` zeigt die Bereiche `Kunden` und `Lizenzen` mit aussagekraeftigeren vorbereiteten Feldhinweisen
  - bestehende Lizenz-erstellen-/bearbeiten-UI und Produktumfangsstruktur bleiben unveraendert nutzbar
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Kunden` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Kundenmaske
  - Kundenmaske nutzt `CUSTOMER_RECORD_FIELDS` und bietet die Felder Kundennummer, Firma/Kundenname, Ansprechpartner, E-Mail, Telefon, Notizen
  - Kundenmaske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Kundenmaske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Lizenzen` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Lizenzen-Maske
  - Lizenzen-Maske nutzt `LICENSE_RECORD_FIELDS` und `LICENSE_MODES` und bietet die Felder Lizenz-ID, Kunde, Produktumfang, gueltig von, gueltig bis, Lizenzmodus, Machine-ID, Notizen
  - Lizenzen-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Lizenzen-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Produktumfang` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Produktumfang-Maske
  - Produktumfang-Maske nutzt `PRODUCT_SCOPE` und zeigt `Standardumfang` (app, pdf, export), `Zusatzfunktionen` (mail, Dictate) und `Module` (Protokoll, Dummy)
  - `Standardumfang` bleibt sichtbar und nicht abwaehlbar; `Zusatzfunktionen` sind auswählbar; `Module` bleiben vorbereitet und noch nicht aktiv angebunden
  - Produktumfang-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal auf app/pdf/export ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Produktumfang-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Historie` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Historie-Maske
  - Historie-Maske nutzt `LICENSE_HISTORY_FIELDS` und zeigt `erzeugt am`, `Lizenz-ID`, `Kunde`, `Produktumfang`, `gueltig bis`, `Datei / Ausgabeort`, `Notizen`
  - Historie-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Historie-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - zentrale Storage-Service-Schnittstelle `licenseStorageService.js` im Modul angelegt (In-Memory-Stub, async, ohne DB/IPC/Persistenz)
  - Service nutzt `normalizeCustomerRecord`, `normalizeLicenseRecord` und `normalizeLicenseHistoryRecord` aus `licenseRecords.js`
  - Export im Modul-Index ergaenzt; Tests decken Export, initiale Listen, Speichern mit Normalisierung und Promise-Kompatibilitaet ab
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - vorbereitete Masken `Kunden`, `Lizenzen` und `Historie` enthalten zusaetzlich den Button `Merken`
  - `Merken` validiert lokal und ruft danach den In-Memory-Storage-Service auf (`saveCustomer`, `saveLicense`, `addHistoryEntry`)
  - Erfolgsmeldung in allen drei Masken: nur temporaer/In-Memory gemerkt, keine dauerhafte Speicherung
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kunden-, Lizenzen- und Historie-Maske zeigen unterhalb der Buttons einfache In-Memory-Listenansichten
  - Listen werden ueber `listCustomers`, `listLicenses` und `listHistory` geladen
  - Nach erfolgreichem `Merken` wird die jeweilige Liste sofort aktualisiert (ohne Persistenz, nur im laufenden App-Prozess)
  - Leerer Zustand ist in allen drei Masken sichtbar
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - DB-Schema/Migration in `src/main/db/database.js` um getrennte Admin-Tabellen `license_customers`, `license_records`, `license_history` erweitert (nicht-destruktiv, ohne UI-/IPC-Umstellung)
  - `licenseStorageService` bleibt bewusst In-Memory; keine Lizenzdatei-Logik und kein Projektmodul-Verhalten geändert
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Main-Process-Service `src/main/licensing/licenseAdminService.js` fuer Admin-Lizenzdaten vorbereitet (list/save fuer Kunden und Lizenzen, Historien-Read/Write)
  - noch keine IPC-/Preload-Anbindung; Renderer-Storage bleibt In-Memory
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - IPC-/Preload-Schnitt fuer Admin-Lizenzdaten ist vorbereitet (`license-admin:*` + `licenseAdmin*` im Preload)
  - Renderer-`licenseStorageService` nutzt jetzt die Preload-/IPC-Schnitt (`window.bbmDb.licenseAdmin*`) statt In-Memory
  - Kunden, Lizenzen und Historie werden dadurch dauerhaft in `app.db` gespeichert; UI blieb minimal angepasst
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Lizenzen-Maske laedt gespeicherte Kunden per `listCustomers()` als Auswahlfeld und speichert Lizenzen mit `customer_id/customerId`-Verknuepfung.
  - Gespeicherte Lizenzen zeigen Kundennummer/Firma lesbar an; ohne vorhandene Kunden blockiert die Maske das erfolgreiche Speichern mit Hinweis.
  - Leere Lizenz-ID wird in der Lizenzen-Maske beim Pruefen/Merken automatisch als lesbare `LIC-YYYYMMDD-HHMMSS`-ID erzeugt.
  - Die erzeugte Lizenz-ID wird sichtbar ins Feld uebernommen; manuelle IDs bleiben weiterhin bearbeitbar.

- Lizenzverwaltung Neuversuch (In-Memory-Listenansichten) ist nachgezogen:
  - Testnachweise in `scripts/tests/lizenzverwaltungModule.test.cjs` fuer Kunden/Lizenzen/Historie um Listenfelder und Refresh nach `Merken` ergaenzt
  - Leerer Zustand und Adminbereich-Abgrenzung bleiben weiterhin abgesichert
- Lizenzverwaltung Meilenstein kundenbezogen ist umgesetzt:
  - Startansicht der Lizenzverwaltung ist jetzt die Kundenliste mit Kundennummer, Firma/Kundenname, Ansprechpartner und E-Mail.
  - Kundendetail fuehrt kundenbezogen zu den Lizenzen dieses Kunden, inkl. `Neue Lizenz`, `Kunde speichern`, `Zurueck zur Kundenliste`.
  - Lizenzanlage/-bearbeitung laeuft nur aus geoeffnetem Kundenkontext, zeigt den Kunden sichtbar und hat `Zurueck zum Kunden`.
  - Main-Service ergaenzt `listLicensesByCustomer(customer_id)` sowie Pflichtfeld-Checks inkl. automatischer Lizenz-ID `LIC-YYYYMMDD-HHMMSS`.
  - DB-Schema-Absicherung fuer bestehende `license_records` wurde nicht-destruktiv um fehlende Spalten-Ergaenzung erweitert.
  - Renderer-/IPC-/Preload-Datenfluss ist kundenbezogen erweitert (`license-admin:list-records-by-customer`).
  - Verhaltenstests decken Kunde speichern/listen, kundenbezogenes Lizenzspeichern/listen, Pflichtfelder und Kundenkontextlogik ab.
- Lizenzverwaltung UI-Aufraeumen (kundenbezogen) ist umgesetzt:
  - Kundenansicht zeigt jetzt `Lizenzverwaltung` + Bereich `Kunden` mit klarer Tabelle und Buttons `Neuer Kunde` / `Zurueck zum Adminbereich`.
  - Kundendetail ist als ausgerichtetes Formular umgesetzt, inkl. klarer Button-Fuehrung und sichtbarem Hinweisbereich.
  - Lizenzliste je Kunde ist als Tabelle mit Spalten fuer Lizenz-ID, Produktumfang, gueltig von/bis und Lizenzmodus dargestellt.
  - Produktumfang in der Liste zeigt kein rohes JSON mehr bei parsebaren Objekten; `{ raw: ... }` wird als Klartext, leere Arrays als `-`, gefuellte Bereiche als Kurzformat angezeigt.
  - Lizenzformular zeigt `Neue Lizenz fuer: ...`, Produktumfang als mehrzeiliges Feld, Lizenzmodus als Auswahl (`soft`/`full`) und den neuen Button `Lizenz-ID erzeugen`.
  - `Lizenz-ID erzeugen` schreibt nur bei leerem Feld sofort eine `LIC-YYYYMMDD-HHMMSS`-ID ins Feld; gesetzte IDs werden nicht ueberschrieben.
  - Bestehende Speicherlogik (Auto-ID beim Speichern, Kundenkontext-Pflicht, DB-/IPC-Fluss) bleibt unveraendert.
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Im Lizenzformular gibt es den Button `Lizenzdatei erzeugen`.
  - Erzeugung ist ohne gespeicherte Lizenz blockiert (`Bitte zuerst die Lizenz speichern.`).
  - Gespeicherte Lizenz + aktueller Kunde werden auf bestehendes `window.bbmDb.licenseGenerate(...)` gemappt.
  - Generator-Produkt bleibt technisch `bbm-protokoll` (UI bleibt `BBM-Produktiv`).
  - `license_mode` wird kompatibel gemappt (`soft -> none`, `full -> machine`, `none/machine` bleiben erhalten).
  - Features werden aus `product_scope_json` fuer Generator aufgebaut (inkl. `audio`-Kompatibilitaet als `dictate`).
  - Ohne ableitbare Features wird Erzeugung blockiert (`Produktumfang enthält keine erzeugbaren Features.`).
  - Bei Erfolg wird der Ausgabepfad angezeigt und `Ausgabeordner öffnen` nutzt bestehendes `window.bbmDb.licenseOpenOutputDir(...)`.
  - Bestehende Main-IPC-Infrastruktur (`license:generate`, `license:open-output-dir`) wurde weiterverwendet, keine neue Generator-Architektur.
- Lizenzverwaltung Nachbesserung ist umgesetzt:
  - Lizenzformular trennt jetzt fachlich `Lizenzart` (Testlizenz/Vollversion) und `Gerätebindung` (none/machine); `Lizenzmodus` ist nicht mehr das führende Bedienfeld.
  - Datumsfelder im Admin-Lizenzformular laufen als Date-Inputs; Generator-Payload normalisiert zusaetzlich ISO- und deutsche Eingaben (`TT.MM.JJJJ` -> `JJJJ-MM-TT`), um `VALID_FROM_REQUIRED` zu vermeiden.
  - Bei `Gerätebindung = machine` wird `Machine-ID` vor `licenseGenerate` verpflichtend geprüft; bei `none` bleibt Machine-ID optional und wird nicht übergeben.
  - Kompatibilität fuer Altwerte in `license_mode` bleibt erhalten (`soft/full/none/machine` -> sinnvolle Edition/Binding-Ableitung), neue Felder `license_edition`/`license_binding` haben Vorrang.
  - DB-Schema `license_records` wurde nicht-destruktiv um optionale Spalten `license_edition` und `license_binding` ergänzt.
  - Main-Service und Renderer-Normalisierung akzeptieren/liefern snake_case + camelCase für Edition/Binding.
- Lizenzverwaltung UI-Nachbesserung ist umgesetzt:
  - Nach `Kunde speichern` ist `Neue Lizenz` sofort aktiv; kein Zurueck-/Neuoeffnen noetig.
  - Im Lizenzformular wurden Buttontexte vereinheitlicht: `Lizenz speichern`, `Formular leeren`, `Zurueck`.
  - Kundendetail ist klarer getrennt in `Kundendaten` und `Lizenzen dieses Kunden`.
  - Die Lizenzliste je Kunde ist als saubere Tabelle mit Spalten fuer Lizenz-ID, Lizenzart, Gerätebindung, Produktumfang, gueltig von/bis und Aktion aufgebaut.
  - Bearbeiten erfolgt ueber sichtbaren Button `Öffnen` in der Aktion-Spalte statt ueber unsichtbaren Zeilenklick.
- Lizenzverwaltung Abschluss fuer PR #39 ist umgesetzt:
  - Im Lizenzformular gibt es jetzt den kombinierten Hauptbutton `Lizenz erstellen`.
  - Der Ablauf dahinter ist: Admin-Lizenz speichern -> vorhandenen Generator aufrufen -> Ausgabepfad anzeigen -> Ausgabeordner öffnen.
  - Es gibt keinen separaten Bedienpfad mehr mit erst `Lizenz speichern` und danach `Lizenzdatei erzeugen`.
- Lizenzverwaltung finale UI-Vereinfachung ist umgesetzt:
  - Im sichtbaren Lizenzformular wurden restliche Einzelbuttons entfernt (`Lizenz-ID erzeugen`, `Formular leeren`).
  - Lizenz-ID bleibt sichtbar, wird aber beim Hauptablauf `Lizenz erstellen` automatisch erzeugt, wenn leer.
  - Sichtbarer Hauptablauf im Formular ist jetzt auf `Lizenz erstellen` + `Zurueck` reduziert; `Ausgabeordner öffnen` erscheint nur nach erfolgreicher Erzeugung.
- Lizenzverwaltung naechster Schritt (Kunden-Setup) ist umgesetzt:
  - Nach erfolgreicher Lizenzerzeugung wird der Lizenzpfad im Lizenzdatensatz gespeichert (`license_file_path`, `license_file_created_at`).
  - Im Lizenzformular ist `Kunden-Setup erstellen` verfuegbar; ohne bekannte erzeugte Lizenzdatei erscheint `Bitte zuerst die Lizenz erstellen.`.
  - Kunden-Setup-Build nutzt bestehende `scripts/dist.cjs`/electron-builder-Infrastruktur im optionalen Kundenmodus (kein neuer Installer-Generator).
  - Kundenmodus uebergibt `.bbmlic` als `extraResource` nach `license/customer.bbmlic`, baut nach `dist/customers/<slug>/` und setzt kundenbezogenen Setup-Dateinamen.
  - Main-/Preload-IPC fuer Build-Aufruf ist angebunden (`license-admin:create-customer-setup` / `licenseAdminCreateCustomerSetup`).
  - Lizenz-Bootstrap liest bei fehlender `userData/license.json` eine gebuendelte `resources/license/customer.bbmlic` und uebernimmt sie als installierte Lizenz; bestehende `userData/license.json` bleibt vorrangig.
  - `licenseVerifier.js` Produktpruefung bleibt unveraendert.
- Lizenzverwaltung Kunden-Setup-Nachbesserung ist umgesetzt:
  - Erfolgsmeldung fuer `Kunden-Setup wurde erstellt.` wird nur noch gesetzt, wenn ein echtes Setup-Artefakt im Kunden-Ausgabeordner gefunden wurde.
  - Fehlt Kunden-Ausgabeordner oder Setup-`.exe`, liefert der Main-Flow `CUSTOMER_SETUP_ARTIFACT_NOT_FOUND` statt false-positive Erfolg.
  - Build-Diagnose wird mitgegeben (`repoRoot`, `outputDir`, `customerSlug`, `licenseFilePath`, `exitCode`, `stdout`, `stderr`) und im UI bei Fehlern sichtbar gemacht.
- Lizenzverwaltung Kunden-Setup-Stabilisierung ist umgesetzt:
  - Build startet nicht mehr blind mit `process.execPath`, sondern ueber aufgeloeste Node-Laufzeit (`npm_node_execpath` -> `NODE_EXE` -> `node`).
  - Kunden-Setup-Build hat Timeout-Schutz; bei Hänger wird mit `CUSTOMER_SETUP_BUILD_TIMEOUT` sauber beendet.
  - Spawn-Fehler liefern `CUSTOMER_SETUP_BUILD_FAILED`; der IPC antwortet damit immer mit einem Abschlussstatus statt offenem Hänger.
  - Pro Buildlauf wird eine Logdatei unter `dist/customers/<slug>/customer-setup-build.log` geschrieben (inkl. Node-Befehl, Env, stdout/stderr, Exitcode, Artefakte).
  - Kundenmodus-Builderkonfiguration deaktiviert native Rebuilds (`npmRebuild: false`, `buildDependenciesFromSource: false`), um `better-sqlite3`-Locking in der laufenden App zu vermeiden.
- Protokoll-Modul ist eingefroren.
- `npm test` war gruen.
- GitHub Action `.github/workflows/npm-test.yml` ist eingerichtet und fuehrt `npm test` auf `main` sowie `modularisierung/projektverwaltung` bei Push/Pull-Request aus.
- App-Sichtung fuer den Projekt-Arbeitsbereich wurde durchgefuehrt und passt (Projektklick -> Arbeitsbereich, Modulauswahl unveraendert auf `Protokoll`).
- Repo ist auf GitHub aktualisiert.
- `AGENTS.md` und `PLAN.md` sind vorhanden.
- Codex Cloud ist eingerichtet und kann das Repo lesen.
- Das Mutter-/Kind-Prinzip ist als verbindliche Leitlinie fuer die gesamte App festgehalten.
- Der erste CSS-Schritt im Modul `Protokoll` wurde umgesetzt.
- Der Speichern-/Löschen-Vertrag im Tops-Bereich wurde zwischen Verhalten und Tests synchronisiert.

## Architektur-Flag
- Die gesamte App folgt dem Mutter-/Kind-Prinzip.
- Diese Codebasis ist die Mutter-App / Bauzentrale.
- Spaetere Kinder-Apps sind freigegebene Produktvarianten mit eingegrenztem Modul- und Funktionsumfang.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps pruefen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Kinder-Apps werden nicht zur Verwaltungszentrale fuer andere Kunden oder Varianten ausgebaut.
- Nicht jedes Modul ist ein auswählbares Projektmodul; Maschinenraum-Dienste und Verwaltungsbereiche bleiben getrennt.
- Aktuell auswählbares Projektmodul ist `Protokoll`; `Restarbeiten` kann spaeter als Projektmodul hinzukommen.
- `Ausgabe / Drucken / E-Mail` und `Audio / Diktat` sind Maschinenraum-Dienste, keine Projektmodule.
- `Lizenzierung`, `Settings`, `Updates`, `Backup` und `Diagnose` sind Verwaltung oder Maschinenraum, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext und oeffnet den Projekt-Arbeitsbereich.
- Ein Projektklick startet nicht direkt `Protokoll`.
- Im Projekt-Arbeitsbereich werden nur auswählbare Projektmodule angeboten.
- Das Protokoll-Modul ist aktuell eingefroren.
- Keine weitere Mini-Modularisierung ohne ausdruecklichen Auftrag.
- `TopsHeader` und `TopsList` wurden heimgeholt.
- `TopsWorkbench`, `TopsViewDialogs`, Router, Commands, CloseFlow, Repository, Store und Selectors nicht anfassen.
- Weitere Änderungen nur bei echtem Fehler oder konkretem Featurebedarf.

## Projektverwaltung
- Der erste Modul-Meilenstein ist abgeschlossen.
- Die Projektverwaltung ist als Renderer-Modul unter `src/renderer/modules/projektverwaltung` aufgestellt.
- Der bestehende Sidebar-Einstieg `Projekte` bleibt der einzige sichtbare Einstieg.
- Es gibt keinen zusätzlichen Sidebar-Button `Projektverwaltung`.
- Der Router nutzt den Modulpfad.
- Die alten View-Dateien bleiben als Compatibility-Re-Exports bestehen.
- Keine DB-/IPC-Logik wurde verschoben.
- `npm test` war gruen.
- GitHub Action `.github/workflows/npm-test.yml` ist eingerichtet und fuehrt `npm test` auf `main` sowie `modularisierung/projektverwaltung` bei Push/Pull-Request aus.
- App-Sichtung fuer den Projekt-Arbeitsbereich wurde durchgefuehrt und passt (Projektklick -> Arbeitsbereich, Modulauswahl unveraendert auf `Protokoll`).

## Ausgabe
- Das Renderer-Modul ist aufgestellt.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Drucktechnik bleibt im Main-Prozess.

## Audio
- Das Renderer-Modul ist begonnen.
- `TranscriptionService` ist als Renderer-Adapter im Modul verankert.
- Die Entwicklungs-UI fuer den Bereich `Diktieren` wurde in das Audio-Modul ausgegliedert und in Settings eingehaengt.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverändert.

---

## Erledigte Meilensteine / Pakete

### Erledigt
#### Paket: PR #39 final - sichtbare Einzelbuttons im Lizenzformular entfernt
- Status: erledigt
- Beschreibung:
  - Entfernt: `Lizenz-ID erzeugen` (Button) und `Formular leeren` (Button) aus dem sichtbaren Lizenzformular.
  - Hinweistext bei Lizenz-ID auf automatischen Erstell-Ablauf angepasst.
  - Tests auf reduzierte sichtbare Bedienung aktualisiert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Generator-/Setup-/Persistenz-/Sidebar-/Projektmodul-Aenderung

#### Paket: PR #39 Abschluss - kombinierter Button `Lizenz erstellen`
- Status: erledigt
- Beschreibung:
  - Lizenzformular auf einen klaren Hauptablauf mit einem Button `Lizenz erstellen` umgestellt.
  - Klick speichert zuerst den Lizenzdatensatz und erzeugt danach direkt die `.bbmlic` über die bestehende Generator-Infrastruktur.
  - Ausgabepfad bleibt sichtbar; `Ausgabeordner öffnen` bleibt verfügbar.
  - Tests auf neue UI-Begriffe/Bedienlogik aktualisiert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Kein neuer Generator-IPC, keine Setup-/Sidebar-/Projektmodul-/Persistenzarchitektur-Aenderung

#### Paket: PR #39 UI-Feinschliff Kundendetail/Lizenzformular
- Status: erledigt
- Beschreibung:
  - Kundendetail-Screen so angepasst, dass `Neue Lizenz` nach erfolgreichem Kundenspeichern sofort nutzbar bleibt.
  - Lizenzformular-Buttons sprachlich auf klare Begriffe umgestellt (`Lizenz speichern`, `Formular leeren`, `Zurueck`).
  - Lizenzliste je Kunde optisch/strukturell bereinigt (eigene Aktion-Spalte mit `Öffnen`; kein gesamter Zeilenklick).
  - Tests auf neue Begriffe/Struktur und Direktnutzbarkeit nach Kundenspeichern erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Generator-/Setup-/Sidebar-/Projektmodul-Aenderung in diesem UI-Nachschritt

#### Paket: PR #39 Nachbesserung - Lizenzart/Geraetebindung getrennt und Datumsnormalisierung
- Status: erledigt
- Beschreibung:
  - `LicenseAdminScreen` trennt nun `Lizenzart` und `Gerätebindung` im Formular, inklusive Machine-ID-Enable/Disable je Binding.
  - Generator-Payload nutzt jetzt Edition/Binding aus neuen Feldern (mit Legacy-Fallback), normalisiert Datumswerte und validiert Machine-ID/Data vor dem IPC-Aufruf.
  - DB-Schema und Main-Service wurden fuer optionale Felder `license_edition`/`license_binding` erweitert (nicht-destruktiv, keine neue Tabelle).
  - Normalisierer/Tests wurden auf Kompatibilität von legacy `license_mode` + neue Felder angepasst.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/licenseRecords.js`
  - `src/main/licensing/licenseAdminService.js`
  - `src/main/db/database.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine neue Generator-IPC, keine Setup-/App-Sperrlogik-Aenderung, keine Sidebar-/Projektmodul-Aenderung

#### Paket: Admin-Lizenzformular an bestehende Lizenzdatei-Erzeugung angebunden
- Status: erledigt
- Beschreibung:
  - Lizenzformular in `LicenseAdminScreen` um `Lizenzdatei erzeugen` erweitert; Erzeugung nur fuer gespeicherte Lizenzen.
  - Neue Mapping-Helfer bauen Generator-Payload aus Kunde+Lizenz (customerName, licenseId, product `bbm-protokoll`, edition, binding, validFrom/validUntil, maxDevices, machineId, features).
  - Features-Mapping aus `product_scope_json` deckt Standardumfang, Zusatzfunktionen und Module ab; `audio` bleibt kompatibel als `dictate`.
  - UI zeigt Statusmeldungen fuer laufende Erzeugung, Erfolg/Fehler, Ausgabepfad und optional `Ausgabeordner öffnen`.
  - Tests fuer Payload-Mapping, Binding-/Produkt-Mapping, Feature-Mapping und Feature-Leerfall wurden in `licenseAdminDataflow.test.cjs` erweitert.
  - Strukturtests wurden um Nachweise fuer Button, Blockiermeldungen und bestehende IPC-Infrastruktur erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Setup-Aenderung, keine Sidebar-/Projektmodul-Aenderung, keine App-Sperrlogik-Aenderung

#### Paket: Gefuehrter Lizenzumfang-Editor in der Admin-Lizenzverwaltung
- Status: erledigt
- Beschreibung:
  - Im Lizenzformular (`Neue Lizenz / Lizenz bearbeiten`) wurde ein gefuehrter Editor fuer `Produkt`, `Standardumfang`, `Zusatzfunktionen` und `Module` eingebaut.
  - UI-Nachforderung umgesetzt: `Produkt` steht separat oben; `Standardumfang`, `Zusatzfunktionen` und `Module` werden als drei klar getrennte Karten in einer responsiven 3-Spalten-Zeile dargestellt.
  - Fehlerkorrektur: `Neu / leeren` setzt den Scope-Zustand jetzt konsistent zurueck (Standardumfang aktiv, Zusatzfunktionen/Module leer) und erzeugt `product_scope_json` sofort neu aus dem sichtbaren Modell.
  - `product_scope_json` wird weiterhin ueber die bestehende Save-Logik gespeichert, jetzt aber strukturiert mit `product`, `standardumfang`, `zusatzfunktionen` und `module`.
  - Bestehende Altwerte bleiben kompatibel: `{ raw: ... }`, Freitext, leere Arrays und vorhandene Strukturwerte werden weiterhin gelesen/angezeigt.
  - Die Liste `Lizenzen dieses Kunden` zeigt den Produktumfang jetzt lesbar (inkl. `Dictate` statt `audio`).
  - Tests fuer lesbare Ausgabe und `Dictate`-Darstellung wurden in `licenseAdminDataflow.test.cjs` erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Lizenzdatei-/Setup-Aenderung, keine IPC-Erweiterung

#### Paket: Zeitzonenstabiler Test fuer erzeugte Lizenz-ID
- Status: erledigt
- Beschreibung:
  - Zeitzonenabhaengiger Testfall in `scripts/tests/licenseAdminDataflow.test.cjs` stabilisiert
  - UTC-String-Zeitpunkt (`new Date("2026-04-26T13:14:15Z")`) durch lokale Datumskonstruktion ersetzt
  - Erwartete Lizenz-ID `LIC-20260426-131415` bleibt unveraendert
- Betroffene Dateien:
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Lizenzlogik, DB, UI oder Lizenzdatei-Erzeugung

#### Paket: UI-Aufraeumen Admin-Lizenzverwaltung (kundenbezogen)
- Status: erledigt
- Beschreibung:
  - `LicenseAdminScreen` optisch/bedienbar aufgeraeumt (Kundenliste, Kundendetail, Lizenztabelle, Lizenzformular).
  - Produktumfangsausgabe in der Kunden-Lizenzliste lesbar gemacht (`raw`-Text, Kurzformat, `-` bei leeren Arrays).
  - Lizenzformular um Button `Lizenz-ID erzeugen` erweitert, ohne bestehende Auto-ID-Sicherheitslogik beim Speichern zu aendern.
  - Tests in `scripts/tests/licenseAdminDataflow.test.cjs` und `scripts/tests/lizenzverwaltungModule.test.cjs` entsprechend erweitert/angepasst.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Lizenzdatei-/Setup-Aenderung, keine Aenderung am Projektmodul/Sidebar

#### Paket: CSS-Altpfad im Modul Protokoll abbauen
- Status: erledigt
- Beschreibung:
  - modul-lokale CSS-Datei für Protokoll angelegt
  - CSS-Verweis in `src/renderer/modules/protokoll/styles.js` angepasst
  - alte CSS-Datei blieb bestehen
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/styles.js`
  - `src/renderer/modules/protokoll/styles/tops.css`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Commit enthält zusätzlich das Entfernen von ChatGPT-Export-Artefakten

#### Paket: Speichern-/Löschen-Vertrag im Tops-Bereich stabilisieren
- Status: erledigt
- Beschreibung:
  - `topsCommands`-Testvertrag an den realen Reload-Ablauf nach `saveDraft` und `deleteSelectedTop` angepasst
  - Reload nach Speichern/Löschen im Test explizit abgedeckt (inkl. Erhalt/Entfernung der Selektion im Ablauf)
- Betroffene Dateien:
  - `scripts/tests/topsCommands.test.cjs`
  - `STATUS.md`
- Commit:
  - `50cdbc3`
- Hinweise:
  - Keine Änderungen an Router, UI oder fachlicher Tops-Logik

---


#### Paket: Einstellungen/Entwicklung strukturiert auf Diktieren umgestellt
- Status: erledigt
- Beschreibung:
  - Entwicklungsbereich um den neuen Tab `Diktieren` erweitert
  - `Diktierprodukt` als fachliche Klammer eingefuehrt und `Aktuelle Engine: Whisper` sichtbar gemacht
  - bestehende Whisper-Modellauswahl unveraendert unter `Diktierprodukt` einsortiert
  - vorbereiteter Abschnitt `Woerterbuch` als `noch nicht eingerichtet` gekennzeichnet
  - Diktieren-UI nach `src/renderer/modules/audio/ui/createDictationDevSection.js` ausgelagert
  - Audio-Modultest um den neuen UI-Baustein erweitert
- Betroffene Dateien:
  - `src/renderer/modules/audio/ui/createDictationDevSection.js`
  - `src/renderer/modules/audio/index.js`
  - `src/renderer/modules/audio/README.md`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/audioModule.test.cjs`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Router-, Sidebar-, Projektmodul- oder TranscriptionService-Aenderung

#### Paket: Lizenz-Featurelabel `audio` als `Dictate` anzeigen
- Status: erledigt
- Beschreibung:
  - sichtbares Feature-Label `audio` im Bereich `Lizenz / bearbeiten` auf `Dictate` umgestellt
  - interner Feature-Key `audio` unverändert gelassen
  - Ergebnisanzeige der erzeugten Lizenz zeigt den sichtbaren Feature-Namen ebenfalls als `Dictate`
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/audioModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Änderungen an Settings-/Diktieren-Tab, Sidebar, Projektmodul oder Whisper-Logik

#### Paket: ProjectWorkspaceScreen minimal stabilisiert
- Status: erledigt
- Beschreibung:
  - robuste Anzeige fuer Projektnummer und Projektname im Projekt-Arbeitsbereich nachgezogen
  - Nachladen ohne direkt uebergebenes Projekt bleibt ueber `window.bbmDb.projectsList()` erhalten
  - klare Meldung fuer nicht gefundenes Projekt und Ruecksprung-Button `Zur Projektliste` ueber `showProjects()` ergaenzt
  - Projektauswahl bleibt auf `Protokoll` begrenzt; Maschinenraumdienste weiterhin unsichtbar
  - passende Modul-Tests fuer robuste Anzeige, Ruecksprung und Projektlade-Faelle erweitert
- Betroffene Dateien:
  - `src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Router-Aenderungen, keine Protokoll-Aenderungen

#### Paket: Lizenzverwaltung Paket 1 (Adminbereich + Modul-Skeleton)
- Status: erledigt
- Beschreibung:
  - neues Admin-Modul `src/renderer/modules/lizenzverwaltung/` mit `index.js`, `README.md`, `screens/index.js` und `screens/LicenseAdminScreen.js` angelegt
  - Skeleton-Screen mit Platzhaltern `Kunden`, `Lizenzen`, `Produktumfang`, `Historie` ergänzt
  - Entwicklungsbereich in `SettingsView` minimal um den Einstieg `Adminbereich` erweitert
  - Modulkatalog und Projektmodule bleiben unverändert (`Protokoll` bleibt einziges Projektmodul)
  - Testlauf um `lizenzverwaltungModule.test.cjs` ergänzt
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `scripts/test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Kein Umbau am bestehenden Lizenz-bearbeiten-Popup
  - Keine Lizenzlogik-, Produktumfangs-, Kunden- oder Historienimplementierung

#### Paket: Lizenzverwaltung Paket 2 (Adminbereich als eigenes Popup)
- Status: erledigt
- Beschreibung:
  - `Adminbereich` aus den Entwicklung-Tabs entfernt und als eigener Einstieg/Kachel im Entwicklungs-Popup verankert
  - neues Adminbereich-Popup mit Kachel `Lizenzverwaltung` ergänzt
  - Klick auf `Lizenzverwaltung` zeigt weiterhin den bestehenden `LicenseAdminScreen`-Skeleton
  - bestehende Entwicklung-Tabs (`Versionierung`, `Lizenz / bearbeiten`, `DB-Diagnose`, `Diktieren`, `Druck / TOP-Liste`) bleiben unverändert erhalten
  - Testvertrag fuer Adminbereich-/Lizenzverwaltung-Einstieg entsprechend erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Lizenzlogik, Projektmodulen, Sidebar oder Whisper/Diktier-Backends

#### Paket: Lizenzverwaltung Paket 2 (Produktumfang im Popup gliedern)
- Status: erledigt
- Beschreibung:
  - im Popup `Lizenz / bearbeiten` wurde die flache `Features`-Zeile durch den gegliederten Bereich `Produktumfang` ersetzt
  - `Standardumfang` (`app`, `pdf`, `export`) ist sichtbar und dauerhaft enthalten (nicht abwaehlbar)
  - `Zusatzfunktionen` enthalten `mail` und die sichtbare Bezeichnung `Dictate` (intern weiter `audio` kompatibel)
  - `Module` enthalten `Protokoll` und `Dummy` als klar vorbereitete, noch nicht aktiv angebundene Eintraege
  - bestehende Buttons unten (`Lizenz laden`, `Lizenzanforderung laden`, `Lizenz verlaengern`, `Ausgabeordner oeffnen`) bleiben unveraendert erhalten
  - Testvertrag in `lizenzverwaltungModule.test.cjs` um Produktumfang-Nachweise erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Projektmodul-Katalog, Sidebar, Whisper, Diktierfunktion oder Protokoll-Modul

#### Paket: Lizenzverwaltung Paket 3 (Adminbereich in Einstellungen-Hauptebene verortet)
- Status: erledigt
- Beschreibung:
  - `Adminbereich` als eigene Kachel direkt auf oberster Ebene in `Einstellungen` verankert
  - `Adminbereich` aus dem Entwicklung-Popup entfernt (kein Kachel- oder Tab-Einstieg mehr dort)
  - im `Adminbereich` bleibt die Kachel `Lizenzverwaltung` der sichtbare Zielpfad
  - Klick auf `Lizenzverwaltung` zeigt weiterhin den bestehenden `LicenseAdminScreen`-Skeleton
  - bestehender Bereich `Lizenz / bearbeiten` bleibt im Code als Altbestand erhalten, aber ohne sichtbaren Entwicklung-Tab-Einstieg
  - Testvertrag fuer Einstellungen/Entwicklung/Adminbereich entsprechend angepasst und erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Lizenzlogik-Aenderung
  - Keine Projektmodul-, Sidebar-, Diktier- oder Whisper-Aenderung

#### Paket: Lizenzverwaltung Paket 4 (Lizenz-erstellen-/bearbeiten-UI ins Modul verschoben)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `createLicenseEditorSection.js` eingefuehrt und die bestehende Lizenz-erstellen-/bearbeiten-UI dorthin verschoben
  - bestehende Lizenzlogik/IPC-Aufrufe und Buttons (`Lizenz laden`, `Lizenzanforderung laden`, `Lizenz verlaengern`, `Ausgabeordner oeffnen`) unveraendert beibehalten
  - `LicenseAdminScreen` um den Einstieg `Lizenz erstellen / bearbeiten` erweitert
  - Klick auf den Einstieg oeffnet die verschobene UI aus dem Modul im Adminbereich
  - `SettingsView` enthaelt keinen sichtbaren Entwicklungs-Tab `Lizenz / bearbeiten` mehr
  - Tests auf Modul-Export, Einstieg im `LicenseAdminScreen`, gegliederten Produktumfang und Adminbereich-Abgrenzung angepasst
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - keine neue Kundenverwaltung, Historie oder Produktumfang-Datenstruktur eingefuehrt
  - keine Projektmodul-, Sidebar-, Whisper-, Diktier- oder Lizenzdatei-Logik-Aenderung


#### Paket: Lizenzverwaltung Paket 4 (Kunden- und Lizenzdatensatz vorbereiten)
- Status: erledigt
- Beschreibung:
  - zentrale Datei `src/renderer/modules/lizenzverwaltung/licenseRecords.js` mit Feldlisten fuer Kunde und Lizenz angelegt
  - Default-Strukturen und kleine Normalisierungsfunktionen fuer beide Datensaetze eingefuehrt
  - `LicenseAdminScreen` zeigt die Bereiche `Kunden` und `Lizenzen` weiter als vorbereitete Bereiche, aber mit Feldhinweisen
  - bestehende Lizenz-erstellen-/bearbeiten-UI bleibt unveraendert als Einstieg nutzbar
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/licenseRecords.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine neue Datenbank/Persistenz
  - Keine Kundenverwaltung/Historie implementiert
  - Keine Projektmodul-/Sidebar-/Whisper-Aenderung

#### Paket: Lizenzverwaltung naechstes Paket (Kunden-UI als vorbereitete Maske)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `src/renderer/modules/lizenzverwaltung/screens/createCustomerEditorSection.js` angelegt
  - Kundenmaske mit Ueberschrift `Kunden`, Hinweis `vorbereitet, noch ohne Speicherung` und allen vorbereiteten Kundenfeldern aus `CUSTOMER_RECORD_FIELDS` umgesetzt
  - Buttons `Neu / leeren` und `Pruefen` ergaenzt; Pruefen validiert lokal die Pflichtfelder ohne Speicherung/Persistenz
  - `LicenseAdminScreen` um den Einstieg fuer die Kundenmaske erweitert
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Kundenmaske im Adminbereich
  - Testvertrag fuer Modul-Export, Feldnutzung, Buttons, Kunden-Einstieg und Nicht-Projektmodul-Verhalten erweitert
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createCustomerEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Datenbank/Persistenz/Kundenliste/Historie implementiert
  - Keine Lizenzdatei- oder Produktumfang-Logik geaendert
  - Keine Projektmodul-/Sidebar-/Whisper-Aenderung


#### Paket: Lizenzverwaltung naechstes Paket (Lizenzen-UI als vorbereitete Maske)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `src/renderer/modules/lizenzverwaltung/screens/createLicenseRecordEditorSection.js` angelegt
  - Lizenzen-Maske mit Ueberschrift `Lizenzen`, Hinweis `vorbereitet, noch ohne Speicherung` und allen vorbereiteten Lizenzfeldern aus `LICENSE_RECORD_FIELDS` umgesetzt
  - Lizenzmodus wird ueber `LICENSE_MODES` gerendert
  - Buttons `Neu / leeren` und `Pruefen` ergaenzt; Pruefen validiert lokal Pflichtfelder ohne Speicherung/Persistenz
  - `LicenseAdminScreen` um den Einstieg fuer die Lizenzen-Maske erweitert
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Lizenzen-Maske im Adminbereich
  - Testvertrag fuer Modul-Export, Feldnutzung, LICENSE_MODES, Buttons und Lizenzen-Einstieg erweitert
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseRecordEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Datenbank/Persistenz/Lizenzenliste/Historie implementiert
  - Keine Lizenzdatei-/Produktumfang-/Projektmodul-/Sidebar-/Whisper-Aenderung

## Offene Meilensteine
1. Weitere kleine Altpfade im Modul `Protokoll` abbauen

Hinweis: Der Meilenstein „Projektverwaltung / Projekt-Arbeitsbereich“ ist abgeschlossen und dokumentiert.

---

## Zuletzt bearbeitet
- Letztes Paket:
  - reine Button-Helfer aus `CoreShell` in `src/renderer/app/coreShellButtons.js` ausgelagert
  - `CoreShell` importiert `mkNavBtn`, `mkActionBtn`, `setBtnEnabled`, `appendButtonGroup` und `createScreenRouteButton`
  - Core-Navigation, Style-Hilfe und Teilnehmer-Aktion bleiben separat gekapselt
  - `npm test` ist gruen
- Letztes Paket:
  - Teilnehmer-Shell-Aktion aus `CoreShell` in `src/renderer/app/coreShellActions.js` ausgelagert
  - `CoreShell` importiert die Factory weiterhin und haengt den Teilnehmer-Button unveraendert in die Sidebar
  - Kontextsteuerung fuer Projekt/Besprechung bleibt im Shell-Teil
  - `npm test` ist gruen
- Letztes Paket:
  - leere Kontext-/Projekt-Navigationslogik aus `CoreShell` entfernt
  - `btnParticipants` und `updateContextButtons` bleiben als reine Kontextsteuerung erhalten
  - Core-Sidebar bleibt unveraendert und fachfrei
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Navigationsdefinition aus `CoreShell` in `src/renderer/app/coreShellNavigation.js` ausgelagert
  - `CoreShell` importiert die Route-Definitionen und baut daraus weiterhin die Buttons
  - Labels, Router-Methoden und Core-Sidebar-Verhalten unveraendert
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Navigationsdefinition aus `CoreShell` in `src/renderer/app/coreShellNavigation.js` ausgelagert
  - `CoreShell` erzeugt die Buttons weiter aus der ausgelagerten Route-Definition
  - Labels und Navigation unveraendert, Core-Sidebar bleibt fachfrei
  - `npm test` ist gruen
- Letztes Paket:
  - reine Shell-Style-Injektion aus `CoreShell` in `src/renderer/app/coreShellStyles.js` ausgelagert
  - `CoreShell` ruft die Style-Hilfe nur noch auf; Navigation und Router-Verdrahtung bleiben unveraendert
  - keine optische oder fachliche Aenderung
  - `npm test` ist gruen
- Letztes Paket:
  - toter old/new-UI-Modus aus `CoreShell` entfernt
  - `CoreShell.start()` startet den bestehenden Shell-Aufbau direkt ueber `_initShell()`
  - `main.js` bleibt Bootstrap und uebergibt keinen UI-Modus mehr
  - Core-Sidebar-Verhalten unveraendert
  - `npm test` ist gruen
- Letztes Paket:
  - alte Sidebar-Nachsortierung in `CoreShell._initUiNew()` entfernt
  - `CoreShell` delegiert den neuen UI-Modus jetzt nur noch auf den bestehenden Core-Shell-Aufbau
  - Core-Navigation bleibt unveraendert, Fachmodule bleiben aus der Sidebar draussen
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Shell-/Sidebar-Aufbau aus `main.js` in `src/renderer/app/CoreShell.js` ausgelagert
  - `main.js` bleibt beim Bootstrapping: Router erzeugen, Theme/Settings vorbereiten, `CoreShell` starten
  - Core-Navigation mit Start/Projekte/Firmen/Einstellungen/Hilfe/Beenden bleibt erhalten
  - Fachmodule tauchen weder in `main.js` noch in `CoreShell` als Sidebar-Definition auf
  - `npm test` ist gruen
- Letztes Paket:
  - Projekt-Arbeitsbereich von direktem Protokoll-Modulkatalog getrennt
  - `ProjectWorkspaceScreen` importiert `getActiveProjectModuleNavigation` und `PROTOKOLL_MODULE_ID` nicht mehr direkt
  - Router stellt die Arbeitsbereiche fuer den Projekt-Arbeitsbereich bereit und reicht sie an den Screen durch
  - Projektfirmen werden dort zusaetzlich zu Protokoll angezeigt
  - `npm test` ist gruen
- Letztes Paket:
  - Machine-Binding Schritt 1: Lizenzanforderung speichern (`bbm-license-request.json`) inkl. Tests (Payload/IPC/Preload/UI/Grenzen)
- Letzter sinnvoller bestätigter Stand:
  - Speichern-/Löschen-Vertrag im Tops-Bereich über zugehörigen Testvertrag stabilisiert
- Letzter Cloud-Kontrolllauf:
  - `AGENTS.md` gefunden
  - `PLAN.md` gefunden
  - Codex konnte den Repo-Stand lesen
- Cloud-Kontrolllauf (zum damaligen Stand):
  - Branch: `modularisierung/projektverwaltung`
  - `HEAD` und `origin/modularisierung/projektverwaltung` waren identisch
  - der lokale Diff war leer
- Abgeschlossener Meilenstein:
  - Projekt-Arbeitsbereich ist technisch umgesetzt und stabilisiert
  - Projektklick oeffnet nicht mehr direkt Protokoll
  - Projektklick oeffnet den Projekt-Arbeitsbereich
  - einziges auswaehlbares Projektmodul ist aktuell Protokoll
  - Maschinenraumdienste erscheinen dort nicht als Projektmodule
  - Protokoll-Logik blieb unveraendert
  - `npm test` war gruen
- Beobachtung:
  - Ohne Fortschrittsdatei interpretiert Codex den Plan zu wörtlich und nimmt erledigte Meilensteine erneut als offen an.

---

## Aktuell nächster sinnvoller Schritt
Der naechste sinnvolle kleine Schritt nach diesem Paket ist:

### Lizenzverwaltung Paket 6 vorbereiten
- Ziel:
  - bestehende Lizenz laden, aendern und neu ausgeben als naechsten kleinen Adminschritt vorbereiten
- Wichtig:
  - Kundenverwaltung/Historie weiter nicht vorziehen
  - Audio / Diktat bleibt Maschinenraum ohne Projektmodul- oder Sidebar-Eintrag

---

## Offene Hindernisse / bekannte Probleme
- Frühere Läufe zeigten bestehende Altprobleme, u. a.:
  - `ERR_INVALID_URL` im Zusammenhang mit ESM/CSS-Importpfaden
- Diese Probleme gelten nicht automatisch als Teil jedes neuen Mini-Pakets.
- Wenn ein neuer Meilenstein an diesen Punkten hängen bleibt, stoppen und offen berichten.

---

## Regeln für Fortschrittsfortschreibung
Nach jedem abgeschlossenen Paket oder Meilenstein ergänzen:
1. Was wurde erledigt?
2. Welche Dateien waren betroffen?
3. Welcher Commit gehört dazu?
4. Was ist jetzt der nächste offene Schritt?
5. Gab es Hindernisse oder Restrisiken?

Wichtig:
- `STATUS.md` beschreibt den Ist-Stand.
- `PLAN.md` bleibt der Soll-Plan.
- Erledigte Schritte sollen in `STATUS.md` dokumentiert werden, nicht durch ständiges Umschreiben von `PLAN.md`.

---

## Merksatz
- `AGENTS.md` = Hausordnung
- `PLAN.md` = Bauablaufplan
- `STATUS.md` = Bautagebuch / Ist-Stand

#### Paket: Lizenzverwaltung Paket 3 (Produktumfang intern zentral strukturiert)
- Status: erledigt
- Beschreibung:
  - zentrale Produktumfangs-Struktur `PRODUCT_SCOPE` im Modul `lizenzverwaltung` angelegt
  - `createLicenseEditorSection` auf die zentrale Struktur umgestellt (Standardumfang, Zusatzfunktionen, Module)
  - sichtbares Verhalten beibehalten: Standardumfang fix, mail/Dictate auswählbar, Module vorbereitet/deaktiviert
  - Features-Ausgabe bleibt kompatibel mit internem `audio`-Key fuer Dictate
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/productScope.js`
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Lizenzdatei-Strukturreform, keine Modulfreischaltung und keine Sidebar-/Projektmodul-Aenderung

#### Paket: Lizenzmodell-Korrektur BBM/Protokoll/Diktat
- Status: erledigt
- Beschreibung:
  - Lizenzmodell auf Zielbegriffe ausgerichtet: Produkt `bbm`, Modul `protokoll`, Zusatzfunktion `diktat`.
  - Runtime-Guards auf Modul/Funktion umgestellt: Protokoll erfordert `protokoll`, Diktat erfordert `protokoll` + `diktat`.
  - Lizenzstatus/Diagnose trennt Module und Funktionen; Lizenzanforderung nutzt Produkt `bbm`.
  - Rueckwaertskompatibilitaet bleibt aktiv (`bbm-protokoll`, `audio`/`dictate` als Alias).
- Betroffene Dateien:
  - `src/main/licensing/licenseFeatures.js`
  - `src/main/licensing/licenseService.js`
  - `src/main/licensing/featureGuard.js`
  - `src/main/licensing/licenseVerifier.js`
  - `src/main/ipc/licenseIpc.js`
  - `src/main/ipc/projectsIpc.js`
  - `src/main/ipc/printIpc.js`
  - `src/main/ipc/audioIpc.js`
  - `src/main/main.js`
  - `scripts/tests/licenseRequest.test.cjs`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `scripts/tests/licenseStandardFeatures.test.cjs`
  - `scripts/tests/featureGuardEnforcement.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - Renderer-Lizenzstatusanzeige optional feinjustieren (Labels Produkt/Module/Funktionen), ohne Admin/Gene­rator-Rueckbau.
- Risiken/Hinweise:
  - Legacy-Tests mit Alias-Begriffen bleiben teils bewusst erhalten fuer sanften Uebergang.

#### Paket: CoreShell-Layout-Auslagerung
- Status: erledigt
- Beschreibung:
  - Reine Shell-Layout-/DOM-Struktur aus `CoreShell.js` in `src/renderer/app/coreShellLayout.js` ausgelagert.
  - Host-Setup, Sidebar-Container, Content-Root, Top-/Bottom-Boxen und Host-Append bleiben funktional unveraendert.
  - Router-Verdrahtung, Navigation, Aktionen und Kontextsteuerung verbleiben in `CoreShell.js`.
- Betroffene Dateien:
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur Layout/DOM-Struktur verschoben; fachliche Navigation und Router-Kanten bewusst unangetastet gelassen.

#### Paket: Entfernen des toten Firmen/Mitarbeiter-Schalters
- Status: erledigt
- Beschreibung:
  - Toten Schalter `Beta: Firmen/Mitarbeiter v2` und die zugehoerige `useNewCompanyWorkflow`-Verdrahtung aus `main.js` und `CoreShell.js` entfernt.
  - Druck-v2-Keys und Druckeinstellungen bleiben unveraendert.
  - Core-Navigation, Teilnehmer-Aktion, Router-Verdrahtung und allgemeiner Sticky-Notice-Listener bleiben bestehen.
- Betroffene Dateien:
  - `src/renderer/main.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Bereinigung
- Risiken/Hinweise:
  - Nur der tote Schalter wurde entfernt; `print.v2.*` und sonstige Ausgabelogik sind bewusst unveraendert geblieben.

#### Paket: CoreShell-Header-Bridge-Auslagerung
- Status: erledigt
- Beschreibung:
  - Header-/Router-Bridges aus `CoreShell.js` in `src/renderer/app/coreShellHeaderBridge.js` ausgelagert.
  - Router-Bridge fuer Output-Mail, Output-Print, Closed-Protocol-Selector und Header-/Theme-/Sticky-Notice-Events bleibt funktional unveraendert.
  - CoreShell behält Layout, Navigation, Teilnehmer-Aktion und Router-Kanten ausserhalb der Header-Bridge.
- Betroffene Dateien:
  - `src/renderer/app/coreShellHeaderBridge.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Header-/Router-Bridges verschoben; fachliche Navigation und Layout blieben bewusst unangetastet.

#### Paket: CoreShell-Keyboard-Handling-Auslagerung
- Status: erledigt
- Beschreibung:
  - Globales Enter/Escape-Keyboard-Handling aus `CoreShell.js` in `src/renderer/app/coreShellKeyboard.js` ausgelagert.
  - Das Verhalten fuer Overlay-Buttons bleibt unveraendert.
  - Header-Bridge, Layout, Navigation, Button-Helfer und fachliche Module blieben unangetastet.
- Betroffene Dateien:
  - `src/renderer/app/coreShellKeyboard.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur das globale Keyboard-Handling verschoben; UI- und Fachlogik bleiben unveraendert.
