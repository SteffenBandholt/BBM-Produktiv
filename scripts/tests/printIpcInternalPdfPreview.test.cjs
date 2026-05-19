const fs = require("fs");
const path = require("path");
const assert = require("assert");

function runPrintIpcInternalPdfPreviewTests() {
  const source = fs.readFileSync(path.join(__dirname, "../../src/main/ipc/printIpc.js"), "utf8");

  assert.match(source, /ipcMain\.handle\("print:toPdfAndPreviewInternal"/);
  assert.match(source, /const outPath = await printToPdf\(p\);/);
  assert.match(source, /openInternalPdfPreview\(\{[\s\S]*filePath: outPath/);
  assert.doesNotMatch(source, /print:toPdfAndPreviewInternal[\s\S]*shell\.openPath/);

  assert.match(source, /ipcMain\.handle\("print:toPdfAndOpen"/);
  assert.match(source, /const openError = await shell\.openPath\(outPath\);/);
  assert.match(source, /ipcMain\.handle\("print:toPdf"/);
  assert.match(source, /ipcMain\.handle\("print:htmlToPdf"/);

  assert.match(source, /if \(m === "restarbeiten"\) return "restarbeiten";/);
  assert.match(source, /_enforceFeature\("protokoll"\);/);
}

module.exports = { runPrintIpcInternalPdfPreviewTests };
