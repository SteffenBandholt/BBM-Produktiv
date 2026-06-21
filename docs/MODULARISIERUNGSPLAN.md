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
- der read-only Surface-Gesamtstand wurde mit G69 abgeschlossen und mit G70 zusaetzlich als Integrations-/Freigabecheck bestaetigt; nur `restarbeiten.ui.main` bleibt sichtbar/resolved, weitere SurfaceIds bleiben blockiert
- G71 legt mit `docs/UI_EDITOR_SURFACE_NEXT_PHASE_FREIGABEMATRIX.md` eine Freigabematrix fuer die naechste Surface-Phase an; empfohlen wird zuerst eine kontrollierte read-only Erweiterung statt sofort Drag oder Persistenz
- G72 bewertet PDF/Plan-Surfaces fachlich read-only in `docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md`; Sichtbarkeit und Auswahl bleiben weiter blockiert, Drag und Persistenz ebenfalls
- G73 bereitet mit `docs/UI_EDITOR_SURFACE_POLICY_FREIGABEVORLAGE.md` eine Surface-Policy-Freigabevorlage vor; die Vorlage bleibt rein dokumentarisch und gibt nichts frei
- G75 setzt `pdf.plan.page.1` per SurfacePolicy read-only sichtbar frei; `plan.canvas.default` bleibt blockiert und Drag/Persistenz bleiben getrennt
- G76 sichert den sichtbaren G75-Stand in `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md` ab; die Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`, waehrend die SurfaceInfo weiterhin `restarbeiten.ui.main` bleibt
- G77 dokumentiert das SurfaceInfo-Verhalten nach dieser Freigabe in `docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md`; empfohlen bleibt, die SurfaceInfo vorerst nicht umzubauen und einen spaeteren UI-Schritt getrennt zu behandeln
- G78 ergaenzt im bestehenden UI-Editor-Panel einen kleinen read-only Hinweis fuer `pdf.plan.page.1`; die SurfaceInfo bleibt unveraendert auf `restarbeiten.ui.main`, und es gibt weiterhin keine echte Umschaltung, kein Drag und keine Persistenz
- G79 dokumentiert die manuelle Zielrouten-Sichtpruefung in `docs/UI_EDITOR_PDF_PLAN_PAGE_1_MANUELLE_SICHTPRUEFUNG.md`; BBM, Launcher und Projekte-Ansicht waren sichtbar, die konkrete Restarbeiten-Zielroute war in dieser Sitzung aber nicht reproduzierbar erreichbar und wurde deshalb ehrlich als `nicht vollstaendig bestanden / nicht vollstaendig erreichbar` festgehalten
- G80 klaert die konkrete Restarbeiten-Zielroute in `docs/UI_EDITOR_RESTARBEITEN_ZIELROUTE_SICHTPRUEFUNG.md`; der reproduzierbare Pfad laeuft ueber `Start` -> `Projekte` -> Projektkachel `Nr.: 04-2026 / UI-Polish fuer BBM` -> `Restarbeiten` -> `UI-Editor` und fuehrt zum read-only Zielstand mit `Restarbeiten - PDF Plan Seite 1`, `restarbeiten.ui.main`, blockiertem `plan.canvas.default`, ohne Drag, Resize oder Persistenz
- G81 schliesst die read-only Abnahmereferenz in `docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md` ab; `pdf.plan.page.1` bleibt nur read-only sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface, und `plan.canvas.default` bleibt blockiert
- G82 bewertet `plan.canvas.default` nur als naechsten read-only Kandidaten in `docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PLAN_CANVAS_DEFAULT.md`; `pdf.plan.page.1` bleibt read-only sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface, und `plan.canvas.default` bleibt weiter blockiert
- G83 setzt `plan.canvas.default` jetzt explizit read-only sichtbar frei in `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_POLICY_REFERENZSTAND.md`; `pdf.plan.page.1` bleibt read-only sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface, und SurfaceInfo bleibt bewusst dort
- G84 buendelt die neue Zwei-Surface-Sichtpruefung in `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`; `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface, und SurfaceInfo bleibt bewusst dort
- G85 schliesst die gesamte read-only Surface-Phase in `docs/UI_EDITOR_SURFACE_READONLY_PHASE_ABNAHME_REFERENZSTAND.md` ab; `restarbeiten.ui.main` bleibt Host-/Bestandssurface, `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar, und weitere Freigaben bleiben getrennte Folgepakete
- G86 bereitet mit `docs/UI_EDITOR_SURFACE_SWITCHING_KONZEPT_OHNE_UMSETZUNG.md` die Diskussion einer spaeteren echten Surface-Umschaltung vor; aktive Surface, SurfaceInfo-Verhalten, Risiken und harte Grenzen sind beschrieben, aber es gibt keine Umsetzung und keine neue Freigabe
- G89 sichert die Surface-Auswahl technisch als keine aktive Surface-Umschaltung ab; `docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md` dokumentiert Hoststand, read-only Sichtbarkeit, blockierte IDs und fehlende Schreibwege
- G90a dokumentiert den G90-Stopp wegen fehlender UI-Editor-Grundlagen in `docs/UI_EDITOR_FEHLENDE_GRUNDLAGEN_STOPP_ENTSCHEIDUNG.md`; G90 bleibt gestoppt, der sichtbare Hinweis zur Surface-Auswahl wurde nicht umgesetzt, und Produktivlogik/UI/Drag/Resize/Persistenz bleiben unveraendert
- G91 bereitet mit `docs/UI_EDITOR_GRUNDLAGEN_FREIGABEENTSCHEIDUNG.md` die Nutzerentscheidung zu den fehlenden UI-Editor-Grundlagen vor; es gibt keine Ersatzfreigabe, keine improvisierten Pflichtunterlagen und keine UI-/Produktivlogik-Aenderung
- G92 ergaenzt mit `docs/UI_EDITOR_GRUNDLAGEN_BEDARFSANALYSE.md` die reine Bedarfsanalyse fuer die fehlenden UI-Editor-Grundlagen; die Pflichtunterlagen bleiben unangelegt und G90 bleibt blockiert
- Grundlagen 1/3 erstellt `docs/EDITOR_BAUPLAN.md` und `docs/ZIEL_APP_ANBINDUNG.md` als knappe Minimal-Grundlagen; `restarbeiten.ui.main` bleibt Host-/Bestandssurface, `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar, und aktive Surface-Umschaltung, Drag, Resize, Persistenz, PDF-/Plan-Bearbeitung sowie DB-/IPC-Schreibwege bleiben gesperrt
- Grundlagen 2/3 erstellt `docs/UI_ELEMENT_KATALOG.md` und `docs/UI_BAU_UND_PRUEFREGELN.md` als knappe Minimal-Grundlagen; Elementkatalog und Bau-/Pruefregeln sind nun vorhanden, und die verbleibende PDF-/Plan-Grundlage bleibt getrennt offen
- Grundlagen 3/3 erstellt `docs/UI_PDF_ENTWURFSENTSCHEIDUNG.md` als knappe Minimal-Grundlage; `restarbeiten.ui.main` bleibt Host-/Bestandssurface, `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar, und PDF-/Plan-Bearbeitung, Koordinaten-Speicherung sowie DB-/IPC-Schreibwege bleiben gesperrt
- G90 setzt den sichtbaren read-only Surface-Auswahl-Hinweis um; der Hinweis bleibt informativ, `restarbeiten.ui.main` bleibt SurfaceInfo, und die read-only Zusatzkontexte bleiben unveraendert
- G93 buendelt den Abschlusscheck in `docs/UI_EDITOR_GRUNDLAGEN_SURFACE_HINWEIS_ABSCHLUSSCHECK.md`; die fuenf Grundlagen bleiben vorhanden, der G90-Hinweis bleibt bestaetigt, und aktive Surface-Umschaltung, SurfaceInfo-Umbau, Drag, Resize, Persistenz und Schreibwege bleiben blockiert
- G94 ergaenzt die kompakte Bedienzustands-Statuszeile im UI-Editor-Panel; sie bleibt informativ, nennt Restarbeiten sowie die read-only Zusatzkontexte und aktiviert keine Speicher- oder Surface-Logik
- G95 ergaenzt die kleine Elementkatalog-Ãœbersicht im UI-Editor-Panel; sie bleibt informativ, nennt erlaubte und gesperrte Elementarten und aktiviert keine Erzeugungs-, Speicher- oder Surface-Logik

- G96 ergaenzt die kleine nicht-persistente Entwurfs-Vorschau fuer `Hinweis / Infotext` im UI-Editor-Panel; sie bleibt informativ, zeigt nur Vorschau, nicht gespeichert, und aktiviert keine neue Bedien- oder Speicherlogik
- G97 ergaenzt die lokale Live-Vorschau fuer `Hinweis / Infotext` im UI-Editor-Panel; sie bleibt lokal, zeigt das Eingabefeld `Hinweistext` und die Live-Vorschau, ohne Persistenz oder neue Schreibwege
- G98 ergaenzt die Host-Vorschau fuer `Hinweis / Infotext` im Restarbeiten-Kontext; sie bleibt temporaer, spiegelt den aktuellen Hinweistext und schreibt nichts
- G99 ergaenzt die read-only Elementmodell-Vorschau fuer `Hinweis / Infotext` im UI-Editor-Panel; sie bleibt temporaer, spiegelt Typ, Surface, Status und den aktuellen Hinweistext und schreibt nichts
- G100 ergaenzt die lokale Entwurfspruefung fuer `Hinweis / Infotext`; sie bleibt nur Anzeige, bewertet leer/gueltig per Trim, zeigt immer `Speichern: nicht aktiv` und schreibt nichts
- G101 ergaenzt den lokalen Reset-Button fuer `Hinweis / Infotext`; er setzt nur den Standardtext zurueck und aktualisiert die lokalen Vorschauen ohne Schreiben
- G102 schliesst den lokalen Hinweis-/Infotext-Entwurf als Abschlusscheck ab; Eingabe, Vorschauen, Entwurfspruefung und Reset bleiben lokal und schreiben nichts
- G103 ergaenzt eine read-only Payload-Vorschau fuer `Hinweis / Infotext`; sie zeigt die technische Payload-Form des lokalen Entwurfs und schreibt nichts
- G104 dokumentiert die Kit-Extraktionsgrenze fuer `Hinweis / Infotext`; BBM bleibt Host, die lokale Vorschau wird nicht 1:1 ins `UI-Editor-kit` verschoben
- G105 dokumentiert die fehlende Speicherfreigabe fuer `Hinweis / Infotext`; ein Speicherbutton oder echte Persistenz bleiben gesperrt
- G106 dokumentiert das spaetere Speicherziel und den noch fehlenden BBM-Schreibweg fuer `Hinweis / Infotext`; Speicher bleibt weiter aus
- G107 analysiert die vorhandenen BBM-Schreibwege und benoetigt fuer `Hinweis / Infotext` weiterhin einen eigenen, erst spaeter freizugebenden Schreibweg
- G108 gibt den Restarbeiten-Notizweg als spaeteren Ziel-Schreibweg frei; die technische Umsetzung bleibt bewusst offen
- G109 zeigt den gesperrten Speicherbereich im UI-Editor-Panel sichtbar an;
  die technische Speicherung bleibt weiter blockiert
- G110 ergaenzt im gesperrten Speicherbereich einen sichtbaren
  Freigabecheck; der Button bleibt deaktiviert und es wird weiterhin nichts
  gespeichert
- G111 bestaetigt die Speicher-Vorbereitung als Abschlussstand; der sichtbare
  Speicherbereich und der Freigabecheck bleiben rein lesend und blockieren
  keinen neuen Schreibweg
- G112 dokumentiert den `restarbeiten:createNote`-Vertrag als fachliche
  Grundlage fuer einen spaeteren, noch nicht angeschlossenen Speicherweg
- G113 klaert die Restarbeiten-Kontextzuordnung und die fehlende
  `restarbeitId`-Uebergabe als naechste Trennstelle vor einem echten Schreiben
- G114 legt die Host-Uebergabe von `restarbeitId` fest: Der UI-Editor darf
  die Ziel-Restarbeit nicht selbst suchen oder raten.
- G115 zeigt den fehlenden Restarbeiten-Host-Kontext sichtbar an; der
  Speicherweg bleibt weiter blockiert.
- G116 dokumentiert den spaeteren Host-Kontext-Datenvertrag; `projectId` und
  `restarbeitId` bleiben Host-Daten und werden nicht im UI-Editor geraten.
- G121 dokumentiert die spaetere Host-Kontext-UEbergabe als
  Freigabeentscheidung; Restarbeiten-Host, `restarbeitId`, Zielkontext und
  blockierte Speicherwege sind damit klar getrennt.
- G122 schliesst die echte Host-Kontext-UEbergabe aus dem
  Restarbeiten-Host an den UI-Editor an; der Default bleibt ohne eindeutige
  Restarbeit unveraendert und der Speicherweg gesperrt.
- G123 zeigt die Speicherbereitschaft fuer `Hinweis / Infotext` sichtbar an:
  Host-Kontext, `projectId`, `restarbeitId`, Zielkontext, Ziel-Surface,
  Elementtyp und Hinweistext werden pruefbar ausgewiesen; der Schreibweg
  bleibt `nein`, Speichern bleibt gesperrt und `persisted: false`. Der
  Host-Kontext wird beim Oeffnen des Launchers frisch ueber den bestehenden
  CoreShell-Resolver gelesen.
- G124 zeigt die spaetere Create-Note-Payload fuer `Hinweis / Infotext` als
  read-only Vorschau an; `restarbeiten:createNote`, `restarbeitId`,
  `noteText`, `projectId`, `previewOnly: true` und `persisted: false` bleiben
  reine Anzeige, der Schreibweg bleibt gesperrt.

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
- Der UI-Editor kann fuer bereits registrierte und markierbare Restarbeiten-UI-Elemente temporaere Preview-Aenderungen anwenden: Move, Resize und Hide/Show laufen nur gegen erlaubte `allowedOps`, bleiben im Speicher und werden per Reset oder Editor-Deaktivierung entfernt.
- Preview-Operationen sammeln jetzt zusaetzlich temporaere ChangeRequests im UI-Editor-State; Move/Width/Height werden je Ziel dedupliziert bzw. kumuliert, Visibility wird ueberschrieben, weiterhin ohne Speicherung.
- Der Trennschnitt zwischen BBM-Hostintegration, Restarbeiten-Modulankern und generischer UI-Editor-Runtime ist dokumentiert; BBM bleibt Host-/Konsument-App, die generische Preview-Runtime ist ins UI-Editor-kit zurueckgefuehrt.
- Die BBM-HostAdapter-Schnittstelle ist als kleiner Contract stabilisiert: HostContext, Registry, Layout-State, Capabilities und In-Memory-ChangeRequest-Rueckmeldung sind beschrieben und testseitig abgesichert, Persistenz bleibt deaktiviert.
- Historisch wurden kleine generische Preview-Runtime-Hilfen aus dem BBM-Launcher nach `src/renderer/editorRuntime/preview/` ausgelagert; diese lokale Runtime ist inzwischen entfernt.
- Die Rueckfuehrung dieser generischen Preview-Runtime-Hilfen ins UI-Editor-kit ist abgeschlossen: Kit-Quelle, Nicht-Kit-Anteile, API/Exports, Tests, abgegrenzte Folgethemen und Risiken sind dokumentiert.
- Die generische Preview-ChangeRequest-Logik enthaelt keinen harten `targetAppId`-Fallback `"bbm"` mehr; Ziel-App-Kontext kommt aus HostContext, Registry oder State, sonst neutral aus `unknown-host`.
- Der neutrale Export-Einstieg liegt nicht mehr in BBM; die generische Preview-Runtime kommt aus dem UI-Editor-kit.
- Der fachlich/technische Abgleich zwischen BBM-Preview-Runtime und externer UI-Editor-kit-Preview-Runtime ist dokumentiert: Exportnamen, Datenstrukturen, Operation-Mapping, Zielmodell, Pending-ChangeRequests und Guardrails sind kompatibel; der Abgleich fuehrte zur produktiven Kit-Nutzung ueber die BBM-Bridge.
- Der offizielle UI-Editor-kit-Preview-Runtime-Importvertrag ist in BBM testbar: `ui-editor-kit/runtime/preview` wird ueber `file:../UI-Editor-kit` als lokale Dependency aufgeloest und per CommonJS sowie ESM geprueft.
- `BbmUiEditorRuntimeLauncher.js` nutzt die generische Preview-Runtime produktiv aus dem UI-Editor-kit. Der Node-Importvertrag bleibt `ui-editor-kit/runtime/preview`; der Electron-Renderer nutzt wegen fehlender Bare-Package-Aufloesung die Bridge `src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js` mit relativem Pfad auf die installierte Kit-Runtime.
- Der produktive Pfad ist abgesichert: Kit -> browserfaehiges `src/runtime/preview/index.mjs` ohne `.cjs`-Rueckfall -> BBM-Bridge -> Launcher. Die lokale BBM-Preview-Runtime unter `src/renderer/editorRuntime/preview/` ist entfernt.
- Der lokale Standard-Bezugsweg fuer das externe UI-Editor-kit ist dokumentiert und pruefbar: Repos liegen unter `C:\01_Projekte`, Konsumenten installieren mit `npm install ..\UI-Editor-kit --save`, BBM prueft den Bezug mit `npm run check:ui-editor-kit`.
- Die im BBM-Launcher verbliebene UI-nahe Panel-/Drag-/Rendering-Logik ist inventarisiert: kitfaehige Kandidaten und in BBM verbleibende Host-Orchestrierung sind getrennt dokumentiert, ohne Codeverschiebung.
- Die neutrale Panel-Runtime des UI-Editor-kit ist in BBM als Importvertrag pruefbar: `ui-editor-kit/runtime/panel` wird per CommonJS und ESM getestet, ohne produktive Launcher-Umstellung und ohne Panel-/Drag-/DOM-Aenderung.
- Fuer die Panel-Runtime ist eine renderer-kompatible BBM-Bridge vorbereitet: `src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js` zeigt relativ auf `node_modules/ui-editor-kit/src/runtime/panel/index.mjs`; der Launcher nutzt sie noch nicht produktiv.
- Der BBM-Launcher nutzt das Kit-Panel-ViewModel jetzt vorbereitend ueber die Panel-Bridge: Titel, Ziel-IDs, Ops, Summary, StatusText und Button-Freigaben laufen durch `buildBbmPanelViewModel(...)`; Drag, Position, DOM-Rendering-Mechanik und Preview-Operationen bleiben im Launcher.
- Fuer ausgeblendete Elemente ist ein schlankes Bedienkonzept dokumentiert: Hide bleibt `visible = false`, Elemente bleiben in Registry/Layout-State, und spaeter soll ein kompakter Button mit temporaerem Popover statt dauerhafter Panel-Liste folgen.
- Der offizielle UI-Editor-kit-Hidden-Elements-Runtime-Importvertrag ist in BBM testbar: `ui-editor-kit/runtime/hidden-elements` wird per CommonJS und ESM geprueft; fuer den Electron-Renderer ist `src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js` mit relativem Pfad auf `node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs` vorbereitet.
- Der kompakte Hidden-Elements-Button ist im BBM-Preview-Panel vorbereitet: Der Launcher nutzt `buildHiddenElementsButtonViewModel` ueber die Hidden-Elements-Bridge, zeigt `Ausgeblendete: 0` deaktiviert und zaehlt temporaer per Preview ausgeblendete Elemente aus dem in-memory Preview-State; Popover, Einblenden-Aktion und Persistenz bleiben ausgeschlossen.
- Das kompakte Hidden-Elements-Popover ist im BBM-Preview-Panel vorbereitet: Der Launcher nutzt `buildHiddenElementsPopoverViewModel` ueber dieselbe Bridge, toggelt ein kleines Popover bei `Ausgeblendete: 1+` und kann temporaere Preview-Hide-Aenderungen ueber `Einblenden` wieder aufheben; Persistenz und echte Registry-/Layout-State-Ermittlung bleiben ausgeschlossen.
- Der Persistenz-Trennschnitt fuer Hidden-Elements ist dokumentiert: Registry bleibt statische Landkarte, echte Hidden-Liste soll spaeter aus Registry plus Layout-State entstehen, Pending ChangeRequests bleiben Vorschau/Dry-Run, und dauerhafte Overrides gehoeren in BBM hinter den HostAdapter.
- Hidden-Elements werden jetzt zusaetzlich lesend aus Registry plus `getCurrentLayoutState(...)` beruecksichtigt: Layout-State-Overrides fuer `visible = false` erscheinen im Hidden-Elements-Popover, Pending-/Preview-State gewinnt temporaer, und doppelte Element-IDs werden dedupliziert. Schreiben und Persistenz bleiben ausgeschlossen.
- Hide/Show ist als einheitlicher Visibility-ChangeRequest abgesichert: `operation: "visibility"` mit `payload.visible === false` fuer Hide und `payload.visible === true` fuer Show; pro Preview-Ziel wird der Visibility-Request ueberschrieben statt widerspruechlich dupliziert. Persistenz bleibt ausgeschlossen.
- Der HostAdapter-Dry-Run fuer Hidden-Element-Visibility-ChangeRequests ist abgesichert: `onPendingChangeRequestsChanged(...)` erhaelt Visibility-Requests fuer Hide/Show in-memory, waehrend `submitChangeRequests(...)` weiter mit `PERSISTENCE_DISABLED` blockiert und nichts speichert.
- Die Hidden-Elements-Persistenz ist vorbereitet, aber nicht produktiv aktiviert: Das spaetere Override-/ChangeRequest-Modell ist dokumentiert, `canPersistVisibility` bleibt `false`, `persistent: true` wird mit `PERSISTENCE_DISABLED` blockiert, und es gibt weiterhin keine DB-/IPC-/Datei-/Storage-Schreiblogik.
- Die Speicherort- und Freigabeentscheidung fuer Hidden-Elements-Persistenz ist dokumentiert: empfohlen ist ein eigener BBM-seitiger UI-Editor-Layout-Override-Speicher hinter dem HostAdapter, erster spaeterer Pilot-Scope ist `restarbeiten.ui.main`, TableLayouts bleiben nur technisches Vorbild und Persistenz bleibt deaktiviert.
- Der Hidden-Elements-Persistenzspeicher ist technisch vorbereitet, aber weiter deaktiviert: `src/renderer/editorRuntime/layout/editorLayoutOverrideModel.js` liefert nur Datenmodell, Validierung, ChangeRequest-Mapping und Persistierbarkeitspruefung; es gibt weiterhin keine DB-, IPC-, Datei-, localStorage-, Launcher- oder App-Start-Integration.
- Der HostAdapter-Dry-Run validiert `persistent: true` Visibility-ChangeRequests jetzt gegen das Override-Modell und Registry-IDs: gueltige Requests bleiben mit `PERSISTENCE_DISABLED` blockiert, ungueltige `visible`-Werte oder unbekannte `elementId` liefern `INVALID_CHANGE_REQUEST`; Persistenz bleibt deaktiviert.
- Die Pilot-Persistenz fuer Hidden-Element-Visibility-Overrides ist fuer `restarbeiten.ui.main` aktiv: eigener BBM-Speicher `ui_editor_layout_overrides` mit Repo/IPC/Preload, HostAdapter-Capability `canPersistVisibility: true` nur fuer diesen Scope, Speicherung nur fuer validierte `persistent: true` Visibility-Requests und Lesen ueber `getCurrentLayoutState(...)`; andere Scopes und Nicht-Visibility-Operationen bleiben blockiert.
- Die Wiederherstellung gespeicherter Hidden-Element-Visibility-Overrides ist fuer den Pilot-Scope testseitig abgesichert: Nach einem neuen Adapter-/Lesezyklus liefert `getCurrentLayoutState("restarbeiten.ui.main")` wieder `visible: false/true`, und die Hidden-Elements-Logik zaehlt nur `visible: false` als hidden.
- Der Hidden-Elements-Pilot-Ruecksetzpfad ist im bestehenden kompakten Popover abgesichert: gespeicherte `visible: false`-Overrides fuer `restarbeiten.ui.main` koennen einzeln oder ueber `Alle einblenden` per validiertem `persistent: true` / `payload.visible === true` zurueckgesetzt werden; andere Scopes und nicht freigegebene Adapter bleiben deaktiviert.
- Die Freigabe weiterer Hidden-Elements-Scopes ist als Policy vorbereitet: `visibilityPersistenceScopePolicy` erlaubt aktuell ausschliesslich `restarbeiten.ui.main`; bekannte andere Scopes, unbekannte Scopes und Wildcards bleiben blockiert, und weitere Scopes brauchen eigene Freigabepakete.
- Der Hidden-Elements-Block ist als stabiler Referenzstand abgeschlossen: `docs/UI_EDITOR_HIDDEN_ELEMENTS_REFERENZSTAND.md` dokumentiert Button/Popover, Datenfluss, ChangeRequest-Modell, Pilot-Persistenz, Restore-Pfad, Scope-Policy, Sicherheitsgrenzen, Nicht-Ziele und Test-/Guardrail-Referenzen. Es wurde keine neue Produktivlogik und keine weitere Scope-Freigabe aktiviert.
- Die Zielarchitektur fuer UI-Editor-kit Surface-, Panel-, Drag- und spaetere PDF-/Plan-/Canvas-Faehigkeit ist inventarisiert: `docs/UI_EDITOR_KIT_SURFACE_PANEL_DRAG_ARCHITEKTUR.md` beschreibt aktuelles Kit-/BBM-Inventar, neutrales Surface-Zielmodell, Kit-vs-Host-Trennung, Sicherheitsgrenzen und Folgepakete G37 ff.; es wurde keine Produktivlogik aktiviert.
- Die UI-Editor-kit Surface-Runtime ist in BBM ueber eine reine Renderer-Bridge pruefbar: `src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js` zeigt relativ auf die installierte Kit-Runtime, und der Bridge-Test validiert Surface-Typen sowie `ui-screen`-/`pdf-page`-Beispielmodelle. Es gibt keine Launcher-Nutzung, keine UI-/PDF-/Canvas-/Drag-Aktivierung, keine Persistenz und keine neue Scope-Freigabe.
- Der erste read-only SurfaceAdapter-Pilot fuer `restarbeiten.ui.main` ist vorbereitet: `src/renderer/uiEditor/surfaceAdapters/restarbeitenMainSurfaceAdapter.js` baut aus vorhandener Registry und aktuellem LayoutState ein neutrales `ui-screen`-Surface-Modell und validiert es ueber die Surface-Runtime-Bridge. Es gibt keine Launcher-Nutzung, keine DOM-Vermessung, keine Drag-/PDF-/Canvas-Aktivierung, keine Persistenz und keine neue Scope-Freigabe.
- Die UI-Editor-kit DragRuntime ist in BBM ueber eine reine Renderer-Bridge pruefbar: `src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js` zeigt relativ auf die installierte Kit-Runtime, und der Bridge-Test validiert Bounds, Delta, Apply, Clamp, Ergebnisbau und Coordinate-Systems. Es gibt keine Launcher-Nutzung, keine DOM-/Pointer-/Maus-Anbindung, keine echte Verschiebung, keine Persistenz und keine neue Scope-Freigabe.
- Die Panel-/Drag-Baseline im BBM-Launcher ist testseitig abgesichert: Das bestehende Preview-Panel bleibt initialisierbar, oeffnet/schliesst ueber die vorhandene Launcher-Logik, normalisiert Positionen defensiv im Viewport, behaelt Hidden-Elements-Button/Popover bei und nutzt die DragRuntime noch nicht produktiv. Es gibt keine UI-, Event-, Persistenz-, PDF-, Canvas-, Plan- oder Registry-Aenderung.
- Die reine Preview-Panel-Positionsberechnung im BBM-Launcher laeuft kontrolliert ueber `buildDragResult(...)` aus der UI-Editor-kit DragRuntime-Bridge. DOM-/Event-Anbindung, Startpositionsmessung, Style-Setzen, Reset, Open/Close und Hidden-Elements-Panelbestandteile bleiben Host-/Launcher-Aufgabe; es gibt keine neue UI, Persistenz, Registry-, PDF-, Canvas- oder Plan-Aktivierung.
- Die Panel-Drag-Sichtpruefung nach der DragRuntime-Umstellung ist abgeschlossen: In der lokalen Electron-DEV-App wurden UI-Editor-Button, Panel-Oeffnen, Panel-Drag, Viewport-Begrenzung, Panel-Reset, Schliessen/Wieder-Oeffnen und Hidden-Elements-Bereich sichtbar geprueft. Die DragRuntime bleibt auf Rechenlogik begrenzt; DOM-/Event-Anbindung bleibt im Host/Launcher. Es gibt keine neue UI-Funktion, Persistenz, Registry-, PDF-, Canvas- oder Plan-Aktivierung.
- Die Preview-Panel-Positionsberechnung im BBM-Launcher nutzt jetzt den PanelRuntime-Panel-Drag-Helper ueber `src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js`: `calculatePanelDragPosition(...)` kapselt die Rechenlogik, die DragRuntime bleibt intern im UI-Editor-kit. DOM-/Event-Anbindung, Startpositionsmessung, Style-Setzen, Reset, Open/Close und Hidden-Elements bleiben Host-/Launcher-Aufgabe; es gibt keine neue UI, Persistenz, Registry-, PDF-, Canvas- oder Plan-Aktivierung.
- Der Panel/Drag-Stand ist als Referenz abgeschlossen: `docs/UI_EDITOR_PANEL_DRAG_REFERENZSTAND.md` dokumentiert Datenfluss, Funktionen, Host-/Kit-Trennung, Sicherheitsgrenzen, Nicht-Ziele und Testreferenzen. G47 aendert keine Produktivlogik und fuehrt keine neue UI-, Persistenz-, Registry-, PDF-, Canvas- oder Plan-Funktion ein.
- PDF-/Plan-Surfaces sind read-only als BBM-Adapter-Skelett vorbereitet: `src/renderer/uiEditor/surfaceAdapters/pdfPlanSurfaceAdapter.js` erzeugt leere neutrale `pdf-page`- und `plan`-Modelle und validiert sie ueber die SurfaceRuntime-Bridge. Es gibt keine Launcher-Produktivnutzung, keine PDF-/Canvas-Renderaenderung, keinen Drag, keine Persistenz, keine Registry-Aenderung und keine Fachlogik.
- Der SurfaceAdapter-Katalog ist read-only vorbereitet: `src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js` listet ausschliesslich `restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`, baut/validiert Modelle ueber die SurfaceRuntime-Bridge und blockiert unbekannte SurfaceIds ohne Default- oder Wildcard-Freigabe.
- Der SurfaceAdapter-Katalog ist als read-only Referenzstand abgeschlossen: `docs/UI_EDITOR_SURFACE_ADAPTER_REFERENZSTAND.md` dokumentiert vorhandene Adapter, bekannte SurfaceIds, blockierte unbekannte SurfaceIds, Datenfluss, Sicherheitsgrenzen, Nicht-Ziele und moegliche Folgepakete.
- Der BBM-Launcher kann den SurfaceAdapter-Katalog read-only testseitig verwenden: `buildReadonlySurfaceModelForLauncher(surfaceId, input)` ruft bekannte SurfaceModelle ab und blockiert unbekannte SurfaceIds, ohne sichtbare UI-, Panel-, Drag-, Persistenz-, PDF-/Canvas-/Plan- oder Produktivnutzung zu aktivieren.
- Die Surface-Rechte-/Policy-Schicht ist read-only vorbereitet: `surfacePolicy.js` erlaubt bekannte SurfaceIds nur lesend, haelt `visibleInEditor`, `canDrag`, `canResize` und `canPersist` auf `false`, blockiert unbekannte SurfaceIds/Wildcards vollstaendig und bindet den SurfaceAdapterCatalog defensiv an diese Lesefreigabe.
- Der erste sichtbare Surface-Pilot ist read-only vorbereitet: `restarbeiten.ui.main` darf als kompakte SurfaceInfo im bestehenden Editorpanel erscheinen; PDF-/Plan-Surfaces bleiben unsichtbar, es gibt keine Surface-Liste, keine Auswahl, keine Bearbeitungsbuttons, keinen Drag, kein Resize und keine Persistenz.
- Die SurfaceInfo im Editorpanel ist als read-only Referenzstand abgeschlossen: `docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md` dokumentiert sichtbaren Pilot, nicht sichtbare Surfaces, Policy-Grenzen, Datenfluss, Sicherheitsgrenzen und Nicht-Ziele. Es wurde keine neue Produktivlogik aktiviert.
- Das read-only Surface-Auswahlmodell ist vorbereitet: `surfaceSelectionModel.js` baut aus SurfaceAdapterCatalog plus SurfacePolicy ein Modell mit aktuell nur `restarbeiten.ui.main`; PDF/Plan, unbekannte SurfaceIds und Wildcards bleiben ausgeschlossen. Es gibt keine sichtbare Auswahl und keine Launcher-Produktivnutzung.
- Die Surface-Auswahl ist read-only im bestehenden Editorpanel sichtbar: `BbmUiEditorRuntimeLauncher.js` nutzt `buildReadonlySurfaceSelectionModel(...)` nur fuer eine kompakte Anzeige von `restarbeiten.ui.main`/`Restarbeiten`. Es gibt keine Umschaltung, keine Dropdown-/Listen-UI, keine weitere SurfaceId, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.
- Die Surface-Auswahl im Editorpanel ist als read-only Referenzstand abgeschlossen: `docs/UI_EDITOR_SURFACE_SELECTION_READONLY_REFERENZSTAND.md` dokumentiert sichtbare Grenze, nicht sichtbare Surfaces, Policy-Grenzen, Datenfluss, Sicherheitsgrenzen und Nicht-Ziele. Es wurde keine neue Produktivlogik aktiviert.
- Der SurfaceSelection-State ist read-only vorbereitet: `surfaceSelectionState.js` beschreibt intern `selectedSurfaceId`, verfuegbare und blockierte SurfaceIds sowie blockierte Auswahlwuensche. Aktuell kann nur `restarbeiten.ui.main` ausgewaehlt sein; PDF/Plan, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert. Es gibt keine echte Umschaltung, keine UI-Aenderung und keine Persistenz.
- Der SurfaceSelection-State wird im BBM-Launcher read-only verwendet: Die bestehende kompakte Surface-Auswahl und SurfaceInfo gehen intern vom State aus, sichtbar bleibt nur `restarbeiten.ui.main`/`Restarbeiten`; PDF/Plan, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert. Es gibt keine echte Umschaltung, keine neue UI-Struktur, keine Bearbeitung, kein Drag, kein Resize und keine Persistenz.
- Der Launcher-State-Stand ist als read-only Referenz abgeschlossen: `docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md` dokumentiert Datenfluss, sichtbare Grenze, internen State, blockierte SurfaceIds, Sicherheitsgrenzen und Folgepakete. G60 aendert keine Produktivlogik, keine sichtbare UI, keine Surface-Freigabe, keinen Drag, kein Resize und keine Persistenz.
- Das Surface-Umschaltungsmodell ist read-only vorbereitet: `surfaceSwitchModel.js` prueft Wechselwuensche defensiv ueber den bestehenden SurfaceSelection-State. Aufloesbar bleibt nur `restarbeiten.ui.main`; PDF/Plan, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert. Es gibt keine echte Umschaltung, keine Launcher-Code-Aenderung, keine sichtbare UI, keinen Drag, kein Resize und keine Persistenz.
- Der SurfaceSwitch-read-only Stand ist als Referenz abgeschlossen: `docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md` dokumentiert erlaubte und blockierte Wechselziele, Datenfluss, Sicherheitsgrenzen und Folgepakete. G62 aendert keine Produktivlogik, keine sichtbare UI, keine Launcher-Produktivintegration, keine echte Umschaltung, keinen Drag, kein Resize und keine Persistenz.
- Der Launcher verwendet das SurfaceSwitch-Modell read-only intern: `BbmUiEditorRuntimeLauncher.js` fuehrt Wechselwuensche ueber `buildReadonlySurfaceSwitchResultForLauncher(...)` und resolved weiterhin nur `restarbeiten.ui.main`. Die sichtbare Surface-Auswahl `Restarbeiten` und die SurfaceInfo bleiben unveraendert; PDF/Plan, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert. Es gibt keine echte Umschaltung, keine neue UI, keinen Drag, kein Resize und keine Persistenz.
- Der Launcher verwendet den SurfaceSwitch-Command read-only intern: `BbmUiEditorRuntimeLauncher.js` fuehrt Wechselwuensche ueber `handleReadonlySurfaceSwitchRequestForLauncher(...)` und resolved weiterhin nur `restarbeiten.ui.main`. Die sichtbare Surface-Auswahl `Restarbeiten` und die SurfaceInfo bleiben unveraendert; PDF/Plan, unbekannte SurfaceIds, `*` und leere IDs bleiben blockiert. Es gibt keine echte Umschaltung, keine neue UI, keinen Drag, kein Resize und keine Persistenz.
- Der SurfaceSwitch-Command im Launcher ist als read-only Referenzstand abgeschlossen: `docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_LAUNCHER_REFERENZSTAND.md` dokumentiert Launcher-Datenfluss, Command-/Request-Verhalten, sichtbare UI-Grenze, Sicherheitsgrenzen und Folgepakete. G68 aendert keine Produktivlogik, keine sichtbare UI, keine Launcher-Produktivintegration, keine echte Umschaltung, keinen Drag, kein Resize und keine Persistenz.
- Der gesamte read-only Surface-Steuerungsstand ist als Gesamt-Referenz abgeschlossen: `docs/UI_EDITOR_SURFACE_READONLY_GESAMT_REFERENZSTAND.md` dokumentiert Komponenten, Gesamtdatenfluss, sichtbare UI-Grenze, erlaubte und blockierte SurfaceIds, Sicherheitsgrenzen und Folgepakete. G69 aendert keine Produktivlogik, keine sichtbare UI, keine Launcher-Produktivintegration, keine echte Umschaltung, keinen Drag, kein Resize und keine Persistenz.

**Noch offen**
- weitere kleine Nachweise sinnvoll
- weitere Altpfade und Restmischzonen vorhanden
- Konsolidierung ist noch nicht Endabschluss
- naechstes Restarbeiten-Paket fachlich getrennt planen, bevor Ausgabe/PDF/Notizen/Diktat ueber M1-Stubs hinaus umgesetzt werden
- fachliche Sichtpruefung der Restarbeiten-Edit-Preview im lokalen Electron-DEV-Kontext
- Spaeteren versionierten Produktiv-/Release-Bezug fuer das externe UI-Editor-kit als separates Folgethema klaeren
- Weitere Auslagerung der Kit-Panel-Runtime im BBM-Launcher separat planen; dabei DOM-Grenzen, Drag-Abgrenzung und Electron-Sichtpruefung ausdruecklich trennen.
- SurfacePolicy-Folgeschritte getrennt halten: G52 bereitet nur die read-only Rechte-/Policy-Schicht vor; eine sichtbare Surface-Auswahl, Editor-Freigabe, Drag-/Resize-Freigabe, Persistenzfreigabe oder weitere SurfaceId-Freigabe braucht jeweils ein eigenes Folgepaket.
- SurfaceInfo-/SurfaceSelection-Folgeschritte getrennt halten: G54 schliesst den G53-Stand als Referenz ab; G55 bereitet das read-only Auswahlmodell vor; G56 macht daraus nur die kompakte read-only Anzeige fuer `restarbeiten.ui.main`; G57 schliesst diesen sichtbaren Stand als Referenz ab; G58 bereitet den internen read-only State vor; G59 nutzt diesen State im Launcher nur als interne read-only Quelle; G60 schliesst diesen Launcher-State-Stand dokumentarisch ab; G61 bereitet nur ein defensives read-only Umschaltungsmodell vor; G62 schliesst diesen SurfaceSwitch-Stand dokumentarisch ab; G63 nutzt das SurfaceSwitch-Modell im Launcher nur intern read-only. PDF/Plan, weitere SurfaceIds, echte Umschaltung, Bearbeitung, Drag, Resize und Persistenz bleiben eigene Folgepakete.
- SurfaceInfo-/SurfaceSelection-Folgeschritte getrennt halten: G54 schliesst den G53-Stand als Referenz ab; G55 bereitet das read-only Auswahlmodell vor; G56 macht daraus nur die kompakte read-only Anzeige fuer `restarbeiten.ui.main`; G57 schliesst diesen sichtbaren Stand als Referenz ab; G58 bereitet den internen read-only State vor; G59 nutzt diesen State im Launcher nur als interne read-only Quelle; G60 schliesst diesen Launcher-State-Stand dokumentarisch ab; G61 bereitet nur ein defensives read-only Umschaltungsmodell vor; G62 schliesst diesen SurfaceSwitch-Stand dokumentarisch ab; G63 nutzt das SurfaceSwitch-Modell im Launcher nur intern read-only; G66 schliesst den Request-/Command-Referenzstand dokumentarisch ab. PDF/Plan, weitere SurfaceIds, echte Umschaltung, Bearbeitung, Drag, Resize und Persistenz bleiben eigene Folgepakete.
- Surface-/Panel-/Drag-Folgeschritte behalten den G64-Abschluss als Dokumentationsmeilenstein: `docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md` schliesst den Launcher-Referenzstand ab; sichtbare UI, Drag, Resize, Persistenz und echte Umschaltung bleiben dabei unveraendert.
- SurfaceSwitch-Request/Command-Folgeschritt vorbereiten: G65 fuegt einen read-only Handler fuer SurfaceSwitch-Wuensche hinzu; nur `restarbeiten.ui.main` bleibt erlaubt und `changed` bleibt false.
- Hidden-Elements-Folgeschritte getrennt halten: G19 Kit-ViewModel, G20 BBM Importvertrag/Bridge, G21 kompakter Button, G22 Popover, G23 Persistenz-Trennschnitt, G24 Layout-State-Lesen, G25 ChangeRequest-Modell, G26 HostAdapter-Dry-Run, G27 Persistenz-Vorbereitung, G28 Speicherort-/Freigabeentscheidung, G29 technische Speicher-Modellvorbereitung, G30 validierter HostAdapter-Dry-Run, G31 Pilot-Persistenz fuer `restarbeiten.ui.main`, G32 Restore-Absicherung, G33 Pilot-Ruecksetzpfad, G34 Scope-Freigabe-Policy und G35 Referenzabschluss sind erledigt; weitere echte Scope-Freigaben bleiben separat.

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

## G117: Host-Kontext-Statusmodell

- Die sichtbare Restarbeit-Kontextanzeige wird im Renderer aus einem lokalen
  Statusmodell abgeleitet.
- Echte Host-Daten bleiben weiterhin Aufgabe des spaeteren Host-Pakets.

## G118: Host-Kontext-Normalisierung

- Der lokale Host-Kontext wird intern normalisiert, bevor die read-only
  Anzeige ihn verwendet.
- Es bleibt bei einer Vorstufe ohne echte Host-Uebergabe und ohne neue
  Persistenz.

## G119: Host-Kontext-Abschlusscheck

- Der vorbereitete Host-Kontext bleibt als Abschlussstand dokumentiert.
- Es folgt keine neue Funktion und keine neue Freigabe.

## G120: Optionale Host-Kontext-Aufnahme

- Der Launcher kann optional einen Host-Kontext annehmen und normalisieren.
- Ohne Uebergabe bleibt der Default unveraendert und read-only.

## G121: Host-Kontext-UEbergabe Freigabeentscheidung

- Die spaetere Host-Uebergabe fuer `Hinweis / Infotext` bleibt nur als
  Freigabeentscheidung dokumentiert.
- Quelle, Zielkontext, `normalizeHostContextStatus` und blockierte
  Speicherwege sind klar eingegrenzt; eine Umsetzung folgt erst spaeter.

## G122: Host-Kontext-UEbergabe aus Restarbeiten anschliessen

- Der Restarbeiten-Host liefert den Host-Kontext nur bei eindeutiger
  Restarbeit an den Launcher weiter.
- Default, Speicherstatus und read-only Grenzen bleiben unveraendert.

## G123: Speicherbereitschaft anzeigen, Speichern gesperrt lassen

- Der UI-Editor zeigt fuer den lokalen Hinweis-/Infotext-Entwurf, ob
  Host-Kontext, `projectId`, `restarbeitId`, Zielkontext, Ziel-Surface,
  Elementtyp und Hinweistext technisch/fachlich speicherbereit waeren.
- Die Anzeige bleibt aus lokalen Daten abgeleitet; `Schreibweg freigegeben`
  bleibt `nein`, `Speichern` bleibt `gesperrt`, `persisted: false` bleibt
  sichtbar.
- Der Launcher liest den Host-Kontext beim Oeffnen ueber den bestehenden
  CoreShell-Resolver neu, damit nachgeladene Restarbeiten-Auswahl sichtbar
  wird.
- Es gibt keinen `restarbeiten:createNote`-Aufruf, keinen
  `window.bbmDb.restarbeitenCreateNote`-Aufruf und keine IPC-/DB-Persistenz.

## G124: Create-Note-Payload als Vorschau anzeigen

- Der UI-Editor zeigt im bestehenden Speicherbereich eine read-only
  Create-Note-Payload-Vorschau fuer den spaeteren Restarbeiten-Notizweg.
- Die Vorschau wird nur aus normalisiertem Host-Kontext, aktuellem Hinweistext
  und festen Sperrstatuswerten gebildet.
- `Ziel: restarbeiten:createNote`, `restarbeitId`, `noteText`, `projectId`,
  `previewOnly: true`, `persisted: false` und `Schreibweg freigegeben: nein`
  bleiben reine Anzeige.
- Es gibt keinen Speicheraufruf, keinen DB-/IPC-Schreibweg, keinen Submit und
  keine Aenderung am `UI-Editor-kit`.

## G125: Schreibfreigabe-Gate vorbereitet

- Der UI-Editor zeigt im bestehenden Speicherbereich ein zentrales
  Schreibfreigabe-Gate fuer den spaeteren Restarbeiten-Notizweg.
- Die Gate-Entscheidung trennt `Payload vollständig` und
  `technisch/fachlich speicherbereit` von der tatsaechlichen Freigabe.
- Fuer G125 bleibt das Gate fest geschlossen:
  `Schreibfreigabe-Gate: geschlossen`, `Freigabequelle: nicht gesetzt`,
  `Schreibweg freigegeben: nein`, `Button aktivierbar: nein`,
  `persisted: false` und `previewOnly: true`.
- Es gibt keinen Speicheraufruf, keinen DB-/IPC-Schreibweg, keinen Submit,
  kein Default-true, keine Wildcard und keine Aenderung am `UI-Editor-kit`.

## G126: Schreibfreigabe-Konfiguration vorbereitet

- Das Schreibfreigabe-Gate nutzt jetzt eine zentrale lokale Konfiguration als
  ausdrueckliche Freigabequelle.
- Fuer G126 bleibt diese Konfiguration geschlossen:
  `Freigabequelle: Konfiguration`, `Freigabewert: false` und
  `writeReleaseEnabled: false`.
- Vollstaendige Payload, gueltiger Host-Kontext, gueltiger Hinweistext,
  vorhandene `restarbeitId` und DEV-Kontext oeffnen das Gate nicht.
- Es gibt keinen Speicheraufruf, keine ENV-Aktivierung, keinen DB-/IPC-
  Schreibweg, keinen Submit, kein Default-true, keine Wildcard und keine
  Aenderung am `UI-Editor-kit`.

## G127: blockierter Speicher-Handler vorbereitet

- Der UI-Editor hat im BBM-Launcher einen lokalen Speicher-Handler fuer
  Hinweis-/Infotext-Entwuerfe, der ausdruecklich blockiert bleibt.
- Direkte Handler-Aufrufe liefern nur `ok: false`, `blocked: true`,
  `reason: Schreibfreigabe-Gate geschlossen`, `persisted: false` und
  `previewOnly: true`.
- Im Speicherbereich ist der Handler als vorbereitet/blockiert sichtbar,
  inklusive Blockiergrund und letztem Speicherergebnis.
- Vollstaendige Payload, gueltiger Host-Kontext, vorhandene `restarbeitId`,
  gueltiger Hinweistext und DEV-Kontext oeffnen weder Gate noch Handler.
- Es gibt keinen Speicheraufruf, keine ENV-Aktivierung, keinen DB-/IPC-
  Schreibweg, keinen Submit, kein Default-true, keine Wildcard und keine
  Aenderung am `UI-Editor-kit`.

## G128: Save-Adapter vorbereitet

- Der UI-Editor beschreibt im BBM-Launcher den spaeteren Save-Adapter fuer
  den Restarbeiten-Notizweg als lokale Dry-Run-Vorbereitung.
- Sichtbar/testbar sind `Adapter: vorbereitet`,
  `Zieladapter: Restarbeiten-Notizweg`,
  `Zielmethode: window.bbmDb.restarbeitenCreateNote`,
  `Zielkanal: restarbeiten:createNote` und `Ausfuehrung: blockiert`.
- Der bestehende blockierte Speicher-Handler nutzt den Descriptor nur als
  Status-/Sicherheitsinformation; die Ausfuehrung bleibt blockiert.
- Vollstaendige Payload, gueltiger Host-Kontext, vorhandene `restarbeitId`,
  gueltiger Hinweistext, DEV-Kontext und vorbereiteter Adapter oeffnen weder
  Gate noch Handler.
- Es gibt keinen tatsaechlichen Speicheraufruf, keine ENV-Aktivierung, keinen
  DB-/IPC-Schreibweg, keinen Submit, kein Default-true, keine Wildcard und
  keine Aenderung am `UI-Editor-kit`.
