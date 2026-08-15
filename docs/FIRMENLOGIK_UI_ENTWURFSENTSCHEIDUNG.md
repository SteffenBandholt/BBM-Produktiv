# UI-Entwurfsentscheidung – Firmenlogik

Stand: 2026-08-15

## Einordnung

Der gemeinsame Firmeneditor ist eine fachliche Formularoberfläche. Er ist keine neue editorfähige UI-Komponente des BBM-UI-Editors. Der Auftrag ändert weder PDF-Layout noch HostAdapter, Registry, Komponentenvertrag oder Layout-Persistenz.

## Entscheidung

- Der Editor wird zentral durch `src/renderer/features/firms/openFirmEditor.js` bereitgestellt.
- Die Einstiegspunkte Firmen, Projektfirmen und Rechnungen verwenden dieselbe Implementierung und dieselben `firmDirectory:*`-Verträge.
- Der Scope einer bestehenden Firma kommt aus der typisierten Referenz und ist nicht umschaltbar.
- Nur bei einer neuen projektbezogenen Rechnung ist die bewusste Wahl „projektlokal“ (Default) oder „global“ möglich.
- Projektteilnehmer und Rechnungskunde sind zwei unabhängige Felder.
- Save, Create, Nutzungsänderung, Impact-Prüfung und IPC sind keine Ziele des UI-Editors.

## UI-Editor-Abgrenzung

Es werden keine Komponenten- oder Element-IDs, Slots, Parents, Referenzauflösungen, erlaubten Layoutoperationen oder Registry-Einträge ergänzt. Die bestehenden Registries für Projektfirmen, Protokoll und Restarbeiten werden nicht automatisch erweitert. Damit entsteht durch diesen Auftrag kein unvollständiger Komponentenvertrag.
