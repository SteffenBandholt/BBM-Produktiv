const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runRestarbeitenLoadErrorTests(run) {
  const source = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
    "utf8"
  );
  const loadStart = source.indexOf("  async load(");
  const bindStart = source.indexOf("\n  _bindTextLimitSettings()", loadStart);
  const loadSource = source.slice(loadStart, bindStart);

  await run("Restarbeiten Laden: Hauptfehler wird sichtbar abgefangen", () => {
    assert.ok(loadStart >= 0 && bindStart > loadStart, "load()-Methode nicht eindeutig gefunden");
    assert.equal(loadSource.includes("listRestarbeitenByProject(this.projectId)"), true);
    assert.equal(loadSource.includes("} catch (error) {"), true);
    assert.equal(loadSource.includes("Restarbeiten konnten nicht geladen werden:"), true);
    assert.equal(loadSource.includes('this.error = detail'), true);
  });

  await run("Restarbeiten Laden: Ladezustand wird auch im Fehlerfall beendet", () => {
    const catchIndex = loadSource.indexOf("} catch (error) {");
    const finallyIndex = loadSource.indexOf("} finally {", catchIndex);
    const loadingResetIndex = loadSource.indexOf("this.isLoading = false;", finallyIndex);
    const renderIndex = loadSource.indexOf("this._renderShell();", loadingResetIndex);
    assert.ok(catchIndex >= 0, "catch fehlt");
    assert.ok(finallyIndex > catchIndex, "finally fehlt nach catch");
    assert.ok(loadingResetIndex > finallyIndex, "isLoading wird im finally nicht zurückgesetzt");
    assert.ok(renderIndex > loadingResetIndex, "Fehlerzustand wird nach dem Reset nicht gerendert");
  });
}

module.exports = { runRestarbeitenLoadErrorTests };
