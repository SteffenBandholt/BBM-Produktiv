# Restarbeiten V2 Registry

## 1. Grundsatz
Restarbeiten V2 liefert spaeter eine Registry fuer Editor V2.

Regeln:
- keine alten `data-ui-inspector-id` uebernehmen
- keine Restarbeiten-Sonderlogik im Editor
- keine Verschachtelung tiefer als 4 Ebenen
- alle Parent-IDs muessen existieren

Die Registry bildet die neue UI-Struktur eindeutig ab.

## 2. Registry-Grundstruktur

### Root
- `restarbeitenV2.root`

### Header
- `restarbeitenV2.header`
- `restarbeitenV2.header.context`
- `restarbeitenV2.header.status`
- `restarbeitenV2.header.filter`

### Quicklane
- `restarbeitenV2.quicklane`
- `restarbeitenV2.quicklane.lock`
- `restarbeitenV2.quicklane.neu`
- `restarbeitenV2.quicklane.filterOffen`
- `restarbeitenV2.quicklane.filterErledigt`
- `restarbeitenV2.quicklane.filterAlle`
- `restarbeitenV2.quicklane.foto`
- `restarbeitenV2.quicklane.diktat`

### Main
- `restarbeitenV2.main`
- `restarbeitenV2.main.liste`
- `restarbeitenV2.main.nummer`
- `restarbeitenV2.main.textbereich`
- `restarbeitenV2.main.verortung`
- `restarbeitenV2.main.meta`

### Footer / Workbench
- `restarbeitenV2.footer`
- `restarbeitenV2.footer.kurztext`
- `restarbeitenV2.footer.langtext`
- `restarbeitenV2.footer.verortung`
- `restarbeitenV2.footer.meta`
- `restarbeitenV2.footer.fotos`
- `restarbeitenV2.footer.notiz`

## 3. Pflichtdaten pro Registry-Eintrag
Jeder Eintrag braucht:
- id
- label
- kind: frame / field / control
- parentId
- editable
- ops: move / resize / hide
- selector

Optional:
- minWidth
- minHeight
- gridEditable

## 4. Kind-Regeln
Die Kind-Regeln sind fest:

- frame = Bereich / Gruppe / Container
- field = Eingabe-/Anzeige-/Listenfeld
- control = Button / Icon / Schalter

Es werden keine neuen Sondertypen eingefuehrt.

## 5. Strukturregeln
Die Registry folgt der UI-Struktur:

- Root fuer das gesamte Modul
- Header, Quicklane, Main und Footer als Hauptbereiche
- darunter die jeweiligen Gruppen und Elemente

Die Struktur bleibt damit eindeutig und editorfreundlich.
