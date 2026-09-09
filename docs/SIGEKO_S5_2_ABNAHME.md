# SiGeKo S5.2 – Vorankündigungsformular

Basis main `57e5cb577adaf42c05e3a94ac4871cda0afe05a7`, PR #335. Vollständige Entwurfsentscheidung vor UI-Code: `SIGEKO_S5_2_UI_ENTWURF.md`.

## Ergebnis

Eigene Formularansicht in Reihenfolge der Vorlage, Punkte 1–9 und freier Unterschriftsbereich. Adresse, Bauherr, Rollen und Behörde stammen aus den bestehenden Quellen; Quelländerungen führen über die vorhandenen zuständigen Ansichten. Lokale Bauvorhaben-/Baubeginn-Overrides, ganze Monatsdauer, drei nullable Zählwerte und freier Dritter nutzen ausschließlich die bereits integrierten S5.1-Endpunkte. Punkt 9 verwendet vorhandene Projektfirmen als Anlagenwahl.

Speichern, Speichern und zurück, Zurück und Neu laden bilden einen klebenden, umbrechenden Aktionsbereich. Fehlstellen bleiben als bearbeitbarer Entwurf zulässig. Der tatsächliche modul-lokale Einstieg liest Bereitschaft frisch und bestätigt fehlende/ungeprüfte Angaben einmal bewusst; technische Fehler, falscher Projektbezug und verspätete Antworten öffnen keine irrtümlich freigegebene Ansicht. Die bisherige Projektkachel bleibt der Einstieg in SiGeKo.

98 neue Pflichtreferenzen, optionaler Headerlauncher, ein neuer Übersichtsknopf: insgesamt 100 additive Editorziele. Registry 35; Vorankündigung ist ein eigener aktiver Scope. Die vorhandene `layoutStorageKey`-Option trennt `module-sigeko-prenotification` von der unveränderten Übersicht `module-sigeko`, einschließlich Restore-Cache. Keine neue Engine, kein Kit-Umbau und keine Fachdaten im Layoutschlüssel.

## Prüfung und Reparaturen

Produktcommit `eababbd4ebe6ab20a197032d134c05ed04ea31dd`; getrennte gemeinsame Adapteranbindung `7ef1f9fff0a12e8676c2c6308cd6c15e5c565f07`. Geprüfter Gesamt-Tree `30f44964dbdbf45e66d94dbe9e5f04786f4f78e2`.

24 neue Formtests, 7 neue Moduladaptertests und zwei neue Profil-/Restoreprüfungen PASS. Formvertrag wird gegen sämtliche tatsächlich gemounteten Attribute und die vorab ausgegebenen 98 Entwurfszeilen verglichen. Der tatsächliche Hostdescriptor liefert genau den neuen Scope und dessen separaten Layoutschlüssel. Die Profiltests laden wirkliche JSON-Profildateien über den bestehenden Maincontroller und Kit, erhalten die Geschwisterdatei und prüfen Projekt-A/B-Unabhängigkeit sowie unveränderte bisherige Modulschlüssel.

Unabhängiger Review fand zwei konkrete Fehler: Navigation während initialer Ladung konnte den Ansichtswechsel überholen; native ungültige leere Zahlen-/Datumsteilwerte waren nicht zuverlässig dirty. Eigene Navigation/Neuladen sind jetzt während der Ladung gesperrt; `validity.badInput` zählt zum Entwurf. Beide Korrekturen sind gezielt abgedeckt. Keine offenen blockierenden Codebefunde nach Wiederprüfung.

Erster Volltest: 1819 PASS / 100 Fehler. Drei zusätzliche Fehler waren feste Inventare ohne den neuen Scope beziehungsweise ohne seine beiden Komponenten. Nur diese Erwartungen wurden ergänzt. Wiederholter Volltest: **1822 PASS / exakt dieselben 97 Baselinefehler**, 33 zusätzliche erfolgreiche Prüfungen, keine verlorenen grünen Tests. Einzige beabsichtigte Namensabbildung: bestehender Slotzähltest 206 → 207. Exakter Vergleich: `SIGEKO_S5_2_TESTVERGLEICH.json`.

## Electron-Abnahme und Grenzen

Windows-/Linux-Matrix **34391123679 vollständig PASS** auf `5339055c4ba660ae5e4718ac270a08fb13f30f04` (Tree `88d2adac11b1c4507e5961fabcb3c22812b9ae5d`): Linux-Job 102599392599 und Windows-Job 102599392813 jeweils **22 tatsächliche Prüfblöcke PASS**, `rendererErrors:[]`, `manualConfirmed:false`. Geprüft sind 16 bestehende und 6 Vorankündigungsabläufe mit Mausbedienung, realen Preload-/SQLite-Zugriffen, erneutem Öffnen, Neustart, Projekttrennung, Konflikt-/Archiv-/Lizenzschutz und Editoränderung ohne Fachschreiben. Screenshots der oberen und unteren Formularbereiche bei breiter, schmaler und niedriger Fenstergröße wurden visuell geprüft; Felder bleiben innerhalb ihrer Container, Speicheraktionen sind nach tiefem Scroll ohne Zurückscrollen sichtbar, auch bei 560 × 480. Die neue lange Maske lässt sich damit bis zum Unterschriftsbereich bedienen, ohne den Speicherknopf zu verlieren. Keine persönliche manuelle Abnahme behauptet.

Reparaturrunde der echten Abnahme: erster Linuxlauf 34390561291 brach beim gewählten Firmenanhang ab. Der isolierte alte Kontaktfixture hatte `use_project_participant=0`, also korrekt keine aktive Projektfirma. Ein tatsächlicher SQLite-/FirmDirectory-Reproducer bestätigte die Ursache. Testcommit `5339055c4ba660ae5e4718ac270a08fb13f30f04` ergänzt ausschließlich einen expliziten aktiven Projektteilnehmer und aussagekräftige Speicherdiagnose; der Produktcode ist gegenüber dem vollständig getesteten Stand bytegleich. Der wiederholte echte Ablauf besteht auf beiden Betriebssystemen.

Verwerfschutz gilt für die eigenen Screenaktionen. Die bestehende globale Shellnavigation hat weiterhin keinen allgemeinen abbrechbaren beforeLeave-Schutz und wurde nicht umgebaut. Der Browserharness benutzt den tatsächlichen SiGeKo-Moduladapter und bildet den View-Lebenszyklus ab; er ist kein Nachweis sämtlicher globaler Shellwege. Allgemeine npm-CI 34391123675, Job 102599394885, separat anhand Logs abgegrenzt: weiterhin fehlendes UI-Kit sowie bekannte Popup-/Lizenzfehler; kein grüner Gesamt-CI-Status behauptet. Abschließende Änderungen ausschließlich Dokumentation.

Rechnung #275 bleibt eingefroren. Keine neue Tabelle, PDF-Ausgabe, Rücklaufaktion, Mailübergabe oder Behördenrecherche in diesem Paket. Nach Integration direkt der bereits abgegrenzte gemeinsame S5.3-Zugriffsanschluss, anschließend das fachliche Vorankündigungs-PDF.
