# Prüfbericht Firmenlogik BBM

Stand: 15.08.2026
Art: vollständige Read-only-Architekturprüfung; keine produktive Implementierung, keine Migration und keine UI-Änderung

## Kurzfazit

Das bestehende Identitätsmodell ist fachlich richtig und muss erhalten bleiben:

1. `firms` enthält globale, projektübergreifende Firmen.
2. `project_firms` enthält lokale Firmen genau eines Projekts.
3. `project_global_firms` ist ausschließlich die Zuordnung einer globalen Firma zu einem Projekt. Sie ist keine dritte Firmenart.

Der heutige Bestand kennt jedoch keine explizite Firmenverwendung. „Projektteilnehmer“ ergibt sich indirekt aus Tabelle, Projektzuordnung, Aktivstatus und personenbezogenem Kandidatenpool. „Kunde“ ist im produktiven Firmenmodell noch gar nicht vorhanden. Das Rechnungsmodul ist nur eine DEV-Designreferenz mit statischen Daten und besitzt keine DB-, Domain-, IPC-, Speicher-, Berechnungs- oder Drucklogik.

Empfohlen wird deshalb **kein neues Firmen-Identitätsmodell**. Die beiden vorhandenen Firmentabellen werden additiv um zwei unabhängige Nutzungsmerkmale erweitert. Darüber wird eine neue, gemeinsame und modulneutrale Firmenschicht als alleinige Quelle für Firmenlisten, Firmenbearbeitung und Nutzungsregeln gelegt. Projektverwaltung, Protokoll, Restarbeiten und Rechnungen greifen nur über diese Schicht zu.

## A. Ist-Architektur

### A.1 Datenmodell und tatsächliche Bedeutung

| Objekt | Ist-Bedeutung | Wichtige Felder/Beziehungen |
| --- | --- | --- |
| `firms` | globale Firma | eigene UUID; Stammdaten, `role_code`, Trash-/Soft-Delete-Felder; keine Verwendung und kein allgemeiner Aktivstatus |
| `persons` | globale Person einer globalen Firma | FK `firm_id -> firms.id`; eigene Trash-/Soft-Delete-Felder |
| `project_firms` | lokale Firma eines einzelnen Projekts | eigene UUID; FK `project_id -> projects.id`; Stammdaten, `role_code`, `is_active`, Soft Delete; keine Verwendung |
| `project_persons` | lokale Person einer lokalen Projektfirma | FK `project_firm_id -> project_firms.id`; Soft Delete |
| `project_global_firms` | globale Firma ↔ Projekt | zusammengesetzter Schlüssel `(project_id, firm_id)`; `is_active`, Soft Delete; keine eigene Firmenidentität |
| `project_candidates` | personenbezogener Teilnehmerpool je Projekt | polymorph `project_person`/`global_person`; `is_active`; keine Firmenverwendung |
| `meeting_participants` | konkrete Personen in einer Besprechung | polymorpher Personenverweis plus Anwesenheit/Verteiler; keine Firmenverwendung |
| `meeting_tops` | TOP-Snapshot | `responsible_kind`, `responsible_id`, `responsible_label` sowie Kontakt-Snapshot; polymorph, ohne physische Firmen-FK |
| `restarbeiten_items` | Restarbeit/Mangel | Verantwortlicher ausschließlich über `responsible_project_firm_id -> project_firms.id` plus `responsible_label`; globale Firma derzeit unmöglich |

Die Nutzungen `Projektteilnehmer` und `Kunde` sind in keiner der beiden Firmentabellen modelliert. `role_code` ist eine Sortier-/Rollenkategorie und darf nicht als Nutzung umgedeutet werden. Ebenso dürfen `is_active`, `project_global_firms` und `project_candidates` nicht als Ersatz für Nutzungen verwendet werden:

- `is_active` beschreibt den operativen Status einer lokalen Firma beziehungsweise einer globalen Projektzuordnung.
- `project_global_firms` beschreibt, in welchen Projekten eine globale Firma vorkommt.
- `project_candidates` beschreibt die projektbezogene Aktivität einzelner Personen.
- Die Firmenverwendung beantwortet dagegen, **wofür die Firma fachlich eingesetzt werden darf**.

### A.2 Repository-, Domain- und IPC-Flüsse

Globale Firmen laufen über `src/main/db/firmsRepo.js`, den nur global arbeitenden `src/main/domain/FirmService.js` und globale Handler innerhalb von `src/main/ipc/topsIpc.js`. Dass Firmenstamm-CRUD und Outlook-Import im Protokoll-IPC liegen, ist eine unerwünschte Modulkopplung. Listen, Create und Update verwenden teilweise `FirmService`; Delete umgeht ihn und ruft direkt `firmsRepo.markTrashed()` auf. Dadurch gelten schon heute nicht überall dieselben Regeln.

Lokale Firmen und globale Projektzuordnungen laufen direkt über `src/main/db/projectFirmsRepo.js` und `src/main/ipc/projectFirmsIpc.js`. `src/main/domain/ProjectFirmsService.js` wird nicht eingebunden und verwendet teilweise Methodennamen, die das aktuelle Repository nicht exportiert. Die tatsächlich produktive Regelquelle ist damit Repo plus IPC, nicht die vorhandene Domain-Datei.

`src/main/preload.js` veröffentlicht beide Pfade als flache `window.bbmDb`-Methoden. Es gibt keine neutrale Firmenabfrage, keine typisierte gemeinsame Firmenreferenz und keine zentrale Nutzungsprüfung.

### A.3 Renderer und Auswahlpfade

- `src/renderer/views/FirmsView.js` verwaltet globale Firmen und globale Personen direkt über die globalen APIs. Eine dort neu angelegte Firma wird heute weder einer Nutzung noch einem Projekt zugeordnet.
- `src/renderer/views/ProjectFirmsView.js` verwaltet lokale Firmen und zeigt zusätzlich dem Projekt zugeordnete globale Firmen. Für beide Quellen existieren zahlreiche Verzweigungen. Neu zugeordnete globale Personen werden hier als inaktiver Projektkandidat angelegt; lokale Personen gelten ohne Kandidatenzeile in mehreren Pfaden als aktiv.
- `src/renderer/views/FirmsPoolView.js` lädt die Union aus lokalen und zugeordneten globalen Firmen. Globale Firmen können dort nicht gelöscht, sondern nur über den gesonderten Zuordnungsdialog verwaltet werden. Die Personenaktivität liegt in `project_candidates`.
- `src/renderer/ui/ParticipantsModals.js` arbeitet mit `global_person` und `project_person`. Die auswählbaren Personen werden aus dem Teilnehmerpool beziehungsweise den Kandidaten gewonnen.
- `src/renderer/tops/data/TopsAssigneeDataSource.js` lädt lokale und globale Firmen als Verantwortliche. In `_dedupeCompanies()` wird jedoch nicht nur nach ID, sondern auch nach Bezeichnung dedupliziert. Eine lokale und eine globale Firma mit gleicher Kurzbezeichnung werden dadurch bewusst zu einer Auswahl zusammengezogen. Der bestehende Integrationstest erwartet dieses Verhalten. Das verletzt die notwendige typisierte Identität.
- Die drei Dateien unter `src/renderer/features/assignments/` enthalten weitere, teilweise doppelte Auswahlregeln, werden im aktuellen Quellbaum aber nicht importiert. Sie sind keine verlässliche produktive Regelquelle.
- Restarbeiten laden über `listResponsibleProjectFirms()` nur `projectFirmsListByProject`; damit sind ausschließlich lokale Firmen möglich. Außerdem filtert diese Quelle `is_active` nicht selbst.

### A.4 Teilnehmer, Verantwortliche und Historie

`src/main/ipc/participantsIpc.js` vereinigt lokale Personen und Personen zugeordneter globaler Firmen. Die SQL-Poolabfrage setzt eine fehlende Kandidatenzeile für beide Arten mit `COALESCE(..., 1)` auf aktiv. Rendererpfade behandeln neu hinzukommende globale Personen dagegen teilweise standardmäßig als inaktiv. Diese uneinheitliche Default-Regel ist unabhängig von der neuen Firmenverwendung zu bereinigen.

Protokoll-TOPs speichern eine typisierte Firmenreferenz und ein Label-Snapshot. Das ist als historisches Muster brauchbar: Eine Firma, deren Nutzung später entfällt, darf aus neuen Auswahllisten verschwinden, ein gespeicherter oder abgeschlossener TOP muss aber weiter lesbar und druckbar bleiben.

Restarbeiten besitzen diese Typisierung nicht. Sie speichern nur eine lokale Projektfirma. Für die geforderte globale/lokale Gleichbehandlung ist dort eine additive Referenzmigration nötig.

### A.5 Import, Projekttransfer und Druck

Der Outlook-Import unterscheidet bereits zwischen `stamm` und `project`. Neue Datensätze werden entsprechend in `firms` oder `project_firms` angelegt; Treffer werden nur anhand des normalisierten Firmennamens zusammengeführt. Eine Verwendung wird nicht gesetzt. Für die Zielarchitektur muss der Erzeugungskontext den Default liefern, während ein Merge eines vorhandenen Datensatzes dessen Nutzungen ohne ausdrückliche Benutzerentscheidung nicht verändern darf.

Der Projekttransfer exportiert `project_firms`, `project_persons`, `project_candidates` und `project_global_firms` als rohe Zeilen. Globale Firmen und globale Personen selbst werden nicht mitgegeben. Das funktioniert für Export/Löschen/Reimport in derselben Installation, weil globale Stammdaten bestehen bleiben. Für einen Transfer in eine andere Datenbank kann eine globale Zuordnung fehlen oder am FK scheitern. Neue Nutzungsfelder lokaler Firmen würden in neuen Archiven automatisch mitkommen; alte Archive benötigen aber eine explizite Kompatibilitätsregel.

Der Firmendruck (`mode === "firms"`) verwendet heute ungefiltert `projectFirmsRepo.listFirmCandidatesByProject()`. Der ToDo-Druck kann lokale und globale Verantwortliche anhand `responsible_kind`/`responsible_id` auflösen und fällt auf `responsible_label` zurück. Restarbeiten-Druckdaten werden vom Renderer als bereits geladene Zeilen mit Label-Snapshot übergeben.

### A.6 Rechnungsmodul

`src/renderer/modules/rechnungen` ist ausdrücklich eine nur in DEV sichtbare UI-Designreferenz. `demoData.js` enthält statische Kundennamen. `RechnungenDesignScreen.js` verwendet weder `window.bbmDb` noch Speicherung oder Berechnung. `scripts/tests/rechnungenDesignModule.test.cjs` sichert genau diese Begrenzung ab. Es gibt deshalb keine bestehende Rechnungs-Kundenlogik, die migriert werden könnte; die künftige produktive Anbindung kann direkt auf die neutrale Firmenschicht gesetzt werden.

Die getrennte Lizenzverwaltung mit `license_customers` ist ein Administrations-/Lizenzierungsmodell und nicht Teil der fachlichen Firmenlogik. Sie darf weder migriert noch als Rechnungs-Kundenstamm wiederverwendet werden.

### A.7 Bestehende Tests und nachgewiesene Lücken

Vorhanden sind unter anderem Tests für Projektfirmen-Aktivität, Projektfirmen-Layout, TOP-Verantwortliche, ToDo-Druck, Restarbeiten-Datenmodell/-UI und die Rechnungs-Designgrenze. Es fehlen Tests für:

- unabhängige Firmenverwendungen,
- gemeinsame globale/lokale Firmenreferenzen,
- gefilterte Teilnehmer- und Kundenlisten,
- Erzeugungsdefaults nach Modulkontext,
- gleiche Namen oder gleiche rohe IDs in beiden Firmennamensräumen,
- globale Verantwortliche in Restarbeiten,
- Nutzungsänderung bei bestehenden operativen/historischen Referenzen,
- alte und neue Projektarchive mit Nutzungsfeldern,
- die drei Produktvarianten mit und ohne Rechnungsmodul.

Dokumentationshinweis: `ZUERST_LESEN_Codex.md` verweist auf drei nicht unter diesen Namen vorhandene Dateien. Die TOP-Regeln liegen als `docs/domain/TOP-Regeln` ohne die referenzierte Schreibweise/Endung vor und wurden inhaltlich berücksichtigt.

### A.8 Fachlich relevantes Prüfinventar

Die repo-weite Referenzsuche wurde nicht auf die sichtbaren Views beschränkt. Als unmittelbar betroffene oder bei der Umsetzung zu kontrollierende Pfade wurden identifiziert:

- Schema/Repos: `src/main/db/database.js`, `firmsRepo.js`, `personsRepo.js`, `projectFirmsRepo.js`, `projectPersonsRepo.js`, `projectsRepo.js`, `meetingTopsRepo.js`, `restarbeitenRepo.js`.
- Domain: `src/main/domain/FirmService.js`, `PersonService.js`, `ProjectFirmsService.js`.
- IPC/Plattform: `src/main/ipc/topsIpc.js`, `projectFirmsIpc.js`, `participantsIpc.js`, `projectTransferIpc.js`, `settingsIpc.js`, `printIpc.js`, außerdem `src/main/preload.js` und die Registrierung in `src/main/main.js`.
- Renderer: `FirmsView.js`, `ProjectFirmsView.js`, `FirmsPoolView.js`, `ParticipantsModals.js`, `MainHeader.js`, `tops/data/TopsAssigneeDataSource.js`, die drei Services unter `features/assignments/`, die Protokoll-Screens sowie die Restarbeiten-Datenquelle, -Screens, -Editbox und ViewModels.
- Ausgabe: `src/main/print/printData.js`, die PDF-Aufrufe in `printIpc.js` und die Restarbeiten-Ausgabeprojektion.
- Rechnung: alle Dateien unter `src/renderer/modules/rechnungen/` sowie DEV-Routing und Verfügbarkeitstest.
- Diagnose/Tests: `ui-editor/protokollAcceptanceSeeder.js` und insbesondere `projectFirmsActiveFlow.test.cjs`, `projectFirmsLayout.test.cjs`, `topsScreen.integration.test.cjs`, `printModes.test.cjs`, `restarbeitenDataModel.test.cjs`, `restarbeitenModule.test.cjs`, `rechnungenDesignModule.test.cjs` und der vorhandene `FirmsView`-Regressionstest.

`settingsIpc.js` ändert Rollencodes in beiden Firmenbeständen und bleibt fachlich unabhängig von den Verwendungen. `projectsRepo.js` muss bei der Umsetzung dennoch als Lösch-/FK-Regression geprüft werden. Der Acceptance-Seeder muss über den Legacy-Adapter weiterhin lokale Teilnehmerfirmen mit dem richtigen Default erzeugen.

## B. Entscheidungsmatrix

Jede Zeile trägt genau eine Kategorie: `unverändert lassen`, `gezielt erweitern` oder `ersetzen / neu implementieren`.

| Bereich | Aktuelle Logik | Betroffene Hauptdateien | Problem | Empfehlung | Kategorie |
| --- | --- | --- | --- | --- | --- |
| Firmenidentität | zwei Tabellen `firms` und `project_firms` | `src/main/db/database.js` | kein Identitätsproblem | beide Typen und IDs beibehalten | unverändert lassen |
| globale Projektzuordnung | `project_global_firms` ordnet global zu Projekt zu | `database.js`, `projectFirmsRepo.js` | wird leicht mit Firmenart/Nutzung verwechselt | ausschließlich Zuordnung und projektbezogenen Aktivstatus behalten | unverändert lassen |
| Firmenverwendung | nicht vorhanden | `database.js` | Kunde/Projektteilnehmer nicht ausdrückbar | zwei unabhängige Flags in beiden Firmentabellen ergänzen | gezielt erweitern |
| globale Repositories | globales CRUD und Import ohne Nutzungen | `firmsRepo.js`, `personsRepo.js` | keine Nutzungsvalidierung/-filterung | Nutzung lesen, schreiben, indizieren und beim Import korrekt setzen | gezielt erweitern |
| lokale Repositories | lokales CRUD, Union und Zuordnung | `projectFirmsRepo.js`, `projectPersonsRepo.js` | Union filtert keine Verwendung; Active-Methode verliert Typ | typisierte Aufrufe und Nutzungsfilter ergänzen | gezielt erweitern |
| Domain-Schicht | globaler Teilservice; ungenutzter lokaler Service | `FirmService.js`, `ProjectFirmsService.js` | Regeln verteilt und nicht modular neutral | durch einen gemeinsamen `FirmDirectoryService` als kanonische Regelgrenze ablösen | ersetzen / neu implementieren |
| IPC/Preload | getrennte, flache Spezialendpunkte | `topsIpc.js`, `projectFirmsIpc.js`, `participantsIpc.js`, `preload.js` | direkte Modulkopplung, keine alleinige Quelle | neue neutrale API einführen; alte Endpunkte vorerst als Adapter erhalten | gezielt erweitern |
| Firmenstamm-UI | globale CRUD-UI | `FirmsView.js` | keine Nutzungsanzeige/-bearbeitung | gemeinsamen Firmeneditor verwenden; Default Projektteilnehmer | gezielt erweitern |
| Projektfirmen-UI | lokale Firmen plus globale Zuordnung | `ProjectFirmsView.js`, `FirmsPoolView.js` | verzweigte Logik; keine Nutzung | Listen aus Teilnehmer-API; gemeinsamen Editor verwenden | ersetzen / neu implementieren |
| Projektkopf/Kennzahlen | lädt Kandidaten, lokale und globale Firmen separat | `MainHeader.js` | Kennzahlen könnten Kunden-only-Firmen mitzählen | Kennzahlen aus kanonischer Teilnehmerliste ableiten | ersetzen / neu implementieren |
| Personenpool/Teilnehmer | Union nach Tabellen/Zuordnung | `participantsIpc.js`, `ParticipantsModals.js` | keine Firmenverwendung; widersprüchliche Kandidaten-Defaults | Pool ausschließlich aus Projektteilnehmer-Firmen aufbauen und Default vereinheitlichen | ersetzen / neu implementieren |
| TOP-Verantwortliche | typisierte Speicherung, aber untypisierte Deduplizierung in einer Quelle | `TopsAssigneeDataSource.js`, `TopsScreen.js`, `meetingTopsRepo.js` | gleichnamige globale/lokale Firma kollabiert | Auswahlquelle auf kanonische Teilnehmerliste umstellen; Speicherung/Snapshot erhalten | ersetzen / neu implementieren |
| Ansprechpartner | Personen nach Verantwortlichenart plus Kandidatenfilter | `ContactOptionsService.js`, Protokoll-Screens | verteilt, teils Übergangscode | Personen nur unter gültiger Teilnehmer-Firma über neutrale Quelle liefern | ersetzen / neu implementieren |
| Restarbeiten | nur lokale Projektfirma als Verantwortlicher | `restarbeitenDataSource.js`, `restarbeitenRepo.js`, `database.js`, `RestarbeitenScreen.js` | globale Projektteilnehmer ausgeschlossen | auf typisierte globale/lokale Verantwortlichenreferenz migrieren | ersetzen / neu implementieren |
| Outlook-Import | Kontext `stamm` oder `project`; Merge nach Name | `topsIpc.js`, `firmsRepo.js`, `projectFirmsRepo.js` | keine Nutzungsdefaults; Merge könnte Nutzung unbeabsichtigt ändern | Create-Defaults ergänzen, vorhandene Nutzungen beim Merge bewahren | gezielt erweitern |
| Projekttransfer | rohe lokale Zeilen plus globale IDs | `projectTransferIpc.js` | alte Archive ohne Flags; globale Abhängigkeiten nicht vollständig | Manifestversion, Default-Transformation und globale Abhängigkeitsprüfung ergänzen | gezielt erweitern |
| Druck | Firmendruck aus ungefilterter Union; Snapshots bei ToDo/Restarbeiten | `printData.js`, `printIpc.js` | neue Listenregel würde sonst umgangen | Firmendruck aus Teilnehmer-API; historische Snapshots weiter ausgeben | ersetzen / neu implementieren |
| Rechnungen | DEV-Dummy mit statischen Kunden | `src/renderer/modules/rechnungen/*` | keine produktive Kundenquelle | produktives Modul ausschließlich an Kunden-API anbinden | gezielt erweitern |
| Tests | einzelne Pfad-/UI-/Datenmodelltests | `scripts/tests/*` | keine Nutzungs- und Variantenabdeckung | um die Testmatrix in Abschnitt F ergänzen | gezielt erweitern |

## C. Zielarchitektur

### C.1 Verbindliche Invarianten

1. Es bleiben genau zwei Firmenarten: `global_firm` und `project_firm`.
2. Eine Firmenreferenz ist immer typisiert. Eine rohe ID allein ist außerhalb des jeweiligen Repositories unzulässig.
3. `project_global_firms` bleibt eine Zuordnung; sie erzeugt weder Firma noch Nutzung.
4. `Projektteilnehmer` und `Kunde` sind unabhängige Merkmale. Zulässig sind `00`, `10`, `01` und `11`.
5. Nutzung, Zuordnung, operativer Aktivstatus, Personen-Kandidatenstatus und Löschstatus bleiben getrennte Konzepte.
6. Neue Auswahllisten berücksichtigen die aktuelle Nutzung. Bereits gespeicherte oder abgeschlossene Belege, TOPs, Teilnehmer und Druck-Snapshots bleiben lesbar.
7. Kein Fachmodul liest `firms`, `project_firms` oder `project_global_firms` direkt, um eine Firmenauswahl zu erzeugen.

### C.2 Datenfelder

Additiv in **beiden** Firmentabellen:

```text
use_project_participant INTEGER NOT NULL DEFAULT 0 CHECK (use_project_participant IN (0,1))
use_customer            INTEGER NOT NULL DEFAULT 0 CHECK (use_customer IN (0,1))
```

Empfohlene Teilindizes beziehungsweise zusammengesetzte Indizes unterstützen die beiden Listenpfade zusammen mit `removed_at`, `is_trashed` beziehungsweise `project_id`.

Explizite Bool-Spalten sind für genau diese zwei stabilen Nutzungen einfacher und referenziell sicherer als eine polymorphe Nutzungstabelle ohne echte FK. Eine spätere dritte fachlich beschlossene Nutzung kann additiv ergänzt werden. Eine neue gemeinsame Ober-Firmentabelle oder ein Umbau aller IDs ist nicht erforderlich.

`is_active` bleibt unverändert:

- bei `project_firms`: operativer Status der lokalen Firma im Projekt,
- bei `project_global_firms`: operativer Status genau dieser globalen Projektzuordnung.

### C.3 Gemeinsame Referenz und gemeinsame Logik

Die neutrale Schicht verwendet intern und über IPC ein stabiles Objekt, beispielsweise:

```js
{
  kind: "global_firm" | "project_firm",
  id: "uuid",
  projectId: "uuid" | null,
  label: "Kurzbezeichnung oder Name"
}
```

`projectId` ist für `project_firm` Pflicht und muss zur gespeicherten Firma passen. Für `global_firm` ist es nur Abfragekontext, nicht Teil der Identität. Dedupliziert wird ausschließlich nach `(kind, id)`, niemals nach Label und niemals nach roher ID allein.

Die neue gemeinsame Domain-Schicht liegt außerhalb aller Fachmodule, zum Beispiel unter `src/main/domain/firms/`. Sie kapselt beide Repositories, Nutzungsregeln, Projektkontext, Impact-Prüfung und Snapshot-Erzeugung. Rechnungen dürfen diese Schicht verwenden; die Schicht darf das Rechnungsmodul nicht importieren.

### C.4 Alleinige Listen- und Schreib-APIs

Die nach außen sichtbaren Absichten sollten eng benannt sein:

```text
firmDirectory:listProjectParticipants({ projectId, includeInactive? })
firmDirectory:listCustomers({ projectId? })
firmDirectory:get({ kind, id, projectId? })
firmDirectory:create({ kind, projectId?, origin, data, uses? })
firmDirectory:update({ ref, patch })
firmDirectory:checkUseChange({ ref, nextUses })
firmDirectory:setUses({ ref, nextUses, expectedUpdatedAt? })
firmDirectory:listPersons({ ref, projectId?, participantOnly? })
```

Regeln der beiden Listen:

- `listProjectParticipants(projectId)` liefert lokale Firmen dieses Projekts mit `use_project_participant=1` sowie globale Firmen mit `use_project_participant=1`, aktiver `project_global_firms`-Zuordnung und passendem Projekt. Standardmäßig werden operativ inaktive Firmen nicht angeboten.
- `listCustomers()` ohne Projekt liefert nur globale Firmen mit `use_customer=1`.
- `listCustomers({projectId})` liefert globale Kunden sowie lokale Kunden genau dieses Projekts. Eine globale Kundenfirma benötigt dafür **keine** `project_global_firms`-Zuordnung.
- Entfernte/gelöschte Firmen erscheinen in keiner neuen Auswahl. Bestehende Referenzen werden separat über `get` beziehungsweise Snapshots aufgelöst.

Create-Defaults werden anhand von `origin` in der gemeinsamen Domain-Schicht gesetzt, nicht in einzelnen Screens:

| Herkunft | Firmenart | Projektteilnehmer | Kunde |
| --- | --- | --- | --- |
| Firmen | global | ja | nein |
| Projektfirmen | lokal | ja | nein |
| Rechnungen | global oder lokal gemäß Scope-Entscheidung | nein | ja |

Explizite Benutzerauswahl darf den zweiten Haken zusätzlich setzen. Der Service validiert, dass der vom Aufrufer gelieferte Default nicht dem Ursprung widerspricht.

### C.5 Modulabhängigkeiten

- Gemeinsamer Kern: Schema, beide Firmen-Repositories, `FirmDirectoryService`, IPC/Preload-Vertrag und gemeinsamer Firmeneditor.
- Projektverwaltung/Protokoll/Restarbeiten: abhängig vom gemeinsamen Kern; verwendet nur Projektteilnehmerlisten.
- Rechnungen: abhängig vom gemeinsamen Kern; verwendet nur Kundenlisten.
- Gemeinsamer Kern: keine Abhängigkeit zu Rechnungen, Protokoll oder Restarbeiten.

Damit funktionieren Rechnungen ohne Projektmodule, Projektmodule ohne Rechnungen und die kombinierte App mit demselben Firmenbestand und denselben Regeln.

### C.6 Referenzen in künftigen Rechnungen und Restarbeiten

Für neue Tabellen mit strenger DB-Integrität sind zwei nullable FKs sicherer als ein polymorphes ID-Feld:

```text
global_firm_id  -> firms.id
project_firm_id -> project_firms.id
firm_label_snapshot
CHECK (genau einer der beiden FKs ist gesetzt)
```

Die Domain-/IPC-Antwort bildet diese Speicherung auf `{kind,id,projectId,label}` ab. Für `meeting_tops` bleibt der bestehende typisierte Snapshot-Vertrag aus Kompatibilitätsgründen bestehen; neue Writes werden durch die gemeinsame Domain-Schicht validiert.

## D. UI-Behandlung ohne Implementierung

Es wird genau ein neutraler Firmeneditor als wiederverwendbare Renderer-Komponente vorgesehen. Er enthält Stammdaten, den unveränderlichen Scope nach Anlage (`global` oder lokales Projekt) sowie die beiden unabhängig schaltbaren Verwendungen.

Verhalten:

- Aufruf aus „Firmen“: globale Anlage; „Projektteilnehmer“ vorausgewählt.
- Aufruf aus „Projektfirmen“: lokale Anlage für das aktuelle Projekt; „Projektteilnehmer“ vorausgewählt.
- Aufruf aus „Rechnungen“: „Kunde“ vorausgewählt; die Firmenart folgt der noch zu bestätigenden Scope-Regel.
- Bearbeitung einer bestehenden Firma zeigt immer beide Nutzungen, unabhängig vom aufrufenden Modul. Dadurch kann eine Firma zentral von nur Teilnehmer zu Teilnehmer+Kunde erweitert werden.
- Der Scope darf nicht nachträglich umgeschaltet werden. „Lokal zu global“ oder umgekehrt wäre eine Identitätsmigration und kein Feld-Update.
- Beim Abschalten einer Nutzung zeigt der Editor vor dem Speichern die Impact-Prüfung. Es werden keine Zuordnungen, Teilnehmer, TOPs, Restarbeiten oder Rechnungen still gelöscht.
- Firmen ohne aktive Nutzung bleiben im zuständigen Verwaltungsbereich auffindbar, erscheinen aber in keinem Fachmodul-Picker.
- Gleiche Namen sind zulässig. Die UI kennzeichnet lokale Firmen mit Projekt und globale Firmen mit „Firmenstamm“; sie verschmilzt sie nicht.

Fachmodul-Listen:

- Projektfirmen, Teilnehmer, Ansprechpartner, TOP-Verantwortliche, Restarbeiten-Verantwortliche und Firmendruck sehen nur `Projektteilnehmer` im passenden Projektkontext.
- Rechnungen sehen nur `Kunde`; lokale Kunden nur im passenden Projekt.
- Historische Auswahlwerte, die heute nicht mehr zulässig sind, werden als read-only Snapshot angezeigt und nicht als neue Auswahl angeboten.

## E. Migrationskonzept

### E.1 Vorbereitung und Sicherung

1. Vor der ersten Schemaänderung DB-Datei sichern und Prüfsummen/Größen protokollieren.
2. Bestandszahlen getrennt erfassen: globale, lokale, entfernte/gelöschte Firmen; globale Projektzuordnungen; Personen; Kandidaten; offene und geschlossene Referenzen.
3. Migration vollständig in einer DB-Transaktion ausführen und bei jeder Verletzung zurückrollen.

Im Repository liegt keine produktive DB-Datei. Deshalb kann aus dem Quellstand keine tatsächliche Kundenklassifikation einzelner Bestandsfirmen abgeleitet werden.

### E.2 Additive Schemamigration und Backfill

1. Beide Nutzungsfelder idempotent über das vorhandene `ensure...Schema`-Muster ergänzen.
2. Nur in dem Migrationslauf, der die Spalten neu anlegt, alle bestehenden `firms` und `project_firms` auf folgende Werte setzen:
   - `use_project_participant = 1`
   - `use_customer = 0`
3. Diese Regel gilt auch für soft-gelöschte/historische Zeilen, damit alte Referenzen semantisch denselben Bestand repräsentieren. Löschstatus bleibt unverändert.
4. Es gibt keinen automatischen Kunden-Backfill: Das Rechnungsmodul hat keine persistierten Kunden, und Name, `role_code`, Projektzuordnung oder Lizenzkunden erlauben keine verlässliche Ableitung.
5. Nach dem Backfill Counts und Null-/Bool-Invarianten prüfen und protokollieren.

Damit bleibt das gesamte heutige Projektverhalten zunächst sichtbar. Kunden werden anschließend bewusst markiert oder erstmals durch das Rechnungsmodul angelegt.

### E.3 Rollout in kompatiblen Stufen

1. Schema und gemeinsame Domain-Schicht ergänzen.
2. Alte IPC-Endpunkte intern auf die gemeinsame Schicht delegieren; noch keinen Consumer abbrechen.
3. Neue kanonische Preload-Methoden ergänzen.
4. Nacheinander Projektfirmen, Pools/Teilnehmer, Protokoll, Restarbeiten, Druck und zuletzt das produktive Rechnungsmodul auf die neuen Intent-APIs umstellen.
5. Alte Endpunkte erst in einem gesonderten, späteren Auftrag entfernen, wenn Quell- und Laufzeitsuche sowie Tests keine Consumer mehr zeigen.

### E.4 Bestehende Referenzen

- Abschlossene Protokolle, alte Meeting-Teilnehmer und Druckdaten werden nicht neu gefiltert oder gelöscht.
- Für offene operative Referenzen führt `checkUseChange` eine Impact-Prüfung aus. Sichere Empfehlung: Abschalten von `Projektteilnehmer` blockieren, solange aktive Projektzuordnungen oder offene Teilnehmer/TOP-/Restarbeitenbezüge bestehen; abgeschlossene Historie bleibt erlaubt und lesbar.
- Für `Kunde` gilt später entsprechend: bei Entwürfen/offenen Rechnungen blockieren, finale Rechnungen nur über Snapshot erhalten.
- Hard Delete bleibt durch echte FKs beziehungsweise Referenzprüfung geschützt. Nutzungsänderung ist kein Delete.

### E.5 Restarbeiten

Die bestehende lokale FK und das Label dürfen nicht abrupt entfernt werden. Additive Übergangsstrategie:

1. Zielreferenz mit globalem und lokalem FK plus bestehendem Label-Snapshot ergänzen.
2. Alle vorhandenen `responsible_project_firm_id` als lokale Referenz übernehmen.
3. Read-Bridge akzeptiert alte Zeilen; neue Writes verwenden ausschließlich die gemeinsame typisierte Referenz.
4. PDFs und Listen fallen weiterhin auf `responsible_label` zurück.
5. Erst nach vollständigem Nachweis kann die alte Lesebrücke in einem separaten Auftrag entfallen.

### E.6 Outlook-Import

- Neu erzeugt in Kontext `stamm`: global, Projektteilnehmer ja, Kunde nein.
- Neu erzeugt in Kontext `project`: lokal im Projekt, Projektteilnehmer ja, Kunde nein.
- Ein Merge ergänzt nur leere Stammdatenfelder und lässt beide Nutzungsflags unverändert.
- Ein späterer Rechnungsimport erzeugt Kunde ja gemäß Rechnungs-Scope; er darf nicht still eine Projektteilnehmernutzung vergeben.
- Die reine Namensgleichheit bleibt ein Kollisionsrisiko. Vor einer produktiven Kundenimportfunktion ist ein expliziter Konfliktentscheid oder stabilerer Matching-Schlüssel erforderlich.

### E.7 Projekttransfer und Rückwärtskompatibilität

- Manifest um eine Firmenlogik-/Schemasversion ergänzen.
- Altes Archiv ohne Nutzungsfelder: importierte `project_firms` erhalten Projektteilnehmer ja, Kunde nein.
- Neues Archiv: beide Flags unverändert übernehmen und validieren.
- Referenzierte globale Firmen/Personen entweder als Abhängigkeitspaket mit ID-basierter Konfliktprüfung mitgeben oder vor dem Import vollständig gegen den Zielstamm validieren. Blindes Zusammenführen nach Name ist unzulässig.
- Bei fehlender oder widersprüchlicher globaler Abhängigkeit vor Beginn der Transaktion abbrechen; kein Teilimport.
- Import in eine ältere App darf nicht als unterstützt gelten, solange deren Schema/Code die neuen Felder nicht kennt. Die Version muss dies klar ablehnen statt Daten still zu verlieren.

## F. Vollständige Testmatrix für die Umsetzung

| Nr. | Ebene | Fall | Erwartung |
| ---: | --- | --- | --- |
| 1 | Schema | frische DB | beide Firmenarten und vier Bool-Spalten vorhanden; Defaults und Checks gültig |
| 2 | Migration | alte DB mit globalen/lokalen aktiven Firmen | alle Bestandsfirmen Teilnehmer ja, Kunde nein; Counts unverändert |
| 3 | Migration | alte DB mit Trash/Soft Delete und Personen/FKs | Status, IDs, Personen und Referenzen unverändert; Backfill vollständig |
| 4 | Modell | global: keine Nutzung | nur Verwaltung/get, in keinem Fachpicker |
| 5 | Modell | global: nur Projektteilnehmer | nur nach aktiver Projektzuordnung in Projektlisten; nicht bei Kunden |
| 6 | Modell | global: nur Kunde | in Kundenlisten; nie in Projektlisten, auch ohne/mit zufälliger Zuordnung |
| 7 | Modell | global: beide Nutzungen | in beiden fachlich passenden Listen, Identität gleich |
| 8 | Modell | lokal: keine Nutzung | nur Verwaltung/get im eigenen Projekt |
| 9 | Modell | lokal: nur Projektteilnehmer | nur im eigenen Projekt in Projektlisten |
| 10 | Modell | lokal: nur Kunde | nur im eigenen Projekt in Kundenliste, nie Teilnehmer |
| 11 | Modell | lokal: beide Nutzungen | in beiden Listen nur im eigenen Projekt |
| 12 | Create | Anlage unter Firmen | global; Teilnehmer 1, Kunde 0 |
| 13 | Create | Anlage unter Projektfirmen | lokal mit korrektem `project_id`; Teilnehmer 1, Kunde 0 |
| 14 | Create | Anlage unter Rechnungen | Kunde 1; Teilnehmer 0; Scope gemäß bestätigter Regel |
| 15 | Update | zweite Nutzung ergänzen/entfernen | erste Nutzung und Stammdaten bleiben unverändert; Optimistic-Lock-Konflikt erkennbar |
| 16 | Projektzuordnung | globaler Teilnehmer nicht zugeordnet/zugeordnet/inaktiv | nur aktiv zugeordnet im Projektpicker; Kundensicht davon unabhängig |
| 17 | Aktivität | lokale Teilnehmerfirma `is_active=0` | nicht neu auswählbar; Kundennutzung bleibt unabhängig sichtbar |
| 18 | Personenpool | Personen unter Kunden-only-Firma | nicht in Kandidaten/Teilnehmern/Ansprechpartnern |
| 19 | Personenpool | lokale und globale Teilnehmerpersonen | beide korrekt typisiert; einheitlicher Default für fehlenden Kandidaten |
| 20 | Identität | globale und lokale Firma mit gleichem Namen | zwei getrennte Einträge mit Scope-Kennzeichnung |
| 21 | Identität | künstlich gleiche rohe ID in beiden Tabellen | keine Kollision; `(kind,id)` bleibt eindeutig |
| 22 | TOP | Verantwortlicher lokal/global | korrekter Kind/ID/Label-Snapshot; keine Label-Deduplizierung |
| 23 | TOP-Historie | Teilnehmernutzung nach gespeichertem/geschlossenem TOP entfernt | alter Wert lesbar/druckbar, nicht neu auswählbar |
| 24 | Ansprechpartner | Person der gewählten Teilnehmerfirma aktiv/inaktiv | nur zulässige aktive Person auswählbar; Snapshot bleibt lesbar |
| 25 | Restarbeiten | lokale Teilnehmerfirma | neue Zielreferenz und Label korrekt gespeichert/gelesen |
| 26 | Restarbeiten | zugeordnete globale Teilnehmerfirma | auswählbar und als globale Referenz gespeichert |
| 27 | Restarbeiten | alte Zeile nur mit `responsible_project_firm_id` | Read-Bridge liefert identische Anzeige und PDF |
| 28 | Restarbeiten | Kunden-only-Firma | nicht als Verantwortlicher auswählbar |
| 29 | Import | neuer Stamm-Datensatz | globaler Teilnehmerdefault; Personen korrekt gebunden |
| 30 | Import | neuer Projekt-Datensatz | lokaler Teilnehmerdefault im richtigen Projekt |
| 31 | Import | Merge in Firma mit Kunde-only/beiden Nutzungen | Nutzungen unverändert; nur erlaubte leere Stammdaten ergänzt |
| 32 | Import | gleichnamige globale/lokale Firmen | keine quellübergreifende Zusammenführung |
| 33 | Transfer | neues Archiv | lokale Nutzungen verlustfrei; globale Abhängigkeiten validiert |
| 34 | Transfer | altes Archiv ohne Flags | deterministischer Backfill Teilnehmer 1/Kunde 0 |
| 35 | Transfer | globale Abhängigkeit fehlt oder kollidiert | vollständiger Abbruch vor Write, klare Diagnose |
| 36 | Druck | Firmenliste | ausschließlich aktive Projektteilnehmer im Projekt |
| 37 | Druck | Teilnehmer/Protokoll | gespeicherte Meetingteilnehmer und historische Labels bleiben vollständig |
| 38 | Druck | ToDo lokal/global | Auflösung nach Kind/ID, danach Snapshot-Fallback |
| 39 | Druck | Restarbeiten lokal/global/Legacy | identische sichtbare Verantwortlichenlabels |
| 40 | Rechnungen | Kundenpicker ohne Projekt | ausschließlich globale Kunden |
| 41 | Rechnungen | Kundenpicker mit Projekt | globale Kunden plus lokale Kunden dieses Projekts |
| 42 | Rechnungen | Teilnehmer-only-Firma | nicht als Rechnungskunde auswählbar |
| 43 | Integrität | Teilnehmernutzung bei offener Referenz abschalten | Impact-Prüfung blockiert ohne Datenlöschung |
| 44 | Integrität | Nutzung bei ausschließlich abgeschlossener Historie abschalten | Änderung erlaubt; Historie bleibt lesbar |
| 45 | Integrität | Entfernen/Hard Delete mit Referenzen | bestehende FK-/Schutzregeln greifen; keine verwaisten neuen Referenzen |
| 46 | IPC | ungültiger Kind, fehlendes Projekt, Scope-Mismatch | deterministischer Fehler ohne Teiländerung |
| 47 | IPC | veraltetes `expectedUpdatedAt` | Konflikt statt Überschreiben paralleler Nutzungspflege |
| 48 | UI | gemeinsamer Editor aus allen drei Einstiegspunkten | identische Felder/Validierung, korrekte kontextabhängige Defaults |
| 49 | Variante | App mit Rechnungen, ohne Projektmodule | globale Kundenanlage/-auswahl funktioniert; keine Projektabhängigkeit |
| 50 | Variante | App ohne Rechnungen | Projektfirmen, Teilnehmer, Protokoll, Restarbeiten und Druck funktionieren unverändert |
| 51 | Variante | kombinierte App | eine Firma kann beide Nutzungen tragen; Änderungen sind in beiden Modulen konsistent |
| 52 | Kennzahlen | Projektkopf mit Teilnehmer-, Kunden-only- und inaktiven Firmen | nur aktive Projektteilnehmer werden gezählt |
| 53 | Regression | bestehende Firmen-/Projektfirmen-/Teilnehmer-/TOP-/Restarbeiten-Tests | weiterhin grün, nur bewusst geänderte Erwartungen angepasst |

Zusätzlich sind Laufzeit-SQL-Tests mit echter temporärer SQLite-DB erforderlich. Reine Source-String- oder Fake-DB-Tests reichen für Migration, FK, CHECK, Transaktion und Altarchiv nicht aus.

## G. Klare Empfehlung

Die bestehende Firmenlogik soll **erweitert**, nicht durch ein neues Identitätsmodell ersetzt werden. Gleichzeitig ist eine **neue gemeinsame, modulneutrale Firmen-Domain-Schicht** erforderlich.

Konkret:

1. `firms` und `project_firms` bleiben die einzigen Firmenarten und erhalten dieselben zwei Nutzungsflags.
2. `project_global_firms` bleibt unverändert eine Zuordnung mit projektbezogenem Aktivstatus.
3. Ein neuer `FirmDirectoryService` wird alleinige Regel- und Listenquelle für Teilnehmer, Kunden, Personenbezug, Nutzungspflege und Impact-Prüfung.
4. Bestehende IPCs bleiben zunächst kompatible Adapter; neue und umgestellte Module verwenden nur die neutralen Intent-APIs.
5. Projektpfade filtern ausschließlich `use_project_participant`; Rechnungen ausschließlich `use_customer`.
6. Historische Referenzen bleiben snapshotbasiert lesbar. Neue Auswahl und neue Writes werden streng validiert.
7. Das Rechnungsmodul erhält keine eigene Firmenkopie und keine eigene Kundenstammtabelle.

Diese Kombination ist die kleinste Architekturänderung, die die zwei Produktvarianten und die kombinierte App ohne Datenverdopplung, dritte Firmenart oder Modulabhängigkeit korrekt trägt.

## Offene Entscheidungen durch Steffen

1. **Scope bei Neuanlage aus Rechnungen:** Soll eine aus einer projektbezogenen Rechnung neu angelegte Firma standardmäßig global werden, oder soll der Benutzer zwischen global und lokal für dieses Projekt wählen? Ohne Projektkontext kann sie nur global sein. Empfehlung: global als Default, lokal nur als bewusste Auswahl bei vorhandenem Projekt.
2. **Abschalten von „Projektteilnehmer“ bei aktiven Bezügen:** Soll die Änderung strikt blockiert werden, bis aktive Projektzuordnungen/offene Bezüge bereinigt sind, oder soll die Firma nur aus neuen Pickern verschwinden und bestehende offene Bezüge behalten? Sicherheitsempfehlung: blockieren; abgeschlossene Historie nie verändern.
