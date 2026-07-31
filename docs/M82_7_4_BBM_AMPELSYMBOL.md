# M82.7.4.1 – BBM-Ampelsymbol generisch verschiebbar

Status: `[A]`

## Ziel und Ref

`restarbeiten.edit.meta.ampel` verweist nun direkt auf das bereits vorhandene sichtbare Element `span.bbm-restarbeiten-ampel`. Der äußere `span.bbm-restarbeiten-ampel-field` bleibt unverändert Teil des vorhandenen Grid-/Flex-Layouts und ist nicht mehr der Größen- oder Sichtbarkeits-Ref.

Die deklarative Baseline beträgt `X=0`, `Y=0` und 12 × 12 DIP. Zulässig sind 7 bis 48 DIP für Breite und Höhe. Freigegeben sind `move`, `resizeWidth`, `resizeHeight` und `setVisibility`.

Der Ziel-App-Ref wird beim Rendern genau einmal auf das innere Symbol aufgelöst. Snapshot, Apply, Undo, Reset, Save, Restore und Registryrefresh verwenden denselben vorhandenen M80-Weg. Bewegung wird über die bestehenden `data-ui-editor-x`-/`data-ui-editor-y`-Attribute und `style.translate` angewandt. Der Zielmanifest-Fingerprint wurde auf die neue deklarative Baseline aktualisiert; die bestehende Registryversion 11 bleibt unverändert.

Der Startup-Restore wartet vor Geometrieoperationen generisch auf verbundene Ziel-Refs mit endlichen, positiven Bounds. Erst danach werden die Requests aus dem aktuellen Istzustand erzeugt. Dadurch wird ein gespeicherter Move nicht mehr gegen die kurzzeitig noch nicht messbare Startgeometrie geprüft. Es gibt weder eine Ampel-ID-Abzweigung noch eine Lockerung des gemeinsamen Geometry-Core.

## Geometrisch aktive Nachbarn

Der BBM-HostAdapter übergibt dem unverändert strengen gemeinsamen Geometry-Core nur aktuell messbare Kandidaten desselben vorhandenen Layoutkontexts. Er fordert einen vorhandenen verbundenen Ref, layoutwirksames Display sowie endliche, positive Vorher-/Nachher-Bounds.

Damit werden 0-Höhen- und 0×0-Platzhalter, detached Nodes, `display:none`, NaN und Infinity vor der Risikobewertung entfernt. Sobald ein relevanter Kandidat sichtbar und positiv groß ist, wird er wieder einbezogen. Eine echte Überlappung bleibt im geführten Risikoweg blockiert.

## Sichtbare Abnahme

`npm run start:ui-editor:acceptance` lief mit zwei vollständigen Starts gegen dasselbe isolierte Diagnostic-Profil. Sichtbar geprüft wurden:

- direkte Auswahl des Ampelsymbols
- sichtbare Verschiebegruppe
- Schrittweite 5: links `X 0 → -5`, rechts `X -5 → 0`, oben `Y 0 → -5`, unten `Y -5 → 0`
- direkte Eingabe `X=15`, `Y=-10`
- Undo stellt danach `X=15`, `Y=0` wieder her; Original stellt `X=0`, `Y=0` her
- Ausgangsgröße rund 12 × 12 DIP
- Breite +5 DIP und Höhe +5 DIP am sichtbaren Punkt ohne `invalid_geometry`
- Aus-/Einblenden bleibt wirksam
- Speichern bei `X=-5`, `Y=-5` und Restore nach vollständigem Neustart
- zweiter Start mit `startup_layout_applied, applied=true` und Rücklesung `X=-5`, `Y=-5`
- unveränderter äußerer Container, unveränderte Nachbarfelder und keine neue Scrollleiste

Das vorhandene Ampel-Layout erzeugt bei zulässigen Größenänderungen durch regulären Reflow keine reale Überlappung. Der Kollisionsschutz wurde deshalb ergänzend im echten BBM-HostAdapter-Pfad mit einem verbundenen, positiven und sichtbaren Nachbar-Ref geprüft; die Überlappung liefert weiterhin `geometry_risk_confirmation_required`.

Beide Abnahmestarts verwendeten ausschließlich das markierte Temp-Profil. Das Profil und alle visuellen Diagnoseartefakte wurden anschließend entfernt. Echte Benutzerdateien wurden nicht verwendet.

## Automatisierte Prüfung

- M82.7.4/M82.7.4.1 BBM: 34/34
- `npm test`: 8/8 Gruppen, kein OOM
- fokussiertes ESLint für Registry, HostAdapter und M82.7.4-Test: grün
- `git diff --check`: grün

Keine Ampel-Sonderlogik wurde in den gemeinsamen Core aufgenommen. Das UI-Editor-kit wurde nicht geändert. Fachlogik, Fachwerte, Topologie, Scrollstruktur, PDF-Funktion und der bekannte False-Dirty-Startzustand blieben unverändert.
