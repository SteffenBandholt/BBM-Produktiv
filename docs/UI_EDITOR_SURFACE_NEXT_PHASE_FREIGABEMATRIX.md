# UI-Editor Surface naechste Phase Freigabematrix

## Kurzfazit

Der read-only Surface-Stand ist stabil abgesichert. Sichtbar bleiben
`restarbeiten.ui.main`, `pdf.plan.page.1` und `plan.canvas.default`, die
Surface-Auswahl zeigt `Restarbeiten`, `PDF Plan Seite 1` und `Plan Canvas`,
und die SurfaceInfo bleibt auf `restarbeiten.ui.main` / `ui-screen` /
Elementanzahl begrenzt. Diese Matrix dient nur der Entscheidungs- und
Freigabevorbereitung fuer die naechste Surface-Phase.

## Aktueller gesicherter read-only Stand

- `restarbeiten.ui.main` bleibt sichtbar und als Hoststand praesent
- `pdf.plan.page.1` ist read-only sichtbar
- `plan.canvas.default` ist read-only sichtbar
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
- Soll die SurfaceInfo kuenftig weiter den Hoststand zeigen oder spaeter auf
  die zusaetzlich sichtbare read-only Surface reagieren?

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

Nach G76 ist der Sichtstand von `pdf.plan.page.1` dokumentiert und abgesichert.
Mit G83 ist `plan.canvas.default` ebenfalls read-only sichtbar; der naechste
Schritt kann deshalb nur weitere klar abgegrenzte read-only Erweiterungen
vorbereiten, ohne Drag oder Persistenz zu aktivieren.

## Status nach G75

`pdf.plan.page.1` ist nun per Policy read-only sichtbar freigegeben.
`plan.canvas.default` ist ebenfalls read-only sichtbar. Die naechste Phase
kann sich daher auf weitere kontrollierte read-only Erweiterungen
konzentrieren, statt sofort Drag oder Persistenz zu ziehen.

## Status nach G76

Die sichtbare Referenz ist zusaetzlich abgesichert:

- Surface-Auswahl zeigt `Restarbeiten - PDF Plan Seite 1`
- SurfaceInfo bleibt `restarbeiten.ui.main`
- `plan.canvas.default` ist read-only sichtbar

## Status nach G77

Die Entscheidung ueber ein spaeter anderes SurfaceInfo-Verhalten bleibt offen
und ist in `docs/UI_EDITOR_SURFACE_INFO_VERHALTEN_ENTSCHEIDUNG.md`
dokumentiert. Empfohlen bleibt vorerst Variante A: aktuelles Verhalten
beibehalten.

## Status nach G78

Ein kleiner sichtbarer read-only Hinweis fuer `pdf.plan.page.1` ist jetzt im
bestehenden UI-Editor-Panel ergaenzt. Damit ist die sichtbare PDF-Freigabe
klarer benannt, ohne die SurfaceInfo umzubauen. SurfaceInfo bleibt
`restarbeiten.ui.main`; echte Umschaltung, Drag, Resize und Persistenz bleiben
weiterhin getrennte Folgepakete.

## Status nach G81

Die read-only Abnahmereferenz fuer `pdf.plan.page.1` ist jetzt in
`docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_ABNAHME_REFERENZSTAND.md`
gebuendelt. Diese Matrix bleibt davon unberuehrt: sie dient weiter nur der
Freigabevorbereitung fuer spaetere Schritte, waehrend `plan.canvas.default`
und echte Umschaltung read-only getrennt bleiben.

## Status nach G82

`plan.canvas.default` ist jetzt read-only sichtbar freigegeben. Die Matrix
haelt weiter an der Trennung fest: `pdf.plan.page.1` bleibt read-only
sichtbar, `restarbeiten.ui.main` bleibt Host-/Bestandssurface und weitere
echte Freigaben brauchen eigene Pakete.

## Status nach G84

- Der Zwei-Surface-read-only-Stand ist jetzt in
  `docs/UI_EDITOR_PLAN_CANVAS_DEFAULT_READONLY_SICHTPRUEFUNG.md`
  abgesichert.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.

## Status nach G85

- Die aktuelle read-only Surface-Phase ist jetzt als abgeschlossen
  dokumentiert.
- Weitere Surface-Freigaben oder echte Interaktion bleiben getrennte
  Folgepakete.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.

## Status nach G86

- Die naechste Diskussion zur echten Surface-Umschaltung wird in
  `docs/UI_EDITOR_SURFACE_SWITCHING_KONZEPT_OHNE_UMSETZUNG.md`
  vorbereitet.
- Es gibt weiterhin keine Umsetzung und keine neue Freigabe.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.

## Status nach G87

- Die Surface-Auswahl bleibt eine read-only Sichtbarkeits-/Kontextanzeige.
- Die fachliche Entscheidung steht in
  `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_ENTSCHEIDUNG.md`.
- Eine aktive Surface bleibt ein spaeteres eigenes Paket.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.

## Status nach G88

- Der Surface-Auswahl-Kontext ist jetzt als Referenzstand abgesichert.
- `docs/UI_EDITOR_SURFACE_AUSWAHL_KONTEXT_REFERENZSTAND.md`
  dokumentiert den stabilen Referenzstand.
- Eine aktive Surface bleibt ein spaeteres eigenes Paket.
- `restarbeiten.ui.main` bleibt Host-/Bestandssurface.
- `pdf.plan.page.1` und `plan.canvas.default` bleiben read-only sichtbar.
