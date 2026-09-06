# Modul `Protokoll`

Diese Struktur ist die technische Heimat fuer das Fachmodul `Protokoll`.

Der produktive Einstieg ist eindeutig:

- `app/modules/moduleCatalog.js` registriert ausschliesslich `modules/protokoll/index.js`.
- `app/Router.js` bezieht den Arbeitsscreen ausschliesslich aus diesem Moduleinstieg.
- `index.js` registriert `screens/TopsScreenIntegrationView.js` als Arbeitsscreen.
- `screens/TopsScreenIntegrationView.js` ergaenzt den modulnahen `screens/TopsScreen.js`
  nur um die Shell-Integration.
- `views/TopsScreen.js` ist ausschliesslich ein Kompatibilitaets-Re-Export fuer Altimporte und
  kein produktiver Router- oder Modulkatalog-Einstieg.
- `renderer/tops/` ist der noch nicht vollstaendig umgezogene, modulinterne Unterbau. Der Ordner
  ist kein konkurrierender produktiver Moduleinstieg und wird nur nach gesondertem
  Import-/Runtime-/Testnachweis bereinigt.

Der aktuelle Modulbestand umfasst ausserdem:

- `index.js` mit Modulkennung, Routen, Navigation und Arbeitsscreen
- `screens/` mit dem produktiven Protokoll-Screen und seiner Shell-Integration
- `viewmodel/` mit den ersten real umgezogenen Protokoll-ViewModels
- `SharedEditboxCore.js` als modulinterner Kern fuer den generischen Editbox-Aufbau und die Value-/Read-only-Synchronisation
- `WorkbenchMetaColumn.js` als modulinterner Kern fuer die Workbench-Meta-Spalte
- `WorkbenchShellFrame.js` als modulinterner Kern fuer die technische Workbench-Huelle
- `WorkbenchActionDraftState.js` als modulinterner Kern fuer Draft-Zusammenfuehrung und Action-State

Die Ordner `components/`, `domain/`, `data/`, `state/`, `viewmodel/`, `dialogs/` und `rules/`
sind absichtlich schon angelegt, damit spaetere Umzuege dort sauber anschliessen koennen.

Wichtig:

- Kein kosmetischer Vollumzug des bestehenden Tops-Unterbaus
- Keine zweite Router- oder Modulregistrierung neben `modules/protokoll/index.js`
- Gemeinsame Kernbausteine bleiben ausserhalb dieses Moduls
