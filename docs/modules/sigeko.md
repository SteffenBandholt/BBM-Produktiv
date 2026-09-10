# BBM SiGeKo – verbindliches Zielbild

## Zweck

Diese Datei ist die **führende Übersicht** für das geplante BBM-Fachmodul `SiGeKo`.

Sie verweist bewusst auf die detaillierten GitHub-Issues, statt deren Inhalte mehrfach und widersprüchlich zu duplizieren.

Verbindliche Grundlagen:
- fachliche Detailplanung: Issues **#250–#260**
- technische Zielarchitektur und Umsetzungspakete: **#274**
- allgemeine BBM-Zielarchitektur: `ARCHITECTURE.md`

Bei Widersprüchen gilt:
1. der jüngere bereinigte Revisionsstand,
2. fachlich die jeweiligen Haupt-Issues #250–#260,
3. technisch #274,
4. anschließend diese Übersicht.

---

## 1. Grundidee

`SiGeKo` ist ein eigenständiges Fachmodul innerhalb der BBM-Familie.

Es ist:
- keine separate Fremd-App,
- keine zweite Projektverwaltung,
- kein Unterbereich von Protokoll oder Restarbeiten,
- sondern ein lizenzierbares/freischaltbares Fachmodul innerhalb des bestehenden BBM-Modulrahmens.

BBM bleibt Mutteranwendung und führender Datenbestand.

BBM-Mobil bleibt die gemeinsame mobile Erfassungs-App für mehrere fachlich getrennte Bereiche.

---

## 2. Verbindliche Fachabgrenzung

Für BBM-Mobil und die spätere Synchronisation gilt weiterhin:

```text
Qualitätssicherung != SiGeKo != Baudokumentation
```

Gemeinsame Technik darf wiederverwendet werden, z. B.:
- Kamera,
- Diktat,
- Offline-Speicherung,
- Projektwahl,
- Orts-/Gebäudezuordnung,
- GPS,
- Synchronisation.

Die Fachdaten und fachlichen Lebenszyklen bleiben getrennt.

### Wichtige Bereinigung gegenüber älteren Grobständen

Im SiGeKo werden **keine Verantwortlichen und keine Fristen zur Maßnahmenverfolgung geführt**.

Verbindlich gilt:

```text
SiGeKo = feststellen + dokumentieren + berichten
Restarbeiten = Maßnahmen verfolgen + Verantwortliche + Fristen
```

Nur SiGeKo-Berichtspunkte vom Typ `Mangel` können optional an Restarbeiten übergeben werden. Danach gibt es keine Rücksynchronisation.

Die früheren Grobformulierungen zu SiGeKo-Mängeln mit eigenem Verantwortlichem, eigener Frist, eigener Maßnahmenverfolgung oder entsprechender mobiler Pflichtpflege sind verworfen.

Führend dafür: **#253, #254 und #274**.

---

## 3. Fachliche Hauptbereiche

### #250 – Projekt- und Grunddaten
- SiGeKo gehört immer zu einem bestehenden BBM-Projekt.
- Projektadresse = Baustellenadresse.
- zentrale Projektdaten werden nur gelesen.
- Änderungen erfolgen ausschließlich in der Projektverwaltung.
- zentrales zusätzliches Projektfeld: `geplanter Baubeginn`.
- SiGeKo Planung und SiGeKo Ausführung bleiben getrennte Rollen; `wie Planung` ist zulässig.
- freie SiGeKo-Angaben bleiben projektbezogen und erzeugen keine automatischen zentralen Kontakte.
- Start-/Freigabepanel zeigt konkrete fehlende/unsichere Punkte.
- unvollständige Daten erzeugen Warnungen, keine Arbeitssperre.

### #251 – Vorankündigung
- Bearbeitungs-UI folgt direkt dem Vorankündigungsformular.
- bekannte zentrale Daten werden vorbelegt.
- fachvorgangsbezogene Abweichungen bleiben lokale Overrides und schreiben nicht zurück.
- Arbeitsschutzbehörde kommt aus den bestätigten SiGeKo-Projektdaten.
- Punkt 9 nur `Noch nicht bekannt` oder `Firmenliste im Anhang`.
- BBM V2-Kopf, darunter Formularaufbau wie Vorlage.
- Versand zur Unterschrift wird vorbereitet und vom Nutzer bewusst ausgelöst.
- optionales Rücklaufdatum; Outlook-Erinnerung bleibt dem späteren Kalenderpaket vorbehalten.
- unterschriebener Rücklauf wird dem Vorgang zugeordnet.
- Gemäß #274 B3/B4 genügt der tatsächlich geöffnete Outlook-Entwurf: Orange zur Unterschrift, Grün an die bestätigte Behörde mit zugeordnetem Rücklauf. Keine zusätzliche Fremdversandbestätigung, Versandbeobachtung oder Mailhistorie.
- Status Rot / Orange / Grün aus diesem Prozessstand der ausgewählten Fassung ableiten; Rücklaufimport allein erzeugt kein Grün.

### #252 – SiGePlan
- V1 arbeitet mit unveränderter Standardmatrix.
- variabel sind im Wesentlichen Schriftfeld und Adressenleiste.
- keine DWG-Manipulation, keine AutoCAD-Automatisierung, keine dynamische Matrix in V1.
- jede Ausgabe erzeugt eine neue Fassung `01`, `02`, `03` ...
- ältere Fassungen bleiben erhalten.
- Dateiname: `SiGePlan_<Projektnummer>_<Index>.pdf`.

### #253 – Baustellenbesuche und Berichte
- projektweit fortlaufende Berichtspunkte/TOPs.
- Typen: `Mangel`, `Hinweis`, `Feststellung`.
- gemeinsame Nummerierung über alle Typen.
- Nummer bleibt dauerhaft erhalten.
- neue TOPs sind bis zur ersten PDF-Erzeugung frei bearbeitbar und löschbar.
- nach PDF-Erzeugung inhaltlich eingefroren.
- erledigte TOPs verschwinden aus der aktuellen Liste.
- Reaktivierung über `TOP an` mit gleicher Nummer und unverändertem Inhalt; neues Datum und erneut `*`.
- maximal 3 Fotos je TOP.
- `*` kennzeichnet neue/reaktivierte Punkte für das nächste Protokoll.
- PDF enthält nur aktuelle/offene Punkte.
- PDF erzeugt + gespeichert = Bericht beendet.
- Versand ist optionaler Folgeschritt und kein eigener Berichtsstatus.
- keine Verantwortlichen, keine Fristen im SiGeKo-Bericht.

### #254 – Übergabe an Restarbeiten
- nur Typ `Mangel`.
- nur wenn Restarbeiten im Projekt aktiv/vorhanden ist.
- Übergabe gesammelt am Ende der Begehung bzw. vor Abschluss.
- übergeben werden Fachinhalt, Fotos, Ortsdaten und Herkunftsbezug.
- Verantwortlicher und Frist werden nicht übertragen.
- erfolgreicher Transfer wird in SiGeKo markiert.
- keine Rücksynchronisation.

### #255 – Behörden, Notfallstellen und Versorger
- bestätigten BBM-Bestand zuerst nutzen.
- eindeutige geprüfte Treffer direkt Grün übernehmen.
- Web/KI nur für fehlende, unsichere oder veraltete Daten.
- unsichere Treffer Orange mit konkretem Grund.
- Zielkategorien: Arbeitsschutzbehörde, Krankenhaus/ZNA, D-Arzt, Wasser/Abwasser, Strom, Gas, Notarzt 112, Polizei 110 + örtliche Dienststelle.
- Netzbetreiber statt Lieferant.
- Havarie-/Störkontakt ist bei Versorgern Pflichtkontakt.
- vorhandene YAML-Dateien sind Start-/Seed-Bestand, nicht dauerhafte fachführende Datenhaltung.

### #256 – Firmen, Beteiligte und Ansprechpartner
- ausschließlich zentrale BBM-Firmen-/Personen-/Projektstruktur verwenden.
- aus SiGeKo keine Änderung zentraler Stammdaten.
- keine eigene Kontaktliste und keine zweite Firmenlistenlogik.
- vorhandene Projekt-Firmenliste wird für die Vorankündigung wiederverwendet.

### #257 – Dokumente, Nachweise und Ablage
SiGeKo erhält keine Dokumentenverwaltung.

Projektordner:

```text
SiGeKo/
├─ Unterlagen/
├─ SiGePläne/
├─ Zeichnungen/
└─ Berichte/
```

Automatische Ablage:
- Vorankündigung -> `Unterlagen`
- SiGePlan -> `SiGePläne`
- Begehungsprotokoll -> `Berichte`

`Zeichnungen` bleibt reine Nutzerablage.

### #258 – Termine, Fristen und Wiedervorlagen
- keine allgemeine SiGeKo-Termin-/Fristenverwaltung.
- einzige fachliche Wiedervorlage: Rücklauf der unterschriebenen Vorankündigung.
- Outlook-Erinnerung nur auf ausdrücklichen Nutzerwunsch.
- keine bidirektionale Outlook-Synchronisation und kein automatisches späteres Abhaken/Löschen.

### #259 – E-Mail, Outlook und Kommunikation
Genau drei fachliche Mailvorgänge:
1. Vorankündigung zur Unterschrift
2. unterschriebene Vorankündigung an Behörde
3. Begehungsprotokoll

Kein Hintergrundversand. Empfänger, Betreff, Text und Anhänge werden vor Versand geprüft und können geändert werden.

Keine Protokoll-Modulabhängigkeit; gemeinsame Mailtechnik muss fachmodulneutral genutzt werden.

### #260 – Status, Historie und Nachvollziehbarkeit
- keine allgemeine Workflow-/Historienplattform für SiGeKo.
- Vorankündigung erhält die fachlich benötigte Rot-/Orange-/Grün-Anzeige.
- SiGePlan und Begehungsprotokolle erhalten keinen zusätzlichen künstlichen Workflowstatus.
- technisch notwendige Ereignisse eines TOPs dürfen zur Nachvollziehbarkeit gespeichert werden, ohne daraus eine universelle Historienengine zu machen.

---

## 4. Verbindliche technische Architektur

Vollständig führend: **#274 – SiGeKo: Technische Zielarchitektur und Umsetzungspakete**.

Kernaussagen:
- eigener Renderer-Modulbereich `src/renderer/modules/sigeko/`.
- Fachservices unter `src/main/domain/sigeko/`.
- SiGeKo-Repositories innerhalb der bestehenden BBM-SQLite-Schicht.
- keine separate `sigeko.db`.
- keine JSON-Hauptpersistenz.
- gemeinsame Projekt-, Firmen- und Personendomänen wiederverwenden.
- gemeinsame PDF-/Druck-, Speicher-, Mail- und Lizenztechnik wiederverwenden.
- Electron-Grenze einhalten: Renderer -> Preload/IPC -> Main -> Service/Repository.
- Projektbereitschaft, Vorankündigungsstatus und TOP-Zustand sind drei getrennte Statuskonzepte.
- Snapshots bei dokumentrelevanten Datenständen, damit ältere PDFs/Fassungen nicht rückwirkend verändert werden.
- stabile IDs sowie `created_at`/`updated_at` von Anfang an für spätere BBM-Mobil-Synchronisation.

---

## 5. Verbindliche technische Umsetzungspakete

### S1 – Modulrahmen / Integration
- Modul registrieren
- Projekt-Arbeitsbereich / Navigation
- Lizenz-/Modulfreigabe
- noch keine Fachprozesse

### S2 – zentrale Projekterweiterung + SiGeKo-Grunddaten
- `geplanter_baubeginn`
- SiGeKo-Projektmodell
- Rollen Planung/Ausführung
- Migrationen

### S3 – Übersicht / Readiness
- Grundoberfläche
- Readiness-Panel
- Warnung statt Sperre

### S4 – Behörden / Notfall / Versorger
- strukturierter Bestand
- Projektzuordnung / Snapshots
- Bestandslookup / manuelle Prüfung
- noch keine automatische Web-/KI-Recherche

### S5 – Vorankündigung End-to-End
- formularnahe UI
- Overrides
- PDF
- Rücklauf-/Abschlussprozess

### S6 – SiGePlan V1
- Schriftfeld
- Adressenleiste
- feste Matrix
- indexierte PDF-Versionen / Snapshots

### S7 – Begehungen / TOPs / Fotos / Bericht
- projektweite Nummerierung
- Einfrieren
- Erledigen / Reaktivieren
- PDF

### S8 – Übergabe an Restarbeiten
- definierter Transfervertrag
- keine Rücksynchronisation

### S9 – Mail-/Outlook-Integration + Abschlussbereinigung
- gemeinsame Mailanbindung vollständig nutzen
- optionale Outlook-Wiedervorlage
- Integrations-/Regressionstests

Danach separat:
- BBM-Mobil-Fachumsetzung
- echte BBM<->Mobil-Synchronisation
- automatische Recherche
- KI / Regelwerke

---

## 6. Abhängigkeiten und Integrationsregel

Vor jedem größeren SiGeKo-Goal-Lauf ist der aktuelle Branch-/Integrationsstand zu prüfen.

Pflichtblock:

```text
AUSGANGSBASIS / INTEGRATION
- Welche Branches bzw. Entwicklungsstände sind relevant?
- Welcher Stand ist die führende Ausgangsbasis?
- Welche gemeinsame Infrastruktur darf nicht dupliziert werden?
- Von welchen offenen Querschnittspaketen hängt das Paket ab?
- Welche Integrationskonflikte müssen vor Abschluss geprüft werden?
```

Besonders prüfen:
- Modulrahmen / Navigation
- Projektverwaltung
- Firmen / Personen
- Datenbank / Migrationen
- PDF-/Layout-Technik
- Mail
- UI-Registry
- Lizenz-/Modulfreigabe
- Restarbeiten-Schnittstelle

Kein SiGeKo-Lauf darf fehlende gemeinsame Infrastruktur dauerhaft durch einen eigenen Parallelweg ersetzen.

---

## 7. Nicht vorziehen

In den ersten Desktop-Paketen nicht eigenständig aufbauen:
- Sync-Server / Cloud-Plattform
- allgemeine API-Plattform
- universelle KI-/Agentenplattform
- automatische Webrecherche als Voraussetzung
- vollständige Regelwerksintegration
- allgemeine Terminverwaltung
- zweite Dokumentenverwaltung
- neue globale Workflowengine

---

## 8. Nächster Schritt

**Nächster Umsetzungsabschnitt: S1 – SiGeKo Modulrahmen / Integration.**

Vor Beginn:
1. aktuelle relevante Branches prüfen,
2. führende Ausgangsbasis festlegen,
3. offene Core-/Querschnittsabhängigkeiten dokumentieren,
4. erst danach einen abgegrenzten S1-Goal-Lauf starten.

S1 darf noch keine Vorankündigungs-, Begehungs-, PDF-, Mobil- oder KI-Fachlogik vorziehen.

---

## Status

**Fachliche Detailplanung abgeschlossen.**  
**Technische Planung abgeschlossen.**  
**GitHub ist ab diesem Revisionsstand die verbindliche Grundlage für die weitere SiGeKo-Planung und Umsetzung.**
