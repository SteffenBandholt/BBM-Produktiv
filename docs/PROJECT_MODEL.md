# BBM-Projektdatenmodell

## Zweck

Das BBM-Projekt ist ein gemeinsamer, neutraler Bezugspunkt fuer projektbezogene Fachmodule.
Es ist **nicht** der Obercontainer fuer alle BBM-Funktionen und insbesondere keine Voraussetzung fuer Rechnung, Angebot oder Auftrag.

## Verbindlicher Projektkern

Zum Projekt selbst gehoeren nur neutrale Stammdaten, die moduluebergreifend sinnvoll sind:

- Projekt-ID (technisch)
- Projektnummer (optional)
- Projektbezeichnung / Name
- Kurzbezeichnung (optional)
- Projektadresse: Strasse, PLZ, Ort
- interne Projektleitung (vorerst als Bestandsfeld)
- Telefon der internen Projektleitung (vorerst als Bestandsfeld)
- Projektbeginn (optional)
- Projektende (optional)
- allgemeine Projektnotiz (optional)
- Archivstatus

Die vorhandenen Bestandsfelder bleiben kompatibel. Fuer diesen Umbau werden bewusst keine neuen Projektspalten eingefuehrt.

## Gehoert ausdruecklich nicht in den Projektkern

### Firmen / Kunden / Personen

Firmen, Kunden und Personen sind gemeinsame BBM-Stammdaten und werden spaeter zentral neu strukturiert.
Ein Projekt referenziert diese Daten nur; es besitzt keine eigene parallele Firmenwelt.

### Protokoll

Besprechungen, TOPs, Teilnehmerzustand, Protokolltitel, Protokollfuss und sonstige Protokoll-/PDF-Einstellungen gehoeren zum Fachmodul `Protokoll` bzw. zu gemeinsamen Dokumentdiensten, nicht zu den Projektstammdaten.

Projektspezifische Protokoll- und PDF-Einstellungen werden weiterhin projektbezogen gespeichert, aber im Projekt-Arbeitsbereich innerhalb des Protokollbereichs bedient. Sie erscheinen nicht im Projektstammformular.

### Restarbeiten / Plaene

Restarbeiten, Maengel, Fotos, Planbezug und WEB-PDFs sind Fach-/Unterbereich von `Restarbeiten` und perspektivisch `BBM Mobil`.

### SiGeKo

SiGeKo-spezifische Angaben, Berichte und Dokumentationen gehoeren in das spaetere Fachmodul `SiGeKo`.

### Kaufmaennische Vorgaenge

Angebot, Auftrag und Rechnung koennen optional auf ein Projekt verweisen, sind aber eigenstaendige kaufmaennische Vorgaenge. Ein Projekt ist dafuer keine Pflicht.

## Bedienregel

Das Projektformular zeigt im Hauptbereich nur die neutralen Projektstammdaten.
Technische Ablageinformationen duerfen nur als nachrangige Diagnose-/Technikinformation erscheinen.
Fachmodul-Einstellungen duerfen nicht als normale Projektstammdaten dargestellt werden.

## Spaetere Migration

Die Textfelder `project_lead` und `project_lead_phone` bleiben vorerst aus Kompatibilitaetsgruenden bestehen. Sobald Mitarbeiter/Personen als gemeinsame BBM-Domaene finalisiert sind, kann die interne Projektleitung auf eine saubere Referenz migriert werden.
