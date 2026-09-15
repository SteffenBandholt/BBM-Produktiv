# UI-/PDF-Entwurfsentscheidung: Firmenstamm-Zuordnung zum Projekt

Stand: 2026-09-14

## Auftrag und Grenze

Der bestehende Dialog `Firmen im Projekt -> Aus Firmenstamm zuordnen` soll nur
zentrale Firmen mit freigegebener Projektteilnahme anbieten. Der kanonische
Verwendungsvertrag aus `FirmDirectoryService.listAll` ist
`uses.projectParticipant`. Unterstützte ältere Darstellungen bleiben reine
Lesekompatibilität. Die gespeicherten Verwendungen und Zuordnungen werden durch
die Filterung nicht verändert.

Das Paket ändert keine Datenbank, keine Migration, keinen IPC-/Preload-Vertrag,
keine PDF-Ausgabe und keine Editorregistrierung.

## A. Art der Ausgabe

- Art: UI
- Änderung: Datenfilterung, fachlich unterscheidbare Leerzustandsmeldungen und
  eine lokale Korrektur der bestehenden Zuordnungsdialog-Hülle
- PDF: keine Änderung
- Layout und DOM-Struktur: Der fehlerhafte Sechs-Blöcke-/Fünf-Grid-Zeilen-Aufbau
  wird durch die vorhandene BBM-Popupstruktur ersetzt. Es entstehen keine neuen
  fachlichen Bereiche und keine globale Styleänderung.

## B. Editorfähigkeit

- Die geänderten Inhalte sind nicht editorfähig. Firmenfilter, Auswahl und
  Projektzuordnung sind Fachlogik beziehungsweise Fachdaten-/IPC-Aktionen.
- Der bestehende UI-Editor-Scope `bbm.project-firms` bleibt `blocked` mit
  `inventoryStatus: notInventoried`, ohne `componentIds`, Elemente oder
  Editor-Parents.

## C. Editorfähige Elemente

Dieses Paket erzeugt, entfernt oder ändert kein editorfähiges Element. Es gibt
daher keine neuen oder geänderten Angaben für:

- `data-ui-inspector-id`
- `data-ui-editor-kind`
- `data-ui-editor-label`
- `data-ui-editor-parent`
- `data-ui-editor-editable`
- `data-ui-editor-ops`

Die bestehende gesperrte Scope-Kennung `bbm.project-firms` bleibt unverändert.
Da der Scope keine registrierten Elemente besitzt, existieren für diesen
Bereich keine Element- oder Parent-Kennungen, die in diesem Paket klassifiziert
werden könnten.

## D. Nicht editorfähige Elemente und verbotene Editor-Ziele

- Laden und Filtern der Firmenstammdaten
- Suchergebnis und fachliche Firmenauswahl
- die Aktion `Zuordnen` und die Projektzuordnung
- zugehörige IPC-, Datenbank- und sonstige Fachdatenaktionen
- fachliches Speichern, Anlegen, Löschen, Upload, Import und Autosave

Diese Aktionen erhalten keine Editoroperationen. Es werden weder `allowedOps`
ergänzt noch bestehende `lockedOps` verändert.

## E. Parent- und Strukturregel

Die reale, deklarierte DOM-Struktur des bestehenden Dialogs lautet nach der
Korrektur:

```text
Overlay (createPopupOverlay)
  Dialog (.bbm-popup-standard.bbm-popup-dialog)
    Kopf (.bbm-popup-header)
      Titel
      Schließen-X
    Inhalt (.bbm-popup-body)
      Hinweis
      Suche
      Trefferanzeige
      Firmenliste (einziger Scrollbereich)
    Aktionen (.bbm-popup-footer)
      Abbrechen
      Zuordnen
```

Der Dialog bleibt innerhalb der vom gemeinsamen Overlay berechneten verfügbaren
Fensterhöhe. Kopf und Aktionen sind nicht scrollbar. Der Inhaltsbereich selbst
bleibt `overflow: hidden`; ausschließlich die Firmenliste darf bei Platzmangel
scrollen. Bei vier Firmen wächst der Dialog nur mit seinem Inhalt und erzeugt
keinen künstlichen Leerraum.

Diese DOM-Parents sind keine Editor-Parents. Da keine Editorziele entstehen,
wird keine Editor-Parent-Beziehung ergänzt, geändert oder geraten.

## E.1 Bedien- und Fokusentscheidung

- Das sichtbare X, `Abbrechen` und `Escape` verwenden denselben lokalen
  Schließpfad und lösen keine Projektzuordnung aus.
- Der Schließpfad räumt die über `popupCommon.js` registrierten Overlay-,
  Tastatur- und Viewport-Handler auf, entfernt den Dialog und gibt den Fokus an
  das zuvor aktive, noch verbundene Element zurück.
- Erfolgreiches `Zuordnen` verwendet weiterhin den bestehenden IPC-Aufruf und
  lädt die Projektfirmenansicht neu.
- Suche, Trefferzählung, Auswahlmarkierung und Doppelklick-Zuordnung bleiben
  fachlich unverändert.

## F. Prüfung und Guardrails

- gezielte Laufzeitregression in `scripts/tests/projectFirmsLayout.test.cjs`
  für den kanonischen Vertrag, unterstützte Altformate, reine Rechnungskunden,
  bereits zugeordnete Firmen und alle drei Leerzustände;
- Dialogregressionen für die gemeinsame Popupstruktur, vier Firmen, eine lange
  Liste, kleine Fensterhöhe, den alleinigen Listenscroll sowie Schließen per X,
  `Abbrechen` und `Escape` einschließlich Fokus-Rückgabe und Handler-Cleanup;
- Regression für Suche, Auswahl, Zuordnung und erneutes Öffnen;
- bestehende FirmDirectory- und Projektfirmen-Regressionen;
- bestehende M80-Schutzprüfung für den unverändert blockierten Scope
  `bbm.project-firms`;
- `git diff --check` und gezieltes ESLint;
- realer Windows-BBM-Ablauf mit isolierten Testdaten, sofern die native
  Computersteuerung in der Sitzung verfügbar ist.

Ein Ladefehler bleibt ein Fehler aus dem vorhandenen `reload`-Ablauf und wird
nicht in einen Leerzustand umgedeutet.

## Festgelegte fachliche Auswertung

1. `uses.projectParticipant` ist die kanonische, vorrangige Quelle.
2. Fehlt diese Angabe, bleibt das Array `usages` mit
   `project_participant` lesbar.
3. Fehlt auch das Array, bleiben die älteren Flags
   `use_project_participant` und `project_participant` lesbar.
4. Eine reine Kundenfreigabe begründet keine Projektteilnahme.
5. Bereits zugeordnete geeignete Firmen bleiben aus der Auswahl ausgeschlossen.
6. Die Leerzustände unterscheiden einen leeren Firmenstamm, fehlende
   Projektteilnehmerfreigaben und vollständig ausgeschöpfte geeignete Firmen.

## Nutzerabnahme und Git-Abschluss (2026-09-15)

Der Nutzer hat bestätigt: Firmenauswahl, Zuordnungsdialog und Schließen
funktionieren. Der im Reparaturlauf offene manuelle Nachweis ist damit durch den
Nutzer erbracht. Codex behauptet keine zusätzliche eigene native Bedienprüfung.
Die Reparatur ist für ihren separaten Commit sowie die kontrollierte Integration
und den Push nach `main` freigegeben. Die gezielten Firmen- und
Zuordnungsregressionen werden im integrierten Stand erneut ausgeführt; die zwei
bekannten auf `main` reproduzierten Layout-Altfehler bleiben außerhalb des Pakets.
