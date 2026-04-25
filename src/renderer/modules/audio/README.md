# Audio / Diktat

Dieses Modul kapselt den rendererseitigen Einstieg fuer Audio und Diktat.

Enthalten ist aktuell nur der `TranscriptionService`.

Hinweis:
- Die eigentliche Main-/IPC-/Whisper-Technik bleibt im Main-Prozess.
- Das ist kein Sidebar-Modul und kein Eintrag im Modulkatalog.
- `DictationController`, `AudioFeature`, `AudioSuggestionsFlow` und `AudioSuggestionsPanel` bleiben vorerst an ihren alten Orten.
