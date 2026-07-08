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
- M21-Einordnung: `Protokoll` ist noch nicht fertig bereinigt und wird fuer UI-Editor-Themen defensiv/read-only behandelt.
- M21-Einordnung: BBM-Produktiv ist Beispiel-/Pilot-Zielapp fuer das generische UI-Editor-kit; die Ziel-App liefert die ElementRegistry, der Editor liest ausschliesslich diese Registry.
- Keine Selbstuntersuchung der Ziel-App-Oberflaeche, keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung.

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

**Noch offen**
- kein vollstaendig produktiver freigabebasierter Betrieb
- Aktivierung / Nicht-Aktivierung freigegebener bzw. nicht freigegebener Module ist noch nicht vollstaendig durchgezogen
- weitere kleine Kernstellen fuer den aktiven Modulumfang sind noch moeglich

### 6.2 Container 4 – Fachmodul `Protokoll`
**Status:** weit vorbereitet, Uebergangscontainer aktiv

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

**Noch offen**
- grosser Unterbau liegt weiter unter `src/renderer/tops/`
- tieferer Unterbau und weitere Restentmischung in `Protokoll` bleiben offen
- weitere direkte `tops/`-Altpfade sind fuer spaetere Minischritte noch vorhanden

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
