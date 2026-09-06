# SiGeKo S1.1 – technischer Modulanschluss

Grundlage: #274 / #277. Ausgangs-main: `cdfb92a9d890c1037259ea4d1d5246d98bc8aaf3`.

## Umfang

- `sigeko` ist im vorhandenen Main-Modulregister ein Projektmodul mit den
  kanonischen Capability-Deklarationen PDF, Mail, File-Storage und UI-Editor.
- Der Renderer-Katalog kennt den passenden Deskriptor. Screens, Routen und
  Navigation sind leer; die produktive Standardfreigabe bleibt unverändert.
  Sichtbarer Einstieg und Windows-Abnahme folgen ausschließlich in S1.2.
- `bbmDb.sigekoGetModuleInfo()` -> `sigeko:getModuleInfo` -> `SigekoService`.
  Die Operation liefert nur Modul-ID und Modultyp, keine Fachdaten.
- Der bestehende modulare IPC-Guard prüft den aktuellen Lizenz-/Modulstatus
  bei jedem Aufruf. Es gibt keine eigene SiGeKo-Autorisierung.
- Der Migrationsregistrar ist absichtlich ohne Schemaoperation. Keine neue
  Tabelle, DB, Projekterweiterung oder fachliche Datenentscheidung.
- Keine PDF-/Mail-/Speicherimplementierung, kein Protokoll-/TOP-Import,
  keine Rechnungsänderung und kein vorgezogenes S1.2.

## Prüfung auf dem Paketstand

- Neue S1.1-Suite: **10/10 grün** unter Electron-ABI.
- Relevanter isolierter Lauf: **78 grün, 1 bekannte Baseline**. Enthalten:
  S1.1, Modul-IPC (7), Migrationen (7), Provider (6), Gate B (9),
  Routing/Lizenzvertrag sowie Abschlussnachweise #272 (7) und #273 (6).
- Volltest vor Änderung: **463 grün, 9 rot**, 0/10 Gruppen erfolgreich.
- Volltest nach Änderung: **473 grün, dieselben 9 rot**, 0/10 Gruppen erfolgreich.
- Fehlgeschlagene Testnamen und fehlende Module sind zwischen Ausgangs-main
  und Paketstand identisch. Keine neue Regression.
- Gezieltes ESLint und `git diff --check` grün.

Die S1.1-Suite ist in `scripts/testGroups.cjs` registriert und läuft über
`npm test`. Für einen isolierten Lauf unter der bereits vorbereiteten
Electron-ABI:

```bash
ELECTRON_RUN_AS_NODE=1 node_modules/.bin/electron -e 'require("./scripts/tests/sigekoModuleBoundary.test.cjs").runSigekoModuleBoundaryTests(async (name, test) => { await test(); console.log(name); }).catch(error => { console.error(error); process.exitCode = 1; })'
```

Die Tests führen den tatsächlichen Preload-Code mit einer Electron-Bridge
im Test aus, rufen den produktiven modularen Registrar/Service auf und prüfen
Freigabeentzug. Echte SQLite-DBs prüfen Core-only, Bestandsdaten, identisches
Schema nach wiederholter SiGeKo-Migration und SiGeKo + Restarbeiten ohne Protokoll.

## Baselineabgrenzung

Unverändert vorhanden:

1. `meetingTopsRepo`: historischer Test-DB-Mock ohne `db.transaction`.
2. Drei bestehende Popup-Standard-Erwartungen.
3. `moduleAccessState`: fehlendes `ui-editor-kit`.
4. Historische APP/PDF/MAIL/EXPORT-Alias-Erwartung (auch im isolierten Lauf rot).
5. Historische FeatureGuard-Erwartung.
6. Development-License-Diagnostic-Modulliste.
7. Development-License/MainHeader-Kennzeichnung.

Weitere Gruppen brechen unverändert beim Laden fehlender `ui-editor-kit`-Module ab.
Diese Abbrüche sind keine erfolgreiche UI-Prüfung. S1.1 verändert keine sichtbare
UI oder PDF; eine Windows-Bedienabnahme wird hier nicht behauptet.

Der alte IPC-Registrar-Test enthielt eine feste Dreimodul-Verzeichnismap.
Er folgt jetzt dem vorhandenen Deskriptorfeld `ipcRegistrar` und prüft damit
auch SiGeKo, ohne seine Assertions abzuschwächen.

## Abschlussgrenze

PR-, Review-, CI- und Main-Commit-Nachweis werden in #274 dokumentiert.
Nur S1.1 wird abgeschlossen; #274 bleibt für die Folgepakete offen.
