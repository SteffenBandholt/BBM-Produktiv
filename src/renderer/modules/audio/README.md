# Audio / Diktat

Dieses Modul kapselt den rendererseitigen Einstieg fuer Audio und Diktat.

Enthalten sind aktuell:
- `TranscriptionService` als Renderer-Adapter
- der Entwicklungs-UI-Baustein fuer `Einstellungen -> Entwicklung -> Diktieren`

Hinweis:
- Die eigentliche Main-/IPC-/Whisper-Technik bleibt im Main-Prozess.
- Das ist kein Sidebar-Modul und kein Eintrag im Modulkatalog.
- `DictationController`, `AudioFeature`, `AudioSuggestionsFlow` und `AudioSuggestionsPanel` bleiben vorerst an ihren alten Orten.

## Protokoll-Audioimport V1

Der Renderer-Adapter reicht für Issue #349 zusätzlich die vorhandene native
Dateiauswahl sowie Start und Abbruch eines Protokollimports an den Main-Prozess
durch. Die Fachlogik für Punktbildung und atomare TOP-Anlage liegt im
Main-Service `ProtocolAudioImportService`; der bestehende Live-Diktatweg bleibt
unverändert. Details: `docs/PROTOKOLL_AUDIO_IMPORT_V1.md`.
