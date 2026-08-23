# BBM | Rechnung 2.0 – Verbindlicher Entwicklungsplan

Stand: 23.08.2026  
Projekt: BBM-Produktiv  
Status: **verbindliche Entwicklungsleitlinie**

---

## 0. Zweck und Verbindlichkeit

Dieses Dokument legt das verbindliche Zielbild, die Entwicklungsreihenfolge, die Meilensteine, die Abnahmekriterien und die architektonischen Erweiterungspunkte für **BBM | Rechnung 2.0** fest.

Es ist ausdrücklich **kein Implementierungsauftrag für einen einzelnen Entwicklungslauf**. Die Umsetzung erfolgt schrittweise in in sich geschlossenen, jeweils nutzbaren Entwicklungsstufen.

Für alle Arbeiten an Rechnung 2.0 gilt:

1. Die hier festgelegte Reihenfolge der Meilensteine ist verbindlich.
2. Ein nachfolgender Meilenstein darf erst begonnen werden, wenn der vorherige Meilenstein seine Pflichtziele und Abnahmekriterien erfüllt.
3. Bestehende fachliche Entscheidungen dürfen nicht stillschweigend verändert werden.
4. Der Scope eines Meilensteins darf nicht ohne dokumentierte Planänderung erweitert werden.
5. Technische Vorbereitungen für spätere Funktionen sind erlaubt, wenn sie die aktuelle Entwicklungsstufe nicht unnötig vergrößern.
6. Spätere Erweiterungen dürfen vorbereitet, aber nicht vorgezogen implementiert werden.
7. Die Formulierungen dieses Plans sind ausführungsneutral. Sie gelten unabhängig davon, welches Entwicklungswerkzeug, welcher Entwickler oder welches Assistenzsystem die Umsetzung ausführt.

### Änderungsschutz

Von diesem Plan darf nur abgewichen werden, wenn zuvor dieses Dokument bewusst geändert wird.

Jede Planänderung muss mindestens dokumentieren:

- Datum,
- betroffenen Abschnitt oder Meilenstein,
- Grund der Änderung,
- fachliche oder technische Auswirkung,
- Entscheidung, ob bereits erreichte Meilensteine erneut geprüft werden müssen.

Eine spontane Abweichung während einer Umsetzung gilt nicht als Planänderung und ist unzulässig.

---

# 1. Endziel Rechnung 2.0

BBM | Rechnung 2.0 soll eine lokal/offline orientierte kaufmännische Dokumentbasis für Handwerks- und Bauunternehmen bereitstellen.

Das Endziel der hier beschriebenen Entwicklung ist eine belastbare Grundlage, auf der ohne Neuaufbau folgende Dokument- und Prozesskette betrieben und später erweitert werden kann:

```text
Leistungspositionenkatalog
          │
          ├───────────────┐
          ▼               ▼
      freie Position   Katalogposition
          │               │
          └───────┬───────┘
                  ▼
               Angebot
                  │
                  ▼
               Auftrag
                  │
                  ▼
               Rechnung
```

Die sichtbare Darstellung soll dem Bau-/LV-Umfeld entsprechen und nicht der klassischen tabellarischen Warenwirtschaft.

Am Ende dieser Entwicklungsfolge müssen mindestens vorhanden sein:

- zentrale kaufmännische Dokumentbasis,
- Rechnung als produktiv nutzbarer Dokumenttyp,
- Storno/Gutschrift als fachlich sauberer Rechnungsvorgang,
- Angebot und Auftrag auf derselben Dokumentbasis,
- Übernahme Angebot → Auftrag → Rechnung ohne doppelte Dateneingabe,
- Leistungspositionenkatalog,
- freie Positionen,
- LV-artige Positionsdarstellung,
- NEP-/Bedarfspositionen,
- Nachtragspositionen,
- dokumentbezogene Snapshots von Firmen-, Kunden- und Positionsdaten,
- fortlaufende Dokumentnummern nach Dokumenttyp,
- feste PDF-Ausgabe auf Basis des BBM PDF-Layouts V2,
- zentrale lokale Ablage für kaufmännische Dokumente und erzeugte Dateien,
- klarer Dokumentstatus und Finalisierung,
- architektonische Vorbereitung für ZUGFeRD,
- definierte Erweiterungspunkte für GAEB, Aufmaß/Bauabrechnung, Kalkulation und externe Text-/Leistungsquellen.

Nicht Bestandteil dieses Endziels sind zunächst:

- vollständige Finanzbuchhaltung,
- DATEV,
- Lagerverwaltung,
- Mahnwesen,
- vollständige Kalkulation/Nachkalkulation,
- vollständige GAEB-Verarbeitung,
- produktive externe Online-Katalogintegration.

---

# 2. Verbindliche Architekturgrundsätze

## 2.1 Eine gemeinsame kaufmännische Dokumentbasis

Angebot, Auftrag und Rechnung dürfen nicht als drei voneinander unabhängige technische Systeme aufgebaut werden.

Sie verwenden eine gemeinsame Dokumentbasis mit dokumenttypspezifischen Regeln.

Grundtypen:

```text
ANGEBOT
AUFTRAG
RECHNUNG
```

Spätere Typen oder Untertypen müssen ergänzbar sein, ohne die Grundarchitektur neu aufzubauen.

---

## 2.2 Dokumentposition statt Rechnungs-Sonderposition

Die fachliche Positionsstruktur ist grundsätzlich dokumentneutral.

Eine Position muss für Angebot, Auftrag und Rechnung verwendbar sein.

Mindestens vorzusehen sind:

- stabile interne ID,
- Positionsnummer,
- Kurztext,
- Langtext,
- Menge,
- Einheit,
- Einzelpreis,
- Umsatzsteuersatz,
- Gesamtpreis bzw. NEP-Kennzeichnung,
- Positionstyp,
- Reihenfolge,
- optionale Herkunft aus dem Leistungspositionenkatalog,
- optionale Referenz auf Ursprungs-/Nachtragsposition.

---

## 2.3 Katalogposition und Dokumentposition sind getrennt

Eine Katalogposition dient als Vorlage.

Bei Übernahme in ein kaufmännisches Dokument entsteht eine eigenständige Dokumentposition.

Spätere Änderungen an:

- Kurztext,
- Langtext,
- Einheit,
- Preis,
- Steuer,
- Katalogstruktur

dürfen bereits bestehende Dokumente nicht verändern.

---

## 2.4 Snapshot-Prinzip

Sobald Daten aus Stammdaten oder Katalogen in ein kaufmännisches Dokument übernommen werden, muss der für das Dokument maßgebliche Stand erhalten bleiben.

Das betrifft insbesondere:

- Rechnungssteller,
- Kunde/Empfänger,
- Anschrift,
- Steuerdaten,
- Zahlungsdaten,
- Leistungspositionen,
- Preise,
- Steuersätze,
- Dokumenttexte.

Ein später geänderter Firmen- oder Kundenstamm darf ein bereits erstelltes/finalisiertes Dokument nicht rückwirkend verändern.

---

## 2.5 Sichtbares PDF und strukturierte Fachdaten sind getrennt

Das sichtbare PDF-Layout und das strukturierte kaufmännische Datenmodell sind getrennte Schichten.

Das PDF darf eine ruhige Bau-LV-Optik verwenden.

Die strukturierten Rechnungsdaten müssen unabhängig davon so geführt werden, dass später normgerechte elektronische Rechnungsdaten erzeugt werden können.

Dieser Grundsatz ist zwingende Voraussetzung für die spätere ZUGFeRD-Anbindung.

---

## 2.6 Lokale Speicherung

Die primäre Speicherung erfolgt lokal/offline.

Bevorzugte Struktur:

- SQLite für strukturierte Daten,
- Dateisystem für erzeugte PDFs und spätere Anlagen,
- eindeutige Referenzen zwischen Datenbank und Dateien.

---

# 3. Verbindliche Positionsregeln

## 3.1 LV-artige Darstellung

Rechnungs- und Dokumentpositionen werden nicht als klassische Warenwirtschaftstabelle dargestellt.

Grundaufbau einer Position:

```text
Zeile 1: Positionsnummer + Kurztext/Gegenstand
Zeile 2: Langtext
Zeile 3: Menge + Einheit sowie EP und GP
```

Regeln:

- Langtext ein-/ausblendbar,
- EP und GP rechts ausgerichtet,
- ruhige offene LV-Optik,
- keine Excel-/Warenwirtschaftsoptik.

---

## 3.2 NEP – Nur Einheitspreis / Bedarfsposition

Positionen können zwischen Normalposition und NEP umgeschaltet werden.

Die Umschaltung muss in beide Richtungen möglich sein.

Bei NEP:

- Menge bleibt sichtbar,
- Einheit bleibt sichtbar,
- EP bleibt sichtbar,
- an Stelle des GP wird `NEP` angezeigt,
- die Position fließt nicht in die Gesamtsumme ein.

---

## 3.3 Freie Dokumente

Bei freien Dokumenten ist eine freie Positionsstruktur zulässig.

Positionen dürfen:

- frei angelegt,
- sortiert,
- nummeriert

werden.

---

## 3.4 Auftragsgebundene Dokumente

Bei einer aus einem Auftrags-LV abgeleiteten Rechnung gilt:

- Positionsnummern des Ursprungs-LV sind gesperrt,
- Reihenfolge des Ursprungs-LV ist gesperrt,
- normale Positionen dürfen nicht zwischen bestehende Auftragspositionen eingefügt werden,
- die Struktur des ursprünglichen Auftrags-LV bleibt erhalten.

---

## 3.5 Nachtragspositionen

Zusätzliche Leistungen werden bei auftragsgebundenen Rechnungen ausschließlich am Ende des LV ergänzt.

Kennzeichnung:

```text
N 01
N 02
N 03
...
```

Mit Bezug auf Ursprungsposition:

```text
Nachtragspos. zu Pos.: 25
```

Ohne Bezug:

```text
Nachtragsposition
```

---

# 4. Meilensteinplan

Die folgenden Meilensteine sind verbindlich in dieser Reihenfolge abzuarbeiten.

---

# M0 – Plan- und Bestandsbasis

## Ziel

Vor Beginn der eigentlichen Rechnung-2.0-Implementierung wird der vorhandene technische Bestand als Ausgangsbasis festgehalten.

## Pflichtziele

- bestehendes Rechnungsmodul als DEV-Designstand einordnen,
- vorhandenes PDF Layout V2 und Protokoll-PDF als Referenz bestimmen,
- bestehende Firmen-/Kundenarchitektur berücksichtigen,
- bestehende lokale Datenbank- und IPC-Strukturen berücksichtigen,
- bestehende Modul-/Lizenzarchitektur berücksichtigen,
- keine produktive Fachlogik versehentlich in den bisherigen Design-Dummy hineininterpretieren.

## Abnahme

M0 ist erreicht, wenn:

- der aktuelle Bestand dokumentiert ist,
- die betroffenen Architekturgrenzen benannt sind,
- keine Produktivfunktion verändert wurde.

---

# M1 – Gemeinsame PDF-V2-Grundlage

## Ziel

Die für das Protokoll vorhandene PDF-V2-Grundstruktur wird so genutzt bzw. abstrahiert, dass weitere Dokumenttypen dieselben globalen Layoutregeln verwenden können.

## Pflichtziele

- gemeinsame Regeln für Seite, Ränder, Typografie, Kopf, Fuß und Seitenwechsel,
- wiederverwendbare V2-Basis für verschiedene Dokumenttypen,
- Protokoll bleibt funktional und visuell unverändert,
- keine rechnungsspezifische Logik in die Protokollfachlogik einbauen,
- Rechnung erhält einen eigenen PDF-Dokumenttyp auf derselben V2-Basis.

## Nicht-Ziele

- noch keine vollständige Rechnungserstellung,
- noch keine Angebots-/Auftragsoberfläche,
- noch kein ZUGFeRD-Export.

## Abnahme

M1 ist erreicht, wenn:

- Protokoll-PDF weiterhin unverändert funktioniert,
- ein eigener Rechnung-PDF-Typ technisch auf Layout V2 aufsetzen kann,
- gemeinsame und dokumenttypspezifische Bestandteile sauber getrennt sind.

---

# M2 – Kaufmännisches Dokumentmodell und zentrale Ablage

## Ziel

Eine gemeinsame persistente Basis für Angebot, Auftrag und Rechnung wird geschaffen.

## Pflichtziele

- zentrale Dokumententität,
- Dokumenttypen mindestens ANGEBOT / AUFTRAG / RECHNUNG,
- Dokumentstatus,
- Kunden-/Empfängerbezug,
- optionaler Projektbezug,
- Vorgänger-/Nachfolgerbezug zwischen Dokumenten,
- zentrale Dokumentpositionsstruktur,
- Snapshot-Felder bzw. Snapshot-Konzept,
- zentrale Dateireferenz für erzeugte PDFs,
- lokale Speicherung in bestehender BBM-Datenhaltung,
- migrationssichere Einführung ohne Verlust vorhandener BBM-Daten.

## Mindeststatus

Mindestens:

```text
ENTWURF
ERSTELLT / GEBUCHT
STORNIERT
```

Die konkrete interne Benennung darf technisch abweichen, die fachliche Bedeutung nicht.

## Abnahme

M2 ist erreicht, wenn:

- Dokumente und Dokumentpositionen gespeichert und wieder geladen werden können,
- Dokumente einen Typ und Status besitzen,
- Stammdatenänderungen bestehende Dokument-Snapshots nicht verändern,
- PDFs eindeutig einem Dokument zugeordnet werden können.

---

# M3 – Produktive Rechnung 2.0

## Ziel

Die normale Rechnung wird als erster produktiv nutzbarer kaufmännischer Dokumenttyp umgesetzt.

## Pflichtziele

- Rechnung anlegen,
- Rechnung bearbeiten,
- Kunde aus zentralem Firmen-/Kundenbestand wählen,
- freie Positionen anlegen,
- Positionen bearbeiten,
- Positionen sortieren und nummerieren, soweit freie Rechnung,
- Netto-/Steuer-/Bruttoberechnung,
- mehrere Steuersätze architektonisch korrekt behandelbar,
- NEP-Regel,
- Statusführung,
- automatische fortlaufende Rechnungsnummer,
- Finalisierung,
- feste PDF-Datei erzeugen und zentral speichern,
- bestehende finalisierte Rechnung bleibt unverändert reproduzierbar,
- Storno/Gutschrift fachlich berücksichtigen und produktiv nutzbar machen.

## PDF-Pflichtziele

- Layout V2 analog zur BBM-Protokollfamilie,
- Rechnungsempfänger,
- Rechnungsnummer,
- Rechnungsdatum,
- Leistungszeitraum, sofern vorhanden,
- Betreff/Einleitung,
- LV-artige Positionen,
- mehrseitiger Umbruch,
- Folgeseitenkopf,
- Summenblock,
- Zahlungs-/Schlusstext,
- Fußbereich.

## Abnahme

M3 ist erreicht, wenn eine vollständige normale Rechnung einschließlich PDF und Storno/Gutschrift im lokalen BBM-Arbeitsablauf erstellt, gespeichert, erneut geöffnet und nachvollziehbar finalisiert werden kann.

---

# M4 – Leistungspositionenkatalog

## Ziel

Ein zentraler wiederverwendbarer Leistungskatalog wird produktiv nutzbar.

## Pflichtfelder einer Katalogposition

- interne ID,
- Kurztext,
- Langtext,
- Einheit,
- Einzelpreis,
- Umsatzsteuersatz,
- aktiv/inaktiv.

## Erweiterbare Felder

- Katalognummer,
- Gewerk,
- Kategorie,
- Suchbegriffe,
- Herkunft,
- externe Referenz.

## Pflichtfunktionen

- Position anlegen,
- Position bearbeiten,
- Position suchen,
- Position in Dokument übernehmen,
- übernommene Position danach im Dokument frei bearbeiten,
- spätere Katalogänderung verändert vorhandenes Dokument nicht.

## Nicht-Ziele

- noch keine vollständige Kalkulation,
- noch kein GAEB-Katalogimport als Pflichtfunktion,
- noch keine produktive Online-Katalogintegration.

## Abnahme

M4 ist erreicht, wenn eine Katalogposition in eine Rechnung übernommen werden kann und die Rechnung danach vollständig unabhängig vom späteren Katalogstand bleibt.

---

# M5 – Angebot und Auftrag auf gemeinsamer Basis

## Ziel

Angebot und Auftrag werden ohne parallele Sonderarchitektur auf der gemeinsamen Dokumentbasis umgesetzt.

## Pflichtziele

- Angebot anlegen, bearbeiten, speichern und als PDF ausgeben,
- Auftrag aus Angebot erzeugen,
- Datenübernahme ohne erneute Eingabe,
- Auftrag speichern und als PDF ausgeben,
- Dokumentbeziehungen nachvollziehbar speichern,
- bestehende Ursprungsdokumente bleiben eigenständige Snapshots,
- Dokumentnummern je Dokumenttyp sauber führen.

## Abnahme

M5 ist erreicht, wenn die Kette

```text
Angebot → Auftrag
```

ohne doppelte Erfassung funktioniert und beide Dokumente unabhängig reproduzierbar bleiben.

---

# M6 – Auftragsgebundene Rechnung und Nachträge

## Ziel

Ein Auftrag kann unter Wahrung seiner LV-Struktur abgerechnet werden.

## Pflichtziele

- Rechnung aus Auftrag erzeugen,
- Positionsnummern des Auftrags sperren,
- Reihenfolge des Auftrags sperren,
- keine normalen Zwischenpositionen zulassen,
- Nachtragspositionen ausschließlich am Ende,
- Kennzeichnung `N 01`, `N 02`, ...,
- Bezug auf Ursprungsposition optional speichern und darstellen,
- NEP-Regeln auch im auftragsgebundenen Dokument korrekt behandeln.

## Abnahme

M6 ist erreicht, wenn die Kette

```text
Angebot → Auftrag → Rechnung
```

mit unveränderter Auftrags-LV-Struktur und sauber getrennten Nachträgen funktioniert.

---

# M7 – Stabilisierung und Erweiterungsvertrag

## Ziel

Die bis M6 entstandene Architektur wird als stabile Basis für spätere BBM-Rechnungsstufen festgeschrieben.

## Pflichtziele

- Datenmodell dokumentieren,
- Schnittstellen dokumentieren,
- relevante Tests für Dokument-Snapshots, Status, Nummern, Positionen, PDF und Beziehungen,
- keine offenen provisorischen Sonderwege zwischen Angebot/Auftrag/Rechnung,
- Erweiterungspunkte aus Abschnitt 5 nachweislich vorhanden oder klar anschließbar.

## Abnahme

M7 ist erreicht, wenn spätere Funktionen auf die vorhandene Dokument-, Positions-, PDF- und Ablagestruktur aufbauen können, ohne die Kernmodelle neu entwickeln zu müssen.

---

# 5. Verbindlich vorzubereitende Schnittstellen für spätere Entwicklung

Die folgenden Funktionen werden in Rechnung 2.0 noch nicht vollständig umgesetzt, müssen aber architektonisch berücksichtigt werden.

---

## 5.1 ZUGFeRD / strukturierte E-Rechnung

### Ziel der Vorbereitung

Das sichtbare PDF darf niemals die einzige Datenquelle der Rechnung sein.

Es muss ein strukturiertes Rechnungsmodell vorhanden sein, aus dem später ein normgerechter ZUGFeRD-/Factur-X-Datensatz erzeugt werden kann.

### Vorzubereiten

- stabile Rechnungs-ID,
- strukturierter Rechnungssteller,
- strukturierter Rechnungsempfänger,
- Rechnungsnummer,
- Datumsfelder,
- Währung,
- strukturierte Positionen,
- Mengen und Einheiten,
- Nettopreise,
- Steuersätze,
- Steuerbeträge,
- Summen,
- Zahlungsinformationen,
- Referenzen auf Auftrag/Projekt soweit fachlich vorhanden,
- Möglichkeit, eine strukturierte XML-Datei bzw. eingebettete Datei dem finalen PDF zuzuordnen.

### Noch nicht vorziehen

Die konkrete Normprofil-/XML-Implementierung ist nicht Bestandteil der frühen Meilensteine, sofern sie nicht ausdrücklich in einem späteren Entwicklungsauftrag aktiviert wird.

---

## 5.2 GAEB

### Ziel der Vorbereitung

GAEB soll später Datenquelle und Austauschformat für Leistungsverzeichnisse sein können, ohne die Dokumentpositionen neu zu modellieren.

### Vorzubereiten

- externe Positions-ID/Referenz,
- Herkunft einer Position,
- ursprüngliche LV-Nummer,
- hierarchische Struktur bzw. Ordnungskennzeichen anschließbar,
- Kurz-/Langtext getrennt,
- Einheit,
- Menge,
- Preis,
- Positionstyp,
- Übernahme in Auftrag/Dokument ohne Verlust der Ursprungsreferenz.

### Späteres Ziel

Zunächst GAEB-Import; Export kann in einer späteren Stufe folgen.

---

## 5.3 Aufmaß / Bauabrechnung

### Ziel der Vorbereitung

Eine Auftragsposition muss später Mengen aus einem Aufmaß erhalten können, ohne dass die ursprüngliche Vertragsposition verändert oder ersetzt wird.

### Vorzubereiten

Trennung zwischen:

```text
Vertragsposition
Aufmaß / Mengenfeststellung
Abrechnungsmenge
Rechnungsstand
```

Spätere Erweiterungen:

- Aufmaßzeilen,
- Abschlags-/Teilrechnungen,
- kumulative Abrechnung,
- Schlussrechnung.

Die Rechnung-2.0-Kernposition darf deshalb nicht so modelliert werden, dass Menge nur als ein unveränderlicher Einzelwert ohne spätere Mengenherkunft existieren kann.

---

## 5.4 Kalkulation / Nachkalkulation

### Ziel der Vorbereitung

Verkaufspreise im Dokument und interne Kalkulationsdaten müssen später getrennt geführt werden können.

### Vorzubereiten

- Dokumentposition besitzt einen Verkaufspreis,
- Katalogposition kann später Kalkulationsdaten referenzieren,
- spätere Kostenbestandteile wie Lohn, Material, Gerät und Fremdleistung dürfen ergänzbar sein,
- Kalkulationsänderungen dürfen finalisierte Dokumente nicht verändern.

Eine vollständige Kalkulation ist noch kein Bestandteil von Rechnung 2.0.

---

## 5.5 Text-/Leistungsimport aus PDF

### Ziel der Vorbereitung

Leistungstexte aus fremden PDFs sollen später als Datenquelle dienen können.

### Vorzubereiten

Ein Import darf nicht direkt ungeprüft produktive Dokumentpositionen überschreiben.

Vorgesehener späterer Ablauf:

```text
Quelle PDF
   ↓
Import-/Erkennungsstufe
   ↓
Vorschlag / Prüfstufe
   ↓
Katalogposition oder Dokumentposition
```

Dafür sollen Herkunft und externe Referenz optional speicherbar sein.

---

## 5.6 Externe Leistungskataloge / ausschreiben.de und vergleichbare Quellen

### Ziel der Vorbereitung

Externe Leistungsquellen dürfen später angebunden werden, ohne den internen Leistungskatalog zu ersetzen.

Architekturgrundsatz:

```text
Externe Quelle
      ↓
Import-/Adapter-Schicht
      ↓
interne Katalogposition
      ↓
Dokumentposition als Snapshot
```

Es darf keine harte Abhängigkeit der Dokumente von der Verfügbarkeit eines externen Dienstes entstehen.

Vorzubereiten sind optional:

- Quellenkennung,
- externe Datensatz-ID,
- Importdatum,
- Herkunftshinweis,
- Aktualisierungsinformation.

Eine konkrete Anbieterintegration, Lizenzprüfung oder Online-API-Anbindung ist nicht Bestandteil der frühen Rechnung-2.0-Meilensteine.

---

# 6. Dokument- und Dateispeicherung

Kaufmännische Dokumente und erzeugte Dateien werden zentral verwaltet.

Zielstruktur logisch:

```text
Kaufmännisches Dokument
├── strukturierte Fachdaten
├── Dokumentpositionen
├── Dokumentbeziehungen
├── Snapshot-Daten
└── Dateien
    ├── sichtbares PDF
    ├── spätere ZUGFeRD/XML-Daten
    └── spätere Anlagen
```

Für gespeicherte Dateien sollen mindestens anschließbar sein:

- Dateiname,
- Dateityp,
- Dokument-ID,
- Speicherort,
- Erstellzeitpunkt,
- Version,
- Prüfsumme.

Finalisierte PDFs sind feste Dokumentartefakte und dürfen nicht stillschweigend durch spätere Stammdatenänderungen ersetzt werden.

---

# 7. Nummern und Status

## 7.1 Rechnungsnummer

Rechnungsnummern müssen automatisch fortlaufend vergeben werden.

Die Nummernvergabe muss so implementiert werden, dass eine einmal final vergebene Rechnungsnummer nicht durch spätere Bearbeitungen neu berechnet oder verschoben wird.

## 7.2 Weitere Dokumentnummern

Angebot und Auftrag erhalten eigene Nummernkreise bzw. eindeutig getrennte Dokumentnummern.

Die konkrete Formatierung ist konfigurierbar bzw. später erweiterbar, darf aber die interne stabile Dokument-ID nicht ersetzen.

## 7.3 Status

Mindestens erforderlich:

```text
Entwurf → erstellt/gebucht → storniert
```

Ein finalisiertes Dokument darf nicht wie ein normaler Entwurf überschrieben werden.

Korrekturen erfolgen über fachlich nachvollziehbare Vorgänge, insbesondere Storno/Gutschrift.

---

# 8. Entwicklungs- und Abnahmeregeln je Meilenstein

Für jeden Meilenstein muss vor Umsetzung ein abgegrenzter Arbeitsauftrag erstellt werden.

Jeder Arbeitsauftrag enthält mindestens:

- Bezug auf diesen Entwicklungsplan,
- aktuellen Meilenstein,
- konkretes Ziel,
- Pflichtziele,
- Nicht-Ziele,
- erlaubte Bereiche,
- ausdrücklich nicht anzufassende Bereiche, soweit erforderlich,
- Migrationen,
- Tests,
- Abnahmekriterien.

Am Ende jedes Meilensteins ist zu prüfen:

1. Sind alle Pflichtziele erfüllt?
2. Sind alle Abnahmekriterien erfüllt?
3. Wurde kein späterer Meilenstein fachlich vorgezogen?
4. Wurden bestehende BBM-Funktionen unbeabsichtigt verändert?
5. Sind Datenmigration und vorhandene Daten sicher?
6. Sind die vorgesehenen Erweiterungspunkte weiterhin möglich?

Erst danach wird der Meilenstein als abgeschlossen markiert.

---

# 9. Fortschrittsstatus

Der Fortschritt wird ausschließlich anhand der definierten Meilensteine bewertet.

```text
M0  Plan- und Bestandsbasis                     OFFEN
M1  Gemeinsame PDF-V2-Grundlage                 OFFEN
M2  Dokumentmodell und zentrale Ablage           OFFEN
M3  Produktive Rechnung 2.0                      OFFEN
M4  Leistungspositionenkatalog                   OFFEN
M5  Angebot und Auftrag                          OFFEN
M6  Auftragsgebundene Rechnung / Nachträge       OFFEN
M7  Stabilisierung / Erweiterungsvertrag         OFFEN
```

Zulässige Statuswerte:

```text
OFFEN
IN ARBEIT
ABNAHMEBEREIT
ABGESCHLOSSEN
```

Ein Statuswechsel auf `ABGESCHLOSSEN` setzt die vollständige Erfüllung der jeweiligen Abnahmekriterien voraus.

---

# 10. Schlussregel

**Rechnung 2.0 wird nicht als Sammlung einzelner Funktionen entwickelt, sondern als kontrollierte Folge aufeinander aufbauender Meilensteine.**

Die Priorität lautet:

```text
saubere gemeinsame Grundlage
vor
schneller Einzelimplementierung
```

Neue Ideen werden entweder einem bestehenden späteren Meilenstein oder einer künftigen Entwicklungsstufe zugeordnet. Sie werden nicht spontan in den aktuell laufenden Meilenstein hineingezogen.

Damit bleibt die Entwicklung nachvollziehbar, erweiterbar und gegen Scope-Drift geschützt.
