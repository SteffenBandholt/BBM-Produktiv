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
`mail-acceptance-result.json`. Nur ein erfolgreich abgeschlossener Lauf mit
beiden ausdrücklich bestätigten Sichtprüfungen gilt als manuelle Abnahme. Die Testdatei
enthält keine echte Unterschrift; eine Signaturvalidierung wird nicht behauptet.

Rechnung #275 bleibt eingefroren. Kalenderanschluss und weitere Pakete werden bis
zur vollständigen Abnahme/Integration dieses Pakets nicht begonnen.

## Lokaler PDF-Abbruch vor Outlook und gezielte Diagnose (2026-09-10)

Die Nutzerdatei `Eingefügter Text.txt` belegt für `S54-Test-7ba06d29`: beide
sauberen Worktrees (BBM c205377f / Kit 5e0d551), `npm ci` und Electron-ABI erfolgreich.
Profil `bbm-ui-editor-acceptance-33m3Fj`: Firmenanlage geschrieben, anschließend
Vorankündigung mit Textüberlauf an der statischen Beschriftung `authority.label`
abgebrochen. Die relevante Prüfung ist der DOM-Range-Vergleich in
`PreNotificationPdfContent.js`, nicht der frühere Registryfehler. Kein Outlook-Aufruf
und kein erfolgreicher B6-Nachweis.

Die NotoSans-Fehler `prep: table overruns end of file` sind auch im bereits
bestandenen Windows-PDF-Job 102752631025 enthalten. Sie bleiben ein bestehender
Schriftmangel; ihr Vorhandensein allein erklärt den neuen lokalen Abbruch nicht.
Weder gemeinsame Fonts noch Satzvertrag oder Overflow-Toleranzen werden deshalb
auf Verdacht geändert. Auch die npm-Auditmeldungen sind kein Beleg der PDF-Ursache.

Der neue Diagnoseworker `scripts/runSigekoWorkflowPreparationAcceptance.cjs` ruft
denselben unveränderten S5.4-Helper auf. Echte SQLite, Lizenzgrenze, Preload/IPC,
Firmen-/Vorankündigungs-PDF und technische Rücklauf-PDF werden ausgeführt. Eine
strikte Testgrenze stoppt VOR dem ersten Mailvorbereitungsaufruf; kein Mailtransport
wird registriert. Der Bericht heißt `s54-preparation-result.json` und benennt
`actualOutlookVerified:false`, `manualConfirmed:false` ausdrücklich.

Windows-CI 34510966326 (Diagnosestand 0a78dbc) bestand bei Skalierung 1, 1.25, 1.5
und 2. Der Fehler ist dort nicht reproduziert. Die Folgekorrekturen 8ad5b874 und
8369a36b erfassen die unveränderten Range-Maße bereits während der produktiven
Layoutprüfung, bevor der Fehlerpfad das Formular entfernt. Die testseitige
Instrumentierung gibt das originale Rechteck unverändert zurück und verändert
weder Fachdaten noch Guard-Ergebnis. Ein separater Review fand und beseitigte
die zu späte Erfassung sowie einen synthetischen Range-Aufruf im späteren
Diagnoseblock. Syntax und Whitespace-Prüfung grün. Es wurde kein neuer Volltest
behauptet: Produktcode unverändert, letzter Volltest weiterhin 2030/97.

Die erste Fassung der Range-Instrumentierung ließ spätere Mess-Promises an bereits
geschlossenen Druckfenstern hängen. Diagnosecommit f38fec0f entfernt die nachträgliche
Renderer-Messung vollständig und begrenzt das Aufräumen. CI 34511789349 bestand
erneut bei allen vier Windows-Skalierungen, einschließlich der Assertion, dass die
Messwerte aus der echten Layoutprüfung stammen. e538cfbe ergänzt ausschließlich
einen expliziten Fehlerabschluss für ungefangene Ereignisfehler und ein 60-Sekunden-
Zeitlimit des automatischen Diagnoseworkers. Der reale manuelle Outlook-Test bekommt
weder dieses Zeitlimit noch eine geänderte Fehlerbehandlung.

Nächster notwendiger Nachweis: denselben Diagnoseworker ohne erzwungene Skalierung
im vorhandenen isolierten Nutzer-Testordner ausführen. Vorher nur dessen sauberen
BBM-Worktree per Fast-forward auf e538cfbe4eabe48e29fe37b00bdf04998a7f6470 bringen;
Kit und normale Entwicklerarbeitskopien erhalten. Keine erneute Installation nötig,
da Paketmanifest und Lockfile unverändert sind. Anschließend die lokalen Feld- und
Textrechtecke, Schriftmetriken und tatsächliche Geräteskalierung auswerten.

Status: S5.4 bleibt bei B6 offen, Draft-PR #339 bleibt unintegriert. Die Diagnose
ist keine Fehlerbehebung und kein Ersatz für die spätere reale Outlook-Abnahme.

## Nutzerdiagnose mit tatsächlichen Range-Maßen (2026-09-10)

`Eingefügter Text(1).txt`, Profil `bbm-ui-editor-acceptance-V7SBYF`, bestätigt den
aktualisierten Diagnoseworker e538cfbe auf dem sauberen Testworktree. Der Fehler
ist jetzt vor dem Entfernen des Formular-DOM gemessen. CSS: 12 px, line-height
13.8 px; scroll/client jeweils 703 x 19. Range links identisch mit Feld links,
rechts weit innerhalb des Feldes. Auslöser ist allein der obere Range-Überstand
von 1.80452 CSS-Pixeln gegenüber der vorhandenen 1-Pixel-Prüfgrenze.

Die Windows-Matrix wurde um exakt 1.6625 erweitert (dd7a4daf). CI 34515101229
bestand alle fünf Skalierungen; maßgeblicher Vergleichsjob 102998431756:

| Messung | Nutzer | Windows-CI bei identischem DPR |
|---|---:|---:|
| devicePixelRatio | 1.662500023841858 | 1.662500023841858 |
| Feldbreite | 702.9887084960938 | 702.9887084960938 |
| Feldhöhe | 18.890975952148438 | 18.890975952148438 |
| Feldoberkante | 211.6353302001953 | 211.6353302001953 |
| Range-Oberkante | 209.830810546875 | 211.6353302001953 |
| Range-Breite | 162.51878356933594 | 152.7725372314453 |
| Range-Höhe | 16.2406005859375 | 13.233078002929688 |

Damit erklärt der DPR allein den Unterschied nicht. Die angeforderte CSS-Familie
und NotoSans-Fehlerstatus sind ebenfalls identisch; der tatsächliche verwendete
Font war bisher nicht erfasst. Unterschiedliche Fontmetriken sind nachgewiesen,
ihre Ursache und eine tatsächliche sichtbare Glyphenabschneidung jedoch nicht.
Der DOM-Range umfasst typografische Fontmaße, nicht ausschließlich sichtbare Tinte.
Keine pauschale Toleranzänderung, kein Entfernen der oberen Grenze und keine
unbelegte Änderung von Nutzer-Anzeigeskalierung oder gemeinsamen Schriftdateien.

Diagnosestand d4cd576aaf8c31f4c00681b6f797e9d797d2c92b ergänzt deshalb nach dem
unveränderten ursprünglichen Vorbereitungslauf eine separate versteckte Fontprobe:
derselbe gemeinsame Print-Einstieg, CSS und Fontladeweg, explizit dieselbe Beschriftung
und Formatierung. CDP `CSS.getPlatformFontsForNode` meldet die tatsächlich verwendete
Fontfamilie/PostScript-Bezeichnung; Canvas ergänzt Font- und Glyphenmaße. Breite und
Höhe müssen zur ursprünglichen Range-Messung passen, sonst gilt die Zuordnung nicht
als nachgewiesen. Probe erst nach dem Lauf, kein Einfluss auf dessen PDF/Guard-Ergebnis.
Ausgabe `S54_FONT_PROBE:` und derselbe `s54-preparation-result.json`-Bericht.

Die erste Fontprobe fe8f43d aktivierte die Debugger-Domänen vor dem Laden der
Seite und lief ins begrenzte 60-Sekunden-Zeitlimit. d4cd576a lädt zuerst die Seite;
der Windows-Nachweis bestätigt die tatsächliche Fontfamilie Arial / ArialMT und
`matchesOriginalRangeMetrics:true` (Job 103000670353, CI 34515771232).
Die Nutzer-Fontfamilie bleibt noch zu messen. Diagnosefehler sind keine Produktfehler.

Nächster lokaler Aufruf: ausschließlich sauberen Test-BBM-Worktree auf d4cd576a
fast-forwarden und denselben Diagnosebefehl ohne Skalierungsflag starten. Keine
Neuinstallation, kein Outlook, kein produktiver Code geändert. B6/PR-Merge weiter offen.


## A–F vor S5.4-Reparatur: Noto-Schriftrechteck und sichtbarer Text

Anlass: Nutzerlauf `hB0xwv` auf `d4cd576a`: lokal installiertes
`Noto Sans / NotoSans-Regular`, DPR 1.662500023841858. Original-Range und
isolierte Schriftprobe stimmen überein. Range-Oberkante 209.830810546875 px
liegt 1.8045196533 px über der Feldoberkante 211.6353302001953 px;
Canvas-Glyphenaufstieg 10 px, Fontaufstieg 13 px. Windows-CI verwendet Arial.
Beide Systeme weisen die bestehenden mitgelieferten Noto-Dateien zurück.

A. PDF-Prüfung der bestehenden Vorankündigung, keine Layoutänderung.
B. Bestehende Editorfähigkeit bleibt bestehen.
C. Alle 81 Ziele und sämtliche sechs Pflichtattribute werden unverändert aus
`SIGEKO_S5_3B2_PDF_ENTWURF.md`, einschließlich der Kopfcontainer-Ergänzung,
übernommen: IDs, kinds, labels, parents, editable und ops bleiben identisch.
Keine neuen Editorziele.
D. Fachaktionen, Speichern, Rücklauf, Outlook, IPC und Datenänderungen bleiben
außerhalb des Editors. Kurzlebige leere Messmarker sind ausschließlich
Prüfmittel innerhalb eines expliziten Textziels und werden vor PDF-Erzeugung
in jedem Fall entfernt; sie erhalten keine Editoridentität.
E. Bestehende Parents, V2-Kopf, Einseite, Geometrie, Schriftwahl, Schriftgröße,
Zeilenhöhe und Fußreserve bleiben bestehen. Nur bei vertikal überstehendem
Range-Schriftrechteck wird zusätzlich der sichtbare Text an real gemessenen
Browser-Grundlinien geprüft. Unveränderte Textfragmente und Scrollmaße sind
Voraussetzung; bei fehlenden Messwerten oder Mess-Reflow bleibt der Abbruch.
Mehrzeilige Canvas-Messung wird auf lateinischen Text mit gemeinsamen Zeichen
und kombinierenden Akzenten begrenzt; andere komplexe Umbruchformungen
behalten bei überstehendem Range den konservativen bisherigen Abbruch.
F. Regressionen für gemeldete Noto-Metriken, obere Akzente, Unterlängen,
Mehrzeilenüberlauf, horizontale Grenzen, Mess-Reflow und Aufräumen.
Reale Windows-Vorbereitung mit Arial und testweise lokal installierter Noto
bei fünf Skalierungen; alter Guard muss mit Noto nachweislich scheitern.
Bestehende Windows/Linux-PDF-Abnahme und 49 Golden-Strukturen/Seitenzahlen.
Betroffen: `PDF-V2-SIGEKO-VA-007` (vollständige Textmessung); kein neuer Satz.
Die technische Implementierung und ihre Prüfungen folgen dieser Entscheidung;
diese Passage allein behauptet noch keinen bestandenen Nachweis.
