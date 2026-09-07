# SiGeKo S1.3 – gemeinsame Speicherziele

Basis: main `dd79f4f65323f9919b385863cfd6b6095b9aa0dd`, S1.1 #318 und
S1.2 #319 integriert; S1.2 wurde lokal unter Windows abgenommen.
Arbeitsbranch: `codex/sigeko-s1-3-storage-targets`. PR/Commit-Nachweis in #274.
S1.3 ist ein einzelner Work-Arbeitsauftrag ohne Unteragenten.
Keine sichtbare UI/PDF geändert; keine neue Editorregistrierung erforderlich.
Die praktische Windows-/Explorer-Abnahme von S1.3 bleibt offen; kein Merge.

## Technischer Vertrag

Die bestehende Datei `src/main/ipc/projectStoragePaths.js` bleibt führend.
Ihre Projektbenennung (Nummer + Kurzname, ersatzweise Name) und bestehenden
Modulpfade bleiben unverändert. Additive Zielregistrierung:

```
<Basis>/bbm/<bestehender Projektordner>/SiGeKo/
  Unterlagen/
  SiGePläne/
  Zeichnungen/
  Berichte/
```

`buildModuleStoragePaths` verwendet `buildStoragePreviewPaths` und liefert
`baseDir`, `projectFolder`, `moduleDir`, `targets` (genau die vier Namen als Keys).
`createProjectStorageAccess` verbindet diese Auflösung mit zentralem Projektlesen,
bestehenden Einstellungen, mkdir/access und Electron shell.openPath.
Keine zweite DB, neue Settings, eigene Pfadkonfiguration oder Pfadpersistenz.

Basiswahl: expliziter `baseDir` des Aufrufs, andernfalls bestehender globaler
Schlüssel `pdf.protocolsDir`, andernfalls Electron `downloads`. Der historische
Schlüsselname wird aus Bestandskompatibilität verwendet, ohne Protokollimport.
Ein ausdrücklich leerer/ungültiger Override wird abgewiesen, nicht still ersetzt.

**Bestandsabgrenzung Projekt-Override:** main besitzt keinen gespeicherten
projektspezifischen Speicherpfad. `project_settings` erlaubt nur ausgewählte
Protokollfelder, keinen Ablagepfad. Wiederverwendet wird der vorhandene technische,
aufrufbezogene `baseDir`-Override wie bei den bestehenden Ablageaufrufen. Derselbe
Override muss für Vorschau, Anlage und Öffnen übergeben werden. Ein dauerhaft
konfigurierbarer Projektpfad wäre eine separate gemeinsame Entscheidung; S1.3
führt ihn nicht heimlich als SiGeKo-Setting ein.

Main liest das reale zentrale Projekt anhand `projectId`; vom Client gelieferte
Projektnummern/-namen oder Modulkennungen ersetzen es nicht. Die begrenzte Kette:

`bbmDb -> modularer sigeko-IPC -> SigekoService -> gemeinsame Projektpfadlogik`

| Preload-Operation | Payload | Wirkung |
|---|---|---|
| `sigekoGetStoragePaths` | `{projectId, baseDir?}` | reine Auflösung, keine Ordneranlage |
| `sigekoEnsureStorageDirectories` | `{projectId, baseDir?}` | genau vier Zielordner rekursiv anlegen/prüfen |
| `sigekoOpenStorageDirectory` | `{projectId, baseDir?, target}` | ein registriertes Ziel anlegen/prüfen und im Explorer öffnen |

Erfolg: `{ok:true,data:...}`. Fehler: `{ok:false,error,code,path}`; reale Systemcodes
wie EACCES, EEXIST/ENOTDIR bleiben erhalten. Modulfreigabe und Freigabeentzug
bleiben ausschließlich beim vorhandenen IPC-Guard. Ohne Protokoll nutzbar.

Keine Dateien werden erzeugt, überschrieben, klassifiziert oder verschoben.
Bereits vorhandene Ordner/Dateien bleiben erhalten. Bei einem späteren mkdir-Fehler
können vorher erfolgreich angelegte leere Ordner bestehen bleiben; kein
Erfolgsstatus für eine unvollständige Anlage. Es gibt keinen automatischen Startlauf.

Windows-Laufwerk/UNC und Unicode sind geprüft. Ungültige Basisbestandteile,
relative bzw. laufwerksrelative Pfade und reservierte Windows-Namen werden
abgewiesen. Ungültige Zeichen in Projektlabels werden weiterhin vom bestehenden
Sanitizer ersetzt; unzulässige Ergebnisse (z.B. CON, '..', Punkt am Ende) werden
vor Ordneranlage abgewiesen. Bestehende Projekt-/Modulnamen werden nicht umbenannt.
Windows-ACLs, Explorer und systemspezifische Längenlimits bleiben lokal zu prüfen.

## Automatisierte Nachweise

Ergebnis: S1.3 **11/11**, S1.1 **10/10**, S1.2 **12/12**, S1.2-Fix **6/6** grün.
Volltest main **1482 grün / 99 rot**, S1.3 **1493 grün / dieselben 99 rot**;
keine fehlenden bisherigen Fälle und keine neuen Fehlernamen, 1/10 Gesamtgruppen.
ESLint: keine Fehler, zwei Hinweise zur absichtlichen Steuerzeichenprüfung
(einer bereits im bestehenden Sanitizer). `git diff --check` grün.

Neue Suite `scripts/tests/sigekoStorageTargets.test.cjs`, 11 Prüfungen:
Standard, Unicode, exakte vier Ziele, deterministische Auflösung, Basis-Override,
Windows/UNC, ungültige Pfade, mkdir/Bestand, Rechte/Systemfehler, Explorer-Adapter,
Projektvalidierung, Service-/Preload-Delegation, Modulguard/Freigabeentzug.
Reale temporäre Dateisystemfixtures; EACCES zusätzlich deterministisch injiziert,
weil Work als root keine belastbare Windows-ACL-Prüfung leisten kann.

S1.1-Inventare wurden exakt um drei technische Operationen ergänzt. Alle bisherigen
Einträge und übrigen Assertions bleiben erhalten. Keine Rendererdatei geändert.
S1.2, Manifest-/Restore- und Gate-B-Prüfungen bleiben erforderlich.
Der vollständige Namensvergleich liegt in `SIGEKO_S1_3_TESTVERGLEICH.json`.

Besonderheit des alten Restarbeiten-V2-Tests: Er liest ausschließlich ungestagte
`git diff`-Dateien und verbietet beliebige Änderungen an Main-Dateien außerhalb
seines historischen Pakets. Ein ungestagter S1.3-Lauf bricht deshalb vor 18
nachfolgenden Fällen ab (16 grüne und zwei rote main-Fälle fehlen). Dieser Lauf
wird nicht als vollständiger Vergleich gewertet. Der vollständige Paketdiff wird
separat geprüft; der verbindliche Vor-Commit-Lauf erfolgt mit gestagten Dateien.
Der alte Test, seine Assertions und sämtliche Baseline-Dateien bleiben unverändert.

Wiederholen (eingerichtetes echtes UI-Editor-kit und Electron-Abhängigkeiten):

```powershell
npm test
```

## Lokale Windows-Abnahme – offen

Nur den vorhandenen isolierten Starter verwenden, mit echtem Kit unter
`C:\01_Projekte\UI-Editor-kit`. Keine Produktiv-DB und keine Produktivablage.

```powershell
Set-Location C:\01_Projekte\BBM-Produktiv
git fetch origin
git switch codex/sigeko-s1-3-storage-targets
$S13TestRoot = Join-Path $env:TEMP ('BBM-S1-3-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $S13TestRoot
$S13TestRoot
npm run start:ui-editor:acceptance -- --module=sigeko
```

Im isolierten SiGeKo-Testprojekt die Entwicklerkonsole öffnen (Strg+Umschalt+I).
Ausschließlich den oben erzeugten temporären Pfad einsetzen; im JS forward slashes
verwenden oder Backslashes verdoppeln. In der Konsole:

```js
const s13Projects = await window.bbmDb.projectsList();
if (!s13Projects.ok) throw new Error(s13Projects.error);
const s13Project = s13Projects.list.find(p => p.project_number === 'S12-A');
if (!s13Project) throw new Error('Isoliertes S12-A-Testprojekt fehlt – stoppen');
const s13Base = 'HIER_DEN_OBEN_ERZEUGTEN_TEMP_PFAD_EINSETZEN';
const s13Input = { projectId: s13Project.id, baseDir: s13Base };
const s13Preview = await window.bbmDb.sigekoGetStoragePaths(s13Input);
s13Preview;
await window.bbmDb.sigekoEnsureStorageDirectories(s13Input);
await window.bbmDb.sigekoOpenStorageDirectory({ ...s13Input, target: 'SiGePläne' });
```

1. Richtiges isoliertes Projekt und zentrale Projektbenennung prüfen.
2. Reine Vorschau legt noch keine Ordner an; Anlage erzeugt genau Unterlagen,
   SiGePläne, Zeichnungen und Berichte unter SiGeKo.
3. Explorer öffnet den exakt zuvor aufgelösten SiGePläne-Pfad; Unicode stimmt.
4. Mit `baseDir: s13Base + '/Projekt-Override'` dieselben drei Aufrufe wiederholen.
   Alle zeigen dieselbe abweichende Basis; ursprüngliche Ordner bleiben erhalten.
5. Testweise Datei in Unterlagen ablegen; erneute Anlage erhält sie unverändert.
6. Im isolierten Profil den globalen `pdf.protocolsDir` auf `s13Base` setzen
   (`await window.bbmDb.appSettingsSetMany({'pdf.protocolsDir': s13Base})`) und
   `sigekoGetStoragePaths({projectId:s13Project.id})` ohne Override prüfen.
7. Ungültiger Pfad und ein tatsächlich schreibgeschützter Testordner liefern einen
   verständlichen Fehler. Keine produktiven Ordner für diesen Versuch verwenden.

Ergebnisse/Windows-Version/geprüften PR-Commit in #274 festhalten. Keine praktische
Abnahme in Work behauptet. S1.4 wurde nicht begonnen; Rechnung bleibt eingefroren.
