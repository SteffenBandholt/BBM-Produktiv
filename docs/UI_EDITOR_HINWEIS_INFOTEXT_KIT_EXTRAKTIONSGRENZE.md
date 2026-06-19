# UI-Editor Hinweis-Infotext Kit-Extraktionsgrenze

## Kurzfazit

Der aktuelle `Hinweis / Infotext`-Entwurf ist in BBM praktisch nutzbar und
bleibt dort erst einmal verankert. Ein spaeteres Herausziehen in das
`UI-Editor-kit` ist denkbar, aber noch nicht freigegeben.

## Aktueller BBM-Ist-Stand

- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- Zielkontext bleibt `Restarbeiten`.
- Die Einbettung laeuft ueber die BBM-Route und das bestehende UI-Editor-Panel.
- Es gibt konkrete BBM-Bedienzustandszeilen und konkrete BBM-Status- und
  Hinweistexte.
- PDF-/Plan-Kontexte bleiben in BBM read-only sichtbar.
- Das ist weiterhin BBM-spezifisch und noch nicht neutralisiert.
- BBM-Dokumentation und BBM-Guardrails beschreiben den Stand, nicht das Kit.
- Die spaetere Speicherfreigabe ist ein eigenes Folgepaket und bleibt hier
  bewusst ausgeklammert.
- Das spaetere Speicherziel und der BBM-Schreibweg bleiben ebenfalls eigene
  Folgepakete.
- Der konkrete Ziel-/Schreibweg-Stand bleibt in einer eigenen Entscheidung
  getrennt.
- G106 beschreibt den Ziel-/Schreibweg-Stand getrennt von dieser Extraktionsgrenze.

## Was spaeter potenziell ins UI-Editor-kit gehoeren koennte

- generische lokale Text-Draft-Eingabe
- generische Live-Vorschau
- generische read-only Elementmodell-Vorschau
- generische read-only Payload-Vorschau
- generische Draft-Validierung
- generischer Reset auf einen Default-Draft-Wert
- generische Anzeige von `nicht gespeichert` / `persisted: false`
- generische Guardrails gegen Persistenz

## Was vorerst nicht extrahiert wird

- Speichern
- Speicherbutton
- Persistenz
- DB-/IPC-Schreibwege
- Surface-Umschaltung
- Drag
- Resize
- PDF-/Plan-Bearbeitung
- BBM-Routenlogik
- BBM-spezifische SurfaceIds

## Voraussetzung fuer eine spaetere Extraktion

1. In BBM bleibt der Ablauf praktisch stabil.
2. Wiederholbare Muster werden fachlich sauber sichtbar.
3. Eine neutrale Schnittstelle wird zuerst beschrieben, nicht geraten.
4. Erst danach werden generische Teile ins `UI-Editor-kit` extrahiert.
5. BBM bleibt Host und liefert SurfaceId, Kontext, Texte und konkrete
   Einbindung.

## Abgrenzung

- keine direkte 1:1-Kopie.
- BBM-spezifische Texte, Routen, SurfaceIds und Referenzorte bleiben im Host.
- Das Kit bekommt spaeter nur das, was wirklich generisch ist.

## Weiterhin blockiert

- aktive Surface-Umschaltung
- SurfaceInfo-Umbau
- kein Drag
- kein Resize
- keine Persistenz
- neue Speicherwege
- DB-/IPC-Schreibwege
- PDF-/Plan-Bearbeitung
- BBM-Routenlogik ins Kit
- Wildcard-Freigaben
- Default-true-Freigaben

## Empfohlene spaetere Extraktionsstrategie

1. BBM als Referenzstand einfrieren.
2. Wiederverwendbare Text-, Preview- und Validierungsteile isolieren.
3. Eine kleine neutrale Kit-Schnittstelle definieren.
4. Erst dann den generischen Kern auslagern.
5. BBM-Sonderteile bewusst im Host lassen.

## Testabdeckung

- `node scripts/tests/bbmUiEditorRuntimeLauncher.test.cjs`
- `npm test`
- `git diff --check`

## Electron-Sichtpruefung

Nicht noetig fuer diese Grenzentscheidung. Es wird nur dokumentiert, wo die
spaetere Extraktion endet und wo BBM bleibt.
