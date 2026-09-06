const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = process.cwd();
const REMOVED_FLOW = "src/renderer/features/output/CloseMeetingOutputFlow.js";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function collectJavaScriptFiles(relativeDirectory) {
  const directory = path.join(ROOT, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(relativePath);
    return /\.(?:cjs|js|mjs)$/.test(entry.name) ? [relativePath] : [];
  });
}

async function runProtokollLegacyProofTests(run) {
  await run("Protokoll #272 Legacy: alter Close-Flow hat keinen Import oder Runtime-Aufrufer", () => {
    const references = collectJavaScriptFiles("src")
      .filter((relativePath) => relativePath !== REMOVED_FLOW)
      .filter((relativePath) => read(relativePath).includes("CloseMeetingOutputFlow"));

    assert.deepEqual(references, []);
    assert.equal(fs.existsSync(path.join(ROOT, REMOVED_FLOW)), false);
  });

  await run("Protokoll #272 Legacy: produktiver Screen nutzt den kanonischen Modul-Close-Flow", () => {
    const screen = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
    const moduleBoundary = read("src/renderer/modules/protokoll/TopsCloseFlow.js");
    assert.match(screen, /import \{ TopsCloseFlow \} from "\.\.\/TopsCloseFlow\.js"/);
    assert.match(screen, /new TopsCloseFlow\(/);
    assert.match(moduleBoundary, /tops\/domain\/TopsCloseFlow\.js/);
  });

  await run("Protokoll #272 Legacy: kanonischer Close- und Mailflow sind zur Runtime importierbar", async () => {
    const closeModule = await importEsmFromFile(
      path.join(ROOT, "src/renderer/modules/protokoll/TopsCloseFlow.js")
    );
    const mailModule = await importEsmFromFile(
      path.join(ROOT, "src/renderer/modules/protokoll/mail/ProtokollMailFlow.js")
    );

    assert.equal(typeof closeModule.TopsCloseFlow, "function");
    assert.equal(typeof mailModule.ProtokollMailFlow, "function");
  });

  await run("Protokoll #272 Legacy: notwendige Kompatibilitaets-Re-Exports bleiben erhalten", async () => {
    const topsCompatibility = read("src/renderer/views/TopsScreen.js");
    const mailCompatibility = await importEsmFromFile(
      path.join(ROOT, "src/renderer/features/mail/MailFlow.js")
    );

    assert.match(topsCompatibility, /modules\/protokoll\/screens\/TopsScreen\.js/);
    assert.equal(mailCompatibility.MailFlow, mailCompatibility.ProtokollMailFlow);
  });
}

module.exports = { runProtokollLegacyProofTests };
