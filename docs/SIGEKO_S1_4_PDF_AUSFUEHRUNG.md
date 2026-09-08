# S1.4 – PDF-Provider an die vorhandene Ausführung anschließen

Grundlagen: Gesamtplan #277, SiGeKo #274, main `bd5ab3d` nach S1.4a / PR #322.
Dieses Paket ergänzt den dort bereits gelieferten erfolgreichen technischen
PDF-Ablauf um die verbleibenden Freigabe-, Fehler- und Abbruchnachweise.
Primär Container 6, notwendige kleine Korrektur am gemeinsamen Druckdienst.

## Umfang und Entwurfsentscheidung

Keine neue editorrelevante Ausgabe. Der technische Beleg, seine vier expliziten
Refs, Parents, Bearbeitungsrechte und Layoutgrenzen aus
`SIGEKO_S1_4A_PDF_PROVIDER.md` bleiben unverändert. Fachaktionen einschließlich
Speichern, Anlegen, Löschen, Upload, Import und Datenänderung werden keine
Editorziele. Bestehende Registry-, DOM- und Regenerationstests bleiben aktiv.

S1.4 verbindet beziehungsweise bestätigt den neutralen Provider im vorhandenen
Render-, Vorschau- und Speicherweg mit Modulberechtigung ohne Protokollzwang.
Keine Vorankündigung, kein SiGePlan- oder Berichtsrenderer, keine A2-Überlagerung,
kein neuer PDF-/Editorweg. Die beiden Blankovorlagen bleiben bytegleich;
SiGePlan bleibt DIN A2 quer. Rechnung #275 bleibt eingefroren. S1.5 nicht begonnen.

## Korrektur im gemeinsamen Druckauftrag

Der vorhandene `_printToPdf` konnte nach einem Timeout eine inzwischen asynchron
gelieferte PDF noch schreiben. Mehrfache passende `print:ready`-Meldungen konnten
mehrere Druckaufrufe starten; Fenster-/Rendererabbrüche warteten bis zum Timeout.

Der Auftrag akzeptiert jetzt genau einen Druckstart und genau einen Abschluss.
Timeout, geschlossenes Fenster, Renderer-Verlust, Load-, Render-, Druck- oder
Schreibfehler bleiben Fehler. Nach `printToPDF` wird vor dem Schreiben erneut
der Abschlusszustand geprüft. Bei Providern wird auch die zentrale Freigabe
frisch geprüft. Späte Antworten erzeugen nach einem Abbruch keine PDF.
Load-/Ready-/Abbruchlistener und Timer werden beim Abschluss entfernt.

Die bestehenden Druckoptionen, Dateinamensregeln, Zielauflösung, Layouts und
Erfolgsmetadaten bleiben erhalten. Es gibt weiterhin genau einen produktiven
`webContents.printToPDF`-Aufruf. Keine zusätzliche Infrastruktur oder Fachabfrage.

## Nachweis und Grenzen

- `scripts/tests/printJobLifecycle.test.cjs`: elf deterministische Tests am
  echten exportierten Druckdienst/IPC mit kontrollierten Fenster-/OS-Grenzen.
  Geprüft sind Fremd-/Doppelmeldungen, tabellarischer Erfolg, Provider-Metadaten,
  Freigabeentzug während Druck, Timeout mit später PDF-Antwort, Schließen vor/
  während Druck, Rendererabbruch, Rendererablehnung, Druck-/Schreib-/Loadfehler.
- `npm run test:sigeko:s1.4` erweitert denselben isolierten Electron-Abnahmelauf
  aus S1.4a. Der alte Befehlsname bleibt ein Alias. Echte Preload-/IPC-Aufrufe,
  Chromium-PDFs, Speicherung, interne Vorschau, Wiederöffnen und Editor-
  Regeneration werden zusätzlich mit negativen Abläufen und Wiederanlauf geprüft.
- Der Lizenzstatus ist ausdrücklich eine Test-Fixture mit nur `sigeko` oder
  ohne freigeschaltetes Modul. Der produktive `licenseService` und `featureGuard`
  laufen unverändert; allein die Statuszufuhr und die App-Fassade des geprüften
  Guards werden beim synchronen Import isoliert ersetzt. Dadurch gelten keine
  DEV-Ausnahmen für Protokoll/Restarbeiten. Kein dauerhafter Loader-Hook, keine
  Produktlizenzänderung, keine Aussage über kryptografische Kundenlizenzprüfung
  oder eine ausgelieferte Installation. Andere Module werden tatsächlich vom
  zentralen Guard abgewiesen.
- Reale Fehlerszenarien: SiGeKo-Entzug an PDF-/Vorschau-Einstiegen, widersprüchlicher
  Providerkontext ohne Protokoll-Fallback, Protokoll ohne Freigabe, ungültige Daten,
  fehlendes Projekt, unbrauchbare Ablage, geschlossenes Druckfenster, Timeout und
  Freigabeentzug vor der Renderer-Datenabfrage. Erwartet werden `ok: false`, kein
  fertiger Dateipfad, unveränderter PDF-Bestand und aufgeräumte Druckfenster/Listener.
  Danach muss derselbe Druckweg wieder erfolgreich eine echte PDF erzeugen.
- Native WPF-Editorbedienung wird durch dieses Paket nicht geprüft. Die frühere
  Font-/Standard-CI-Baseline wird nicht als bestandene Prüfung ausgegeben.

Volltest in identischer aktueller UTC-/Electron-/Kit-Umgebung: **1516 grün / 97 rot
auf unverändertem main → 1527 grün / exakt dieselben 97 Fehler**. Kein Bestands-
prüffall fehlt; elf neue Tests grün. Zwei historische Datumsfehler aus dem früheren
Stand 1514/99 bestehen bereits im erneuten Basislauf nicht mehr; dies ist keine
Verbesserung durch S1.4. Exakte Namen, Laufdaten und Loghashes stehen in
`SIGEKO_S1_4_TESTVERGLEICH.json`.

Reale Windows-/Linux-Abnahme **bestanden** auf Code-/Harness-Stand `895bc4d`:
[GitHub-Lauf 34185714616](https://github.com/SteffenBandholt/BBM-Produktiv/actions/runs/34185714616).
Beide Betriebssysteme bestätigen alle elf realen Fehlerfälle ohne neue/veränderte
PDFs und ohne verbliebene Druckfenster/Ready-Listener; anschließender echter Druck
funktioniert. Speicherung, sichtbare Vorschau, bytegleiches Wiederöffnen, vier
explizite DOM-Refs, Overflow-Abweisung und Schriftwechsel 14→15 pt bleiben grün.
Alle 49 Bestands-Snapshots sind strukturell und in den Seitenzahlen identisch.
Die Screenshots beider Systeme wurden visuell geprüft; vollständige technische
Berichte und Artefakt-IDs sind im JSON-Nachweis verzeichnet.

Die Vorläufe `34185354299` und `34185520594` waren teilweise fehlgeschlagen und
werden nicht als bestanden gewertet. Der Abnahmelauf wartet jetzt auf tatsächlich
gezeichnete PDFs und asynchron geschlossene Druckfenster. Vor dem Wiederöffnen
entlädt er die aktive PDF im selben Vorschaufenster; direktes erneutes `loadURL`
auf die aktive PDF zeigte unter Linux einen dunklen Viewer. Diese Korrekturen
betreffen ausschließlich den Testablauf, nicht die produktive Vorschau.

Der Standard-`npm test`-Workflow bleibt wegen des dort fehlenden UI-Editor-kit
und der bekannten acht Popup-/Lizenzfehler rot (Lauf `34185714605`). Er wird
nicht als grün ausgegeben. Der vollständige Vergleich oben nutzt das echte Kit.
S1.4 ist technisch abgeschlossen; Übergabe über PR #323.

Kurzfahrplan: S1.4 vollständig nachweisen; Ergebnis in #274/#277 dokumentieren;
erst danach S1.5 als eigenes Paket beginnen.
