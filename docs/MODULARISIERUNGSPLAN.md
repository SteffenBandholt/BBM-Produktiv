# docs/MODULARISIERUNGSPLAN.md

## Zweck

Diese Datei ist die **fuehrende operative Roadmap** fuer den laufenden Modularisierungsumbau.

Sie fuehrt:
- Phasen
- Schritte
- Status
- Abhaengigkeiten
- Prioritaeten
- operative Paketrichtung

Diese Datei ist **kein** Architekturpapier und **kein** Codex-Ausfuehrungsmanual.

---

## 1. Operative Arbeitsgrundsaetze

### SiGeKo #274 / #255 – S4.3 Bedienung / S4-Abschluss (2026-09-09)

PR #333 ergänzt die Oberfläche und aktuelle Behördenbereitschaft zu den getrennt
integrierten S4.1/S4.2-Paketen. Acht feste Kategorien, getrennte Bestandsprüfung und
Projektbeurteilung, bekannte eindeutige Kontakte gesammelt übernehmen. Entwürfe,
Prüfnotizen, Archivstatus und unabhängige Grunddatenbedienung abgesichert.
206 Pflichtslots/207 Scopeziele, Registry34; fremde Editorbereiche unverändert.
Volltest 1750/97 (+18), exakt gleiche Baseline. Reviewkorrekturen nachgeprüft;
Windows/Linux-CI 34383932389 je 16 echte Prüfblöcke PASS, Screenshots/Geometrie geprüft.
CI-only-Fix beschränkt Displaypakete nach externem APT-Hashfehler auf Ubuntuquellen,
ohne Verifikationsregeln abzuschalten. Bericht/Testvergleich unter docs/SIGEKO_S4_3_*.
S4 technisch abgeschlossen; nächste Paketplanung S5 Vorankündigung. Recherche,
historische PDF-/YAML-Übernahme und S5–S7-Fachabläufe nicht vorgezogen; Rechnung #275
bleibt eingefroren.

### SiGeKo #274 / #255 – S4.2 Projektkontakte und Snapshots (2026-09-09)

PR #332: aktuelle Projektzuordnungen, serverseitige Snapshots und konservativer
Bestandslookup; manuelle Baustellenprüfung für Krankenhaus/D-Arzt. Quellen-,
Adress- und neue Konfliktänderungen führen zu konkretem Prüfbedarf. Bestehender
ZIP-Transfer V6 erhält Projektstände ohne globalen Behördenbestand zu importieren.
Volltest 1732/97 (+39), exakt gleiche Baseline; unabhängiges Review ohne Restbefund
nach Hashkorrektur, Windows/Linux-CI 34381539474 vollständig PASS. Details unter
`docs/SIGEKO_S4_2_ZUORDNUNGEN.md` und Testvergleich. Anschließend separat S4.3 UI
und Readiness; S4 noch offen. Rechnung #275 eingefroren, keine Recherche/Seeds.

### SiGeKo #274 / #255 – S4.1 Behördenbestand (2026-09-09)

PR #331: strukturierter wiederverwendbarer SiGeKo-Bestand und expliziter manueller
Prüfabschluss auf bestehender SQLite-/Modul-/IPC-Infrastruktur. Bestätigung wird
bei echten Änderungen entzogen; Revision schützt veraltete Eingaben. Keine
Projektzuständigkeit aus PLZ/Kreis behauptet, keine UI-/Recherche-/Seed-Übernahme.
Volltest 1693/97 bei exakt gleichen Baselinefehlern, 25 neue Tests; unabhängiger
Review und Windows/Linux-CI 34379329083 vollständig grün. Integration über PR #331.
Details: `docs/SIGEKO_S4_1_BESTAND.md` und Testvergleich. Nächstes Paket S4.2
Projektzuordnungen/Snapshots/Bestandslookup, danach S4.3 Bedienung; S4 noch offen.
Rechnung #275 bleibt eingefroren; Januar-2022-PDF vor Datenübernahme prüfen.

### SiGeKo #274 – S3 Übersicht / Readiness (2026-09-09)

PR #330: getrennte berechnete Projektdaten-/Behördenbereitschaft, konkrete Fehlstellen
und passende Bearbeitungswege im vorhandenen Screen. Keine Datenkopie/Migration,
keine Sperre durch Readiness, Entwürfe bleiben erhalten. 121 vollständige lokale
M83-Slots; Volltest 1668/97 bei exakt gleichen 97 Baselinefehlern, 27 neue Prüfungen.
Windows/Linux-CI 34373164070 vollständig PASS und Screenshots gesichtet. Reviewfund
zur langsamen Prüfantwort behoben und unabhängig nachgeprüft. Integration über
PR #330; Details: `docs/SIGEKO_S3_READINESS.md` und Testvergleich.
Nächstes getrenntes Paket S4 Behörden / Notfall / Versorger; keine Vorziehung durch
S3. Bewusste Fortfahren-Bestätigung an realen Vorgangseinstiegen S5–S7 ergänzen.
Rechnung #275 bleibt eingefroren. Januar-2022-PDF später vor Übernahme prüfen.

### Zentrale Bauherrzuordnung vor SiGeKo S3 (2026-09-09)

Steffen bestätigt die ausdrückliche Bauherrauswahl im zentralen Projekt. PR #329
referenziert vorhandene globale/Projektfirmen über den gemeinsamen FirmDirectory;
keine Kategorieableitung oder Kontaktkopie, Altprojekte bleiben unzugeordnet.
Bestehendes Projektformular mit eigener vollständiger M83-Komponente, zentraler
Lesegrenze und ZIP-V5-Erhalt. Volltest main 1601/97 → Kandidat 1641/97, exakt gleiche
Baselinefehler und keine fehlenden Bestandsprüfungen. Windows-/Linux-Abnahme
34310878375 vollständig PASS, beide Bildgrößen gesichtet, Quellenreview/Nachprüfung
ohne Restbefund im Paketdelta. Integration über PR #329.
Danach S3 Übersicht/Readiness als eigenes Paket; Rechnung #275 eingefroren,
Behörden erst S4. Details: `docs/PROJEKT_BAUHERR_ZUORDNUNG.md`.

### SiGeKo #274 – S2.4 Grunddaten-Bedienung (2026-09-08)

Eigenes Modulprofil und getrennte Projektrollen im vorhandenen SiGeKo-Screen,
Kontaktwahl über gemeinsamen firmDirectory, 107 vollständige M83-Slots. Bestehende
Services/DB unverändert. PR #328; Volltest 1601/97, identische 97 Baselinefehler,
Windows/Linux-CI 34267359455 vollständig grün, Quellenreview ohne Restbefund.
Steffen bestätigt Bedienbarkeit und delegiert die Restprüfung ausdrücklich an
Codex. Diese ist automatisiert abgeschlossen; kein persönlicher Harness-PASS
behauptet. Integration über PR #328; danach S3 Übersicht/Readiness abgrenzen.
Rechnung #275 eingefroren; Behörden erst S4. Details: `docs/SIGEKO_S2_4_GRUNDDATEN.md`.

### SiGeKo #274 – S2.3 Projekt und Rollen (2026-09-08)

Container 5: SiGeKo-Datenmodell und Anwendungsgrenze auf main 26ec98f / S2.2.
Modulstandard einmalig, Planung/Ausführung getrennt, „wie Planung“ und explizite
Fremdkoordinatoren gemäß bestätigter Rollenklärung. Bestehende DB-/Kontakt-/IPC-
und ZIP-Infrastruktur; keine UI, kein Readiness-/Behörden-/Rechnungsausbau.
Technisch 15 neue Tests grün; Volltest 1584/97 bei identischen 97 Baselinefehlern.
Review ohne Blocker. PR #327, Windows/Linux-CI 34263318599 vollständig grün;
je 15 Pakettests plus bestehende S2.1/S2.2-Prüfungen. Integration über PR #327.
S2.3 ist seit main 741fa373 integriert. Grunddaten-Bedienung folgt als S2.4
(siehe aktuellen Eintrag oben); Behörden bleiben S4. Details: `docs/SIGEKO_S2_3_PROJEKT_ROLLEN.md`.

### SiGeKo #274 – S2.2 Projektformular (2026-09-08)

Container 3: zentrales Feld Geplanter Baubeginn auf S2.1 / main 5d67c6a.
Eigenständige neue Datumskomponente im bestehenden produktiven Projektformular
mit vollständigem lokalem Editorvertrag und bestehenden Speicherwegen.
PR #326 technisch und manuell abgenommen; Volltest 1569 grün / dieselben
97 Baselinefehler. Windows/Linux-Electron-Abnahme grün; Steffens manuelle
Altprojekt-/Wiederöffnen-Prüfung mit PASS aus Profil ZBxktr bestätigt.
Kurzfahrplan: S2.2 integrieren und abschließen; anschließend S2.3 Rollen-
und SiGeKo-Projektzuordnung gemäß #274; danach nächstes freigegebenes S2-Paket.
S2.3 noch nicht begonnen. Rechnung #275 bleibt eingefroren. Details:
`docs/SIGEKO_S2_2_PROJEKTFORMULAR.md`.

### Rechnung #275 – Paket 4d (2026-09-06)

Container 5: Nachtragsentwurf und Bestätigung über den bestehenden BillingOrderService.
Atomare Nummernfolge pro Auftrag, stabile Ursprungs-Serviceposition, unverändertes
Vertrags-LV und unveränderte 4c-Snapshots. Vorhandene 4a-Persistenz und DB-Guards
bleiben bestehen; keine Schema-/UI-/Core-Änderung. Acht Pakettests einschließlich
konkurrierender SQLite-Prozesse grün; relevante Regression 100 grün / bekannte
Screen-Baseline rot. Volltest 463 grün / unveränderte neun Baselinefehler.
Detailnachweis in `docs/RECHNUNG_REVISION_275.md` und #275.
Kurzfahrplan: 4d integrieren/dokumentieren; 4e nur nach gesondertem Auftrag;
weiterer Rechnungsfachscope anschließend gemäß #275. 4e nicht begonnen.

### Rechnung #275 – Paket 4c-fix (2026-09-06)

Container 5: angehaltenen 4c-Snapshotbestand geprüft und dessen DB-Blocker
reproduzierbar korrigiert. Einzige neue Produktänderung gegenüber dem 4c-Stopp:
beide Snapshotspalten in regulärer Neuanlage und historischem Neuaufbau ergänzt.
Drei Fix-Prüfungen sowie unverändert neun 4c-Tests grün; relevante Regression
wieder ohne neuen Fehler. Integration umfasst den zuvor uncommitteten 4c-Bestand
plus Korrektur; Detailnachweis in `docs/RECHNUNG_REVISION_275.md` und #275.
Kurzfahrplan: 4c-fix integrieren/dokumentieren; 4d separat; danach 4e.
4d wurde nicht begonnen.

### Rechnung #275 – Paket 4b (2026-09-06)

Container 5: minimale Auftrags-LV-Anwendungsgrenze auf Paket 4a / PR #313.
`BillingOrderService` kapselt als einziger produktiver Repositoryzugang Lesen,
Entwurfsanlage, Positionsaufnahme und atomare Bestätigung. Fachvalidierung,
aktuelle Modulfreigabe und modularer IPC-/Preload-Zugang sind geprüft. Keine
zweite Persistenz, UI oder Rechnungsanlage aus Auftrag. Der Detailvertrag und
die Baselineabgrenzung stehen in `docs/RECHNUNG_REVISION_275.md` und Issue #275.
Kurzfahrplan: 4b abschließen; anschließend separat 4c Snapshot; danach 4d
Nachtragsworkflow. Folgepakete sind in diesem Arbeitslauf nicht begonnen.

Der Umbau erfolgt:
- paketweise
- konservativ
- in kleinen pruefbaren Schritten
- ohne unnoetige Grossumbauten
- mit ehrlicher Dokumentation des realen Stands

Ein Paket ist nur dann sauber genug, wenn:
- sein Ziel klar benannt ist
- es einem offenen Planschritt zugeordnet ist
- es genau einem Container primaer zugeordnet ist
- es klein genug bleibt
- es keine spaeteren Schritte unnoetig vorzieht

Vor jeder neuen Paketwahl ist aus dieser Datei und `ARCHITECTURE.md` ein 3-Schritte-Kurzfahrplan abzuleiten.
Aktiv bearbeitet wird davon immer nur **Schritt 1**.

---

## 2. Arbeitsmatrix fuer den Modularumbau

Die Arbeitsmatrix besteht verbindlich aus genau **6 Containern**.

### Container 1 – Regelwerk / Zielbild / Planfuehrung
Arbeitsgrundlagen, ehrliche Planpflege, Doku-Nachzuege, Einordnung

### Container 2 – App-Kern / Modulrahmen
Router, Shell, Modulkatalog, Resolver, modulbezogene Navigation, Aktivierungslogik

### Container 3 – Gemeinsame Kernbausteine / gemeinsame Domaenen / Dienste
Neutraler wiederverwendbarer Kern ausserhalb der Fachmodule

### Container 4 – Fachmodul `Protokoll`
Modulinterne Logik und kontrollierter Abbau von Protokoll-Mischzonen

### Container 5 – Fachmodul `weitere Module`
Eigenstaendige, kleine und klar getrennte Weiterentwicklung von `weitere Module`

### Container 6 – Nachweis / Entmischung / Konsolidierung
Kleine belegende, bereinigende und konsolidierende Schritte

---

## 3. Aktive Umbauachsen

Die Container sind nicht gleichrangig aktiv.

### Prioritaet 1 – Achse A
**Container 2 + Container 6**
- Modulrahmen weiter absichern
- aktiven Modulumfang weiter schaerfen
- kontrollierten Modulbetrieb weiter vorbereiten
- noch ohne grosse Lizenz- oder Plattformmechanik

### Prioritaet 2 – Achse B
**Container 4 + Container 6**
- `Protokoll` schrittweise weiter entmischen
- kleine echte Altpfadreduktion
- Mischzonen gezielt verkleinern

### Prioritaet 3 – Achse C
**Container 5 + Container 2**
- `weitere Module` dosiert sichtbarer und tragfaehiger machen
- kleine produktive Anbindung
- weiterhin ohne Grossausbau

### Nur reaktiv – Achse D
**Container 3**
- gemeinsame Kernbausteine nur dann weiter schneiden, wenn reale Pakete es erzwingen

---

## 4. Phasenuebersicht

| Phase | Ziel | Status |
|---|---|---|
| 1 | Architektur verbindlich festziehen | ERLEDIGT |
| 2 | App-Kern fachlich entschlacken | IN ARBEIT |
| 3 | Gemeinsame Domaenen sauber schneiden | IN ARBEIT |
| 4 | Gemeinsame Dienste sauber schneiden | IN ARBEIT |
| 5 | App-Einstellungen und Lizenzierung zentralisieren | IN ARBEIT |
| 6 | Gemeinsame Kernbausteine sauber schneiden | IN ARBEIT |
| 7 | Modul `Protokoll` sauber ausschneiden | IN ARBEIT |
| 8 | Modulrahmen produktiv machen | IN ARBEIT |
| 9 | Modul `weitere Module` aufbauen | IN ARBEIT |
| 10 | Modulfaehigkeit praktisch beweisen | IN ARBEIT |
| 11 | Altbestand zurueckbauen | IN ARBEIT |
| 12 | Aktiven Modulumfang im Kern expliziter machen | IN ARBEIT |

---

## 5. Aktueller operativer Fokus

Der aktuell sinnvolle Hauptfokus liegt auf **Achse B und Achse C**, flankiert von Container 6:

- `Protokoll` schrittweise weiter entmischen
- `weitere Module` dosiert sichtbarer und tragfaehiger machen
- kleine Nachweise und Konsolidierungen mitziehen, wo sie den Umbau direkt belegen
- der erreichte Screen-Stand in `Protokoll` bleibt dabei sichtbar abgesichert
- M21-Einordnung: `Restarbeiten` ist erreichbar, aber fachlich/funktional unfertig und fuer den UI-Editor nur Pilot-Scope.
- M21-Einordnung: Die Besitzgrenzen der Protokoll-Revision #272 sind abgeschlossen; fuer UI-Editor-Themen wird der produktive Bestand weiterhin defensiv/read-only behandelt.
- M21-Einordnung: BBM-Produktiv ist Beispiel-/Pilot-Zielapp fuer das generische UI-Editor-kit; die Ziel-App liefert die ElementRegistry, der Editor liest ausschliesslich diese Registry.
- Keine Selbstuntersuchung der Ziel-App-Oberflaeche, keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung.
- M80.2 ist `[A]` abgenommen: tatsächlicher Restarbeiten-Header und stabiler Editbox-Root sind direkt größenfähig, der alte Splitpfad ist gesperrt und die Hauptliste als flexibler Scrollbereich gesichert. M80.2a stabilisiert ausschließlich Testharness und Node-/Electron-ABI-Wechsel. M81 und M81.1 sind abgenommen; M81.1 trennt alte/beschädigte Benutzerprofile vom gültigen Electron-Handshake und archiviert sie vor einem Baselinestart byte-identisch. M82 ist als deklarative App-Starterpaket-Bestandsreferenz `[A]` abgenommen. M82.1 ergänzt ausschließlich Start-Restore, Direktauswahl und begrenzte Layoutwirkung und ist nach vollständiger sichtbarer Abnahme `[A]` abgenommen. M82.2 bindet ausschließlich den gemeinsamen Geführt-/Frei-Geometrierisikovertrag an dieselben Registry-, Pipe-, HostAdapter- und Profilwege an und ist nach vollständiger sichtbarer UI-/PDF-Abnahme mit kontrolliertem Diagnostic-Build `[A]` abgenommen. Der Fachausbau bleibt offen.
- M82.7.1 ist `[A]` abgenommen: Die willkürliche ±12-Pixel-Grenze der zwei vorhandenen Restzeichenanzeigen ist entfernt. Wiederholte und direkte Verschiebungen bleiben auf dem bestehenden Registry-/HostAdapter-/Undo-/Profilweg; nur die technische ±2400-Pixel-Grenze bleibt verbindlich. Es wurden keine Registry-, Topologie-, Fach- oder Moduländerungen eingeführt.

Der Kernrahmen bleibt weiter wichtig, aber die bereits erreichten kleinen Kernschritte sind fuer die naechsten Mini-Pakete nicht mehr der dominante erste Fokus.

Wenn der reale Repo-Stand einen kleineren und ehrlicheren naechsten Schritt zeigt, darf die Reihenfolge innerhalb der aktiven Achsen angepasst werden.

---

## 6. Operative Statusbilder je Hauptbereich

### 6.1 Container 2 – App-Kern / Modulrahmen
**Status:** aktiv, priorisiert

**Erreicht**
- kleiner statischer Modulkatalog
- kleiner Modulrahmen traegt `Protokoll` und `weitere Module`
- bekannte Module und aktiver Modulumfang sind klarer getrennt
- kleine Modul-/Screen-Aufloesung
- kleine modulbezogene Navigation
- vorbereitende Freigabelogik ist vorhanden
- aktiver Modulumfang wird an einer zweiten kleinen Kernstelle sichtbar genutzt
- `showTops()` nutzt keinen Fallback mehr ueber `views/TopsScreen.js`
- Restarbeiten V2 ReadOnly bleibt produktiv abgeschaltet; der spaetere explizite Freigabeschalter ist fachlich beschrieben, aber nicht verdrahtet
- ein klar benannter Router-Checkpoint bereitet den spaeteren Produktiv-ReadOnly-Schalter vor und liefert weiter `false`
- der gleiche Checkpoint ist testseitig simulierbar und belegt den produktiven ReadOnly-Flow nur im Test
- M18.0 bis M18.4 sind als ReadOnly-Freigabevorbereitung abgeschlossen und eingefroren
- M19.0 legt vor einer echten Produktivaktivierung einen fachlichen Abnahmetest fest
- der globale Mainheader bleibt als gemeinsamer Shell-Bereich zweizeilig, nutzt bei Screenwechseln zuverlässig sein Grid und besitzt ohne leere Action-Zeile mit oder ohne DEV-Editor-Button dieselbe deutlich flachere Grundhöhe
- gemeinsame `--bbm-form-*`-Tokens bilden die kompakte Formular-/Popup-Referenz; das Projekt-Popup nutzt sie ohne Änderung seines Zweispaltenrasters oder seiner Fachlogik

**Noch offen**
- kein vollstaendig produktiver freigabebasierter Betrieb
- Aktivierung / Nicht-Aktivierung freigegebener bzw. nicht freigegebener Module ist noch nicht vollstaendig durchgezogen
- weitere kleine Kernstellen fuer den aktiven Modulumfang sind noch moeglich

### 6.2 Container 4 – Fachmodul `Protokoll`
**Status:** Revision #272 abgeschlossen; erhaltener Unterbau aktiv

**Erreicht**
- sichtbare Modulheimat
- Moduleinstieg
- Teile des Bestands umgezogen
- Fachschnitt klarer
- `src/renderer/modules/protokoll/screens/TopsScreen.js` ist die technische Heimat
- `src/renderer/views/TopsScreen.js` bleibt Uebergangs- und Kompatibilitaetsschicht
- modulnaher Style-Einstieg ist eingefuehrt
- `TopsScreen` bindet Styles nicht mehr direkt ueber den globalen `tops/`-Pfad ein
- `TopsScreen` ist fuer die bisher bearbeitete Kleinschnitt-Achse weitgehend von direkten Tiefenimports entlastet
- ein kleiner Nachweis fuer den entmischten Screen-Stand ist vorhanden
- die Diktat-Buttons nutzen jetzt die vorhandenen SVG-Assets und sitzen direkt neben der Restzeichenanzeige in der echten Tops-Editbox
- Protokoll-Popups verwenden die gemeinsame, an der realen Header-Unterkante ausgerichtete Popup-Flaeche; Projekt und Mail sind ohne fachliche Aenderung an dieselbe Basis angeschlossen
- kanonischer produktiver Moduleinstieg und reine `views/TopsScreen.js`-Kompatibilitaet sind nachgewiesen
- protokollspezifische Settings besitzen einen gemeinsamen Modulvertrag und modulare IPC-Grenze
- PDF und Mail laufen ueber gemeinsame technische Dienste; Fachpayload und Abschlussregeln bleiben Protokollbesitz
- Besprechungsteilnahme, Anwesenheit und Verteiler sind von Core-Stammdaten und Projektpool getrennt
- nachweislich tote Parallel- und Settings-Legacypfade sind entfernt; notwendige Kompatibilitaets-Re-Exports bleiben erhalten
- der vollstaendige Kriterien- und Baselinebericht steht in `docs/PROTOKOLL_REVISION_272.md`

**Noch offen**
- der grosse Unterbau unter `src/renderer/tops/` bleibt bewusst erhalten und ist kein konkurrierender Moduleinstieg
- tiefere Router-/Strukturkonsolidierung bleibt gemaess #272 eine spaetere, bedarfsgetriebene Arbeit

### 6.3 Container 5 – Fachmodul `weitere Module`
**Status:** sichtbar, klein, kontrolliert ausbaufaehig

**Erreicht**
- Modulstruktur
- kleine Workbench
- Moduleinstieg
- Einzelbetrieb
- Koexistenz mit `Protokoll`
- kleiner projektbezogener Navigationseintrag ist vorhanden
- `weitere Module` ist im aktiven Modulumfang sichtbar

**Noch offen**
- noch keine breite produktive Verdrahtung
- Navigation / Router nur klein angebunden
- noch kein freigabebezogener Produktivbetrieb
- weiterer Ausbau bleibt bewusst dosiert

### 6.4 Container 6 – Nachweis / Entmischung / Konsolidierung
**Status:** aktiv, flankierend

**Erreicht**
- erste Integrationsnachweise
- erste kleine Bereinigungen
- erste Konsolidierungsschritte
- kleine Nachweise zur Kernnavigation, Router-Entkopplung und Modulsichtbarkeit sind nachgezogen
- der entmischte `TopsScreen`-Zwischenstand ist per Test abgesichert
- die inline platzierte Diktat-Schaltflaeche ist testseitig mit Asset-Icons, Start-/Stop-Umschaltung und Freischaltung abgesichert
- die kompakte Projektformular-Referenz ist mit einem gezielten Token-/Struktur-Guardrail sowie realer Electron-Messung bei normaler und kleiner Fensterhöhe abgesichert
- die kaputte sichtbare Restarbeiten-V2-UI ist aus der aktiven App-Struktur entfernt und bleibt entfernt; der neue M1-RestarbeitenScreen ist bewusst neu aufgebaut und stellt `restarbeiten.screen` wieder als expliziten UI-Editor-Scope bereit, Protokoll- und Demo-Scope bleiben erhalten
- M2.1 hat die Restarbeiten-Main/Body-Datensatzdarstellung im Blatt mit Tabellenkopf und dreizeiliger Datensatzstruktur nachgezogen

**Noch offen**
- weitere kleine Nachweise sinnvoll
- weitere Altpfade und Restmischzonen vorhanden
- Konsolidierung ist noch nicht Endabschluss
- naechstes Restarbeiten-Paket fachlich getrennt planen, bevor Ausgabe/PDF/Notizen/Diktat ueber M1-Stubs hinaus umgesetzt werden

---

## 7. Naechste 3 Schritte

Vor jeder aktiven neuen Paketwahl diesen Kurzfahrplan neu pruefen.

### Schritt 1 – aktiv
Kleinstes realistisches Paket auf der aktuell priorisierten Achse ableiten und sauber einem Container zuordnen.

### Schritt 2 – Orientierung
Danach den naechsten sinnvollen Folgeschritt auf derselben Achse oder einer direkt angrenzenden Achse bestimmen.

### Schritt 3 – Orientierung
Danach den naechsten groesseren Entblocker bestimmen, der den modularen Betrieb weiter tragfaehig macht.

Wichtig:
- nur **Schritt 1** wird aktiv in ein Paket und einen Prompt uebersetzt
- Schritt 2 und 3 sind nur Orientierung
- nach Abschluss von Schritt 1 wird der Kurzfahrplan neu geprueft

---

## 8. Planpflege

Bei jedem Paket ist zu pruefen, ob diese Datei gepflegt werden muss.

Pflege ist noetig, wenn sich durch das Paket mindestens eines davon veraendert:
- Status eines Schritts oder einer Phase
- aktueller Fokus
- offene Punkte eines Hauptbereichs
- naechste sinnvolle Paketrichtung
- relevante Abhaengigkeiten

Dabei gilt:
- nur den real erreichten Stand eintragen
- Uebergaenge ehrlich benennen
- keine Parallelplaene anlegen
- keine Fortschritte groesser schreiben, als sie technisch sind

### Core #271 – Paket 4 modulare Fach-IPC-Registrierung

- Fach-IPCs werden am Main-Kompositionspunkt nur fuer aktive, lizenzierte Module ueber den im Moduldeskriptor benannten Registrar registriert.
- Protokoll, Restarbeiten und Rechnung besitzen kleine fachmoduleigene IPC-Registrare; `main.js` registriert keinen dieser Fach-IPC-Pfade mehr einzeln.
- Registrierte Fachhandler pruefen die aktuelle Modulfreigabe bei jedem Aufruf erneut. Statische Preload-Funktionen erhalten bei inaktiven Modulen deshalb keinen ungeguardeten Handler.
- Datenbankmigrationen, Providergrenzen und `OwnOrganization` bleiben den Core-Paketen 5 bis 7 vorbehalten; Gate B wird erst mit Paket 8 bewertet.

### Core #271 – Paket 5 modulare DB-Migrationen

- Die gemeinsame SQLite-Datei bleibt bestehen; Core- und Fachmigrationen werden logisch getrennt registriert.
- Der Core erzeugt und prueft seine neutralen Tabellen ohne `meetings`, `tops` oder `meeting_tops` vorauszusetzen.
- Protokoll, Restarbeiten und Rechnung binden ihre vorhandenen Schemafunktionen ueber die im Moduldeskriptor benannten Migrationsregistrare ein.
- Der aktive Lizenz-/Modulumfang steuert beim App-Start dieselben Fachmodule fuer Migrationen und IPCs; Bestandsmigrationen bleiben idempotent und erhalten vorhandene Daten.
- Providergrenzen und `OwnOrganization` bleiben den Paketen 6 und 7 vorbehalten; Gate B wird erst mit Paket 8 bewertet.

### Core #271 – Paket 6 fachneutrale Providergrenzen

- `PdfDocumentProvider`, `MailPayloadProvider` und `ExportProvider` bilden eine gemeinsame technische Anschlussgrenze ohne Fachimporte.
- Jeder Provider ist eindeutig einem Modul und einem von diesem Modul gelieferten Fachtyp zugeordnet; das Fachmodul liefert ViewModel/Payload und Layout- bzw. Exportregeln.
- Die neutrale Registry akzeptiert Provider nur, wenn das Modul die passende Capability im kanonischen Deskriptor deklariert.
- Bestehende PDF-, Mail- und Exportengines sowie ihre produktiven Abläufe bleiben unverändert; eine tiefe Bereinigung ist ausdrücklich nicht Teil dieses Pakets.
- `OwnOrganization` bleibt Paket 7 vorbehalten; Gate B wird erst mit Paket 8 bewertet.

### Core #271 – Paket 7 OwnOrganization-Identitaetsgrenze

- `OwnOrganization` ist ein neutraler, unveraenderlicher Core-Vertrag fuer die eigene Betreiberorganisation und wird weiterhin aus dem bestehenden `user_profile` persistiert.
- Eigene Organisation und Lizenzsubjekt sind getrennte Identitaeten; `customerName` oder `licenseId` werden nicht als Organisationsstammdaten interpretiert.
- Getrennte Core-IPC-/Preload-Einstiege stellen den Vertrag bereit, ohne bestehende `userProfile`-Kompatibilitaet zu brechen.
- `InvoiceIssuerProfile`, Empfaenger-/Aussteller-Snapshots und sonstige Rechnungsfachidentitaeten bleiben ausserhalb dieses Pakets.
- Gate B wird erst mit Paket 8 nach der Gesamtregression bewertet.

### Core #271 – Paket 8 Gate-B-Gesamtregression

- Alle acht Gate-B-Kriterien aus #277 sind durch `gateBRegression.test.cjs` und die bestehenden Router-, Modul-, Core- und Fachregressionen nachgewiesen.
- Core ohne Protokolltabellen, aktive Einzelmodule, nicht lizenzierte Rechnung, modulare IPCs/Migrationen, Bestands-DB und Mehrmodul-Provider sind explizit abgedeckt.
- Die Vollregression bleibt bei den bereits vor Paket 4 dokumentierten neun Einzeltestfehlern und den fehlenden `ui-editor-kit`-Artefakten; keine neue Fehlerklasse ist hinzugekommen.
- Der vollständige Kriterien- und Baselinebericht steht in `docs/GATE_B_REGRESSION.md`.
- **Gate B ist erfuellt.** Diese Bewertung bezieht sich ausschließlich auf den Core-Vorbau #271/#277 und zieht keine Fachentwicklung vor.



### M3 Restarbeiten-Datenmodell (neu)
- Datenmodell vorbereitet: `restarbeiten_items`, `restarbeiten_project_settings`, `restarbeiten_attachments`.
- Restarbeiten-Datenmodell enthaelt `item_class` mit den Werten `rest` und `mangel`; Default ist `rest`.
- Darstellung von `item_class` in UI/PDF folgt in einem spaeteren Schritt.
- Fotoregeln in Repo-Basis vorbereitet: max. 3 je Restarbeit, genau ein Hauptfoto.
- Bildverarbeitung folgt in spaeterem Schritt.

### M4 Restarbeiten-Laden + erste Liste (neu)
- Restarbeiten laden im Projektkontext über IPC (`restarbeiten:listByProject`, `restarbeiten:getProjectSettings`).
- Renderer zeigt erste einfache Listenstruktur mit den Hauptspalten Nr./Datum, Verortung, Restarbeit, Status.
- Bearbeitung, Editbox, Fotos, Druck, Mail und Diktat folgen in späteren Schritten.
### M5 Restarbeiten anlegen, auswaehlen und Editbox-Grundform speichern (neu)
- Restarbeiten koennen jetzt ueber IPC und Datasource neu angelegt und aktualisiert werden.
- Der Screen zeigt eine auswaehlbare Liste, markiert die Auswahl und blendet die Editbox erst bei Auswahl ein.
- Die Editbox-Grundform deckt `item_class`, `status`, Verortung, Kurz-/Langtext, Faelligkeitsdatum und Verantwortlichen-Label ab.
- Speichern laedt die Liste erneut und haelt die Auswahl konsistent.
- Foto-/Diktat-/Druck-/Mail-/Loesch- und Archivpfade bleiben weiterhin ausserhalb dieses Pakets.

### M6 Restarbeiten-Verantwortliche aus Projektfirmen waehlen (neu)
- Die Restarbeiten-Editbox kann Verantwortliche aus den Projektfirmen des aktuellen Projekts auswaehlen.
- Beim Speichern werden `responsible_project_firm_id` und `responsible_label` gemeinsam gesetzt; bestehende Label-Fallbacks bleiben erhalten.
- Liste zeigt weiterhin `responsible_label` in der Status-Metaspalte.
- Fotos, Diktat, Druck, Mail, Filter und Smartphone-Import bleiben fuer spaetere Schritte offen.

### M7 Restarbeiten-Attachments anzeigen und Hauptfoto markieren (neu)
- Restarbeiten-Attachments koennen geladen, in der Editbox angezeigt und als Hauptfoto markiert werden.
- Dateiimport, Projektordner-Kopie, Bildzuschnitt und Thumbnail-Erzeugung folgen in spaeteren Schritten.

### M8 Restarbeiten-Fotos importieren und als Attachments speichern (neu)
- Restarbeiten-Fotos koennen per Dateiauswahl importiert, in den Projektordner kopiert und als Attachments gespeichert werden.
- Bildzuschnitt, Thumbnail-Erzeugung, Smartphone-Import und Foto-Loeschen folgen spaeter.

### M9 M8-Fotoimport gegen Repo-Vertrag stabilisiert (neu)
- Der M8-Fotoimport wurde gegen den echten Attachment-Repo-Vertrag stabilisiert.
- Beim Speichern von Attachments wird `project_id` jetzt aus dem normalisierten `projectId` mitgegeben.

### M10 Restarbeiten-Attachment loeschen (neu)
- Restarbeiten-Attachments koennen entfernt werden; DB-Datensatz wird geloescht.
- Datei und optionales Thumbnail werden nach DB-Delete bestmoeglich entfernt.
- Nach Loeschen wird die Attachment-Liste neu geladen; bei geloeschtem Hauptfoto wird ein verbleibendes Foto wieder Hauptfoto.
- Bildzuschnitt, Thumbnail-Erzeugung und Smartphone-Import folgen spaeter.

### M11 Restarbeiten-Fotoanzeige im festen Landscape-Layout (neu)
- Restarbeiten-Fotoanzeige ist jetzt als stabiles 2-Spalten-Landscape-Layout umgesetzt.
- Hauptfoto steht links groß, bis zu zwei Nebenfotos stehen rechts untereinander.
- Die Bilddateien werden nicht bearbeitet; es bleibt reine Anzeigeformatierung mit `object-fit: cover`.

### M12 Restarbeiten-Liste fachlich layoutet (neu)
- Die Restarbeiten-Liste bleibt bei 4 Hauptspalten (Nr./Datum, Verortung, Restarbeit, Status).
- Verortung wird als Metaspalte mit zwei Zeilen dargestellt (L1/L2 und L3/L4).
- Die Status-Metaspalte zeigt Klasse, Status, Fertig bis, Verantwortlich und Ampel (rot/orange/gruen/neutral).
- M12 umfasst keine Filter-, Druck-, Mail- oder Archivfunktion.


### M13 Restarbeiten-Startbutton im Projekt-Arbeitsbereich (neu)
- Restarbeiten ist im Projekt-Arbeitsbereich als sichtbarer Modulstart enthalten, wenn das Modul im aktiven Modulumfang freigegeben ist.
- Der Start erfolgt wie bei anderen Projektmodulen ueber `openProjectModule(projectId, "restarbeiten", { project })`.
- Projektfirmen- und Protokoll-Einstiege bleiben unveraendert.

### M13.1 Restarbeiten-Button auf Projektkachel (Hotfix)
- Restarbeiten ist sowohl im Projekt-Arbeitsbereich als auch direkt auf der Projektkachel startbar.
- Der Projektkachel-Start nutzt den bestehenden Projektmodulpfad `openProjectModule(projectId, "restarbeiten", { project })`.

- Hotfix M13.2 nachgezogen: `Restarbeiten` ist fuer die Projektkachel nicht nur ueber Test-Stub sichtbar, sondern wird ueber die tatsaechliche Runtime-Projektmodulliste geliefert.

### M25 Restarbeiten Pflichtfelder, Status und Ampel abgesichert (neu)
- Restarbeiten nutzt eine fachmodulinterne Regelbasis fuer Pflichtfelder, Statuswerte und Ampel.
- Pflichtfeldvollstaendigkeit wird sichtbar markiert, ohne neue UI-Editor-Funktion oder automatische UI-Erkennung einzufuehren.
- Der erste technische Save/Create bleibt an einen vorhandenen Kurztext gebunden; weitere fehlende Pflichtfelder bleiben als unvollstaendiger Draft sichtbar.
- Statuswerte sind auf `offen`, `in_arbeit` und `erledigt` begrenzt; unbekannte Status werden nicht still normalisiert.
- Die Ampel folgt der M24-10-Tage-Regel und behandelt `erledigt` fristneutral.
- Protokoll, UI-Editor-kit, PDF/Druck/Mail, Diktat/Audio, Fotoimport und Registry-Struktur bleiben ausserhalb dieses Pakets.

### M26 Restarbeiten Nachpflege vorhandener Datensaetze abgesichert (neu)
- Unvollstaendige Restarbeiten bleiben in Liste und Editbox klar als Nachpflegefaelle sichtbar.
- Vorhandene Alt-Datensaetze koennen auch dann feldweise nachgepflegt werden, wenn der Kurztext noch fehlt.
- Neue Datensaetze bleiben weiterhin gegen Anlegen ohne Kurztext gesperrt.
- Es werden keine Platzhalter oder Fantasiewerte erzeugt; Statusmodell und M25-Ampellogik bleiben unveraendert.
- Protokoll, UI-Editor-kit, PDF/Druck/Mail, Diktat/Audio, Fotoimport und Lizenzierung bleiben ausserhalb dieses Pakets.

### M27 Restarbeiten Ausgabe- und Abnahmegrenze fachlich festgelegt (neu)
- Die erste einfache Ausgabe ist als projektbezogene Restarbeitenliste fachlich abgegrenzt.
- Ausgabefelder sind Nr., Kurztext, Ort/Bereich, Verantwortlich, Fertig bis, Status, Ampel/Fristbewertung und Hinweis auf unvollstaendige Pflichtfelder.
- Unvollstaendige Datensaetze bleiben ausgabefaehig, werden aber als unvollstaendig gekennzeichnet; es werden keine Fantasiewerte oder Platzhalter erzeugt.
- Erledigte Restarbeiten duerfen enthalten sein, muessen aber klar erkennbar erledigt und fristneutral behandelt sein.
- Sortierung und Filterung sind nur fachlich beschrieben; PDF, Druck, Mail, Fotos und Detailanhaenge bleiben spaetere Pakete.
- Protokoll, UI-Editor-kit, Datenbank, Diktat/Audio und technische Ausgabewege bleiben ausserhalb dieses Pakets.

### M27a UI-/PDF-Grundlagenpfade bereinigt (neu)
- Die in `AGENTS.md` erwarteten UI-/PDF-Grundlagenpfade unter `docs/` sind als kurze Bruecken vorhanden.
- Fuehrende Inhalte bleiben unter `docs/ui-editor/`; es wurde keine doppelte Fachlogik aufgebaut.
- `docs/UI_EDITOR_VERTRAG.md` ist ebenfalls auf die fuehrende Vertragsfassung unter `docs/ui-editor/` ausgerichtet.
- `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md` ist eine allgemeine Bruecke/Vorlage und keine M28-Entscheidung.
- Restarbeiten-UI, Ausgabeansicht, PDF, Druck, Mail, UI-Editor-kit-Code, Protokoll und Datenbank bleiben unveraendert.

### M28 Restarbeiten einfache Ausgabeansicht technisch vorbereitet (neu)
- Eine rein app-interne Ausgabevorschau zeigt die M27-Felder als lesende projektbezogene Restarbeitenliste.
- Unvollstaendige Datensaetze bleiben sichtbar und werden ohne Fantasiewerte oder Platzhalter als unvollstaendig gekennzeichnet.
- Erledigte Datensaetze bleiben sichtbar und werden erledigt/fristneutral behandelt.
- Die Ausgabevorschau nutzt eine einfache Sortierung; grosse neue Filterlogik wurde nicht gebaut.
- Es wurden keine neuen IPC-, Datenbank-, PDF-, Druck-, Mail-, Foto-, Diktat-/Audio- oder Lizenzierungswege angelegt.
- UI-Editor-kit, generische Editorlogik, Protokoll und Tabellenlayout-Editor blieben ausserhalb dieses Pakets.

### M29 Globaler UI-Editor Speichern/Laden/Reset abgesichert (neu)
- Der bestehende EditorRuntime-/HostAdapter-Pfad speichert fuer den Pilot-Scope `restarbeiten.ui.main` nur neutrale Layoutwerte zu bewusst registrierten Elementen.
- Gespeicherte Layoutwerte koennen ueber den HostAdapter wieder geladen und per Reset einzeln oder vollstaendig entfernt werden.
- Ungueltige Change Requests werden blockiert, insbesondere unbekannte Elemente, nicht erlaubte oder gesperrte Operationen sowie Fach-, DOM-, Datenbank-, IPC- und Datensatz-Payloads.
- Es wurde keine automatische DOM-Erkennung, keine automatische Registry-Befuellung und kein Fachspeicher eingefuehrt.
- PDF, Druck, Mail, Diktat/Audio, Protokoll-Fachlogik, Restarbeiten-Fachlogik, Datenbankmigration und neue fachliche IPC-Wege bleiben ausserhalb dieses Pakets.
- Neue Doku: `docs/M29_UI_EDITOR_GLOBAL_SPEICHERN_LADEN.md`.

### M30 Globale UI-Editor-Bedienoberflaeche Speichern/Laden/Reset abgesichert (neu)
- Der bestehende EditorScopeInspector stellt ein neutrales Layout-Control-Modell fuer registrierte UI-Elemente bereit.
- Bedienaktionen sind: Aenderung anwenden/speichern, gespeicherten Zustand laden/anwenden und auf Standard zuruecksetzen.
- Erfolg und Fehler werden als Statusmeldungen zurueckgegeben; ungueltige Aktionen werden sichtbar blockiert.
- Die Bedienlogik nutzt nur den vorhandenen HostAdapter- und LayoutPersistence-Pfad aus M29.
- Unbekannte Elemente, nicht layoutneutrale Operationen sowie Fach-, DOM- und Datenbankpayloads werden nicht gespeichert.
- Es wurde keine Ziel-App-UI gescannt, keine automatische Registry-Befuellung eingefuehrt und keine Fachlogik oder Datenbankmigration geaendert.
- PDF, Druck, Mail, Diktat/Audio, Protokoll-Fachlogik und Restarbeiten-Fachlogik bleiben ausserhalb dieses Pakets.
- Neue Doku: `docs/M30_UI_EDITOR_BEDIENOBERFLAECHE_SPEICHERN_LADEN_RESET.md`.

### M31 Globale UI-Editor-Bedienung sichtbar in der App angebunden (neu)
- Die bestehende UI-Editor-Launcher-/Statusoberflaeche zeigt fuer registrierte Auswahlziele eine sichtbare neutrale Layoutbedienung.
- Fuer den vorhandenen Restarbeiten-Pilot wird der sichtbare Scope `restarbeiten.screen` auf den bestehenden Layout-/HostAdapter-Scope `restarbeiten.ui.main` abgebildet.
- Sichtbar sind ausgewaehltes Element, Layout-Scope, neutrale Operation, Anwenden/Speichern, Laden, Reset und Erfolg-/Blockiert-Meldungen.
- Die Bedienung nutzt die vorhandenen M30-Inspector-Controls und den M29-HostAdapter-/LayoutPersistence-Pfad.
- Nicht registrierte Layoutziele und ungueltige Aktionen bleiben sichtbar blockiert.
- Es wurde keine automatische DOM-Erkennung, keine automatische Registry-Befuellung, keine Fachwertbearbeitung und keine Datenbankmigration eingefuehrt.
- PDF, Druck, Mail, Diktat/Audio, Protokoll-Fachlogik und Restarbeiten-Fachlogik bleiben ausserhalb dieses Pakets.
- Neue Doku: `docs/M31_UI_EDITOR_SICHTBARE_BEDIENUNG_IN_APP.md`.

### M32 Globaler UI-Editor App-Smoke-Test und Abnahmeprotokoll (neu)
- Der globale UI-Editor wurde als reines Pruef- und Dokumentationspaket im App-Kontext abgenommen.
- `npm start` startete die App sichtbar; das Fenster `BBM` war vorhanden und antwortend.
- Der UI-Editor-Launcher war im DEV-Kontext sichtbar.
- Die Bedienfolge fuer registrierte Auswahl, Layout-Scope, Anwenden/Speichern, Laden, Reset und sichtbare Blockaden ist technisch durch `npm test` abgedeckt.
- `git diff --check` und `npm test` liefen gruen.
- Es wurde keine Codekorrektur vorgenommen.
- PDF, Druck, Mail, Diktat/Audio, Protokoll-Fachlogik, Restarbeiten-Fachlogik, Datenbankmigration und neue Editor-Grundsatzentscheidungen blieben ausserhalb dieses Pakets.
- Neue Doku: `docs/M32_UI_EDITOR_APP_SMOKE_TEST.md`.

### M33 Globaler UI-Editor Protokoll-/TOPS-Scope-Anbindung (neu)
- Der globale UI-Editor ist zusaetzlich fuer den vorhandenen Scope `protokoll.topsScreen` bedienbar.
- Die sichtbare Auswahl nutzt weiterhin nur registrierte TOPS-/Protokoll-Elemente; es wurde keine DOM-Erkennung und keine automatische Registry-Befuellung eingefuehrt.
- Der neutrale EditorRuntime-/Layout-Scope fuer TOPS ist `protokoll.topsScreen`.
- Registrierte TOPS-Quicklane-Elemente koennen neutral angewendet/gespeichert, geladen und zurueckgesetzt werden.
- Unbekannte Elemente sowie Fach-, DOM- und Datenbankpayloads werden blockiert.
- Der Restarbeiten-Pilot bleibt ueber `restarbeiten.screen` -> `restarbeiten.ui.main` unveraendert bedienbar.
- PDF, Druck, Mail, Diktat/Audio, Protokoll-Fachlogik, Restarbeiten-Fachlogik, Datenbankmigration und neue Editor-Grundsatzentscheidungen blieben ausserhalb dieses Pakets.
- Neue Doku: `docs/M33_UI_EDITOR_PROTOKOLL_SCOPE_ANBINDUNG.md`.

### M34 UI-Editor Scope-Wechsel und Bedienfuehrung abgesichert (neu)
- Die sichtbare Bedienung nennt den aktiven UI-Scope eindeutig als `Aktiver UI-Scope`.
- Beim Wechsel zwischen `protokoll.topsScreen` und `restarbeiten.screen` wird die bisherige Auswahl geloescht und kann nicht im falschen Scope weiterwirken.
- Speichern/Laden/Reset nutzen weiterhin den aktuell sichtbaren/aktiven Layout-Scope: `protokoll.topsScreen` bzw. `restarbeiten.ui.main`.
- Unbekannte oder nicht verfuegbare Scopes werden sichtbar blockiert und erhalten keine Layoutaktion.
- Bestehende Restarbeiten- und Protokoll/TOPS-Scope-Tests bleiben gruen; neue Runtime-Tests sichern den Scope-Wechsel ab.
- PDF, Druck, Mail, Diktat/Audio, Protokoll-Fachlogik, Restarbeiten-Fachlogik, Datenbankmigration, automatische DOM-Erkennung und neue Editor-Grundsatzentscheidungen blieben ausserhalb dieses Pakets.
- Neue Doku: `docs/M34_UI_EDITOR_SCOPE_WECHSEL_BEDIENFUEHRUNG.md`.

### M35 UI-Editor Bedienhinweise und Abnahmegrenzen festgezogen (neu)
- Die globale UI-Editor-Bedienung zeigt klarer, dass nur neutrale Layoutaenderungen bearbeitet werden und keine Fachwerte.
- PDF, Druck, Mail, Audio und DB-Fachlogik werden sichtbar als nicht Teil dieses Editors benannt.
- Das Layoutpanel zeigt aktiven Layout-Scope, ausgewaehltes Element, erlaubte neutrale Layoutoperationen und aktuelle Block-/Statusmeldungen.
- Kein ausgewaehltes Element, unbekannte Elemente, falscher Scope und unbekannter Scope werden sichtbar blockiert.
- Restarbeiten- und Protokoll/TOPS-Bedienung bleiben auf den bestehenden Scopes; keine weitere Modul-Anbindung wurde eingefuehrt.
- PDF, Druck, Mail, Diktat/Audio, Protokoll-Fachlogik, Restarbeiten-Fachlogik, Datenbankmigration, automatische DOM-Erkennung und neue Editor-Architekturentscheidungen blieben ausserhalb dieses Pakets.
- Neue Doku: `docs/M35_UI_EDITOR_BEDIENHINWEISE_ABNAHMEGRENZEN.md`.

### M36 UI-Editor Fixstand nach M29 bis M35 dokumentiert (neu)
- Der globale UI-Editor-Fixstand ist als Abnahmestand dokumentiert.
- Fixiert sind Speichern/Laden/Reset neutraler Layoutaenderungen, sichtbare App-Bedienung, Restarbeiten-Scope, Protokoll/TOPS-Scope, Scope-Wechsel und Bediengrenzen.
- Angebundene Scopes bleiben `restarbeiten.screen` -> `restarbeiten.ui.main` und `protokoll.topsScreen` -> `protokoll.topsScreen`.
- Weitere Themen wie zusaetzliche Scopes, neue bewusst registrierte Elemente, Usability-Ausbau oder fachliche Klick-Abnahme muessen nach diesem Fixstand separat beauftragt werden.
- PDF, Druck, Mail, Diktat/Audio, Fachlogik, Datenbankmigration, automatische DOM-Erkennung, neue Modul-Anbindung und neue Editor-Architektur blieben ausserhalb dieses Pakets.
- Neue Doku: `docs/M36_UI_EDITOR_FIXSTAND_ABNAHME.md`.

### Rechnungen - Designreferenz und echter Arbeitsscreen (Uebergangsstand)

- Der eigenstaendige Renderer-Modulordner `src/renderer/modules/rechnungen` enthaelt weiterhin die historische statische `RechnungenDesignScreen`-Referenz und daneben den echten `RechnungScreen` fuer Rechnungsgrunddaten und Belegkopf.
- Der DEV-Einstieg ueber `Einstellungen -> Entwicklung` oeffnet den echten Arbeitsscreen; eine produktive Modulnavigation oder Lizenzfreigabe wurde dadurch nicht eingefuehrt.
- Der echte Screen ist als `rechnung.screen` mit 131 expliziten, komponentennahen Einzelzielen einschliesslich Positionsarbeit in der UI-Editor-Registry registriert. Fachaktionen bleiben gesperrt; die vollstaendige Entscheidung steht in `docs/RECHNUNG_UI_PDF_ENTWURFSENTSCHEIDUNG.md`.
- Die Rechnungsuebersicht ist eine Karten-/Listengruppe und keine Inhaltstabelle. Es gibt weiterhin keinen Tabellenlayout-Registry-Eintrag fuer Rechnung.
- Positions- und Summen-UI sind Bestandteil des registrierten Screens; PDF-Fachausgabe, ZUGFeRD/E-Rechnung und GAEB bleiben davon getrennte Pakete.
- Komponentenvertrag, Mounted-Refs, nativer Typvertrag und Registry-Fingerprint muessen gemeinsam gruen sein, bevor `rechnung.screen` als `complete` gilt.

### Rechnungen - produktive PDF-V2-Shell-Anbindung (2026-08-24)

- Der bestehende produktive Datenweg `RechnungScreen -> InvoiceService/InvoiceRepository -> printData -> mode invoice -> PrintShell` bleibt fuehrend; es gibt keinen zweiten Renderer und keinen zweiten `printToPDF`-Pfad.
- Die gemeinsame V2-Shell besitzt weiterhin GlobalHeader, FullHeader-/Body-/MiniHeader-Slots, Paginierung, Satzspiegel und Footerreserve. Rechnungsfachinhalt liegt unter `src/renderer/modules/rechnungen/print/InvoicePrintContent.js`.
- Finale Rechnungen und DRAFT-Proberechnungen verwenden denselben V2-Renderer. Die Proberechnung wird ausschliesslich durch `data.invoice.preview === true` erkannt und erhaelt den roten Vorabzug-Marker.
- Der PDF-Editor-Scope `pdf.bbm.invoice` fuehrt FullHeader, Body und MiniHeader als explizite Parent-Struktur; Fachaktionen, Nummernvergabe, Previewstatus, IPC und Datenbankzugriffe bleiben gesperrt.
- Zwei Invoice-Golden-Fixtures ergaenzen den bestehenden Satzvertrag. Die vorhandenen Protokoll-Goldens wurden nicht neu geschrieben und bleiben unveraendert.

### Rechnungen - UI-Editor-Scope 131 konsistent synchronisiert (2026-08-24)

- Komponentenvertrag, M80-Registry und realer RechnungScreen-Mount enthalten exakt 131 eindeutige Ziele ohne fehlende oder verwaiste IDs.
- `ui-editor-target.json` folgt mit `elementCount: 131`, Registry-Version 26 und dem aus der produktiven Registry berechneten Fingerprint.
- Ein Scope-fuer-Scope-Guard vergleicht die Target-Zahlen mit den echten Registry-Elementen und weist den simulierten Altstand 117/131 als `target_manifest_element_count_mismatch` ab.
- Der native Editorvertrag erhaelt nur ganzzahlige `order`-Metadaten. Der reale isolierte Electron-Acceptance-Lauf oeffnet den UI-Editor aus dem RechnungScreen erfolgreich; Scope-Schutz, PDF, Fachlogik, Layout und Navigation bleiben unveraendert.

### Zentraler Popup-/Formularstandard (viertes Migrationspaket umgesetzt, Freigabe offen)

- Die freigegebenen Rechnungen-Werte sind zentral unter `src/renderer/ui/styles/popupFormStandard.css` definiert und in `docs/BBM_POPUP_FORMULARSTANDARD.md` dokumentiert.
- Die Aktivierung bleibt opt-in über `.bbm-popup-standard`; bestehende Altbereiche werden nicht automatisch verändert.
- Rechnungen nutzt die zentrale Quelle bei optisch unverändertem Modul- und Dialoglayout.
- Produktpiloten sind `Projekt bearbeiten`, Einstellungen `Profil / Adresse` und Einstellungen `Protokoll`.
- Das zweite, begrenzte Paket ergänzt Einstellungen `Ausgabe & Druck`, Einstellungen `Drucklogos verwalten`, Projektverwaltung `Projekt-Einstellungen` und ausschließlich den Hauptdialog `Protokoll drucken`; die zentralen Tokenwerte bleiben unverändert.
- Das dritte Paket ergänzt `Protokoll anlegen`, die produktiven globalen und projektbezogenen Firmen-/Mitarbeiterformulare, das separate Firmen-Editorfenster sowie Teilnehmerauswahl und Teilnehmerverwaltung; die zentralen Tokenwerte bleiben unverändert.
- Das vierte Paket ergänzt `Projekt Import / Export`, die produktiven Firmen-/Personen-CSV-Staging- und Detaildialoge, `Text korrigieren` sowie `Protokoll versenden` im Abschluss-Flow. Die zentrale Popup-Fläche berücksichtigt dabei auch die reale Mainheader-Unterkante; Tokenwerte und Fachabläufe bleiben unverändert.
- `TOP-Regeln`, die ungemountete MainHeader-Mailvariante und die nicht angebundene Quicklane-Mailvariante sind nach Aufrufinventur als nicht produktiv dokumentiert und wurden nicht wiederbelebt. Nächster Schritt ist ausschließlich die visuelle Freigabe dieses Pakets; keine automatische Massenmigration.

### M37 UI-Editor Klick-Abnahme dokumentiert (neu)
- Die manuelle Klick-Abnahme des UI-Editor-Fixstands ist als Pruefliste dokumentiert.
- Die Abnahme umfasst App-Start, sichtbaren UI-Editor, Restarbeiten- und Protokoll/TOPS-Scope, aktive Scope-Anzeige, Elementauswahl, Scope-Wechsel, Speichern/Laden/Reset und Blockademeldungen.
- Fachwerte, PDF, Druck, Mail, Audio und DB-Fachlogik bleiben ausdruecklich ausserhalb der Abnahme.
- M37 ist ein reines Doku-/Abnahmepaket ohne Code-, UI-, Fachlogik-, Modul- oder Architekturaenderung.
- `git diff --check`, `node scripts/ui-editor-contract-check.cjs --self-test`, `npm test` und `npm start` liefen gruen; das App-Fenster `BBM` war sichtbar und antwortend.
- Neue Doku: `docs/M37_UI_EDITOR_KLICK_ABNAHME.md`.

### Zentraler Popup-/Formularstandard (fünftes Migrationspaket umgesetzt, Freigabe offen)

- Das fünfte kontrollierte Paket ergänzt Hilfe/Info, Folgetermin,
  ToDo-Verantwortlichenfilter, die gemeinsame geschlossene Protokollauswahl und die
  gemeinsame PDF-Vorschauhülle. Die zentralen Tokenwerte bleiben unverändert.
- Vorschauinhalt, PDF-Renderer, Filter-/Terminlogik, Listenzeilen und Datenbindung
  wurden nicht verändert.
- Nicht aufgerufene Diktat-/Wörterbuch-, TOP-Regeln-, Vorbemerkungs- und
  MainHeader-Auswahlvarianten wurden nur inventarisiert und nicht reaktiviert; der
  separate aktive MainHeader-Maildialog blieb außerhalb dieser Welle.
- Nächster Schritt ist ausschließlich die visuelle Freigabe; keine automatische
  Löschung und keine sechste Migrationswelle.

### Mini-Paket dynamische Textgrenzen (abgeschlossen)

- Ein kleiner gemeinsamer Settings-Service in Container 3 stellt die vorhandenen Benutzerwerte `tops.titleMax` und `tops.longMax` fuer Protokoll und Restarbeiten bereit.
- Die Fachmodule in Container 4 und 5 verwenden diese Werte fuer Eingabelimit und Restzeichenanzeige; parallele Settings, neue Events, Datenbankaenderungen und Layoutumbauten wurden nicht eingefuehrt.
- Der bestehende Settings-Change-Kanal aktualisiert geoeffnete Editboxen. Ueberlanger gespeicherter Bestand bleibt vollstaendig erhalten.
- Der Nachweis in Container 6 umfasst gezielte Modul-/Diktat-/Restzeichen-Tests, den UI-Editor-Vertragscheck und einen isolierten praktischen Electron-Lauf beider Module.
- Das Paket aendert keine aktive Modularisierungsachse und zieht keinen weiteren Folgeschritt vor.

### Rechnung - vollständige Button-Entgrenzung (abgeschlossen, 25.08.2026)

- Korrigierter Abschluss nach widerlegter Nutzerabnahme zu `6a9dfd0f`: Der alte Harness ließ globale CoreShell-/Popup-Styles aus und übersah dadurch eine produktiv wirksame `30px !important`-Mindesthöhe. Diese Differenz ist beseitigt und im Testaufbau abgesichert.
- Im aktuellen Rechnungsscope mit 131 Zielen sind exakt 16 registrierte Buttons effektiv in Breite und Höhe entgrenzt. Globale Mindesthöhen nehmen `.invoice-button` aus; Grid- und Flex-Refs geben einer expliziten Editorbreite/-höhe Vorrang. Standardtracks und Standardhöhe bleiben ohne Editoroperation optisch unverändert.
- Der reale Chromium-Guard prüft alle 16 Buttons bei `6 x 6 px` und deutlich größeren Sollwerten gegen die BoundingBox sowie einen Nicht-Button als Vertragsreferenz. Die Produktabnahme prüft sieben Buttonklassen im normalen Router/RechnungScreen mit sichtbarem Save, Rechnung-Reopen und vollständig neuem Electron-Prozess.
- Fachfunktion, PDF/Druck, Navigation, Handler, Registry-IDs und Parentstruktur blieben unverändert. Kein Commit, kein Push; für dieses Paket ist kein weiterer Implementierungsschritt offen.
