# M82.3 - BBM-Spacer und Editorbedienung

Status: `[A] abgenommen`

## Rolle von BBM

BBM ist Referenz- und Abnahme-App fuer den appuebergreifenden M82.3-Vertrag. Die neutralen Spacingziele, Entscheidungen bei frei werdendem Platz, Risikoauswertung und responsive Editoroberflaeche liegen im UI-Editor-kit. BBM enthaelt keine zweite Editor-, Registry-, Pipe- oder Profilimplementierung.

## Kurztext/Gegenstand

Die explizite Registryversion 5 erlaubt fuer die Bezeichnung Kurztext/Gegenstand eine eigene Breite sowie `beforeElement`, `afterElement` und `reservedWidth`. Die Gruppe Kurztext/Gegenstand erlaubt davon getrennt Breite, Hoehe, Innenabstaende und Kindabstaende.

Der Electron-HostAdapter bildet `reservedWidth` auf den vorhandenen Grid-Slot ab. Bei **Freien Platz stehen lassen** wird der Slot um die frei werdende Breite erweitert; Restzeichenanzeige, Diktatbutton, Mikrofonsymbol, Kurztextaktionen und Gruppe bleiben stabil. **Nachbarelemente nachruecken lassen** verkleinert den Slot bewusst. **Gruppe entsprechend verkleinern** verwendet eine getrennte Gruppenoperation.

Gruppenpadding und Gap werden auf die vorhandenen CSS-Eigenschaften abgebildet. Bei einem Content-Box-Ziel wird der horizontale Innenabstand von der Inhaltsbreite abgezogen, damit die bestaetigte aeussere Gruppenbreite stabil bleibt. Responsive Gruppenbreite und -hoehe werden einmalig vor dem Start-Restore erfasst; Reset stellt diesen echten Laufzeit-Ausgangszustand wieder her.

## Speichern, Restore und Reset

Spacing wird als neutraler Layoutzustand im vorhandenen UI-Profil gespeichert. Der normale Startdienst stellt Breite und abgeleiteten reservierten Platz gemeinsam wieder her. Editoroeffnung wendet denselben Zustand nicht doppelt an. Elementreset, Gruppenreset, Gesamtreset, Discard und Recovery verwenden den vorhandenen transaktionalen Profilweg.

## Kompakte Oberflaeche und PDF

Der vorhandene native Manager zeigt den gemeinsamen UI-Arbeitsbereich bei grosser, normaler und kleiner Inhaltsbreite in drei, zwei beziehungsweise einer Spalte. Speichern, Verwerfen, Reset, naechste Auswahl, Direktauswahl, Dirty-Status und Modus bleiben in der festen Aktionsleiste erreichbar. Der Elementbaum scrollt intern. Der PDF-Tab verwendet denselben responsiven Rahmen, aber seine getrennten PDF-Kontrollen.

## Praktischer Nachweis

Im gepackten Development-Build wurden Kurztext/Gegenstand, Textumbruch, reservierter Platz, bewusstes Nachruecken, Gruppenbreite, Padding/Gap, Save/Restart, Element-/Gruppen-/Gesamtreset, Discard, Direktauswahl mit Escape und 1/2/3-Spaltenmodus sichtbar geprueft. Die reale Projekt-PDF wurde ueber den unveraenderten BBM-`printToPDF`-Weg als zweitseitige A4-PDF erzeugt. Der native PDF-Arbeitsbereich zeigte 28 Registryelemente und die aktuelle Vorschau; reines Laden liess den bestehenden PDF-Profilhash unveraendert.

Fachwerte, Datenbank, Kundendaten, Druckfachlogik, `docs/licensing.md` und die Benutzerlizenz wurden nicht veraendert.
