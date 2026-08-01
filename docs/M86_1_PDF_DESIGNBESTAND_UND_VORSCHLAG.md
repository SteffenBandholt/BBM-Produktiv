# M86.1 – PDF-Designbestand und Gestaltungsvorschlag

## Status und Rahmen

Status: Vorschlag, noch nicht umgesetzt.

Diese Unterlage wertet den bestehenden produktiven V2-PDF-Weg und die neutralen M86.0-Referenz-PDFs aus. Sie enthält keine Änderung an CSS, Renderer, Paginierung, Druckweg, Registry oder Editor. Der bestehende Satzvertrag aus `PDF_SATZVERTRAG_V2.md` bleibt maßgeblich.

Unverändert und nicht Gegenstand dieses Pakets bleiben insbesondere:

- `PrintModal -> print:toPdf -> getPrintData -> printApp -> PrintShell -> webContents.printToPDF`;
- genau ein Renderer, eine Paginierung und eine PDF-Registry;
- A4, Ränder, Seitenwechsel, Fußreserve und Satzregeln, bis ein späteres Gestaltungspaket sie mit den M85-Golden-Fixtures erneut verifiziert;
- alle Fachdaten, Benutzerdateien und die Lizenzierung.

Die folgenden Maße sind entweder dokumentierte Istwerte oder ausdrücklich als **Vorschlag** gekennzeichnet. Ein Vorschlag ist kein bereits wirksamer Satzparameter.

## 1. Istbestand

### 1.1 Logo, Kopf und Platzhalter

Der produktive V2-Kopf besitzt drei Drucklogo-Slots. Jeder Slot wird über die Druckeinstellungen mit `enabled`, `pngDataUrl`, `size`, `align` und `vAlign` geführt. Die sichtbaren Größenstufen sind kategorial und nicht numerisch: `small = 22 mm`, `medium = 30 mm`, `large = 45 mm` maximale Logohöhe. Die Slots haben derzeit je eine 60 × 45-mm-Box und 3 mm Abstand.

Zusätzlich existiert eine ältere Einstellung unter `pdf.userLogo*` mit numerischer Breite, oberem und rechtem Abstand. Sie wird im aktuellen produktiven V2-Druckdatenweg nicht in die V2-Logos übernommen. Sie ist daher kein verlässlicher Steuerpunkt für den V2-Kopf. Gleiches gilt für allgemeine App-Header-Logo-Einstellungen außerhalb der V2-Druckeinstellungen.

Der aktuelle V2-Kopf hat folgenden Effekt:

| Zustand | Tatsächliches Verhalten |
|---|---|
| kein aktiviertes Logo | Drei leere Logo-Boxen bleiben vorhanden und zeigen `Logo optional - Einstellungen > Drucken > Logos`; die Kopfzone bleibt 50 mm hoch. |
| mindestens ein Logo, adaptiv aus | Die Kopfzone bleibt 50 mm hoch. |
| mindestens ein Logo, adaptiv an | Die Laufzeit misst die unterste belegte Logo-Kante und setzt die Kopfzone auf diese Kante plus 3 mm Abstand und ca. 0,265 mm Linienhöhe. |

Damit ist `print.v2.globalHeaderAdaptive` nur bei einem aktiven Logo wirksam. Ohne Logo kann sie den heute festen 50-mm-Kopf nicht verkleinern. Die sichtbaren Platzhalter in den M86.0-Referenzen haben genau diese Ursache; sie sind keine Projektdaten.

Die vorhandene Berechnung ergibt bei einem kleinen, oben ausgerichteten Logo mindestens rund 25,3 mm Kopfzone. Bei mittlerer oder unterer Ausrichtung sowie bei einem großen Logo liegt sie rund bei 33,3 bis 48,3 mm. Ein Zielwert von höchstens 15 mm ist folglich mit einem tatsächlich gedruckten 22-mm-Logo nicht erreichbar, ohne die zulässigen Logogrößen oder deren Platzierungsregel zu ändern.

Die Seiteninnenfläche beginnt derzeit 2 mm unter der Papierkante; links und rechts liegen jeweils 12 mm. Das ist ein Istwert, nicht die gewünschte Gestaltungsvorgabe von ungefähr 5 mm.

### 1.2 Vollkopf, Miniheader und Titelschrift

Seite 1 enthält GlobalHeader und FullHeader, Folgeseiten den Miniheader. Dieser Wechsel ist durch M85 abgesichert und bleibt unverändert. Der FullHeader ist heute 40 mm hoch. In seiner linken Inhaltsgruppe stehen in dieser Reihenfolge Projektkennzeichnung, Projektname, Dokumenttitel und optionaler Listenstand. Rechts stehen Seitenzähler und Benutzerbox.

Die aktuell angewandten CSS-Werte der linken Vollkopfgruppe sind:

| Element | Istwert |
|---|---:|
| Projektkennzeichnung | 10 pt |
| Projektname | 15 pt, fett |
| Dokumenttitel | 12 pt, Gewicht 600 |
| Listenstand | 10 pt |
| linker Einzug der Werte | 13 mm |

Die PDF-Registry führt zum Teil abweichende Baselines, etwa 16 pt für Projekt-Label/-Wert und 14 pt für den Titel. Diese Registry-Baselines sind nicht mit den aktuell angewandten CSS-Werten gleichzusetzen. Eine spätere Gestaltung muss beide Quellen bewusst harmonisieren, statt nur eine von ihnen zu verändern.

In den M86.0-Protokollreferenzen wirkt der Seitenzähler auf späteren Seiten sehr eng; auf Seite 4 ist er links angeschnitten. Im bestehenden CSS ist für die rechte Vollkopfgruppe ein `translateX(20mm)` vorhanden. Das ist ein prüfungswürdiger technischer Zusammenhang, aber mit dieser Dokumentation noch keine kausal bewiesene Fehlerursache und keine Reparatur.

### 1.3 Teilnehmerbereich

Der Teilnehmerbereich nutzt eine feste Tabelle mit Kopfzeile, Seitenteilungs-Schutz und Wiederholung der Überschrift/Kopfzeile. Die heutigen festen Spaltenwerte sind Name 34 mm, Rolle 35 mm, Firma 30 mm, Kontakt 55,12 mm und Kennzeichen 14,88 mm. Die Zellen verwenden 9,3 pt Text, 1,5 mm vertikales und 1,4 mm horizontales Innenmaß; die Kopfzeile ist hellgrau und fett.

Telefon und E-Mail sind bereits als zusammenhängender Kontaktblock gestapelt. Die Kennzeichen sind kompakt zweizeilig dargestellt. Diese fachliche und semantische Gruppierung bleibt erhalten. Der Bereich ist derzeit als Teilnehmer-Block/-Zeilen registriert, nicht als frei editierbare einzelne Teilnehmerspalten.

### 1.4 Vorbemerkungen

Der Einstellungsdialog begrenzt Vorbemerkungen heute auf **300 Zeichen und fünf explizite Zeilen**: Beim Speichern werden höchstens fünf durch Zeilenumbruch getrennte Zeilen sowie höchstens 300 Zeichen behalten. Die sichtbare Hilfe und das Textfeld verwenden dieselbe 300-Zeichen-Grenze.

Im Druckerzeuger wird ein historisch bereits längerer gespeicherter Wert nicht erneut auf 300 Zeichen gekürzt. Er wird dagegen sicher über den vorhandenen Wortgrenzen-Pager ausgegeben. Das erklärt, warum die technische Satzsicherheit nicht dieselbe Aussage ist wie die Einstellungseingabegrenze.

Bei 10 pt und einer Protokoll-Innenbreite von 186 mm entsprechen fünf gerenderte Zeilen je nach Wortlängen grob 425 bis 500 Zeichen. Eine reine Zeichengrenze garantiert jedoch keine maximale gerenderte Zeilenzahl.

### 1.5 TOP-Tabelle: heutige UI- und PDF-Spalten

Die TOP-Tabelle besitzt die drei sichtbaren Bereiche Nummer, Text und Meta. Die Werte werden derzeit je Ausgabemedium unabhängig definiert:

| Bereich | UI-Istwert | PDF-Istwert |
|---|---|---|
| Nummer | 64 px, 11 px Schrift | 23 mm, 8,5 pt Schrift |
| Text | `minmax(0, 1fr)`, 11 px Schrift | Restbreite, 9 pt Schrift |
| Meta | 74 px, 11 px Schrift | 15 ch, 6,5 pt Schrift |

Im PDF liegen die Seitenränder bei 12 mm und die verfügbare Tabellenbreite im Hochformat bei 186 mm. Die PDF-Registry nennt als Baseline 23 / 133 / 30 mm; die tatsächlich angewandte Meta-Breite verwendet jedoch `15ch` und ist damit von Schriftmetrik abhängig. Die vorhandenen Gewichtungen 2 / 6 / 1 sind Metadaten und keine tatsächlich angewandte Breitenformel.

Kurztexte sind einzeilig mit Ellipsis; Langtexte können umbrechen und werden vom bestehenden Pager gemessen beziehungsweise fortgesetzt. Die Metaspalte enthält kompakte, nicht umbrechende Status-/Termin-/Verantwortlich-Zeilen einschließlich Ampel. UI und PDF besitzen heute somit keine gemeinsame prozentuale Breitenquelle.

### 1.6 Legende, Termin und Footer

Die Drucklegende ist heute fest: blauer `neuer TOP`, schwarzer `im Soll / fertig`, roter `im Verzug / wichtig`. Optional kann ein Nächster-Termin-Text aus den bestehenden Druckeinstellungen folgen.

Der Footer nutzt die vorhandenen optionalen Einstellungen für Ort, Datum, Name 1, Name 2, Protokollführer, Straße, PLZ und Ort der Adresse sowie die Option, Profil-/Adressdaten zu verwenden. Es gibt keine gesonderten produktiven Einstellungen für Firma, Funktion, freie Zusatzzeile, Reihenfolge, Sichtbarkeit oder Footer-Schrift. Diese Optionen bleiben erhalten; Benutzerwerte wurden für diese Analyse nicht gelesen oder verwendet.

Legende und Footer verwenden heute jeweils 10 pt. Die Legende hat 5 mm Abstand nach oben, der Footer 10 mm. Die vertragliche Fußreserve von 12 mm ist gesperrt und darf nicht als Gestaltungsspielraum behandelt werden.

## 2. Gestaltungsvarianten für Kopf und Titel

Beide Varianten nutzen ausschließlich die bestehenden FullHeader-Elemente in derselben DOM-Reihenfolge. Sie verlangen keine neue Engine, keinen zweiten Renderer, keine neue Registry und keine neuen fachlichen Daten.

### Variante A – ruhiger, kompakter Dokumentkopf

- Kein Logo: Logo-Boxen und Platzhalter im Produktdruck entfallen; die GlobalHeader-Zone wird auf einen tatsächlich gemessenen flachen Kopf von etwa 5 bis 8 mm reduziert.
- Kleines echtes Logo: dessen tatsächliche Unterkante bestimmt weiter die benötigte Höhe; kein künstliches Leerfeld.
- Projektname 15 pt fett, Dokumenttitel 12,5 pt semibold, Projektlabel 9 pt.
- Eine zurückhaltende 0,5-mm-Akzentlinie in bestehendem Blau trennt Kopf und Dokumentinhalt.
- FullHeader bleibt innerhalb seiner heutigen 40-mm-Grenze; es wird keine neue Titelzone eröffnet.

Wirkung: sehr guter Flächengewinn bei fehlendem Logo und niedrige Satzrisiken. Risiko: wirkt weniger eigenständig als Variante B.

### Variante B – klarer Titelanker mit bestehender Struktur

- Dieselbe dynamische Behandlung fehlender Logos wie in Variante A.
- Projektname 16 pt fett, Dokumenttitel 12,5 pt semibold, Projektlabel 9 pt; Listenstand bleibt sekundär bei 9 bis 10 pt.
- Der vorhandene linke FullHeader-Textblock erhält eine 2-mm-blaue vertikale Akzentkante oder eine kurze obere Akzentlinie. Der Text, die Reihenfolge und die vorhandenen Blöcke bleiben unverändert.
- Der gestaltete Titelkern belegt etwa 31 bis 33 mm innerhalb des bestehenden 40-mm-FullHeaders. Seitenzahl und Benutzerbox werden nicht nach außen verschoben.

Wirkung: deutlicheres, modernes Dokumentprofil ohne zusätzliche Kopfebene. Risiko: die stärkere Akzentuierung und die korrekte Seitenzählerbreite müssen mit den Grenzfixturen erneut gemessen werden.

### Empfehlung

**Variante B wird empfohlen**, allerdings nur zusammen mit der dynamischen Logo-Behandlung aus Variante A. Sie liefert den gewünschten klaren, zeitgemäßen Titelanker, ohne die bestehende Kopfstruktur zu verändern. Die Umsetzung darf erst beginnen, wenn eine spätere M86-Entscheidung die genaue CSS-Variante, die Seitenzählerkorrektur und die aktualisierten Golden-Fixtures festlegt.

## 3. Konkreter Vorschlag für die nächste, separate Umsetzung

### 3.1 Logos und Kopfzone

1. Die drei bestehenden Drucklogo-Slots bleiben erhalten. Für ein fehlendes Logo rendert der Produktdruck weder leere Slot-Box noch Platzhaltertext. Ein Platzhalter wäre nur in einer ausdrücklich diagnostischen Einstellungs-Vorschau zulässig.
2. Die Kopfzonengröße wird aus den tatsächlich aktiven Logo-Metriken abgeleitet: `unterste sichtbare Logo-Kante + 3 mm Abstand + Linienhöhe`.
3. Bei keinem aktiven Logo wird ein separat getesteter flacher Wert von 5 bis 8 mm verwendet. Damit ist das Ziel „normaler Kopf höchstens 15 mm“ für den logo-losen Normalfall erfüllbar.
4. Für ein echtes 22-mm-Logo ist eine Höhe über 15 mm physikalisch notwendig; diese Ausnahme wird sichtbar und dokumentiert belassen, nicht durch Überlappung erzwungen.
5. Der heutige Seitentoprand von 2 mm soll in einem späteren Messpaket gegen etwa 5 mm geprüft werden. Wegen der Paginierung ist das kein rein kosmetischer Wert und darf nicht ohne Golden-Update geändert werden.

### 3.2 Teilnehmerbereich

Vorschlag für die 186-mm-Protokollinnenbreite:

| Spalte | Vorschlagsbreite | Begründung |
|---|---:|---|
| Name | 34 mm | Namen bleiben lesbar und unverändert priorisiert. |
| Rolle | 32 mm | etwas kompakter, ohne eine neue Bedeutung zu erzeugen. |
| Firma | 30 mm | bestehender, angemessener Wert. |
| Telefon/E-Mail | 72 mm | zusammenhängender Kontaktblock bekommt genug Raum. |
| Kennzeichen | 18 mm | kompakt, aber für die zweizeilige Kennzeichnung lesbarer. |

Die Kopfzeile soll zurückhaltend in `#f4f7f9` liegen, mit dünner `#d6dde3`-Trennlinie. Körpertext 9 pt, Kopftext 8,5 bis 9 pt und leicht reduziertes vertikales Padding von etwa 1,1 mm verdichten den Block moderat. Telefon und E-Mail bleiben zusammen; ein kleiner Abstand beziehungsweise eine feine Trennlinie darf nur die Lesereihenfolge innerhalb dieses bestehenden Blocks verbessern. Die Tabellenzeilen-, Wiederholungs- und Splitregeln bleiben unverändert.

### 3.3 Vorbemerkungen

Der Zielkorridor lautet: etwa **500 Zeichen, maximal fünf gerenderte PDF-Zeilen**. Dafür reicht ein bloßes Erhöhen von `maxLength` nicht aus.

Der spätere technische Vorschlag ist deshalb zweistufig:

1. klarer Eingabewert `maxCharacters = 500`;
2. gemeinsame Messung mit dem vorhandenen PDF-Schrift-, Breiten- und Zeilenhöhenkontext, die nach fünf gerenderten Zeilen stoppt oder einen eindeutigen Hinweis ausgibt.

Eine Entscheidung ist noch nötig, wie historisch längere Werte behandelt werden: sichtbarer Hinweis ohne Datenänderung, explizit bestätigtes Kürzen oder vollständige Ausgabe über den bestehenden Pager. Automatisches stilles Kürzen ist nicht empfohlen. Die M85-Wortgrenzen-Fortsetzung bleibt in jedem Fall die technische Sicherheit für bereits vorhandene lange Inhalte.

### 3.4 Gemeinsamer TOP-Spaltenvertrag

Für die spätere Kalibrierung wird eine gemeinsame Verhältnisdefinition empfohlen, aus der UI und PDF jeweils in ihrer eigenen verfügbaren Breite abgeleitet werden. Die folgenden Beispiele rechnen bewusst mit 960 px UI-Innenbreite und 186 mm PDF-Innenbreite; andere Fensterbreiten skalieren proportional. Pixel- und Millimeterwerte sind Planungswerte, keine heute angewandten CSS-Werte.

| Variante | Nummer | Text | Meta | UI bei 960 px | PDF bei 186 mm | Satzwirkung |
|---|---:|---:|---:|---|---|---|
| 1 – textbetont | 11 % | 67 % | 22 % | 106 / 643 / 211 px | 20,46 / 124,62 / 40,92 mm | maximale Textbreite; lange Nummern werden eher knapp. |
| 2 – ausgewogen | 13 % | 65 % | 22 % | 125 / 624 / 211 px | 24,18 / 120,90 / 40,92 mm | stabile Nummer, genug Meta für drei Zeilen, noch breite Texte. |
| 3 – meta-betont | 13 % | 59 % | 28 % | 125 / 566 / 269 px | 24,18 / 109,74 / 52,08 mm | weniger Ellipsis in Termin/Verantwortlich, mehr Langtextumbruch. |

**Empfehlung: Variante 2.** Sie liegt nahe an der heutigen PDF-Nummernspalte, gibt der Meta-Spalte verlässlich Raum und hält die Textspalte dominant. Die exakten Rundungen, Mindest-/Höchstwerte und Innenabstände müssen später im echten CSS und anhand der M85-Grenzfixtures festgelegt werden. Eine direkte Umrechnung von `ch` in Millimeter ist nicht ausreichend genau.

Die fachliche Reihenfolge Nummer, Text, Meta bleibt unverändert. Kurztext bleibt einzeilig mit Ellipsis; Langtext bleibt der umbruchfähige, paginierungsrelevante Teil. Die Änderung darf weder die vorhandenen Fortsetzungsregeln noch die Datenreihenfolge beeinflussen.

### 3.5 Legende und Footer

Die bestehende Legende und alle Footer-Optionen bleiben erhalten. Als Gestaltungsvorschlag werden sie über eine gemeinsame, zurückhaltende Abschlusszone verbunden:

- Legende weiter zentriert, 9 bis 9,5 pt, mit den bestehenden drei Bedeutungen und Farben.
- Etwa 6 mm Abstand zwischen Legende und Footer statt eines optisch unverbundenen großen Sprungs.
- Footer 9 pt bei Zeilenhöhe etwa 1,3; oberhalb eine feine graue Trennlinie, sofern sie innerhalb der vorhandenen Footerstruktur möglich ist.
- Reihenfolge und alle belegten Werte bleiben: Ort/Datum, Name 1, Name 2, Protokollführer, Straße, PLZ/Ort.

Die 12-mm-Fußreserve und die Schlussseitenregeln bleiben gesperrt. Der Vorschlag ist daher ausschließlich mit der vorhandenen Grenzfixture für den Abschlussbereich zu messen.

## 4. Umsetzungsschnitt und Prüfkatalog für einen späteren Auftrag

Ein späterer Auftrag soll in dieser Reihenfolge erfolgen:

1. präzise Entscheidung für Variante B einschließlich fehlender-Logo-Regel;
2. gezielte CSS-/Header-Änderung nur im V2-Kopfbereich; keine Änderung am Druckpfad oder Pager;
3. Teilnehmer-, Vorbemerkungs-, TOP- und Footer-Werte jeweils als getrennte, kleine Designpakete statt als Sammelumbau;
4. Aktualisierung der M85-Fixtures und Golden-Manifeste nur nach sichtbarer und automatisierter Prüfung;
5. Sichtprüfung mindestens für leeres/kleines Logo, alle drei Logo-Größen, FullHeader/MiniHeader, Teilnehmer-Folgeseite, lange Vorbemerkung, TOP-Fortsetzung und Footer-Grenze.

Mindestens erneut auszuführen sind die vorhandenen M85-PDF-Fixtures, insbesondere p03, p09, p12, p14, p15, p16, p18, p30, p33, p34 sowie die Restarbeiten-Grenzfälle. Damit bleiben Protokoll-Paginierung, Fortsetzungskennzeichnung, Fußreserve, A4-Querformat der Restarbeiten und der 13-Spalten-Vertrag abgesichert.

## 5. Entscheidungsergebnis

Für die nächste Gestaltungsetappe wird vorgeschlagen:

1. Variante B als Dokumentkopf, kombiniert mit dynamischem Wegfall leerer Logo-Boxen;
2. kein Platzhaltertext in Produktions-PDFs bei fehlendem Logo;
3. 5 bis 8 mm flacher logo-loser GlobalHeader, reale Logo-Höhe weiterhin maßgeblich bei aktivem Logo;
4. Teilnehmer-Tabelle mit 34 / 32 / 30 / 72 / 18 mm und modernisierter, aber semantisch gleicher Kopfzeile;
5. Vorbemerkungsziel 500 Zeichen und höchstens fünf **gemessene** PDF-Zeilen, ohne stilles Verändern historischer Werte;
6. gemeinsames TOP-Verhältnis 13 / 65 / 22 für Nummer / Text / Meta;
7. zurückhaltend zusammengeführte Legenden-/Footerzone bei unveränderten Benutzeroptionen.

Es wurden keine separaten M86.1-Mockups erzeugt. Die neutralen M86.0-PDFs und deren Seiten-PNGs sind die aktuelle visuelle Referenz; neue statische Nachbildungen würden keinen besseren Nachweis als eine spätere echte V2-Renderprüfung liefern.

## Umsetzung M86.2

Variante B wurde im bestehenden produktiven V2-Satzweg umgesetzt: flacher,
platzhalterfreier Kopf ohne Logo, geometrieabhängiger Kopf mit Logo, der
zurückhaltende blaue Titelakzent, die 34/32/30/72/18-mm-Teilnehmertabelle,
500 Zeichen für neue Vorbemerkungen und die gemeinsame 13/65/22-TOP-Breite.
Der vollständige technische Nachweis und die Golden-Begründung stehen in
`M86_2_PROTOKOLL_PDF_LEITDESIGN.md`; die sichtbare isolierte PDF-Abnahme ist
weiterhin die Voraussetzung für den Status `[A]`.

## Quellen der Bestandsaufnahme

- `src/renderer/views/SettingsView.js`
- `src/main/print/printData.js`
- `src/renderer/print/v2/v2LayoutConfig.js`
- `src/renderer/print/v2/header/GlobalHeader.js`
- `src/renderer/print/v2/header/FullHeader.js`
- `src/renderer/print/v2/v2.css`
- `src/renderer/print/layout/PrintShell.js`
- `src/renderer/print/printApp.js`
- `src/renderer/print/pdfEditorLayout.js`
- `src/shared/tableLayouts/protokollTopsLayout.js`
- `docs/PDF_SATZVERTRAG_V2.md`
- `docs/M85_0_PDF_SATZVERTRAG_UND_GUARDRAILS.md`
- neutrale Referenzen unter `design-reference/M86_0/`
