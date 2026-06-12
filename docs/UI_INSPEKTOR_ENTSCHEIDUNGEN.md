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

## Entscheidung 005
**Beschluss:** Bestehende UIs werden nachtrÃ¤glich erkannt/markiert; neue UIs werden kÃ¼nftig von Anfang an mit Bereichs-Landkarte gebaut.

**BegrÃ¼ndung:** Das erlaubt BestandseinfÃ¼hrung und zukÃ¼nftige StabilitÃ¤t Ã¼ber einen gemeinsamen Arbeitsansatz.

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

## Entscheidung 016
**Beschluss:** Der UI-Editor-Scan bewertet nur Pflichtmarker als entscheidend, behandelt `restarbeiten.header` als optional und fasst Marker mit `::`-Suffixen als eine fachliche Basis-ID zusammen.

**Begründung:** Damit der Status ehrlich bleibt, Mehrfachmarker nicht als fehlend zählen und ein nicht im Live-DOM verankerter Header nicht künstlich als Pflichtbedingung in den Scan eingeht.
## Entscheidung 017
**Beschluss:** M13.4b.1 verdrahtet im sichtbaren Scanpanel nur die Auswahlmodus-Schalter Rahmen/Feld/Einzelelement.

**Begründung:** Der Nutzer soll den Modus im echten Panel sehen und umschalten können, ohne dass Hover-, Klick- oder Bearbeitungslogik bereits ins UI kommt.

## Entscheidung 019
**Beschluss:** Das UI-Editor-Panel wird außerhalb des Header-Layouts als schwebende Oberfläche gemountet und bleibt per Drag-Handle verschiebbar.

**Begründung:** So bleibt die Headerhöhe stabil, der Arbeitsbereich springt nicht, und die Bedienoberfläche bleibt ohne Persistenz flexibel positionierbar.

## Entscheidung 020
**Beschluss:** Der alte M13-Hover- und Restarbeiten-Inspector-Pfad ist fachlich beendet; UI-V2 und Editor-V2 werden als Neustart neu geplant.

**Begründung:** Der bisherige Pfad wird nicht weiter repariert. Ein klarer Neustart trennt die neue Architektur sauber von alten Sonderwegen und fuehrt zuerst ueber EditorLab.

## Entscheidung 021
**Beschluss:** BBM liefert dem UI-Editor eine explizite HostAdapter-Schnittstelle mit HostContext, Registry, Layout-State, Capabilities und In-Memory-ChangeRequest-Rueckmeldung; Persistenz bleibt deaktiviert.

**Begruendung:** Der UI-Editor soll spaeter ins UI-Editor-kit rueckfuehrbar bleiben. BBM bleibt Host- und Referenz-App, waehrend generische Runtime-Logik nicht dauerhaft an CoreShell, Restarbeiten-IDs oder BBM-Fachpfade gekoppelt wird.

## Entscheidung 022
**Beschluss:** Die generische Preview-Runtime erhaelt mit `src/renderer/editorRuntime/preview/index.js` einen neutralen Sammel-Export.

**Begruendung:** Ein stabiler Export-Einstieg macht die spaetere Rueckfuehrung ins UI-Editor-kit pruefbar, ohne Code bereits ins externe Kit zu uebertragen oder BBM-spezifische Orchestrierung mitzunehmen.

**Status:** Historisch. Die lokale BBM-Preview-Runtime wurde nach der Kit-Uebernahme entfernt; produktive Quelle ist jetzt das UI-Editor-kit ueber `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js`.

## Entscheidung 023
**Beschluss:** Persistente Hidden-Element-Visibility-Overrides gehoeren spaeter in einen eigenen BBM-seitigen UI-Editor-Layout-Override-Speicher hinter dem HostAdapter.

**Begruendung:** Registry, DOM, localStorage und TableLayout-Speicher duerfen nicht fuer Hidden-Element-Nutzerzustand zweckentfremdet werden. Der HostAdapter bleibt die Grenze zwischen generischer Runtime und BBM-Speicherung, waehrend das UI-Editor-kit weiterhin nichts selbst speichert.

**Auswirkung:** Erste spaetere Freigabe darf nur fuer einen klaren Pilot-Scope wie `restarbeiten.ui.main` erfolgen. `canPersistVisibility` bleibt bis dahin `false`, `persistent: true` bleibt blockiert, und App-Start-Wiederherstellung ist ein eigenes Folgepaket.

**Status nach G31:** Der Pilot-Scope `restarbeiten.ui.main` ist als einzige Ausnahme freigegeben. `canPersistVisibility` ist nur dort aktiv; weitere Scopes und App-Start-Wiederherstellung bleiben separate Folgepakete.

**Status nach G32:** Der Restore-Leseweg fuer `restarbeiten.ui.main` ist testseitig abgesichert. Gespeicherte Visibility-Overrides werden ueber den Restarbeiten-HostAdapter geladen und ueber `getCurrentLayoutState(...)` an die Hidden-Elements-Logik geliefert; weitere Scopes bleiben gesperrt.

**Status nach G33:** Der bestehende kompakte Hidden-Elements-Popover darf gespeicherte Pilot-Overrides fuer `restarbeiten.ui.main` wieder auf sichtbar setzen. Dies geschieht nur ueber validierte `persistent: true` Visibility-ChangeRequests mit `payload.visible === true`; weitere Scopes und andere Operationen bleiben gesperrt.
