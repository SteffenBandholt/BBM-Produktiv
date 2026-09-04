# BBM SiGeKo – Zielbild und Entwicklungsplan

## Zweck

Diese Datei ist die führende fachliche Beschreibung für das geplante BBM-Fachmodul `SiGeKo`.

Sie hält fest:
- welches Ziel das Modul verfolgt
- wie BBM und BBM-Mobil zusammenarbeiten sollen
- welche fachlichen Bereiche getrennt bleiben müssen
- welche Funktionen später vorgesehen sind
- in welcher Reihenfolge die Entwicklung erfolgen soll
- welche Grenzen für einzelne Codex-Goal-Läufe verbindlich gelten

Diese Datei ist bewusst kein Tagesstatus und kein vollständiges technisches Implementierungsdetail. Änderungen am Zielbild sollen bewusst und nachvollziehbar erfolgen, nicht nebenbei während eines Entwicklungs-Laufs.

---

## 1. Grundidee

`BBM SiGeKo` wird ein eigenständiges Fachmodul innerhalb der BBM-Familie.

Es ist:
- keine separate Fremd-App
- keine Einzellösung nur für einen einzelnen Nutzer
- kein Ersatz für BBM
- sondern ein später lizenzierbares bzw. freischaltbares Fachmodul innerhalb der bestehenden BBM-Architektur

BBM bleibt die führende Mutteranwendung.

BBM-Mobil wird der mobile Erfassungskanal für mehrere BBM-Fachbereiche.

---

## 2. Mobile Fachbereiche in BBM-Mobil

BBM-Mobil soll künftig drei fachlich getrennte Bereiche bedienen:

### 2.1 Qualitätssicherung
- Restarbeiten
- Baumängel
- später ggf. weitere QS-Funktionen

### 2.2 SiGeKo-Begehung
- sicherheitsrelevante Feststellungen / Mängel
- Fotos
- Diktat
- Maßnahmen
- Verantwortliche
- Fristen
- spätere KI- und Regelwerksunterstützung

### 2.3 Baudokumentation
Bewusst sehr schlank:
- Foto
- optional kurzer Kommentar
- Datum/Uhrzeit automatisch
- Projektzuordnung
- speichern

Die drei Bereiche dürfen gemeinsame technische Komponenten verwenden, müssen aber fachlich und im Datenmodell sauber getrennt bleiben.

---

## 3. Fachlicher Umfang von BBM SiGeKo

Ein SiGeKo-Projekt gehört zu einem bestehenden BBM-Projekt.

Das Modul soll später mindestens folgende Bereiche besitzen:
- Übersicht
- Projektdaten
- Vorankündigung
- SiGe-Plan
- Behörden und Notfallkontakte
- Begehungen
- offene Mängel
- abgeschlossene Mängel
- Berichte
- später Regelwerke / KI

---

## 4. Projektdaten

Projektdaten werden einmal erfasst bzw. soweit möglich aus BBM übernommen und anschließend mehrfach verwendet.

### 4.1 Bauvorhaben
- Bezeichnung
- Straße
- PLZ
- Ort
- Art des Bauvorhabens
- geplanter Beginn
- geplante Dauer

### 4.2 Bauherr
- Firma / Person
- Anschrift
- Ansprechpartner

### 4.3 Architekt / Planer
- Firma
- Ansprechpartner
- Anschrift
- Telefon
- E-Mail

### 4.4 SiGeKo
- aus Benutzer-/Firmenstamm
- Kontaktdaten

Diese Daten sollen unter anderem für folgende Funktionen wiederverwendet werden:
- SiGe-Plan
- Vorankündigung
- Begehungsberichte
- Dokumentablage

Keine doppelte Projekt-, Firmen- oder Benutzerverwaltung nur für SiGeKo aufbauen.

---

## 5. SiGe-Plan

Der heutige Arbeitsstand des SiGe-Plans wird fachlich wie folgt eingeordnet.

### 5.1 Fester Inhalt
- Gefährdungsmatrix
- Standardtexte
- Baustellenordnung
- Maßnahmen
- Legenden

### 5.2 Variable Inhalte
- Schriftkopf
- Projekt
- Bauherr
- Architekt
- SiGeKo
- Datum
- Behörden
- Polizei
- Krankenhaus
- Durchgangsarzt
- Strom
- Gas
- Wasser
- Arbeitsschutzbehörde

### 5.3 Zielbild
Keine tägliche DWG-Bearbeitung mehr.

Stattdessen:
- feste SiGe-Plan-Vorlage
- definierte Platzhalter
- BBM füllt die projektspezifischen Daten ein
- PDF wird automatisch erzeugt

### 5.4 Nicht Ziel der ersten Stufe
- keine dynamische Gefährdungsmatrix
- keine AutoCAD-Automatisierung
- keine DWG-Manipulation
- keine automatische fachliche Anpassung der Matrix

---

## 6. Vorankündigung

Die Vorankündigung folgt demselben Grundprinzip:
- feste Vorlage
- variable Projektdaten
- automatische Befüllung
- PDF-Ausgabe

Die Daten stammen aus demselben SiGeKo-Projekt.

Keine doppelte Dateneingabe.

---

## 7. Behörden und Notfallkontakte

Später sollen abhängig von der Baustellenadresse automatisch oder halbautomatisch passende Stellen ermittelt werden können.

Vorgesehen sind mindestens:
- Polizei
- Krankenhaus / ZNA
- Durchgangsarzt
- Arbeitsschutzbehörde
- Stromnetzbetreiber
- Gasnetzbetreiber
- Wasser / Abwasser
- freie weitere Einträge

Gespeichert werden mindestens:
- Organisation
- Bezeichnung
- Anschrift
- Telefonnummer
- Störungs-/Notfallnummer
- Quelle
- geprüft am

Die Daten werden projektbezogen gespeichert und nicht bei jeder PDF-Erzeugung erneut recherchiert.

Automatische Internetrecherche gehört nicht zu den ersten Entwicklungsabschnitten.

---

## 8. SiGeKo-Begehung

Eine Begehung ist ein übergeordneter fachlicher Vorgang.

Beispiel:

```text
SiGeKo-Begehung
04.09.2026
Projekt Bachstraße

- Mangel 1
- Mangel 2
- Mangel 3
- allgemeine Bemerkung
```

Eine Begehung enthält mindestens:
- eindeutige ID
- Projekt
- Datum/Uhrzeit
- Bearbeiter
- Teilnehmer
- allgemeine Bemerkung
- Status `Entwurf` / `abgeschlossen`
- zugehörige SiGeKo-Mängel

Ein späterer Begehungsbericht wird aus diesem Vorgang erzeugt.

---

## 9. SiGeKo-Mangel

Ein einzelner SiGeKo-Mangel enthält später mindestens:
- eindeutige stabile ID
- Projekt
- Begehung
- Datum
- Foto/Fotos
- Originaldiktat bzw. Originalbeschreibung
- Feststellung
- erforderliche Maßnahme
- Kategorie / Prüfbereich
- Firma / Verantwortlicher
- Frist
- Status
- Dringlichkeit
- optional Gebäude / Geschoss / Bereich

Als Status sind zunächst vorgesehen:
- offen
- erledigt
- erneut festgestellt

Ein Mangel soll über mehrere Begehungen weitergeführt werden können.

Beispiel:

```text
SG-0017

04.09.2026 festgestellt
18.09.2026 weiterhin offen
02.10.2026 erledigt
```

Das Datenmodell muss diese Nachverfolgung von Anfang an ermöglichen, auch wenn die vollständige Folgelogik erst später umgesetzt wird.

---

## 10. KI-Unterstützung – später

Geplanter fachlicher Ablauf:

```text
Foto + Diktat
      ↓
KI analysiert
      ↓
mehrere mögliche fachliche Treffer
      ↓
Treffer mit Quelle anzeigen
      ↓
Nutzer wählt einen oder mehrere Treffer
      ↓
Feststellung / Maßnahme / Quellen werden übernommen
```

Die KI darf später unterstützen bei:
- Bildanalyse
- Diktat verstehen
- Mangel strukturieren
- fachlich passende Regelwerkstreffer finden
- Maßnahmen vorschlagen
- Berichtstext formulieren

### 10.1 Unverrückbare Grenze

Die KI trifft keine verbindliche fachliche Entscheidung.

Sie darf insbesondere nicht selbst:
- einen Mangel verbindlich feststellen
- einen Mangel schließen
- einen Regelwerkstreffer ungefragt übernehmen
- einen sicheren Zustand bestätigen

Der SiGeKo entscheidet.

Nur aktiv vom Nutzer bestätigte bzw. übernommene Treffer dürfen in einen Bericht einfließen.

---

## 11. Regelwerke

Später vorgesehene Wissensbasis:
- BG BAU
- DGUV Vorschriften
- DGUV Regeln
- DGUV Informationen
- ASR
- Baustellenverordnung
- RAB
- ggf. BetrSichV

Jeder KI-Treffer soll eine nachvollziehbare Quelle haben.

Zu einem Treffer sollen mindestens gespeichert werden können:
- Regelwerk
- Titel
- Abschnitt / Fundstelle
- Quellenbezeichnung
- Stand / Ausgabe
- Quellen-ID oder URL
- Relevanz / Confidence
- vom Nutzer übernommen: ja/nein

Die Regelwerke werden nicht bereits im ersten Entwicklungsabschnitt vollständig integriert.

Das Datenmodell wird jedoch so vorbereitet, dass die spätere Regelwerksanbindung keinen grundlegenden Umbau erfordert.

---

## 12. Baudokumentation

Die Baudokumentation bleibt bewusst einfach.

Ablauf:

```text
Projekt
→ Baudokumentation
→ Foto
→ optional Kommentar
→ speichern
```

Automatisch erfassen:
- Datum
- Uhrzeit
- Projekt
- Benutzer, soweit im System vorhanden
- optional GPS

### 12.1 Nicht Ziel

Keine Pflicht für:
- Frist
- Priorität
- Mangelbewertung
- Regelwerksprüfung
- Gewerk
- aufwendige Eingabemasken

Baudokumentation ist kein Qualitätsmangel und kein SiGeKo-Mangel.

---

## 13. Qualitätssicherung

Die bestehende Restarbeiten-/Mängelerfassung in BBM-Mobil bleibt bestehen.

Sie wird nicht mit SiGeKo vermischt.

Technische Gemeinsamkeiten dürfen verwendet werden, insbesondere:
- Kamera
- Spracheingabe
- Offline-Speicherung
- Projektwahl
- Gebäude / Geschoss / Bereich
- GPS
- Planmarker
- Synchronisation

Fachlich bleiben die Datensätze unterscheidbar und separat auswertbar.

Verbindlich gilt:

`Qualitätssicherung != SiGeKo != Baudokumentation`

---

## 14. Entwicklungsreihenfolge

Die Entwicklung erfolgt in klar abgegrenzten, in sich geschlossenen Goal-Läufen.

### Abschnitt 1 – BBM-Produktiv: Modulrahmen SiGeKo

**Ziel**
- Modul `SiGeKo` sauber in BBM registrieren
- Projekt-Arbeitsbereich anbinden
- Navigation herstellen
- Modulaktivierung im bestehenden Modulrahmen berücksichtigen

**Nicht Ziel**
- keine Begehungslogik
- keine KI
- keine PDF-Automatik
- keine Mobil-Synchronisation

---

### Abschnitt 2 – BBM-Produktiv: SiGeKo-Datenmodell

**Ziel**
- SiGeKo-Projektdaten
- Begehung
- SiGeKo-Mangel
- Behördenkontakte
- Status
- Quellen-/KI-Felder

**Nicht Ziel**
- keine echte KI
- keine Internetrecherche
- keine Regelwerksdaten
- keine fertigen PDFs

---

### Abschnitt 3 – BBM-Produktiv: SiGeKo-Grundoberfläche

**Ziel**
- Übersicht
- Begehungen
- Mängel
- Behörden / Notfall
- Projektdaten

**Nicht Ziel**
- keine mobile Anbindung
- keine KI
- keine automatische Recherche

---

### Abschnitt 4 – BBM-Mobil: fachliche Aufteilung

**Ziel**
- Qualitätssicherung
- SiGeKo-Begehung
- Baudokumentation
- gemeinsame technische Basis wiederverwenden

**Nicht Ziel**
- Restarbeiten nicht im selben Lauf vollständig fertigstellen
- keine KI
- keine echte Sync-Neuentwicklung

---

### Abschnitt 5 – BBM-Mobil: mobile SiGeKo-Begehung

**Ziel**
- Begehung anlegen
- mehrere Mängel zuordnen
- Foto
- Diktat
- Feststellung
- Maßnahme
- Frist
- Verantwortlicher
- Offline-Speicherung

**Nicht Ziel**
- keine KI
- keine Regelwerksprüfung
- kein fertiger Begehungsbericht

---

### Abschnitt 6 – BBM-Mobil: Baudokumentation

**Ziel**
- Foto
- optional Kommentar
- Datum/Uhrzeit automatisch
- Projektzuordnung
- speichern

Bewusst nicht mehr.

---

### Abschnitt 7 – BBM ↔ BBM-Mobil

**Ziel**
- definierte echte Schnittstelle
- Synchronisation
- Dubletten verhindern
- Offline-Warteschlange
- sichere Fotoübertragung

**Nicht Ziel**
- keine neue Plattformarchitektur
- keine Vermischung der Fachdatentypen

---

### Abschnitt 8 – SiGeKo-Begehungsbericht

**Ziel**
- abgeschlossene Begehung
- Mängel
- Bilder
- Maßnahmen
- Verantwortliche
- PDF-Bericht

**Nicht Ziel**
- KI ist dafür noch nicht erforderlich

---

### Abschnitt 9 – SiGe-Plan und Vorankündigung

**Ziel**
- Vorlagen
- Platzhalter
- automatische PDF-Erzeugung

**Nicht Ziel**
- keine dynamische Matrix
- kein AutoCAD
- keine DWG-Bearbeitung

---

### Abschnitt 10 – KI und Regelwerke

Erst in diesem Abschnitt:
- Fotoanalyse
- Diktatanalyse
- mehrere Treffer
- Quellen
- Übernahme durch Nutzer
- Berichtstext

Die KI bleibt Vorschlagssystem; die fachliche Entscheidung verbleibt beim Nutzer.

---

## 15. Architekturgrenzen

Diese Grenzen gelten für das gesamte Projekt.

### 15.1 Verbindlich
- BBM bleibt Mutteranwendung.
- BBM SiGeKo bleibt eigenes Fachmodul.
- BBM-Mobil bleibt gemeinsame mobile Erfassungs-App.
- Projekt-, Firmen- und Benutzerdaten sollen aus gemeinsamen BBM-Domänen stammen, soweit geeignet.
- vorhandene gemeinsame Dienste werden wiederverwendet, wenn fachlich passend.

### 15.2 Nicht aufbauen
- keine zweite Projektverwaltung
- keine zweite Firmenverwaltung
- keine zweite Benutzerverwaltung
- keine separate SiGeKo-Insel
- keine eigene parallele PDF-Plattform ohne Notwendigkeit
- keine unnötigen neuen Frameworks
- keine allgemeine „Superplattform“
- keine unnötige Neuschreibung vorhandener BBM-Funktionen

### 15.3 Bestandsschutz
Vorhandene Funktionen in anderen BBM-Modulen dürfen durch SiGeKo-Arbeiten nicht beschädigt oder fachlich umgedeutet werden.

Insbesondere gilt:
- Qualitätssicherung bleibt fachlich Qualitätssicherung.
- SiGeKo bleibt fachlich SiGeKo.
- Baudokumentation bleibt eine schlanke Dokumentationsfunktion.

---

## 16. Verbindliche Struktur für jeden Codex-Goal-Lauf

Jeder Goal-Auftrag für dieses Projekt erhält zwingend folgende Abschnitte:

```text
ZIEL
Was muss nach diesem Lauf funktionieren?

IN SCOPE
Was darf Codex verändern und bauen?

NICHT ZIEL
Was gehört ausdrücklich nicht in diesen Lauf?

VERBOTEN
Was darf Codex auf keinen Fall tun?

ABNAHMEKRITERIEN
Woran erkennen wir objektiv, dass der Lauf fertig ist?

BESTANDSSCHUTZ
Welche vorhandenen Funktionen dürfen nicht verändert oder beschädigt werden?

ABSCHLUSSBERICHT
Was wurde tatsächlich geändert?
Was ist noch offen?
Welche Tests liefen?
Welche bekannten Grenzen bestehen?
```

Ein Goal-Lauf darf nicht stillschweigend in den nächsten Entwicklungsabschnitt hineinwachsen.

Wenn eine für den aktuellen Abschnitt notwendige Grundlage fehlt, soll Codex die Lücke dokumentieren und nur dann minimal vorbereiten, wenn dies für einen sauberen Abschluss des aktuellen Abschnitts erforderlich ist.

---

## 17. Führungsregel für das Projekt

Von diesem Plan wird nur bewusst abgewichen.

Neue Ideen, spätere Erweiterungen oder technische Verbesserungen werden zunächst gegen dieses Zielbild geprüft und anschließend als eigene Änderung oder eigener Entwicklungsabschnitt aufgenommen.

Keine Nebenfunktion darf während eines Goal-Laufs unbemerkt die fachliche oder technische Zielrichtung von BBM SiGeKo verändern.
