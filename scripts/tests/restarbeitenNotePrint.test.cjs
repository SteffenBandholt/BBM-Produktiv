const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runRestarbeitenNotePrintTests(run) {
  const screen = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
    "utf8"
  );

  await run("Restarbeiten Notizen: UI bietet keinen vorgetäuschten Druck an", () => {
    assert.equal(screen.includes('data-bbm-restarbeiten-note-action\", \"print'), false);
    assert.equal(screen.includes("printRestarbeitNoteHistory"), false);
    assert.equal(screen.includes('mode: "restarbeit-note-history"'), false);
    assert.equal(screen.includes("Druck vorbereitet."), false);
  });

  await run("Restarbeiten Notizen: fehlender Druckweg wird ehrlich angezeigt", () => {
    assert.equal(screen.includes("Notizdruck ist derzeit nicht verfügbar."), true);
    assert.equal(screen.includes('printAvailability.className = "bbm-restarbeiten-notes-popup__print-availability"'), true);
  });
}

module.exports = { runRestarbeitenNotePrintTests };
