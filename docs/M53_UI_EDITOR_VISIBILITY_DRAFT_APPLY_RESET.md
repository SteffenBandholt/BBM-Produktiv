# M53 UI-Editor: Sichtbarkeits-Entwurf, Apply und Reset

## Zweck
M53 erweitert das bestehende M52-Statuspanel um die erste kontrollierte Layoutaenderung fuer registrierte BBM-Elemente. Es ist kein freier visueller Editor.

## Erlaubter Funktionsumfang
Erlaubt sind ausschliesslich:
- Sichtbarkeit `visible: true`
- Sichtbarkeit `visible: false`
- Entwurf erstellen und anzeigen
- Entwurf verwerfen
- Entwurf anwenden
- gespeicherten Layoutzustand laden
- gespeicherten Layoutzustand fuer das ausgewaehlte Element zuruecksetzen

Nicht erlaubt sind Position, Groesse, Abstaende, Farben, Schrift, Text, HTML, Children, Parent- oder Typaenderungen.

## Oeffentliche UI-Editor-kit-Vertraege
M53 nutzt nur `require("ui-editor-kit")`. Analysierte oeffentliche Exporte in v0.2.0:
- `createTargetAppAdapterRuntime`
- `createLayoutState`
- `validateLayoutState`
- `createMemoryLayoutStateStore`
- `createEditorLayoutControlViewModel`
- `assertCompatibleLayoutProfile`
- `getLayoutStateProfileKey`
- Runtime-/Status-/Selection-ViewModel-Factorys

Der oeffentliche LayoutState-Vertrag verlangt mindestens `schemaVersion: 1`, `targetAppId`, `uiScope`, `layoutScope`, `layoutProfileId` und `version` oder `revision`. Die Layoutwerte liegen unter `elements` als Objekt. Fuer M53 wird `visible` ueber `allowedPayloadFields: ["visible"]` freigegeben.

## ChangeDraft-Ablauf
1. Element im M52/M53-Panel auswaehlen.
2. Zielwert fuer `visible` waehlen.
3. Main-Prozess erzeugt eine eng begrenzte ChangeRequest-Struktur.
4. HostAdapter validiert Scope, Layout-Scope, Profil, Element, Operation, Property und Boolean-Wert.
5. Das Panel zeigt den Entwurf mit altem Wert, neuem Wert, Operation, Validierungsstatus und Blockcode.
6. Es wird noch nichts gespeichert.

## Apply-Ablauf
1. Bestehende Runtime verwenden.
2. Entwurf erneut validieren.
3. Element in der Registry pruefen.
4. Scope `bbm.main`, Layout-Scope `bbm.main-layout` und Profil `default` pruefen.
5. Operation `visibility.set` und Property `visible` pruefen.
6. LayoutState per oeffentlichem UI-Editor-kit-Modell erzeugen.
7. LayoutState im MemoryLayoutStateStore speichern.
8. Gespeicherten Zustand zurueckgeben.
9. Panel neu laden.

## Reset-Ablauf
Reset gilt nur fuer das ausgewaehlte Element und das aktive Profil `default`. Der gespeicherte Sitzungswert wird entfernt; anschliessend meldet das Panel den Registry-Default `visible: true`. Andere Elemente bleiben unveraendert.

## Erlaubte und gesperrte Elemente
In M53 umschaltbar:
- `bbm.main.header`
- `bbm.main.actions`

In M53 sichtbar, aber gesperrt:
- `bbm.main.shell` — Hauptrahmen darf nicht unbedienbar werden.
- `bbm.main.navigation` — Rueckweg und Navigation bleiben erhalten.
- `bbm.main.content` — Statuspanel und Inhalt duerfen nicht unbedienbar werden.

## Blockcodes
BBM-spezifische Blockcodes:
- `BBM_UI_CHANGE_NO_SELECTION`
- `BBM_UI_CHANGE_ELEMENT_LOCKED`
- `BBM_UI_CHANGE_UNSUPPORTED_PROPERTY`
- `BBM_UI_CHANGE_INVALID_VALUE`
- `BBM_UI_CHANGE_SCOPE_MISMATCH`
- `BBM_UI_CHANGE_PROFILE_MISMATCH`
- `BBM_UI_CHANGE_DRAFT_INVALID`
- `BBM_UI_CHANGE_APPLY_FAILED`

## MemoryStore-Grenzen
M53 speichert nur im Sitzungsspeicher. Nach einem vollstaendigen Neustart ist der Zustand nicht dauerhaft vorhanden. Es gibt keine Datenbank, keine JSON-Datei, keine LocalStorage-Persistenz und keine Migration.

## IPC-Sicherheitsmodell
Die Preload-Bruecke enthaelt nur eng benannte Methoden:
- `uiEditorCreateChangeDraft`
- `uiEditorGetChangeDraft`
- `uiEditorDiscardChangeDraft`
- `uiEditorApplyChangeDraft`
- `uiEditorLoadLayoutState`
- `uiEditorResetLayoutState`

Es gibt keine generische Ausfuehrungsmethode, kein `eval`, keine beliebigen Operationsnamen und keinen direkten Renderer-Schreibzugriff auf den LayoutStore.

## Testablauf
Automatisiert:
- `git diff --check`
- `node scripts/tests/m51UiEditorKitIntegration.test.cjs`
- `node scripts/tests/m52UiEditorVisibleEntry.test.cjs`
- `node scripts/tests/m53UiEditorVisibilityDraft.test.cjs`
- `node scripts/test.cjs`
- `npm start`, soweit in der Umgebung moeglich

Manuell unter Windows:
1. UI-Editor Status oeffnen.
2. Erlaubtes Element auswaehlen.
3. Sichtbarkeit aendern.
4. Entwurf erstellen.
5. Entwurf pruefen.
6. Anwenden.
7. Layoutstatus neu laden.
8. Gespeicherten Wert kontrollieren.
9. Layout zuruecksetzen.
10. Default-Zustand kontrollieren.
11. Zurueck zur normalen BBM-Navigation.

## Bekannte Einschraenkungen
- Keine direkte sichtbare Ausblendung in der BBM-Arbeitsflaeche, solange keine explizite sichere CoreShell-Bindung vorhanden ist.
- Keine dauerhafte Speicherung.
- Keine Groessen-, Positions-, Style- oder Textbearbeitung.
- Keine DOM-Auswahl und kein DOM-Scan.

## Abgrenzung zu M54
M54 kann eine explizite, sichere Bindung zwischen registrierten CoreShell-Elementen und LayoutState herstellen. Diese Bindung darf weiterhin keine DOM-Suche, keine automatische Registry und keine CSS-Selektor-Ableitung verwenden.
