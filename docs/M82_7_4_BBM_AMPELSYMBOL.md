# M82.7.4 – BBM-Ampelsymbol generisch editorfähig

Status: `[A]`

## Ziel und Ref

`restarbeiten.edit.meta.ampel` verweist nun direkt auf das bereits vorhandene sichtbare Element `span.bbm-restarbeiten-ampel`. Der äußere `span.bbm-restarbeiten-ampel-field` bleibt unverändert Teil des vorhandenen Grid-/Flex-Layouts und ist nicht mehr der Größen- oder Sichtbarkeits-Ref.

Die deklarative Baseline beträgt 12 × 12 DIP. Zulässig sind 7 bis 48 DIP für Breite und Höhe. Freigegeben bleiben ausschließlich `resizeWidth`, `resizeHeight` und `setVisibility`; `move` bleibt gesperrt.

Der Ziel-App-Ref wird beim Rendern genau einmal auf das innere Symbol aufgelöst. Snapshot, Apply, Undo, Reset, Save, Restore und Registryrefresh verwenden denselben vorhandenen M80-Weg. Der Zielmanifest-Fingerprint wurde auf die neue deklarative Baseline aktualisiert; die bestehende Registryversion 11 bleibt unverändert.

## Geometrisch aktive Nachbarn

Der BBM-HostAdapter übergibt dem unverändert strengen gemeinsamen Geometry-Core nur aktuell messbare Kandidaten desselben vorhandenen Layoutkontexts. Er fordert einen vorhandenen verbundenen Ref, layoutwirksames Display sowie endliche, positive Vorher-/Nachher-Bounds.

Damit werden 0-Höhen- und 0×0-Platzhalter, detached Nodes, `display:none`, NaN und Infinity vor der Risikobewertung entfernt. Sobald ein relevanter Kandidat sichtbar und positiv groß ist, wird er wieder einbezogen. Eine echte Überlappung bleibt im geführten Risikoweg blockiert.

## Sichtbare Abnahme

`npm run start:ui-editor:acceptance` lief mit zwei vollständigen Starts gegen dasselbe isolierte Diagnostic-Profil. Sichtbar geprüft wurden:

- direkte Auswahl des Ampelsymbols
- keine Verschiebegruppe
- Ausgangsgröße rund 12 × 12 DIP
- Breite +5 DIP und Höhe +5 DIP am sichtbaren Punkt ohne `invalid_geometry`
- Undo, Aus-/Einblenden und Original
- Speichern und Restore nach vollständigem Neustart auf rund 17 × 17 DIP
- unveränderter äußerer Container, unveränderte Nachbarfelder und keine neue Scrollleiste

Das vorhandene Ampel-Layout erzeugt bei zulässigen Größenänderungen durch regulären Reflow keine reale Überlappung. Der Kollisionsschutz wurde deshalb ergänzend im echten BBM-HostAdapter-Pfad mit einem verbundenen, positiven und sichtbaren Nachbar-Ref geprüft; die Überlappung liefert weiterhin `geometry_risk_confirmation_required`.

Beide Abnahmestarts verwendeten ausschließlich das markierte Temp-Profil. Das Profil und alle visuellen Diagnoseartefakte wurden anschließend entfernt. Echte Benutzerdateien wurden nicht verwendet.

## Automatisierte Prüfung

- M82.7.4 BBM: 28/28
- `npm test`: 8/8 Gruppen, kein OOM
- `npm run test:node`: 8/8 Gruppen; Node ABI 127, anschließend Electron ABI 123 wiederhergestellt
- UI-Editor-kit: 31/31 Capability-Tests, 106/106 Reference-App-Tests und vollständiges `npm test`

Keine Ampel-Sonderlogik wurde in den gemeinsamen Core aufgenommen. Fachlogik, Fachwerte, Topologie, Scrollstruktur, PDF-Funktion und der bekannte False-Dirty-Startzustand blieben unverändert.
