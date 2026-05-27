# UI-Editor Vertrag

## Zweck
- Dieser Vertrag legt verbindlich fest, wie neue oder neu strukturierte UIs editorfaehig aufgebaut werden.
- Der Editor soll nicht raten, sondern klare Metadaten direkt aus der UI erhalten.

## Geltung
- Jede neue UI muss editorfaehig geplant werden.
- Kein neues UI-Modul ohne Editor-Struktur.
- Protokoll-UI bleibt unberuehrt; Startbereich fuer den Vertrag ist Restarbeiten.

## Pflichtattribute pro editierbarem Element
Jedes editorrelevante Element braucht:
- `data-ui-inspector-id`
- `data-ui-editor-kind`
- `data-ui-editor-label`
- `data-ui-editor-parent`
- `data-ui-editor-editable`
- optional: `data-ui-editor-ops`

## Erlaubte kind-Werte
- `frame`
- `field`
- `single`

Bedeutung:
- `frame` = Rahmen/Gruppe/Container
- `field` = Eingabe-/Text-/Listenfeld
- `single` = Button, Label, Restzeichen, kleine Anzeige

## Parent-Regel
- Jedes Element ausser Root braucht einen Parent.
- Der Parent muss als Editor-Ziel existieren.

## Editor-Regeln
- Eine Auswahl = genau ein Ziel.
- Eine Aenderung = nur dieses Ziel.
- Keine automatische Aenderung von Parent, Child oder Geschwistern.

## Trefferregel
- `elementFromPoint` + `closest("[data-ui-inspector-id]")`.
- Typ/Kind entscheidet, ob ein Ziel im aktuellen Modus erlaubt ist.
- Wenn `closest` nicht direkt aufloesbar ist, darf ein Ziel gewinnen, wenn dessen Element den Top-Treffer enthaelt.

## Speichern
- Solange nur Vorschau-/Editor-Entwicklung laeuft: keine Speicherung.

## Beispiel-DOM
```html
<div
  data-ui-inspector-id="restarbeiten.editbox.kurztext"
  data-ui-editor-kind="frame"
  data-ui-editor-label="Kurztext"
  data-ui-editor-parent="restarbeiten.editbox"
  data-ui-editor-editable="true"
  data-ui-editor-ops="move,resize"
>
</div>
```
