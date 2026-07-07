# UI-Editor Vertrag

Diese Datei ist eine Bruecke fuer den in `AGENTS.md` erwarteten Pflichtpfad.

Die fuehrende Fassung liegt hier:

- [docs/ui-editor/UI_EDITOR_VERTRAG.md](ui-editor/UI_EDITOR_VERTRAG.md)

## Regel

Keine doppelte Fachlogik an diesem Pfad pflegen.

Der UI-Editor bleibt fachneutral. Er darf keine Fachlogik ausfuehren, keine Fachdaten aendern, keine bestehende UI automatisch analysieren oder scannen und keine Registry automatisch befuellen.

## Pruefanker

Diese Bruecke nennt die Pflichtbegriffe fuer bestehende Vertragspruefungen. Die fachliche Auslegung bleibt in der fuehrenden Fassung.

- Startbereich fuer den Vertrag ist Restarbeiten.
- Protokoll-UI bleibt unberuehrt.
- Eine Auswahl = genau ein Ziel.
- Eine Aenderung = nur dieses Ziel.
- Pflichtattribute: `data-ui-inspector-id`, `data-ui-editor-kind`, `data-ui-editor-label`, `data-ui-editor-parent`, `data-ui-editor-editable`, `data-ui-editor-ops`.
- Erlaubte Grundarten: `frame`, `field`, `single`.
