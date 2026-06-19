# UI-Bau- und Pruefregeln

## Kurzfazit

Diese Regeln beschreiben, wie kleine UI-Aenderungen sicher gebaut und
geprueft werden. Ohne klare Grundlage wird nicht gebaut; sichtbare UI braucht
immer eine Electron-Sichtpruefung. Die PDF-/Plan-Entwurfsentscheidung ergaenzt
die minimale Grundlagenreihe.

## Zweck der Bau- und Pruefregeln

Die Regeln halten den UI-Editor klein, nachvollziehbar und kontrolliert. Sie
verhindern, dass aus einer einfachen Doku- oder Guardrail-Aenderung unbemerkt
eine Produktiv- oder Speicherfunktion wird.

Im aktuellen BBM-Stand gelten sie fuer den Hostkontext `restarbeiten.ui.main`
und die read-only Zusatzkontexte `pdf.plan.page.1` und `plan.canvas.default`.

## Grundsatz

- kleine UI-Aenderungen nur mit klarer Freigabe
- sichtbare UI-Aenderungen brauchen Electron-Sichtpruefung
- fehlende Grundlagen fuehren zu STOPP
- read-only Kontexthinweise bleiben klein und ohne Bedienlogik
- kompakte Statuszeilen bleiben informativ und ohne Speicherlogik
- Elementkatalog-Uebersichten bleiben informativ und ohne Erzeugungslogik
- Entwurfs-Vorschauen fuer `Hinweis / Infotext` bleiben informativ und ohne
  Speicherung
- Die Live-Vorschau mit `Hinweistext` bleibt lokal, aktualisiert nur den
  sichtbaren Entwurf und speichert nichts
- Die Host-Vorschau bleibt lokal, spiegelt nur den Hinweistext und speichert
  nichts
- Die Elementmodell-Vorschau bleibt read-only, zeigt nur den modellierten
  Hinweistext und speichert nichts
- Die Payload-Vorschau bleibt read-only, zeigt nur die technische Payload-Form
  des Entwurfs und speichert nichts
- Die Entwurfspruefung bleibt lokal, bewertet nur leer oder gueltig und zeigt
  immer `Speichern: nicht aktiv`
- Der Reset-Button fuer den Hinweis-/Infotext-Entwurf bleibt lokal und setzt
  nur den Standardtext zurueck
- G102 prueft den lokalen Hinweis-/Infotext-Entwurf nur als Abschlusscheck

## Bau-Regeln

- keine Produktivlogik ohne Auftrag
- keine sichtbare UI ohne Freigabe
- keine neue Persistenz ohne eigene Entscheidung
- keine Persistenz
- kein Drag
- kein Resize
- keine DB-/IPC-Schreibwege ohne eigene Entscheidung
- keine Wildcard
- kein Default-true
- UI-Editor-kit nicht aendern

## Pruef-Regeln

- `npm run check:ui-editor-kit`
- relevante Einzeltests
- `npm test`
- `git diff --check`
- Electron-Sichtpruefung bei sichtbarer UI

## Sichtpruefungsregel

Bei sichtbarer UI gilt:

- `npm start`
- Klickpfad: `Start -> Projekte -> Nr.: 04-2026 / UI-Polish fuer BBM -> Restarbeiten -> UI-Editor`

## Stop-Regeln

- unklare Grundlage
- fehlende Pflichtdoku
- nicht eindeutige Surface-/Element-Zuordnung
- unklare Persistenz
- unklare Schreibwege
