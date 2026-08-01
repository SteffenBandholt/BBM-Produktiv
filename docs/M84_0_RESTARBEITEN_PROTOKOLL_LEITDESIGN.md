# M84.0 – Restarbeiten am Protokoll-Leitdesign ausrichten

## Status

`[A]` – Technische Umsetzung und vollständige isolierte sichtbare Abnahme sind
durchgeführt.

## Leitdesign und Abgrenzung

Das Protokoll-Modul ist die gestalterische Referenz. Restarbeiten übernimmt
dessen ruhige, helle Arbeitsflächen, kühlen Konturen, zurückhaltenden blauen
Akzent, einheitlichen Feld- und Buttonhöhen, kleinen Radien und kompakten
Abstände. Die fachlich unterschiedliche Kartenliste, die drei sichtbaren
Hauptbereiche und die bestehende Editbox bleiben bewusst eigenständig.

Es wurden weder PDF-Ausgabe noch Protokoll-Layout, Fachwerte, Datenbank- oder
IPC-Wege, DOM-Topologie, Scrollbesitzer oder UI-Editor-Core geändert.

## Umsetzung in Restarbeiten

- Der Filterkopf ist eine zusammenhängende helle Fläche mit einheitlichen
  28-DIP-Feldern, Sekundärbuttons, Radien und responsiven Abständen.
- Listenkarten nutzen die bestehende dreiteilige Struktur, einen ruhigen
  Rahmen/Schatten sowie den vorhandenen klaren blauen Auswahlzustand.
- Die Editbox ist innen kompakter und hat eine Standardhöhe von 248 DIP
  (zuvor 276 DIP), mindestens 190 und höchstens 480 DIP.
- Der vorhandene BBM-Layoutvertrag hält die Unterkante der Editbox; bei einer
  Höhenänderung folgt nur ihre Oberkante. Der mittlere Listenbereich erhält den
  frei werdenden Raum, ohne einen neuen Scrollbereich oder Wrapper.
- Bestehende M83.0-Komponentenverträge, stabile IDs, Parentbeziehungen,
  Multi-Refs und einzeln auswählbare Kindziele bleiben unverändert.

## Fenstergrößen und Abnahme

Die isolierte Acceptance-Anwendung wurde bei 1920 × 1080, 1600 × 900 und
1366 × 768 geprüft. Der Filterbereich erzeugt keine neue horizontale
Scrollleiste; bei geringerer Höhe bleibt die bestehende vertikale
Inhaltsführung Eigentümer des Scrollens. Bei 1600 × 900 und 1920 × 1080 sind
Liste und unten verankerte Editbox gleichzeitig sichtbar.

Im vorhandenen Editor wurde der bestehende Editbox-Container ausgewählt, seine
Höhe über den generischen Weg geändert, gespeichert, der Editor geschlossen
und erneut gestartet. Der zweite Editorstart meldete den gespeicherten,
sauberen Zustand. Dabei wurde ausschließlich das temporäre isolierte
Acceptance-Profil verwendet.

## Protokoll-Gegencheck

Der isolierte Launcher unterstützt ausdrücklich nur `restarbeiten` und
`protokoll`; der Aufruf `npm run start:ui-editor:acceptance --
--module=protokoll` aktiviert den bestehenden Diagnostic-Modus mit einem
temporären Protokoll-Fixture. Release- und normale Starts erhalten keine
Startmodul-Auswahl.

Bei 1920 × 1080, 1600 × 900 und 1366 × 768 wurden Kopf, TOP-Liste,
Auswahl, Auf-/Zuklappen, untere Editbox, Buttons und Felder geprüft. Es gab
keine neue horizontale Scrollleiste, Überlagerung oder Topologieänderung. Der
anschließende Restarbeiten-Start bestätigte erneut Filter, Liste und die unten
verankerte flachere Editbox.
