# BBM Kundenupdate 1.5.1

## Abgeschlossene Korrekturen

- Die Projektübersicht ist kompakter; Projektbezeichnungen bleiben vollständig
  lesbar und die Reihenaktionen benötigen keinen Buttonplatz mehr.
- `Baubesprechung`, `Planung` und `Bauherr` erscheinen als kompakte Textaktionen.
  Die zuletzt geöffnete Reihe bleibt pro Projekt erkennbar markiert.
- Beim Datum `Fertig bis` ist die passende ISO-Kalenderwoche sichtbar; der
  vorhandene Kalender bleibt über das Datumsfeld erreichbar.
- Die PDF-Vorschau öffnet sich als eigenständiges Fenster und kann auf dem
  Bildschirm sowie zwischen Monitoren verschoben werden.
- Die vier Seitenränder bleiben unter `Einstellungen` → `Ausgabe & Druck`
  zugänglich und werden dauerhaft für die Protokoll-PDF verwendet.

## Freigabe- und Updatevertrag

- Kundenpakete verwenden weiterhin die bestehende kundenbezogene App-ID und
  den bestehenden Profilordner `%APPDATA%\BBM-Kunden\c-…`.
- Der Profilkey wird aus der stabilen Kundennummer gebildet. Beim Paketlauf ist
  deshalb derselbe Kunde im Lizenztool zu wählen wie bei der vorhandenen
  Kundeninstallation.
- Projekte, Firmen, Einstellungen und die installierte gültige Lizenz liegen im
  Kundenprofil. Das Setup überschreibt diese Daten nicht; auch ein späteres
  Deinstallieren ist nicht zum Update vorgesehen.
- Die Version ist `1.5.1`. Das neue Setup muss über die bestehende Installation
  ausgeführt werden, nachdem BBM vollständig geschlossen wurde.

## Nicht Bestandteil dieser Vorbereitung

Kein Setup wurde gebaut, keine Lizenz erzeugt und keine Installation ausgeführt.
Die echte Aktualisierung der vorhandenen Kundeninstallation ist der noch
ausstehende manuelle Schritt.

Technisch geprüft wurden die stabile Kunden-App-ID und der Profilpfad, der
Erhalt einer vorhandenen lokalen Lizenz sowie der kundenseitige Zugang zu den
vier Seitenrändern. Der Installationsvorgang über eine bereits vorhandene
Kundeninstallation wurde in diesem Paket nicht erneut ausgeführt.
