# S1.5 – Gemeinsame Mailgrenze ohne Protokoll-Lizenzbindung

Basis: main `6e1f7f7`, Gesamtplan #277, SiGeKo #274, S1.4 / PR #323.
Status: technisch umgesetzt, praktische Windows-/Outlook-Abnahme offen.
Entwurfs-PR: https://github.com/SteffenBandholt/BBM-Produktiv/pull/324.
Die B3-Entscheidung aus #274 ist verbindlich: Entwurfsöffnung ist die Übergabe
an den Nutzer; es gibt keinen Versandnachweis und keine Versandhistorie.

## Paket und Grenzen

Goal-Arbeitslauf, primär Container 3 (gemeinsame Dienste), Tests in Container 6.
Vor Umsetzung wurden bestehende Aufrufe/Rückgaben lesend geprüft. Ein separater
Unteragent prüfte Kompatibilität und anschließend den Diff; dessen Befund zum
Windows-Argumentlimit wurde durch JSON-Dateiübergabe behoben. Keine editorrelevante
Ausgabe, keine neuen Editorziele oder UI-/PDF-Strukturen. Das Abnahmeskript nutzt
ausschließlich eine technische, isolierte Testabfrage.

Erlaubter Umfang: bestehender Mail-IPC/Windows-Adapter, gemeinsamer
MailTransportService, technische Weitergabe im MainHeader, zugehörige Tests und
Abnahme. Keine fachlichen SiGeKo-Mailtexte, Vorankündigungen, Versandstatus,
Versandbeobachtung, Erinnerungen oder Fachmodelle. Keine zweite Mail-/Editor-/PDF-
Infrastruktur. Rechnung #275 bleibt eingefroren; beide PDF-Blankovorlagen und
SiGePlan DIN A2 quer bleiben unverändert. S2 und weitere Pakete nicht begonnen.

## Bestehenden Weg erweitert

Der bisher in `main.js` liegende Outlook-Adapter gehört jetzt zu
`src/main/ipc/mailIpc.js`. Main registriert ihn einmal. Der bestehende Kanal
`mail:createOutlookDraft` und die Preload-API `bbmMail.createOutlookDraft` bleiben
bestehen. Es gibt weiterhin genau einen COM-Weg über PowerShell und `Display()`.

Explizite `moduleId` muss ein kanonisches installiertes Modul mit deklarierter
`mail`-Capability sein. Anschließend prüft der unveränderte zentrale
`enforceLicensedFeature(moduleId)` die Freigabe. Fehlende Identität bleibt nur
für bisherige Aufrufer der Protokoll-Kompatibilitätsfall; eine ausdrücklich
leere, unbekannte oder unzulässige Identität fällt niemals auf Protokoll zurück.
Der produktive Protokoll-Aufrufer übergibt seine Identität nun ausdrücklich.
Es wird keine weitere Lizenzimplementierung oder freie Servicefreigabe eingeführt.

Gemeinsamer neuer Aufruf:

```js
const result = await new MailTransportService().openDraft({
  moduleId: "sigeko",
  recipients: ["adresse@example.invalid"],
  subject: "Fertiger Betreff aus dem Fachmodul",
  body: "Fertiger Mailtext aus dem Fachmodul",
  attachments: [absoluteFilePath],
});
```

Neue Modulaufrufe benötigen weder MainHeader noch Protokoll-Mailflow.
Auch `send()` mit expliziter Modul-ID nutzt diese geschützte Grenze; `forceMailto`
umgeht sie nicht. Der bestehende Protokoll-Transport ohne explizite Dienst-ID
behält seinen bisherigen mailto-Fallback für Mails ohne Anhänge.

Erfolg lautet exakt:
`{ ok: true, outcome: "draft-opened", transport: "outlook" }`.
Ein bloßes `ok` ohne diese Bedeutung wird im neuen Aufruf nicht als Erfolg
akzeptiert. Der Adapter verlangt einen echten Exitcode 0 und die Meldung nach
`Display()`. Ein Signalabbruch mit Exitcode `null` ist kein Erfolg mehr.
Das spätere Verwerfen in Outlook wird weder beobachtet noch als Versand erfasst.

Anhänge müssen absolute, lesbare reguläre Dateien sein. Die vorhandene
Mehrfachauswahl, Deduplizierung und `attachmentPath` bleiben unterstützt. Der
PowerShell-Teil prüft jede Datei erneut und bricht bei verschwundenen Dateien ab;
er überspringt sie nicht mehr still. Keine automatische mailto-Ersatzübergabe
bei einem fehlgeschlagenen Entwurf mit Anhängen. Empfänger, Betreff, Unicode,
Zeilenumbrüche und lange Texte werden als UTF-8-JSON aus einem separaten
temporären Auftragsverzeichnis gelesen. Nur dessen Pfad steht in den
Prozessargumenten. Das Verzeichnis wird im Erfolgs- und Fehlerfall entfernt.
Timeout nach 60 Sekunden meldet eine unbestätigte Öffnung, keinen Versand.

## Ausgeführte Prüfung

- 19 neue deterministische Tests am produktiven Handler/Dienst mit injiziertem
  Prozessstart; fünf vorhandene Protokoll-Transporttests ebenfalls grün.
- Berechtigung vor Dateizugriff/Prozessstart, SiGeKo ohne Protokoll, unzulässige
  Modul-IDs, Legacy-Protokollrecht, mehrere Anhänge, lange Unicode-Texte,
  fehlende/relative/Verzeichnisanhänge, Plattformfehler, Spawn-/COM-Fehler,
  Null-/Nichtnull-Exit, fehlende Bestätigung, Timeout und Rendererfehler geprüft.
- Alte Quellenprüfungen für COM und Lizenzzuordnung folgen dem tatsächlich
  ausgelagerten Eigentümer. Der bisherige pauschale Protokoll-Guard-Test prüft
  nun Modul/Capability und den verbleibenden Legacy-Protokollfall.
- Volltest auf unverändertem main in separatem Worktree: 1527 grün / 97 rot.
  Kandidat: 1546 grün / exakt dieselben 97 Fehlernamen. 19 zusätzliche Tests,
  eine dokumentierte Umbenennung, kein fehlender Bestandsprüffall. Exakte
  Namen und Loghashes: `SIGEKO_S1_5_TESTVERGLEICH.json`.
- Syntaxprüfung der geänderten CommonJS-Dateien und `git diff --check` grün.
  Der Windows-Abnahmestarter weist Linux ausdrücklich ab; das ist kein
  bestandener Outlook-Test. Die gemeinsame CI prüft die Grenztests auf Linux
  und Windows sowie das erzeugte Skript mit dem Windows-PowerShell-Parser.

CI-Lauf [34188452956](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34188452956)
auf Code-Commit `8201340`: jeweils 24 Grenz-/Protokolltests auf Windows und Linux
grün; Windows-PowerShell-Parser ebenfalls grün. Das ist kein Outlook-COM-Nachweis.
Standard-npm-CI bleibt mit der bekannten Umgebungs-/Testbaseline rot.

## Noch erforderliche praktische Abnahme

`npm run test:sigeko:s1.5:outlook` auf Windows mit installiertem klassischem
Outlook (COM) ausführen. Der Runner erzeugt ein eigenes temporäres Profil und
verwendet die vorhandene isolierte Lizenzstatus-Fixture mit nur SiGeKo. Der reale
zentrale Guard läuft ohne Protokoll-/Restarbeiten-DEV-Ausnahmen. Keine Änderung
an einer produktiven Lizenz oder Nutzerdatenbank; keine kryptografische
Kundenlizenzprüfung behauptet.

Der Ablauf prüft über echtes Electron-Preload/IPC zuerst Protokoll-Sperre,
SiGeKo-Sperre und fehlenden Anhang. Danach öffnet er einen echten Outlook-Entwurf
an die reservierte Testadresse `bbm-abnahme@example.invalid` mit zwei Textanlagen.
Empfänger, Betreff, Mailtext und beide geöffneten Anlagen prüfen. Anschließend
den Entwurf verwerfen und im Abnahmedialog bestätigen. Das Ergebnis steht in
der beim Start angezeigten `mail-acceptance-result.json`. Der Dialogabschluss ist
als manuelle Bestätigung gekennzeichnet, nicht als technische Versandbeobachtung.

Dieser praktische Ablauf wurde hier mangels Windows/Outlook nicht ausgeführt.
Nach AGENTS.md (Goal-Abschluss nur mit tatsächlich erfüllten Kriterien) bleibt
S1.5 bis zu diesem Nachweis offen und der PR Entwurf. Kein Merge und kein
Folgepaket vor der fehlenden Abnahme. Die bestehende sporadische PDF-Viewer-
Baseline aus S1.4 bleibt ein separates offenes Thema.

Bekannte ältere mailto-Rückgabeprobleme und das Schließen des älteren
MainHeader-Maildialogs unabhängig vom Ergebnis wurden bei der Bestandsanalyse
gefunden. Der neue explizite Modulpfad benutzt diese Stellen nicht; sie werden
in S1.5 nicht nebenbei umgebaut. Keine Behauptung einer Mailzustellungsprüfung.
