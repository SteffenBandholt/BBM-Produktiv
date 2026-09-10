# S5.4 – Prüfnachweis und verbleibende Outlook-Abnahme

Basis main `676713aa395cd6d6d4aa7633d5fc8bb251bb2a11` (PR #338).
Ergebnisbranch `codex/sigeko-s54-ruecklauf-outlook`, Draft-PR #339.
Fachcommit `5b867c069548df0ce5f674fdcfcbc066c7a7f2e5`, gemeinsame Grenzen
`c205377ff60f20b7d861aeec7b281159a51b28dc`.
Produktbaum `2bf11de8e164285f077a77c4fe6778fd74b536e5`.

## Technischer Umfang

Eigenständiger aktueller Vorgangsstand je unveränderlicher Vorankündigungsfassung.
Rücklauf-PDF in bestehender Unterlagenablage mit Hash-/Größenprüfung, exklusiver
Dateierstellung, Revision/CAS und Transaktion. Ersetzung behält alte Dateien und
setzt den Behördenabschluss zurück. Finale Originale und Firmenanlagen unverändert.

Inline-Mailvorbereitung mit Projektkontakten und frei bearbeitbaren Empfängern,
Betreff und Text. Main leitet Anlagen aus gespeicherten Fassungen ab und verwendet
den bestehenden gemeinsamen Outlook-Handler. Nur bestätigtes `draft-opened` erzeugt
Orange beziehungsweise Grün. Keine tatsächliche Versandbeobachtung oder Historie.
Nach bereits geöffnetem Outlook gescheiterte Speicherung wird ausdrücklich gemeldet.

V9 sichert Workflowdaten und signierte Dateien an den vorhandenen V8-Transfergrenzen.
Bestehende Formate bleiben erhalten. 32 deklarierte neue UI-Ziele, 143 Pflichtrefs,
144 Scopeziele mit bestehendem Launcher, Registry 37. Die sieben bisherigen
Scope-Fingerprints und zentralen Projektprofil-Fingerprints bleiben unverändert.

## Ausgeführte gezielte Prüfungen

| Bereich | Ergebnis |
|---|---:|
| Workflowvertrag, Migration, SQLite, CAS, Chronologie | 12 PASS |
| Main-Workflow mit realem SQLite/Dateisystem | 44 PASS |
| V9 mit tatsächlichen ZIP-Bytes und Rücknahmen | 14 PASS |
| Bestehender V8-Transfer | 15 PASS |
| Bestehender V7-/V6-Transfer | je 14 PASS |
| Formular mit gemountetem Komponentenvertrag | 49 PASS (36 Bestand + 13 neu) |
| Manifest, Fingerprints und tatsächlicher Profil-Restore | 9 PASS |
| Modulregistrierung, Preload und Lizenzentzug | 10 PASS |

Unabhängige Reviews für Service/IPC/Transfer und UI ohne offene Codeblocker.
Auch der konkrete lokale Outlook-Abnahmelauf wurde unabhängig auf IPC-/Fixture-/
Profil-/Dialogfehler geprüft; seine exakte Fixture wurde vor der Druckgrenze mit
echtem SQLite und produktivem Snapshot geprüft. Syntax und Hilfsaufruf bestanden.
DB-Review fand eine Chronologielücke: Behördenübergabe vor dem aktuellen Rücklauf
konnte Grün erzeugen. Shared-/SQL-Prüfung und V9-Ablehnung wurden ergänzt und getestet.
Der erste Volltest zeigte zwei überholte Schnittstelleninventare; beide wurden
gezielt aktualisiert und ihre Lizenzentzugskontrollen auf alle neuen APIs erweitert.

Volltest auf dem veröffentlichten Produktbaum: **2030 PASS / exakt dieselben 97
Baselinefehler** gegenüber 1947/97, also +83 PASS. Keine neuen oder entfernten
Fehlernamen/-häufigkeiten, keine verlorenen grünen Fälle. Vollständiger Vergleich
in `SIGEKO_S5_4_TESTVERGLEICH.json`. Der wiederholte Volltest umfasst die korrigierten
Schnittstelleninventare; keine Assertion oder Baselineanforderung abgeschwächt.

PDF-CI `34439924951`: Windows und Linux PASS. Reale Vorankündigungs-PDF, Vorschau,
Dateipersistenz und Editorregeneration geprüft. Im vorhandenen Linux-Goldenvergleich
alle 49 Seitenzahlen und vollständigen Struktur-Snapshots unverändert gegen main.
Gemeinsame Mailgrenze `34439924943`: Windows/Linux PASS, einschließlich tatsächlicher
PowerShell-Syntaxprüfung; der Prozess ist dort simuliert, keine Outlook-COM-Abnahme.

Formular-CI `34439924999`: Linux-Job `102752631407` PASS, 28 tatsächliche Bedienprüfungen,
keine Rendererfehler. Workflowdateien, DB-Neustart, Ampeln mit kontrolliertem Transport,
143 Pflichtrefs und 32 neue Ziele mit allen sechs Attributen/Parents geprüft.
Breite und niedrige Screenshots visuell geprüft; alle sieben Sticky-Aktionen sichtbar.
Windows-Job `102752631281` ebenfalls PASS: 29 tatsächliche Bedienprüfungen,
keine Rendererfehler; alle 83 neuen DB-/Service-/Transfer-/Formprüfungen grün.
143 Pflichtrefs und die 32 neuen Ziele vollständig vorhanden. Breite/niedrige
Windows-Screenshots visuell geprüft, alle sieben oberen Aktionen erreichbar.
Bestehender nativer Windows-PDF-Manager öffnet weiterhin, PDF-Ausgabe ausgewählt,
Diagnose leer. Das kontrollierte Mailcallback bleibt ausdrücklich kein COM-Nachweis.

Allgemeine npm-CI `34439924938` weiterhin separat fehlgeschlagen: vorhandene
Kit-/Popup-/Lizenzumgebungsprobleme. Der exakte 97-Fehlervergleich stammt aus dem
vollständig konfigurierten lokalen Lauf mit vorhandenem Kit, nicht aus dieser CI.

## Tatsächliches Outlook unter Windows – noch offen

Gemäß #274 B6 ist S5.4 vor diesem Nachweis nicht abgeschlossen und PR #339 bleibt
Draft. Die vorhandene persönliche S1.5-Abnahme beweist den gemeinsamen Adapter,
ersetzt aber nicht den neuen S5.4-Vorgang. Unbeaufsichtigte Formularprüfungen ersetzen
ausschließlich Dateidialogantwort und Mailtransport durch kontrollierte Testgrenzen;
sie sind ausdrücklich kein Nachweis für installiertes Outlook/COM.

Auf dem Windows-Rechner mit klassischem Outlook den geprüften PR-Branch verwenden
(nicht nur den noch unveränderten main). Außerdem muss die separat verlinkte
Abhängigkeit `../UI-Editor-kit` mindestens den bereits freigegebenen Commit
`5e0d551d93e97c32d169ea6d5107186a44ecd47f` (Kit-PR #93, fixed-layout-Vertrag)
enthalten. Ein Fetch/Switch im BBM-Repository aktualisiert dieses zweite Repository
nicht. Der Windows-/Linux-CI-Nachweis verwendet ausdrücklich diesen Kit-Stand.

Die lokale Kit-Arbeitskopie enthält laut Nutzer inzwischen nachgewiesen 18 geänderte
und drei neue Dateien. `PdfModel.cs` ergänzt die Ausblendbarkeit der Seitenzahl;
der freigegebene Commit erweitert dieselbe Datei an anderen Stellen. Der sichere
Abnahmeweg verwendet deshalb zwei zusätzliche, unveränderte Git-Arbeitskopien.
Die vorhandene Kit-Entwicklung wird weder verworfen noch gestasht oder vermischt.

Die folgenden Befehle verwenden exakt den getesteten BBM-Produktcommit und Kit-Pin.
Beide Commits sind durch die bereits ausgeführten Fetches lokal vorhanden. Der
neue Testordner enthält die nötige Geschwisterstruktur: `BBM-Produktiv` neben
`UI-Editor-kit`. Damit zeigt der lokale npm-Link auf das saubere Test-Kit.

```powershell
& {
    $s54TestRoot = Join-Path 'C:\01_Projekte' ('S54-Test-' + [guid]::NewGuid().ToString('N').Substring(0,8))
    $s54TestBbm = Join-Path $s54TestRoot 'BBM-Produktiv'
    $s54TestKit = Join-Path $s54TestRoot 'UI-Editor-kit'

    git -C C:\01_Projekte\UI-Editor-kit worktree add --detach $s54TestKit 5e0d551d93e97c32d169ea6d5107186a44ecd47f
    if ($LASTEXITCODE -ne 0) { throw 'Kit-Testordner konnte nicht angelegt werden.' }

    git -C C:\01_Projekte\BBM-Produktiv worktree add --detach $s54TestBbm c205377ff60f20b7d861aeec7b281159a51b28dc
    if ($LASTEXITCODE -ne 0) { throw 'BBM-Testordner konnte nicht angelegt werden.' }

    Write-Host "Testordner: $s54TestRoot"
    Push-Location $s54TestBbm
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw 'Installation fehlgeschlagen. Bitte Ausgabe schicken.' }
        npm run test:sigeko:s5.4:outlook
    }
    finally { Pop-Location }
}
```

`npm ci` installiert ausschließlich die durch den vorhandenen Lockfile bestimmten
Abhängigkeiten im neuen BBM-Testordner und richtet die bestehende Electron-ABI ein.
Kein neuer Produkt- oder Kit-Code, kein Validator-Workaround und kein anderer
Abnahmetransport. Die normalen Arbeitskopien behalten ihre Dateien und Branches.
Die zusätzlichen Git-Arbeitskopien bleiben für Nachprüfung erhalten; keine automatische
Löschung. Der eigentliche Outlooklauf verwendet weiterhin sein eigenes temporäres
Datenprofil. Installation und Outlook sind auf diesem lokalen Windowsweg noch auszuführen.

### Rückmeldung des ersten lokalen Laufs

Profil `bbm-ui-editor-acceptance-YxDFUj`: FAIL vor Outlook mit
`Deklarative PDF-Registry ist ungueltig.` Der bisherige Vorbereitungshinweis hatte
den separaten Kit-Abgleich ausgelassen. Dieselbe Meldung wurde mit dem realen
älteren Kit-Validator aus `0240ef8` reproduziert: Er verlangt im fixed-layout-PDF
fälschlich Tabellen-/Spalten-/Wiederholungsziele. Die getestete aktuelle Kit-Version
unterstützt diesen bereits freigegebenen Vertrag. Der konkrete lokal geladene
Kit-Stand ist aus der Nutzer-Terminalausgabe allein nicht bewiesen; der saubere Test-Kit-Stand
oben enthält die hierfür bereits freigegebene Erweiterung. Kein Outlook-PASS und kein
Merge aus diesem fehlgeschlagenen Lauf abgeleitet.

Der Lauf verwendet ein eigenes temporäres Testprofil, eine eigene SQLite-Datenbank
und künstliche Projekt-/Behördendaten. Er öffnet zwei tatsächliche Outlook-Entwürfe.
Es gibt keinen automatischen Versand und keine Änderung produktiver Daten.

1. Unterschriftsentwurf: Empfänger, Betreff, Text sowie Vorankündigung und Firmen-PDF
   öffnen/prüfen. Entwurf verwerfen und im Prüfdialog bestätigen.
2. Im nativen Dateidialog die bereits vorausgewählte technische Rücklauf-PDF öffnen.
3. Behördenentwurf: Empfänger, Betreff, Text sowie technische Rücklauf-PDF und dieselbe
   Firmen-PDF prüfen. Entwurf verwerfen und bestätigen.

Danach prüft der Lauf selbst die gespeicherte grüne Zuordnung nach DB-Neustart und
den unabhängigen roten Anfang einer neuen Fassung. Der Berichtspfad steht im Terminal:
`sigeko-workflow-outlook-result.json`. Nur ein erfolgreich abgeschlossener Lauf mit
beiden ausdrücklich bestätigten Sichtprüfungen gilt als manuelle Abnahme. Die Testdatei
enthält keine echte Unterschrift; eine Signaturvalidierung wird nicht behauptet.

Rechnung #275 bleibt eingefroren. Kalenderanschluss und weitere Pakete werden bis
zur vollständigen Abnahme/Integration dieses Pakets nicht begonnen.
