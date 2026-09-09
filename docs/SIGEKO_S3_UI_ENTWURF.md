# S3 – Übersicht / Readiness: Entwurfsentscheidung vor Umsetzung

Base main: `c8acbfb8c9a3c8d1c84ce1c017da762bab407566`; Ergebnisbranch `codex/sigeko-s3-readiness`. Grundlagen #274/#277, fachlich #250 und spätere Rollen-/Bauherr-Festlegungen. S2.4 und zentrale Bauherr-Zuordnung integriert.

## Arbeitsmodus und Paketgrenze

Goal-Arbeitslauf mit unabhängiger Regelprüfung und abgegrenzten Prüfaufgaben. Computer Use über die bestehende isolierte Electron-Abnahme auf Windows/Linux; lokal kein Display. Abschluss: lesende Readiness, bedienbares Panel, keine neuen Volltestregressionen gegenüber 1641/97, tatsächliche UI-/Vertragsprüfung, Review, PR und Integration. Bei konkretem offenen Fachwiderspruch oder neuer Regression kein Merge.

Gemeinsame Projekt-/Bauherr-/Kontakt-APIs, Modulfreigabe, Preload, Registry und Abnahmeplattform verwenden. Keine Migration, keine zentralen Fachschreibzugriffe aus SiGeKo. Rechnung #275 eingefroren; Behördenbestand, Recherche und Januar-2022-PDF ausschließlich S4 oder später. Keine PDF-/Mail-/Vorgangsimplementierung.

## A. Ausgabe

UI: bestehender SiGeKo-Screen erhält vor den Grunddaten die Übersicht. Keine PDF-Ausgabe.

## B. Editorfähigkeit

Ja, bestehender Scope `sigeko.screen`, Komponente `bbm.sigeko.screen`. Keine neue Tabelle, Spalte, Eingabe oder Editorengine. Fehlstellen sind mehrzeiliger Text in statisch registrierten Labels; keine IDs aus fachlichen Daten.

## C. Vollständige Deklaration

Die bisherigen 107 Slots bleiben vollständig nach `SIGEKO_S2_4_UI_ENTWURF.md` und dem komponentennahen `SigekoScreen.uiEditorContract.js` erhalten. Nur der Inhalt des bestehenden Labels `sigeko.screen.planned.text` verliert „Übersicht / Readiness“, da diese nun umgesetzt wird. Die folgenden 14 Slots kommen hinzu (order 107–120 in Tabellenreihenfolge). Vollvertrag danach 121 verpflichtende Single-Ref-Slots; bestehender externer Header-Editorlauncher zusätzlich im Scope.

Sechs DOM-Attribute: ID = `data-ui-inspector-id`, Typ = `data-ui-editor-kind`, Name = `data-ui-editor-label`, Parent = `data-ui-editor-parent`, editable = `data-ui-editor-editable`, ops = `data-ui-editor-ops`. Alle visible/ editable true. G = move,resizeWidth,resizeHeight,setVisibility. T = G plus textResize. semanticKey/refKey entsprechen ID. Gruppen: Rolle layout, Labels content außer Statuslabels (Rolle status), Buttons domainActionLayout. Baseline x/y 0, width/height null, fontSize 12; Grenzen width 8–2400, height 8–1600, fontSize 6–32. Gruppeneffekte groupWithChildren, sonst elementOnly; Buttons verwenden bestehenden m83DomainButton-Standard.

| ID | Typ | Name | Parent | editable | ops | Rolle / actionKind |
|---|---|---|---|---|---|---|
| sigeko.screen.readiness | group | Übersicht / Readiness | sigeko.screen | true | G | layout |
| sigeko.screen.readiness.title | label | Projektbereitschaft | sigeko.screen.readiness | true | T | content |
| sigeko.screen.readiness.project | group | Projektdaten prüfen | sigeko.screen.readiness | true | G | layout |
| sigeko.screen.readiness.project.title | label | Projektdaten | sigeko.screen.readiness.project | true | T | content |
| sigeko.screen.readiness.project.status | label | Bereitschaft der Projektdaten | sigeko.screen.readiness.project | true | T | status |
| sigeko.screen.readiness.project.issues | label | Fehlende Projektdaten | sigeko.screen.readiness.project | true | T | content |
| sigeko.screen.readiness.authorities | group | Behörden und Versorger prüfen | sigeko.screen.readiness | true | G | layout |
| sigeko.screen.readiness.authorities.title | label | Behörden / Notfall / Versorger | sigeko.screen.readiness.authorities | true | T | content |
| sigeko.screen.readiness.authorities.status | label | Bereitschaft der Behördenangaben | sigeko.screen.readiness.authorities | true | T | status |
| sigeko.screen.readiness.authorities.issues | label | Fehlende Behördenangaben | sigeko.screen.readiness.authorities | true | T | content |
| sigeko.screen.readiness.warning | label | Bereitschaftshinweis | sigeko.screen.readiness | true | T | status |
| sigeko.screen.readiness.refresh | button | Bereitschaft aktualisieren | sigeko.screen.readiness | true | T | refreshSigekoReadiness |
| sigeko.screen.readiness.editProject | button | Projektverwaltung öffnen | sigeko.screen.readiness | true | T | navigateProjectForm |
| sigeko.screen.readiness.editRoles | button | Profil und Projektrollen bearbeiten | sigeko.screen.readiness | true | T | navigateSigekoBasicData |

## D. Fachaktionen gesperrt

Für jeden Slot executeTargetAction, modifyDomainData, createRecord und deleteRecord gesperrt. Lesen/Aktualisieren, Navigation, fachliches Speichern, IPC und DB-Zugriffe sind keine Editoroperationen. Status ist berechnet und nicht manuell editierbar. Editor verändert ausschließlich Layout; Readiness ist keine Berechtigung. Grunddatenpflege und Projektwechsel bleiben auch bei Rot erreichbar. Bestehende Warnung vor Verwerfen ungespeicherter Eingaben bleibt bei Navigation wirksam.

## E. Tatsächliche Parent-Struktur

Panel direkt im bestehenden Root, zwei untereinander angeordnete Statusgruppen, darunter Hinweis und drei umbrechende Buttons. Parents genau gemäß Tabelle, explizite Refs in render. Alle Slots bleiben gemountet; Laden/Fehler ersetzt Text und Farbe, keine fachlich erzeugten Ziele. Bereitschaft bezieht sich ausschließlich auf gespeicherte Daten; Aktualisieren überschreibt keine Entwürfe. Nach Profil-/Rollenspeichern automatisch neu lesen. Veraltete Antworten nach neuem Request oder destroy werden verworfen. Fehler darf kein altes Grün stehen lassen.

## F. Prüfung

Gezielte Backend-/IPC- und Formularprüfungen; vollständiger Kit-Komponentenvalidator und gemountete Ref-/Attributprüfung; fremde Scopes unverändert. Der bestehende Legacy-HTML-Parser unterstützt das produktive M83-Vokabular nicht (bereits dokumentierte Baseline); maßgeblich sind tatsächliche Kit-Validatoren, kein behaupteter grüner Legacy-Parser. Bestehender Windows-/Linux-Electronlauf wird um Rot/Grün, Aktualisierung nach Speicherung, Entwurferhalt, Projektwechsel, Navigation, Lizenzschutz, unveränderte DB beim Lesen und breite/schmale Panel-Geometrie samt Screenshots erweitert. Volltest-Namen und Häufigkeiten exakt gegen 1641/97 vergleichen. Nutzer hat die restliche UI-Prüfung an Codex delegiert; kein persönlicher manueller PASS behauptet.
