# UI-Editor Surface-Auswahl-Kontext Entscheidung

## Kurzfazit

Die aktuelle Surface-Auswahl ist fachlich als read-only Sichtbarkeits- und
Kontextanzeige einzuordnen. Sie zeigt den freigegebenen read-only Stand, aber
keine aktive Surface. `SurfaceInfo` bleibt bewusst `restarbeiten.ui.main`.

## Ausgangsstand nach G86

```text
Host-/Bestandssurface:
- restarbeiten.ui.main

read-only sichtbar:
- pdf.plan.page.1
- plan.canvas.default

SurfaceInfo:
- restarbeiten.ui.main

keine echte Surface-Umschaltung
```

Die Auswahl ist sichtbar, aber noch nicht als aktive Umschaltung freigegeben.

## Aktuelles Verhalten

- Surface-Auswahl zeigt den read-only freigegebenen Sichtstand
- SurfaceInfo bleibt `restarbeiten.ui.main`
- keine aktive Surface-Umschaltung
- keine aktive Surface wird gewechselt
- keine Bearbeitung
- keine Persistenz
- keine DOM-/HTML-/Browser-Abhängigkeit

## Fachliche Bedeutung der Surface-Auswahl

Die Surface-Auswahl bezeichnet in dieser Phase nicht die aktive Surface,
sondern die aktuell fachlich sichtbare und freigegebene Kontextfläche. Sie ist
damit eine Anzeige von freigegebenen, read-only sichtbaren Surfaces und kein
Bedien- oder Bearbeitungsmodus.

## Mögliche Bedeutungsvarianten

### A) Surface-Auswahl als reine Sichtbarkeits-/Kontextanzeige

- Auswahl bedeutet: zusaetzliche read-only Flaechen sind sichtbar
- Keine aktive Surface wird gewechselt
- SurfaceInfo bleibt Hoststand
- geringstes Risiko

### B) Surface-Auswahl als Anzeige-Kontext

- Auswahl kann spaeter beeinflussen, welche Zusatzinformationen hervorgehoben werden
- Keine Bearbeitung
- Keine Persistenz
- Noch keine aktive Surface

### C) Surface-Auswahl als aktive Surface

- Auswahl wuerde die aktive Surface tatsaechlich wechseln
- Eigene spaetere Freigabe erforderlich
- Risiko: naehrt sich echter Umschaltung, Bearbeitung und Persistenz

### D) Surface-Auswahl als Bearbeitungskontext

- In dieser Projektphase ausdruecklich nicht freigegeben

## Empfehlung

```text
Empfehlung:
Die aktuelle Surface-Auswahl bleibt vorerst eine read-only Sichtbarkeits-/Kontextanzeige.
Sie ist keine aktive Surface-Umschaltung.
SurfaceInfo bleibt weiterhin `restarbeiten.ui.main`.
Eine echte aktive Surface darf erst in einem eigenen spaeteren Paket vorbereitet werden.
```

## Harte Grenzen

- keine echte Umschaltung
- keine Bearbeitung
- kein Drag
- kein Resize
- keine Persistenz
- keine DB-/IPC-Schreibwege
- keine Wildcard
- kein Default-true
- UI-Editor-kit speichert nicht

## Stop-/Go-Kriterien

### Go

- Surface-Auswahl bleibt als read-only Sichtbarkeits-/Kontextanzeige entschieden
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`
- aktive Surface bleibt getrennt vom Anzeige-Kontext
- spaetere Umschaltung ist in einem eigenen Paket vorbereitet

### Stop

- Surface-Auswahl wird stillschweigend zur aktiven Surface
- SurfaceInfo wird ohne Entscheidung umgebaut
- Drag, Resize oder Persistenz ziehen mit
- unbekannte SurfaceIds, Wildcard oder Default-true werden akzeptiert
- sichtbare UI wird ohne eigene Sichtpruefung umgebaut

## Empfohlener naechster Schritt

Die Surface-Auswahl bleibt vorerst read-only sichtbar und fachlich als
Kontextanzeige festgelegt. Eine spaetere aktive Surface darf nur in einem
eigenen Paket mit separater Freigabe vorbereitet werden.

## Nachtrag G88

- Der Abschnitt ist jetzt als stabiler Referenzstand in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_REFERENZSTAND.md`
  abgesichert.
- Die Surface-Auswahl bleibt weiterhin keine aktive Surface.

## Nachtrag G89

- Die technische Guardrail-Absicherung ist jetzt zusaetzlich in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KEINE_AKTIVE_UMSCHALTUNG_GUARDRAILS.md`
  dokumentiert.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface, waehrend
  `pdf.plan.page.1` und `plan.canvas.default` read-only sichtbar bleiben.
- SurfaceInfo bleibt bewusst `restarbeiten.ui.main`; aktive Umschaltung,
  Drag, Resize, Persistenz und Schreibwege bleiben blockiert.
