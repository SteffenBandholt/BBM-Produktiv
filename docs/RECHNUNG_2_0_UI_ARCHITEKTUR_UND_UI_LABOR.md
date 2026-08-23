# Rechnung 2.0 – verbindliche UI-Architektur und DEV-only UI-Labor

Stand: 23.08.2026  
Bezug: `docs/RECHNUNG_2_0_ENTWICKLUNGSPLAN.md`

Dieses Dokument ist eine verbindliche Anlage zum Entwicklungsplan Rechnung 2.0. Es konkretisiert ausschließlich die UI-Architektur, die Editorfähigkeit und den Umgang mit Test-/Dummy-Oberflächen. Die fachlichen Meilensteine des Entwicklungsplans werden dadurch nicht erweitert oder vorgezogen.

## 1. Ausgangsbasis

Für Rechnung 2.0 werden vorhandene und bereits bewährte BBM-Oberflächen wiederverwendet. Insbesondere gelten als Referenz:

- Arbeitsmodus Protokoll,
- Arbeitsmodus Restarbeiten,
- die bereits vorhandene Rechnungserstellung / Rechnungs-Designoberfläche,
- die zentralen BBM-Popup- und Formularstandards.

Eine Neuentwicklung bereits vorhandener UI-Strukturen erfolgt nur, wenn dafür ein dokumentierter fachlicher oder technischer Grund besteht.

## 2. Trennung von Fachstruktur, Verhalten und Gestaltung

Neue oder überarbeitete Oberflächen müssen von Beginn an so aufgebaut werden, dass fachliche Struktur, funktionales Verhalten und visuelle Gestaltung möglichst sauber getrennt sind.

Ziel ist ausdrücklich nicht völlige gestalterische Beliebigkeit. Ziel ist, unnötige feste Kopplungen zu vermeiden, damit der vorhandene Editor für das spätere Feintuning tatsächlich genutzt werden kann.

Zu vermeiden sind insbesondere:

- unnötig hardcodierte Positionen, Größen und Abstände,
- Layoutketten, bei denen ein sichtbares Element nur durch Sonderlogik eines anderen Elements positioniert werden kann,
- CSS-Sonderlösungen, die eine spätere unabhängige Bearbeitung verhindern,
- nicht registrierte sichtbare Elemente, die nur durch Codeänderung angepasst werden können.

## 3. Pflicht zur Editorfähigkeit und Registrierung

Alle fachlich eigenständigen und für das spätere Feintuning vorgesehenen sichtbaren UI- und PDF-Elemente müssen möglichst früh eine stabile, eindeutige Adressierung erhalten und in den dafür vorgesehenen Registries, Layout-Surfaces oder Editor-Strukturen registriert werden.

Für Rechnung 2.0 gilt:

- Sichtbar und funktionsfähig allein genügt nicht.
- Ein für den Editor vorgesehenes Element gilt erst dann als vollständig umgesetzt, wenn es eindeutig adressierbar und registriert ist.
- Die Registrierung ist Bestandteil der Abnahme des jeweiligen UI-/PDF-Pakets.
- Neue Sonderwege neben bestehenden Registry-/Editorstrukturen sind nicht zulässig, sofern nicht zuvor als Architekturänderung beschlossen.

Bei Rechnungspositionen betrifft dies perspektivisch insbesondere eigenständig adressierbare Elemente wie:

- Positionsnummer,
- Kennzeichnung / Nachtragsbezug,
- Kurztext,
- Langtext,
- Menge,
- Einheit,
- Einheitspreis,
- Gesamtpreis bzw. NEP-Kennzeichnung,
- positionsbezogene Abstände und Textdarstellung.

## 4. Vorhandene UI vor Neuentwicklung

Vor jeder neuen UI-Entwicklung ist zuerst zu prüfen, ob bereits eine geeignete produktive, DEV-only, Test-, Dummy-, Referenz- oder frühere Variantenoberfläche im Repository vorhanden ist.

Geeignete bestehende Strukturen werden bevorzugt wiederverwendet oder als Designreferenz erhalten. Neue Designvarianten werden nicht allein deshalb erzeugt, weil eine vorhandene Referenz nicht unmittelbar sichtbar ist.

Dieser Grundsatz dient ausdrücklich auch der Begrenzung von Entwicklungs- und KI-Kosten.

## 5. DEV-only UI-Labor

BBM soll eine ausschließlich in der Entwicklungsumgebung verfügbare UI-Referenzansicht erhalten. Arbeitstitel: `UI-Labor`.

Das UI-Labor dient dazu, vorhandene Produktivoberflächen sowie geeignete Test-, Dummy- und Designvarianten dauerhaft und wiederholt sichtbar zu machen und miteinander vergleichen zu können.

### 5.1 Anforderungen

Das UI-Labor:

- ist ausschließlich DEV-only,
- ist nicht Bestandteil einer Endnutzer-Auslieferung,
- verwendet für Referenzvarianten bevorzugt statische oder isolierte Beispieldaten,
- verändert keine produktiven Daten,
- benötigt keine produktive Datenbanklogik für reine Referenzansichten,
- darf bestehende produktive Komponenten wiederverwenden,
- dupliziert keine fachliche Geschäftslogik nur für die Darstellung,
- erhält Varianten unter stabilen, verständlichen Namen,
- ermöglicht wiederholtes Aufrufen statt nur kurzzeitiger Testdarstellung.

### 5.2 Mögliche Ordnung

Eine spätere Struktur kann beispielsweise nach Modul und Variante gegliedert werden:

- Rechnung
  - bestehende Rechnungserstellung
  - erhaltene Test-/Designvarianten
  - LV-Positionsvarianten
- Protokoll
  - produktive Referenz
  - geeignete Testvarianten
- Restarbeiten
  - produktive Referenz
  - geeignete frühere oder alternative Varianten

Die konkrete Navigation ist kein Bestandteil dieser Festlegung und wird erst im entsprechenden Umsetzungspaket entschieden.

## 6. Erhalt interessanter Testoberflächen

Entsteht im Rahmen einer Entwicklung eine Test-, Dummy- oder Hilfsoberfläche, die als Designreferenz nützlich sein könnte, darf sie nicht unbemerkt verschwinden.

Sie ist vor dem Entfernen entweder:

1. als benannte Variante im DEV-only UI-Labor zu erhalten, oder
2. als dokumentierte Referenz mit Screenshot bzw. nachvollziehbarem Verweis festzuhalten.

Dadurch entsteht kein Anspruch, die Variante produktiv zu übernehmen. Die Entscheidung über die produktive UI bleibt fachlich getrennt.

## 7. Screenshots als ergänzende Referenz

Für schnellen visuellen Vergleich kann das UI-Labor durch eine Screenshot-Referenzsammlung ergänzt werden.

Screenshots ersetzen nicht die interaktive Referenzansicht, wenn eine solche technisch sinnvoll erhalten werden kann. Sie dienen insbesondere dazu:

- Varianten schnell wiederzuerkennen,
- kurzfristig erzeugte Testoberflächen festzuhalten,
- Entscheidungen später nachvollziehen zu können.

## 8. Abnahmegrundsatz für Rechnung 2.0

Ein UI-bezogener Entwicklungsschritt von Rechnung 2.0 ist nur dann vollständig, wenn neben Funktion und grundlegender Darstellung auch geprüft wurde:

- Sind die relevanten Elemente ausreichend voneinander entkoppelt?
- Sind die für den Editor vorgesehenen Elemente eindeutig registriert und adressierbar?
- Wurden bestehende BBM-Komponenten und Referenzen bevorzugt genutzt?
- Wurden unnötige neue Sonderlösungen vermieden?
- Sind interessante neue Test-/Designvarianten bei Bedarf als Referenz erhalten worden?

## 9. Scope-Schutz

Diese Anlage ist keine Freigabe, das UI-Labor sofort produktiv auszubauen oder Rechnung 2.0 außerhalb der festgelegten Meilensteine zu implementieren.

Vor M1 dient sie als verbindliche Architektur- und Arbeitsregel. Die eigentliche Umsetzung des UI-Labors erfolgt nur als klar abgegrenztes Entwicklungspaket und darf laufende fachliche Meilensteine nicht aufblähen.

Abweichungen von diesen Regeln bedürfen – analog zum Hauptentwicklungsplan – einer ausdrücklichen, dokumentierten Entscheidung vor der Umsetzung.
