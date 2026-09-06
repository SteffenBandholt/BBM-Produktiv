# 01 – Repository-Bestandsaufnahme BBM-Produktiv

## Status
**Verbindlicher Revisionsstand**

Untersuchte Basis:
- Repository: `SteffenBandholt/BBM-Produktiv`
- Branch: `main`
- Commit: `795517681f48a490e94dcc548bf334a3431a9cb5`
- Stand des untersuchten Commits: 04.09.2026

Diese Bestandsaufnahme ist die verbindliche Ausgangsbasis für die weitere BBM-Revision. Sie beschreibt den Ist-Zustand und die daraus folgende Revisionsrichtung. Sie ist keine Freigabe für pauschale Löschungen oder Massenumbauten.

## 1. Gesamtbefund
BBM-Produktiv ist bereits eine umfangreiche Electron-Desktopanwendung mit SQLite-Datenhaltung, Projektverwaltung, Protokoll, Restarbeiten, Rechnung, Lizenzverwaltung, PDF-/Drucksystem, Audio-/Whisper-Anbindung, UI-Editor-Infrastruktur und umfangreicher Testabdeckung.

Die Revision ist deshalb **kein Neuaufbau**. Hauptaufgabe ist die kontrollierte Konsolidierung historisch gewachsener Parallelbestände.

## 2. Technische Basis
- Electron Desktop
- Paketname `baubesprechungs-manager`
- Version `1.5.0`
- Einstieg `src/main/main.js`
- CommonJS als Grundmodus, ergänzt um `.mjs`/ESM-Dateien
- SQLite über `better-sqlite3`
- Packaging über `electron-builder`
- Windows/NSIS als Produktziel
- GitHub Actions mit Node 20, `npm ci`, `npm test`

Wichtige Build-Abhängigkeiten:
- `ui-editor-kit` ist aktuell als lokale Dateireferenz `file:../UI-Editor-kit` eingebunden.
- Der Build erwartet lokale Whisper-, FFmpeg- und Modelldateien unter `dev/...`.

Diese externen/lokalen Abhängigkeiten sind bei Build-, Release- und CI-Revision ausdrücklich zu berücksichtigen.

## 3. Aktuelle Modulrealität
`src/main/module-registry.json` führt technisch:
- `protokoll` – `project`
- `restarbeiten` – `project`
- `rechnung` – `hybrid`

Gemeinsame Services:
- `pdf`
- `mail`
- `export`
- `file-storage`
- `ui-editor`
- `audio`

`SiGeKo` ist fachlich bereits umfangreich geplant und dokumentiert, aber im produktiven `src/renderer/modules/` noch nicht implementiert.

## 4. Produktiver Kern – grundsätzlich beibehalten
Folgende Bereiche bilden bereits einen realen gemeinsamen BBM-Kern und werden nicht neu erfunden:
- Electron Main/Preload
- SQLite-Datenhaltung, Repositories und Migrationen
- CoreShell, Router, Navigation, Modulkatalog und Modulrahmen
- Projektverwaltung
- gemeinsame Firmen-/Personen-/Projektzuordnungen
- Einstellungen/Nutzerprofil als zentrale Infrastruktur
- Lizenzierung und Feature Guards
- Datei-/Speicherortlogik
- PDF/Druck/Export als gemeinsame Dienste
- Mail als gemeinsamer Dienst
- Audio/Whisper als gemeinsamer Dienst
- UI-Editor-Anbindung als gemeinsame Infrastruktur

## 5. Protokoll / TOPS
Es bestehen parallele Strukturen unter:
- `src/renderer/modules/protokoll/`
- `src/renderer/tops/`

Im Protokollmodul existieren zahlreiche sehr kleine Weiterleitungs-/Kompatibilitätsdateien sowie leere vorbereitete Strukturordner mit `.gitkeep`.

Bewertung: **Übergangsbestand**.

Revisionsregel:
- keinen Pfad ungeprüft löschen,
- Imports und reale Laufzeitnutzung zuerst klären,
- anschließend genau einen kanonischen fachlichen Pfad festlegen.

Die Detailbereinigung gehört in Revision 03 – Protokoll.

## 6. Restarbeiten
Es bestehen parallel:
- `src/renderer/modules/restarbeiten/`
- `src/renderer/modules/restarbeitenV2/`

Der reguläre Bestand ist umfangreich und produktnah. `restarbeitenV2` enthält vor allem Read-only-, Mapper-, Legacy-Bridge- und Datenquellenlogik.

Bewertung: **Migrations-/Übergangsschicht prüfen**.

Revisionsregel:
- feststellen, ob V2 noch eine echte Laufzeitaufgabe besitzt,
- erst danach archivieren, integrieren oder entfernen.

Die Detailbereinigung gehört in Revision 04 – Restarbeiten.

## 7. Rechnung
Das Rechnungsmodul besitzt bereits reale Substanz, unter anderem:
- Service- und Repositorylogik
- Migrationen
- IPC
- Rechnungs- und Designscreen
- PDF-/Printbestand
- Positions- und Headerregeln
- umfangreiche Tests

Bewertung: **implementierter Fachbestand**, kein reiner Entwurf.

Revision 06 muss deshalb vom vorhandenen Implementierungsstand ausgehen und darf Rechnung nicht neu erfinden.

## 8. SiGeKo
Für SiGeKo existiert ein fachlich umfangreicher Planungs- und Issue-Bestand. Im produktiven Modulordner existiert derzeit aber noch kein SiGeKo-Fachmodul.

Bewertung: **Planung vorhanden, Implementierung noch offen**.

Revision 05 muss den bereinigten BBM-Core wiederverwenden und darf Projekt-, Firmen-, PDF-, Mail-, Datei- oder UI-Editor-Grundfunktionen nicht fachmodulspezifisch duplizieren.

## 9. PDF / Druck
PDF- und Druckfunktionalität ist aktuell auf mehrere Bereiche verteilt:
- `src/main/print/`
- `src/renderer/print/`
- `src/renderer/print/v2/`
- `src/renderer/print/headerTest/`
- `src/renderer/modules/drucklayout/`
- `src/renderer/modules/ausgabe/`
- fachmodulspezifische PDF-/Printadapter

Bewertung: **produktive gemeinsame Funktion mit stark verteiltem Bestand**.

Revisionsziel:
- gemeinsamen Core klar abgrenzen,
- bestehenden Satz-/PDF-Weg erhalten,
- keine zweite PDF-Engine aufbauen,
- Test-/Entwicklungsbestand sauber vom produktführenden Pfad trennen.

## 10. UI-Editor
Für denselben Themenkomplex existieren mehrere historische und aktuelle Ebenen:
- `.ui-editor-kit/`
- `uiEditor/`
- `src/ui-editor/`
- `src/main/ui-editor/`
- `src/renderer/uiEditor/`
- `src/renderer/ui-editor/`
- `src/renderer/editorRuntime/`
- `src/renderer/uiInspector/`
- `src/renderer/uiV2/`
- umfangreiche M5x–M8x-Dokumentation

Bewertung: **größter struktureller Konsolidierungskandidat**.

Revisionsziel:
- produktführende Integration eindeutig bestimmen,
- historische Entwicklungs-, Inspector-, Pilot- und V2-Pfade kennzeichnen,
- gemeinsame Infrastruktur nicht in Fachmodulen duplizieren.

## 11. Firmen / Personen / Projekte
Die gemeinsame Domäne ist bereits breit implementiert und umfasst zentrale sowie projektbezogene Firmen/Personen und Zuordnungen.

Bewertung: **BBM-Core**.

Diese Domäne darf nicht in Protokoll, Restarbeiten, Rechnung oder SiGeKo jeweils erneut aufgebaut werden.

## 12. Lizenzierung
Das Lizenzsystem ist real implementiert mit:
- Geräteidentität
- Lizenzprüfung
- Feature Guards
- Lizenzspeicher
- Adminservice
- Entwicklungs-Lizenzprovider
- IPC
- UI
- umfangreichen Tests

Nachweisbarer Doppelbestand:
- `tools/license-app/extracts/licenseAdminService.js`
- `src/main/licensing/licenseAdminService.js`

Beide besitzen denselben Git-Blob-Inhalt.

Bewertung: **Core plus gezielter Dublettenprüfpunkt**.

## 13. Audio / Whisper
Audio/Diktat ist real implementiert und nutzt lokale Whisper-/FFmpeg-Komponenten.

Bewertung: **gemeinsamer Dienst / Core**, nicht Besitz des Protokollmoduls.

## 14. Tests und CI
Es existiert eine umfangreiche automatisierte Testsuite für nahezu alle größeren Bereiche.

Wichtig:
- Die Bestandsaufnahme weist vorhandene Tests nach.
- Ein aktueller kompletter Testlauf auf dem untersuchten Commit wurde im Rahmen dieser Bestandsaufnahme nicht ausgeführt.
- Daher wird **nicht** behauptet, dass der gesamte aktuelle Stand grün ist.

Aktuelle CI:
- Ubuntu
- Node 20
- `npm ci`
- `npm test`

Offene CI-Lücke:
- kein eigener Windows-Build-/Packaging-Nachweis,
- kein NSIS-/Installer-Smoke-Test,
- kein vollständiger produktnaher Windows-CI-Nachweis.

## 15. Dokumentation
Der Dokumentationsbestand ist sehr groß und teilweise historisch parallelisiert.

Auffällig:
- `STATUS.md` ist sehr groß und fungiert teilweise als Entwicklungsjournal.
- Mehrere gleichnamige Dokumente existieren sowohl direkt unter `docs/` als auch unter `docs/ui-editor/`.
- `ARCHITECTURE.md` und `ARCHITEKTUR.md` existieren parallel.
- `docs/_archiv/` ist bereits vorhanden und soll für historische Unterlagen weiter genutzt werden.

Revisionsregel:
- führende Dokumente ausdrücklich kennzeichnen,
- historische Unterlagen archivieren statt ungeprüft löschen,
- widersprüchliche Aussagen durch den aktuellen Revisionsstand ersetzen.

## 16. Nachweisbare Dubletten / Bereinigungskandidaten
Byte-identische bzw. klare Kandidaten sind unter anderem:
- mehrere identische BBM-PNG-Dateien unter verschiedenen Namen/Pfaden
- identische BBM-ICO-Dateien
- identische Red-Flag-PNGs
- identische Todo-PNGs
- `tools/license-app/extracts/licenseAdminService.js` identisch mit dem produktiven Licensing-Service
- `start.log` im Repository
- `src/renderer/assets/bbm-icon - Kopie.ico`

Diese Punkte sind **Prüfkandidaten**, keine pauschale Löschfreigabe.

## 17. Große Wartungs-Hotspots
Besonders große Einzeldateien sind unter anderem:
- `src/renderer/views/SettingsView.js` ca. 268 KB
- `src/renderer/print/printApp.js` ca. 165 KB
- `src/renderer/views/FirmsLegacyView.js` ca. 155 KB
- `src/renderer/modules/ausgabe/PrintModal.js` ca. 130 KB
- `src/renderer/ui/MainHeader.js` ca. 116 KB
- mehrere Testdateien über 100 KB

Diese Größen sind kein automatischer Fehler, markieren aber prioritäre Wartungs- und Konsolidierungsprüfpunkte.

## 18. Branch- und Integrationslage
Das Repository besitzt eine große Zahl historischer und paralleler Entwicklungsbranches.

Verbindliche Regel vor endgültiger Bereinigung:
- `main` ist Produktivbasis,
- relevante aktive Entwicklungsbranches vor Lösch-/Konsolidierungsentscheidungen prüfen,
- gemeinsame Infrastruktur nicht fachmodulspezifisch duplizieren,
- historische Branches nicht automatisch als aktuelle Quelle der Wahrheit behandeln.

## 19. Verbindliche Revisionsklassifikation ab Schritt 02
Jeder relevante Bereich wird genau einer Klasse zugeordnet:
1. **BEHALTEN**
2. **KONSOLIDIEREN**
3. **LEGACY PRÜFEN**
4. **SPÄTER**

Erst nach dieser Einordnung erfolgen strukturelle Änderungen oder Löschungen.

## 20. Reihenfolge der weiteren Revision
1. **02 – BBM-Core / gemeinsame Funktionen**
   - Besitzgrenzen und Core-Landkarte festlegen
2. **03 – Protokoll**
   - Protokoll/TOPS-Übergangsbestand konsolidieren
3. **04 – Restarbeiten**
   - produktiven Bestand und V2-Migrationsschicht klären
4. **05 – SiGeKo**
   - auf bereinigtem Core technisch anbinden
5. **06 – Rechnung**
   - vorhandenen Implementierungsstand konsolidieren und weiterführen
6. **07 – BBM Mobil**
   - auf den bereinigten gemeinsamen Strukturen aufsetzen

## 21. Verbindliches Ergebnis
BBM-Produktiv muss nicht neu aufgebaut werden. Der vorhandene produktive Kern ist zu erhalten und schrittweise zu entwirren.

Leitlinie:
- **bestehende Funktion erhalten**,
- **Parallelbestand konsolidieren**,
- **Legacy erst nach Nachweis entfernen**,
- **gemeinsame Funktionen zentral halten**,
- **Fachmodule klar voneinander trennen**,
- **keine neue Architektur erfinden, wenn die vorhandene tragfähig ist**.

Steuerungs-Issue: #268
Folgepunkt Core-Abgrenzung: #269
