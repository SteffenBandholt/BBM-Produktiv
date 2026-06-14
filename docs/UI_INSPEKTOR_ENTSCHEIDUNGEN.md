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

**Status nach G34:** Weitere Hidden-Elements-Visibility-Persistenz-Scopes duerfen nur per expliziter Allowlist/Policy freigegeben werden. Die Policy enthaelt aktuell ausschliesslich `restarbeiten.ui.main`; bekannte andere Scopes, unbekannte Scopes und Wildcards bleiben gesperrt.

**Status nach G35:** Der Hidden-Elements-Block ist als Referenzstand abgeschlossen. `docs/UI_EDITOR_HIDDEN_ELEMENTS_REFERENZSTAND.md` beschreibt den stabilen Ist-Stand von Button/Popover ueber Datenfluss, ChangeRequest- und Persistenzmodell bis zu Restore, Scope-Policy und Sicherheitsgrenzen. G35 aktiviert keine neue Produktivlogik und keinen weiteren Scope.

## Entscheidung 024
**Beschluss:** Das UI-Editor-kit soll kuenftig ueber ein neutrales Surface-Modell erweitert werden, damit UI-Screens, Module, Editor-Panels und spaeter PDF-/Plan-/Canvas-Ansichten ueber Adaptermodelle bedient werden koennen.

**Begruendung:** Panel-, Hidden-Elements- und Preview-Runtime sind bereits teilweise kitseitig vorhanden, waehrend BBM weiterhin konkrete Scopes, Registry, HostAdapter, Persistenz und Renderer-Anbindung besitzt. Ein SurfaceAdapter-Schnitt trennt generische Editor-Faehigkeiten von Host-Fachlogik und verhindert, dass PDF-, Plan- oder Canvas-Logik direkt in BBM-Launcher- oder Kit-Sonderpfade einwandert.

**Auswirkung:** UI-Editor-kit bleibt fachfrei und speicherfrei. BBM bleibt Host fuer Registry, Rechte, Persistenz, DB/IPC und konkrete Surface-Freigaben. G36 dokumentiert nur das Zielbild; SurfaceRuntime, DragRuntime, PDF-/Plan-Anbindung und weitere Freigaben bleiben eigene Folgepakete.

**Status nach G38:** Die SurfaceRuntime existiert im UI-Editor-kit und ist in BBM ueber eine renderer-kompatible Bridge testweise ladbar. BBM nutzt sie noch nicht produktiv; Launcher, UI, PDF, Canvas, Drag, Registry, Persistenz und Scope-Freigaben bleiben unveraendert.

**Status nach G39:** Ein erster read-only SurfaceAdapter fuer `restarbeiten.ui.main` erzeugt ein neutrales `ui-screen`-Surface-Modell aus HostAdapter-/Registry-Daten und LayoutState. Der Adapter validiert ueber die Kit-Bridge, wird aber nicht produktiv im Launcher genutzt und aktiviert keine Drag-, PDF-, Canvas- oder Persistenzfunktion.

**Status nach G41:** Die DragRuntime existiert im UI-Editor-kit und ist in BBM ueber eine renderer-kompatible Bridge testweise ladbar. BBM nutzt sie noch nicht produktiv; es gibt keine DOM-/Pointer-/Maus-Anbindung, keine echte Verschiebung, keine UI-, PDF-, Canvas- oder Persistenzfunktion.

**Status nach G42:** Die bestehende Panel-/Drag-Baseline im BBM-Launcher ist testseitig abgesichert. Panel-Initialisierung, Open/Close, defensive Positionsnormalisierung, Panel-Reset und Hidden-Elements-Button/Popover bleiben unveraendert. Die DragRuntime bleibt nur testseitig verfuegbar und wird vom Launcher weiterhin nicht produktiv importiert oder aufgerufen; DOM-/Event-Anbindung bleibt Host-/Launcher-Aufgabe.

**Status nach G43:** Die reine Preview-Panel-Positionsberechnung nutzt im BBM-Launcher kontrolliert `buildDragResult(...)` aus der DragRuntime-Bridge. Diese Nutzung ist auf `css-pixels` und das Editor-Panel begrenzt; DOM-/Mouse-Events, Startpositionsmessung, Style-Setzen, Reset und Rendering bleiben Host-/Launcher-Aufgabe. Persistenz, Registry, PDF, Canvas und Plan bleiben unveraendert.

**Status nach G44:** Die G43-Umstellung wurde in der lokalen Electron-DEV-App sichtbar geprueft. UI-Editor-Button, Panel-Oeffnen, Panel-Drag, Viewport-Begrenzung, Panel-Reset, Schliessen/Wieder-Oeffnen und Hidden-Elements-Bereich bleiben stabil. Die DragRuntime bleibt auf Rechenlogik begrenzt; DOM-/Event-Anbindung bleibt im Host/Launcher. Keine neue UI-Funktion, Persistenz, Registry-, PDF-, Canvas- oder Plan-Aktivierung.

**Status nach G46:** BBM nutzt fuer die reine Preview-Panel-Positionsberechnung den PanelRuntime-Panel-Drag-Helper ueber `uiEditorKitPanelRuntimeBridge.js`. Die direkte DragRuntime-Nutzung im Launcher fuer Panel-Positionierung ist entfernt; die DragRuntime bleibt intern im UI-Editor-kit hinter dem Helper. DOM-/Event-Anbindung, Style-Setzen, Reset, Open/Close und Hidden-Elements bleiben Host-/Launcher-Aufgabe. Keine neue UI-Funktion, Persistenz, Registry-, PDF-, Canvas- oder Plan-Aktivierung.

**Status nach G47:** Der Panel/Drag-Block ist als Referenzstand abgeschlossen. Datenfluss und Grenze sind dokumentiert: Mouse-/DOM-Event im BBM-Launcher, Start-Bounds/Delta/Viewport-Bounds ueber `uiEditorKitPanelRuntimeBridge.js`, Berechnung im PanelRuntime Panel-Drag-Helper des UI-Editor-kit, Style-Setzen wieder im BBM-Launcher. UI-Editor-kit speichert nicht; DOM-/Mouse-/Pointer-Anbindung bleibt im Host. Keine neue Produktivlogik, Persistenz, Registry-, PDF-, Canvas- oder Plan-Aktivierung.

**Status nach G48:** PDF-/Plan-Surfaces sind in BBM read-only als Adapter-Skelett vorbereitet. `pdfPlanSurfaceAdapter.js` erzeugt leere neutrale `pdf-page`- und `plan`-Modelle und validiert sie ueber die SurfaceRuntime-Bridge. Es gibt keine produktive Launcher-Nutzung, keine PDF-/Canvas-Renderlogik, keinen Drag auf PDF/Plan, keine Persistenz, keine Registry-Aenderung und keine Fachlogik.

**Status nach G49:** Ein zentraler read-only SurfaceAdapter-Katalog ist vorbereitet. Er kennt ausschliesslich `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`, baut/validiert Modelle ueber die SurfaceRuntime-Bridge und blockiert unbekannte SurfaceIds ohne Default- oder Wildcard-Freigabe. Es gibt keine produktive Launcher-Nutzung, keine Bearbeitung, keinen Drag, keine Persistenz, keine Registry-Aenderung und keine Fachlogik.

**Status nach G50:** Der SurfaceAdapter-Katalog ist als read-only Referenzstand abgeschlossen. `docs/UI_EDITOR_SURFACE_ADAPTER_REFERENZSTAND.md` dokumentiert vorhandene Adapter, bekannte SurfaceIds, `UNKNOWN_SURFACE_ADAPTER` fuer unbekannte SurfaceIds, Datenfluss, Sicherheitsgrenzen und Nicht-Ziele. G50 aktiviert keine Produktivlogik, keine Launcher-Nutzung, keine PDF-/Plan-Bearbeitung, keinen Drag und keine Persistenz.

**Status nach G51:** Der BBM-Launcher kann den SurfaceAdapter-Katalog read-only testseitig ueber `buildReadonlySurfaceModelForLauncher(surfaceId, input)` verwenden. Geprueft sind `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`; unbekannte SurfaceIds bleiben blockiert. Es gibt keine sichtbare Surface-Anzeige, keine Panel-Sektion, keine produktive Surface-Auswahl, keine PDF-/Plan-Bearbeitung, keinen Drag und keine Persistenz.

**Status nach G52:** Eine read-only SurfacePolicy ist vorbereitet. Sie erlaubt
`restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default` nur lesend,
setzt `visibleInEditor`, Drag, Resize und Persistenz fuer alle bekannten
SurfaceIds auf gesperrt und blockiert unbekannte SurfaceIds, Wildcards und
leere IDs vollstaendig. Der SurfaceAdapterCatalog ist defensiv an
`readable: true` gebunden; sichtbare UI, PDF-/Plan-/Canvas-Bearbeitung, Drag
und Persistenz bleiben nicht aktiviert.

**Status nach G53:** `restarbeiten.ui.main` ist als erster sichtbarer
read-only Surface-Pilot im bestehenden Editorpanel freigegeben. Sichtbar ist
nur eine kompakte SurfaceInfo mit SurfaceId, Typ und Elementanzahl. PDF- und
Plan-Surfaces bleiben `visibleInEditor: false`; unbekannte SurfaceIds und
Wildcards bleiben blockiert. Es gibt keine Surface-Liste, keine Surface-Auswahl,
keine Bearbeitungsbuttons, keinen Drag, kein Resize und keine Persistenz.

**Status nach G54:** Die kompakte read-only SurfaceInfo ist als Referenzstand
abgeschlossen. `docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md`
dokumentiert sichtbaren Pilot, nicht sichtbare Surfaces, Policy-Grenzen,
Datenfluss, Sicherheitsgrenzen und Nicht-Ziele. G54 aktiviert keine neue
Produktivlogik, keine weitere SurfaceId, keine Surface-Auswahl, keine
Bearbeitung, keinen Drag, kein Resize und keine Persistenz.

**Status nach G55:** Ein read-only SurfaceSelection-Modell ist vorbereitet.
`surfaceSelectionModel.js` nimmt nur SurfaceIds auf, die im
SurfaceAdapterCatalog bekannt sind und laut SurfacePolicy `readable === true`
sowie `visibleInEditor === true` melden. Aktuell ist dadurch nur
`restarbeiten.ui.main` enthalten. PDF/Plan, unbekannte SurfaceIds und
Wildcards bleiben nicht auswaehlbar. Es gibt keine sichtbare Auswahl, keine
Bearbeitung, keinen Drag, kein Resize und keine Persistenz.

**Status nach G56:** Die SurfaceSelection ist im bestehenden Editorpanel
sichtbar, bleibt aber read-only. Angezeigt wird nur `restarbeiten.ui.main` mit
dem Label `Restarbeiten`. PDF-/Plan-Surfaces, unbekannte SurfaceIds und
Wildcards bleiben unsichtbar; es gibt keine Surface-Umschaltung, keine
Dropdown-/Listen-UI, keine Bearbeitung, keinen Drag, kein Resize und keine
Persistenz.

**Status nach G57:** Der sichtbare G56-Stand ist als Referenzstand
abgeschlossen. `docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md`
dokumentiert die sichtbare Grenze, den Datenfluss, Policy-Grenzen,
Sicherheitsgrenzen und Nicht-Ziele. Es wurde keine Produktivlogik geaendert und
keine weitere Surface sichtbar gemacht.

**Status nach G58:** Ein interner read-only SurfaceSelection-State ist
vorbereitet. Er beschreibt die aktuelle Auswahl, verfuegbare und blockierte
SurfaceIds sowie blockierte Auswahlwuensche. Aktuell kann nur
`restarbeiten.ui.main` ausgewaehlt sein; PDF/Plan, unbekannte SurfaceIds,
Wildcards und leere IDs bleiben blockiert. Es gibt keine echte Umschaltung,
keine sichtbare UI-Aenderung und keine Persistenz.

**Status nach G59:** Der BBM-Launcher nutzt den read-only
SurfaceSelection-State als interne Quelle fuer die vorhandene kompakte
Surface-Auswahl und SurfaceInfo. Sichtbar bleibt nur `restarbeiten.ui.main`
mit dem Label `Restarbeiten`; PDF/Plan, unbekannte SurfaceIds, Wildcards und
leere IDs bleiben blockiert. Es gibt keine echte Umschaltung, keine neue
UI-Struktur, keine Bearbeitung, keinen Drag, kein Resize und keine Persistenz.

**Status nach G60:** Der G59-Stand ist als eigener read-only
Launcher-Referenzstand abgeschlossen. `docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md`
dokumentiert Datenfluss, sichtbare Grenze, internen State, blockierte
SurfaceIds, Sicherheitsgrenzen und moegliche Folgepakete. G60 aktiviert keine
Produktivlogik, keine sichtbare UI-Aenderung, keine weitere Surface, keinen
Drag, kein Resize und keine Persistenz.

**Status nach G61:** Ein defensives read-only Surface-Umschaltungsmodell ist
vorbereitet. `src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js`
wertet Wechselwuensche gegen den bestehenden SurfaceSelection-State aus und
loest nur `restarbeiten.ui.main` auf. PDF/Plan, unbekannte SurfaceIds, `*` und
leere IDs bleiben mit `surface-not-selectable-readonly` blockiert. G61
aktiviert keine echte Umschaltung, keine Launcher-Produktivnutzung, keine
sichtbare UI-Aenderung, keinen Drag, kein Resize und keine Persistenz.

**Status nach G62:** Der G61-Stand ist als eigener read-only Referenzstand
abgeschlossen. `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md`
dokumentiert erlaubte und blockierte Wechselziele, den Datenfluss ueber
SurfaceSwitchModel, SurfaceSelection-State, SurfaceSelectionModel,
SurfacePolicy und SurfaceAdapterCatalog sowie die Sicherheitsgrenzen. G62
aktiviert keine Produktivlogik, keine Launcher-Produktivintegration, keine
sichtbare UI-Aenderung, keine echte Umschaltung, keinen Drag, kein Resize und
keine Persistenz.
