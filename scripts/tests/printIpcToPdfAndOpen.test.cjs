const fs = require("fs");
const path = require("path");
const assert = require("assert");

function runPrintIpcToPdfAndOpenTests() {
  const source = fs.readFileSync(path.join(__dirname, "../../src/main/ipc/printIpc.js"), "utf8");

  assert.match(source, /ipcMain\.handle\("print:toPdfAndOpen"/);
  assert.match(source, /const outPath = await printToPdf\(p\);/);
  assert.match(source, /const openError = await shell\.openPath\(outPath\);/);
  assert.match(source, /if \(String\(openError \|\| ""\)\.trim\(\)\) \{/);
  assert.match(source, /return \{ ok: false, error: openError, filePath: outPath \};/);
  assert.match(source, /return \{ ok: true, filePath: outPath \};/);

  assert.match(source, /ipcMain\.handle\("print:toPdf"/);
  assert.match(source, /ipcMain\.handle\("print:htmlToPdf"/);
}

module.exports = { runPrintIpcToPdfAndOpenTests };
