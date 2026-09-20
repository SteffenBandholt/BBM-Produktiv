# Protokoll-Audioimport V1 (#349)

Stand: 2026-09-20
Arbeitsbranch: `protokoll/audio-import-v1-rebuild`
Basis: `a64d74b3ed7ae1075887064aef0e0f0e121ebadf`

## Nutzerablauf

`Import` ist die fünfte feste Aktion der kompakten Protokoll-Quicklane direkt
nach `Teilnehmer`. Die Aktion ist nur bei beschreibbarer Besprechung,
Audiofreigabe und ohne bereits laufenden Import aktiv. Der echte Klickweg nutzt
den nativen Electron-Dateidialog. Danach läuft die vorhandene lokale
FFmpeg-/Whisper.cpp-Kette. Die Importaktion zeigt den Verarbeitungsstand im
kompakten Button; derselbe Button bricht ausschließlich seine eigene
Importoperation ab. Das bestehende Live-Diktat über `audio:transcribeBlob`
bleibt getrennt.

## Fachvertrag

Nur die gesprochenen Kommandos `neuer Punkt` und `nächster Punkt` beginnen
einen neuen TOP. Das erste gesprochene Kommando `Absatz` je TOP trennt
Kurztext und Langtext; jedes weitere `Absatz` erzeugt einen Absatzumbruch im
Langtext. Ohne `Absatz` bleibt der vollständige TOP-Text im Kurztext. Die
Kommandos werden unabhängig von Groß-/Kleinschreibung und angrenzender
Interpunktion erkannt und aus dem Ergebnis entfernt. Es gibt keine
automatische Satzaufteilung, Zusammenfassung oder Kürzung; Feldgrenzen
verwerfen keinen Text.

Nach erfolgreicher Transkription werden der typisierte Level-1-Titel `Import`
und alle neuen Level-2-Punkte in einer SQLite-Transaktion gespeichert. Der
Titel trägt `tops.special_type = 'audio_import'`, bleibt unnummeriert, wird am
Listenende angezeigt und bei weiteren Importen derselben Besprechung
wiederverwendet. Schreibzustand, Reihe und Projektbezug werden unmittelbar in
der Transaktion erneut geprüft. Fehler, Abbruch, leeres Transkript und eine
zwischenzeitlich geschlossene Besprechung erzeugen keinen unvollständigen
Import-Unterbaum.

Der Importtitel selbst ist nicht verschiebbar. Ein unter einen normalen Titel
verschobener Importpunkt ist wieder ein regulärer TOP. Vorschau, Protokoll-PDF,
TOP-/ToDo-Ausgabe und Folgebesprechung entfernen nur den anhand von
`special_type` und der aktuellen Elternkette erkannten Import-Unterbaum.

## UI-/PDF-Entscheidung

- Art: Runtime-UI und bestehende PDF-Ausgabe mit reiner Eingangsdatenfilterung.
- Editorfähig: nein. Import, Dateiauswahl, Fortschritt, Abbruch, Transkription
  und Speicherung sind Fachaktionen und damit verbotene Editorziele.
- Neue Editor-IDs, Registryeinträge, Layoutoperationen oder PDF-Geometrien:
  keine.
- Parent-/Strukturregel: unverändert; der Runtime-Button wird nicht Teil des
  Editorbaums.
- Guardrails: `scripts/ui-editor-contract-check.cjs`, Registry-40-Profiltest,
  `PDF-V2-PROT-003` sowie die gezielten Audioimporttests.

## Nachweise und Abnahmegrenze

Automatisiert geprüft sind Parser und Texterhalt, Wiederverwendung,
Transaktion/Rollback, spätes Schreib-Gate, gezielter Abbruch, Verschieben,
Druckfilter, Folgebesprechung, Registry 40, Lizenz-/Read-only-Gates und die
unveränderte Diktatverdrahtung. Die synthetische WAV wurde mit produktiven
lokalen Komponenten transkribiert und erzeugte drei sichtbare Punkte.

Der tatsächliche Renderer-Klick erreicht nachweislich den produktiven
Preload-/IPC-Handler und den echten nativen Dateidialog. Auswahl und Abbrechen
im nativen Windows-Dialog sind in der vorhandenen Automationsumgebung nicht
fernsteuerbar und bleiben deshalb Teil von Steffens einmaliger Sichtabnahme.
