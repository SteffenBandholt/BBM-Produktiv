# M81.1 – Sicherer BBM-Editorstart bei inkompatiblen Benutzerprofilen

## Ursache

Der lokale Electron-Handshake, die Registry und die Pipe waren gültig. Der native Editor versuchte danach jedoch, das alte Layoutprofil unmittelbar anzuwenden. Eine veraltete Registrystruktur führte zu `electron_restore_failed`; BBM zeigte den Fehler dadurch fälschlich als „UI-Editor konnte nicht verbunden werden“ und schloss die bereits hergestellte Sitzung.

Das reale Profil enthielt ein älteres `restarbeiten.edit.root`-Inventar und keinen aktuellen Header-Scope. Da das Altformat die früheren Parent-/Rolleninformationen nicht vollständig belegt, ist eine automatische Migration nicht sicher nachweisbar.

## Neuer Startweg

1. BBM stellt wie bisher den lokalen Electron-Vertrag, drei vollständige UI-Scopes und optional die 28-elementige PDF-Registry bereit.
2. Das UI-Editor-kit klassifiziert UI und PDF getrennt.
3. Ein kompatibles oder fehlendes Profil startet direkt. Ein inkompatibles oder beschädigtes Profil öffnet den nativen Sicherheitsdialog.
4. `Abbrechen` lässt Datei und BBM unverändert. `Mit Standardlayout öffnen` archiviert zuerst das Original byte-identisch und startet danach sauber von der Ziel-App-Baseline. Migration erscheint nur bei strengem Positivnachweis.
5. Profilfehler besitzen eigene `electron_profile_*`-, UI-Restore- und PDF-Restore-Codes. BBM meldet sie nicht mehr als Verbindungsfehler und zeigt bei bewusstem Abbruch keine zweite generische Fehlermeldung.

## Archivvertrag

Das Archiv liegt ausschließlich innerhalb der vorhandenen Profilwurzel:

`ui-editor/profiles/archive/<applicationId>/<timestamp>_<reason>_<original>`

Die Originalbytes bleiben unverändert. Eine atomar geschriebene `.metadata.json`-Datei enthält Originalname/-zeit, Archivzeit, Grund, Klassifikation, Schema-/Vertrags-/Registryversion, alte und aktuelle Fingerprints, Dokumenttyp und SHA-256. Kollisionen werden mit einem eindeutigen Namen aufgelöst; es gibt kein stilles Überschreiben oder Löschen.

## Reale Abnahme

- normaler BBM-Benutzerprofilpfad verwendet,
- vorhandenes inkompatibles `standard.layout-profile.json` erkannt,
- Dialog und technische Details einschließlich exaktem Profilpfad geprüft,
- Altprofil mit identischer Länge, Zeit und SHA-256 archiviert,
- Standardlayout sauber ohne Autosave geöffnet,
- UI-Element in BBM ausgewählt und markiert,
- 28 PDF-Elemente und echte zweiseitige Protokollvorschau geprüft,
- UI- und PDF-Layout gespeichert, BBM vollständig neu gestartet und beide Profile sauber wiederhergestellt,
- Elementreset, Gesamtreset und Discard geprüft,
- erneuter Editoraufruf fokussiert dieselbe Managerinstanz.

Fachwerte, Registry, Parent-/Operationsvertrag, PDF-Core, Paginierung und Druckweg blieben unverändert. M82 bleibt offen.

