# Nachgewiesene Ursache des alten Lizenzalias-Testfehlers

Der Test stammt aus `86972fd3` und erwartete direkte requireFeature(app/pdf/mail/export)-Aliase. Commit `a0685bc449b836ae48b269c307b8df7623e39a84` (Legacy-Dienste von Modul-IDs trennen, 13.08.2026) entfernte genau diese vier Aufrufaliase ausdrücklich. Er behielt die Übersetzung historischer Lizenzdaten in normalizeLicensedModules. Der alte Test wurde dabei nicht angepasst. ADR-001 sowie der spätere kanonische Modul-/Capability-Vertrag bestätigen die Trennung.

Korrektur ausschließlich im Test: direkte Dienste-Aufrufe weiterhin abweisen, historische Lizenzfeatures weiterhin als Protokoll lesen und kanonisches requireFeature(protokoll) erfolgreich prüfen. Keine Produktionsregel und kein Entitlement-Core-0.1.0-Byte geändert. Vorheriger Ausgangsbefund: 26 bestanden / 1 fehlgeschlagen, sowohl vor als nach ursprünglicher Extraktion.
