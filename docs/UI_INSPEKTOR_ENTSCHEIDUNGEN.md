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

**Status nach G75:** `pdf.plan.page.1` ist per SurfacePolicy read-only sichtbar freigegeben. `plan.canvas.default` bleibt blockiert, und die sichtbare Surface-Auswahl darf nun einen zweiten Eintrag zeigen, ohne Drag, Resize oder Persistenz zu aktivieren.

**Status nach G76:** Der sichtbare G75-Stand ist zusaetzlich in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md` dokumentiert und
gegen Regressionen abgesichert. Surface-Auswahl zeigt
`Restarbeiten - PDF Plan Seite 1`; SurfaceInfo bleibt `restarbeiten.ui.main`.

**Status nach G77:** Das SurfaceInfo-Verhalten ist als offene
Entscheidungsgrundlage in `docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md`
dokumentiert. Empfehlung fuer diese Phase bleibt, die SurfaceInfo nicht
umzubauen und eine spaetere Aenderung nur in einem eigenen UI-/Freigabepaket
mit Sichtpruefung zu behandeln.

**Status nach G78:** Das bestehende UI-Editor-Panel zeigt jetzt zusaetzlich
den Hinweis `PDF Plan Seite 1 ist nur read-only sichtbar. Keine Bearbeitung,
kein Drag, keine Persistenz.`. SurfaceInfo bleibt bewusst auf
`restarbeiten.ui.main`; der Hinweis ersetzt keine Umschaltung und keine
zweite SurfaceInfo.

**Status nach G79:** Die getrennte manuelle Zielrouten-Sichtpruefung ist in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md` dokumentiert.
BBM, Launcher und Projekte-Ansicht waren sichtbar; die konkrete
Restarbeiten-Zielroute war in dieser Sitzung aber nicht reproduzierbar
erreichbar. Ergebnis:
`Manuelle Sichtpruefung nicht vollstaendig bestanden / nicht vollstaendig erreichbar`.

**Status nach G80:** Die konkrete Restarbeiten-Zielroute ist nun
reproduzierbar bestaetigt und in
`docs/UI_EDITOR_RESTARBEITEN_ZIELROUTE_SICHTPRUEFUNG.md` dokumentiert. Der
Pfad `Start` -> `Projekte` -> Projektkachel `Nr.: 04-2026 / UI-Polish fuer BBM`
-> `Restarbeiten` -> `UI-Editor` fuehrt zum read-only Zielstand mit
`Restarbeiten - PDF Plan Seite 1`, `restarbeiten.ui.main`, sichtbarem Hinweis,
blockiertem `plan.canvas.default`, ohne Drag, Resize oder Persistenz.

**Status nach G81:** Die Abnahmereferenz ist jetzt in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`
gebuendelt. `pdf.plan.page.1` bleibt nur read-only sichtbar,
`restarbeiten.ui.main` bleibt Host-/Bestandssurface und der Stand wird damit
als Referenz abgeschlossen, ohne eine neue Surface oder echte Umschaltung
einzufuehren.

**Status nach G82:** `plan.canvas.default` wird jetzt nur als naechster
Kandidat bewertet und in
`docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PLAN_CANVAS_DEFAULT.md`
dokumentiert. Es gibt keine neue Freigabe, keine Policy-Aenderung und keine
neue Sichtbarkeit; `pdf.plan.page.1` bleibt read-only sichtbar und
`restarbeiten.ui.main` bleibt Host-/Bestandssurface.

**Status nach G83:** `plan.canvas.default` ist jetzt explizit read-only
sichtbar freigegeben und in
`docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_POLICY_REFERENZSTAND.md`
dokumentiert. `pdf.plan.page.1` bleibt read-only sichtbar und
`restarbeiten.ui.main` bleibt Host-/Bestandssurface; Drag, Resize und
Persistenz bleiben getrennt.

**Status nach G84:** Der Zwei-Surface-read-only-Stand ist jetzt in
`docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`
referenziert. `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only
sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface.

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

**Status nach G63:** Der BBM-Launcher nutzt das SurfaceSwitch-Modell intern
read-only ueber `buildReadonlySurfaceSwitchResultForLauncher(...)`.
Wechselwuensche werden defensiv resolved; erlaubt bleibt nur
`restarbeiten.ui.main`. Die sichtbare Surface-Auswahl `Restarbeiten` und die
SurfaceInfo bleiben unveraendert. G63 aktiviert keine echte Umschaltung, keine
PDF-/Plan-Auswahl, keine neue UI, keinen Drag, kein Resize und keine
Persistenz.

**Status nach G64:** Der BBM-Launcher ist mit
`docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md` als read-only
Referenzstand dokumentiert. Der Launcher nutzt
`buildReadonlySurfaceSwitchResultForLauncher(...)` nur intern als
vorgeschaltete Referenz; sichtbar bleiben `Restarbeiten` und die SurfaceInfo
`restarbeiten.ui.main` / `ui-screen` / Elementanzahl. G64 aktiviert keine
echte Umschaltung, keine sichtbare UI-Aenderung, keine Launcher-Produktivintegration,
keinen Drag, kein Resize und keine Persistenz.

**Status nach G65:** Ein read-only SurfaceSwitch-Request/Command-Handler ist
mit `docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_READONLY.md` vorbereitet. Er
prueft Wuensche defensiv gegen das SurfaceSwitch-Modell, laesst nur
`restarbeiten.ui.main` zu und setzt `changed` immer auf `false`. G65 aktiviert
keine echte Umschaltung, keine sichtbare UI-Aenderung, keinen Drag, kein
Resize und keine Persistenz.

**Status nach G66:** Der read-only SurfaceSwitch-Request/Command-Handler ist
mit `docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_REFERENZSTAND.md` als
Referenzstand abgeschlossen. Die komplette Request-/Command-Kette, erlaubte
und blockierte Ziele, Rueckgabeverhalten, Sicherheitsgrenzen und Folgepakete
sind dokumentiert. G66 aktiviert keine Produktivlogik, keine sichtbare
UI-Aenderung, keine Launcher-Produktivintegration, keine echte Umschaltung,
keinen Drag, kein Resize und keine Persistenz.

**Status nach G67:** Der BBM-Launcher verwendet den read-only
SurfaceSwitch-Command intern ueber `handleReadonlySurfaceSwitchRequestForLauncher(...)`.
Sichtbare Surface-Auswahl und SurfaceInfo bleiben unveraendert; `changed`
bleibt `false`. G67 aktiviert keine Produktivlogik, keine sichtbare
UI-Aenderung, keine echte Umschaltung, keinen Drag, kein Resize und keine
Persistenz.

**Status nach G68:** Der SurfaceSwitch-Command im Launcher ist als stabiler
read-only Referenzstand abgeschlossen. `docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md`
dokumentiert Launcher-Datenfluss, Command-/Request-Verhalten, sichtbare
UI-Grenze, Sicherheitsgrenzen und Folgepakete. G68 aktiviert keine
Produktivlogik, keine sichtbare UI-Aenderung, keine echte Umschaltung, keinen
Drag, kein Resize und keine Persistenz.

**Status nach G69:** Der gesamte read-only Surface-Steuerungsstand ist als
Gesamt-Referenz abgeschlossen. `docs/UI_EDITOR_SURFACE_READONLY_GESAMT_REFERENZSTAND.md`
dokumentiert die Kette von SurfaceRuntime-Bridge bis Launcher, inklusive
Komponenten, Datenfluss, sichtbarer UI-Grenze, erlaubter und blockierter
SurfaceIds, Sicherheitsgrenzen und Folgepakete. G69 aktiviert keine
Produktivlogik, keine sichtbare UI-Aenderung, keine echte Umschaltung, keinen
Drag, kein Resize und keine Persistenz.

**Status nach G70:** Der Gesamtstand ist zusaetzlich als Integrations-/Freigabecheck
abgesichert. `docs/UI_EDITOR_SURFACE_READONLY_INTEGRATION_CHECK.md` dokumentiert
die geprueften Komponenten, den erlaubten Surface-Bereich, die blockierten
SurfaceIds, die sichtbare UI-Grenze und die offenen Freigabeentscheidungen. G70
aktiviert keine Produktivlogik, keine sichtbare UI-Aenderung, keine echte
Umschaltung, keinen Drag, kein Resize und keine Persistenz.

**Status nach G71:** Die naechste Surface-Phase ist ueber eine Freigabematrix
vorbereitet. `docs/UI_EDITOR_SURFACE_NEXT_PHASE_FREIGABEMATRIX.md` beschreibt
mögliche Folgephasen, Freigabefragen, Risiken, Prioritaet und Stop-/Go-Kriterien.
G71 aktiviert keine Produktivlogik, keine sichtbare UI-Aenderung, keine echte
Umschaltung, keinen Drag, kein Resize und keine Persistenz.

**Status nach G72:** PDF-/Plan-Surfaces sind fachlich read-only bewertet.
`docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md` beschreibt den
aktuellen Blockierstatus, Nutzen, Risiken, harte Grenzen und Stop-/Go-Kriterien,
ohne Sichtbarkeit oder Auswahl freizugeben. G72 aktiviert keine Produktivlogik,
keine sichtbare UI-Aenderung, keine echte Umschaltung, keinen Drag, kein
Resize und keine Persistenz.

**Status nach G73:** Eine Surface-Policy-Freigabevorlage ist vorbereitet.
`docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md` beschreibt spaetere
Einzelfreigaben, Pflichtpruefungen, Minimalfreigabe und verbotene Kopplungen,
ohne eine Surface tatsaechlich freizugeben. G73 aktiviert keine Produktivlogik,
keine sichtbare UI-Aenderung, keine echte Umschaltung, keinen Drag, kein
Resize und keine Persistenz.

**Status nach G74:** `pdf.plan.page.1` ist als einzelner Freigabe-Kandidat
vorbereitet. `docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PDF_PLAN_PAGE_1.md`
beschreibt den Kandidaten, den minimalen spaeteren Freigabeumfang und die
Stop-/Go-Kriterien, ohne die Policy zu aendern. G74 aktiviert keine
Produktivlogik, keine sichtbare UI-Aenderung, keine echte Umschaltung, keinen
Drag, kein Resize und keine Persistenz.

**Status nach G85:** Die gesamte read-only Surface-Phase ist nun als
abgeschlossener Referenzstand dokumentiert. `docs/UI_EDITOR_SURFACE_READONLY_PHASE_ABNAHME_REFERENZSTAND.md`
buendelt `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`
unter klaren read-only Grenzen. G85 aktiviert keine Produktivlogik, keine
sichtbare UI-Aenderung, keine echte Umschaltung, keinen Drag, kein Resize und
keine Persistenz.

**Status nach G86:** Das Konzept fuer eine spaetere echte Surface-Umschaltung
ist nun vorbereitet. `docs/UI_EDITOR_SURFACE_SWITCHING_KONZEPT_OHNE_UMSETZUNG.md`
beschreibt Varianten, Risiken, harte Grenzen und Stop-/Go-Kriterien, ohne eine
Umschaltung freizugeben. G86 aktiviert keine Produktivlogik, keine sichtbare
UI-Aenderung, keine echte Umschaltung, keinen Drag, kein Resize und keine
Persistenz.

**Status nach G87:** Der Surface-Auswahl-Kontext ist jetzt fachlich
entschieden. `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_ENTSCHEIDUNG.md`
legt fest, dass die Surface-Auswahl vorerst eine read-only
Sichtbarkeits-/Kontextanzeige bleibt und keine aktive Surface ist. G87
aktiviert keine Produktivlogik, keine sichtbare UI-Aenderung, keine echte
Umschaltung, keinen Drag, kein Resize und keine Persistenz.

**Status nach G88:** Der Surface-Auswahl-Kontext ist jetzt als Referenzstand
gebuendelt. `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_REFERENZSTAND.md`
haelt die Einordnung als read-only Sichtbarkeits-/Kontextanzeige fest und
schliesst Fehlinterpretationen aus. G88 aktiviert keine Produktivlogik, keine
sichtbare UI-Aenderung, keine echte Umschaltung, keinen Drag, kein Resize und
keine Persistenz.

**Status nach G89:** Die technische Guardrail-Absicherung der Surface-Auswahl
ist jetzt in `docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md`
dokumentiert. `restarbeiten.ui.main` bleibt Hoststand, `pdf.plan.page.1` und
`plan.canvas.default` bleiben read-only sichtbar, und SurfaceInfo bleibt
bewusst auf `restarbeiten.ui.main`. G89 aktiviert keine Produktivlogik, keine
sichtbare UI-Aenderung, keine echte Umschaltung, keinen Drag, kein Resize und
keine Persistenz.

**Status nach G90a:** G90 bleibt wegen fehlender verpflichtender
UI-Editor-Grundlagen gestoppt. Die Stop-Entscheidung ist in
`docs/UI_EDITOR_FEHLENDE_GRUNDLAGEN_STOPP_ENTSCHEIDUNG.md` dokumentiert. Der
geplante sichtbare Hinweis zur Surface-Auswahl wurde nicht umgesetzt; es gibt
keine Produktivlogik-Aenderung, keine sichtbare UI-Aenderung, keine echte
Surface-Umschaltung, kein Drag, kein Resize und keine Persistenz.

**Status nach G91:** Die Freigabe-/Ersatzentscheidung fuer die fehlenden
UI-Editor-Grundlagen ist in
`docs/UI_EDITOR_GRUNDLAGEN_FREIGABEENTSCHEIDUNG.md` vorbereitet. G91 erteilt
keine Ersatzfreigabe und legt keine Pflichtunterlagen als Platzhalter an. G90
bleibt bis zur Nutzerentscheidung blockiert; Produktivlogik, sichtbare UI,
SurfaceInfo, Drag, Resize und Persistenz bleiben unveraendert.

**Status nach G92:** Die Bedarfsanalyse fuer die fehlenden UI-Editor-
Grundlagen ist in `docs/UI_EDITOR_GRUNDLAGEN_BEDARFSANALYSE.md` vorbereitet.
G92 ersetzt keine Pflichtunterlage und erteilt keine Freigabe. G90 bleibt
blockiert, bis die Grundlagen regulaer erstellt oder ein eng begrenzter
Folgepfad ausdruecklich entschieden ist.

**Status nach Grundlagen 1/3:** `docs/EDITOR_BAUPLAN.md` und
`docs/ZIEL_APP_ANBINDUNG.md` sind jetzt als knappe Minimal-Grundlagen
vorhanden. Sie bestaetigen `restarbeiten.ui.main` als Host-/Bestandssurface,
`pdf.plan.page.1` und `plan.canvas.default` als read-only Zusatzkontexte und
schliessen aktive Surface-Umschaltung, Drag, Resize, Persistenz, PDF-/Plan-
Bearbeitung sowie DB-/IPC-Schreibwege weiter aus. Das UI-Editor-kit speichert
nicht; BBM-Produktiv bleibt Host.

**Status nach Grundlagen 2/3:** `docs/UI_ELEMENT_KATALOG.md` und
`docs/UI_BAU_UND_PRUEFREGELN.md` sind jetzt als knappe Minimal-Grundlagen
vorhanden. Sie legen die aktuell zulässigen Element- und Kontextarten sowie
die Bau-/Pruefregeln fest. Die verbleibende PDF-/Plan-Grundlage bleibt
weiterhin getrennt offen; aktive Surface-Umschaltung, Drag, Resize,
Persistenz, PDF-/Plan-Bearbeitung und DB-/IPC-Schreibwege bleiben gesperrt.

**Status nach Grundlagen 3/3:** `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md` ist
jetzt als knappe Minimal-Grundlage vorhanden. `restarbeiten.ui.main` bleibt
Host-/Bestandssurface, `pdf.plan.page.1` und `plan.canvas.default` bleiben
read-only sichtbar, und PDF-/Plan-Bearbeitung, Koordinaten-Speicherung sowie
DB-/IPC-Schreibwege bleiben gesperrt.

**Status nach G90:** Der sichtbare read-only Kontext-Hinweis zur Surface-
Auswahl ist jetzt umgesetzt. SurfaceInfo bleibt `restarbeiten.ui.main` und der
Hinweis bleibt rein informativ.

**Status nach G93:** Der Abschlusscheck zur Grundlagenreihe und zum sichtbaren
Surface-Hinweis ist in
`docs/UI_EDITOR_GRUNDLAGEN_SURFACE_HINWEIS_ABSCHLUSSCHECK.md` gebuendelt.
Die fuenf Grundlagen bleiben vorhanden, der G90-Hinweis bleibt bestaetigt und
aktive Surface-Umschaltung, SurfaceInfo-Umbau, Drag, Resize, Persistenz und
Schreibwege bleiben blockiert.

**Status nach G94:** Die kompakte Bedienzustands-Statuszeile ist im
UI-Editor-Panel sichtbar. Sie nennt den Restarbeiten-Hostkontext, die read-only
Zusatzkontexte und den nicht aktiven Speicherzustand, ohne SurfaceInfo oder
Persistenz zu aendern.

**Status nach G95:** Die kleine read-only Elementkatalog-Ãœbersicht ist im
UI-Editor-Panel sichtbar. Sie benennt erlaubte und gesperrte Elementarten,
ohne SurfaceInfo, Erzeugung oder Persistenz zu aendern.

**Status nach G96:** Die kleine Entwurfs-Vorschau fuer `Hinweis / Infotext`
ist im UI-Editor-Panel sichtbar. Sie bleibt nur Vorschau, nicht gespeichert,
und erweitert den Restarbeiten-Kontext ohne neue Bedien- oder Speicherlogik.

**Status nach G97:** Die Entwurfs-Vorschau hat jetzt eine lokale Eingabe und
eine Live-Vorschau. Der Text bleibt nicht gespeichert, kann beim Neuladen
verloren gehen und aendert weder SurfaceInfo noch Schreibwege.

**Status nach G98:** Zusaetzlich erscheint eine Host-Vorschau im
Restarbeiten-Kontext. Sie spiegelt den aktuellen Hinweistext, zeigt
`nicht gespeichert` und bleibt ebenfalls nur temporaer.

**Status nach G99:** Die read-only Elementmodell-Vorschau fuer `Hinweis /
Infotext` ist jetzt sichtbar und dokumentiert. Sie zeigt Typ, Surface, Status
und den aktuellen Hinweistext, bleibt nicht gespeichert und erweitert die
Host-/Live-Vorschau nur um eine weitere lokale Vorschau ohne neue Speicher-
oder Umschaltlogik.

**Status nach G100:** Die lokale Entwurfspruefung fuer `Hinweis / Infotext`
ist jetzt sichtbar. Sie zeigt nur `Status: gueltiger lokaler Entwurf` oder
`Status: Hinweistext fehlt` plus `Speichern: nicht aktiv`, bleibt lokal und
schreibt nichts. SurfaceInfo bleibt `restarbeiten.ui.main`; keine weitere
Surface, kein Drag, kein Resize und keine Persistenz wurden freigegeben.

**Status nach G101:** Der lokale Reset-Button fuer `Hinweis / Infotext` ist
jetzt sichtbar. Er setzt nur den Standardtext zurueck und laesst Live-,
Host-, Elementmodell-Vorschau und Entwurfspruefung sofort nachziehen.
SurfaceInfo bleibt `restarbeiten.ui.main`; keine Speicherung, keine neue
Surface und keine weitere Fachlogik wurden freigegeben.

**Status nach G102:** Der lokale Hinweis-/Infotext-Entwurf ist als
Abschlusscheck gebuendelt. Eingabe, Live-Vorschau, Host-Vorschau,
Elementmodell-Vorschau, Entwurfspruefung und Reset bleiben lokal,
`SurfaceInfo` bleibt `restarbeiten.ui.main`, und es gibt weiterhin keine
Persistenz oder weitere Freigabe.

**Status nach G103:** Eine read-only Payload-Vorschau fuer `Hinweis /
Infotext` ist sichtbar. Sie zeigt die technische Form des lokalen Entwurfs
(`type`, `surfaceId`, `status`, `persisted` und Text), bleibt lokal und
schreibt nichts; `SurfaceInfo` bleibt `restarbeiten.ui.main`.

**Status nach G104:** Die Kit-Extraktionsgrenze fuer den Hinweis-/Infotext-
Entwurf ist dokumentiert. BBM bleibt Host und Referenzstand, `UI-Editor-kit`
bekommt spaeter nur generische Teile, und eine direkte 1:1-Kopie ist
ausgeschlossen.

**Status nach G105:** Die Speicherfreigabe fuer den Hinweis-/Infotext-
Entwurf ist weiterhin blockiert. Es gibt keinen Speicherbutton, keine
Persistenz und keinen freigegebenen Schreibweg; eine spaetere Freigabe braucht
eine eigene, getestete Entscheidung.

**Status nach G106:** Das moegliche spaetere Speicherziel ist dokumentiert:
`Restarbeiten` auf `restarbeiten.ui.main` fuer `Hinweis / Infotext` mit
`draft` und `persisted: false` vor dem Speichern. Der konkrete BBM-
Schreibweg bleibt getrennt und ist noch nicht gebaut.

**Status nach G107:** Die vorhandenen BBM-Schreibwege sind jetzt analysiert.
Der Restarbeiten-Notizweg ist der naechste fachliche Kandidat, bleibt aber
weiterhin ungebaut und getrennt freizugeben.

**Status nach G108:** Der Restarbeiten-Notizweg ist als spaeterer Ziel-
Schreibweg fuer `Hinweis / Infotext` dokumentarisch freigegeben. Es bleibt
bei der Zielrichtung ohne Umsetzung, ohne Speicherbutton und ohne neue
Schreiblogik.

**Status nach G109:** Ein sichtbarer Speicherbereich ist im UI-Editor-Panel
vorbereitet. Er bleibt gesperrt, zeigt nur die Zielrichtung an und loest
weiterhin keine Speicherung aus.

**Status nach G110:** Im gesperrten Speicherbereich ist zusaetzlich ein
sichtbarer Freigabecheck angekommen. Er zeigt nur den lokalen
Validierungsstand, laesst den Speicherbutton deaktiviert und aktiviert keinen
Schreibweg.

**Status nach G111:** Die Speicher-Vorbereitung ist als Abschluss- und
Referenzstand bestaetigt. Sichtbarer Speicherbereich, Freigabecheck und
deaktivierter Button bleiben nur Anzeige und bauen keinen neuen Schreibweg.

**Status nach G112:** Der technische Vertrag von `restarbeiten:createNote`
ist als naechste fachliche Grundlage dokumentiert. Der Speicherweg bleibt
weiterhin unverbunden und deaktiviert.

**Status nach G113:** Die Restarbeiten-Kontextzuordnung ist als naechste
Analyse dokumentiert. Die passende `restarbeitId` kommt nicht aus dem
UI-Editor-Draft selbst, sondern muss spaeter vom Host eindeutig uebergeben
werden.

**Status nach G114:** Die Folgeentscheidung zur Host-Uebergabe von
`restarbeitId` ist in
`docs/UI_EDITOR_HINWEIS_INFOTEXT_RESTARBEIT_KONTEXT_UEBERGABEENTSCHEIDUNG.md`
dokumentiert. `RestarbeitenScreen` bzw. `notesPopup.restarbeitId` sind die
zugelassene Quelle; der UI-Editor darf die Ziel-Restarbeit nicht selbst
suchen oder raten.
