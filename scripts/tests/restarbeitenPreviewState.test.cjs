const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runRestarbeitenPreviewStateTests(run) {
  const screen = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"),
    "utf8"
  );
  const styles = fs.readFileSync(
    path.join(__dirname, "../../src/renderer/modules/restarbeiten/styles/restarbeiten.css"),
    "utf8"
  );

  await run("Restarbeiten Preview: lokaler Preview-State ist entfernt", () => {
    assert.equal(screen.includes("outputPreviewOpen"), false);
    assert.equal(screen.includes("closeRestarbeitenPreview"), false);
    assert.equal(screen.includes("data-output-preview"), false);
    assert.equal(styles.includes('data-output-preview="true"'), false);
  });

  await run("Restarbeiten Preview: gemeinsamer interner Druckweg bleibt aktiv", () => {
    assert.equal(screen.includes("window?.bbmPrint?.printPdfAndPreviewInternal"), true);
    assert.equal(screen.includes("await printPdfAndPreviewInternal(this._buildRestarbeitenPdfPayload())"), true);
    assert.equal(screen.includes('mode: "restarbeiten"'), true);
    assert.equal(screen.includes("buildRestarbeitenOutputPreview"), false);
  });
}

module.exports = { runRestarbeitenPreviewStateTests };
