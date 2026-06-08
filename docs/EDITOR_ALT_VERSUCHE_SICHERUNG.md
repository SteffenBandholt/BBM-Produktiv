# Sicherung alter / anderer Editor-Versuche

## Kurzfazit
Der aktuelle UI-Editor-kit-Mechanismus fuer UI-Registrierung und UI-Markierung ist nicht Gegenstand dieses Auftrags und gilt als bestehende Arbeitsgrundlage.

Alte oder andere Editor-Versuche im Repo sind dokumentarisch abgegrenzt und duerfen nicht als Grundlage fuer den aktuellen UI-Editor-kit-Zweig verwendet werden, ausser der Nutzer gibt sie ausdruecklich frei.

## Abgrenzungstabelle

| Pfad / Bereich | Kategorie | Darf als Grundlage fuer aktuellen UI-Editor-kit-Zweig verwendet werden | Begruendung |
|---|---|---|---|
| `src/renderer/editor.html` | Legacy | nein | Alter Editor-Einstieg, nicht Teil des aktuellen UI-Editor-kit-Zweigs. |
| `src/renderer/editor.js` | Legacy | nein | Alter Editor-Codepfad, nicht Grundlage fuer den aktuellen UI-Editor-kit-Zweig. |
| `src/main/ipc/editorIpc.js` | Legacy | nein | Alter IPC-Editorpfad, nicht Grundlage fuer den aktuellen UI-Editor-kit-Zweig. |
| `src/renderer/views/ProjectFirmsView.js` | anderer Editor-Versuch | nein | Enthält den alten Firmen-/Personen-Editorpfad und bleibt von der neuen UI-Editor-kit-Grundlage getrennt. |
| `src/renderer/uiEditor/demo/**` | Demo | nein | Demo-/Beispielpfad, nur mit ausdruecklicher Freigabe nutzbar. |
| `src/renderer/uiV2/editorLab/**` | Lab | nein | Labor-/Experimentierpfad, nicht als Basis fuer den aktuellen UI-Editor-kit-Zweig. |
| `src/renderer/uiV2/editorV2/**` | Lab / anderer Editor-Versuch | nein | Experimenteller Editorpfad, nicht als Grundlage fuer den aktuellen UI-Editor-kit-Zweig. |
| `data-ui-v2-id` Welt | anderer Editor-Versuch | nein | Alte Kennungswelt fuer andere Editor-Experimente, nicht als Basis fuer den aktuellen UI-Editor-kit-Zweig. |

## Sperre
Alte oder andere Editor-Versuche duerfen nicht importiert, erweitert oder als Basis genutzt werden, ausser der Nutzer gibt sie ausdruecklich frei.

## Hinweis
Nicht loeschen ohne separaten Auftrag und Testnachweis.

## Hinweis zu M3/M4
M3/M4 sind laut [docs/EDITOR_M2_M4_BEWERTUNG.md](./EDITOR_M2_M4_BEWERTUNG.md) eingefroren und nicht als Ersatz fuer den bestehenden UI-Editor-kit-Mechanismus zu verwenden.
