# ARCHITECTURE.md

## Zweck

Diese Datei beschreibt die **fuehrende Zielarchitektur** des Modularumbaus.

Sie haelt fest:
- welches Endziel erreicht werden soll
- welche strukturellen Leitplanken dauerhaft gelten
- welche grobe Zielordnung zwischen App-Kern, gemeinsamen Bereichen und Fachmodulen gilt

Diese Datei ist **kein** Tagesstatus, **kein** Detailplan und **kein** Git- oder Arbeitsmodus-Handbuch.

Der aktuelle technische Ist-Stand und die verbindliche Ausgangsbasis der BBM-Revision sind in [docs/revision/01_REPOSITORY_BESTANDSAUFNAHME.md](docs/revision/01_REPOSITORY_BESTANDSAUFNAHME.md) dokumentiert. Bei Aussagen zum aktuellen Implementierungsstand geht diese Bestandsaufnahme aelteren Meilenstein-/Pilotformulierungen vor.

---

## 1. Architekturziel

BBM wird schrittweise zu einer **modularen App** umgebaut.

Das Ziel ist:
- die App kann mit einem, mehreren oder spaeter anderen Fachmodulen laufen
- `Protokoll`, `Restarbeiten` und `Rechnung` sind im aktuellen technischen Modulregister bereits als Module gefuehrt; ihre fachliche und technische Bereinigung ist unterschiedlich weit fortgeschritten
- der App-Kern bleibt fuer Host-, Navigations- und Aktivierungsaufgaben zustaendig
- gemeinsame Kernbausteine, gemeinsame Domaenen und gemeinsame Dienste bleiben ausserhalb der Fachmodule

Die gesamte App folgt dabei verbindlich dem **Mutter-/Kind-Prinzip**:
- Diese Codebasis ist die **Mutter-App / Bauzentrale**.
- Aus ihr entstehen spaeter **Kinder-Apps / Produktvarianten** mit unterschiedlichen freigegebenen Modulen.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps enthalten nur die jeweils freigegebenen Module und Funktionen.
- Kinder-Apps enthalten keine vollstaendige Lizenzverwaltung und keine Verwaltungszentrale fuer andere Kunden oder Varianten.
- Kinder-Apps pruefen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Dieses Prinzip gilt fuer die gesamte App, nicht nur fuer die Lizenzierung.

Nicht jedes Modul ist ein auswaehlbares Projektmodul:
- Auswaehlbare Projektmodule sind nur fachliche Arbeitsbereiche innerhalb eines Projekts.
- `Protokoll` und `Restarbeiten` sind im aktuellen technischen Modulregister als `project` gefuehrt.
- `Rechnung` ist im aktuellen technischen Modulregister als `hybrid` gefuehrt und darf deshalb nicht pauschal wie ein reines Projektmodul behandelt werden.
- Der konkrete sichtbare Modulzugang richtet sich nach Modulrahmen, Projektkontext und Freigabelogik; aeltere Pilotformulierungen duerfen den aktuellen technischen Registry-Stand nicht ueberschreiben.
- `Ausgabe / Drucken / E-Mail` ist kein auswaehlbares Projektmodul, sondern ein Maschinenraum-Dienst.
- `Audio / Diktat` ist kein auswaehlbares Projektmodul, sondern ein Maschinenraum-Dienst.
- `Dictate` ist das Lizenz-/Produktfeature hinter dem sichtbaren Feature `audio`.
- `Diktieren` ist der Entwicklungs-/Technikbereich in `Einstellungen -> Entwicklung`.
- `Diktierprodukt` ist die fachliche Einheit unter `Diktieren`.
- `Whisper` ist aktuell nur die technische Engine unter dem `Diktierprodukt`; die Whisper-Modelle haengen deshalb unter `Diktierprodukt / Engine Whisper`.
- `Woerterbuch` ist ein vorbereiteter Baustein innerhalb von `Diktieren`.
- `Lizenzierung` ist in der Mutter-App ein Verwaltungs-/Maschinenraum-Bereich, in Kinder-Apps nur Lizenzpruefung und Status.
- Die Lizenzverwaltung wird als eigenes Adminmodul beschrieben: [docs/modules/lizenzverwaltung.md](docs/modules/lizenzverwaltung.md).
- Das geplante Fachmodul `SiGeKo` wird im fuehrenden Fachkonzept beschrieben: [docs/modules/sigeko.md](docs/modules/sigeko.md). Fachlich ist es umfangreich geplant, im produktiven Modulordner aber noch nicht implementiert.
- `Settings`, `Updates`, `Backup` und `Diagnose` sind Maschinenraum oder Verwaltung, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext und oeffnet den Projekt-Arbeitsbereich.
- Die Projektverwaltung ist nicht fachlicher Besitzer einzelner Fachmodule.
- Die Projektverwaltung kann Projekte anlegen, bearbeiten, archivieren, wiederherstellen und auswaehlen.
- Ein Projektklick startet nicht zwingend direkt ein einzelnes Fachmodul; er kann den neutralen Projekt-Arbeitsbereich oeffnen.
- Der Projekt-Arbeitsbereich zeigt das aktive Projekt und bietet nur im jeweiligen Stand freigegebene/aktivierte Projektmodule an.
- Maschinenraum-Dienste werden von Fachmodulen genutzt, aber nicht als gleichberechtigte Projektmodule angeboten.

Der Umbau erfolgt:
- konservativ
- paketweise
- ohne unnoetige Grossumbauten
- ohne kuenstliche Plattformmechanik

---

## 2. Zielbild des modularen Betriebs

Der modulare Umbau dient nicht nur saubererer Code-Struktur, sondern einem klaren Betriebsziel.

Die App soll kontrolliert mit unterschiedlichem aktivem Modulumfang laufen koennen.

Insbesondere bedeutet das:
- Betrieb nur mit `Protokoll`
- Betrieb mit `Protokoll` und weiteren freigegebenen Modulen zusammen
- spaetere Erweiterbarkeit auf weitere Module, ohne den Kern kuenstlich zur Plattform auszubauen

Die Aktivierung von Modulen erfolgt nicht ueber beliebige UI-Schalter, sondern ueber die fachlich vorgesehene Freigabelogik, insbesondere ueber Lizenz- oder Produktfreigaben.

Im Mutter-/Kind-Modell bedeutet das:
- Die Mutter-App bleibt die Stelle fuer Freigabe, Verwaltung und Erzeugung von Varianten.
- Kind-Apps bleiben produktive Zielprodukte mit eingegrenztem Funktionsumfang.
- Das Zielbild darf nicht so umgedeutet werden, dass Kind-Apps selbst zur Verwaltungszentrale werden.

Wichtig:
- nicht freigegebene Module sollen im Rahmen des aktuellen Ausbaustands sauber nicht aktiviert sein
- Router, Navigation, Modul-/Screen-Aufloesung und Moduleinstiege muessen sich am aktiven freigegebenen Modulumfang orientieren
- die dafuer noetige Aktivierungslogik gehoert in den App-Kern und den Modulrahmen
- die Fachlogik selbst bleibt in den Modulen

---

## 3. Zielstruktur

Die Zielstruktur trennt sich in diese Bereiche:

### 3.1 App-Kern / Modulrahmen
Hier liegen:
- Router / Shell
- Modulkatalog
- Modul-/Screen-Aufloesung
- modulbezogene Navigation
- Aktivierungslogik freigegebener Module

### 3.2 Gemeinsame Domaenen / gemeinsame Dienste / gemeinsame Kernbausteine
Hier liegt, was mehreren Modulen oder dem Bearbeitungskern dient, ohne selbst Fachmodul zu sein.

Dazu koennen insbesondere gehoeren:
- gemeinsame Domaenen wie Firmen, Projekte, Mitarbeiter/Beteiligte, wenn sie moduluebergreifend gebraucht werden
- gemeinsame Dienste / Addons wie Mail, Drucken, PDF, Export, Whisper
- wiederverwendbare Bearbeitungskerne und neutrale Feldbausteine

### 3.3 Fachmodule
Im aktuellen technischen Modulregister gefuehrt:
- `Protokoll` (`project`)
- `Restarbeiten` (`project`)
- `Rechnung` (`hybrid`)

Dabei gilt:
- `Protokoll` ist produktiv, besitzt aber noch historischen Modularisierungs-/Kompatibilitaetsbestand.
- `Restarbeiten` ist implementiert; parallel existiert eine V2-/Read-only-/Migrationsschicht, deren verbleibende Aufgabe in der Revision geklaert werden muss.
- `Rechnung` besitzt bereits einen substanziellen Implementierungsstand und wird nicht mehr als reiner Entwurf behandelt.

Geplantes Fachmodul:
- `SiGeKo`; fuehrendes Fachkonzept: [docs/modules/sigeko.md](docs/modules/sigeko.md). Die fachliche Planung ist weit fortgeschritten, eine produktive Modulimplementierung unter `src/renderer/modules/` steht noch aus.

Diese Fachmodule bleiben fachlich getrennt.

`TopsScreen` ist **nicht** das Modul `Protokoll`, sondern nur der Arbeitsscreen fuer die Protokollerstellung innerhalb des Moduls `Protokoll`.

Die heutige TOP-Workbench ist **nicht automatisch** der globale Standard fuer andere Module.

### 3.4 UI-Editor-kit und Ziel-App-Prinzip

BBM-Produktiv ist fuer das generische UI-Editor-kit Ziel-App/Integrationspartner, der Editor selbst bleibt generisch.

Der UI-Editor bleibt generisch:
- keine BBM-Fachlogik im Editor
- keine Restarbeiten-Fachlogik im Editor
- keine Protokoll-Fachlogik im Editor
- keine Rechnungs- oder SiGeKo-Fachlogik im Editor
- keine Datenbank-, IPC- oder Speicherlogik als Editor-Fachlogik

Das verbindliche Registry-Prinzip lautet:
- Die Ziel-App liefert die ElementRegistry.
- Der Editor liest ausschliesslich diese Registry.
- Nicht registrierte Elemente existieren fuer den Editor nicht.
- Der Editor darf die Ziel-App-Oberflaeche nicht selbst untersuchen.
- Keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung.

Die BBM-Revision muss den aktuellen produktfuehrenden Integrationsweg von historischen Editor-, Inspector-, Pilot- und V2-Pfaden trennen; sie darf daraus keinen zweiten Editor-Core erzeugen.

---

## 4. Dauerhafte Leitplanken

Bei allen Umbauten gelten dauerhaft diese Leitplanken:

- keine neue Zielarchitektur pro Chat erfinden
- keine kuenstliche Plattform-Engine
- keine allgemeine Discovery-/Registry-Architektur im grossen Stil
- kein abrupter Komplettumbau
- keine aggressive Massenmigration
- keine vorschnelle Generalisierung von Fachlogik
- keine automatische UI-Erkennung, kein UI-Scanning und keine automatische Registry-Befuellung fuer den UI-Editor
- bestehende Funktionalitaet bleibt erhalten
- Uebergaenge duerfen voruebergehend bestehen, muessen aber bewusst und ehrlich benannt bleiben
- Legacy- und Parallelbestand wird erst nach Import-, Runtime- und Abhaengigkeitspruefung entfernt

---

## 5. Was ausserhalb der Fachmodule bleiben soll

Ausdruecklich ausserhalb der Fachmodule bleiben:
- gemeinsamer Bearbeitungskern
- gemeinsame Domaenen
- gemeinsame Dienste
- App-Kern
- Router / Shell
- Modulkatalog
- Modul-/Screen-Aufloesung

Fachlogik soll nicht aus Bequemlichkeit in diese Bereiche zurueckgezogen werden.
Gemeinsame Infrastruktur soll umgekehrt nicht fachmodulspezifisch dupliziert werden.

---

## 6. Was architektonisch nicht passieren soll

Nicht ohne klares Paket und klare Begruendung:
- Fachlogiken vermischen
- Plattformmechanik vorziehen
- breite Navigationserweiterung ohne konkretes Paket
- neue globale Registry-Logik im grossen Stil
- aggressive Altpfadbereinigung
- Massenmigration
- Doku oder Struktur schoenreden, wenn der technische Stand das noch nicht traegt
- einen vorhandenen tragfaehigen gemeinsamen Dienst in einem Fachmodul neu bauen

---

## 7. Zielkriterium fuer einen wesentlichen Modularisierungszustand

Ein wesentlicher Zielzustand ist nicht schon deshalb erreicht, weil Code nur in Modulordner verschoben wurde.

Ein tragfaehiger Zustand ist erst dann erreicht, wenn der Modulrahmen fachlich und technisch tragen kann, dass:
1. `Protokoll` fuer sich freigegeben betrieben werden kann
2. weitere freigegebene Module gemeinsam betrieben werden koennen
3. nicht freigegebene Module im Rahmen des aktuellen Ausbaustands sauber nicht aktiviert sind
4. Router, Navigation, Modul-/Screen-Aufloesung und Moduleinstiege auf diesen aktiven Modulumfang korrekt reagieren
5. gemeinsame Domaenen und Dienste nicht zwischen Fachmodulen dupliziert werden
6. historische Uebergangspfade klar benannt und kontrolliert abgebaut werden koennen

Die dafuer noetige Freigabelogik gehoert in den App-Kern und den Modulrahmen.
Die Fachlogik bleibt in den Modulen.

---

## 8. Branch- und Integrationsregel bei paralleler Entwicklung

BBM wird in mehreren Entwicklungsstraengen parallel weiterentwickelt. Dadurch duerfen Fachmodule und Querschnittsfunktionen nicht unkontrolliert auseinanderlaufen.

Verbindlich gilt fuer jeden neuen groesseren Goal-Lauf, insbesondere fuer neue Fachmodule:

1. **Vor Beginn Branch- und Integrationsstand pruefen.**
   - Relevante aktive Entwicklungsbranches muessen vor dem Start betrachtet werden.
   - Es ist festzulegen, welcher Stand fuer den aktuellen Goal-Lauf die fuehrende Ausgangsbasis ist.
   - `main` ist die Produktivbasis; abweichende gemeinsame Entwicklungsstaende muessen ausdruecklich begruendet und benannt werden.

2. **Gemeinsame Infrastruktur nicht duplizieren.**
   - Modulrahmen, Projekt- und Firmendomaenen, UI-Editor, PDF-/Layout-Editor, Persistenz, gemeinsame Dienste und Lizenz-/Freigabelogik duerfen nicht fachmodulspezifisch noch einmal aufgebaut werden, wenn dafuer bereits ein gemeinsamer Entwicklungsstrang existiert.
   - Ein Fachmodul darf fehlende Querschnittsfunktion nicht durch einen dauerhaften Parallelweg ersetzen.

3. **Abhaengigkeiten offen benennen.**
   - Wenn ein Goal-Lauf von einer noch unfertigen Querschnittsfunktion abhaengt, muss diese Abhaengigkeit im Auftrag und im Abschlussbericht benannt werden.
   - Es darf nur minimal vorbereitet werden, was fuer einen sauberen Abschluss des aktuellen Pakets erforderlich ist.
   - Keine vorgezogene Komplettimplementierung eines fremden Entwicklungsstrangs.

4. **Integrationsfaehigkeit ist Teil der Abnahme.**
   - Neue Fachlogik muss so umgesetzt werden, dass sie mit den fuehrenden Querschnittsstaenden zusammengefuehrt werden kann.
   - Relevante Konfliktfelder sind vor Abschluss zu pruefen: Modulrahmen, Navigation, Projektverwaltung, Firmen, Datenmodelle, UI-Registry, PDF-Registry, Editor-Persistenz, Lizenz-/Modulfreigabe und gemeinsame Dienste.

5. **Stabile Querschnittspakete werden zur gemeinsamen Wahrheit.**
   - Sobald ein gemeinsamer Baustein fachlich und technisch stabil abgeschlossen ist, soll er kontrolliert in den vorgesehenen Integrationsstand uebernommen werden.
   - Fachmodule richten sich danach an diesem gemeinsamen Stand aus, statt eigene Varianten weiterzufuehren.

6. **Kein Goal-Lauf darf stillschweigend die Integrationsstrategie aendern.**
   - Branchwechsel, neue Integrationsbranches, Cherry-Pick-Strategien, breite Merges oder eine neue gemeinsame Basis muessen bewusst festgelegt werden.
   - Kein Codex-Lauf soll aus Eigeninitiative mehrere parallele Entwicklungsstraenge grossflaechig zusammenfuehren.

Fuer Goal-Auftraege gilt deshalb zusaetzlich als Pflichtblock:

```text
AUSGANGSBASIS / INTEGRATION
- Welche Branches bzw. Entwicklungsstaende sind fuer dieses Paket relevant?
- Welcher Stand ist die fuehrende Ausgangsbasis?
- Welche gemeinsame Infrastruktur darf nicht dupliziert werden?
- Von welchen noch offenen Querschnittspaketen haengt dieses Paket ab?
- Welche Integrationskonflikte muessen vor Abschluss geprueft werden?
```

Diese Regel gilt fachmoduluebergreifend und nicht nur fuer `SiGeKo`.

---

## 9. Revisionsregel ab September 2026

Die Repository-Revision arbeitet fuer jeden relevanten Bereich mit vier verbindlichen Klassen:
1. **BEHALTEN**
2. **KONSOLIDIEREN**
3. **LEGACY PRUEFEN**
4. **SPAETER**

Die vollstaendige Ausgangsbasis steht in [docs/revision/01_REPOSITORY_BESTANDSAUFNAHME.md](docs/revision/01_REPOSITORY_BESTANDSAUFNAHME.md).

Vor strukturellen Loeschungen oder breiten Verschiebungen muss die Besitzgrenze im BBM-Core geklaert sein. Die Reihenfolge der Revision ist deshalb: Core zuerst, danach Protokoll und Restarbeiten, anschliessend SiGeKo/Rechnung sowie darauf aufbauende mobile Funktionen.