# Protokoll-Audioimport V1 (#349)

## Produktiver Ablauf

Die Quicklane-Aktion `Import` verwendet den vorhandenen lokalen Audioweg:

`TopsScreen` → Renderer-`TranscriptionService` → `audio:import` →
`AudioImportService` → `audio:importToProtocol` → Main-`TranscriptionService` →
`WhisperCppEngine` → lokales FFmpeg/whisper.cpp.

Es gibt keine Cloud- oder OpenAI-API und keine zweite Transkriptionsengine. Der
bestehende Live-Diktatweg `audio:transcribeBlob` bleibt getrennt und unverändert.

## Fachlicher Importbereich

Der unnummerierte Level-1-Titel `Import` wird über `tops.special_type =
'audio_import'` identifiziert. Die nullable Spalte wird additiv ergänzt;
Bestands-TOPs bleiben `NULL`. Der Importbereich wird in der offenen Ansicht
zuletzt sortiert, ohne die Nummern normaler Titel zu verändern.

Neue Punkte werden als normale Level-2-TOPs unter diesem Titel angelegt. Nach
dem Verschieben unter einen normalen Titel gelten für sie wieder die normalen
Anzeige-, Bearbeitungs- und Druckregeln. Der Importtitel selbst darf nicht
verschoben werden.

## Punktbildung und Atomarität

Nur `neuer Punkt` und `nächster Punkt` trennen das Transkript. Der erste
vollständige Satz wird Kurztext; andernfalls greift die vorhandene
Kurztextgrenze und der Rest bleibt verlustfrei im Langtext.

Transkription und Auswertung laufen vor der TOP-Anlage. Titel und alle Punkte
werden anschließend in genau einer SQLite-Transaktion angelegt. Leeres
Transkript, Transkriptionsfehler oder Abbruch erzeugen daher keinen halben
Importbereich. Ein Abbruch beendet nur die zu diesem Import gehörende
HTTP-Anfrage beziehungsweise den gestarteten Kindprozess.

## UI-/PDF-Vertrag

- Der Quicklane-Button ist ein bewusst registriertes UI-Element. Seine
  Fachaktion, IPC-Aufrufe und Datenänderungen bleiben für den UI-Editor gesperrt;
  nur die bestehenden neutralen Layoutoperationen sind erlaubt.
- Fortschrittsanzeige und Abbruch sind transiente Fach-UI und keine Editorziele.
- Der PDF-V2-Satz und das Layout bleiben unverändert. Die vorhandene
  Datenzusammenstellung entfernt ausschließlich den per Typ und Elternkette
  erkannten Import-Unterbaum. Vorschau und endgültige Ausgabe verwenden damit
  denselben gefilterten Datenweg.

## Abnahmegrenze

Automatisiert werden Dateidialog, Lizenz-/Read-only-Gate, Parser,
Kurz-/Langtext, Wiederverwendung, Sortierung, Migration, Transaktion, Abbruch,
Sprung/Selektion, Druckfilter und unveränderter Live-Diktatweg geprüft. Die
abschließende Bedienprüfung mit einer realen lokalen Sprachdatei bleibt eine
Nutzerprüfung im Arbeitsbranch.

## Bestandsschutz der Registry-38-Profilmigration

Die additive Migration auf Registry 39 übernimmt die gespeicherte Reihenfolge
und sämtliche vorhandenen Zustände unverändert. Sie hängt nur den neuen Zustand
für `protokoll.topsScreen.quicklane.action.importAudio` an und aktualisiert den
Scope-Fingerprint. Ein zweiter Lauf ist wirkungslos und erzeugt weder einen
zweiten Button noch ein weiteres Archiv. Damit darf die Migration individuelle
Positionen, Größen, Schriftgrößen und Sichtbarkeiten eines bestehenden
Protokollprofils nicht normalisieren oder neu sortieren.
