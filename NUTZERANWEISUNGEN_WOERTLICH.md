# Verbindliche Arbeitsregel – Nutzeranweisungen wörtlich umsetzen

Diese Regel gilt für ChatGPT, Codex und alle weiteren Bearbeiter dieses Repositories.

## Grundsatz

Eindeutige Nutzeranweisungen sind **wörtlich** umzusetzen.

Es ist nicht zulässig, eine klare Vorgabe eigenmächtig abzuschwächen, umzudeuten, zu relativieren oder durch eine vermeintlich bessere technische oder gestalterische Lösung zu ersetzen.

Beispiele verbindlicher Begriffe:

- `keine` bedeutet: **0 / vollständig entfernt / nicht vorhanden**
- `alle` bedeutet: **alle betroffenen Elemente**, nicht eine Auswahl
- `nur` bedeutet: **ausschließlich der genannte Umfang**
- `nicht` bedeutet: **darf nicht umgesetzt oder beibehalten werden**
- konkrete Maße, Werte oder Positionen sind exakt einzuhalten, soweit technisch möglich

Beispiel:

> Nutzer: „keine Grenzen / keine Abstände“

Bedeutet:

- kein Restabstand
- kein reduzierter Abstand
- kein versteckter Spacer
- keine Reserve durch `margin`, `padding`, `gap`, `height` oder `min-height`
- Zielwert: **0**, sofern der Nutzer nichts anderes vorgibt

## Keine Eigeninterpretation

Bei einer eindeutigen Anweisung darf der Bearbeiter nicht selbst entscheiden, dass z. B. 4 px, 8 px oder 10 px „besser“, „harmonischer“ oder „technisch sinnvoller“ seien, wenn der Nutzer 0 bzw. keine Abstände verlangt.

Auch bestehende Designkonventionen, bisherige Layoutmuster oder persönliche Einschätzungen des Bearbeiters dürfen eine eindeutige Nutzeranweisung nicht überstimmen.

## Wann nachfragen?

Nur nachfragen, wenn mindestens einer dieser Fälle vorliegt:

1. Die Nutzeranweisung enthält einen echten Widerspruch.
2. Die Anweisung ist technisch unmöglich.
3. Zwei ausdrücklich verlangte Ziele schließen sich gegenseitig aus.
4. Eine zwingende Sicherheits-, Datenintegritäts- oder Repositoryregel verhindert die wörtliche Umsetzung.

Dann ist der Konflikt konkret zu benennen. Es darf nicht stillschweigend eine abgeschwächte Variante umgesetzt werden.

## Umsetzungskontrolle

Vor Abschluss eines Auftrags ist die Nutzeranweisung noch einmal wörtlich gegen das Ergebnis zu prüfen.

Nicht nur prüfen, ob das Ergebnis „in die gewünschte Richtung“ geht, sondern ob die konkrete Vorgabe tatsächlich erfüllt ist.

## Priorität

Direkte Nutzeranweisungen haben gemäß `AGENTS.md` höchste Priorität. Diese Datei konkretisiert, wie diese Priorität praktisch anzuwenden ist.
