# M86.2 – Protokoll-PDF-Leitdesign

## Ziel und unveränderte Architektur

M86.2 setzt Variante B des bestehenden Protokoll-PDFs im vorhandenen
Produktionsweg um: Druckdaten → V2-Paginierung → `PrintShell` →
`webContents.printToPDF`. Es gibt weder eine neue Engine noch einen zweiten
Renderer, eine zweite Paginierung oder eine neue PDF-Registry.

## Kopf und Titelbereich

- Produkt-PDFs erzeugen ausschließlich Boxen für aktiv konfigurierte Logos.
  Leere Slots und der frühere Hilfetext werden nicht gedruckt.
- Ohne Logo beträgt der globale Kopf 8 mm; mit Logo wird die Höhe aus der
  tatsächlichen Boxhöhe, vertikalen Ausrichtung, 3-mm-Abstand und der
  vorhandenen Trennlinie berechnet. Der sichere obere Seitenrand beträgt 5 mm.
- Der vorhandene FullHeader bleibt Seite 1 vorbehalten; Projekt, Titel,
  Datum, Ersteller und Seitenzähler bleiben unverändert. Der blaue linke
  Akzent und die gestaffelte Typografie bilden den zurückhaltenden Eye-Catcher.
- Folgeseiten behalten den niedrigen MiniHeader und seine Seitenzählung;
  der Akzent wurde daran optisch angeglichen.

## Tabellen und Text

- Teilnehmer verwenden bei 186 mm Breite: Name 34 mm, Funktion 32 mm,
  Firma 30 mm, Telefon/E-Mail 72 mm, Anwesend/Verteiler 18 mm. Kopf,
  Zeilentrenner und Zellabstände sind ruhiger, die Daten und Reihenfolge
  unverändert.
- Die Vorbemerkung nimmt für neue Eingaben bis zu 500 Zeichen in fünf
  Eingabezeilen an. Bestehende längere Daten werden nicht gekürzt und folgen
  weiter der wortgenauen M85-Fortsetzung.
- Die bestehende gemeinsame TOP-Definition verwendet nun 13/65/22 für
  Nummer/Text/Meta. Im PDF entsprechen das bei 186 mm 24,18/120,90/40,92 mm;
  die UI nutzt 13fr/65fr/22fr. Gespeicherte UI- und PDF-Overrides bleiben
  gemäß bestehendem Tabellenvertrag getrennt speicherbar.

## Satz- und Editor-Schutz

Die 28 vorhandenen Registryelemente wurden nicht neu aufgebaut. Ihre
Designbaselines folgen dem flacheren Kopf und den neuen Tabellenwerten;
`setPageBreakRule` und alle Satzträger bleiben gesperrt. Die Tests verriegeln
weiterhin FullHeader/MiniHeader, Kopf-Wiederholung, Teilnehmer- und
Vorbemerkungsfortsetzungen, TOP-Splits, Abschlussbereich, Fußreserve und den
einzigen `printToPDF`-Weg.

## Golden-Fixtures

Die 47 strukturellen Golden-Snapshots wurden wegen der explizit beauftragten
Kopfgeometrie, Titeltypografie, Teilnehmerbreiten, TOP-Spaltenbreiten und der
500-Zeichen-Vorbemerkung aktualisiert. Die Grenzfixtures p05, p29, p32 und
r25 wurden auf dieselbe Satzabsicht unter den neuen Geometrien kalibriert;
die zugrundeliegenden Satzregeln wurden nicht geändert.

## M86.2.2 – realer isolierter Acceptance-Zustand

Der Protokoll-Acceptance-Start verwendet nicht mehr drei nur im Renderer
erzeugte TOP-Objekte mit erfundenen IDs. Im bereits abgesicherten temporären
Acceptance-Profil wird jetzt über die bestehenden Preload-, IPC-, Service- und
Repository-Wege reproduzierbar folgender neutrale Fachzustand angelegt:

- Projekt `M86 Diagnoseprojekt` mit Projektnummer `M86-DIAG`,
- geschlossener neutraler Ausgangsstand und ausgewählte offene Besprechung
  `M86 Sichtabnahme`,
- acht Projektpersonen aus vier neutralen Firmen mit unterschiedlichen
  Anwesenheits- und Verteilerwerten,
- zehn TOPs im Sichtabnahme-Protokoll, darunter sieben Unterpunkte,
  verschiedene Status, Termine und Verantwortliche sowie ein real
  übernommener und anschließend geänderter TOP,
- neutrale projektbezogene Titel-/Footerwerte und eine neutrale Vorbemerkung.

Der Seeder verlangt zusätzlich zur Diagnoseauswahl die vom Main-Prozess
bestätigte, validierte Acceptance-Isolation. Ein normaler Development- oder
Release-Start kann ihn daher nicht allein über den Diagnosemodus aktivieren.
Nach dem Seeding öffnet `router.showTops` den unveränderten echten
Protokollscreen. Damit gelten dieselben Projekt-/Besprechungs-IDs, derselbe
TOP-Repository-Weg, dieselbe Druckfreigabe und derselbe produktive Pfad
`getPrintData` → V2-Paginierung → `PrintShell` →
`webContents.printToPDF`. Ein Ersatz-Payload am Renderer oder Druckrenderer
wurde nicht eingeführt.

Automatisiert nachgewiesen sind Isolation, Idempotenz, reale SQLite-Persistenz,
Teilnehmer-/TOP-Beziehungen, der übernommene/geänderte TOP und `getPrintData`
mit genau diesem Diagnoseprotokoll.

Die sichtbare Abnahme erfolgte mit
`npm run start:ui-editor:acceptance -- --module=protokoll` in zwei Starts
desselben validierten temporären Acceptance-Profils. Geprüft wurden:

- der echte Protokollscreen mit neutralem Projekt, ausgewählter Besprechung,
  acht Teilnehmern, zehn TOPs und den realen Unterpunkten,
- die interne zweiseitige Vorschau mit FullHeader auf Seite 1, MiniHeader auf
  Seite 2, Teilnehmern, Vorbemerkung, TOP-Fortsetzung, Abschluss- und
  Aufgestellt-/Fußbereich,
- die erneute Erzeugung über V2-Paginierung, `PrintShell` und
  `webContents.printToPDF` mit zwei Seiten,
- der PDF-Editor mit 28 registrierten Elementen, aktueller Seitenübersicht
  und sichtbarer Auswahl der zweiten Seite,
- eine reale Layoutänderung im Protokoll-Eingabebereich sowie Undo, Reset,
  Save, Neustart-Restore und Discard; der gespeicherte Zustand wurde beim
  zweiten Start genau einmal angewendet.

Der bestehende automatisierte Guardrail-Nachweis deckt zusätzlich ungültige
Änderungen und Rollback ab. Die sichtbare Prüfung verwendete keine echte
Benutzerlizenz, keine Benutzer-Datenbank und keinen normalen `userData`-Pfad.
Beide Acceptance-Prozesse endeten mit Exitcode 0; temporäre Profile, erzeugte
PDFs, Screenshots und Diagnoseprotokolle wurden anschließend entfernt.

## Abnahmestatus

Status: `[A] abgenommen`. Automatischer Satznachweis und vollständige
isolierte sichtbare Protokoll-/PDF-/Editor-Abnahme sind grün.
