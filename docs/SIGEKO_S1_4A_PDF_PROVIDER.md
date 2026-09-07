# S1.4a – neutraler PDF-Provideranschluss

Basis: Gesamtplan #277, SiGeKo #274, BBM main db0ca2f und UI-Editor-kit main
5e0d551 nach dem fachneutralen fixed-layout-Vertrag (#321 / Kit #93).

## Umfang und Entwurfsentscheidung

Ausgabe: PDF, editorfähig. Ein begrenzter technischer A4-Beleg mit Titel und Text
weist den vorhandenen Print-, Ablage-, Vorschau- und Regenerationsweg nach.
Keine SiGeKo-Fachfelder, keine Vorlagenüberlagerung und kein S1.5. Rechnung #275
bleibt eingefroren. Die A2-Querformatvorlage wird in diesem Paket nicht gerendert.

| ID / explizite Ref | Kind / Label | Parent | Editable / allowedOps |
|---|---|---|---|
| `pdf.bbm.technical-neutral` / `technical.document` | document / Technisches Dokument | null | false / keine |
| `pdf.bbm.technical-neutral.page` / `technical.page` | page / Seite | Dokument | false / keine |
| `pdf.bbm.technical-neutral.title` / `technical.title` | text / Titel | Seite | true / textResize |
| `pdf.bbm.technical-neutral.body` / `technical.body` | text / Text | Seite | true / textResize |

Refs sind einzelne explizite Ziele in `.printRoot`, `.page`, `.providerTitle` und
`.providerBody`. Registry und vorhandenes `pdfEditorLayout` stellen stabile IDs,
Kind, Label, Parent, Rolle, Reihenfolge, Sichtbarkeit, Baseline, Grenzen und
Operationen bereit. Keine Bestands- oder Fachdatenanalyse erzeugt Editorziele.
Keine Tabellen, Spalten, Bedienbuttons oder Eingabefelder werden hinzugefügt.
Satz, Seitenformat, Sichtbarkeit, Positionen, Textinhalt, fachliche IPC-Aktionen,
Speichern/Anlegen/Löschen/Upload/Import/Export/Autosave bleiben gesperrt.

## Technischer Vertrag

`mode: provider` verlangt einen expliziten `documentTypeId` und `providerRequest`
mit `moduleId`, `providerId`, `projectId`, `documentId`, `data` und `storage.target`.
Optionale übergeordnete Projekt-/Dokument-IDs müssen identisch sein. Eine fehlende
oder widersprüchliche Identität wird abgewiesen; es gibt keinen Protokoll-Fallback.

Die Modulzusammensetzung registriert den technischen SiGeKo-Provider. Die gemeinsame
Bridge kennt keine Fachimplementierung. Sie prüft Modul-Capability, zentrale Lizenz,
Projekt und das S1.3-Speicherziel, bevor sie den Provider aufruft. Wiederholte
Berechtigungs-/Pfadprüfungen erzeugen keine Providerinhalte. Provider können asynchron
liefern. Text gelangt ausschließlich als Textknoten in den Renderer.

Der Print-Einstieg nutzt weiterhin das vorhandene PrintWindow und genau einen
`webContents.printToPDF`-Aufruf. `PrintShell.renderPrint` erhält generische
Inhaltsslots; Kopf, Body, Fußreserve, CSS und PDF-Ausgabe bleiben gemeinsam.
Der bestehende Editor-Resolver führt denselben Providerkontext zur Regeneration.
Profile verwenden ausschließlich den vorhandenen deklarativen Adapter/Profilweg.

## Dokumentartspezifische Satzregeln

Gemeinsame Bezugspunkte: `PDF-V2-SATZ-001`, `002`, `005`, `013`. Bestehende
Protokoll-, Listen-, Restarbeiten- und Rechnungsregeln werden nicht geändert.

- `PDF-PROVIDER-001`: genau eine A4-Hochformatseite, Ränder O/R/U/L 10/12/10/12 mm,
  vorhandene Global-/FullHeader-Slots und 12-mm-Fußreserve.
- `PDF-PROVIDER-002`: Titel höchstens 80 Zeichen ohne Zeilenumbruch; Text höchstens
  600 Zeichen / zehn explizite Zeilen. Keine Tabelle und keine fachlichen Kopfwerte.
- `PDF-PROVIDER-003`: Titelbox 12/18/186/20 mm bei 14 pt, Textbox 12/61/186/150 mm
  bei 11 pt; Zeilenabstand 1,35. Nur Schriftgröße 8–16 pt ist editierbar. Die
  End-DOM-Messung weist Überlauf und Überlagerung vor Druckfreigabe ab.
- `PDF-PROVIDER-004`: Speichern, Vorschau und Editor-Regeneration verwenden dieselbe
  Provideridentität und Ablageauflösung. Regeneration schreibt kontrolliert temporär.
- `PDF-PROVIDER-005`: Schriftänderungen werden atomar geprüft und im bestehenden
  Arbeitszustand zurückgelesen. Auch Restore und Profilimport prüfen Schriftgrenzen.

## Nachweise

`scripts/tests/sigekoPdfProvider.test.cjs` prüft Guards, Kontext, Datenlimits,
Operationssperren, Schriftgrenzen, Profilwiederherstellung und Regenerationsrouting.
Die Suite ist im bestehenden Volltest registriert.

`npm run test:sigeko:s1.4a` erzeugt ein isoliertes Testprofil samt Testprojekt und
prüft echte PDF-Bytes, Seitenzahl, Text, interne Vorschau, Wiederöffnen und einen
im PDF messbaren Schriftwechsel über den bestehenden Editor-Resolver. Der Lauf
ändert keine Produktivdaten. Unter Linux mit Display: `xvfb-run -a npm run
test:sigeko:s1.4a`. Die native Windows-Editoroberfläche ist damit nicht geprüft.

Der fokussierte GitHub-Workflow erzeugt zusätzlich alle 49 bestehenden Golden-
Fixtures auf Basis und Kandidat in derselben Umgebung und vergleicht die kompletten
Strukturhashes und Seitenzahlen. Ergebnisse und Einschränkungen werden nach dem
Lauf hier ergänzt; bisherige Baselinefehler sind keine bestandenen Tests.
