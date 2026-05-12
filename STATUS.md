# STATUS.md â€” BBM-Produktiv

## Zweck
Diese Datei hÃ¤lt den tatsÃ¤chlichen Fortschritt fest.

Sie ergÃ¤nzt:
- `AGENTS.md` = Arbeitsregeln
- `PLAN.md` = Soll-Ablauf / Meilensteine

`STATUS.md` beschreibt den Ist-Stand:
- was bereits erledigt ist,
- woran zuletzt gearbeitet wurde,
- was als NÃ¤chstes dran ist,
- wo es Hindernisse gibt.

---

## Aktueller Gesamtstand

- layoutTools-Grundmodul ist als DEV-only Basis nutzbar und dokumentiert:
  - Pilot 1: TOP-Liste (UI/PDF) inkl. Zonen, live/persist/reset, UI/PDF getrennt
  - Pilot 2: Teilnehmerliste (PDF) inkl. Zonen, live/persist/reset (inkl. Anwesend/Verteiler "x")
  - echte PDFs bleiben ohne gruene Markierungen; DevTools oeffnen nicht automatisch
- Die layoutTools-Aktivierung wird jetzt zentral ueber die DEV-Einstellung `Layout-Kalibrierung aktivieren` geschaltet:
  - nur im DEV-Build sichtbar
  - wirkt appweit auf UI-TOP-Liste, PDF-Layoutvorschauen und Auto-Tabellen
  - gespeicherte Layoutwerte bleiben beim Ausschalten erhalten
  - echte PDF-Erzeugung bleibt ungebremst und markerfrei
- Der erste DEV-only Schritt fuer das TOP-Layout-Feintuning ist umgesetzt:
  - die TOP-Liste kann im DEV-Build jetzt Layout-Zonen fuer Nummernblock, Textblock und Metablock anzeigen
  - die aktive Zone wird gruen markiert
  - der Header zeigt im DEV-Layoutmodus eine kleine Layout-Toolbar mit der aktiven Zone oder dem Hinweis `Bereich waehlen`
  - im STABLE-Pfad bleibt die Zusatz-UI verborgen und nicht bedienbar
- Der naechste DEV-only Layout-Schritt ist vorbereitet:
  - die Header-Toolbar zeigt fuer die aktive Zone Dummy-Regler fuer Breite, Innen und Schrift
  - die Regler koennen die laufende UI leicht veraendern, speichern aber nichts dauerhaft
- Der Metablock bekommt jetzt die erste echte Live-Layout-Umstellung:
  - `Breite` wirkt im DEV-Modus nur fuer die aktive Zone `Metablock`
  - die Breite wird ohne Speicherung nur im laufenden Fenster um 5 px pro Klick angepasst
- Die Metablock-Breite kann jetzt ueber den bestehenden `tableLayouts`-Weg gespeichert und zurueckgesetzt werden:
  - `Speichern` schreibt nur die UI-Breite der aktuellen Metablock-Zone
  - `Reset` holt den Tabellenstandard zurueck
  - andere Zonen, PDF, Firmenliste und Teilnehmerliste bleiben unveraendert
- Der Metablock-Innenabstand kann jetzt im DEV-Modus ebenfalls live, per Speicher und per Reset gesteuert werden:
  - `Innen` wirkt nur fuer die aktive Zone `Metablock`
  - Breite, Innenabstand und Schriftgroesse werden gemeinsam ueber `tableLayouts` gespeichert
  - `Reset` stellt alle drei Werte auf den Standard zurueck
- Der Nummernblock kann jetzt im DEV-Modus ebenfalls live, per Speicher und per Reset gesteuert werden:
  - `Breite`, `Innen` und `Schrift` wirken fuer die aktive Zone `Nummernblock`
  - Speicherung und Reset laufen ueber denselben `tableLayouts`-Weg wie beim Metablock
- Der Textblock kann jetzt im DEV-Modus ebenfalls live, per Speicher und per Reset gesteuert werden:
  - `Breite` bleibt bewusst ein Restbereich und ist im DEV-Toolbar-Regler deaktiviert
  - `Innen` und `Schrift` wirken fuer die aktive Zone `Textblock`
- Aufraeum-/Absicherung: die zusaetzlichen Padding/Font-Layout-Variablen sind jetzt strikt DEV-only und werden in STABLE nicht angewendet (keine sichtbare STABLE-Aenderung).
- DEV-only Vorbereitung: In der Print-HTML-Vorschau der TOP-Liste sind jetzt drei PDF-Layout-Zonen (Nummernblock/Textblock/Metablock) per Click aktivierbar und gruen markierbar, ohne Layout-Shift und ohne dass Markierungen in den echten PDF-Export gelangen.
- DEV-only PDF-Feintuning (live, ohne Speichern): In der Print-HTML-Vorschau kann jetzt die Breite des PDF-Metablocks per +/- live in 1mm-Schritten angepasst werden (nur in der laufenden Vorschau).
- Bugfix: PDF-Metablock-Breite wird beim Speichern jetzt korrekt in `protokoll_tops` (PDF-Wert) persistiert und beim erneuten Oeffnen/Neustart wieder angewendet.
- Naechster offener Schritt: die DEV-only Markierung und die neuen Live-Werte einmal im laufenden UI gegenpruefen und erst danach weitere Layout-Schritte planen.
- Tabellenlayout-Registrierungsregel dokumentiert.
- Tabellenlayout-Inventar angelegt.
- Tabellenlayout-Registry mit technischer Tabellenklassifizierung erweitert.
- Entstehungsprozess neuer Tabellen fuer das Tabellenlayout dokumentiert.
- `protokoll_participants` ist im technischen Verzeichnis und im Tabellenlayout-Editor registriert; UI/PDF bleiben vorerst Vorschau.
- Der interne Tabellenlayout-Editor zeigt die Registry jetzt als feste Spiegelansicht mit getrennten UI- und PDF-Bereichen; gespeicherte Zusatzspalten werden dort nicht in die Spaltenstruktur hineingezogen.

- Der Ausgabe-Dialog trennt die Druckarten jetzt fachlich korrekter:
  - Protokoll drucken
  - PDF-Vorschau Ã¶ffnen
  - Firmenliste
  - ToDo-Liste
  - TOP-Liste
  - unbekannte Druckmodi werden nicht mehr still auf Protokoll zurÃ¼ckgefÃ¼hrt
  - TOP-Liste zeigt alle TOPs inkl. erledigter und aller TOP-Arten
  - ToDo-Liste zeigt projektweit nur noch offene echte ToDos
  - ToDo-Druck hat einen optionalen Verantwortlichenfilter
  - Firmenlisten drucken den aktuellen Projektstand ohne geschlossene Protokollauswahl
  - gespeicherte Firmenlisten werden nicht mehr als funktionale Ausgabeart angeboten
  - der Druckart-Einstieg akzeptiert jetzt auch den Projektkontext aus `router.context`, damit TOP-Liste nicht wegen eines zu engen Guards gesperrt bleibt
  - TOP-Liste ist im Druckart-Dialog an den vorhandenen Router-Pfad `openTopListAllPrintPreview` angeschlossen
- Der Protokoll-Pilot `protokoll_tops` ist jetzt kontrolliert an den Table-Layout-Resolver angebunden:
  - `printData.js` liefert den resolved Payload fuer den Druckweg mit
  - `printApp.js` und `PrintShell.js` lesen Layoutdaten nur, wenn sie im Payload enthalten sind
  - die echte Protokoll-TOP-Liste liest gespeicherte UI-Layoutwerte jetzt ebenfalls ueber den bestehenden IPC-/Resolver-Pfad
  - der PDF-Druckweg nutzt jetzt die gespeicherten PDF-Werte getrennt von der UI-Liste
  - ohne gespeichertes Layout bleibt die Anzeige exakt beim bisherigen Standard
  - `TopsList` hat einen optionalen Layout-Hook vorbereitet, bleibt aber im sichtbaren Standardpfad
  - geprueft mit `npm test`
- Das Tabellenlayout-System arbeitet jetzt generisch ueber `columns`:
  - der Editor erzeugt die Felder aus der Spaltendefinition
  - `projektverwaltung / project_firms` ist als registrierter naechster Pilot vorhanden
  - `protokoll_tops` bleibt rueckwaertskompatibel
- Die Projekt-Firmenliste nutzt ihre gespeicherten UI-Spaltenbreiten jetzt ueber den Tabellenlayout-Resolver:
  - `ProjectFirmsView.js` laedt `moduleId=projektverwaltung`, `tableKey=project_firms`, `orientation=portrait` ueber `tableLayoutsGetOne`
  - der PDF-Anschluss fuer `project_firms` bleibt bewusst getrennt
- Audit fuer den naechsten Tabellenlayout-Kandidaten erstellt; keine Codeaenderung.
- Teilnehmer im Protokoll als naechsten Tabellenlayout-Kandidaten geprueft; noch kein produktiver Anschluss.
- Scope-Doku fuer den Firmenlisten-Pilot erstellt; keine Codeaenderung.
- Contract-Doku fuer `project_firms` Tabellenlayout erstellt; keine Codeaenderung.
- Naechster offener Schritt: weitere Tabellen nur dann anschliessen, wenn ihre Registry-, Editor- und Preview-Daten sauber bereitstehen.
- Der interne Tabellenlayout-Editor startet jetzt standardmÃ¤ÃŸig im Vollbildmodus und hat oben rechts einen Vollbild-Schalter fuer mehr ArbeitsflÃ¤che.
- Der erste interne Tabellenlayout-Editor fuer `protokoll_tops` ist jetzt im Technik-Dialog angehaengt:
  - Zugang nur ueber `Einstellungen > Entwicklung > Technik > Tabellenlayouts`
  - Laden, Aendern, Speichern und Zuruecksetzen laufen fuer `moduleId=protokoll`, `tableKey=protokoll_tops` und die jeweilige Orientierung ueber die vorhandenen `tableLayouts`-IPC-Endpunkte
  - die Quelle wird im Editor als Standardlayout, gespeichertes Layout oder Fallback angezeigt
  - die Layoutauswahl ist wieder fachlich korrekt modul- und tabellenbezogen, nicht projektbezogen
  - Modul- und Tabellenlisten kommen aus der bekannten Registry/Definition
  - aktuell sind dort `Protokoll / TOP-Liste / protokoll_tops`, `Protokoll / Teilnehmerliste / protokoll_participants` und `Projektverwaltung / Projekt-Firmenliste / project_firms` angemeldet
  - der frÃ¼here Projekt-/Besprechungsansatz im Editor wurde wieder entfernt
  - die Vorschau ist jetzt als feste Spiegelansicht mit getrennten UI- und PDF-Bereichen umgesetzt
  - der Editor nutzt jetzt ein nahezu vollflÃ¤chiges internes ArbeitsflÃ¤chen-Overlay
  - Layoutwerte werden vor dem Speichern validiert und defensiv normalisiert
  - UI-/PDF-Hinweise im Editor wurden klarer formuliert; `project_firms` und `protokoll_participants` sind PDF-seitig nur Vorschau, `protokoll_tops` ist produktiv angeschlossen
  - ungueltige technische Werte werden nicht gespeichert
  - kaputte gespeicherte Layouts fallen auf das Standardlayout der konkreten Tabelle zurueck
  - normale Navigation und sichtbare Protokoll-UI bleiben unveraendert
  - geprueft mit `npm test`
  - die Editor-Vorschau zeigt registrierte Testdaten statt echter Projekt- oder Besprechungsdaten
- Naechster offener Schritt: spaeter entscheiden, ob weitere Tabellen eigene Preview-Daten in der Registry bekommen.
- Der Table-Layout-Resolver fuer `protokoll_tops` ist jetzt als technische Grundlage vorhanden:
  - die zentrale Registry kennt den Pilot `protokoll_tops`
  - `getResolvedTableLayout(...)` liefert Standardlayout, gespeichertes Layout oder einen sicheren Fehler fuer unbekannte Tabellen
  - kaputtes JSON faellt auf das Standardlayout zurueck
  - portrait und landscape werden getrennt behandelt
  - geprueft mit `npm test`
- Naechster offener Schritt: den Resolver spaeter nur dort anschliessen, wo er fachlich wirklich gebraucht wird, ohne UI oder Druckoptik vorwegzunehmen.
- Der Kurztext von neu angelegten Level-1-Titeln wird jetzt nicht mehr beim Blur verworfen:
  - die SharedEditbox-Kette delegiert die Kurztext-Limitierung und Counter-Aktualisierung wieder korrekt an die Editbox
  - Kurztext-Input landet sofort im Draft und in der Live-Liste
  - Blur speichert den aktuellen Titel und laesst ihn im Editor stehen
  - uebernommene Level-1-Titel bleiben read-only und ohne operative Meta
- Geprueft mit `npm test`.
- Der Level-1-Titel wird jetzt wieder sauber gespeichert:
  - Kurztext-Blur ueberschreibt den echten Titel nicht mehr mit einem alten Draft
  - nach erfolgreichem Save wird der geaenderte Titel direkt im Store und in der Liste gespiegelt
  - uebernommene Level-1-Titel bleiben read-only und ohne operative Meta
- Geprueft mit `npm test`.
- Die Protokoll-Editbox speichert jetzt automatisch:
  - Kurztext, Langtext, Haken und Meta-Felder laufen ueber den bestehenden Save-Pfad
  - der sichtbare `Speichern`-Button ist aus der Workbench ausgeblendet
  - Debounce und Blur-Flush sind durch Tests abgesichert
  - geprueft mit `npm test`
- Naechster offener Schritt: manuelle Sichtpruefung der Auto-Save-UX im Protokollscreen auf dem Zielsystem.
- Die TOP-Liste im Protokollscreen ist optisch lesbarer geworden:
  - TOP-Nummern und Kurztext wirken jetzt gleich gross
  - Liste, normale TOPs und Level-1-Titel sind farblich/helligkeitstechnisch besser getrennt
  - die Metaspalte ist breiter und Datumswerte erscheinen im Format `tt.mm.jjjj`
  - geprueft mit `npm test`
- Naechster offener Schritt: manuelle Sichtpruefung der TOP-Liste im Protokollscreen auf dem Zielsystem.
- Der alte Legacy-Protokollscreen `src/renderer/views/TopsView.js` ist entfernt; aktive Protokoll-Verdrahtung laeuft nur noch ueber `src/renderer/modules/protokoll/screens/TopsScreen.js`.
- Der TopsScreen-Diktatpfad ist wieder stabil:
  - `SharedEditboxCore` baut die Mikrofon-Buttons jetzt defensiv ein und faengt fehlende Label-Hosts ab
  - der TopsScreen crasht beim Rendern der Editbox nicht mehr
  - der kaputte `notoSans.css`-Importpfad in den Tops-Styles wurde korrigiert
  - die Diktat-Buttons nutzen jetzt die vorhandenen SVG-Assets `dictation-start.svg` und `dictation-stop.svg`
  - die Buttons sitzen direkt in der Zeile von Kurztext/Langtext neben der Restzeichenanzeige
  - bei fehlender Freischaltung werden sie gar nicht angezeigt
- Im Protokoll-Kontext ist die fachlich falsche Header-Belegung bereinigt:
  - die sichtbare Protokoll-Quicklane zeigt jetzt einen TOP-Filter statt der alten falsch belegten Header-Aktionen
  - der Filter schaltet zwischen `Alle`, `ToDo` und `Beschluss`
  - Sidebar, Druck-v2/Druckflow, Mail, PDF und Lizenzlogik blieben dabei unangetastet
- Das Settings-Zielkonzept ist jetzt als eigene Doku festgehalten:
  - [docs/settings-structure.md](docs/settings-structure.md) beschreibt die Zielstruktur fuer Allgemein, Eingabe & Erfassung, Ausgabe & Kommunikation, Module und Entwicklung
  - die Seite dient als fachliche Leitplanke fuer spaetere kleine Settings-Pakete
- Die Settings-Startseite ist jetzt sichtbar in Hauptgruppen gegliedert:
  - Allgemein, Eingabe & Erfassung, Ausgabe & Kommunikation, Module und Entwicklung stehen als eigene Ueberschriften auf der Startseite
  - die vorhandenen Kacheln bleiben erreichbar und werden nur in diese grobe Struktur einsortiert
- Die Legacy-Kachel `Profil & Druck` ist auf der Startseite aufgeteilt:
  - sichtbare Einstiege sind jetzt `Profil / Adresse`, `Ausgabe & Druck` und `Protokoll`
  - die drei Einstiege nutzen jeweils eigene schlanke Dialoge
- Der Einstieg `Profil / Adresse` hat jetzt einen eigenen schlanken Dialog:
  - er enthaelt nur Profil- und Adressfelder
  - Ausgabe-/Protokollfelder bleiben im bestehenden Legacy-Pfad fuer die anderen Einstiege
- Der Einstieg `Ausgabe & Druck` hat jetzt ebenfalls einen eigenen Dialog:
  - er enthaelt Footer, Ausgabeordner, Drucklayout und den Einstieg zu den Drucklogos
  - Protokoll- und Profilfelder bleiben ausserhalb dieses Dialogs
  - der sichtbare Startseiten-Einstieg laeuft nicht mehr ueber den grossen Legacy-Dialog
- Der Einstieg `Protokoll` hat jetzt ebenfalls einen eigenen Dialog:
  - er enthaelt nur Protokollbezeichnung, Vorbemerkung und den Schalter fuer die Ausgabe
  - der sichtbare Startseiten-Einstieg nutzt nicht mehr den grossen Legacy-Dialog
- Der alte Sammeldialog aus `SettingsView.js` ist entfernt:
  - `_createLegacySettingsContent(...)` wurde geloescht
  - die sichtbaren Startseiten-Einstiege laufen nur noch ueber die drei schlanken Dialoge
- Der alte sichtbare Sammelbegriff `Profil & Druck` wird im Startseitenfluss nicht mehr verwendet.
- Die Settings-Startseite wurde optisch beruhigt:
  - Gruppen sind als klar getrennte Bereiche mit kurzen Untertiteln dargestellt
  - leere bzw. noch nicht belegte Bereiche sind kompakter formuliert
  - die Kacheln sind ruhiger und weniger tabellenartig gestaltet
- Der sichtbare Einstieg `Archiv` steht jetzt in `Ausgabe & Kommunikation` statt in `Entwicklung`.
- Der globale Header zeigt jetzt links `BBM <Version>` und darunter den aktiven Kontext als `aktiv: <Modul> | <Projektnummer> - <Kurzbezeichnung>`.
  Rechts steht ein ruhiger Kunden-/Lizenztext aus den vorhandenen App-Settings; der alte `bereit:`-Statusblock ist aus der sichtbaren Anzeige entfernt.
  Im Projektkontext steht dort jetzt nicht mehr `Projekt-Arbeitsbereich`, sondern das aktive Modul `Protokoll`.
- Die sichtbaren Footer-Texte im Bereich `Profil & Druck` sind sprachlich vereinfacht:
  - `Footer Ort`/`Footer Datum`/`Footer Name 1/2` wurden zu kurzen, klaren Labels
  - der Toggle heisst jetzt `Profil-/Adressdaten im Footer verwenden`
  - die Settings-Schluessel und die Speicherlogik bleiben unveraendert
- Die sichtbaren Texte im Bereich `Druckinhalt` sind sprachlich geschaerft:
  - der Hinweis nennt jetzt Protokoll und PDF-Ausgabe
  - die Textgrenzen heissen jetzt `Textgrenzen fÃ¼r TOPs`
  - Kurztext-/Langtext-Grenzen werden als Eingabelaengen fuer TOPs beschrieben
- Der Legacy-Pfad `PDF-Logo` ist im UI deaktiviert:
  - die sichtbare PDF-Logo-Bearbeitung erscheint nicht mehr in `Profil & Druck`
  - `pdf.userLogo*` wird in der Ausgabe nicht mehr gerendert
  - der aktive Drucklogos-Pfad bleibt unveraendert
- Der aktive Drucklogos-Dialog ist sprachlich geschaerft:
  - der Einstieg heisst jetzt `Drucklogos verwalten`
  - die Slot-Karten sprechen von `Drucklogo 1/2/3`
  - die Bedienung nennt `Logo verwenden`, `Position horizontal` und `Position vertikal`
- Die alte Sammelmaske aus `SettingsView.js` ist entfernt:
  - die sichtbaren Startseiten-Einstiege laufen nur noch ueber die drei schlanken Dialoge
  - Drucklogos bleiben ueber den bestehenden Unterdialog erreichbar
- Projekt-Einstellungen behandeln `pdf.footerUseUserData` nicht mehr als steuerbare Projektoption:
  - der Projektsettings-Dialog speichert dieses Feld nicht mehr
  - der Projektsettings-IPC filtert es aus Whitelist und Patch
  - Altwerte im Projektsettings-Speicher bleiben technisch unkritisch, werden aber nicht mehr als Projektoption verwendet
  - neue Tests sichern den Filter im Projektsettings-IPC und den bereinigten Projektformular-Flow ab
- Projektbasierte Protokoll-Einstiege werden jetzt nicht mehr stillschweigend mit `showTops(null, ...)` aufgelÃ¶st:
  - genau eine offene Besprechung oeffnet den TopsScreen
  - keine offene Besprechung oeffnet die Besprechungsuebersicht als Startview mit Neuanlage-Einstieg
  - mehrere offene Besprechungen gehen als Datenintegritaetsfehler in die Besprechungsuebersicht
  - `TopsScreen` wird nur noch mit echter `meetingId` geladen
- Schliessen/Zurueck im TopsScreen fuehrt bei vorhandenem Projektkontext jetzt in den Projekt-Arbeitsbereich zurueck; ohne Kontext bleibt der sichere Fallback auf `showProjects()`.
- Der Move-Mode markiert im Protokoll jetzt keine direkten Nachkommen des verschobenen TOPs mehr als Ziel; der bekannte Zyklus-Fehler aus dem Domain-Check wird damit schon in der UI vermieden.
- Die Move-Mode-Darstellung unterscheidet jetzt Schiebling, erlaubte Ziele und gesperrte Ziele visuell klar:
  - Schiebling: orange Rand
  - erlaubtes Ziel: gruen nur beim aktiven Hover/Fokus
  - gesperrtes Ziel und direkte Nachkommen: rot schraffiert und nicht klickbar
- Die rote Schraffur fuer gesperrte Move-Ziele wurde feiner und etwas dezenter gezogen, ohne den blocked-Zustand zu verlieren.
- Kurztext- und Langtext-Felder im TOP-Editor loesen jetzt beim Verlassen einen Save des aktuellen Drafts aus; die Auswahl bleibt erhalten und blaue TOPs bleiben editierbar.
- NÃ¤chster offener Schritt: fachliche Sichtpruefung der neuen Besprechungsuebersicht/Startview im Projektkontext.
- Der Projekt-Arbeitsbereich oeffnet `Protokoll` jetzt wieder mit einem echten offenen Meeting-Kontext, wenn eines im Projekt vorhanden ist; andernfalls faellt der Einstieg in die Besprechungsuebersicht zurueck statt in einen leeren Tops-Start.
- Meilenstein externe Lizenz-App-Vorbereitung ist umgesetzt:
  - BBM registriert keine `license-admin:*`-IPCs mehr und startet keine Generator-/Customer-Setup-Registrierung aus `registerLicenseIpc`.
  - Preload exportiert keine Generator-/license-admin-Methoden mehr; aktive Kundenfunktionen (Status/Import/Delete/Request) bleiben.
  - Renderer zeigt keine Lizenzverwaltung/Kundenverwaltung mehr im Adminbereich; Entwicklerbereich bleibt unverÃ¤ndert erreichbar.
  - Uebergangsbereich `tools/license-app/` wurde angelegt inkl. Zielarchitektur-README und Extrakten (`licenseAdminService`, `licenseRecords`, `licenseIpc.reference`).
- NÃ¤chster offener Schritt: Extrakte in `tools/license-app/` spÃ¤ter in eigenstÃ¤ndige externe Lizenz-App Ã¼berfÃ¼hren.
- Admin-Lizenzverwaltung kann die erzeugte Antwortlizenz jetzt direkt als Outlook-Entwurf vorbereiten:
  - Neuer Button `Antwortlizenz per Outlook senden` im Lizenzeditor.
  - Sichtbarkeit nur fuer Vollversion + vorhandenen `license_file_path` mit `.bbmlic`.
  - Main-IPC `license-admin:send-response-license-mail` prueft Kunden-E-Mail, Dateipfad, Dateiendung und Datei-Existenz.
  - Outlook-Entwurf wird unter Windows via PowerShell/COM erstellt (`Outlook.Application`, `CreateItem`, `Attachments.Add`, `Display()`), ohne automatisches Senden.
  - Erfolgs-/Fehlermeldungen sind umgesetzt: `Outlook-Mail wurde vorbereitet.`, `Keine Kunden-E-Mail hinterlegt.`, `Antwortlizenz-Datei wurde nicht gefunden.`, `Outlook konnte nicht geÃ¶ffnet werden.`.
  - Fallback im UI bei Outlook-Fehler: `Ausgabeordner Ã¶ffnen` und `Mailtext kopieren`.
- NÃ¤chster offener Schritt: manuelle Endpruefung am Windows-Zielsystem mit installiertem Outlook (Entwurf anzeigen inkl. Anhang, ohne Auto-Send).
- Admin-Lizenzverwaltung dokumentiert den Machine-Setup-Lebenszyklus jetzt direkt am Vollversions-Lizenzdatensatz:
  - `Machine-Setup erstellen` speichert vor dem Build zuerst einen Vollversionsdatensatz (`license_edition=full`, `license_binding=machine`, `license_mode=full`) im aktuellen Kundenkontext.
  - Wenn diese Vorab-Speicherung nicht moeglich ist, wird klar abgebrochen mit `Vollversion muss vor Machine-Setup gespeichert werden.`.
  - Nach erfolgreichem Machine-Setup-Build werden im Lizenzdatensatz gespeichert: `setup_type=machine`, `setup_status=waiting_for_machine_id`, `setup_file_path`, `setup_created_at`.
  - Nach Mailtext-Uebernahme wird `setup_status=machine_id_received` gespeichert.
  - Nach erfolgreicher Antwortlizenz-Erzeugung wird `setup_status=response_license_created` gespeichert; `license_file_path` bleibt wie bisher erhalten.
  - In UI/Lizenzliste und Lizenzeditor gibt es jetzt den sichtbaren `Machine-Binding-Status` mit den 4 Statusstufen.
- NÃ¤chster offener Schritt: manuelle Endpruefung des kompletten Ablaufes (Vollversion speichern -> Machine-Setup -> Mailtext -> Antwortlizenz) gegen eine reale lokale Mutter-Datenbank.
- Admin-Lizenzverwaltung kann Machine-ID direkt aus Kunden-E-Mailtext uebernehmen:
  - Neuer Vollversions-Button `Lizenzanforderung aus E-Mail Ã¼bernehmen` im Lizenzformular.
  - Eingabebereich `Mailtext einfÃ¼gen` parst robust die Zeilen `Kunde`, `Kundennummer`, `Lizenz-ID`, `Machine-ID`, `App-Version` (case-insensitive, tolerant bei Leerzeichen, CRLF/LF).
  - Bei Erfolg meldet die UI `Lizenzanforderung erkannt.` und `Machine-ID wurde Ã¼bernommen.` und uebernimmt die Machine-ID in das Formular.
  - Bei Abweichung von Kundennummer oder Lizenz-ID erscheint die Warnung `Achtung: Die Lizenzanforderung passt mÃ¶glicherweise nicht zur geÃ¶ffneten Lizenz.` ohne Blockierung.
  - Wenn keine Machine-ID enthalten ist, erscheint `Keine Machine-ID im Mailtext gefunden.`.
  - Bestehender Ablauf bleibt unveraendert: Lizenz erstellen -> `.bbmlic` erzeugen -> Antwortlizenz zurueck an den Kunden.
- NÃ¤chster offener Schritt: manuelle Sichtpruefung im Adminbereich mit echtem Mailtext-Paste aus einer Kundenanfrage.
- Alter Machine-Setup-Lizenz-Startblock wurde entfernt:
  - `src/renderer/main.js` enthaelt keine `isMachineSetupWithoutLicense`-, `renderMachineSetupLicenseRequired`-, `renderMachineSetupLicenseFallback`- oder `MACHINE_SETUP_LICENSE`-Logik mehr.
  - Der Core startet wieder normal; Lizenzstatus, Lizenzanforderung und Lizenzimport gehoeren nicht mehr in den App-Start.
  - Regressionen in `scripts/tests/licenseRequest.test.cjs` und `scripts/tests/projektverwaltungModule.test.cjs` sichern ab, dass der alte Startblock nicht zurueckkommt.
  - `npm test` ist gruen.
- Lizenzverwaltung Loeschfunktion fuer Lizenzdatensaetze ist umgesetzt:
  - Im Lizenzformular gibt es den Button `Lizenz lÃ¶schen`, sichtbar nur bei bestehender gespeicherter Lizenz.
  - Vor dem Loeschen erscheint die Sicherheitsabfrage mit Klartext, dass nur der Lizenzdatensatz in der Lizenzverwaltung entfernt wird.
  - Nach Bestaetigung wird nur `license_records` geloescht; danach Rueckkehr ins Kundendetail mit Meldung `Lizenz wurde gelÃ¶scht.`.
  - Bei Fehler erscheint `Lizenz konnte nicht gelÃ¶scht werden.`; bei Abbruch wird nichts geloescht.
  - Neuer Main-Service `deleteLicenseRecord(id)` + IPC `license-admin:delete-license-record` + Preload `licenseAdminDeleteLicenseRecord(id)` + Renderer-Service `deleteLicense(record)` sind verbunden.
  - Tests decken Main-Service-Loeschfall, fehlende ID, IPC-Registration/-Aufruf, Preload/API, Renderer-Service und UI-Texte ab; `npm test` bleibt gruen.
- PR #46 Bugfix (Testversion speichern ohne sichtbares Datumsfeld) ist umgesetzt:
  - Bei `Lizenztyp = Testversion` setzt `buildLicenseEditorPayload` `valid_from` jetzt automatisch auf das technische Ausstellungsdatum (`YYYY-MM-DD`), wenn das Feld leer ist.
  - `valid_until` bleibt bei Testversion leer; `trial_duration_days` bleibt der fachliche Laufzeitwert.
  - Dadurch tritt beim Speichern/Erstellen der Testlizenz kein `valid_from required` mehr auf, obwohl `gueltig von/bis` in der Test-UI weiterhin nicht als Nutzerpflicht gezeigt wird.
  - Der bestehende Testlaufzeit-Start bei erster Installation / erstem Start bleibt unveraendert.
- PR #46 Bugfix (Testversion ohne validUntil im gesamten Erzeugungsweg) ist umgesetzt:
  - Save-Payload erzwingt fuer Testversion intern `license_edition=test`, `license_binding=none`, `license_mode=soft`, `machine_id=""` und laesst `valid_until` leer.
  - Damit wird Testversion ohne `validUntil` durch Save -> Generator-Payload -> Main-IPC konsistent akzeptiert; Vollversion ohne `validUntil` bleibt weiterhin Fehlerfall.
- PR #46 Bugfix (Generator-Input fuer Testversion ohne validUntil-Feld) ist umgesetzt:
  - Main-IPC `license:generate` schreibt fuer Testversion `validUntil` nicht mehr in die Input-JSON an den Generator.
  - Die alte Hilfslogik zur Ableitung `validUntil` aus `validFrom + Dauer` wurde entfernt; kein Rueckfall auf das Altmodell.
- PR #46 Hinweis externer Generator ist dokumentiert:
  - Der produktive Generator liegt extern unter `C:\\license-tool\\generate-license.cjs` und hat keine gepflegte Repo-Quelle in diesem Projekt.
  - Falls der externe Generator weiter `validUntil` fuer Testversion erzwingt, liefert die App jetzt klar den Hinweis: `Externer Lizenzgenerator ist nicht kompatibel mit Testversion ohne validUntil.`
  - In diesem Fall muss `C:\\license-tool\\generate-license.cjs` manuell kompatibel angepasst werden (Testversion ohne `validUntil`, mit Pflicht `trialDurationDays`).
- Lizenzverwaltung Nachsteuerung fuer PR #46 ist umgesetzt:
  - Lizenzformular fuehrt jetzt zwei fachlich getrennte Wege ueber `Lizenztyp`: `Testversion` und `Vollversion`.
  - `Testversion` bleibt ohne Machine-ID, zeigt Testdauer, nutzt weiter `Lizenz erstellen` + `Kunden-Setup erstellen` mit eingebetteter fertiger `customer.bbmlic`.
  - `Vollversion` ist fest an Machine-Binding gekoppelt, blendet den freien Binding-Mix aus und fuehrt in den Schritten `Machine-Setup erstellen` -> `Lizenzanforderung importieren` -> `Antwortlizenz erstellen`.
  - `Machine-Setup erstellen` baut bewusst ohne eingebettete `customer.bbmlic`; die Antwortlizenz wird weiterhin erst nach Import der Machine-ID ueber `Lizenz erstellen` erzeugt.
  - Dist-/IPC-Flow wurde minimal erweitert, damit Kunden-Setups wahlweise mit (Testversion) oder ohne (Machine-Setup) eingebettete Lizenz gebaut werden koennen.
  - Testabdeckung wurde fuer UI-Trennung, Payload-/Setup-Typ und Build-Embedding (mit/ohne `customer.bbmlic`) erweitert; `npm test` bleibt Pflicht.
- Machine-Binding Schritt 3 (Antwortlizenz-UI-Fuehrung) ist umgesetzt:
  - Admin-Lizenzformular zeigt bei `GerÃ¤tebindung = An Machine-ID binden` den Hinweis `GerÃ¤tegebundene Vollversion` mit klarer Schrittfuehrung (Import Lizenzanforderung -> `Lizenz erstellen` -> Antwortlizenz).
  - Nach erfolgreichem `Lizenz erstellen` wird bei Vollversion + Machine-Binding + vorhandener Machine-ID zusaetzlich angezeigt: `Antwortlizenz wurde erstellt.` sowie `Diese .bbmlic-Datei an den Kunden zurÃ¼ckgeben.`.
  - Ausgabepfadanzeige und Button `Ausgabeordner Ã¶ffnen` bleiben unveraendert im bestehenden Generator-Hauptablauf.
  - Kunden-Lizenzstatusbereich ergaenzt den Hinweis `Antwortlizenz erhalten?` mit Verweis auf den bestehenden Lizenzimport; kein neuer Import-Mechanismus, keine neue Navigation.
  - Tests wurden auf die neuen UI-Texte erweitert; bestehende Flows (`licenseGenerate`, Lizenzimport) bleiben unveraendert und `npm test` bleibt Pflichtpruefung.
- Machine-Binding Schritt 2 (Admin-Import) ist umgesetzt:
  - Admin-Lizenzformular hat den Button `Lizenzanforderung importieren` (nur im Lizenzformular, keine Kundenliste/Projektbereich).
  - Neuer Main-IPC `license-admin:import-license-request` oeffnet Datei-Dialog, liest JSON, validiert (`schemaVersion`, `requestType`, `product`, `machineId`, `createdAt`, `appVersion`) und liefert strukturierte Request-Daten.
  - Preload stellt `window.bbmDb.licenseAdminImportLicenseRequest()` bereit.
  - Nach erfolgreichem Import werden im Formular `Machine-ID`, `GerÃ¤tebindung=machine` und `Lizenzart=full` gesetzt; es erfolgt **kein** automatisches Speichern.
  - UI zeigt klare Erfolg-/Fehlerhinweise inkl. Produktfehler, fehlender Machine-ID sowie optional `customerName`/`licenseId`.
  - Bestehender Generatorfluss bleibt bestehen und nutzt danach weiterhin den bestehenden Ablauf `Lizenz erstellen`.
  - Keine Aenderung an `licenseVerifier.js EXPECTED_PRODUCT`, keine Setup-/Mail-/Online-Aktivierungs-Erweiterung.
  - Testabdeckung fuer Import-IPC, Preload und UI-Texte wurde erweitert; `npm test` bleibt Pflichtpruefung.
- Neuer Machine-Binding-Baustein ist umgesetzt:
  - Kunden-App kann jetzt eine Lizenzanforderungsdatei `bbm-license-request.json` speichern (nur Anfrage, keine Lizenz-/Signatur-Erzeugung).
  - Main-IPC `license:create-request` baut ein strukturiertes Request-JSON mit `schemaVersion`, `requestType`, `product`, `appVersion`, `createdAt`, `machineId` sowie optional `customerName`/`licenseId`/`notes`.
  - Machine-ID wird weiter ueber die bestehende `deviceIdentity`-Funktion geholt; Produkt bleibt fest `bbm-protokoll`.
  - Save-Dialog nutzt jetzt den vorgeschlagenen Dateinamen `bbm-license-request.json`.
  - Lizenzstatus-UI zeigt den Einstieg `Lizenzanforderung` mit Button `Lizenzanforderung speichern` und klaren Erfolgs-/Fehlermeldungen.
  - Keine Admin-Import-/Antwortlizenz-/Mail-/Setup-Aenderungen und keine Aenderung an `EXPECTED_PRODUCT`.
  - Tests fuer Payload, IPC, Preload, UI-Texte und Abgrenzungen wurden ergaenzt; `npm test` ist gruen.
- Lizenzverwaltung PR #41 Nachbesserung (Testlizenz-Startzeitpunkt) ist umgesetzt:
  - Testlizenzen tragen jetzt `trialDurationDays` signiert im Generator-Payload; der Testzeitraum startet erst bei erster erfolgreicher Lizenzinstallation/-nutzung.
  - Laufzeitpruefung fuer Testlizenzen nutzt `trialStartedAt + trialDurationDays` statt `valid_from + Dauer`; Vollversion bleibt bei `validUntil`.
  - Admin-UI zeigt fuer Testlizenz den Bereich `Testzeitraum` (14/30/60/90/Individuell, 1..365) inkl. Hinweis auf Start bei erster Installation/erstem Start; `gueltig von/bis` wird fuer Test nicht mehr als fachlicher Start/Ende dargestellt.
  - Formularlayout im Lizenzeditor wurde auf klare Feld-zu-Beschriftung-Blocks umgebaut; bei Testlizenz ist `Machine-ID` ausgeblendet.
  - Alte Entwicklungs-Parallel-Logik fuer Nutzungstage (`trial.enabled`, `trial.daysLimit`, `trial.firstStartAt`, `enforceTrialLimit`) ist aus UI/Runtime entfernt.
  - Lizenz-Admin-Datenmodell wurde minimal um `trial_duration_days` erweitert; Kunden-Setup-Fluss blieb unveraendert.
  - Testabdeckung erweitert (Generator-/Verifier-/Storage-/UI/IPC-Faelle); `npm test` ist gruen.
- Die Projektverwaltung ist als Renderer-Modul abgeschlossen.
- Ausgabe / Drucken / E-Mail ist als Renderer-Modul aufgestellt.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Drucktechnik bleibt im Main-Prozess.
- Audio / Diktat ist als Renderer-Modul begonnen.
  - `Dictate` ist das zugehoerige Lizenz-/Produktfeature; das sichtbare Feature `audio` wird fachlich als `Dictate` gefuehrt.
  - `Diktieren` ist der Entwicklungs-/Technikbereich unter `Einstellungen -> Entwicklung`.
  - `Diktierprodukt` ist die austauschbare fachliche Einheit unter `Diktieren`.
  - `Whisper` ist aktuell nur die technische Engine unter dem `Diktierprodukt`.
  - `Woerterbuch` ist ein vorbereiteter Baustein innerhalb von `Diktieren`.
  - `TranscriptionService` ist als Renderer-Adapter verankert.
  - Entwicklungs-UI fuer `Einstellungen -> Entwicklung -> Diktieren` ist als Modul-Baustein angebunden.
  - Keine Sidebar-Anbindung.
  - Kein Modulkatalog-Eintrag.
  - Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverÃ¤ndert.
- Im Bereich `Lizenz / bearbeiten` wird das Feature `audio` sichtbar als `Dictate` angezeigt.
  - `Audio / Diktat` bleibt Maschinenraum und ist kein auswÃ¤hlbares Projektmodul.
  - Der interne Key bleibt `audio`.
  - Die sichtbare Feature-Liste zeigt kein `audio` und `Dictate` nebeneinander.
- Im Bereich `Lizenz / bearbeiten` ist `Produktumfang` jetzt sichtbar gegliedert:
  - `Standardumfang` (app, pdf, export) ist immer enthalten und nicht abwaehlbar.
  - `Zusatzfunktionen` (mail, Dictate) bleiben auswaehlbar.
  - `Module` (Protokoll, Dummy) sind als vorbereitet markiert und noch nicht aktiv angebunden.
- Lizenzverwaltung ist als eigenes Zielmodul geplant; die Detailbeschreibung liegt unter `docs/modules/lizenzverwaltung.md`.
  - Dort ist jetzt auch der geplante Machine-Binding-Ablauf fuer Vollversionen mit Machine-ID verbindlich beschrieben.
  - Lizenzart (`Testlizenz` / `Vollversion`) und GerÃ¤tebindung (`Ohne GerÃ¤tebindung` / `An Machine-ID gebunden`) sind dort fachlich getrennt festgehalten.
- Lizenzverwaltung Paket 1 ist vorbereitet:
  - neues Modulverzeichnis `src/renderer/modules/lizenzverwaltung/` mit Skeleton-Screen
  - Einstieg `Adminbereich` als eigene Kachel auf oberster Ebene in `Einstellungen` angebunden
  - `Adminbereich` oeffnet als eigenes Popup mit Kachel `Lizenzverwaltung`
  - weiterhin kein Modulkatalog-/Projektmodul-Eintrag
- Lizenzverwaltung Paket 4 ist umgesetzt:
  - die bisherige UI `Lizenz verlaengern / bearbeiten` wurde aus `SettingsView` in das Modul `src/renderer/modules/lizenzverwaltung/` verschoben
  - `LicenseAdminScreen` enthaelt jetzt den Einstieg `Lizenz erstellen / bearbeiten`
  - der Einstieg oeffnet die verschobene UI im Adminbereich
  - `SettingsView` bleibt Host/Einstieg und zeigt keinen sichtbaren Entwicklungs-Tab `Lizenz / bearbeiten`

- Lizenzverwaltung Paket 4 (Datensatz-Vorbereitung) ist umgesetzt:
  - zentrale Datei `licenseRecords.js` fuer Kunden- und Lizenzdatensatz vorbereitet
  - Feldlisten, Default-Strukturen und Normalisierungsfunktionen fuer Kunde/Lizenz vorhanden
  - `LicenseAdminScreen` zeigt die Bereiche `Kunden` und `Lizenzen` mit aussagekraeftigeren vorbereiteten Feldhinweisen
  - bestehende Lizenz-erstellen-/bearbeiten-UI und Produktumfangsstruktur bleiben unveraendert nutzbar
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Kunden` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Kundenmaske
  - Kundenmaske nutzt `CUSTOMER_RECORD_FIELDS` und bietet die Felder Kundennummer, Firma/Kundenname, Ansprechpartner, E-Mail, Telefon, Notizen
  - Kundenmaske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Kundenmaske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Lizenzen` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Lizenzen-Maske
  - Lizenzen-Maske nutzt `LICENSE_RECORD_FIELDS` und `LICENSE_MODES` und bietet die Felder Lizenz-ID, Kunde, Produktumfang, gueltig von, gueltig bis, Lizenzmodus, Machine-ID, Notizen
  - Lizenzen-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Lizenzen-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Produktumfang` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Produktumfang-Maske
  - Produktumfang-Maske nutzt `PRODUCT_SCOPE` und zeigt `Standardumfang` (app, pdf, export), `Zusatzfunktionen` (mail, Dictate) und `Module` (Protokoll, Dummy)
  - `Standardumfang` bleibt sichtbar und nicht abwaehlbar; `Zusatzfunktionen` sind auswÃ¤hlbar; `Module` bleiben vorbereitet und noch nicht aktiv angebunden
  - Produktumfang-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal auf app/pdf/export ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Produktumfang-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kachel `Historie` im `LicenseAdminScreen` oeffnet jetzt eine einfache vorbereitete Historie-Maske
  - Historie-Maske nutzt `LICENSE_HISTORY_FIELDS` und zeigt `erzeugt am`, `Lizenz-ID`, `Kunde`, `Produktumfang`, `gueltig bis`, `Datei / Ausgabeort`, `Notizen`
  - Historie-Maske bietet `Neu / leeren` und `Pruefen`; Pruefen validiert nur lokal Pflichtfelder ohne Speicherung, Datenbank oder Persistenz
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Historie-Maske nur ueber den Adminbereich
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - zentrale Storage-Service-Schnittstelle `licenseStorageService.js` im Modul angelegt (In-Memory-Stub, async, ohne DB/IPC/Persistenz)
  - Service nutzt `normalizeCustomerRecord`, `normalizeLicenseRecord` und `normalizeLicenseHistoryRecord` aus `licenseRecords.js`
  - Export im Modul-Index ergaenzt; Tests decken Export, initiale Listen, Speichern mit Normalisierung und Promise-Kompatibilitaet ab
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - vorbereitete Masken `Kunden`, `Lizenzen` und `Historie` enthalten zusaetzlich den Button `Merken`
  - `Merken` validiert lokal und ruft danach den In-Memory-Storage-Service auf (`saveCustomer`, `saveLicense`, `addHistoryEntry`)
  - Erfolgsmeldung in allen drei Masken: nur temporaer/In-Memory gemerkt, keine dauerhafte Speicherung
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Kunden-, Lizenzen- und Historie-Maske zeigen unterhalb der Buttons einfache In-Memory-Listenansichten
  - Listen werden ueber `listCustomers`, `listLicenses` und `listHistory` geladen
  - Nach erfolgreichem `Merken` wird die jeweilige Liste sofort aktualisiert (ohne Persistenz, nur im laufenden App-Prozess)
  - Leerer Zustand ist in allen drei Masken sichtbar
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - DB-Schema/Migration in `src/main/db/database.js` um getrennte Admin-Tabellen `license_customers`, `license_records`, `license_history` erweitert (nicht-destruktiv, ohne UI-/IPC-Umstellung)
  - `licenseStorageService` bleibt bewusst In-Memory; keine Lizenzdatei-Logik und kein Projektmodul-Verhalten geÃ¤ndert
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Main-Process-Service `src/main/licensing/licenseAdminService.js` fuer Admin-Lizenzdaten vorbereitet (list/save fuer Kunden und Lizenzen, Historien-Read/Write)
  - noch keine IPC-/Preload-Anbindung; Renderer-Storage bleibt In-Memory
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - IPC-/Preload-Schnitt fuer Admin-Lizenzdaten ist vorbereitet (`license-admin:*` + `licenseAdmin*` im Preload)
  - Renderer-`licenseStorageService` nutzt jetzt die Preload-/IPC-Schnitt (`window.bbmDb.licenseAdmin*`) statt In-Memory
  - Kunden, Lizenzen und Historie werden dadurch dauerhaft in `app.db` gespeichert; UI blieb minimal angepasst
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Lizenzen-Maske laedt gespeicherte Kunden per `listCustomers()` als Auswahlfeld und speichert Lizenzen mit `customer_id/customerId`-Verknuepfung.
  - Gespeicherte Lizenzen zeigen Kundennummer/Firma lesbar an; ohne vorhandene Kunden blockiert die Maske das erfolgreiche Speichern mit Hinweis.
  - Leere Lizenz-ID wird in der Lizenzen-Maske beim Pruefen/Merken automatisch als lesbare `LIC-YYYYMMDD-HHMMSS`-ID erzeugt.
  - Die erzeugte Lizenz-ID wird sichtbar ins Feld uebernommen; manuelle IDs bleiben weiterhin bearbeitbar.

- Lizenzverwaltung Neuversuch (In-Memory-Listenansichten) ist nachgezogen:
  - Testnachweise in `scripts/tests/lizenzverwaltungModule.test.cjs` fuer Kunden/Lizenzen/Historie um Listenfelder und Refresh nach `Merken` ergaenzt
  - Leerer Zustand und Adminbereich-Abgrenzung bleiben weiterhin abgesichert
- Lizenzverwaltung Meilenstein kundenbezogen ist umgesetzt:
  - Startansicht der Lizenzverwaltung ist jetzt die Kundenliste mit Kundennummer, Firma/Kundenname, Ansprechpartner und E-Mail.
  - Kundendetail fuehrt kundenbezogen zu den Lizenzen dieses Kunden, inkl. `Neue Lizenz`, `Kunde speichern`, `Zurueck zur Kundenliste`.
  - Lizenzanlage/-bearbeitung laeuft nur aus geoeffnetem Kundenkontext, zeigt den Kunden sichtbar und hat `Zurueck zum Kunden`.
  - Main-Service ergaenzt `listLicensesByCustomer(customer_id)` sowie Pflichtfeld-Checks inkl. automatischer Lizenz-ID `LIC-YYYYMMDD-HHMMSS`.
  - DB-Schema-Absicherung fuer bestehende `license_records` wurde nicht-destruktiv um fehlende Spalten-Ergaenzung erweitert.
  - Renderer-/IPC-/Preload-Datenfluss ist kundenbezogen erweitert (`license-admin:list-records-by-customer`).
  - Verhaltenstests decken Kunde speichern/listen, kundenbezogenes Lizenzspeichern/listen, Pflichtfelder und Kundenkontextlogik ab.
- Lizenzverwaltung UI-Aufraeumen (kundenbezogen) ist umgesetzt:
  - Kundenansicht zeigt jetzt `Lizenzverwaltung` + Bereich `Kunden` mit klarer Tabelle und Buttons `Neuer Kunde` / `Zurueck zum Adminbereich`.
  - Kundendetail ist als ausgerichtetes Formular umgesetzt, inkl. klarer Button-Fuehrung und sichtbarem Hinweisbereich.
  - Lizenzliste je Kunde ist als Tabelle mit Spalten fuer Lizenz-ID, Produktumfang, gueltig von/bis und Lizenzmodus dargestellt.
  - Produktumfang in der Liste zeigt kein rohes JSON mehr bei parsebaren Objekten; `{ raw: ... }` wird als Klartext, leere Arrays als `-`, gefuellte Bereiche als Kurzformat angezeigt.
  - Lizenzformular zeigt `Neue Lizenz fuer: ...`, Produktumfang als mehrzeiliges Feld, Lizenzmodus als Auswahl (`soft`/`full`) und den neuen Button `Lizenz-ID erzeugen`.
  - `Lizenz-ID erzeugen` schreibt nur bei leerem Feld sofort eine `LIC-YYYYMMDD-HHMMSS`-ID ins Feld; gesetzte IDs werden nicht ueberschrieben.
  - Bestehende Speicherlogik (Auto-ID beim Speichern, Kundenkontext-Pflicht, DB-/IPC-Fluss) bleibt unveraendert.
- Lizenzverwaltung naechstes Paket ist umgesetzt:
  - Im Lizenzformular gibt es den Button `Lizenzdatei erzeugen`.
  - Erzeugung ist ohne gespeicherte Lizenz blockiert (`Bitte zuerst die Lizenz speichern.`).
  - Gespeicherte Lizenz + aktueller Kunde werden auf bestehendes `window.bbmDb.licenseGenerate(...)` gemappt.
  - Generator-Produkt bleibt technisch `bbm-protokoll` (UI bleibt `BBM-Produktiv`).
  - `license_mode` wird kompatibel gemappt (`soft -> none`, `full -> machine`, `none/machine` bleiben erhalten).
  - Features werden aus `product_scope_json` fuer Generator aufgebaut (inkl. `audio`-Kompatibilitaet als `dictate`).
  - Ohne ableitbare Features wird Erzeugung blockiert (`Produktumfang enthÃ¤lt keine erzeugbaren Features.`).
  - Bei Erfolg wird der Ausgabepfad angezeigt und `Ausgabeordner Ã¶ffnen` nutzt bestehendes `window.bbmDb.licenseOpenOutputDir(...)`.
  - Bestehende Main-IPC-Infrastruktur (`license:generate`, `license:open-output-dir`) wurde weiterverwendet, keine neue Generator-Architektur.
- Lizenzverwaltung Nachbesserung ist umgesetzt:
  - Lizenzformular trennt jetzt fachlich `Lizenzart` (Testlizenz/Vollversion) und `GerÃ¤tebindung` (none/machine); `Lizenzmodus` ist nicht mehr das fÃ¼hrende Bedienfeld.
  - Datumsfelder im Admin-Lizenzformular laufen als Date-Inputs; Generator-Payload normalisiert zusaetzlich ISO- und deutsche Eingaben (`TT.MM.JJJJ` -> `JJJJ-MM-TT`), um `VALID_FROM_REQUIRED` zu vermeiden.
  - Bei `GerÃ¤tebindung = machine` wird `Machine-ID` vor `licenseGenerate` verpflichtend geprÃ¼ft; bei `none` bleibt Machine-ID optional und wird nicht Ã¼bergeben.
  - KompatibilitÃ¤t fuer Altwerte in `license_mode` bleibt erhalten (`soft/full/none/machine` -> sinnvolle Edition/Binding-Ableitung), neue Felder `license_edition`/`license_binding` haben Vorrang.
  - DB-Schema `license_records` wurde nicht-destruktiv um optionale Spalten `license_edition` und `license_binding` ergÃ¤nzt.
  - Main-Service und Renderer-Normalisierung akzeptieren/liefern snake_case + camelCase fÃ¼r Edition/Binding.
- Lizenzverwaltung UI-Nachbesserung ist umgesetzt:
  - Nach `Kunde speichern` ist `Neue Lizenz` sofort aktiv; kein Zurueck-/Neuoeffnen noetig.
  - Im Lizenzformular wurden Buttontexte vereinheitlicht: `Lizenz speichern`, `Formular leeren`, `Zurueck`.
  - Kundendetail ist klarer getrennt in `Kundendaten` und `Lizenzen dieses Kunden`.
  - Die Lizenzliste je Kunde ist als saubere Tabelle mit Spalten fuer Lizenz-ID, Lizenzart, GerÃ¤tebindung, Produktumfang, gueltig von/bis und Aktion aufgebaut.
  - Bearbeiten erfolgt ueber sichtbaren Button `Ã–ffnen` in der Aktion-Spalte statt ueber unsichtbaren Zeilenklick.
- Lizenzverwaltung Abschluss fuer PR #39 ist umgesetzt:
  - Im Lizenzformular gibt es jetzt den kombinierten Hauptbutton `Lizenz erstellen`.
  - Der Ablauf dahinter ist: Admin-Lizenz speichern -> vorhandenen Generator aufrufen -> Ausgabepfad anzeigen -> Ausgabeordner Ã¶ffnen.
  - Es gibt keinen separaten Bedienpfad mehr mit erst `Lizenz speichern` und danach `Lizenzdatei erzeugen`.
- Lizenzverwaltung finale UI-Vereinfachung ist umgesetzt:
  - Im sichtbaren Lizenzformular wurden restliche Einzelbuttons entfernt (`Lizenz-ID erzeugen`, `Formular leeren`).
  - Lizenz-ID bleibt sichtbar, wird aber beim Hauptablauf `Lizenz erstellen` automatisch erzeugt, wenn leer.
  - Sichtbarer Hauptablauf im Formular ist jetzt auf `Lizenz erstellen` + `Zurueck` reduziert; `Ausgabeordner Ã¶ffnen` erscheint nur nach erfolgreicher Erzeugung.
- Lizenzverwaltung naechster Schritt (Kunden-Setup) ist umgesetzt:
  - Nach erfolgreicher Lizenzerzeugung wird der Lizenzpfad im Lizenzdatensatz gespeichert (`license_file_path`, `license_file_created_at`).
  - Im Lizenzformular ist `Kunden-Setup erstellen` verfuegbar; ohne bekannte erzeugte Lizenzdatei erscheint `Bitte zuerst die Lizenz erstellen.`.
  - Kunden-Setup-Build nutzt bestehende `scripts/dist.cjs`/electron-builder-Infrastruktur im optionalen Kundenmodus (kein neuer Installer-Generator).
  - Kundenmodus uebergibt `.bbmlic` als `extraResource` nach `license/customer.bbmlic`, baut nach `dist/customers/<slug>/` und setzt kundenbezogenen Setup-Dateinamen.
  - Main-/Preload-IPC fuer Build-Aufruf ist angebunden (`license-admin:create-customer-setup` / `licenseAdminCreateCustomerSetup`).
  - Lizenz-Bootstrap liest bei fehlender `userData/license.json` eine gebuendelte `resources/license/customer.bbmlic` und uebernimmt sie als installierte Lizenz; bestehende `userData/license.json` bleibt vorrangig.
  - `licenseVerifier.js` Produktpruefung bleibt unveraendert.
- Lizenzverwaltung Kunden-Setup-Nachbesserung ist umgesetzt:
  - Erfolgsmeldung fuer `Kunden-Setup wurde erstellt.` wird nur noch gesetzt, wenn ein echtes Setup-Artefakt im Kunden-Ausgabeordner gefunden wurde.
  - Fehlt Kunden-Ausgabeordner oder Setup-`.exe`, liefert der Main-Flow `CUSTOMER_SETUP_ARTIFACT_NOT_FOUND` statt false-positive Erfolg.
  - Build-Diagnose wird mitgegeben (`repoRoot`, `outputDir`, `customerSlug`, `licenseFilePath`, `exitCode`, `stdout`, `stderr`) und im UI bei Fehlern sichtbar gemacht.
- Lizenzverwaltung Kunden-Setup-Stabilisierung ist umgesetzt:
  - Build startet nicht mehr blind mit `process.execPath`, sondern ueber aufgeloeste Node-Laufzeit (`npm_node_execpath` -> `NODE_EXE` -> `node`).
  - Kunden-Setup-Build hat Timeout-Schutz; bei HÃ¤nger wird mit `CUSTOMER_SETUP_BUILD_TIMEOUT` sauber beendet.
  - Spawn-Fehler liefern `CUSTOMER_SETUP_BUILD_FAILED`; der IPC antwortet damit immer mit einem Abschlussstatus statt offenem HÃ¤nger.
  - Pro Buildlauf wird eine Logdatei unter `dist/customers/<slug>/customer-setup-build.log` geschrieben (inkl. Node-Befehl, Env, stdout/stderr, Exitcode, Artefakte).
  - Kundenmodus-Builderkonfiguration deaktiviert native Rebuilds (`npmRebuild: false`, `buildDependenciesFromSource: false`), um `better-sqlite3`-Locking in der laufenden App zu vermeiden.
- Protokoll-Modul ist eingefroren.
- `npm test` war gruen.
- GitHub Action `.github/workflows/npm-test.yml` ist eingerichtet und fuehrt `npm test` auf `main` sowie `modularisierung/projektverwaltung` bei Push/Pull-Request aus.
- App-Sichtung fuer den Projekt-Arbeitsbereich wurde durchgefuehrt und passt (Projektklick -> Arbeitsbereich, Modulauswahl unveraendert auf `Protokoll`).
- Repo ist auf GitHub aktualisiert.
- `AGENTS.md` und `PLAN.md` sind vorhanden.
- Codex Cloud ist eingerichtet und kann das Repo lesen.
- Das Mutter-/Kind-Prinzip ist als verbindliche Leitlinie fuer die gesamte App festgehalten.
- Der erste CSS-Schritt im Modul `Protokoll` wurde umgesetzt.
- Der Speichern-/LÃ¶schen-Vertrag im Tops-Bereich wurde zwischen Verhalten und Tests synchronisiert.

## Architektur-Flag
- Die gesamte App folgt dem Mutter-/Kind-Prinzip.
- Diese Codebasis ist die Mutter-App / Bauzentrale.
- Spaetere Kinder-Apps sind freigegebene Produktvarianten mit eingegrenztem Modul- und Funktionsumfang.
- Die Mutter-App verwaltet Module, Kunden/Nutzer, Lizenzen, Laufzeiten, Updateberechtigungen und Varianten.
- Kinder-Apps pruefen nur ihre Lizenz, freigeschaltete Module, Laufzeit und Updateberechtigung.
- Kinder-Apps werden nicht zur Verwaltungszentrale fuer andere Kunden oder Varianten ausgebaut.
- Nicht jedes Modul ist ein auswÃ¤hlbares Projektmodul; Maschinenraum-Dienste und Verwaltungsbereiche bleiben getrennt.
- Aktuell auswÃ¤hlbares Projektmodul ist `Protokoll`; `Restarbeiten` kann spaeter als Projektmodul hinzukommen.
- `Ausgabe / Drucken / E-Mail` und `Audio / Diktat` sind Maschinenraum-Dienste, keine Projektmodule.
- `Lizenzierung`, `Settings`, `Updates`, `Backup` und `Diagnose` sind Verwaltung oder Maschinenraum, keine Projektmodule.
- Die Projektverwaltung setzt den Projektkontext und oeffnet den Projekt-Arbeitsbereich.
- Ein Projektklick startet nicht direkt `Protokoll`.
- Im Projekt-Arbeitsbereich werden nur auswÃ¤hlbare Projektmodule angeboten.
- Das Protokoll-Modul ist aktuell eingefroren.
- Keine weitere Mini-Modularisierung ohne ausdruecklichen Auftrag.
- `TopsHeader` und `TopsList` wurden heimgeholt.
- `TopsWorkbench`, `TopsViewDialogs`, Router, Commands, CloseFlow, Repository, Store und Selectors nicht anfassen.
- Weitere Ã„nderungen nur bei echtem Fehler oder konkretem Featurebedarf.

## Projektverwaltung
- Der erste Modul-Meilenstein ist abgeschlossen.
- Die Projektverwaltung ist als Renderer-Modul unter `src/renderer/modules/projektverwaltung` aufgestellt.
- Der bestehende Sidebar-Einstieg `Projekte` bleibt der einzige sichtbare Einstieg.
- Es gibt keinen zusÃ¤tzlichen Sidebar-Button `Projektverwaltung`.
- Der Router nutzt den Modulpfad.
- Die alten View-Dateien bleiben als Compatibility-Re-Exports bestehen.
- Keine DB-/IPC-Logik wurde verschoben.
- `npm test` war gruen.
- GitHub Action `.github/workflows/npm-test.yml` ist eingerichtet und fuehrt `npm test` auf `main` sowie `modularisierung/projektverwaltung` bei Push/Pull-Request aus.
- App-Sichtung fuer den Projekt-Arbeitsbereich wurde durchgefuehrt und passt (Projektklick -> Arbeitsbereich, Modulauswahl unveraendert auf `Protokoll`).

## Ausgabe
- Das Renderer-Modul ist aufgestellt.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Drucktechnik bleibt im Main-Prozess.

## Audio
- Das Renderer-Modul ist begonnen.
- `TranscriptionService` ist als Renderer-Adapter im Modul verankert.
- Die Entwicklungs-UI fuer den Bereich `Diktieren` wurde in das Audio-Modul ausgegliedert und in Settings eingehaengt.
- Es gibt keine Sidebar-Anbindung und keinen Modulkatalog-Eintrag.
- Die Main-/IPC-/Whisper-/Lizenz-/Settings-Logik bleibt unverÃ¤ndert.

---

## Erledigte Meilensteine / Pakete

### Erledigt
#### Paket: PR #39 final - sichtbare Einzelbuttons im Lizenzformular entfernt
- Status: erledigt
- Beschreibung:
  - Entfernt: `Lizenz-ID erzeugen` (Button) und `Formular leeren` (Button) aus dem sichtbaren Lizenzformular.
  - Hinweistext bei Lizenz-ID auf automatischen Erstell-Ablauf angepasst.
  - Tests auf reduzierte sichtbare Bedienung aktualisiert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Generator-/Setup-/Persistenz-/Sidebar-/Projektmodul-Aenderung

#### Paket: PR #39 Abschluss - kombinierter Button `Lizenz erstellen`
- Status: erledigt
- Beschreibung:
  - Lizenzformular auf einen klaren Hauptablauf mit einem Button `Lizenz erstellen` umgestellt.
  - Klick speichert zuerst den Lizenzdatensatz und erzeugt danach direkt die `.bbmlic` Ã¼ber die bestehende Generator-Infrastruktur.
  - Ausgabepfad bleibt sichtbar; `Ausgabeordner Ã¶ffnen` bleibt verfÃ¼gbar.
  - Tests auf neue UI-Begriffe/Bedienlogik aktualisiert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Kein neuer Generator-IPC, keine Setup-/Sidebar-/Projektmodul-/Persistenzarchitektur-Aenderung

#### Paket: PR #39 UI-Feinschliff Kundendetail/Lizenzformular
- Status: erledigt
- Beschreibung:
  - Kundendetail-Screen so angepasst, dass `Neue Lizenz` nach erfolgreichem Kundenspeichern sofort nutzbar bleibt.
  - Lizenzformular-Buttons sprachlich auf klare Begriffe umgestellt (`Lizenz speichern`, `Formular leeren`, `Zurueck`).
  - Lizenzliste je Kunde optisch/strukturell bereinigt (eigene Aktion-Spalte mit `Ã–ffnen`; kein gesamter Zeilenklick).
  - Tests auf neue Begriffe/Struktur und Direktnutzbarkeit nach Kundenspeichern erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Generator-/Setup-/Sidebar-/Projektmodul-Aenderung in diesem UI-Nachschritt

#### Paket: PR #39 Nachbesserung - Lizenzart/Geraetebindung getrennt und Datumsnormalisierung
- Status: erledigt
- Beschreibung:
  - `LicenseAdminScreen` trennt nun `Lizenzart` und `GerÃ¤tebindung` im Formular, inklusive Machine-ID-Enable/Disable je Binding.
  - Generator-Payload nutzt jetzt Edition/Binding aus neuen Feldern (mit Legacy-Fallback), normalisiert Datumswerte und validiert Machine-ID/Data vor dem IPC-Aufruf.
  - DB-Schema und Main-Service wurden fuer optionale Felder `license_edition`/`license_binding` erweitert (nicht-destruktiv, keine neue Tabelle).
  - Normalisierer/Tests wurden auf KompatibilitÃ¤t von legacy `license_mode` + neue Felder angepasst.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/licenseRecords.js`
  - `src/main/licensing/licenseAdminService.js`
  - `src/main/db/database.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine neue Generator-IPC, keine Setup-/App-Sperrlogik-Aenderung, keine Sidebar-/Projektmodul-Aenderung

#### Paket: Admin-Lizenzformular an bestehende Lizenzdatei-Erzeugung angebunden
- Status: erledigt
- Beschreibung:
  - Lizenzformular in `LicenseAdminScreen` um `Lizenzdatei erzeugen` erweitert; Erzeugung nur fuer gespeicherte Lizenzen.
  - Neue Mapping-Helfer bauen Generator-Payload aus Kunde+Lizenz (customerName, licenseId, product `bbm-protokoll`, edition, binding, validFrom/validUntil, maxDevices, machineId, features).
  - Features-Mapping aus `product_scope_json` deckt Standardumfang, Zusatzfunktionen und Module ab; `audio` bleibt kompatibel als `dictate`.
  - UI zeigt Statusmeldungen fuer laufende Erzeugung, Erfolg/Fehler, Ausgabepfad und optional `Ausgabeordner Ã¶ffnen`.
  - Tests fuer Payload-Mapping, Binding-/Produkt-Mapping, Feature-Mapping und Feature-Leerfall wurden in `licenseAdminDataflow.test.cjs` erweitert.
  - Strukturtests wurden um Nachweise fuer Button, Blockiermeldungen und bestehende IPC-Infrastruktur erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Setup-Aenderung, keine Sidebar-/Projektmodul-Aenderung, keine App-Sperrlogik-Aenderung

#### Paket: Gefuehrter Lizenzumfang-Editor in der Admin-Lizenzverwaltung
- Status: erledigt
- Beschreibung:
  - Im Lizenzformular (`Neue Lizenz / Lizenz bearbeiten`) wurde ein gefuehrter Editor fuer `Produkt`, `Standardumfang`, `Zusatzfunktionen` und `Module` eingebaut.
  - UI-Nachforderung umgesetzt: `Produkt` steht separat oben; `Standardumfang`, `Zusatzfunktionen` und `Module` werden als drei klar getrennte Karten in einer responsiven 3-Spalten-Zeile dargestellt.
  - Fehlerkorrektur: `Neu / leeren` setzt den Scope-Zustand jetzt konsistent zurueck (Standardumfang aktiv, Zusatzfunktionen/Module leer) und erzeugt `product_scope_json` sofort neu aus dem sichtbaren Modell.
  - `product_scope_json` wird weiterhin ueber die bestehende Save-Logik gespeichert, jetzt aber strukturiert mit `product`, `standardumfang`, `zusatzfunktionen` und `module`.
  - Bestehende Altwerte bleiben kompatibel: `{ raw: ... }`, Freitext, leere Arrays und vorhandene Strukturwerte werden weiterhin gelesen/angezeigt.
  - Die Liste `Lizenzen dieses Kunden` zeigt den Produktumfang jetzt lesbar (inkl. `Dictate` statt `audio`).
  - Tests fuer lesbare Ausgabe und `Dictate`-Darstellung wurden in `licenseAdminDataflow.test.cjs` erweitert.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Lizenzdatei-/Setup-Aenderung, keine IPC-Erweiterung

#### Paket: Zeitzonenstabiler Test fuer erzeugte Lizenz-ID
- Status: erledigt
- Beschreibung:
  - Zeitzonenabhaengiger Testfall in `scripts/tests/licenseAdminDataflow.test.cjs` stabilisiert
  - UTC-String-Zeitpunkt (`new Date("2026-04-26T13:14:15Z")`) durch lokale Datumskonstruktion ersetzt
  - Erwartete Lizenz-ID `LIC-20260426-131415` bleibt unveraendert
- Betroffene Dateien:
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Lizenzlogik, DB, UI oder Lizenzdatei-Erzeugung

#### Paket: UI-Aufraeumen Admin-Lizenzverwaltung (kundenbezogen)
- Status: erledigt
- Beschreibung:
  - `LicenseAdminScreen` optisch/bedienbar aufgeraeumt (Kundenliste, Kundendetail, Lizenztabelle, Lizenzformular).
  - Produktumfangsausgabe in der Kunden-Lizenzliste lesbar gemacht (`raw`-Text, Kurzformat, `-` bei leeren Arrays).
  - Lizenzformular um Button `Lizenz-ID erzeugen` erweitert, ohne bestehende Auto-ID-Sicherheitslogik beim Speichern zu aendern.
  - Tests in `scripts/tests/licenseAdminDataflow.test.cjs` und `scripts/tests/lizenzverwaltungModule.test.cjs` entsprechend erweitert/angepasst.
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `scripts/tests/licenseAdminDataflow.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine DB-/Schema-Aenderung, keine Lizenzdatei-/Setup-Aenderung, keine Aenderung am Projektmodul/Sidebar

#### Paket: CSS-Altpfad im Modul Protokoll abbauen
- Status: erledigt
- Beschreibung:
  - modul-lokale CSS-Datei fÃ¼r Protokoll angelegt
  - CSS-Verweis in `src/renderer/modules/protokoll/styles.js` angepasst
  - alte CSS-Datei blieb bestehen
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/styles.js`
  - `src/renderer/modules/protokoll/styles/tops.css`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Commit enthÃ¤lt zusÃ¤tzlich das Entfernen von ChatGPT-Export-Artefakten

#### Paket: Speichern-/LÃ¶schen-Vertrag im Tops-Bereich stabilisieren
- Status: erledigt
- Beschreibung:
  - `topsCommands`-Testvertrag an den realen Reload-Ablauf nach `saveDraft` und `deleteSelectedTop` angepasst
  - Reload nach Speichern/LÃ¶schen im Test explizit abgedeckt (inkl. Erhalt/Entfernung der Selektion im Ablauf)
- Betroffene Dateien:
  - `scripts/tests/topsCommands.test.cjs`
  - `STATUS.md`
- Commit:
  - `50cdbc3`
- Hinweise:
  - Keine Ã„nderungen an Router, UI oder fachlicher Tops-Logik

---


#### Paket: Einstellungen/Entwicklung strukturiert auf Diktieren umgestellt
- Status: erledigt
- Beschreibung:
  - Entwicklungsbereich um den neuen Tab `Diktieren` erweitert
  - `Diktierprodukt` als fachliche Klammer eingefuehrt und `Aktuelle Engine: Whisper` sichtbar gemacht
  - bestehende Whisper-Modellauswahl unveraendert unter `Diktierprodukt` einsortiert
  - vorbereiteter Abschnitt `Woerterbuch` als `noch nicht eingerichtet` gekennzeichnet
  - Diktieren-UI nach `src/renderer/modules/audio/ui/createDictationDevSection.js` ausgelagert
  - Audio-Modultest um den neuen UI-Baustein erweitert
- Betroffene Dateien:
  - `src/renderer/modules/audio/ui/createDictationDevSection.js`
  - `src/renderer/modules/audio/index.js`
  - `src/renderer/modules/audio/README.md`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/audioModule.test.cjs`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Router-, Sidebar-, Projektmodul- oder TranscriptionService-Aenderung

#### Paket: Lizenz-Featurelabel `audio` als `Dictate` anzeigen
- Status: erledigt
- Beschreibung:
  - sichtbares Feature-Label `audio` im Bereich `Lizenz / bearbeiten` auf `Dictate` umgestellt
  - interner Feature-Key `audio` unverÃ¤ndert gelassen
  - Ergebnisanzeige der erzeugten Lizenz zeigt den sichtbaren Feature-Namen ebenfalls als `Dictate`
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/audioModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Ã„nderungen an Settings-/Diktieren-Tab, Sidebar, Projektmodul oder Whisper-Logik

#### Paket: ProjectWorkspaceScreen minimal stabilisiert
- Status: erledigt
- Beschreibung:
  - robuste Anzeige fuer Projektnummer und Projektname im Projekt-Arbeitsbereich nachgezogen
  - Nachladen ohne direkt uebergebenes Projekt bleibt ueber `window.bbmDb.projectsList()` erhalten
  - klare Meldung fuer nicht gefundenes Projekt und Ruecksprung-Button `Zur Projektliste` ueber `showProjects()` ergaenzt
  - Projektauswahl bleibt auf `Protokoll` begrenzt; Maschinenraumdienste weiterhin unsichtbar
  - passende Modul-Tests fuer robuste Anzeige, Ruecksprung und Projektlade-Faelle erweitert
- Betroffene Dateien:
  - `src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Router-Aenderungen, keine Protokoll-Aenderungen

#### Paket: Lizenzverwaltung Paket 1 (Adminbereich + Modul-Skeleton)
- Status: erledigt
- Beschreibung:
  - neues Admin-Modul `src/renderer/modules/lizenzverwaltung/` mit `index.js`, `README.md`, `screens/index.js` und `screens/LicenseAdminScreen.js` angelegt
  - Skeleton-Screen mit Platzhaltern `Kunden`, `Lizenzen`, `Produktumfang`, `Historie` ergÃ¤nzt
  - Entwicklungsbereich in `SettingsView` minimal um den Einstieg `Adminbereich` erweitert
  - Modulkatalog und Projektmodule bleiben unverÃ¤ndert (`Protokoll` bleibt einziges Projektmodul)
  - Testlauf um `lizenzverwaltungModule.test.cjs` ergÃ¤nzt
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `scripts/test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Kein Umbau am bestehenden Lizenz-bearbeiten-Popup
  - Keine Lizenzlogik-, Produktumfangs-, Kunden- oder Historienimplementierung

#### Paket: Lizenzverwaltung Paket 2 (Adminbereich als eigenes Popup)
- Status: erledigt
- Beschreibung:
  - `Adminbereich` aus den Entwicklung-Tabs entfernt und als eigener Einstieg/Kachel im Entwicklungs-Popup verankert
  - neues Adminbereich-Popup mit Kachel `Lizenzverwaltung` ergÃ¤nzt
  - Klick auf `Lizenzverwaltung` zeigt weiterhin den bestehenden `LicenseAdminScreen`-Skeleton
  - bestehende Entwicklung-Tabs (`Versionierung`, `Lizenz / bearbeiten`, `DB-Diagnose`, `Diktieren`, `Druck / TOP-Liste`) bleiben unverÃ¤ndert erhalten
  - Testvertrag fuer Adminbereich-/Lizenzverwaltung-Einstieg entsprechend erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Lizenzlogik, Projektmodulen, Sidebar oder Whisper/Diktier-Backends

#### Paket: Lizenzverwaltung Paket 2 (Produktumfang im Popup gliedern)
- Status: erledigt
- Beschreibung:
  - im Popup `Lizenz / bearbeiten` wurde die flache `Features`-Zeile durch den gegliederten Bereich `Produktumfang` ersetzt
  - `Standardumfang` (`app`, `pdf`, `export`) ist sichtbar und dauerhaft enthalten (nicht abwaehlbar)
  - `Zusatzfunktionen` enthalten `mail` und die sichtbare Bezeichnung `Dictate` (intern weiter `audio` kompatibel)
  - `Module` enthalten `Protokoll` und `Dummy` als klar vorbereitete, noch nicht aktiv angebundene Eintraege
  - bestehende Buttons unten (`Lizenz laden`, `Lizenzanforderung laden`, `Lizenz verlaengern`, `Ausgabeordner oeffnen`) bleiben unveraendert erhalten
  - Testvertrag in `lizenzverwaltungModule.test.cjs` um Produktumfang-Nachweise erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Aenderung an Projektmodul-Katalog, Sidebar, Whisper, Diktierfunktion oder Protokoll-Modul

#### Paket: Lizenzverwaltung Paket 3 (Adminbereich in Einstellungen-Hauptebene verortet)
- Status: erledigt
- Beschreibung:
  - `Adminbereich` als eigene Kachel direkt auf oberster Ebene in `Einstellungen` verankert
  - `Adminbereich` aus dem Entwicklung-Popup entfernt (kein Kachel- oder Tab-Einstieg mehr dort)
  - im `Adminbereich` bleibt die Kachel `Lizenzverwaltung` der sichtbare Zielpfad
  - Klick auf `Lizenzverwaltung` zeigt weiterhin den bestehenden `LicenseAdminScreen`-Skeleton
  - bestehender Bereich `Lizenz / bearbeiten` bleibt im Code als Altbestand erhalten, aber ohne sichtbaren Entwicklung-Tab-Einstieg
  - Testvertrag fuer Einstellungen/Entwicklung/Adminbereich entsprechend angepasst und erweitert
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Lizenzlogik-Aenderung
  - Keine Projektmodul-, Sidebar-, Diktier- oder Whisper-Aenderung

#### Paket: Lizenzverwaltung Paket 4 (Lizenz-erstellen-/bearbeiten-UI ins Modul verschoben)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `createLicenseEditorSection.js` eingefuehrt und die bestehende Lizenz-erstellen-/bearbeiten-UI dorthin verschoben
  - bestehende Lizenzlogik/IPC-Aufrufe und Buttons (`Lizenz laden`, `Lizenzanforderung laden`, `Lizenz verlaengern`, `Ausgabeordner oeffnen`) unveraendert beibehalten
  - `LicenseAdminScreen` um den Einstieg `Lizenz erstellen / bearbeiten` erweitert
  - Klick auf den Einstieg oeffnet die verschobene UI aus dem Modul im Adminbereich
  - `SettingsView` enthaelt keinen sichtbaren Entwicklungs-Tab `Lizenz / bearbeiten` mehr
  - Tests auf Modul-Export, Einstieg im `LicenseAdminScreen`, gegliederten Produktumfang und Adminbereich-Abgrenzung angepasst
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - keine neue Kundenverwaltung, Historie oder Produktumfang-Datenstruktur eingefuehrt
  - keine Projektmodul-, Sidebar-, Whisper-, Diktier- oder Lizenzdatei-Logik-Aenderung


#### Paket: Lizenzverwaltung Paket 4 (Kunden- und Lizenzdatensatz vorbereiten)
- Status: erledigt
- Beschreibung:
  - zentrale Datei `src/renderer/modules/lizenzverwaltung/licenseRecords.js` mit Feldlisten fuer Kunde und Lizenz angelegt
  - Default-Strukturen und kleine Normalisierungsfunktionen fuer beide Datensaetze eingefuehrt
  - `LicenseAdminScreen` zeigt die Bereiche `Kunden` und `Lizenzen` weiter als vorbereitete Bereiche, aber mit Feldhinweisen
  - bestehende Lizenz-erstellen-/bearbeiten-UI bleibt unveraendert als Einstieg nutzbar
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/licenseRecords.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine neue Datenbank/Persistenz
  - Keine Kundenverwaltung/Historie implementiert
  - Keine Projektmodul-/Sidebar-/Whisper-Aenderung

#### Paket: Lizenzverwaltung naechstes Paket (Kunden-UI als vorbereitete Maske)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `src/renderer/modules/lizenzverwaltung/screens/createCustomerEditorSection.js` angelegt
  - Kundenmaske mit Ueberschrift `Kunden`, Hinweis `vorbereitet, noch ohne Speicherung` und allen vorbereiteten Kundenfeldern aus `CUSTOMER_RECORD_FIELDS` umgesetzt
  - Buttons `Neu / leeren` und `Pruefen` ergaenzt; Pruefen validiert lokal die Pflichtfelder ohne Speicherung/Persistenz
  - `LicenseAdminScreen` um den Einstieg fuer die Kundenmaske erweitert
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Kundenmaske im Adminbereich
  - Testvertrag fuer Modul-Export, Feldnutzung, Buttons, Kunden-Einstieg und Nicht-Projektmodul-Verhalten erweitert
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createCustomerEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Datenbank/Persistenz/Kundenliste/Historie implementiert
  - Keine Lizenzdatei- oder Produktumfang-Logik geaendert
  - Keine Projektmodul-/Sidebar-/Whisper-Aenderung


#### Paket: Lizenzverwaltung naechstes Paket (Lizenzen-UI als vorbereitete Maske)
- Status: erledigt
- Beschreibung:
  - neue Moduldatei `src/renderer/modules/lizenzverwaltung/screens/createLicenseRecordEditorSection.js` angelegt
  - Lizenzen-Maske mit Ueberschrift `Lizenzen`, Hinweis `vorbereitet, noch ohne Speicherung` und allen vorbereiteten Lizenzfeldern aus `LICENSE_RECORD_FIELDS` umgesetzt
  - Lizenzmodus wird ueber `LICENSE_MODES` gerendert
  - Buttons `Neu / leeren` und `Pruefen` ergaenzt; Pruefen validiert lokal Pflichtfelder ohne Speicherung/Persistenz
  - `LicenseAdminScreen` um den Einstieg fuer die Lizenzen-Maske erweitert
  - `SettingsView` bleibt Host/Einstieg und oeffnet die Lizenzen-Maske im Adminbereich
  - Testvertrag fuer Modul-Export, Feldnutzung, LICENSE_MODES, Buttons und Lizenzen-Einstieg erweitert
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseRecordEditorSection.js`
  - `src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js`
  - `src/renderer/modules/lizenzverwaltung/screens/index.js`
  - `src/renderer/modules/lizenzverwaltung/index.js`
  - `src/renderer/modules/lizenzverwaltung/README.md`
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Datenbank/Persistenz/Lizenzenliste/Historie implementiert
  - Keine Lizenzdatei-/Produktumfang-/Projektmodul-/Sidebar-/Whisper-Aenderung

## Offene Meilensteine
1. Weitere kleine Altpfade im Modul `Protokoll` abbauen

Hinweis: Der Meilenstein â€žProjektverwaltung / Projekt-Arbeitsbereichâ€œ ist abgeschlossen und dokumentiert.

---

## Zuletzt bearbeitet
- Letztes Paket:
  - Protokoll-Quicklane im TopsScreen auf einen TOP-Filter umgestellt
  - die Quicklane zeigt jetzt einen Filter-Button mit den Modi `Alle`, `ToDo` und `Beschluss`
  - `TopsScreenViewModel` filtert die sichtbare Liste nach dem gewaehlten Modus
  - Header-Buttons `Ausgabe`, `Firmen` und `Projekt` werden im Protokoll-Kontext nicht mehr als Quicklane-Aktionen gezeigt
  - `npm test` ist gruen
- Letztes Paket:
  - reine Button-Helfer aus `CoreShell` in `src/renderer/app/coreShellButtons.js` ausgelagert
  - `CoreShell` importiert `mkNavBtn`, `mkActionBtn`, `setBtnEnabled`, `appendButtonGroup` und `createScreenRouteButton`
  - Core-Navigation, Style-Hilfe und Teilnehmer-Aktion bleiben separat gekapselt
  - `npm test` ist gruen
- Letztes Paket:
  - globaler Header im Shell-Kontext textbasiert neu aufgebaut
  - links steht jetzt `BBM <Version>` plus `aktiv: <Modul> | <Projektnummer> - <Kurzbezeichnung>`
  - rechts steht der ruhige Kunden-/Lizenztext aus den vorhandenen Settings
  - der alte `bereit:`-Statusblock und das sichtbare Statuspunktfeld sind entfernt
  - `npm test` ist nach dem Umbau erneut zu pruefen
- Letztes Paket:
  - Teilnehmer-Shell-Aktion aus `CoreShell` in `src/renderer/app/coreShellActions.js` ausgelagert
  - `CoreShell` importiert die Factory weiterhin und haengt den Teilnehmer-Button unveraendert in die Sidebar
  - Kontextsteuerung fuer Projekt/Besprechung bleibt im Shell-Teil
  - `npm test` ist gruen
- Letztes Paket:
  - leere Kontext-/Projekt-Navigationslogik aus `CoreShell` entfernt
  - `btnParticipants` und `updateContextButtons` bleiben als reine Kontextsteuerung erhalten
  - Core-Sidebar bleibt unveraendert und fachfrei
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Navigationsdefinition aus `CoreShell` in `src/renderer/app/coreShellNavigation.js` ausgelagert
  - `CoreShell` importiert die Route-Definitionen und baut daraus weiterhin die Buttons
  - Labels, Router-Methoden und Core-Sidebar-Verhalten unveraendert
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Navigationsdefinition aus `CoreShell` in `src/renderer/app/coreShellNavigation.js` ausgelagert
  - `CoreShell` erzeugt die Buttons weiter aus der ausgelagerten Route-Definition
  - Labels und Navigation unveraendert, Core-Sidebar bleibt fachfrei
  - `npm test` ist gruen
- Letztes Paket:
  - reine Shell-Style-Injektion aus `CoreShell` in `src/renderer/app/coreShellStyles.js` ausgelagert
  - `CoreShell` ruft die Style-Hilfe nur noch auf; Navigation und Router-Verdrahtung bleiben unveraendert
  - keine optische oder fachliche Aenderung
  - `npm test` ist gruen
- Letztes Paket:
  - toter old/new-UI-Modus aus `CoreShell` entfernt
  - `CoreShell.start()` startet den bestehenden Shell-Aufbau direkt ueber `_initShell()`
  - `main.js` bleibt Bootstrap und uebergibt keinen UI-Modus mehr
  - Core-Sidebar-Verhalten unveraendert
  - `npm test` ist gruen
- Letztes Paket:
  - alte Sidebar-Nachsortierung in `CoreShell._initUiNew()` entfernt
  - `CoreShell` delegiert den neuen UI-Modus jetzt nur noch auf den bestehenden Core-Shell-Aufbau
  - Core-Navigation bleibt unveraendert, Fachmodule bleiben aus der Sidebar draussen
  - `npm test` ist gruen
- Letztes Paket:
  - Core-Shell-/Sidebar-Aufbau aus `main.js` in `src/renderer/app/CoreShell.js` ausgelagert
  - `main.js` bleibt beim Bootstrapping: Router erzeugen, Theme/Settings vorbereiten, `CoreShell` starten
  - Core-Navigation mit Start/Projekte/Firmen/Einstellungen/Hilfe/Beenden bleibt erhalten
  - Fachmodule tauchen weder in `main.js` noch in `CoreShell` als Sidebar-Definition auf
  - `npm test` ist gruen
- Letztes Paket:
  - Projekt-Arbeitsbereich von direktem Protokoll-Modulkatalog getrennt
  - `ProjectWorkspaceScreen` importiert `getActiveProjectModuleNavigation` und `PROTOKOLL_MODULE_ID` nicht mehr direkt
  - Router stellt die Arbeitsbereiche fuer den Projekt-Arbeitsbereich bereit und reicht sie an den Screen durch
  - Projektfirmen werden dort zusaetzlich zu Protokoll angezeigt
  - `npm test` ist gruen
- Letztes Paket:
  - Machine-Binding Schritt 1: Lizenzanforderung speichern (`bbm-license-request.json`) inkl. Tests (Payload/IPC/Preload/UI/Grenzen)
- Letzter sinnvoller bestÃ¤tigter Stand:
  - Speichern-/LÃ¶schen-Vertrag im Tops-Bereich Ã¼ber zugehÃ¶rigen Testvertrag stabilisiert
- Letzter Cloud-Kontrolllauf:
  - `AGENTS.md` gefunden
  - `PLAN.md` gefunden
  - Codex konnte den Repo-Stand lesen
- Cloud-Kontrolllauf (zum damaligen Stand):
  - Branch: `modularisierung/projektverwaltung`
  - `HEAD` und `origin/modularisierung/projektverwaltung` waren identisch
  - der lokale Diff war leer
- Abgeschlossener Meilenstein:
  - Projekt-Arbeitsbereich ist technisch umgesetzt und stabilisiert
  - Projektklick oeffnet nicht mehr direkt Protokoll
  - Projektklick oeffnet den Projekt-Arbeitsbereich
  - einziges auswaehlbares Projektmodul ist aktuell Protokoll
  - Maschinenraumdienste erscheinen dort nicht als Projektmodule
  - Protokoll-Logik blieb unveraendert
  - `npm test` war gruen
- Beobachtung:
  - Ohne Fortschrittsdatei interpretiert Codex den Plan zu wÃ¶rtlich und nimmt erledigte Meilensteine erneut als offen an.

---

## Aktuell nÃ¤chster sinnvoller Schritt
Der naechste sinnvolle kleine Schritt nach diesem Paket ist:

### Lizenzverwaltung Paket 6 vorbereiten
- Ziel:
  - bestehende Lizenz laden, aendern und neu ausgeben als naechsten kleinen Adminschritt vorbereiten
- Wichtig:
  - Kundenverwaltung/Historie weiter nicht vorziehen
  - Audio / Diktat bleibt Maschinenraum ohne Projektmodul- oder Sidebar-Eintrag

---

## Offene Hindernisse / bekannte Probleme
- FrÃ¼here LÃ¤ufe zeigten bestehende Altprobleme, u. a.:
  - `ERR_INVALID_URL` im Zusammenhang mit ESM/CSS-Importpfaden
- Diese Probleme gelten nicht automatisch als Teil jedes neuen Mini-Pakets.
- Wenn ein neuer Meilenstein an diesen Punkten hÃ¤ngen bleibt, stoppen und offen berichten.

---

## Regeln fÃ¼r Fortschrittsfortschreibung
Nach jedem abgeschlossenen Paket oder Meilenstein ergÃ¤nzen:
1. Was wurde erledigt?
2. Welche Dateien waren betroffen?
3. Welcher Commit gehÃ¶rt dazu?
4. Was ist jetzt der nÃ¤chste offene Schritt?
5. Gab es Hindernisse oder Restrisiken?

Wichtig:
- `STATUS.md` beschreibt den Ist-Stand.
- `PLAN.md` bleibt der Soll-Plan.
- Erledigte Schritte sollen in `STATUS.md` dokumentiert werden, nicht durch stÃ¤ndiges Umschreiben von `PLAN.md`.

---

## Merksatz
- `AGENTS.md` = Hausordnung
- `PLAN.md` = Bauablaufplan
- `STATUS.md` = Bautagebuch / Ist-Stand

#### Paket: Lizenzverwaltung Paket 3 (Produktumfang intern zentral strukturiert)
- Status: erledigt
- Beschreibung:
  - zentrale Produktumfangs-Struktur `PRODUCT_SCOPE` im Modul `lizenzverwaltung` angelegt
  - `createLicenseEditorSection` auf die zentrale Struktur umgestellt (Standardumfang, Zusatzfunktionen, Module)
  - sichtbares Verhalten beibehalten: Standardumfang fix, mail/Dictate auswÃ¤hlbar, Module vorbereitet/deaktiviert
  - Features-Ausgabe bleibt kompatibel mit internem `audio`-Key fuer Dictate
- Betroffene Dateien:
  - `src/renderer/modules/lizenzverwaltung/productScope.js`
  - `src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Hinweise:
  - Keine Lizenzdatei-Strukturreform, keine Modulfreischaltung und keine Sidebar-/Projektmodul-Aenderung

#### Paket: Lizenzmodell-Korrektur BBM/Protokoll/Diktat
- Status: erledigt
- Beschreibung:
  - Lizenzmodell auf Zielbegriffe ausgerichtet: Produkt `bbm`, Modul `protokoll`, Zusatzfunktion `diktat`.
  - Runtime-Guards auf Modul/Funktion umgestellt: Protokoll erfordert `protokoll`, Diktat erfordert `protokoll` + `diktat`.
  - Lizenzstatus/Diagnose trennt Module und Funktionen; Lizenzanforderung nutzt Produkt `bbm`.
  - Rueckwaertskompatibilitaet bleibt aktiv (`bbm-protokoll`, `audio`/`dictate` als Alias).
- Betroffene Dateien:
  - `src/main/licensing/licenseFeatures.js`
  - `src/main/licensing/licenseService.js`
  - `src/main/licensing/featureGuard.js`
  - `src/main/licensing/licenseVerifier.js`
  - `src/main/ipc/licenseIpc.js`
  - `src/main/ipc/projectsIpc.js`
  - `src/main/ipc/printIpc.js`
  - `src/main/ipc/audioIpc.js`
  - `src/main/main.js`
  - `scripts/tests/licenseRequest.test.cjs`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `scripts/tests/licenseStandardFeatures.test.cjs`
  - `scripts/tests/featureGuardEnforcement.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - Renderer-Lizenzstatusanzeige optional feinjustieren (Labels Produkt/Module/Funktionen), ohne Admin/GeneÂ­rator-Rueckbau.
- Risiken/Hinweise:
  - Legacy-Tests mit Alias-Begriffen bleiben teils bewusst erhalten fuer sanften Uebergang.

#### Paket: CoreShell-Layout-Auslagerung
- Status: erledigt
- Beschreibung:
  - Reine Shell-Layout-/DOM-Struktur aus `CoreShell.js` in `src/renderer/app/coreShellLayout.js` ausgelagert.
  - Host-Setup, Sidebar-Container, Content-Root, Top-/Bottom-Boxen und Host-Append bleiben funktional unveraendert.
  - Router-Verdrahtung, Navigation, Aktionen und Kontextsteuerung verbleiben in `CoreShell.js`.
- Betroffene Dateien:
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur Layout/DOM-Struktur verschoben; fachliche Navigation und Router-Kanten bewusst unangetastet gelassen.

#### Paket: Entfernen des toten Firmen/Mitarbeiter-Schalters
- Status: erledigt
- Beschreibung:
  - Toten Schalter `Beta: Firmen/Mitarbeiter v2` und die zugehoerige `useNewCompanyWorkflow`-Verdrahtung aus `main.js` und `CoreShell.js` entfernt.
  - Druck-v2-Keys und Druckeinstellungen bleiben unveraendert.
  - Core-Navigation, Teilnehmer-Aktion, Router-Verdrahtung und allgemeiner Sticky-Notice-Listener bleiben bestehen.
- Betroffene Dateien:
  - `src/renderer/main.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Bereinigung
- Risiken/Hinweise:
  - Nur der tote Schalter wurde entfernt; `print.v2.*` und sonstige Ausgabelogik sind bewusst unveraendert geblieben.

#### Paket: CoreShell-Header-Bridge-Auslagerung
- Status: erledigt
- Beschreibung:
  - Header-/Router-Bridges aus `CoreShell.js` in `src/renderer/app/coreShellHeaderBridge.js` ausgelagert.
  - Router-Bridge fuer Output-Mail, Output-Print, Closed-Protocol-Selector und Header-/Theme-/Sticky-Notice-Events bleibt funktional unveraendert.
  - CoreShell behÃ¤lt Layout, Navigation, Teilnehmer-Aktion und Router-Kanten ausserhalb der Header-Bridge.
- Betroffene Dateien:
  - `src/renderer/app/coreShellHeaderBridge.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Header-/Router-Bridges verschoben; fachliche Navigation und Layout blieben bewusst unangetastet.

#### Paket: CoreShell-Keyboard-Handling-Auslagerung
- Status: erledigt
- Beschreibung:
  - Globales Enter/Escape-Keyboard-Handling aus `CoreShell.js` in `src/renderer/app/coreShellKeyboard.js` ausgelagert.
  - Das Verhalten fuer Overlay-Buttons bleibt unveraendert.
  - Header-Bridge, Layout, Navigation, Button-Helfer und fachliche Module blieben unangetastet.
- Betroffene Dateien:
  - `src/renderer/app/coreShellKeyboard.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur das globale Keyboard-Handling verschoben; UI- und Fachlogik bleiben unveraendert.

#### Paket: CoreShell-Quit-Button-Auslagerung
- Status: erledigt
- Beschreibung:
  - Beenden-/Quit-Button aus `CoreShell.js` in `src/renderer/app/coreShellActions.js` ausgelagert.
  - Styling, `appQuit()`-Aufruf, Fallback `window.close()` und Beenden-Hinweis bleiben funktional unveraendert.
  - `CoreShell` haengt den Button nur noch in die Bottom-Box ein.
- Betroffene Dateien:
  - `src/renderer/app/coreShellActions.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Quit-Button-Erzeugung verschoben; Rest der Shell bleibt unveraendert.

#### Paket: CoreShell-Kontextsteuerung-Auslagerung
- Status: erledigt
- Beschreibung:
  - Kontextsteuerung fuer den Teilnehmer-Button aus `CoreShell.js` in `src/renderer/app/coreShellContextControls.js` ausgelagert.
  - `bbm:router-context` und die Projekt-/Besprechungshinweise bleiben funktional unveraendert.
  - `CoreShell` ruft die zurueckgegebene `updateContextButtons()`-Funktion weiterhin fuer Start und Navigation auf.
- Betroffene Dateien:
  - `src/renderer/app/coreShellContextControls.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Teilnehmer-Kontextsteuerung verschoben; restliche Shell-Komponenten bleiben unveraendert.

#### Paket: CoreShell-Navigation-Runtime-Auslagerung
- Status: erledigt
- Beschreibung:
  - Navigation-Runtime-Helfer `buttonsByKey`, `setActive` und `runNavSafe` aus `CoreShell.js` in `src/renderer/app/coreShellNavigationRuntime.js` ausgelagert.
  - `router.onSectionChange` bleibt in `CoreShell.js`; das Verhalten der Navigation bleibt unveraendert.
  - Restliche Shell-Komponenten wie Header-Bridge, Keyboard, Layout, ContextControls und Actions bleiben unangetastet.
- Betroffene Dateien:
  - `src/renderer/app/coreShellNavigationRuntime.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur die Navigation-Runtime-Helfer verschoben; die Navigation selbst bleibt bewusst in CoreShell verdrahtet.

#### Paket: CoreShell-Body-Grundsetup-Auslagerung
- Status: erledigt
- Beschreibung:
  - Body-Grundsetup aus `CoreShell.js` in `src/renderer/app/coreShellLayout.js` verschoben.
  - `document.body.style.margin`, `height`, `background` und `color` werden nun ueber `prepareCoreShellBody()` gesetzt.
  - Layout, Navigation und alle anderen Shell-Bausteine bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/app/CoreShell.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - kein offener Folge-Schritt fuer diese Extraktion
- Risiken/Hinweise:
  - Nur das Body-Setup verschoben; der restliche Layout-/Shell-Aufbau bleibt bewusst unangetastet.

#### Paket: Firmenbegriffe und Labels klaeren
- Status: erledigt
- Beschreibung:
  - Sichtbare Begriffe rund um Firmen/Firmen im Projekt/Firmen hinzufuegen in `ProjectFirmsView.js`, `FirmsPoolView.js` und den zugehoerigen Router-/Test-Erwartungen geschaerft.
  - Projektbezogene Bezeichnung `Projektfirmen` durch `Firmen im Projekt` ersetzt, die Fachlogik und Sortierreihenfolge blieben unveraendert.
  - Projektpool-CTA auf `Firmen hinzufuegen` / `Aus Firmenstamm hinzufuegen` vereinheitlicht.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `src/renderer/views/FirmsPoolView.js`
  - `src/renderer/app/Router.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur sichtbare Texte/Labels angepasst; Sortierlogik, DB-/IPC-Namen und Projektfirmen-Funktionen bleiben unveraendert.

#### Paket: Doppelten Projekttitel in Firmen im Projekt entfernen
- Status: erledigt
- Beschreibung:
  - Im Header von `ProjectFirmsView` die doppelte Projektbezeichnung neben `Firmen im Projekt` entfernt.
  - Der Button `Zum Projekt` und der restliche Inhalt bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur die sichtbare Doppelanzeige entfernt; Routing, Projektlogik und Firmenlogik bleiben unveraendert.

#### Paket: Projektbezeichnung im Firmen-im-Projekt-Header entfernen
- Status: erledigt
- Beschreibung:
  - Im Kopf von `ProjectFirmsView` die doppelte Projektbezeichnung neben `Firmen im Projekt` entfernt.
  - Der Button `Zum Projekt` und die restliche Ansicht bleiben unveraendert.
- Betroffene Dateien:
  - `src/renderer/views/ProjectFirmsView.js`
  - `scripts/tests/projektverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Nur die sichtbare Kopfzeile reduziert; globale Header-Anzeige und Projektlogik bleiben unveraendert.

#### Paket: Firmenrollen-Kachel und Rollenreihenfolge-Dialog wiederherstellen
- Status: erledigt
- Beschreibung:
  - In den Einstellungen eine sichtbare Kachel `Firmenrollen` ergaenzt.
  - Die Kachel oeffnet den Dialog `Rollenreihenfolge fÃ¼r Firmen` mit Zwei-Spalten-Liste, Hinweis, Hinzufuegen sowie Schieben/Edit/Loeschen fuer die markierte Rolle.
  - Die bestehenden Settings-Schluessel `firm_role_order` und `firm_role_labels` werden weiterhin fuer Laden und Speichern verwendet.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `siehe aktuellen Branch-Commit`
- Naechster offener Schritt:
  - keine direkte Anschlussaufgabe aus diesem Mini-Paket
- Risiken/Hinweise:
  - Die bestehende Rollen-/Kategorie-Settings-Struktur bleibt unveraendert; die sichtbare UI wurde nur wieder eingeblendet, vereinfacht und sprachlich geschaerft.

#### Paket: Nummernluecken direkt nach Delete schliessen
- Status: erledigt
- Beschreibung:
  - Nach erfolgreichem Loeschen eines TOPs oder Titels wird im Protokoll die bestehende `meetingTopsFixNumberGap`-Reparatur direkt angestossen.
  - Der alte Fallback beim Schliessen des Protokolls bleibt unveraendert erhalten.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `scripts/tests/protokollRouterFallback.test.cjs`
  - `scripts/tests/topsScreen.integration.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die bestehende Reparatur-Logik wird wiederverwendet; falls die Delete-Reparatur fehlschlaegt, bleibt der Close-Fallback als zweite Sicherung bestehen.

#### Paket: +Titel/Create-Kontext nach Renumber wiederherstellen
- Status: erledigt
- Beschreibung:
  - `+Titel` kann wieder ohne aktive Auswahl angelegt werden.
  - Der neu erzeugte Titel wird automatisch ausgewahlt und als Create-Kontext fuer den naechsten `+TOP` gemerkt.
  - Der bestehende Delete-/Renumber-Flow bleibt erhalten; die Nummernreparatur nach Delete laeuft weiter sofort.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `scripts/tests/protokollRouterFallback.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der Create-Kontext wird im Screen gehalten; bei weiteren Create-Regeln muss spaeter nur dieser Pfad erweitert werden.

#### Paket: Diktat/Audio von Entwicklung nach Eingabe & Erfassung verschieben
- Status: erledigt
- Beschreibung:
  - `Diktat / Audio` erscheint jetzt als eigene Kachel unter `Eingabe & Erfassung`.
  - Der Technik-Dialog enthaelt diesen Tab nicht mehr.
  - Die bestehenden Audio-Einstellungen bleiben ueber den neuen Einstieg erreichbar.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der Audio-Baustein bleibt intern derselbe; nur der sichtbare Einstieg wurde umgehaengt.

#### Paket: Adminbereich aus Settings-Ãœbersicht entfernen
- Status: erledigt
- Beschreibung:
  - Der sichtbare Einstieg `Adminbereich` / `Externe Lizenzverwaltung` wurde aus der normalen Settings-Ãœbersicht entfernt.
  - `Lizenzstatus` bleibt unter `Allgemein` erhalten.
  - `Entwicklung` zeigt danach nur noch `Technik`.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Der interne Lizenz-Admin-Code bleibt bewusst stehen; nur der sichtbare Settings-Einstieg ist entfernt.

#### Paket: Modul-/Feature-/Lizenzregel dokumentiert
- Status: erledigt
- Beschreibung:
  - Die Doku beschreibt jetzt die Regel fuer Fachmodule, Hilfsfunktionen, Ausgabe-Infrastruktur und externen Lizenzbau.
  - Die Kurzregel macht die fachliche Trennung in einem Blick lesbar.
- Betroffene Dateien:
  - `docs/settings-structure.md`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Nur Dokumentation wurde ergaenzt; App-Logik blieb unveraendert.

#### Paket: Globale UI-Schrift auf Noto Sans umgestellt
- Status: erledigt
- Beschreibung:
  - Die normale App-Oberflaeche nutzt jetzt zentral `Noto Sans` als UI-Schrift.
  - Die Print-/PDF-Schriften bleiben unveraendert.
  - TopsScreen, Settings, Projektverwaltung und globale Shell nutzen die gemeinsame UI-Variable.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/index.html`
  - `src/renderer/editor.html`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `src/renderer/ui/HelpModal.js`
  - `src/renderer/ui/ParticipantsModals.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die Tops-Textschrift bleibt als separate Modul-/Top-Regel bestehen; Print bleibt bewusst unberuehrt.

#### Paket: Settings-Ãœbersicht als Accordion poliert
- Status: erledigt
- Beschreibung:
  - Die Settings-Gruppen sind jetzt als einklappbare Accordions umgesetzt.
  - `Allgemein` ist initial offen, die anderen Gruppen starten geschlossen.
  - Kachel- und Gruppentexte sind ruhiger, dunkler und kompakter gestaltet.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Die Accordion-Logik speichert keinen Zustand; nach Reload startet die Ãœbersicht wieder mit `Allgemein` offen.
#### Paket: Appweite Button-Styles vereinheitlicht
- Status: erledigt
- Beschreibung:
  - Die App nutzt jetzt einen konsolidierten UI-Button-Stil ueber zentrale Varianten.
  - Buttons wirken ruhiger und konsistenter; Standardaktionen sind dezenter, gefaehrliche Aktionen sind klar als `danger` markiert.
  - Settings, Tops, Projektverwaltung und die allgemeinen Shell-/Modal-Buttons nutzen die gemeinsamen Basisregeln.
  - Print-/PDF-Buttonoptik und Drucklogik blieben bewusst unveraendert.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/app/coreShellLayout.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `src/renderer/ui/HelpModal.js`
  - `src/renderer/ui/ParticipantsModals.js`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Spezielle Fachbuttons behalten ihre jeweiligen Varianten, damit keine Layouts oder Fachaktionen verrutschen.
  - Print/PDF-CSS und Druckausgabe wurden bewusst nicht angefasst.

#### Paket: Button-Styles visuell feiner abgestimmt
- Status: erledigt
- Beschreibung:
  - Die zentrale Buttonbasis wurde optisch feiner und leichter gemacht.
  - Hoehe, Padding, Radius, Schriftgewicht und Hover-Verhalten wurden dezent reduziert.
  - Primary, Secondary, Danger und Ghost bleiben als Varianten erhalten, wirken aber ruhiger.
  - Dialog- und Shell-Buttons nutzen die feinere Basis ohne Funktionsaenderung.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Fachspezifische Button-Layouts mit eigenen Min-Hoehen bleiben bewusst unangetastet.
  - Druck-/PDF-Buttons wurden nicht umgebaut.

#### Paket: Button-Groesse weiter reduziert
- Status: erledigt
- Beschreibung:
  - Die zentrale Buttonbasis ist jetzt deutlich kompakter.
  - Standardbuttons nutzen eine kleinere Hoehe, weniger Innenabstand und eine feinere Schriftgroesse.
  - Die bestehenden Varianten `primary`, `secondary`, `danger` und `ghost` bleiben erhalten, wirken aber leichter.
  - Der kleinere Rasterstand wurde zentral umgesetzt, ohne Klicklogik oder Dialogflows zu aendern.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Einige Fach-Buttons behalten bewusst lokale Minimalhoehen, damit spezialisierte Layouts stabil bleiben.
  - Print-/PDF-Buttons und Drucklogik wurden nicht angefasst.

#### Paket: Zentrale Button-Tokens eingefuehrt
- Status: erledigt
- Beschreibung:
  - Appweite Button-Tokens wurden zentral in den globalen UI-Styles definiert.
  - Die vorhandenen Standardbuttons haengen jetzt an diesen Tokens fuer Hoehe, Padding, Radius, Schrift, Border, Hover, Focus und Disabled.
  - Varianten `primary`, `secondary`, `danger` und `ghost` bleiben erhalten und sind an den zentralen Token-Satz gebunden.
  - Die Button-Optik bleibt kompakt und dezent, ohne Fachlogik oder Druckpfade zu aendern.
- Betroffene Dateien:
  - `src/renderer/app/coreShellStyles.js`
  - `src/renderer/ui/popupButtonStyles.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Fachspezifische Einzelformen bleiben dort bestehen, wo sie fuer Layout oder Bedienung notwendig sind.
  - Print-/PDF-Stile wurden bewusst nicht mit den Button-Tokens gekoppelt.

#### Paket: Modul-/Feature-/Lizenzmatrix testseitig abgesichert
- Status: erledigt
- Beschreibung:
  - Die Matrix zwischen Fachmodul `Protokoll`, Hilfsfunktion `Diktat / Audio` und Lizenzstatus ist jetzt mit zusaetzlichen Regressionstests abgesichert.
  - Der positive Protokollpfad ist ebenso abgedeckt wie der geblockte Fall mit strukturiertem Payload.
  - Der cached Modulstatus in `moduleAccessState` ist direkt mit Lizenzdaten abgesichert.
  - Projektverwaltung, Settings und Ausgabe-/Mail-/PDF-Guards bleiben weiterhin testseitig getrennt pruefbar.
- Betroffene Dateien:
  - `scripts/tests/protokollProjectEntryRouting.test.cjs`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Es wurden nur Tests ergaenzt; App-Logik blieb unveraendert.

#### Paket: Diktat/Audio-Freischaltung und Mikrofon-Buttons
- Status: erledigt
- Beschreibung:
  - Diktat/Audio wird jetzt ueber das Lizenzfeature `audio`/`diktat` oder den internen Entwicklungsschalter `Diktat-Testfreigabe` freigeschaltet.
  - Die Mikrofon-Buttons im TopsScreen erscheinen nur bei aktiver Freischaltung und zeigen waehrend der Aufnahme einen roten Punkt.
  - Der Entwicklungsschalter sitzt im Entwicklungsdialog und bleibt als Test-/Prueffunktion von normalen Kundenfunktionen getrennt.
  - Die Lizenz- und Settings-Gates wurden so erweitert, dass der neue Schalter im Main-/Renderer-Pfad sauber erkannt wird.
- Betroffene Dateien:
  - `src/main/ipc/audioIpc.js`
  - `src/main/ipc/settingsIpc.js`
  - `src/renderer/features/audio/AudioFeature.js`
  - `src/renderer/features/audio-dictation/DictationController.js`
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/views/TopsView.js`
  - `scripts/tests/licenseFeatureGuards.test.cjs`
  - `scripts/tests/lizenzverwaltungModule.test.cjs`
  - `scripts/tests/topsScreen.integration.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - kein direkter Anschluss aus diesem Paket
- Risiken/Hinweise:
  - Es wurde bewusst keine externe Lizenz-App und keine Generator-/Admin-UI in die normale App zurueckgebracht.
  - Die Stop-Logik fuer das Diktat bleibt bei der vorhandenen Audio-Funktionalitaet; der neue Zustand steuert vor allem Sichtbarkeit und Anzeige.
- Der Einstieg `Drucken` oeffnet jetzt zuerst eine Druckart-Auswahl:
  - `Protokoll drucken` fuehrt danach zur gewohnten Auswahl geschlossener Protokolle
  - vorhandene weitere Ausgaben bleiben ueber den ersten Schritt erreichbar, deaktivierte Optionen werden nicht als funktionierend vorgetaeuscht
  - Protokoll-PDF-Vorschau, Firmenliste, ToDo-Liste und TOP-Liste bleiben dabei erreichbar
  - gespeicherte Firmenlisten sind nicht mehr als funktionale Ausgabeart angeboten
  - Firmenliste laeuft direkt ueber den aktuellen Projektstand und braucht keine geschlossene-Protokoll-Auswahl
  - eine separate Mitarbeiter-/Personenliste ist im aktuellen Druckdialog noch nicht als eigener Modus vorhanden

#### Paket: DEV PDF-Layout TOP-Liste (Metablock Innenabstand speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Metablock-Innenabstand (Print-HTML Vorschau, DEV-only) wird beim Speichern jetzt ueber `protokoll_tops` in der bestehenden `tableLayouts`-Sanitization mitgetragen und nach Neustart wieder angewendet.
  - Reset stellt Breite und Innenabstand wieder auf Standard zurueck.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: PDF-Metablock-Innenabstand ebenfalls in der Toolbar als gespeicherter Default nach Save aktualisieren (rein kosmetisch)
- Risiken/Hinweise:
  - Keine PDF-Export-Logik angepasst; Markierungen bleiben DEV-only in der HTML-Vorschau.

#### Paket: PDF-Vorschau bei offener Besprechung erlauben (ohne finalen Druck freizugeben)
- Status: erledigt
- Beschreibung:
  - Die Sperre "Druck nur fuer geschlossene Besprechungen" greift jetzt nur noch beim finalen Protokolldruck.
  - PDF-Vorschau/Vorabzug und DEV-Layout-Preview werden bei offener Besprechung nicht mehr blockiert.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Kein Umbau der Drucklogik; nur die Blockierbedingung wurde um `preview` ergaenzt.

#### Paket: DEV-Layout-Preview auch in Protokoll-PDF-Vorschau wieder aktiv
- Status: erledigt
- Beschreibung:
  - Bei `printMeetingPreview` (Protokoll-PDF-Vorschau) wird im DEV-Channel wieder zusaetzlich das interaktive Print-HTML-Preview geoeffnet, damit Layout-Zonen/Toolbar aktiv sind, ohne den echten PDF-Export zu beeinflussen.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Nur DEV-only Zusatzfenster; STABLE bleibt ohne Layout-Werkzeuge.

#### Paket: DEV PDF-Layout Reset setzt wieder echte Standards (TOP-Liste Metablock)
- Status: erledigt
- Beschreibung:
  - Reset in der DEV-Print-HTML Vorschau nutzt jetzt fuer Breite/Innen die Werte aus `defaultLayout` (nicht aus `effectiveLayout`), damit nach vorherigem Speichern der Reset wirklich auf Standard zurueckgeht.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Nur Reset-/Default-Handling im DEV-Preview angepasst; Speichern/Laden bleibt ueber `tableLayouts` unveraendert.

#### Paket: DEV PDF-Layout TOP-Liste (Metablock Schrift speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Metablock speichert jetzt zusaetzlich zur Breite und zum Innenabstand auch die Schriftgroesse ueber `pdf.rootVars.--bbm-top-col-meta-font-size`.
  - Reset stellt Breite/Innen/Schrift wieder auf die echten Standardwerte aus `defaultLayout`.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Schrift wird aktuell als `px` gespeichert (Toolbar-Schrittweite 1px); CSS akzeptiert das auch im Print-HTML Preview.

#### Paket: DEV PDF-Layout TOP-Liste (Nummernblock live, ohne Speichern)
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML Vorschau lassen sich fuer den PDF-Nummernblock jetzt Breite (mm), Innen (mm) und Schrift (pt) live einstellen.
  - Keine Speicherung/kein Reset fuer Nummernblock in diesem Schritt; beim Neuoeffnen ist wieder Standard aktiv.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Speicherung/Reset fuer Nummernblock analog Metablock (separater Meilenstein)
- Risiken/Hinweise:
  - Die Nummernblock-Innenaenderung setzt aktuell `padding-left` inline auf `th/td.colNr` (nur im laufenden Preview).

#### Paket: DEV PDF-Layout TOP-Liste (Nummernblock speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Nummernblock speichert jetzt Breite (ueber `columns[].pdfWidth`/`pdfNumberWidth`), Innenabstand (ueber `pdf.rootVars.--bbm-top-col-nr-padding-left`) und Schrift (ueber `pdf.rootVars.--bbm-top-col-nr-font-size`).
  - Reset stellt die Werte wieder auf Standard zurueck und wendet sie sofort sichtbar an.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Die Hauptschriftgroesse des Nummernblocks ist jetzt per CSS-Variable steuerbar; Datum/Hinweis werden im Preview proportional per Inline-Style mitgefuehrt.

#### Paket: DEV PDF-Layout TOP-Liste (Textblock live, ohne Speichern)
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML Vorschau laesst sich der PDF-Textblock live einstellen: Innen (mm) und Schrift (pt).
  - Breite bleibt gesperrt als "Restbereich" (keine direkte Textblock-Breitenverstellung).
  - Keine Speicherung/kein Reset fuer Textblock in diesem Schritt.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Textblock speichern/reset (separater Meilenstein)
- Risiken/Hinweise:
  - Text-Schrift wird live per Inline-Style auf `.shortText/.longText` gesetzt (nur im laufenden Preview).

#### Paket: DEV PDF-Layout TOP-Liste (Textblock speichern/reset)
- Status: erledigt
- Beschreibung:
  - Der PDF-Textblock speichert jetzt Innenabstand (pdf.rootVars text padding left/right) und Schriftgroesse (pdf.rootVars `--bbm-top-col-text-font-size`).
  - Textblock-Breite bleibt "Restbereich" und wird nicht gespeichert.
  - Reset stellt die Standardwerte aus `defaultLayout` wieder her und wendet sie sofort sichtbar an.
- Betroffene Dateien:
  - `src/shared/tableLayouts/protokollTopsLayout.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der UI-Regler "Innen" setzt beim Speichern aktuell links und rechts symmetrisch; Standard-Reset stellt die urspruenglichen Default-Werte (0 / 1.5mm) wieder her.

#### Paket: Refactor 1 (DevLayoutToolbar zentralisieren)
- Status: erledigt
- Beschreibung:
  - `DevLayoutToolbar` wurde aus dem Protokoll-Modul in ein zentrales Hilfsmodul verschoben: `src/renderer/layoutTools/DevLayoutToolbar.js`.
  - Protokoll (TopsHeader/TopsList) importiert die Toolbar jetzt aus dem neuen Pfad; Verhalten bleibt gleich.
  - Tests wurden minimal angepasst, damit `npm test` nach den CSS-Variablen-Umstellungen weiterhin gruen laeuft (keine Verhaltensaenderung).
- Betroffene Dateien:
  - `src/renderer/layoutTools/DevLayoutToolbar.js`
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `scripts/tests/tableLayoutRegistry.test.cjs`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Keine funktionalen Aenderungen beabsichtigt; Bitte kurz manuell pruefen: TOP-UI Layout-Toolbar erscheint im DEV-Modus wie vorher.

#### Paket: Refactor 2 (TOP-Zonen aus DevLayoutToolbar auslagern)
- Status: erledigt
- Beschreibung:
  - TOP-spezifische Zonendefinitionen (Keys/Labels/Controls) wurden in eine Surface-Datei ausgelagert:
    `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`.
  - `DevLayoutToolbar` ist jetzt surface-getrieben und enthaelt keine TOP-spezifischen Labels/Zonen mehr (Fallback bleibt fuer Kompatibilitaet).
  - Protokoll bindet die Toolbar wie vorher ein; Verhalten bleibt gleich.
- Betroffene Dateien:
  - `src/renderer/modules/protokoll/layoutSurfaces/toplistLayoutSurface.js`
  - `src/renderer/layoutTools/DevLayoutToolbar.js`
  - `src/renderer/modules/protokoll/TopsHeader.js`
  - `src/renderer/modules/protokoll/TopsList.js`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Keine Verhaltensaenderung beabsichtigt; nur Zonendefinition/Labels umgezogen.

#### Paket: DEV layoutTools Auto-Erkennung fuer einfache PDF-Tabellen
- Status: erledigt
- Beschreibung:
  - In der DEV-Print-HTML-Vorschau werden einfache Tabellen jetzt automatisch als layoutfaehige Surfaces erkannt, sofern sie `thead/th` oder `colgroup/col` haben und keine manuellen layoutTools-Marker tragen.
  - Manueller Protokoll-Stand bleibt priorisiert; TOP-Liste und Teilnehmerliste behalten ihre bisherigen Zonen.
  - Auto-Surfaces sind anklickbar und werden im DEV-Layoutmodus gruen markiert; echte PDF-Ausgaben bleiben markerfrei.
- Betroffene Dateien:
  - `src/renderer/layoutTools/autoTableLayout.mjs`
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `scripts/test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: Persistenz/Speicherpfad fuer stabile neue Auto-Surfaces vorbereiten, wenn ein echter stabiler `tableKey` feststeht
- Risiken/Hinweise:
  - Auto-Erkennung bleibt heuristisch und absichtlich konservativ; komplexe Karten-/Sonderlayouts werden weiterhin nicht automatisch als Layout-Surface behandelt.

#### Paket: DEV Layout-Einstieg ToDo-Vorschau
- Status: erledigt
- Beschreibung:
  - Der DEV-only Vorschauweg fuer `mode: "todo"` nutzt jetzt ebenfalls `print:openHtmlPreview` mit `devLayoutPreview`.
  - Normale ToDo-PDF-Erzeugung bleibt unveraendert; der neue Weg ist nur fuer die Layout-HTML-Vorschau gedacht.
- Betroffene Dateien:
  - `src/renderer/modules/ausgabe/PrintModal.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der neue Einstieg bleibt bewusst DEV-only und greift nicht in die fertige PDF-Erzeugung ein.

#### Paket: DEV Auto-Tabellen Live-Regler
- Status: erledigt
- Beschreibung:
  - Fuer automatisch erkannte einfache PDF-Tabellen in der DEV-Print-HTML-Vorschau funktionieren jetzt generische Live-Regler fuer Breite, Innenabstand und Schriftgroesse.
  - Die Werte bleiben bewusst nur im laufenden Vorschau-Tab wirksam; es gibt noch keine Speicherung oder Reset-Funktion fuer Auto-Tabellen.
  - Manuelle Surfaces wie TOP-Liste und Teilnehmerliste behalten Vorrang und ihr bisheriges Verhalten bleibt erhalten.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: falls spaeter ein stabiler `tableKey` fuer weitere Auto-Tabellen feststeht, kann ein Persistenzpfad separat vorbereitet werden
- Risiken/Hinweise:
  - Die Auto-Regler greifen nur auf einfache erkannte Tabellen in DEV; komplexe Karten-/Sonderlayouts bleiben ausgeschlossen.

#### Paket: DEV Auto-Tabellen Persistenz
- Status: erledigt
- Beschreibung:
  - Automatisch erkannte einfache PDF-Tabellen koennen ihre aktiven Auto-Zonen jetzt generisch speichern und zuruecksetzen.
  - Die Persistenz nutzt einen stabil abgeleiteten `print.*`-Surface-Key pro Preview-Tabelle; TOP-Liste und Teilnehmerliste bleiben unveraendert.
  - Live-Regler bleiben bestehen und Auto-Layouts werden beim Oeffnen der DEV-Vorschau wieder geladen.
- Betroffene Dateien:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/renderer/print/printApp.js`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: fachlich weitere komplexe PDF-Tabellen pruefen, bevor neue Auto-Surfaces in groesserem Umfang entstehen
- Risiken/Hinweise:
  - Der Auto-Key ist bewusst generisch; bei mehreren Tabellen derselben Klasse bekommt die spaetere Instanz einen stabilen Suffix, um Vermischung zu vermeiden.

#### Paket: DEV Auto-Layout Export
- Status: erledigt
- Beschreibung:
  - Im DEV-Layoutmodus kann die aktive Surface/Tabelle jetzt als lesbarer JSON-/Code-Snippet-Export ausgegeben werden.
  - Der Export kopiert den Snapshot in die Zwischenablage und zeigt ihn ueber den nativen Dialog an, ohne Standardlayout-Dateien automatisch zu aendern.
  - STABLE bleibt ohne layoutTools-Bedienung; manuelle Surfaces und Auto-Tabellen behalten ihr bisheriges Verhalten.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - optional: den Export bei Bedarf noch um eine separate Datei-Ablage erweitern, falls spaeter ein manueller Copy/Paste-Workflow nicht reicht
- Risiken/Hinweise:
  - Der Export ist absichtlich nur ein Snapshot-Hilfsweg fuer Entwickler und fuehrt keine Code-Aenderung an den Standardlayout-Dateien aus.

#### Paket: ToDo-Standardlayout aus Exportwerten fest übernommen
- Status: erledigt
- Beschreibung:
  - Die exportierten Kalibrierwerte fuer `print.todo.todoTable` sind jetzt als Standardlayout fuer die ToDo-PDF-Vorschau im Code hinterlegt.
  - Ohne gespeicherte Entwicklerwerte greifen die neuen Standardwerte; vorhandene gespeicherte DEV-Werte behalten Vorrang.
  - Auto-Erkennung, Live-Regler, Export sowie manuelle Surfaces wie TOP-Liste und Teilnehmerliste bleiben unveraendert.
- Betroffene Dateien:
  - `src/shared/tableLayouts/tableLayoutRegistry.js`
  - `src/renderer/print/printApp.js`
  - `scripts/tests/layoutToolsAutoDetection.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Das Standardlayout ist bewusst nur fuer die ToDo-PDF-Surface `print.todo.todoTable` hinterlegt und greift nicht auf andere Tabellen ueber.

#### Paket: DEV Layoutmodus-Schalter fuer PDF-Vorschau
- Status: erledigt
- Beschreibung:
  - Die DEV-PDF-Layout-Vorschau wurde vom lokalen AN/AUS-Schalter wieder entkoppelt und folgt jetzt dem zentralen DEV-Flag aus den Einstellungen.
  - Im Zustand AN sind Toolbar, Marker und Zonenbedienung sichtbar; im Zustand AUS bleibt die Layout-Toolbar verborgen, waehrend die gespeicherten Layoutwerte weiterhin angewendet bleiben.
  - STABLE und echte PDF-Ausgaben bleiben unveraendert und markerfrei.
- Betroffene Dateien:
  - `src/renderer/print/printApp.js`
  - `src/renderer/print/print.css`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der Schalter ist bewusst nur in den DEV-Einstellungen vorhanden und steuert nur die Sichtbarkeit/Bearbeitbarkeit der laufenden Vorschau, nicht die gespeicherten Werte.

#### Paket: DEV Layout-Kalibrierung zentral in Einstellungen
- Status: erledigt
- Beschreibung:
  - Die aktive Layout-Kalibrierung wird jetzt zentral in den Einstellungen per DEV-Checkbox gesteuert und per App-Settings-Broadcast an Renderer und PDF-Vorschauen verteilt.
  - Die lokale Preview-Schaltfläche wurde aus dem laufenden PDF-Workflow entfernt; stattdessen reagieren TopsScreen, Print-HTML-Vorschau und Auto-Tabellen auf den zentralen Zustand.
  - STABLE sieht den Schalter nicht, und echte PDFs bleiben markerfrei.
- Betroffene Dateien:
  - `src/renderer/views/SettingsView.js`
  - `src/renderer/modules/protokoll/screens/TopsScreen.js`
  - `src/renderer/print/printApp.js`
  - `src/renderer/layoutTools/layoutCalibrationState.js`
  - `src/renderer/app/Router.js`
  - `src/main/ipc/settingsIpc.js`
  - `src/main/preload.js`
  - `scripts/tests/ausgabeModule.test.cjs`
  - `STATUS.md`
- Commit:
  - `kein Commit`
- Naechster offener Schritt:
  - keiner
- Risiken/Hinweise:
  - Der Broadcast-Mechanismus ist bewusst leichtgewichtig; falls spaeter weitere Layout-Renderer hinzukommen, sollten sie denselben zentralen Zustand aus der App-Settings-Quelle lesen.
