# G129 UI-Editor Hinweis/Infotext Save-Ausfuehrung Referenzstand

## Ziel

G129 bereitet eine kontrollierte lokale Save-Ausfuehrungslogik fuer den Hinweis-/Infotext-Entwurf vor.

Die Logik beschreibt den spaeteren Ablauf hinter dem Save-Adapter, bleibt im Standardzustand aber blockiert.

## Sichtbarer Stand

Im Speicherbereich des UI-Editors ist sichtbar:

- Save-Ausfuehrung
- Save-Ausfuehrung: vorbereitet
- Ausfuehrung im Standardzustand: blockiert
- Ausgefuehrt: nein
- Blockiergrund: Schreibfreigabe-Gate geschlossen
- persisted: false
- previewOnly: true

## Standard-Rueckgabe

Die lokale Funktion `executeReadonlyHintInfotextSave(...)` gibt im Standardzustand sinngemaess zurueck:

- ok: false
- blocked: true
- reason: Schreibfreigabe-Gate geschlossen
- executed: false
- persisted: false
- previewOnly: true

Zusaetzlich werden die lokalen Pruefpunkte ausgewiesen:

- Payload vollstaendig: ja/nein
- Hinweistext gueltig: ja/nein
- Adapter vorbereitet: ja
- Gate offen: nein
- Schreibfreigabe: nein

## Blockierte Faelle

Kontrolliert blockiert werden insbesondere:

- Gate geschlossen
- Payload unvollstaendig
- Hinweistext leer
- keine explizite Freigabe
- vorbereiteter Adapter allein
- vorhandene restarbeitId allein
- DEV-Kontext

## Grenzen

Es gibt weiterhin:

- kein echter Aufruf von `window.bbmDb.restarbeitenCreateNote` im Standardpfad
- kein echter Aufruf von `restarbeiten:createNote` im Standardpfad
- kein IPC-Schreibweg
- kein DB-Schreibweg
- kein localStorage
- kein writeFile
- kein Submit
- kein aktivierter Speicherbutton
- kein Default-true
- keine Wildcard
- keine ENV-Variable
- keine DEV-Modus-Aktivierung
- keine automatische Auswahl einer Restarbeit
- UI-Editor-kit bleibt unveraendert

## Fake-Adapter-Test

In G129 wird bewusst kein isolierter Fake-Adapter-Positivtest ergaenzt.

Der Meilenstein bereitet nur den blockierten Standardpfad und die lokale Rueckgabestruktur vor. Eine positive Ausfuehrung mit injiziertem Adapter bleibt ein eigener Folgeschritt, damit der normale UI-Pfad nicht versehentlich geoeffnet wird.

## Ergebnis

Die Save-Ausfuehrung ist vorbereitet, aber nicht aktiv.

Das Gate bleibt geschlossen, der Speicherbutton bleibt deaktiviert, `executed: false`, `persisted: false` und `previewOnly: true` bleiben gesetzt.
