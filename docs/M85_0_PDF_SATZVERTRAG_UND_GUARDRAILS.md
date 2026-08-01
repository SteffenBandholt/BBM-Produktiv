# M85.0 – PDF-Satzvertrag und Guardrails

## Status

- Status: `[A] abgenommen`
- Technischer Vertrag, 47 neutrale Fixtures, reproduzierbare Struktursnapshots und zentrale Guardrails sind vorhanden.
- M85.1 ist `[A]` abgenommen: Die vier ausdrücklich beauftragten Protokoll-Lücken Seitenzähler, Level-1-Keep-with-next, Teilnehmerzeilen und Vorbemerkungsfortsetzung sind geschlossen und sichtbar geprüft.
- M85.2 ist `[A]` abgenommen: Restarbeiten-Messung und Renderer verwenden
  denselben Querformat-Kontext, Datensatz-/Fortsetzungsregeln sind verriegelt
  und Vorschau/Drucken verwenden den echten internen PDF-Produktweg.
- Protokoll und Restarbeiten sind gemeinsam automatisiert und sichtbar geprüft;
  damit ist auch M85.0 `[A]`.

## Ziel und Nicht-Ziele

M85.0 inventarisiert den bestehenden V2-PDF-Weg, dokumentiert dessen
nachgewiesene Regeln und schützt die aktuelle Struktur vor stillen Änderungen.
M85.2 bindet ausschließlich die bestehenden Restarbeiten-Ausgabeaktionen an
diesen Weg an. Nicht umgesetzt wurden eine neue PDF-Gestaltung, ein neuer
Renderer, eine zweite Paginierung, ein zweiter Profilstore, eine
Registry-Migration, eine Fachlogikänderung oder ein neuer PDF-Editor.

Der verbindliche Satzvertrag steht in `docs/PDF_SATZVERTRAG_V2.md`.

## Umgesetzter Nachweis

### Produktiver Protokollweg

`PrintModal` → `print:toPdf` → `getPrintData` → `printApp._buildPages/_paginateTops` → `PrintShell.renderPrint` → `applyBbmPdfEditorLayout` → `webContents.printToPDF`.

### Verbindlicher Restarbeiten-PDF-Weg

`RestarbeitenScreen` → `printPdfAndPreviewInternal` →
`print:toPdfAndPreviewInternal` → `getPrintData` → `_paginateGeneric` →
`PrintShell` → einziger `webContents.printToPDF`-Aufruf → interne
BBM-PDF-Vorschau. Vorschau und Drucken nutzen denselben Aufruf. Die historische
HTML-Vorschau bleibt vorhanden, wird aber nicht mehr als Produktweg verwendet.

### Testdescriptor

`src/renderer/print/v2/pdfSatzvertragV2.js` wird nur aktiv, wenn der isolierte Harness `pdfSatzvertragSnapshot: true` sendet. Er liest das bereits gebaute Seitenmodell und DOM-Metriken. Ohne dieses Testflag ändert sich der produktive Lauf nicht.

### Isolierter Electron-Harness

`scripts/pdf-v2/runM85PdfFixtures.cjs`:

- startet Electron aus einem Node-Elternprozess, der das isolierte Profil erst
  nach dem vollständigen Ende des Kindprozesses löscht;
- verwendet ein temporäres, eigenes `userData` und `sessionData`;
- liefert neutrale Fixture-Daten direkt über den bestehenden Print-Preload;
- lädt die echten CSS-, Header-, Pager- und Rendererdateien;
- kann mit den produktiven A4-`printToPDF`-Optionen lokale PDFs erzeugen;
- entfernt sein isoliertes Profil im `finally`-Pfad;
- öffnet keine Benutzerlizenz, `app.db`, `app.db.bak` oder echte Projektdaten.

## Fixture-Inventar

| Nr. | ID | Fall | Golden-Seiten |
|---:|---|---|---:|
| 1 | `p01-empty` | leeres Protokoll | 1 |
| 2 | `p02-one-page` | genau eine Seite | 1 |
| 3 | `p03-two-pages` | genau zwei Seiten | 2 |
| 4 | `p04-just-fits-first` | Datensatz passt mit nur wenigen Millimetern Rest auf Seite 1 | 1 |
| 5 | `p05-just-misses-first` | derselbe neutrale Grenzinhalt wird vollständig auf Seite 2 verschoben | 2 |
| 6 | `p06-level-one-near-end` | Level-1 nahe Seitenende | 2; Titel und erster Unterpunkt bleiben zusammen |
| 7 | `p07-short-longtext` | kurzer Langtext | 1 |
| 8 | `p08-very-long-longtext` | sehr langer Langtext | 2 |
| 9 | `p09-continuation` | Fortsetzung nach bereits belegter Seite | 3 |
| 10 | `p10-many-short` | viele kurze TOPs | 3 |
| 11 | `p11-small-participants` | kleiner Teilnehmerbereich | 1 |
| 12 | `p12-large-participants` | großer Teilnehmerbereich | 3; vollständige Zeilen und wiederholter Kopf |
| 13 | `p13-short-preremarks` | kurze Vorbemerkung | 1 |
| 14 | `p14-long-preremarks` | sehr lange Vorbemerkung | 4; Wortgrenzen und Fortsetzungskennzeichnung |
| 15 | `p15-closing-near-end` | Abschluss knapp am Seitenende | 3 |
| 16 | `p16-changed-columns` | geänderte TOP-Spaltenbreiten | 3 |
| 17 | `p17-changed-font` | geänderte Kopf-Schriftgröße | 3 |
| 18 | `p18-changed-line-spacing` | geänderter TOP-Zeilenabstand | 3 |
| 19 | `r19-empty` | leere Restarbeitenliste | 1 |
| 20 | `r20-one-page` | einseitige Restarbeitenliste | 1 |
| 21 | `r21-multiple-pages` | mehrseitige Restarbeitenliste | 4 |
| 22 | `r22-short-record` | kurzer Restarbeit-Datensatz | 1 |
| 23 | `r23-very-long-record` | sehr langer Langtext mit Fortsetzung | 4 |
| 24 | `r24-just-before-end` | Datensatz passt gerade noch vollständig | 1 |
| 25 | `r25-just-misses-end` | Datensatz beginnt vollständig auf Seite 2 | 2 |
| 26 | `r26-many-short` | viele kurze Datensätze | 3 |
| 27 | `r27-columns-unsupported` | verriegelte 13 Spalten | 1 |
| 28 | `p28-participants-exact-boundary` | Teilnehmer füllen den Teilnehmerbereich exakt; Abschluss folgt regelkonform | 2 |
| 29 | `p29-participants-miss-boundary` | eine weitere vollständige Teilnehmerzeile benötigt Seite 2 | 2 |
| 30 | `p30-participants-three-pages` | 40 Teilnehmer über mindestens drei Seiten | 3 |
| 31 | `p31-single-tall-participant` | einzelne überhohe Teilnehmerzeile | 3; deterministische Wortsegmente |
| 32 | `p32-preremarks-over-boundary` | Vorbemerkung überschreitet den Restplatz | 2; Wortgrenzen und Fortsetzung |
| 33 | `p33-preremarks-multiple-pages` | Vorbemerkung über mehrere Seiten | 4 |
| 34 | `p34-participants-preremarks-tops` | Teilnehmer, Vorbemerkung und TOPs kombiniert | 4 |
| 35 | `r35-very-long-short-text` | sehr langer Kurztext | 6 |
| 36 | `r36-very-long-note` | sehr lange Notiz/Maßnahme | 6 |
| 37 | `r37-two-page-record` | ein Datensatz über genau zwei Seiten | 2 |
| 38 | `r38-all-columns-max` | alle 13 Spalten stark belegt | 2 |
| 39 | `r39-status-ampel` | Status- und Ampelvarianten | 1 |
| 40 | `r40-long-locations` | lange Verortungsangaben | 1 |
| 41 | `r41-filtered-order` | gefilterte sichtbare Reihenfolge | 1 |
| 42 | `r42-deleted-excluded` | gelöschte Restarbeit ausgeschlossen | 1 |
| 43 | `r43-no-extra-page` | kein leeres Zusatzblatt | 1 |
| 44 | `r44-repeated-head` | Tabellenkopf auf Folgeseiten | 3 |
| 45 | `r45-footer-boundary` | Fußreserve-Grenzfall | 2 |
| 46 | `r46-landscape-contract` | A4-Querformat und 273-mm-Tabelle | 1 |
| 47 | `r47-mixed-long-fields` | lange Inhalte in mehreren Spalten | 1 |

## Strukturelle Snapshots

Die vollständigen Snapshot-Objekte werden bei jedem Lauf neu erzeugt. Versioniert werden die erwartete Seitenzahl und der SHA-256 jedes vollständigen neutralen Snapshot-Objekts in `m85GoldenManifest.cjs`. Dadurch schlagen Änderungen an Seitenart, Kopfart, sichtbarem Seitenzähler, Blockreihenfolge, Datensatzreihenfolge, Segmentierung, Tabellenkopf, Fußreserve, Höhen oder angewandten Designwerten fehl.

Zwei getrennte vollständige Harness-Läufe waren vor Aufnahme der Hashes identisch.

## Guardrails

Grün geprüft:

- Seite 1 besitzt GlobalHeader und FullHeader mit sichtbarem, innerhalb der Seite liegendem Zähler; Folgeseiten besitzen MiniHeader und sichtbaren Zähler.
- Jede Seite besitzt den 12-mm-Fußreserve-Spacer.
- Seitentabellen mit Datensätzen besitzen einen Tabellenkopf.
- Datensatzreihenfolge bleibt stabil.
- p04 bleibt einseitig; p05 verschiebt den letzten vollständigen Datensatz auf Seite 2.
- p06 verschiebt eine Level-1-Zeile zusammen mit ihrem ersten zulässigen Unterpunkt.
- Teilnehmer werden nur als vollständige Tabellenzeilen aufgeteilt; Überschrift und Tabellenkopf werden auf Folgeseiten wiederholt. Nur eine einzelne, selbst für eine leere Seite zu hohe Zeile wird mit stabiler Quell-ID und `Fortsetzung:` segmentiert.
- Vorbemerkungen werden ausschließlich an Wortgrenzen geteilt; Folgeblöcke sind als `Vorbemerkung (Fortsetzung):` gekennzeichnet und enthalten alle Wörter genau einmal.
- TOP-Fortsetzungen verwenden `start`/`continuation` und die vorhandenen Mindestzeilenregeln.
- Abschluss erscheint nur auf der letzten TOP-Seite.
- `setPageBreakRule` und Fachoperationen sind in allen 28 Elementen gesperrt.
- Editorwerte verwenden die bestehende Messung; der Overlay-Code besitzt keine Seitenzuweisung oder Splitlogik.
- genau ein PrintShell-Renderer, ein TOP-Pager, ein generischer Pager, ein `printToPDF`-Aufruf und der vorhandene Profilweg bleiben nachweisbar.

Durch M85.1 geschlossen:

- `PDF-V2-SATZ-004`: sichtbarer Seitenzähler im Protokoll-FullHeader.
- `PDF-V2-SATZ-010`: gemessenes Keep-with-next für Level 1 und ersten Unterpunkt.
- `PDF-V2-PROT-001`: vollständige Teilnehmerzeilen, wiederholter Kopf und deterministischer Sonderfall für eine einzelne überhohe Zeile.
- `PDF-V2-PROT-002`: Wortgrenzen-Paginierung mit eindeutiger Fortsetzungskennzeichnung.

Durch M85.2 geschlossen und verriegelt:

- `PDF-V2-REST-002`: vollständige Datensätze bleiben zusammen; nur ein selbst
  überhohes Kurztext-, Langtext- oder Notizfeld wird an Wortgrenzen mit stabiler
  Quell-ID und sichtbarer Fortsetzung geteilt.
- `PDF-V2-REST-003`: Mess- und Renderkontext verwenden dieselben V2-Köpfe,
  dieselbe Restarbeiten-Tabelle, dieselben 13 Spalten, Zeilenbuilder, Schriften
  und CSS-Werte.
- `PDF-V2-REST-005`: der Produktaufrufer übergibt ausschließlich sichtbare,
  gefilterte, nicht gelöschte Datensätze in sichtbarer Listenreihenfolge; der
  PDF-Pfad sortiert nicht nach.
- `PDF-V2-REST-006`: A4-Querformat und 273-mm-Baseline der 13 Spalten sind fest
  dokumentiert. Die Spalten sind bewusst noch nicht als Editorziele
  registriert; Satzregeln und Gesamtbreite bleiben gesperrt.

## Registrybewertung

Die 28 Protokollelemente bleiben unverändert. Dokument, Seite,
Hauptkopfbereiche, Teilnehmer, TOP-Tabelle, drei Spalten, Tabellenköpfe,
Abschluss und Aufgestellt-Bereich sind abgebildet. Es fehlen komponentennahe
Einzelziele für Vorbemerkung, Teilnehmer-Spalten,
TOP-Kurz-/Langtext/Meta-Unterzeilen, Legende, Nächster-Termin-Text und getrennte
Kopfvarianten. Satzträger wie Seite, Split, Wiederholung und Fußreserve dürfen
nie Editorziele werden.

Für eine spätere Restarbeiten-Registrierung kommen Tabellenbereich,
Tabellenkopf und die 13 expliziten Spalten mit den in
`PDF_SATZVERTRAG_V2.md` dokumentierten Grenzen in Betracht. M85.2 erzeugt keine
Registry und keinen Profilwert. Papierformat, Gesamtbreite, Reihenfolge,
Kopfwiederholung, Fußreserve und Splitregeln bleiben gesperrt.

Eine spätere M83.0-artige Vollregistrierung ist sinnvoll, wurde hier aber nicht begonnen. Das UI-Editor-kit war für die appinterne Verriegelung nicht zu ändern.

## Automatisierte Prüfung

- `npm run test:m85:pdf`: grün; alle 47 Fixtures, Golden-Seitenzahlen und
  vollständigen Strukturhashes stimmen; ein zusätzlicher Guardrail bestätigt,
  dass dabei kein neues isoliertes Electron-Profil zurückbleibt.
- `npm test`: grün, 8/8 Gruppen einschließlich der bestehenden
  M81-/Print-/Header-/Protokoll-/Restarbeiten-Suiten und der M85-Suite.
- `npm run test:node`: grün, 8/8 Gruppen; Node 22.21.1 / ABI 127 wurde vor dem
  Lauf aufgebaut und Electron ABI 123 im `finally`-Pfad wiederhergestellt.
- Gezieltes ESLint der neuen M85-CJS-Dateien, des Descriptors, der
  Gruppenregistrierung und des angepassten Orchestrierungstests: grün.
- `git diff --check`: grün.
- `printApp.js` besitzt unverändert zwei bereits im Ausgangsstand vorhandene
  ESLint-Fehler (`_readMetaInsetMm`, `manualZone`) außerhalb der M85-Zeilen;
  sie wurden nicht im Rahmen dieses Satzvertrags bereinigt.

## Sichtbare Abnahme

Für M85.1 wurden mit dem echten `webContents.printToPDF`-Pfad acht neutrale
Protokoll-PDFs temporär erzeugt, sämtliche 23 Seiten mit Poppler gerendert und
sichtbar geprüft:

- `p03-two-pages`: Seite 1 zeigt sichtbar `Seite 1 / 2` innerhalb des
  FullHeaders; Seite 2 zeigt `Seite 2 / 2` im MiniHeader.
- `p06-level-one-near-end`: Level 1 beginnt auf Seite 2 unmittelbar vor seinem
  ersten Unterpunkt; kein verwaister Titel.
- `p09-continuation`: drei Seiten mit unverändertem TOP-Fortsetzungsweg,
  wiederholtem Tabellenkopf und vollständigem Abschluss.
- `p15-closing-near-end`: drei Seiten; der Abschluss bleibt vollständig auf
  der letzten Seite ohne leere Zusatzseite.
- `p29-participants-miss-boundary`: elf vollständige Zeilen auf Seite 1, die
  zwölfte vollständige Zeile mit wiederholter Überschrift und Kopf auf Seite 2.
- `p30-participants-three-pages`: 40 vollständige Teilnehmerzeilen auf drei
  Seiten; keine Zeile wird an einer Seitengrenze abgeschnitten.
- `p33-preremarks-multiple-pages`: vier Seiten; jede Fortsetzung beginnt an
  einer Wortgrenze und trägt die sichtbare Fortsetzungskennzeichnung.
- `p34-participants-preremarks-tops`: vier Seiten; Teilnehmer, Vorbemerkung,
  TOP-Tabelle und Schlusszone bleiben in fester Reihenfolge vollständig.

Für M85.2 wurden zehn neutrale Restarbeiten-PDFs mit insgesamt 20 Seiten
vollständig angesehen: Leerzustand, ein-/mehrseitige Liste, gerade passender und
knapp nicht passender Datensatz, sehr langer Langtext, ein Datensatz über genau
zwei Seiten, alle 13 stark belegten Spalten, gefilterte Reihenfolge und
Fußreserve-Grenze. Zusätzlich wurde der echte Produktweg im isolierten
Acceptance-Profil über `Ausgabevorschau` und anschließend ausdrücklich über
`Drucken` betätigt. Beide Aktionen öffneten die interne BBM-Vorschau mit der
tatsächlich erzeugten dreiseitigen Querformat-PDF und 60 synthetischen Zeilen.
Tabellenkopf, 13 Spalten, Seitenzähler und Fußreserve waren auf allen drei
Seiten vollständig sichtbar.

Als Protokoll-Kurzregression wurden p03, p09, p30, p33 und p34 mit insgesamt 16
Seiten erneut vollständig angesehen. Die Golden-Hashes aller 25
Protokoll-Fixtures blieben bytegleich zum M85.1-Manifest-Digest
`e0f938b189abbadb8c955fb8c45218aacac086364ecb0d2e6499beb8554178be`.

Die Binär-PDFs und gerenderten Kontrollbilder werden nach der Prüfung entfernt.
Die PDF-Editor-Werte für Protokoll-Spaltenbreite, Schriftgröße und
Zeilenabstand sind über `p16` bis `p18` strukturell und durch die vorhandenen
Save-/Restore-/Reset-/Rollback-Tests abgedeckt. M85.1 und M85.2 sind `[A]`; nach
der gemeinsamen automatisierten und sichtbaren Prüfung ist M85.0 ebenfalls
`[A]`.

## Schutz

- `docs/licensing.md` bleibt Fremdänderung und wird nicht berührt.
- Der Fixture-Harness und der erfolgreiche Produkt-Acceptance-Lauf verwenden
  ausschließlich isoliertes `userData`/`sessionData` und synthetische Daten.
- Schutzabweichung der lokalen Abnahme: Ein erster manueller Acceptance-Start
  verwendete versehentlich einen falschen Schalternamen und startete Electron
  kurz mit dem normalen `userData`-Pfad. Der Prozess wurde sofort ohne
  UI-Aktion beendet. Benutzerlizenz und Datenbanken wurden nicht direkt
  geöffnet oder geprüft; eine automatische Berührung durch diesen kurzen Start
  kann nicht zweifelsfrei ausgeschlossen werden. Deshalb wird keine
  Bytegleichheit von Benutzerlizenz, `app.db` oder `app.db.bak` behauptet.
- Fixtures enthalten ausschließlich synthetische Namen, IDs, Telefonnummern und `example.invalid`-Adressen.
- Kein Commit, Push, Pull Request oder Merge ist Teil von M85.0.
