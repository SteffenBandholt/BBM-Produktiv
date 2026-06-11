# UI-Editor-kit Lokaler Bezugsweg

## Standard-Repo-Struktur

Alle Entwicklungs-Repos liegen dauerhaft unter:

```text
C:\01_Projekte
```

Standardpfade:

```text
C:\01_Projekte\UI-Editor-kit
C:\01_Projekte\BBM-Produktiv
C:\01_Projekte\<anderes-repo>
```

Das UI-Editor-kit bleibt ein eigenes Repo. BBM und spaetere andere Projekte sind Konsumenten.

## Weitere Konsumenten-Repos

Weitere Konsumenten-Repos liegen ebenfalls unter:

```text
C:\01_Projekte\<repo-name>
```

Sie koennen das UI-Editor-kit nach demselben Muster installieren.

## Standardinstallation

In jedem Konsumenten-Repo wird das Kit lokal installiert mit:

```powershell
npm install ..\UI-Editor-kit --save
```

Der erwartete Eintrag in `package.json` lautet:

```json
"ui-editor-kit": "file:../UI-Editor-kit"
```

## Warum dieser Weg

Dieser lokale Bezugsweg ist bewusst:

- lokal
- einfach
- reproduzierbar
- ohne npm-Publish
- ohne private Registry
- ohne Monorepo-Umbau

Andere Repos unter `C:\01_Projekte\<repo-name>` koennen das UI-Editor-kit ebenfalls nach demselben Muster installieren.

## Pruefung in BBM

BBM prueft den lokalen Kit-Bezug mit:

```powershell
npm run check:ui-editor-kit
```

Die Pruefung erwartet:

- BBM liegt idealerweise unter `C:\01_Projekte`
- `..\UI-Editor-kit` existiert
- `..\UI-Editor-kit\package.json` existiert
- `..\UI-Editor-kit\src\runtime\preview\index.mjs` existiert
- `..\UI-Editor-kit\src\runtime\preview\index.cjs` existiert
- `package.json` enthaelt `"ui-editor-kit": "file:../UI-Editor-kit"`
- `node_modules\ui-editor-kit\package.json` existiert
- `node_modules\ui-editor-kit\src\runtime\preview\index.mjs` existiert
- `node_modules\ui-editor-kit\src\runtime\preview\index.cjs` existiert

Wenn die Pruefung fehlschlaegt, zuerst sicherstellen, dass beide Repos unter `C:\01_Projekte` liegen, und danach im Konsumenten-Repo erneut ausfuehren:

```powershell
npm install ..\UI-Editor-kit --save
```
