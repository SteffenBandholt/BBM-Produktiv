# SiGeKo S1.2 – technischer Abschluss mit offener Windows-Abnahme

Basis: #274 / #277, S1.1 / PR #318, main `d7fb63a73bfa399ae59de2230b849728c2d3c51a`.
Branch: `codex/sigeko-s1-2-entry-acceptance`.

## Status

Der Blocker aus `SIGEKO_S1_2_BLOCKER.md` ist behoben. Der gesicherte S1.2-Code
wurde weiterverwendet. Im Fix ist `ui-editor-target.json` die einzige geaenderte
Produktdatei: `sigeko.screen` mit 12 Elementen (11 Screen-Slots + 1 bestehender
Header-Launcher), Registryversion 29 und der mit der bestehenden Kit-Funktion
berechnete Gesamtfingerprint. Keine Parallelstruktur, keine Aenderung am Kit,
Profilformat, Restore-Controller oder an bisherigen Scope-Definitionen.

S1.2 umfasst den minimalen Moduleinstieg mit Projektkontext, generische
Navigation, klar inaktive Fachbereichshinweise, komponentennahe Vollregistrierung
und Erweiterung des vorhandenen isolierten Windows-Abnahmestarters. Die vorherige
UI-Entwurfsentscheidung ist im historischen Blockerbericht festgehalten.

Keine Fachfunktion aus S2/S3 oder S1.3 begonnen. Rechnungsproduktcode und
Rechnungsprofile sind unveraendert. Der PR bleibt Draft und wird nicht gemergt,
solange die lokale Windows-/Editor-Abnahme fehlt.

## Tests

Echtes, unveraendertes UI-Editor-kit aus dem bestehenden Repository:
`0240ef870dda7caaec7e639a6f5bf262b8037bc8`. Die lokale Windows-Version ist vor
Abnahme ebenfalls festzuhalten. Keine Abhaengigkeits-/Lockfile-Aenderung im BBM.

- Fix-Suite: 6/6 gruen, inklusive echtem Profil-Restore fuer Restarbeiten,
  Protokoll, Rechnung und SiGeKo ohne Editorprozess. Gespeicherte Profile bleiben bytegleich.
- Alle sieben bisherigen Scope-Fingerprints stimmen mit den vor S1.2 auf main
  gemessenen festen Fixtures ueberein.
- S1.2: 12/12 gruen, inkl. gemounteter Ref-/Komponentenvalidierung mit echtem Kit.
- S1.1: 10/10 gruen.
- Alle 55 zuvor gruenen Profil-/Restorepruefungen aus dem Volltest bleiben gruen.
- Frisch unveraenderter main mit derselben Abhaengigkeit: 1464 gruen, 99 rot.
- Gesicherter Stand vor Fix: 1465 gruen, 110 rot.
- Nach Fix: 1482 gruen, 99 rot. Weiterhin 1/10 Gesamtgruppen; kein pauschal gruener Volltest.
- Alle elf neuen Prueffehler stehen nach dem Fix auf PASS; keine zusaetzliche
  Fehlerklasse oder neu rote Pruefung gegen main.
- `git diff --check` gruen.

Der maschinenlesbare Namensvergleich samt Log-Pruefsummen, allen 99 Baselinefehlern
und allen elf reparierten Pruefungen steht in `SIGEKO_S1_2_TESTVERGLEICH.json`.
Die alte Work-Baseline ohne Kit (473/9) ist nicht mit diesem umfassenderen
Teststand gleichzusetzen. Gegenueber der vorherigen Sitzung (1466/97 mit Kit)
sind zwei Datumserwartungen bereits auf main rot:

- `#272 Mail 4b: Protokoll-PDF-Suche behaelt bestehende Dateinamenskandidaten`
- `Ausgabe: Abschlusslisten werden pro Protokollstand eindeutig benannt und gespeichert`

Diese beiden Datum-/Zeitzonenfaelle wurden nicht repariert oder als Paketfehler behandelt.

## Warum Testinventare angepasst wurden

Feste exakte Listen wurden additiv von sieben auf acht Scopes und von zwoelf
auf vierzehn Komponenten ergaenzt. Vorhandene Eintraege, Eindeutigkeitspruefungen,
Parentpruefungen und verpflichtende Slots bleiben erhalten. Die separate strenge
Komponentenanzahl-Map enthaelt jetzt auch die beiden SiGeKo-Komponenten; ihre
bekannte Rechnungsanzahl-Baseline bleibt sichtbar.

Zwei Quellvertragstests erwarten weiterhin exakt denselben Lizenzstatus und die
vorhandenen Acceptance-Module; ergaenzt wurden die bereits im S1.2-Arbeitsstand
enthaltene explizite Isolationsoption beziehungsweise SiGeKo in der Modulliste.
Kein Skip, keine gelockerte Teilmengenpruefung, keine aufgeweichte Restorevalidierung.
Historische Testtitel bleiben zur eindeutigen Vorher/Nachher-Zuordnung stabil;
ihre Inventarzahlen in den Assertions wurden bewusst erweitert.

## Wiederholung

Bei eingerichtetem echten Kit und Electron-Abhaengigkeiten:

```powershell
npm test
$env:ELECTRON_RUN_AS_NODE = '1'
.\node_modules\electron\dist\electron.exe -e 'const suites = [["sigekoEditorManifest", "runSigekoEditorManifestTests"], ["sigekoEntryAcceptance", "runSigekoEntryAcceptanceTests"], ["sigekoModuleBoundary", "runSigekoModuleBoundaryTests"]]; (async () => { for (const [file, entry] of suites) await require("./scripts/tests/" + file + ".test.cjs")[entry](async (name, test) => { await test(); console.log(name); }); })().catch(error => { console.error(error); process.exitCode = 1; });'
Remove-Item Env:ELECTRON_RUN_AS_NODE
```

## Windows-/Editor-Abnahme: OFFEN

Echtes Kit: `C:\01_Projekte\UI-Editor-kit`.
BBM: `C:\01_Projekte\BBM-Produktiv`.
Der BBM-Ordner `.ui-editor-kit` ist Konfiguration und ersetzt das echte Kit nicht.

Nach Checkout des PR-Branches, bei eingerichteten Abhaengigkeiten:

```powershell
Set-Location C:\01_Projekte\BBM-Produktiv
git fetch origin
git switch codex/sigeko-s1-2-entry-acceptance
npm run start:ui-editor:acceptance -- --module=sigeko
```

Der bestehende Starter baut den Kit-Manager, legt ein temporaeres Testprofil an,
nutzt es fuer zwei App-Starts und entfernt es anschliessend. Zwei neutrale
Testprojekte S12-A und S12-B. Produktives userData, Produktiv-DB und Lizenzdateien
werden nicht als Abnahmeprofil verwendet; Legacy-Import ist im isolierten Start aus.

Manuell pruefen:

1. SiGeKo oeffnet; S12-A / SiGeKo Testprojekt A wird korrekt angezeigt.
2. Projekt wechseln; bei S12-B die SiGeKo-Modulkachel oeffnen; Projekt B stimmt.
3. Zum Projektarbeitsbereich zurueckkehren und SiGeKo erneut oeffnen.
4. Fenster schmaler machen; Texte und beide Navigationsaktionen bleiben bedienbar.
5. Geplante Fachbereiche sind eindeutig noch nicht umgesetzt; keine Fake-Aktion.
6. Nativen UI-Editor oeffnen: SiGeKo-Scope, alle Screen-Elemente und Launcher sind
   erreichbar; erlaubte Layoutoperationen pruefen, keine Fachaktion ausloesen.
7. Editor schliessen/erneut oeffnen und zweiten isolierten App-Start pruefen;
   Layoutwiederherstellung und korrekter Projektkontext. Produktivdaten unveraendert.

Ergebnis mit Windows-/Kit-Version, geprueftem PR-Commit und bei Fehlern Screenshot
in #274 dokumentieren. Bis dahin keine praktische Abnahme und kein Merge.

## Arbeitsmodus

Einzelner Work-Arbeitsauftrag, keine Unteragenten. Kein nativer Windows-/Editor-
Bedienablauf in Work behauptet. Technische Eigenpruefung und automatisierte
Regression abgeschlossen; praktische Abnahme ist das verbleibende Gate.
PR-/Commit- und GitHub-CI-Status werden in #274 dokumentiert.
