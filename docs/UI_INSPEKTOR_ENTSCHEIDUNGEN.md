# UI-Inspektor Entscheidungslog

## Entscheidung 001
**Beschluss:** Der UI-Inspektor wird neu und exportierbar entwickelt.

**BegrÃ¼ndung:** Nur ein sauberer Neustart als Modul sichert Wiederverwendbarkeit und verhindert BBM-spezifische Verkopplung.

## Entscheidung 002
**Beschluss:** Der vorhandene Tabellen-Kalibrator wird nicht zur Hauptbedienung des UI-Inspektors weiterentwickelt.

**BegrÃ¼ndung:** Der Tabellen-Kalibrator verfolgt einen anderen Zweck und deckt nicht die geforderte, allgemeine UI-Bereichsbedienung ab.

## Entscheidung 003
**Beschluss:** Der Nutzer soll keine UI-Technik lernen mÃ¼ssen; technische Begriffe bleiben intern.

**BegrÃ¼ndung:** Zielgruppe sind fachliche Anwender ohne Programmierkenntnisse.

## Entscheidung 004
**Beschluss:** Jede App liefert spÃ¤ter eine Layout-Landkarte; der Core bleibt allgemein.

**BegrÃ¼ndung:** So bleibt das Modul exportierbar, wÃ¤hrend App-Spezifika sauber ausgelagert werden.

**M21-Klarstellung:** Fuer das generische UI-Editor-kit ist die von der Ziel-App gelieferte ElementRegistry verbindlich. Der Editor liest ausschliesslich diese Registry; nicht registrierte Elemente existieren fuer ihn nicht. BBM-Produktiv ist nur Beispiel-/Pilot-Zielapp.

## Entscheidung 005
**Beschluss:** Bestehende UIs werden nachtrÃ¤glich erkannt/markiert; neue UIs werden kÃ¼nftig von Anfang an mit Bereichs-Landkarte gebaut.

**BegrÃ¼ndung:** Das erlaubt BestandseinfÃ¼hrung und zukÃ¼nftige StabilitÃ¤t Ã¼ber einen gemeinsamen Arbeitsansatz.

**M21-Status:** Historisch. Keine automatische UI-Erkennung, kein UI-Scanning, kein DOM-Scan und keine automatische Registry-Befuellung als Zielrichtung. Bestehende bekannte Elemente duerfen nur bewusst, explizit und pruefbar in der ElementRegistry der Ziel-App beschrieben werden.

## Entscheidung 006
**Beschluss:** Der UI-Inspektor erhÃ¤lt einen verbindlichen Arbeitsvertrag.

**BegrÃ¼ndung:** Damit ChatGPT, Codex Cloud, Codex lokal und der Nutzer nach festen Regeln arbeiten und neue Chats nicht wieder bei null beginnen.

## Entscheidung 007
**Beschluss:** Das Projekt erhÃ¤lt mit `docs/UI_INSPEKTOR_START_HIER.md` einen festen Einstiegspunkt.

**BegrÃ¼ndung:** Neue Chats und Codex-LÃ¤ufe sollen nicht aus verstreuten Informationen den Projektstand zusammensuchen mÃ¼ssen.



## Entscheidung 008
**Beschluss:** Die Architektur wird als exportierbares Schichtenmodell festgelegt.

**BegrÃ¼ndung:** Core, Overlay, Panel, Registry, Store, Adapter und Layout-Landkarte mÃ¼ssen getrennt bleiben, damit der UI-Inspektor nicht BBM-spezifisch wird und spÃ¤ter in andere Apps exportiert werden kann.


## Entscheidung 009
**Beschluss:** Der UI-Inspektor wird schrittweise ab M6 Ã¼ber ein ModulgerÃ¼st, Landkartenformat, Pilot-Landkarte, Markierungen, Overlay, Auswahl, Panel, temporÃ¤re Anwendung und Speicherung aufgebaut.

**BegrÃ¼ndung:** Der Inspektor darf nicht als GroÃŸpaket entstehen. Die schrittweise Umsetzung verhindert Nebenwirkungen und hÃ¤lt das Modul exportierbar.


## Entscheidung 010
**Beschluss:** M11 nutzt eine Trefferliste am Klickpunkt statt klickbarer Rahmen/Handles.

**BegrÃ¼ndung:** Bei verschachtelten UI-Bereichen ist Handle-/Rahmenklick fÃ¼r Laien nicht zuverlÃ¤ssig und unÃ¼bersichtlich.

**Auswirkung:** Die Trefferliste trennt Auswahl von Rahmenanzeige und bleibt in komplexen UIs bedienbar.


## Entscheidung 011
**Beschluss:** Das M12-Panel bleibt rein lesend und zeigt nur erlaubte Stellschrauben.

**BegrÃ¼ndung:** Anwendung und Speicherung werden bewusst getrennt in M13/M14 umgesetzt.

## Entscheidung 012
**Beschluss:** Die temporÃ¤re Vorschau in M13.2 wirkt nur auf dem ausgewÃ¤hlten DOM-Element und wird beim Deaktivieren vollstÃ¤ndig zurÃ¼ckgesetzt.

**BegrÃ¼ndung:** Der Inspector darf nur die aktuelle Vorschau beeinflussen, ohne Persistenz, ohne Seiteneffekte auf unselektierte Nachbar-Elemente und ohne dauerhafte LayoutÃ¤nderung.

## Entscheidung 013
**Beschluss:** M13.2.1 trennt die temporÃ¤ren Stellschrauben nach Richtung und Seiten und nutzt fÃ¼r PositionsÃ¤nderungen `transform: translate(...)`.

**BegrÃ¼ndung:** Gruppenrahmen und einzelne Felder mÃ¼ssen separat bedienbar bleiben, wÃ¤hrend die Vorschau weiterhin nur temporÃ¤r im laufenden DOM arbeitet.

## Entscheidung 014
**Beschluss:** M13.3 ergÃ¤nzt nur die Rahmen-zuerst-Bedienung und leitet die Auswahl fÃ¼r Elternbereich, Kindbereiche und Nachbarfelder aus den vorhandenen DOM-Markern ab.

**BegrÃ¼ndung:** Die Bedienung soll schnell zwischen AuÃŸenrahmen und enthaltenen Feldern wechseln kÃ¶nnen, ohne neue Persistenz- oder Layoutlogik einzufÃ¼hren.
## Entscheidung 015
**Beschluss:** M13.4a bringt im DEV-Header nur einen lesenden UI-Editor-Scan-Button mit Statusanzeige.

**BegrÃƒÂ¼ndung:** Der erste Schritt soll nur den aktuellen Screen scannen und den Zustand sichtbar machen, ohne Auswahl, Bearbeitung, Speicherung oder Overlay-Logik zu erweitern.

**M21-Status:** Historisch. Scan-Begriffe beschreiben hier nur den alten Stand. Fuer neue Arbeiten gilt: keine Selbstuntersuchung der Ziel-App-Oberflaeche und keine automatische UI-Erkennung.

## Entscheidung 016
**Beschluss:** Der UI-Editor-Scan bewertet nur Pflichtmarker als entscheidend, behandelt `restarbeiten.header` als optional und fasst Marker mit `::`-Suffixen als eine fachliche Basis-ID zusammen.

**Begründung:** Damit der Status ehrlich bleibt, Mehrfachmarker nicht als fehlend zählen und ein nicht im Live-DOM verankerter Header nicht künstlich als Pflichtbedingung in den Scan eingeht.

**M21-Status:** Historisch. Eine Registry darf nicht automatisch aus DOM-Markern befuellt werden; verbindlich ist nur die explizit gelieferte ElementRegistry der Ziel-App.
## Entscheidung 017
**Beschluss:** M13.4b.1 verdrahtet im sichtbaren Scanpanel nur die Auswahlmodus-Schalter Rahmen/Feld/Einzelelement.

**Begründung:** Der Nutzer soll den Modus im echten Panel sehen und umschalten können, ohne dass Hover-, Klick- oder Bearbeitungslogik bereits ins UI kommt.

## Entscheidung 019
**Beschluss:** Das UI-Editor-Panel wird außerhalb des Header-Layouts als schwebende Oberfläche gemountet und bleibt per Drag-Handle verschiebbar.

**Begründung:** So bleibt die Headerhöhe stabil, der Arbeitsbereich springt nicht, und die Bedienoberfläche bleibt ohne Persistenz flexibel positionierbar.

## Entscheidung 020
**Beschluss:** Der alte M13-Hover- und Restarbeiten-Inspector-Pfad ist fachlich beendet; UI-V2 und Editor-V2 werden als Neustart neu geplant.

**Begründung:** Der bisherige Pfad wird nicht weiter repariert. Ein klarer Neustart trennt die neue Architektur sauber von alten Sonderwegen und fuehrt zuerst ueber EditorLab.

## Entscheidung 022
**Beschluss:** Die vorhandene Meta-Slot-Node des `EditboxShell` ist im Protokoll der ausschliessliche Mountpunkt fuer die bestehende Meta-Spalte. Das vorhandene Editbox-Layout ordnet Kurztext oberhalb von Langtext links und Meta rechts an.

**Begruendung:** Diese explizite Komponentenentscheidung erfuellt den Layoutvertrag ohne neue DOM-Knoten, Wrapper, Parents, Scrollcontainer oder eine zentrale zweite Registry. Kurztext, Langtext und Meta bleiben einzeln mit ihren komponentennahen Vertrags-IDs bearbeitbar; Fachaktionen bleiben gesperrt.

## Entscheidung 023
**Beschluss:** Die vorhandene rechte Meta-Spalte der Protokoll-Liste bleibt Eigentum der fachlichen Zeilen-CSS. Der Editor referenziert fuer Fertig bis, Status und Verantwortlich ausschliesslich die bereits sichtbaren Textkinder; er darf daraus weder eine eigene Anordnung noch einen Ersatz-Container ableiten.

**Begruendung:** Damit bleiben Auswahlrahmen, Apply und Rerender auf das tatsaechliche sichtbare Ziel begrenzt. Grid, Flex, Reihenfolge, Parent und Scrollbesitz bleiben ausserhalb der erlaubten Editoroperationen. Fehlende positive Zielgeometrie blockiert den Apply-Weg.

## Entscheidung 024
**Beschluss:** Die Protokoll-TOP-Zeile besitzt im produktiven Zielcode genau drei logische Hauptspalten: Struktur links, Gegenstand mit Kurztext ueber Langtext in der Mitte und Meta rechts. Der komponentennahe Editorvertrag bildet Zeile, Spalten und sichtbare Kinder mit expliziten direkten Multi-Refs ab; gemeinsame Spaltenbreiten duerfen nur die vorhandenen Protokoll-CSS-Variablen veraendern.

**Begruendung:** Das uebernimmt das bewaehrte technische Prinzip der Restarbeiten-Liste, ohne deren Fachmodell oder konkrete Layoutwerte zu kopieren. Der UI-Editor bleibt Abbild und begrenztes Werkzeug fuer vorhandene Ziele; er darf keine Wrapper, Parents, DOM-Reihenfolge, Grid-/Flextopologie, responsive Stapelung oder Ersatzgeometrie erzeugen. Fehlender Ref oder fehlende positive Geometrie fuehrt zum Abbruch der Operation.

## Entscheidung 025
**Beschluss:** Direktauswahl und Auswahlrahmen duerfen fuer bedingte Multi-Refs nur tatsaechlich sichtbare, positive und innerhalb ihrer Clipping-Vorfahren liegende Zielgeometrie verwenden. Ein gespeichertes Startprofil darf einen expliziten Layoutwert fuer ein aktuell ausgeblendetes bedingtes Multi-Ref logisch vormerken; die Anwendung erfolgt beim naechsten sichtbaren komponentennahen Rerender auf die echten Zielknoten. Die Vertrags-Baseline muss dem realen CSS-DIP-Ausgangswert entsprechen.

**Begruendung:** Damit entstehen weder falsche Root-/Containerrahmen noch unvollstaendige Save-/Restore-Vertraege. Ausgeblendete Elemente bleiben interaktiv unselektierbar, waehrend ein zuvor sichtbar bearbeiteter und gespeicherter Wert den automatischen Neustart sicher ueberlebt. Angezeigter Istwert, Plus/Minus, Readback und Baseline bleiben dieselbe Wahrheit.

## Entscheidung 026
**Beschluss:** Die produktive Protokoll-TOP-Liste besitzt dauerhaft eine eigene Tabellen-/Zeilenstruktur mit sichtbarem Tabellenkopf, gemeinsamem Zeilenbereich und drei nebeneinanderliegenden Hauptspalten fuer `Nr. / Datum / Klasse`, `Gegenstand` und `Fertig bis / Status / Verantwortlich`. Diese Struktur ist Produktcode und darf nicht als vom UI-Editor erzeugter Wrapper oder als nur im Entwicklungsmodus vorhandene Hilfsstruktur entfernt werden. Restarbeiten bleibt die sichtbare und technische Referenz, ohne dass dessen Fachmodell, IDs oder konkrete Werte uebernommen werden.

**Begruendung:** Nur die produktive Struktur garantiert fuer Header und Zeilen gemeinsame Breitenquellen, stabile Parents und die verbindliche Anordnung links/mittig/rechts. Der UI-Editor darf diese vorhandenen Ziele feinjustieren, aber weder Spaltenzahl, Parent-/Child-Struktur, Reihenfolge, `display`, Grid-/Flex-Topologie noch Scrollverantwortung veraendern. Ein Rueckfall in normalen Blockfluss ist ein Produktfehler und wird durch den M86.11b-Geometrieguardrail blockiert.

## Entscheidung 027
**Beschluss:** Persistierte Protokoll-Spaltenwerte werden im normalen Source-Runtimepfad ausschliesslich als validierte vollstaendige CSS-Tracks angewandt. Positive numerische Breiten werden zu `px`; ungueltige, leere oder gefaehrliche Alttracks fallen auf die komponentennahen Defaults zurueck. Ein persistierter kompletter Grid-Descriptor ist keine zweite Wahrheitsquelle. Ein bereits vollstaendiger Text-Track wie `minmax(0, 1fr)` wird direkt in die gemeinsame Header-/Zeilen-Trackliste eingesetzt und nicht erneut mit `minmax()` umschlossen.

**Begruendung:** Eine doppelte `minmax()`-Verschachtelung machte trotz korrekter DOM-Struktur, Klassen und Vererbung die gesamte produktive `grid-template-columns`-Deklaration ungueltig. Chromium erzeugte daraufhin nur einen impliziten Track und stellte die drei Bereiche untereinander. Der M86.12-Guardrail laesst die produktive CSS-Regel deshalb durch Chromium berechnen und prueft neben Vertragswerten auch drei reale X-Positionen, Nichtueberlagerung sowie die Behandlung gueltiger und ungueltiger gespeicherter Werte.

## Entscheidung 021
**Beschluss:** M80.2 entfernt die gekoppelte Restarbeiten-Splitoperation aus der produktiven Registry. Der tatsächliche Filter-Header und der stabile Editbox-Root sind unabhängig größenfähig; die Hauptliste füllt den verbleibenden Bereich flexibel und scrollt innerhalb ihres eigenen Containers.

**Begründung:** Eine freie Split- oder Positionssteuerung würde den sicheren Überlagerungsschutz schwächen. Direkte, begrenzte Größenoperationen an den beiden festen Bereichen bilden den Nutzerbedarf mit dem vorhandenen Editor-Core ab. Quicklane, Fachaktionen, Daten und PDF bleiben außerhalb dieses Layoutvertrags.

## Entscheidung 028
**Beschluss:** Der vorhandene `MainHeader` bleibt die alleinige gemeinsame Quelle fuer den sichtbaren Modulheader. Er ordnet BBM-Version und `Plan` in der ersten sowie Aktiv-Kontext und Entwicklungsmarker in der zweiten Headerzeile an. Der Entwicklungsmarker ist ein reguläres rechtes Grid-Element der zweiten Zeile, nicht absolut ausserhalb der Headerstruktur.

**Begruendung:** Protokoll, Restarbeiten und weitere produktive CoreShell-Ansichten erhalten damit denselben kompakten Header ohne Modulkopie oder modulspezifische Sonderposition. Bestehende Headerrefs und der UI-Editorvertrag bleiben unveraendert. Die fuenf vorhandenen `__bbm`-Treffer in nicht geaenderten PDF-/Druckdateien bleiben dokumentierter Altbestand; der diff-bezogene KREBS-Check verhindert neue oder veraenderte Treffer und Event-Hacks.

## Entscheidung 029

**Beschluss:** Persistente BBM-UI-Editor-Profile werden projektuebergreifend nach der expliziten aktiven Modul-Scope-Gruppe getrennt. Die zentral abgeleitete Profilwurzel lautet `module-protokoll` beziehungsweise `module-restarbeiten`; Projekt-, Besprechungs-, Datensatz- und temporaere Kennungen duerfen nicht in den Schluessel eingehen. Registry-Version und Fingerprints bleiben Kompatibilitaetspruefungen und werden nicht abgeschaltet.

**Begruendung:** Der UI-Editor speichert jeweils nur die aktiven Scopes eines Moduls. Eine gemeinsame `standard`-Profildatei liess deshalb das zuletzt gespeicherte Modul das andere verdraengen. Getrennte Modulwurzeln erhalten beide Profile, waehrend dieselbe Modulwurzel fuer alle bestehenden und neuen Projekte gilt. Ein Restore-Promise je Modul verhindert sowohl Doppelanwendung im selben Modul als auch das Auslassen des jeweils anderen Moduls.

## Entscheidung 030

**Beschluss:** Jedes sichtbare registrierte BBM-Element erhaelt zentral die Layoutoperationen `move`, `resizeWidth`, `resizeHeight` und `setVisibility`; bei sichtbar klassifiziertem Text kommt `textResize` hinzu. Tabellenkopf- und Tabellendatenzellen duerfen ihre Breite ausschliesslich ueber die im gemeinsamen Core registrierte logische Spaltenquelle aendern.

**Begruendung:** Damit gilt derselbe Bedienvertrag fuer Ampeln, Symbole, Buttons, Felder, Labels, Headerteile, Tabellenzellen und Container, ohne BBM-spezifische Core-Ausnahme. Die bestehende Tabellenstruktur, Parentbindung, Multi-Ref-Semantik, Registry-Vollstaendigkeit und Fingerprintpruefung bleiben unveraendert geschuetzt.

## Entscheidung 031

**Beschluss:** Eine PDF-`TableColumn` ist im Editor das uebergeordnete geometrische Ziel fuer Track, Ueberschrift und alle Datenzellen. Ihre registrierte Ueberschrift ist ein Kindziel und veraendert ueber Textoperationen ausschliesslich den Inhalt innerhalb der unveraenderten Spaltengeometrie.

**Begruendung:** Der normale Spaltenklick muss Position, Breite und Sichtbarkeit der vollstaendigen sichtbaren Spalte steuern. Die explizite Parent-/Kind-Struktur erhaelt zugleich die bewusst tiefere Feinjustierung der Ueberschrift, ohne eine neue Tabellenarchitektur oder automatische Bestandserkennung einzufuehren.

## Entscheidung 032

**Beschluss:** Die tatsaechlich gesetzten vier PDF-Seitenraender definieren die harte Nutzflaeche fuer alle normalen PDF-Layoutziele. Eine Verletzung wird vor der Zustandsuebernahme horizontal oder vertikal atomar abgewiesen. Tabellen verwenden innerhalb dieser Flaeche explizite Spaltentracks: Eine innere Grenze veraendert direkte Nachbarn gegenlaeufig bei fester Gesamtsumme; eine Aussenbreitenaenderung veraendert Tabelle und aeussersten Track gemeinsam.

**Begruendung:** Papiergrenze und Inhaltsgrenze sind unterschiedliche Vertraege. Erst die Ableitung aus dem vorhandenen `page-template` verhindert Randueberlauf auch nach einer Randanpassung. Die generische Tabellenregel haelt Kopf, Datenzellen und Hintergruende lueckenlos, ohne eine Tabellen- oder Druckarchitektur neben dem bestehenden Renderer einzufuehren.
