# M82 - BBM als bestehende Electron-Referenzapp

Status: `[A]` automatisiert und im sichtbaren nativen M82-Managerlauf abgenommen.

BBM ist `existing-app` und bereits ueber den Electron-Vertrag 1.2 angebunden. Das Schema-2-Manifest `ui-editor-target.json` und `.ui-editor-kit/starter-installation.json` ergaenzen ausschliesslich Starterpaket- und Ownershipmetadaten.

Vorhanden und weiterhin fuehrend sind:

- `src/main/ui-editor/electronUiEditorSession.js`
- `src/renderer/ui-editor/m80Registry.js`
- `src/renderer/ui-editor/m80Refs.js`
- `src/renderer/ui-editor/m80HostAdapter.js`
- die enge Preload-/Renderer-Bridge
- Registry-Refresh vor Oeffnen/Fokussieren
- der bestehende UI-/PDF-Profil- und M81.1-Recoveryweg

Vollstaendig sind die drei Restarbeiten-Scopes. Andere nicht inventarisierte BBM-Bereiche bleiben `blocked`; BBM wird nicht als insgesamt vollstaendig registriert behauptet. Der Protokoll-PDF-Pilot ist mit 28 Elementen `available`.

Der Manager erkennt diese gleichwertige Bestandsintegration und installiert keine zweite Bridge, Registry, Runtime oder Profilablage. Die optionale Startanweisung `--open-ui-editor` ruft ausschliesslich die vorhandene Aktion `openNativeUiEditor` nach dem normalen Rendererstart auf.

Fachlogik, Fachwerte, Registryinhalte, PDF-/Druckfachweg und `docs/licensing.md` bleiben unveraendert.
