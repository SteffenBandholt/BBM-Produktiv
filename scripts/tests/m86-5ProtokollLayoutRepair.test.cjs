"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

async function runM865ProtokollLayoutRepairTests(run) {
  await run("M86.5: Protokoll verteilt Header, Sheet und Editbox mit sicheren Flexgrenzen", () => {
    const css = read("src/renderer/modules/protokoll/styles/tops.css");
    assert.match(css, /\[data-bbm-tops-screen="true"\]\s*\{[\s\S]*?flex:\s*1 1 0;[\s\S]*?max-height:\s*100%/);
    assert.match(css, /\[data-bbm-tops-screen="true"\]\s*\{[\s\S]*?overflow:\s*hidden/);
    assert.match(css, /\[data-bbm-tops-screen-area="sheet"\]\s*\{[\s\S]*?flex:\s*1 1 0;[\s\S]*?overflow:\s*auto;[\s\S]*?overflow-x:\s*hidden/);
    assert.match(css, /\[data-bbm-tops-screen-area="edit"\]\s*\{[\s\S]*?min-height:\s*190px;[\s\S]*?max-height:\s*min\(300px, calc\(100% - 120px\)\)/);
    assert.match(css, /\.bbm-tops-workbench\s*\{[\s\S]*?min-height:\s*178px;[\s\S]*?box-sizing:\s*border-box/);
    assert.match(css, /\.bbm-tops-workbench-header\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto auto/);
    assert.match(css, /\.bbm-tops-workbench-body\s*\{[\s\S]*?min-width:\s*0/);
    assert.match(css, /@media \(max-height: 520px\)[\s\S]*?\[data-bbm-tops-screen-area="edit"\][\s\S]*?min-height:\s*160px[\s\S]*?\.bbm-tops-workbench\s*\{[\s\S]*?min-height:\s*148px/s);
    assert.match(css, /@media \(max-height: 520px\)[\s\S]*?\[data-bbm-tops-header-v2="true"\][\s\S]*?min-height:\s*42px[\s\S]*?\.bbm-tops-header-line3,[\s\S]*?display:\s*none\s*!important/s);
    assert.match(css, /@media \(max-height: 520px\)[\s\S]*?\.bbm-tops-workbench-editbox \.editbox-label\s*\{[\s\S]*?flex-direction:\s*row/s);
    assert.match(css, /@media \(max-height: 520px\)[\s\S]*?\.bbm-tops-meta-due-with-ampel \.status-ampel-group\s*\{[\s\S]*?flex-direction:\s*row/s);
    assert.match(css, /\.bbm-tops-meta-fields\s*\{[\s\S]*?flex-direction:\s*column/s);
  });
  await run("M86.5: Restarbeiten bleibt ausserhalb der Protokollreparatur", () => {
    const css = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css");
    assert.doesNotMatch(css, /bbm-tops-workbench|bbm-tops-screen-area/);
  });
}
if (require.main === module) runM865ProtokollLayoutRepairTests(async (_name, fn) => fn()).then(() => console.log("m86-5ProtokollLayoutRepair.test.cjs passed")).catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { runM865ProtokollLayoutRepairTests };
