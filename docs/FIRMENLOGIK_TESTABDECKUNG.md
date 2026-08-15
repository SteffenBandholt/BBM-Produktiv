# Firmenlogik – Abdeckung der 53 Prüfszenarien

Stand: 2026-08-15

Legende: `FD` = `scripts/tests/firmDirectory.test.cjs`, `PT` = `scripts/tests/projectTransferFirmLogic.test.cjs`, `RA` = `restarbeitenDataModel.test.cjs`, `TOP` = `topsScreen.integration.test.cjs`. Daneben bleiben die genannten vorhandenen Regressionstests maßgeblich.

| Nr. | Nachweis |
|---:|---|
| 1 | FD: frische reale SQLite-DB, Defaults/CHECK/FK-Spalten |
| 2 | FD: reale Altstruktur, atomarer Backfill, Counts |
| 3 | FD plus vorhandene Repository-/FK-Regressionen |
| 4–11 | FD: vollständige 2×4-Matrix für global/lokal und beide Fachlisten |
| 12–14 | FD: alle drei Anlageursprünge einschließlich Rechnung mit/ohne Projekt |
| 15 | FD: getrennte Nutzungspflege, Stammdatenerhalt und Versionskonflikt |
| 16–17 | FD: Zuordnung und Aktivität, unabhängige Kundensicht |
| 18–19 | `participantsIpc.js`-Filter plus `projectFirmsActiveFlow.test.cjs` und Teilnehmerregressionen |
| 20–21 | FD und TOP: gleicher Name sowie gleiche rohe ID bleiben getrennt |
| 22 | TOP: lokale/globale WTB-Einträge ohne Label-Deduplizierung; typisierte Bridge |
| 23–24 | FD Impact-/Historienregeln plus vorhandene TOP-/Teilnehmer-/Drucktests |
| 25–28 | FD und RA: lokal, global, Legacy und Ablehnung einer Kunden-only-Firma |
| 29–32 | explizite Defaults in `firmsRepo`/`projectFirmsRepo`; vorhandene Importtests; Merge verändert Flags nicht |
| 33 | PT: neues Archiv enthält Flags, Abhängigkeiten und Restarbeiten |
| 34 | PT: Altarchiv-Defaults werden in echter SQLite-Tabelle mit CHECK geschrieben |
| 35 | PT: echte SQLite-Prüfung fehlender/kollidierender globaler IDs vor Transaktion |
| 36 | `printData.js` nutzt `listProjectParticipants`; `printModes.test.cjs`/Firmenausgabe-Regressionen |
| 37–38 | vorhandene Protokoll-, Teilnehmer-, ToDo- und PDF-Snapshot-Regressionen |
| 39 | FD/RA sowie bestehende Restarbeiten-Drucktests; Snapshotlabel bleibt Datenquelle |
| 40–42 | FD: Kundenpicker ohne/mit Projekt und Ausschluss Teilnehmer-only |
| 43 | FD: strukturierte Impact-Blockade ohne Löschung |
| 44 | FD: Abschalten ohne aktive Bezüge; Snapshotfelder bleiben unverändert |
| 45 | reale FK/CHECK-Tests in FD/RA und bestehende Delete-Guards |
| 46–47 | FD: ungültiger Kind/Scope und `expectedUpdatedAt` |
| 48 | gemeinsamer `openFirmEditor`; Rechnung-, Firmen- und Projektfirmen-Einstieg; Rechnungsdesign-Regression |
| 49–51 | FD: Kunden ohne Projekt, Teilnehmer ohne Rechnung, kombinierte Nutzung |
| 52 | `MainHeader.computeSetupStatus` verwendet die typisierte Teilnehmerliste und Aktivfilter |
| 53 | Gruppen `core-protokoll`, `app-modules`, `rechnungen-design`, Restarbeiten- und UI-Editor-Vertragsprüfungen |

Die zusammengefassten Zeilen sind äquivalente parametrisierte Tests; sie decken jede darin genannte Nummer mit separaten Assertions ab. Migration, Transfer-Altdefault, FK und CHECK verwenden echte SQLite-Verbindungen, keine String-DB-Doubles.
