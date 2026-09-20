# Protokoll-Audioimport V1 (#349)

Stand: 2026-09-20
Arbeitsbranch: `protokoll/audio-import-v1-rebuild`
Basis: `a64d74b3ed7ae1075887064aef0e0f0e121ebadf`

## Nutzerablauf

`Import` ist die fünfte feste Aktion der kompakten Protokoll-Quicklane direkt
nach `Teilnehmer`. Die Aktion ist nur bei beschreibbarer Besprechung,
Audiofreigabe und ohne bereits laufenden Import aktiv. Der echte Klickweg nutzt
den nativen Electron-Dateidialog. Danach läuft die vorhandene lokale
FFmpeg-/Whisper.cpp-Kette. Unmittelbar nach bestätigter Auswahl öffnet sich ein
kompakter, mittiger Fortschrittsdialog. Er nennt die Datei und unterscheidet
`Vorbereitung`, `Spracherkennung` und `TOPs speichern`. Da die vorhandene Engine
während der Spracherkennung keinen gemessenen Teilfortschritt liefert, bleibt
dort ein animierter Wartebalken ohne erfundene Prozentanzeige sichtbar.
`Abbrechen` beendet ausschließlich die aktuelle, über ihre Operations-ID
zugeordnete Importoperation und zeigt bis zur Bestätigung
`Import wird abgebrochen …`. Erfolg (`X TOPs importiert`) und Fehler ersetzen
die Wartemeldung eindeutig; parallele Starts bleiben gesperrt. Das bestehende
Live-Diktat über `audio:transcribeBlob` bleibt getrennt.

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

## Mehrfachverschieben von Import-TOPs

Der vorhandene Schieben-Aufruf eines noch unmittelbar unter dem typisierten
Importtitel liegenden Punkts oeffnet einen eigenen, nicht editorfaehigen
Runtime-Dialog. Er zeigt ausschliesslich die Punkte desselben Importtitels; der
aufrufende Punkt ist vorausgewaehlt. Kurztexte werden vollstaendig dargestellt,
Langtexte koennen gemeinsam eingeblendet werden. Die Aktion ist erst mit
mindestens einem gewaehlten Punkt und einem zulaessigen normalen Level-1-Zieltitel
derselben Besprechung verfuegbar.

Alle gewaehlten Punkte werden in ihrer bisherigen Reihenfolge am Ziel angehaengt.
IDs und Besprechungsinhalte bleiben erhalten, die Nummern vergibt die bestehende
TOP-Logik. Schreibberechtigung, offene Besprechung, Import-Quellzugehoerigkeit
und Ziel werden unmittelbar in einer gemeinsamen SQLite-Transaktion erneut
geprueft. Ein Fehler rollt die gesamte Auswahl zurueck; eine zweite Ausfuehrung
derselben Auswahl wird durch die erneute Quellpruefung abgewiesen. Nicht gewaehlte
Punkte sowie der Importtitel bleiben bestehen. Ausserhalb des Import-Unterbaums
arbeitet das bisherige Einzelverschieben unveraendert.

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
unveränderte Diktatverdrahtung. Dialogzustände, Operationszuordnung,
unbestimmter Wartebalken, Abbruchzustand, Fehler und Erfolg sind gezielt
abgedeckt. Die echte Aufnahme `resources/120108_011.MP3` wurde in einem
isolierten DEV-Profil über den gerenderten Importbutton, Preload/IPC und die
produktive lokale FFmpeg-/Whisper.cpp-Kette verarbeitet. Der Dialog war bereits
vor Eintritt in den Verarbeitungs-IPC sichtbar und blieb während der langen
Spracherkennung aktiv. Whisper lieferte 2.056 Zeichen; neun TOPs wurden atomar
gespeichert. Die Dateiauswahl wurde im Prüfgerüst bestätigt und ist kein neuer
Nachweis einer manuell bedienten nativen Windows-Dateiauswahl.

Der tatsächliche Renderer-Klick erreicht nachweislich den produktiven
Preload-/IPC-Handler und den echten nativen Dateidialog. Auswahl und Abbrechen
im nativen Windows-Dialog sind in der vorhandenen Automationsumgebung nicht
fernsteuerbar und bleiben deshalb Teil von Steffens einmaliger Sichtabnahme.
