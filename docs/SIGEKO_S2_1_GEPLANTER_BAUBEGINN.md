# S2.1 – Geplanter Baubeginn: zentrale Persistenz

Grundlagen: Gesamtplan #277, SiGeKo #274, vollständig abgenommenes S1,
main `b3faf6e` nach PR #324. Integration: [PR #325](https://github.com/SteffenBandholt/BBM-Produktiv/pull/325).
Dieses Paket ergänzt ausschließlich die technische
Speicherung des geplanten Baubeginns. Primär Container 3 (zentrale
Projektdomäne), Prüfung in Container 6. Keine editorrelevante Ausgabe, keine
neue UI-/PDF-Struktur und keine manuelle UI-Abnahme erforderlich.

## Datenvertrag

`projects.geplanter_baubeginn` ist ein optionales zentrales Feld (`TEXT`, NULL
zulässig, kein Default). Bestehende Datensätze bekommen NULL, ohne Ableitung
oder Übernahme aus `start_date`, `end_date` oder anderen Projektdaten. Diese
Felder behalten ihre bisherige Bedeutung und ihre Werte.

Die bestehende Textnormalisierung optionaler Projektfelder bleibt maßgeblich:
Rand-Leerzeichen werden entfernt, NULL und leerer Text werden als NULL abgelegt.
Dieses reine Persistenzpaket führt keine neue Datumsvalidierung, Formatumrechnung
oder Schätzung ein. Der kanonische Ein-/Ausgabeschlüssel lautet ausschließlich
`geplanter_baubeginn`.

Beim Ändern bedeutet ein fehlendes Feld bzw. `undefined`: vorhandenen Wert
behalten. Explizites `null`, `""` oder reiner Leerraum: Feld leeren. Beide
bestehenden Updateformen bleiben unterstützt: `{ projectId|project_id|id, patch }`
und `{ projectId|project_id|id, ...Felder }`.

## Umsetzung im Bestand

- `database.js`: Feld im initialen CREATE TABLE sowie in der bestehenden
  idempotenten `ensureProjectsSchema`-Migration. Zentrale Migration funktioniert
  ohne aktiviertes SiGeKo-Modul. Keine neue Datenbank oder Migrationstechnik.
- `projectsRepo.js`: Feld in allen sieben SELECT-Projektionen und allen drei
  historischen INSERT-Varianten sowie in der Update-Feldliste. Kein Fallback
  verschweigt einen nicht gespeicherten geplanten Baubeginn.
- `projectsIpc.js`: bestehende Create-Payload-Feldliste ergänzt. Update, Liste,
  Archivieren und Wiederherstellen verwenden weiterhin dieselben Operationen.
  Kein neuer Kanal und keine neue Preload-API.
- `projectTransferIpc.js`: genau eine zusätzliche Feldzuordnung im Import.
  Der bestehende Export nimmt das Repository-Ergebnis bereits vollständig mit.
  Ohne diese notwendige Ergänzung würde der Wiederimport das neue Feld verlieren.
  Alte ZIP-Archive ohne Feld ergeben NULL; Transferformat und übrige Regeln
  bleiben unverändert.

`schema.sql` ist laut eigenem Hinweis nur eine historische Minimalreferenz;
`database.js` bleibt die tatsächliche Schemaquelle. SiGeKo-Grundmodell, Rollen
Planung/Ausführung, sichtbare Eingabemaske, Readiness und Fachprozesse gehören
in spätere S2-/S3-Pakete. Rechnung #275 bleibt eingefroren. PDF-/Editor-/Mailwege
und beide SiGeKo-Blankovorlagen sind unverändert.

## Prüfung und Abgrenzung

13 neue Tests in `scripts/tests/plannedConstructionStart.test.cjs`, im bestehenden
Gruppenrunner registriert. Die Tests verwenden echte temporäre SQLite-Dateien,
den produktiven Datenbankstart, unveränderte SQL-/IPC-Ausführung und echte ZIP-
Archive. Nur Electron-Hostpfade und IPC-Registrierung werden durch isolierte
Testadapter bereitgestellt; keine globale Loader- oder Cachemanipulation.

Geprüft sind Neuaufbau ohne Fachmodul, zwei historische Schemas, unveränderte
Altwerte, wiederholte Migration, voneinander unabhängige Projekttermine,
Create-/Update-Hüllen, Feldleeren, aktive/archivierte Listen, Wiederherstellung,
Neustart, beide alten SQL-Fallbacks, fehlende Spalte als Fehler, isoliertes
Projektlöschen sowie ZIP-Export und Wiederimport einschließlich Altarchiv.

Ein unabhängiger lesender Review hat alle Projektionen, Platzhalter, Null-/Update-
Semantik und Testisolation geprüft; keine Blocker. Kein UI-Ablauf behauptet.

Volltest auf unverändertem main in separatem Worktree und gleicher Umgebung:
**1546 grün / 97 rot → 1559 grün / dieselben 97 Fehlernamen**. Keine neuen
Fehler, keine fehlenden Bestandsprüffälle, 13 zusätzliche Tests grün. Details,
exakte Namen und Loghashes in `SIGEKO_S2_1_TESTVERGLEICH.json`.
Syntax- und Diff-Prüfung grün. Der zusätzliche Windows-/Linux-Workflow führt
dieselben SQLite-/ZIP-Tests unter der vorhandenen Electron-Laufzeit aus.
Standard-CI mit fehlendem Kit und bekannten Popup-/Lizenzfehlern ist keine
grüne Gesamtabnahme und wird nicht als solche dargestellt.

CI-Lauf [34248605251](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34248605251)
auf Code-Commit `993eb05`: **Windows und Linux jeweils 13/13 grün**, mit echten
SQLite-Dateien und ZIP-Export-/Import. Nach diesem Lauf nur Dokumentation ergänzt;
Produkt- und Testcode bleiben unverändert.

Nächster Schritt nach Integration: nächstes begrenztes S2-Teilpaket gemäß
Detailplan, insbesondere die getrennte Anbindung der sichtbaren Projekteingabe.
Dieses Paket startet keine weitere Fachumsetzung. Die bekannte sporadische
PDF-Viewer-Baseline aus S1.4 bleibt ein separates offenes Thema.
