# Tabelleneditor – Fachliche Bestandsaufnahme vor Umsetzung

Status: verbindlicher Vor-Schritt vor Programmierung des Tabelleneditors  
Bezug: `docs/table-layout-service.md` und `docs/UI-TECH-CONTRACT.md`

---

## 1. Warum diese Datei existiert

Der Tabelleneditor entsteht nicht, weil eine neue Komfortfunktion gewuenscht ist, sondern weil die vorhandene Spalten- und Tabellenlogik fachlich und technisch unuebersichtlich geworden ist.

Deshalb darf der Tabelleneditor nicht einfach ueber die bestehende Logik gelegt werden.

Vor der Umsetzung muss zuerst untersucht werden:

- Welche Tabellenlogik gibt es bereits?
- Welche Spaltenlogik ist fachlich richtig?
- Welche Spaltenlogik ist nur historisch gewachsen?
- Was ist stabil und kann uebernommen werden?
- Was muss angepasst werden?
- Was ist so unklar, dass es im Zuge des Tabelleneditors besser neu gebaut wird?

---

## 2. Grundentscheidung je Tabelle

Jede bestehende Tabelle bekommt nach der Untersuchung eine klare Bewertung.

Moegliche Entscheidungen:

### A – Behalten

Die vorhandene Tabellenlogik ist fachlich richtig und technisch tragfaehig.

Massnahme:

- bestehende Logik als Startlayout uebernehmen
- Tabelle beim Tabellen-Layout-Service registrieren
- nur Feintuning ueber Editor ermoeglichen

### B – Anpassen

Die fachliche Richtung stimmt, aber Spalten, Breiten, Benennungen oder UI/PDF-Abweichungen muessen bereinigt werden.

Massnahme:

- vorhandene Logik gezielt bereinigen
- danach als registrierte Tabelle uebernehmen
- keine grossen Nebenumbauten

### C – Neu machen

Die vorhandene Logik ist zu unklar, zu verstreut oder fachlich nicht mehr passend.

Massnahme:

- bestehende Logik nicht weiter verkomplizieren
- Tabelle im Zuge des Tabellen-Layout-Service sauber neu aufbauen
- alte Sonderloesungen entfernen, soweit sicher moeglich

---

## 3. Untersuchungsumfang

Die Bestandsaufnahme betrifft zuerst das Modul Protokoll.

Zu untersuchen sind mindestens:

- UI-Tabellen im Protokoll-Modul
- PDF-Tabellen im V2-Druck
- Vorschau-Druck / Vorabzug
- TOP-Tabelle
- Teilnehmer-Tabelle
- ToDo-/Restpunktlisten, soweit vorhanden
- Firmenlisten, soweit sie vom gleichen Drucksystem betroffen sind
- Spaltenbreiten im CSS
- Spaltenbreiten im Render-Code
- Unterschiede zwischen UI und PDF
- Unterschiede zwischen Hochformat und Querformat
- vorhandene Header-/Miniheader-/Fullheader-Abhaengigkeiten

---

## 4. Was je Tabelle dokumentiert werden muss

Fuer jede untersuchte Tabelle ist festzuhalten:

- technischer Tabellenname, falls vorhanden
- fachlicher Tabellenname
- Modul
- Zweck der Tabelle
- Spaltenliste UI
- Spaltenliste PDF
- Unterschiede UI/PDF
- feste Spaltenbreiten im Code
- feste Spaltenbreiten im CSS
- Schriftgroessen
- Linien/Gitternetz
- Umbruchverhalten langer Texte
- Seitenumbruchverhalten
- Hochformat/Querformat-Faehigkeit
- vorhandene Probleme
- Entscheidung: A behalten / B anpassen / C neu machen
- Begruendung der Entscheidung

---

## 5. Harte Regel vor Programmierung

Vor dem Bau des Tabelleneditors muss eine erste fachliche Bestandsaufnahme vorliegen.

Es reicht nicht zu sagen: „Wir machen alles konfigurierbar.“

Zuerst muss klar sein:

- Welche vorhandene Tabellenlogik ist brauchbar?
- Welche vorhandene Tabellenlogik ist Ballast?
- Welche Tabelle eignet sich wirklich als Pilot?

---

## 6. Erste fachliche Einschaetzung aus der bisherigen Sichtung

Im vorhandenen Druckbereich gibt es bereits feste Tabellen- und Spaltenlogik.

Erste Hinweise:

- Im PDF-Druck sind Spaltenbreiten teilweise fest im CSS definiert.
- Im PDF-Render-Code werden Tabellen teilweise individuell aufgebaut.
- Es gibt eigene V2-Druckstrukturen mit GlobalHeader, FullHeader und MiniHeader.
- Die vorhandene PDF-Vorschau ist wertvoll und soll nicht ersetzt werden.
- Die bestehende Logik wirkt eher historisch gewachsen als zentral geplant.

Das ist kein Fehlerurteil, aber ein klares Warnsignal:

> Der Tabelleneditor muss erst Ordnung schaffen, bevor er Komfort bringt.

---

## 7. Ergebnis der Bestandsaufnahme

Das Ergebnis soll eine kurze Entscheidungsmatrix sein.

Beispiel:

| Tabelle | Bereich | UI/PDF Stand | Entscheidung | Begruendung |
|---|---|---|---|---|
| Protokoll TOPs | Protokoll | grundsaetzlich passend, aber hart codiert | B – anpassen | fachlich richtig, technische Layoutwerte verstreut |
| Teilnehmerliste | Protokoll | pruefen | offen | UI/PDF-Abgleich erforderlich |
| Restarbeiten | neues Modul | noch nicht vorhanden | neu ueber Service | von Anfang an sauber registrieren |

---

## 8. Konsequenz fuer Codex-Aufgaben

Die erste Codex-Aufgabe darf nicht lauten:

> Baue den Tabelleneditor.

Die erste Codex-Aufgabe muss lauten:

> Untersuche die vorhandene Tabellen- und Spaltenlogik im Protokoll- und V2-Druckbereich. Erstelle eine Entscheidungsmatrix: behalten, anpassen oder neu machen.

Erst danach wird entschieden, welche Tabelle Pilot wird und wie der Tabellen-Layout-Service konkret angesetzt wird.

---

## 9. Verbindung zum Seitenkopfeditor

Bei der Untersuchung muss auch betrachtet werden, wie Tabellen mit Seitenkoepfen zusammenhaengen.

Grund:

- Hochformat und Querformat koennen unterschiedliche Seitenkoepfe brauchen.
- Tabellenbreite haengt vom Seitenkopf-/Druckbereich ab.
- GlobalHeader, FullHeader und MiniHeader duerfen nicht versehentlich beschaedigt werden.

Der Seitenkopfeditor bleibt ein spaeterer Baustein, muss aber bei der Bestandsaufnahme mitgedacht werden.

---

## 10. Entscheidung Stand heute

Vor der Umsetzung des Tabelleneditors wird eine fachliche und technische Bestandsaufnahme verpflichtend vorgeschaltet.

Ziel ist nicht, Altbestand blind zu retten.

Ziel ist eine ehrliche Entscheidung je Tabelle:

- passt gut: uebernehmen
- passt fast: bereinigen
- ist Murks: im Zuge des Tabelleneditors sauber neu machen
