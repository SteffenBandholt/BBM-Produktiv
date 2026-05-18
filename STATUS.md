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

- Arbeitsstand #117 Restarbeiten-Editbox-Layout:
  - Quicklane-Schloss-Icon vorbereitet.
  - Restarbeiten-Editbox-Layout optisch stabilisiert.
  - Buttonbegriff auf + Restpunkt vereinheitlicht.
  - farbige Hilfsrahmen / Outlines bleiben bewusst erhalten.
  - npm test lokal gruen.

- npm test laeuft gruen.
- Der aktuelle Branch local/quicklane-restarbeiten-layout bleibt fuer die weitere Feinarbeit offen.

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
- Die Whisper-Modellstrategie ist jetzt auf `small`/`balanced` als Default ausgerichtet:
  - DEV bleibt bei `fast`/`balanced`/`best`/`large`
  - produktive Builds packen nur noch `ggml-small.bin`
  - der Main-Service faellt bei fehlendem Wunschmodell auf `ggml-small.bin` zurueck, wenn es vorhanden ist
  - der Nutzer-Modellordner `userData/audio/models` wird im Whisper-Engine-Pfad mitberuecksichtigt
- Die Audio-Tests wurden um Default-, Fallback-, User-Model- und Packaging-Pruefungen erweitert.
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
  - Protokoll-Quicklane im TopsScreen auf einen TOP-Filter umgestellt
  - die Quicklane zeigt jetzt einen Filter-Button mit den Modi `Alle`, `ToDo` und `Beschluss`
  - `TopsScreenViewModel` filtert die sichtbare Liste nach dem gewaehlten Modus
  - Header-Buttons `Ausgabe`, `Firmen` und `Projekt` werden im Protokoll-Kontext nicht mehr als Quicklane-Aktionen gezeigt
  - `npm test` ist gruen
- Letztes Paket:
  - reine Button-Helfer aus `CoreShell` in `src/renderer/app/coreShellButtons.js` ausgelagert
  - `CoreShell` importiert `mkNavBtn`, `mkActionBtn`, `setBtnEnabled`, `appendButtonGroup` und `createScreenRouteButton`
  - Core-Navigation, Style-Hilfe und Teilnehmer-Aktion bleiben separat gekapselt
  - `npm test` ist gruen
- Letztes Paket:
  - globaler Header im Shell-Kontext textbasiert neu aufgebaut
  - links steht jetzt `BBM <Version>` plus `aktiv: <Modul> | <Projektnummer> - <Kurzbezeichnung>`
  - rechts steht der ruhige Kunden-/Lizenztext aus den vorhandenen Settings
  - der alte `bereit:`-Statusblock und das sichtbare Statuspunktfeld sind entfernt
  - `npm test` ist nach dem Umbau erneut zu pruefen
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

#### Paket: CoreShell-Quit-Button-Auslagerung
- Status: erledigt
- Beschreibung:
  - Beenden-/Quit-Button aus `CoreShell.js` in `src/renderer/app/coreShellActions.js` ausgelagert.
  - Styling, `appQuit()`-Aufruf, Fallback `window.close()` und Beenden-Hinweis bleiben funktional unveraendert.
  - `CoreShell` haengt den Button nur noch in die Bottom-Box ein.
- Betroffene Dateien:
  - `src/renderer/app/coreShellActions.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Quit-Button-Erzeugung verschoben; Rest der Shell bleibt unveraendert.

#### Paket: CoreShell-Kontextsteuerung-Auslagerung
- Status: erledigt
- Beschreibung:
  - Kontextsteuerung fuer den Teilnehmer-Button aus `CoreShell.js` in `src/renderer/app/coreShellContextControls.js` ausgelagert.
  - `bbm:router-context` und die Projekt-/Besprechungshinweise bleiben funktional unveraendert.
  - `CoreShell` ruft die zurueckgegebene `updateContextButtons()`-Funktion weiterhin fuer Start und Navigation auf.
- Betroffene Dateien:
  - `src/renderer/app/coreShellContextControls.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Teilnehmer-Kontextsteuerung verschoben; restliche Shell-Komponenten bleiben unveraendert.

#### Paket: CoreShell-Navigation-Runtime-Auslagerung
- Status: erledigt
- Beschreibung:
  - Navigation-Runtime-Helfer `buttonsByKey`, `setActive` und `runNavSafe` aus `CoreShell.js` in `src/renderer/app/coreShellNavigationRuntime.js` ausgelagert.
  - `router.onSectionChange` bleibt in `CoreShell.js`; das Verhalten der Navigation bleibt unveraendert.
  - Restliche Shell-Komponenten wie Header-Bridge, Keyboard, Layout, ContextControls und Actions bleiben unangetastet.
- Betroffene Dateien:
  - `src/renderer/app/coreShellNavigationRuntime.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Navigation-Runtime-Helfer verschoben; die Navigation selbst bleibt bewusst in CoreShell verdrahtet.

#### Paket: CoreShell-Body-Grundsetup-Auslagerung
- Status: erledigt
- Beschreibung:
  - Body-Grundsetup aus `CoreShell.js` in `src/renderer/app/coreShellLayout.js` verschoben.
  - `document.body.style.margin`, `height`, `background` und `color` werden nun ueber `prepareCoreShellBody()` gesetzt.
  - Layout, Navigation und alle anderen Shell-Bausteine bleiben unveraendert.
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
  - Nur das Body-Setup verschoben; der restliche Layout-/Shell-Aufbau bleibt bewusst unangetastet.

#### Paket: Firmenbegriffe und Labels klaeren
- Status: erledigt
- Beschreibung:
  - Sichtbare Begriffe rund um Firmen/Firmen im Projekt/Firmen hinzufuegen in `ProjectFirmsView.js`, `FirmsPoolView.js` und den zugehoerigen Router-/Test-Erwartungen geschaerft.
  - Projektbezogene Bezeichnung `Projektfirmen` durch `Firmen im Projekt` ersetzt, die Fachlogik und Sortierreihenfolge blieben unveraendert.
  - Projektpool-CTA auf `Firmen hinzufuegen` / `Aus Firmenstamm hinzufuegen` vereinheitlicht.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `src/renderer/views/FirmsPoolView.js`
  - `src/renderer/app/Router.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur sichtbare Texte/Labels angepasst; Sortierlogik, DB-/IPC-Namen und Projektfirmen-Funktionen bleiben unveraendert.

#### Paket: Doppelten Projekttitel in Firmen im Projekt entfernen
- Status: erledigt
- Beschreibung:
  - Im Header von `ProjectFirmsView` die doppelte Projektbezeichnung neben `Firmen im Projekt` entfernt.
  - Der Button `Zum Projekt` und der restliche Inhalt bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur die sichtbare Doppelanzeige entfernt; Routing, Projektlogik und Firmenlogik bleiben unveraendert.

#### Paket: Projektbezeichnung im Firmen-im-Projekt-Header entfernen
- Status: erledigt
- Beschreibung:
  - Im Kopf von `ProjectFirmsView` die doppelte Projektbezeichnung neben `Firmen im Projekt` entfernt.
  - Der Button `Zum Projekt` und die restliche Ansicht bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur die sichtbare Kopfzeile reduziert; globale Header-Anzeige und Projektlogik bleiben unveraendert.

#### Paket: Firmenrollen-Kachel und Rollenreihenfolge-Dialog wiederherstellen
- Status: erledigt
- Beschreibung:
  - In den Einstellungen eine sichtbare Kachel `Firmenrollen` ergaenzt.
  - Die Kachel oeffnet den Dialog `Rollenreihenfolge für Firmen` mit Zwei-Spalten-Liste, Hinweis, Hinzufuegen sowie Schieben/Edit/Loeschen fuer die markierte Rolle.
  - Die bestehenden Settings-Schluessel `firm_role_order` und `firm_role_labels` werden weiterhin fuer Laden und Speichern verwendet.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Die bestehende Rollen-/Kategorie-Settings-Struktur bleibt unveraendert; die sichtbare UI wurde nur wieder eingeblendet, vereinfacht und sprachlich geschaerft.

#### Paket: Nummernluecken direkt nach Delete schliessen
- Status: erledigt
- Beschreibung:
  - Nach erfolgreichem Loeschen eines TOPs oder Titels wird im Protokoll die bestehende `meetingTopsFixNumberGap`-Reparatur direkt angestossen.
  - Der alte Fallback beim Schliessen des Protokolls bleibt unveraendert erhalten.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `scripts/tests/protokollRouterFallback.test.cjs`
  - `scripts/tests/topsScreen.integration.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die bestehende Reparatur-Logik wird wiederverwendet; falls die Delete-Reparatur fehlschlaegt, bleibt der Close-Fallback als zweite Sicherung bestehen.

#### Paket: +Titel/Create-Kontext nach Renumber wiederherstellen
- Status: erledigt
- Beschreibung:
  - `+Titel` kann wieder ohne aktive Auswahl angelegt werden.
  - Der neu erzeugte Titel wird automatisch ausgewahlt und als Create-Kontext fuer den naechsten `+TOP` gemerkt.
  - Der bestehende Delete-/Renumber-Flow bleibt erhalten; die Nummernreparatur nach Delete laeuft weiter sofort.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `scripts/tests/protokollRouterFallback.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der Create-Kontext wird im Screen gehalten; bei weiteren Create-Regeln muss spaeter nur dieser Pfad erweitert werden.

#### Paket: Diktat/Audio von Entwicklung nach Eingabe & Erfassung verschieben
- Status: erledigt
- Beschreibung:
  - `Diktat / Audio` erscheint jetzt als eigene Kachel unter `Eingabe & Erfassung`.
  - Der Technik-Dialog enthaelt diesen Tab nicht mehr.
  - Die bestehenden Audio-Einstellungen bleiben ueber den neuen Einstieg erreichbar.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der Audio-Baustein bleibt intern derselbe; nur der sichtbare Einstieg wurde umgehaengt.

#### Paket: Adminbereich aus Settings-Übersicht entfernen
- Status: erledigt
- Beschreibung:
  - Der sichtbare Einstieg `Adminbereich` / `Externe Lizenzverwaltung` wurde aus der normalen Settings-Übersicht entfernt.
  - `Lizenzstatus` bleibt unter `Allgemein` erhalten.
  - `Entwicklung` zeigt danach nur noch `Technik`.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der interne Lizenz-Admin-Code bleibt bewusst stehen; nur der sichtbare Settings-Einstieg ist entfernt.

#### Paket: Modul-/Feature-/Lizenzregel dokumentiert
- Status: erledigt
- Beschreibung:
  - Die Doku beschreibt jetzt die Regel fuer Fachmodule, Hilfsfunktionen, Ausgabe-Infrastruktur und externen Lizenzbau.
  - Die Kurzregel macht die fachliche Trennung in einem Blick lesbar.
- Betroffene Dateien:
  - `docs/settings-structure.md`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Nur Dokumentation wurde ergaenzt; App-Logik blieb unveraendert.

#### Paket: Globale UI-Schrift auf Noto Sans umgestellt
- Status: erledigt
- Beschreibung:
  - Die normale App-Oberflaeche nutzt jetzt zentral `Noto Sans` als UI-Schrift.
  - Die Print-/PDF-Schriften bleiben unveraendert.
  - TopsScreen, Settings, Projektverwaltung und globale Shell nutzen die gemeinsame UI-Variable.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/index.html`
  - `src/renderer/editor.html`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `src/renderer/ui/HelpModal.js`
  - `src/renderer/ui/ParticipantsModals.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die Tops-Textschrift bleibt als separate Modul-/Top-Regel bestehen; Print bleibt bewusst unberuehrt.

#### Paket: Settings-Übersicht als Accordion poliert
- Status: erledigt
- Beschreibung:
  - Die Settings-Gruppen sind jetzt als einklappbare Accordions umgesetzt.
  - `Allgemein` ist initial offen, die anderen Gruppen starten geschlossen.
  - Kachel- und Gruppentexte sind ruhiger, dunkler und kompakter gestaltet.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die Accordion-Logik speichert keinen Zustand; nach Reload startet die Übersicht wieder mit `Allgemein` offen.
#### Paket: Appweite Button-Styles vereinheitlicht
- Status: erledigt
- Beschreibung:
  - Die App nutzt jetzt einen konsolidierten UI-Button-Stil ueber zentrale Varianten.
  - Buttons wirken ruhiger und konsistenter; Standardaktionen sind dezenter, gefaehrliche Aktionen sind klar als `danger` markiert.
  - Settings, Tops, Projektverwaltung und die allgemeinen Shell-/Modal-Buttons nutzen die gemeinsamen Basisregeln.
  - Print-/PDF-Buttonoptik und Drucklogik blieben bewusst unveraendert.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `src/renderer/ui/HelpModal.js`
  - `src/renderer/ui/ParticipantsModals.js`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Spezielle Fachbuttons behalten ihre jeweiligen Varianten, damit keine Layouts oder Fachaktionen verrutschen.
  - Print/PDF-CSS und Druckausgabe wurden bewusst nicht angefasst.

#### Paket: Button-Styles visuell feiner abgestimmt
- Status: erledigt
- Beschreibung:
  - Die zentrale Buttonbasis wurde optisch feiner und leichter gemacht.
  - Hoehe, Padding, Radius, Schriftgewicht und Hover-Verhalten wurden dezent reduziert.
  - Primary, Secondary, Danger und Ghost bleiben als Varianten erhalten, wirken aber ruhiger.
  - Dialog- und Shell-Buttons nutzen die feinere Basis ohne Funktionsaenderung.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Fachspezifische Button-Layouts mit eigenen Min-Hoehen bleiben bewusst unangetastet.
  - Druck-/PDF-Buttons wurden nicht umgebaut.

#### Paket: Button-Groesse weiter reduziert
- Status: erledigt
- Beschreibung:
  - Die zentrale Buttonbasis ist jetzt deutlich kompakter.
  - Standardbuttons nutzen eine kleinere Hoehe, weniger Innenabstand und eine feinere Schriftgroesse.
  - Die bestehenden Varianten `primary`, `secondary`, `danger` und `ghost` bleiben erhalten, wirken aber leichter.
  - Der kleinere Rasterstand wurde zentral umgesetzt, ohne Klicklogik oder Dialogflows zu aendern.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Einige Fach-Buttons behalten bewusst lokale Minimalhoehen, damit spezialisierte Layouts stabil bleiben.
  - Print-/PDF-Buttons und Drucklogik wurden nicht angefasst.

#### Paket: Zentrale Button-Tokens eingefuehrt
- Status: erledigt
- Beschreibung:
  - Appweite Button-Tokens wurden zentral in den globalen UI-Styles definiert.
  - Die vorhandenen Standardbuttons haengen jetzt an diesen Tokens fuer Hoehe, Padding, Radius, Schrift, Border, Hover, Focus und Disabled.
  - Varianten `primary`, `secondary`, `danger` und `ghost` bleiben erhalten und sind an den zentralen Token-Satz gebunden.
  - Die Button-Optik bleibt kompakt und dezent, ohne Fachlogik oder Druckpfade zu aendern.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Fachspezifische Einzelformen bleiben dort bestehen, wo sie fuer Layout oder Bedienung notwendig sind.
  - Print-/PDF-Stile wurden bewusst nicht mit den Button-Tokens gekoppelt.

#### Paket: Modul-/Feature-/Lizenzmatrix testseitig abgesichert
- Status: erledigt
- Beschreibung:
  - Die Matrix zwischen Fachmodul `Protokoll`, Hilfsfunktion `Diktat / Audio` und Lizenzstatus ist jetzt mit zusaetzlichen Regressionstests abgesichert.
  - Der positive Protokollpfad ist ebenso abgedeckt wie der geblockte Fall mit strukturiertem Payload.
  - Der cached Modulstatus in `moduleAccessState` ist direkt mit Lizenzdaten abgesichert.
  - Projektverwaltung, Settings und Ausgabe-/Mail-/PDF-Guards bleiben weiterhin testseitig getrennt pruefbar.
- Betroffene Dateien:
  - `scripts/tests/protokollProjectEntryRouting.test.cjs`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Es wurden nur Tests ergaenzt; App-Logik blieb unveraendert.

#### Paket: Diktat/Audio-Freischaltung und Mikrofon-Buttons
- Status: erledigt
- Beschreibung:
  - Diktat/Audio wird jetzt ueber das Lizenzfeature `audio`/`diktat` oder den internen Entwicklungsschalter `Diktat-Testfreigabe` freigeschaltet.
  - Die Mikrofon-Buttons im TopsScreen erscheinen nur bei aktiver Freischaltung und zeigen waehrend der Aufnahme einen roten Punkt.
  - Der Entwicklungsschalter sitzt im Entwicklungsdialog und bleibt als Test-/Prueffunktion von normalen Kundenfunktionen getrennt.
  - Die Lizenz- und Settings-Gates wurden so erweitert, dass der neue Schalter im Main-/Renderer-Pfad sauber erkannt wird.
- Betroffene Dateien:
  - `src/main/ipc/audioIpc.js`
  - `src/main/ipc/settingsIpc.js`
  - `src/renderer/features/audio/AudioFeature.js`
  - `src/renderer/features/audio-dictation/DictationController.js`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `scripts/tests/topsScreen.integration.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Es wurde bewusst keine externe Lizenz-App und keine Generator-/Admin-UI in die normale App zurueckgebracht.
  - Die Stop-Logik fuer das Diktat bleibt bei der vorhandenen Audio-Funktionalitaet; der neue Zustand steuert vor allem Sichtbarkeit und Anzeige.
- Der Einstieg `Drucken` oeffnet jetzt zuerst eine Druckart-Auswahl:
  - `Protokoll drucken` fuehrt danach zur gewohnten Auswahl geschlossener Protokolle
  - vorhandene weitere Ausgaben bleiben ueber den ersten Schritt erreichbar, deaktivierte Optionen werden nicht als funktionierend vorgetaeuscht
  - Protokoll-PDF-Vorschau, Firmenliste, ToDo-Liste und TOP-Liste bleiben dabei erreichbar
  - gespeicherte Firmenlisten sind nicht mehr als funktionale Ausgabeart angeboten
  - Firmenliste laeuft direkt ueber den aktuellen Projektstand und braucht keine geschlossene-Protokoll-Auswahl
  - eine separate Mitarbeiter-/Personenliste ist im aktuellen Druckdialog noch nicht als eigener Modus vorhanden

#### Paket: DEV PDF-Layout TOP-Liste (Metablock Innenabstand speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Metablock-Innenabstand (Print-HTML Vorschau, DEV-only) wird beim Speichern jetzt ueber `protokoll_tops` in der bestehenden `tableLayouts`-Sanitization mitgetragen und nach Neustart wieder angewendet.
  - Reset stellt Breite und Innenabstand wieder auf Standard zurueck.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: PDF-Metablock-Innenabstand ebenfalls in der Toolbar als gespeicherter Default nach Save aktualisieren (rein kosmetisch)
- Risiken/Hinweise:
  - Keine PDF-Export-Logik angepasst; Markierungen bleiben DEV-only in der HTML-Vorschau.

#### Paket: PDF-Vorschau bei offener Besprechung erlauben (ohne finalen Druck freizugeben)
- Status: erledigt
- Beschreibung:
  - Die Sperre "Druck nur fuer geschlossene Besprechungen" greift jetzt nur noch beim finalen Protokolldruck.
  - PDF-Vorschau/Vorabzug und DEV-Layout-Preview werden bei offener Besprechung nicht mehr blockiert.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Kein Umbau der Drucklogik; nur die Blockierbedingung wurde um `preview` ergaenzt.

#### Paket: DEV-Layout-Preview auch in Protokoll-PDF-Vorschau wieder aktiv
- Status: erledigt
- Beschreibung:
  - Bei `printMeetingPreview` (Protokoll-PDF-Vorschau) wird im DEV-Channel wieder zusaetzlich das interaktive Print-HTML-Preview geoeffnet, damit Layout-Zonen/Toolbar aktiv sind, ohne den echten PDF-Export zu beeinflussen.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Nur DEV-only Zusatzfenster; STABLE bleibt ohne Layout-Werkzeuge.

#### Paket: DEV PDF-Layout Reset setzt wieder echte Standards (TOP-Liste Metablock)
- Status: erledigt
- Beschreibung:
  - Reset in der DEV-Print-HTML Vorschau nutzt jetzt fuer Breite/Innen die Werte aus `defaultLayout` (nicht aus `effectiveLayout`), damit nach vorherigem Speichern der Reset wirklich auf Standard zurueckgeht.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Nur Reset-/Default-Handling im DEV-Preview angepasst; Speichern/Laden bleibt ueber `tableLayouts` unveraendert.

#### Paket: DEV PDF-Layout TOP-Liste (Metablock Schrift speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Metablock speichert jetzt zusaetzlich zur Breite und zum Innenabstand auch die Schriftgroesse ueber `pdf.rootVars.--bbm-top-col-meta-font-size`.
  - Reset stellt Breite/Innen/Schrift wieder auf die echten Standardwerte aus `defaultLayout`.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Schrift wird aktuell als `px` gespeichert (Toolbar-Schrittweite 1px); CSS akzeptiert das auch im Print-HTML Preview.

#### Paket: DEV PDF-Layout TOP-Liste (Nummernblock live, ohne Speichern)
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML Vorschau lassen sich fuer den PDF-Nummernblock jetzt Breite (mm), Innen (mm) und Schrift (pt) live einstellen.
  - Keine Speicherung/kein Reset fuer Nummernblock in diesem Schritt; beim Neuoeffnen ist wieder Standard aktiv.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Speicherung/Reset fuer Nummernblock analog Metablock (separater Meilenstein)
- Risiken/Hinweise:
  - Die Nummernblock-Innenaenderung setzt aktuell `padding-left` inline auf `th/td.colNr` (nur im laufenden Preview).

#### Paket: DEV PDF-Layout TOP-Liste (Nummernblock speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Nummernblock speichert jetzt Breite (ueber `columns[].pdfWidth`/`pdfNumberWidth`), Innenabstand (ueber `pdf.rootVars.--bbm-top-col-nr-padding-left`) und Schrift (ueber `pdf.rootVars.--bbm-top-col-nr-font-size`).
  - Reset stellt die Werte wieder auf Standard zurueck und wendet sie sofort sichtbar an.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Die Hauptschriftgroesse des Nummernblocks ist jetzt per CSS-Variable steuerbar; Datum/Hinweis werden im Preview proportional per Inline-Style mitgefuehrt.

#### Paket: DEV PDF-Layout TOP-Liste (Textblock live, ohne Speichern)
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML Vorschau laesst sich der PDF-Textblock live einstellen: Innen (mm) und Schrift (pt).
  - Breite bleibt gesperrt als "Restbereich" (keine direkte Textblock-Breitenverstellung).
  - Keine Speicherung/kein Reset fuer Textblock in diesem Schritt.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Textblock speichern/reset (separater Meilenstein)
- Risiken/Hinweise:
  - Text-Schrift wird live per Inline-Style auf `.shortText/.longText` gesetzt (nur im laufenden Preview).

#### Paket: DEV PDF-Layout TOP-Liste (Textblock speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Textblock speichert jetzt Innenabstand (pdf.rootVars text padding left/right) und Schriftgroesse (pdf.rootVars `--bbm-top-col-text-font-size`).
  - Textblock-Breite bleibt "Restbereich" und wird nicht gespeichert.
  - Reset stellt die Standardwerte aus `defaultLayout` wieder her und wendet sie sofort sichtbar an.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der UI-Regler "Innen" setzt beim Speichern aktuell links und rechts symmetrisch; Standard-Reset stellt die urspruenglichen Default-Werte (0 / 1.5mm) wieder her.

#### Paket: Refactor 1 (DevLayoutToolbar zentralisieren)
- Status: erledigt
- Beschreibung:
  - `DevLayoutToolbar` wurde aus dem Protokoll-Modul in ein zentrales Hilfsmodul verschoben: `src/renderer/layoutTools/DevLayoutToolbar.js`.
  - Protokoll (TopsHeader/TopsList) importiert die Toolbar jetzt aus dem neuen Pfad; Verhalten bleibt gleich.
  - Tests wurden minimal angepasst, damit `npm test` nach den CSS-Variablen-Umstellungen weiterhin gruen laeuft (keine Verhaltensaenderung).
- Betroffene Dateien:
  - `src/renderer/layoutTools/DevLayoutToolbar.js`
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `scripts/tests/tableLayoutRegistry.test.cjs`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Keine funktionalen Aenderungen beabsichtigt; Bitte kurz manuell pruefen: TOP-UI Layout-Toolbar erscheint im DEV-Modus wie vorher.

#### Paket: Refactor 2 (TOP-Zonen aus DevLayoutToolbar auslagern)
- Status: erledigt
- Beschreibung:
  - TOP-spezifische Zonendefinitionen (Keys/Labels/Controls) wurden in eine Surface-Datei ausgelagert:
    `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`.
  - `DevLayoutToolbar` ist jetzt surface-getrieben und enthaelt keine TOP-spezifischen Labels/Zonen mehr (Fallback bleibt fuer Kompatibilitaet).
  - Protokoll bindet die Toolbar wie vorher ein; Verhalten bleibt gleich.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`
  - `src/renderer/layoutTools/DevLayoutToolbar.js`
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Keine Verhaltensaenderung beabsichtigt; nur Zonendefinition/Labels umgezogen.

#### Paket: DEV layoutTools Auto-Erkennung fuer einfache PDF-Tabellen
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML-Vorschau werden einfache Tabellen jetzt automatisch als layoutfaehige Surfaces erkannt, sofern sie `thead/th` oder `colgroup/col` haben und keine manuellen layoutTools-Marker tragen.
  - Manueller Protokoll-Stand bleibt priorisiert; TOP-Liste und Teilnehmerliste behalten ihre bisherigen Zonen.
  - Auto-Surfaces sind anklickbar und werden im DEV-Layoutmodus gruen markiert; echte PDF-Ausgaben bleiben markerfrei.
- Betroffene Dateien:
  - `src/renderer/layoutTools/autoTableLayout.mjs`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `scripts/test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Persistenz/Speicherpfad fuer stabile neue Auto-Surfaces vorbereiten, wenn ein echter stabiler `tableKey` feststeht
- Risiken/Hinweise:
  - Auto-Erkennung bleibt heuristisch und absichtlich konservativ; komplexe Karten-/Sonderlayouts werden weiterhin nicht automatisch als Layout-Surface behandelt.

#### Paket: DEV Layout-Einstieg ToDo-Vorschau
- Status: erledigt
- Beschreibung:
  - Der DEV-only Vorschauweg fuer `mode: "todo"` nutzt jetzt ebenfalls `print:openHtmlPreview` mit `devLayoutPreview`.
  - Normale ToDo-PDF-Erzeugung bleibt unveraendert; der neue Weg ist nur fuer die Layout-HTML-Vorschau gedacht.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der neue Einstieg bleibt bewusst DEV-only und greift nicht in die fertige PDF-Erzeugung ein.

#### Paket: DEV Auto-Tabellen Live-Regler
- Status: erledigt
- Beschreibung:
  - Fuer automatisch erkannte einfache PDF-Tabellen in der DEV-Print-HTML-Vorschau funktionieren jetzt generische Live-Regler fuer Breite, Innenabstand und Schriftgroesse.
  - Die Werte bleiben bewusst nur im laufenden Vorschau-Tab wirksam; es gibt noch keine Speicherung oder Reset-Funktion fuer Auto-Tabellen.
  - Manuelle Surfaces wie TOP-Liste und Teilnehmerliste behalten Vorrang und ihr bisheriges Verhalten bleibt erhalten.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: falls spaeter ein stabiler `tableKey` fuer weitere Auto-Tabellen feststeht, kann ein Persistenzpfad separat vorbereitet werden
- Risiken/Hinweise:
  - Die Auto-Regler greifen nur auf einfache erkannte Tabellen in DEV; komplexe Karten-/Sonderlayouts bleiben ausgeschlossen.

#### Paket: DEV Auto-Tabellen Persistenz
- Status: erledigt
- Beschreibung:
  - Automatisch erkannte einfache PDF-Tabellen koennen ihre aktiven Auto-Zonen jetzt generisch speichern und zuruecksetzen.
  - Die Persistenz nutzt einen stabil abgeleiteten `print.*`-Surface-Key pro Preview-Tabelle; TOP-Liste und Teilnehmerliste bleiben unveraendert.
  - Live-Regler bleiben bestehen und Auto-Layouts werden beim Oeffnen der DEV-Vorschau wieder geladen.
- Betroffene Dateien:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/renderer/print/printApp.js`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: fachlich weitere komplexe PDF-Tabellen pruefen, bevor neue Auto-Surfaces in groesserem Umfang entstehen
- Risiken/Hinweise:
  - Der Auto-Key ist bewusst generisch; bei mehreren Tabellen derselben Klasse bekommt die spaetere Instanz einen stabilen Suffix, um Vermischung zu vermeiden.

#### Paket: DEV Auto-Layout Export
- Status: erledigt
- Beschreibung:
  - Im DEV-Layoutmodus kann die aktive Surface/Tabelle jetzt als lesbarer JSON-/Code-Snippet-Export ausgegeben werden.
  - Der Export kopiert den Snapshot in die Zwischenablage und zeigt ihn ueber den nativen Dialog an, ohne Standardlayout-Dateien automatisch zu aendern.
  - STABLE bleibt ohne layoutTools-Bedienung; manuelle Surfaces und Auto-Tabellen behalten ihr bisheriges Verhalten.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: den Export bei Bedarf noch um eine separate Datei-Ablage erweitern, falls spaeter ein manueller Copy/Paste-Workflow nicht reicht
- Risiken/Hinweise:
  - Der Export ist absichtlich nur ein Snapshot-Hilfsweg fuer Entwickler und fuehrt keine Code-Aenderung an den Standardlayout-Dateien aus.

#### Paket: ToDo-Standardlayout aus Exportwerten fest �bernommen
- Status: erledigt
- Beschreibung:
  - Die exportierten Kalibrierwerte fuer `print.todo.todoTable` sind jetzt als Standardlayout fuer die ToDo-PDF-Vorschau im Code hinterlegt.
  - Ohne gespeicherte Entwicklerwerte greifen die neuen Standardwerte; vorhandene gespeicherte DEV-Werte behalten Vorrang.
  - Auto-Erkennung, Live-Regler, Export sowie manuelle Surfaces wie TOP-Liste und Teilnehmerliste bleiben unveraendert.
- Betroffene Dateien:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/renderer/print/printApp.js`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Das Standardlayout ist bewusst nur fuer die ToDo-PDF-Surface `print.todo.todoTable` hinterlegt und greift nicht auf andere Tabellen ueber.

#### Paket: DEV Layoutmodus-Schalter fuer PDF-Vorschau
- Status: erledigt
- Beschreibung:
  - Die DEV-PDF-Layout-Vorschau wurde vom lokalen AN/AUS-Schalter wieder entkoppelt und folgt jetzt dem zentralen DEV-Flag aus den Einstellungen.
  - Im Zustand AN sind Toolbar, Marker und Zonenbedienung sichtbar; im Zustand AUS bleibt die Layout-Toolbar verborgen, waehrend die gespeicherten Layoutwerte weiterhin angewendet bleiben.
  - STABLE und echte PDF-Ausgaben bleiben unveraendert und markerfrei.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der Schalter ist bewusst nur in den DEV-Einstellungen vorhanden und steuert nur die Sichtbarkeit/Bearbeitbarkeit der laufenden Vorschau, nicht die gespeicherten Werte.

#### Paket: DEV Layout-Kalibrierung zentral in Einstellungen
- Status: erledigt
- Beschreibung:
  - Die aktive Layout-Kalibrierung wird jetzt zentral in den Einstellungen per DEV-Checkbox gesteuert und per App-Settings-Broadcast an Renderer und PDF-Vorschauen verteilt.
  - Die lokale Preview-Schaltfl�che wurde aus dem laufenden PDF-Workflow entfernt; stattdessen reagieren TopsScreen, Print-HTML-Vorschau und Auto-Tabellen auf den zentralen Zustand.
  - STABLE sieht den Schalter nicht, und echte PDFs bleiben markerfrei.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/layoutTools/layoutCalibrationState.js`
  - `src/renderer/app/Router.js`
  - `src/main/ipc/settingsIpc.js`
  - `src/main/preload.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der Broadcast-Mechanismus ist bewusst leichtgewichtig; falls spaeter weitere Layout-Renderer hinzukommen, sollten sie denselben zentralen Zustand aus der App-Settings-Quelle lesen.

#### Paket: Notfall-Stabilisierung layoutTools deaktiviert
- Status: erledigt
- Beschreibung:
  - Die Layout-Kalibrierung ist aus dem aktiven Laufweg entfernt und wird nicht mehr als normale Bedienfunktion angeboten.
  - Der Entwicklungs-Dialog zeigt keinen aktiven Layout-Kalibrierungs- oder Tabelleneditor-Einstieg mehr.
  - Der interaktive Print-HTML-Layoutweg ist aus den normalen Druckeinstiegen entfernt.
  - Protokoll-PDF, TOP-Liste, ToDo und Teilnehmerliste laufen wieder ohne aktive Toolbar, Marker oder Layoutfenster.
  - Die tableLayouts-Infrastruktur bleibt als Codebasis vorhanden, ist im aktuellen Laufweg aber nicht mehr aktiv.
- Betroffene Dateien:
  - `src/renderer/layoutTools/layoutCalibrationState.js`
  - `src/main/ipc/printIpc.js`
  - `src/main/preload.js`
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - Editor 1 spaeter neu konzipieren, falls wieder ein sauberer, entkoppelter Kalibrierweg benoetigt wird.
- Risiken/Hinweise:
  - Der technische Unterbau fuer tableLayouts bleibt im Code vorhanden, wird aber durch die normale App nicht mehr als aktiver Einstieg genutzt.

#### Paket: TOP-Toolbar aus dem aktiven Laufweg entfernt
- Status: erledigt
- Beschreibung:
  - Die sichtbare Layout-Toolbar aus der TOP-Liste wurde aus `TopsHeader` entfernt.
  - Die Layout-Zonenbedienung in der TOP-Liste wurde aus `TopsList` und `TopsScreen` entkoppelt, so dass keine aktiven Marker/Click-Zonen mehr erscheinen.
  - `layoutTools`-Schalter und Toolbar-Callbacks laufen im TOP-Screen nicht mehr an.
  - Normale TOP-Bedienung, Bearbeitung und PDF-Ausgabe bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Die technische layoutTools-Basis bleibt als Code im Repo, ist aber im TOP-Laufweg nicht mehr aktiv verdrahtet.

#### Paket: Whisper-Modellstrategie fuer DEV und Produktivbuild stabilisiert
- Status: erledigt
- Beschreibung:
  - Der Main-Service nutzt jetzt `small`/`balanced` als Defaultmodell.
  - Die vorhandenen Whisper-Qualitaeten `fast`/`balanced`/`best`/`large` bleiben einzeln waehlbar.
  - Wenn das gewaehlte Modell fehlt und `ggml-small.bin` vorhanden ist, faellt die Transkription auf `small` zurueck.
  - Fehlt auch `ggml-small.bin`, liefert der Main-Service eine klare Fehlermeldung statt still zu scheitern.
  - Die Whisper-Engine schaut zusaetzlich in `userData/audio/models` nach Modellen.
  - Produktive Builds packen nur noch `ggml-small.bin`; `ggml-base.bin`, `ggml-medium.bin` und `ggml-large.bin` werden nicht mehr automatisch mitgeliefert.
  - Die Audio-Tests decken Default, Mapping, Fallback, User-Model-Pfad und Packaging-Regel ab.
- Betroffene Dateien:
  - `src/main/services/audio/TranscriptionService.js`
  - `src/main/services/audio/engines/WhisperCppEngine.js`
  - `src/renderer/modules/audio/ui/createDictationDevSection.js`
  - `package.json`
  - `scripts/tests/audioModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - DEV- und Produktivsichtung im laufenden App-Kontext mit vorhandenem und optional userseitig abgelegtem Whisper-Modell.
- Risiken/Hinweise:
  - `npm test` ist in dieser Umgebung weiterhin durch das bereits bekannte `better-sqlite3`-Native-Modul blockiert; die Audio-Subtests selbst laufen gruen.
- Restarbeiten M5 ist jetzt umgesetzt:
  - Restarbeiten koennen neu angelegt, ausgewaehlt und in einer Editbox-Grundform bearbeitet werden
  - Speichern laedt die Liste erneut und haelt die Auswahl konsistent
  - Foto-/Diktat-/Druck-/Mail-/Loesch- und Archivpfade bleiben ausserhalb dieses Pakets
  - `npm test` laeuft gruen

- M9 ist abgeschlossen: Der M8-Fotoimport speichert Attachments jetzt IPC-seitig DB-konform mit `project_id` ueber `addRestarbeitAttachment(...)`; der zugehoerige M8-Test erzwingt den Repo-Vertrag (`restarbeit_id`, `project_id`, `file_path`) und prueft die erwarteten Attachment-Felder.

- M12 Restarbeiten-Liste fachlich layoutet:
  - 4-spaltige Tabelle blieb erhalten; Verortung als 2-zeilige Metaspalte.
  - Status-Metaspalte mit Klasse, Status, Fertig bis, Verantwortlich und Ampel (inkl. testbarem data-ampel).
  - modulnahe Style-Injektion fuer Restarbeiten-Liste hinzugefuegt.
- Naechster offener Schritt: fachliche Sichtpruefung der M12-Listenoptik im UI.

- M13 Restarbeiten-Startbutton ist umgesetzt:
  - Projekt-Arbeitsbereich zeigt jetzt auch `Restarbeiten`, wenn das Modul freigeschaltet ist
  - der Button startet ueber den vorhandenen Projektmodulpfad (`openProjectModule`)
  - Protokoll- und Projektfirmen-Einstieg bleiben unveraendert

- Hotfix M13.1: Restarbeiten-Button ist jetzt auch direkt auf der Projektkachel sichtbar und startet �ber openProjectModule.

- M30 Restarbeiten-Datenbasis erweitert:
  - `completed_at` und `completion_note` in Schema/Repo/Create/Update erg�nzt.
  - `deleted_at` additiv erg�nzt; Soft Delete als eigener Repo-/IPC-/Preload-/DataSource-Pfad vorbereitet.
  - Standard-Listenpfad blendet soft-gel�schte RP aus; optionaler Include-Flag bleibt f�r Rohzugriffe m�glich.
  - RP-Nummernlogik bleibt stabil ohne Wiederverwendung (Soft-Delete-Datens�tze z�hlen weiterhin in `MAX(running_number)`).
  - keine sichtbare UI-�nderung.
