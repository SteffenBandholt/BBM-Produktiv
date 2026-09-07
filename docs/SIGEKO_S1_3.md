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

## Lokale Windows-Abnahme – ein Befehl, noch offen

Auf dem aktuellen PR-Branch `codex/sigeko-s1-3-storage-targets` im BBM-Verzeichnis:

```powershell
npm run test:sigeko:s1.3:windows
```

Dies ersetzt den bisherigen DevTools-/JavaScript-Abnahmeweg vollständig.
Der Befehl verwendet die vorhandene Acceptance-Profilanlage und die vorhandene
Electron-/ABI-Vorbereitung. Er startet keinen Editor und keine Produkt-UI.
Das echte Kit muss für diese reine Speicherabnahme nicht gestartet werden.

Automatisch:

1. Eindeutiges validiertes Temp-Profil unter Windows erzeugen.
2. Electron auf dieses userData/sessionData setzen, bevor DB-Code geladen wird.
3. Legacy-Import abschalten, isolierte Core-/SiGeKo-DB und ein neutrales
   S13-Testprojekt erzeugen. Keine Produktiv-DB oder vorhandenen Projekte verwenden.
4. Zentrale Ablagebasis ausschließlich in dieser Test-DB auf den Temp-Ordner setzen.
5. Vorschau ohne Ordneranlage und anschließend exakt Unterlagen, SiGePläne,
   Zeichnungen, Berichte prüfen. Pfade mit der Vorschau vergleichen.
6. Erneute Anlage und Erhalt einer temporären Testdatei prüfen.
7. SiGePläne über den unveränderten Service und Electron shell.openPath öffnen.
8. Dieselben Prüfungen mit einem abweichenden temporären baseDir wiederholen.
9. PASS oder FAIL, konkrete Zielpfade und den erhaltenen Temp-Ordner ausgeben.

Bei PASS wurden die automatischen Prüfungen und beide Explorer-Aufrufe erfolgreich
beendet. Die sichtbaren Ordner bitte noch im geöffneten Explorer kontrollieren.
Bei FAIL stehen Fehlermeldung und Temp-Pfad in der Konsole; ein Explorer-Fehler
wird nicht als PASS gemeldet. Ein fehlgeschlagener Electron-Start ist ebenfalls FAIL.

**Keine automatische Löschung:** Die Daten bleiben nach Erfolg und Fehler erhalten.
Nach der Kontrolle Explorer schließen. Die Konsole gibt den fertigen PowerShell-
Löschbefehl mit dem konkreten Pfad aus:

```powershell
Remove-Item -LiteralPath '<ausgegebener Temp-Ordner>' -Recurse -Force
```

Die zusätzliche Suite `sigekoStorageAcceptance.test.cjs` prüft sechs Fälle:
realer Service mit Standard/Override, negative Ordner-/Explorer-Fälle,
Prozessstart/Umgebungsisolation/PASS, Prozessfehler/FAIL, Windows-Beschränkung und
den tatsächlichen Worker mit realer isolierter SQLite-DB und simuliertem Explorer.
Ergebnis: **6/6 Abnahmehilfe, 11/11 bestehende S1.3-Tests grün**.
Vollvergleich: vorher 1493/99, jetzt 1499/99; exakt dieselben Fehlernamen,
keine fehlenden bisherigen Fälle. S1.1/S1.2/Gate B bleiben grün.
Die Simulation ist keine behauptete praktische Windows-Abnahme.
S1.3-Produktcode ist gegenüber Commit 16fbd82 unverändert.

Praktisches Windows-Ergebnis in #274 melden. PR #320 bleibt Draft und ungemergt;
S1.4 nicht begonnen, Rechnung unverändert.
