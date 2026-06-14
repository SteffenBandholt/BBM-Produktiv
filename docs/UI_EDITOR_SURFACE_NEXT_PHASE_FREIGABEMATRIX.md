# UI-Editor Surface naechste Phase Freigabematrix

## Kurzfazit

Der read-only Surface-Stand ist stabil abgesichert. Sichtbar bleibt nur
`restarbeiten.ui.main`, die Surface-Auswahl zeigt `Restarbeiten`, und die
SurfaceInfo bleibt auf `restarbeiten.ui.main` / `ui-screen` / Elementanzahl
begrenzt. Diese Matrix dient nur der Entscheidungs- und Freigabevorbereitung
fuer die naechste Surface-Phase.

## Aktueller gesicherter read-only Stand

- nur `restarbeiten.ui.main` ist sichtbar und resolved
- `pdf.plan.page.1` bleibt blockiert
- `plan.canvas.default` bleibt blockiert
- unbekannte SurfaceIds bleiben blockiert
- `*` bleibt blockiert
- leere IDs bleiben blockiert
- keine echte Surface-Umschaltung
- kein Drag
- kein Resize
- keine Persistenz
- UI-Editor-kit speichert nicht
- BBM bleibt Host fuer Rechte, Scopes, Persistenz, DB/IPC und Fachlogik

## Moegliche naechste Phasen

### A) Sichtbare Surface-Umschaltung vorbereiten

- weiterhin nur read-only
- keine PDF-/Plan-Bearbeitung
- nur kontrollierte Auswahl zwischen freigegebenen SurfaceIds
- Voraussetzung: weitere SurfaceId muss sichtbar freigegeben werden

### B) PDF-/Plan read-only erweitern

- PDF/Plan weiterhin nur lesend
- keine Bearbeitung
- keine Persistenz
- Ziel: sichere Sichtbarkeit vor Interaktion

### C) Drag-/Resize-Konzept vorbereiten

- noch keine Aktivierung
- Rechte-/Policy-Kette erweitern
- keine Persistenz

### D) Persistenzkonzept vorbereiten

- noch keine Speicherung aktivieren
- nur Architektur, Risiken, Tabellen-/IPC-Entwurf
- klare Scope-Allowlist

### E) Repo-Hygiene separat klaeren

- fehlende Grundlagen-/Regeldateien pruefen
- aber nicht in diesem Paket anlegen

## Freigabematrix

| Phase | Ziel | Sichtbare Aenderung | Produktivlogik | Risiko | Voraussetzung | Empfehlung | Status |
|---|---|---|---|---|---|---|---|
| A | kontrollierte Surface-Umschaltung nur fuer freigegebene SurfaceIds vorbereiten | ja, aber weiterhin read-only und begrenzt | nein | mittel | weitere SurfaceId sichtbar freigeben | ja, wenn zusaetzliche SurfaceId fachlich bestaetigt ist | vorbereitet, nicht freigegeben |
| B | PDF-/Plan read-only sichtbar erweitern | ja, read-only | nein | mittel | fachliche Sichtbarkeit und klare Policy | ja, falls Sichtbarkeit vor Interaktion benoetigt wird | offen |
| C | Drag-/Resize-Konzept vorbereiten | nein | nein | hoch | klare Rechte-/Policy-Kette | nur nach weiterer Freigabe | offen |
| D | Persistenzkonzept vorbereiten | nein | nein | hoch | Architektur, Risiken, Scope-Allowlist | spaeter und getrennt | offen |
| E | Repo-Hygiene separat klaeren | nein | nein | niedrig | fehlende Grundlagen/Regeldateien erkennen | nur als Nebenpruefung, nicht hier anlegen | offen |

## Fachliche Freigabefragen

- Welche zusaetzliche SurfaceId darf als naechstes sichtbar freigegeben werden?
- Soll die naechste Phase zuerst Surface-Umschaltung oder zuerst PDF-/Plan-Sichtbarkeit adressieren?
- Darf read-only nur eine zweite UI-Surface gezeigt werden, bevor PDF/Plan dazukommt?
- Ist eine zweite Surface als klarer Pilot besser als ein fruehes Drag-/Resize-Thema?
- Welche Scope-Allowlist gilt fuer spaetere Persistenzthemen?

## Technische Risiken

- eine zu fruehe Umschaltung kann die aktuelle sichtbare Grenze aufweichen
- PDF/Plan ohne klare Policy koennen Sichtbarkeit und Bedienbarkeit vermischen
- Drag/Resize ohne getrennte Rechte- und Persistenzgrenzen fuehren schnell zu Kopplung
- Persistenz ohne eigene Allowlist oder Scope-Grenze wuerde Host-Verantwortung verwischen
- Repo-Hygiene darf nicht als Vorwand fuer Produktivumbau missbraucht werden

## Empfohlene Reihenfolge

1. Zunaechst fachlich entscheiden, ob eine zweite UI-Surface read-only sichtbar werden darf.
2. Danach PDF-/Plan-Sichtbarkeit read-only bewerten, falls fachlich noetig.
3. Drag und Resize erst nach klarer Policy- und Rechte-Freigabe vorbereiten.
4. Persistenz erst als separates Architekturpaket planen.
5. Repo-Hygiene nur als Nebenpruefung mitlaufen lassen.

## Stop-/Go-Kriterien

### Go

- read-only Grenze bleibt klar
- keine echte Surface-Umschaltung
- keine Persistenz
- kein Drag
- kein Resize
- keine neue Launcher-Produktivintegration
- fachliche Freigabe ist eindeutig und klein geschnitten

### Stop

- eine Phase wuerde Produktivlogik voraussetzen
- eine Phase wuerde sichtbare UI ohne Freigabe erweitern
- Drag oder Persistenz wuerden vor der Policy-Kette gezogen
- mehr als eine neue technische Baustelle wuerde gleichzeitig aufgehen
- fehlende Grundlagen-/Regeldateien muessten fuer dieses Paket neu angelegt werden

## Empfohlener naechster Schritt

G72 - PDF/Plan-Surface weiterhin read-only fachlich bewerten oder alternativ eine zweite UI-Surface read-only sichtbar vorbereiten.

G72 selbst verengt diesen Weg fachlich auf eine Bewertung der PDF-/Plan-Surfaces
in `docs/UI_EDITOR_PDF_PLAN_SURFACE_READONLY_BEWERTUNG.md`, ohne Sichtbarkeit
oder Auswahl freizugeben.

G73 bereitet danach eine Surface-Policy-Freigabevorlage vor, die spaetere
Einzelfreigaben strikt read-only, explizit und ohne Wildcards oder Default-true
vorzeichnen soll.

G74 konkretisiert darauf aufbauend `pdf.plan.page.1` als einzelnen
Freigabe-Kandidaten, ohne die Policy selbst zu aendern.
