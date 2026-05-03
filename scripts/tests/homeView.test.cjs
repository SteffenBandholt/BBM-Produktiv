const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runHomeViewTests(run) {
  const homeViewSource = read("src/renderer/views/HomeView.js");

  await run("HomeView: zentrales Icon ist sichtbar verkleinert", () => {
    assert.equal(homeViewSource.includes('bgImg.style.width = "clamp(55px, 7vw, 105px)";'), true);
    assert.equal(homeViewSource.includes('bgImg.style.maxWidth = "17.5%";'), true);
    assert.equal(homeViewSource.includes('bgImg.src = "./assets/icon-BBM.png";'), true);
  });
}

module.exports = { runHomeViewTests };
