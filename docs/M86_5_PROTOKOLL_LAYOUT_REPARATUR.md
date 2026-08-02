# M86.5 – Protokoll-Layout-Reparatur

Status: `[P]` – technische Reparatur und automatisierte Tests grün; die sichtbare Kleinformat-Abnahme bei 900×430 ist noch offen.

Finaler Status: `[A]` – die erneute sichtbare Electron-Prüfung bei 900×430 zeigt Header, scrollbare Liste, Workbench, Meta-Felder und Quicklane ohne horizontales Ausweichen. Der obige `[P]`-Eintrag beschreibt den zwischenzeitlichen Befund vor der Verdichtung.

## Befund und Ursache

Der isolierte Acceptance-Start mit vorhandenen Protokolldaten zeigte den
Protokollscreen ohne gespeichertes Profil. Der Screen besaß bereits eine
scrollbare `sheet`-Fläche, aber keine robuste Flex-Basis für den Listenanteil.
Gleichzeitig konnten gespeicherte Editbox-Höhen zwischen 160 und 720 px liegen,
obwohl der Workbench-Grundinhalt selbst mindestens 178 px benötigt. Der
Header-Grid verlangte außerdem zwei starre Mindestspalten; bei engem Platz
drückte dies die Aktionsgruppen auseinander.

Es gab keinen Overlay-, Backdrop-, `pointer-events`- oder `inert`-Fehler und
keine Ursache in gespeicherten Werten des frischen isolierten Profils.

## Reparaturregel

- Der Screen und die Liste verwenden eine klare flexible Basis; nur `sheet`
  bleibt der vertikale Scrollbesitzer.
- Die sichtbare Editbox ist im Renderer normalerweise auf mindestens 190 px
  geschützt und auf höchstens 300 px begrenzt. In der bestehenden niedrigen
  Quicklane-Höhenstufe wird derselbe Inhalt kompakt bei mindestens 160 px
  dargestellt. Die bestehende Registry und ihre gespeicherten Werte bleiben
  unverändert; der CSS-Schutz begrenzt deren sichtbare Wirkung.
- Die Workbench behält mindestens 178 px Inhaltshöhe.
- Der Workbench-Header verwendet eine flexible erste Spalte statt starrer
  180/220-px-Mindestspalten. Die vorhandene Meta-Spalte bleibt rechts neben
  dem Textbereich.

## Abgrenzung

Es wurden keine IDs, Parent-Beziehungen, Registryelemente, Fachaktionen,
PDF-/Druckwege oder Restarbeiten-Dateien geändert.

## Prüfschutz

`scripts/tests/m86-5ProtokollLayoutRepair.test.cjs` prüft die Flex-/Scroll-
und Höhenregeln, die Workbench-Aktionsleiste sowie die sicheren bestehenden
Editbox-Bounds. Der Restarbeiten-Quellpfad wird als unverändert abgegrenzt.

## Sichtprüfung

Die isolierte Electron-Prüfung umfasst 1920×1080, 1600×900, 1366×768 und
900×430. Bei 900×430 werden nur vorhandene Header-, Workbench- und
Meta-Abstände verdichtet; Kurztext, Langtext, Restzeichen, Status,
Verantwortlich, Fertig-bis und Quicklane bleiben sichtbar, ohne eine zweite
vertikale oder horizontale Scrollfläche einzuführen.
