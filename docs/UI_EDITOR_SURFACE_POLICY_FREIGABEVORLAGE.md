# UI-Editor Surface-Policy-Freigabevorlage

## Kurzfazit

Diese Vorlage beschreibt, wie eine einzelne Surface spaeter kontrolliert
freigegeben werden kann, ohne versehentlich Drag, Resize, Persistenz,
Bearbeitung oder Wildcards zu aktivieren. G73 selbst spricht keine Freigabe
aus. Sichtbar bleibt weiterhin nur `restarbeiten.ui.main`.

## Zweck der Freigabevorlage

- eine spaetere Surface-Freigabe fachlich und technisch klein halten
- Freigaben immer an eine explizite SurfaceId binden
- Drag, Resize, Persistenz und Wildcards getrennt halten
- sichtbare Änderungen nur nach eigener Pruefung und Sichtpruefung erlauben

## Aktueller gesicherter read-only Stand

- `restarbeiten.ui.main` ist sichtbar und bleibt im Hoststand praesent
- `pdf.plan.page.1` ist read-only sichtbar
- `plan.canvas.default` ist blockiert
- unbekannte SurfaceIds bleiben blockiert
- `*` bleibt blockiert
- leere IDs bleiben blockiert
- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- UI-Editor-kit speichert nicht

## Freigabearten

### A) Sichtbarkeit read-only

```text
readable: true
visibleInEditor: true
canHide: false oder kontrolliert true
canDrag: false
canResize: false
canPersist: false
```

### B) Auswahl read-only

```text
Surface darf im Auswahlmodell erscheinen,
aber keine echte Bearbeitung, kein Drag, kein Resize, keine Persistenz.
```

### C) Bearbeitungsfreigabe

```text
In dieser Projektphase ausdruecklich nicht freigegeben.
```

### D) Drag-/Resize-Freigabe

```text
In dieser Projektphase ausdruecklich nicht freigegeben.
```

### E) Persistenzfreigabe

```text
In dieser Projektphase ausdruecklich nicht freigegeben.
```

## Pflichtpruefungen vor jeder Surface-Freigabe

Eine Surface darf nur freigegeben werden, wenn:

- die SurfaceId explizit genannt ist
- die SurfaceId im Catalog bekannt ist
- die SurfacePolicy explizit angepasst wird
- keine Wildcard verwendet wird
- kein Default-true entsteht
- Tests Freigabe und Blockierung anderer Surfaces absichern
- Electron-Sichtpruefung geplant ist, sobald sichtbare UI betroffen ist
- Drag, Resize und Persistenz weiterhin separat geprueft bleiben
- DB-/IPC-Schreibwege weiterhin nicht entstehen

## Erlaubte Minimalfreigabe

- genau eine SurfaceId
- read-only sichtbar
- keine Bearbeitungsbuttons
- keine automatische Auswahl weiterer Surfaces
- keine Default-Freigabe
- keine Wildcard
- keine Persistenz
- kein Drag
- kein Resize

## Ausdruecklich verbotene Kopplungen

Eine Sichtbarkeitsfreigabe darf nicht automatisch aktivieren:

- echte Umschaltung
- Drag
- Resize
- Persistenz
- Bearbeitungsbuttons
- PDF-/Plan-Bearbeitung
- DB-/IPC-Schreibwege
- localStorage
- writeFile
- Default-Adapter
- Wildcards

## Stop-/Go-Kriterien

### Go

- genau eine SurfaceId wird freigegeben
- Freigabe bleibt read-only
- Policy ist explizit
- alle anderen SurfaceIds bleiben blockiert
- Tests sind gruen
- `git diff --check` ist gruen
- bei sichtbarer Aenderung ist die Electron-Sichtprüfung bestanden

### Stop

- mehrere SurfaceIds werden ungeplant sichtbar
- PDF/Plan tauchen automatisch in der Auswahl auf
- Drag, Resize oder Persistenz werden implizit aktiv
- eine Wildcard entsteht
- ein Default-true entsteht
- Schreibwege entstehen
- die sichtbare UI wird ohne Sichtpruefung geaendert

## Empfohlener Ablauf fuer spaetere Freigabepakete

1. SurfaceId explizit benennen und im Catalog bestaetigen.
2. SurfacePolicy nur fuer genau diese SurfaceId anpassen.
3. Tests fuer Freigabe und Blockierung anderer Surfaces nachziehen.
4. Erst bei sichtbarer UI die Electron-Sichtpruefung planen und bestehen.
5. Drag, Resize und Persistenz immer als eigene, getrennte Pakete behandeln.

## Kandidatenbezug

- `docs/UI_EDITOR_SURFACE_FREIGABE_KANDIDAT_PDF_PLAN_PAGE_1.md` beschreibt
  den ersten konkreten Kandidaten `pdf.plan.page.1`.
- Diese Vorlage gibt selbst nichts frei und bleibt die allgemeine Form fuer
  spaetere Einzelfreigaben.

## Status nach G75

Die Vorlage wurde exemplarisch auf `pdf.plan.page.1` angewendet. Die Surface
ist nun read-only sichtbar freigegeben; `plan.canvas.default` bleibt
blockiert. Drag, Resize, Persistenz und Wildcards bleiben weiterhin getrennt
gesperrt.

## Status nach G76

Die sichtbare Referenz ist zusaetzlich ueber
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md` abgesichert.

- Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`
- SurfaceInfo bleibt `restarbeiten.ui.main`
- `plan.canvas.default` bleibt blockiert
