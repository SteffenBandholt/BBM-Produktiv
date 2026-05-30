const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function getDepthById(registry, entryId) {
  const byId = new Map(registry.map((entry) => [entry.id, entry]));
  let depth = 1;
  let current = byId.get(entryId);
  const seen = new Set([entryId]);
  while (current?.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    if (seen.has(parent.id)) return Number.POSITIVE_INFINITY;
    seen.add(parent.id);
    depth += 1;
    current = parent;
  }
  return depth;
}

async function runRestarbeitenV2RegistryTests(run) {
  const registryPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2Registry.js");
  const editorRegistryPath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Registry.js");

  const source = fs.readFileSync(registryPath, "utf8");
  assert.equal(source.includes("document.createElement"), false);
  assert.equal(source.includes("render("), false);
  assert.equal(source.includes("Router"), false);
  assert.equal(source.includes("MainHeader"), false);
  assert.equal(source.includes("screen"), false);
  assert.equal(source.includes("CSS"), false);

  const { createRestarbeitenV2Registry, filterRestarbeitenV2RegistryForEditor } = await importEsmFromFile(registryPath);
  const {
    normalizeEditorV2Registry,
    validateEditorV2Registry,
  } = await importEsmFromFile(editorRegistryPath);

  assert.equal(typeof createRestarbeitenV2Registry, "function");
  assert.equal(typeof filterRestarbeitenV2RegistryForEditor, "function");

  const registry = createRestarbeitenV2Registry();
  assert.equal(Array.isArray(registry), true);
  const byId = new Map(registry.map((entry) => [entry.id, entry]));

  const ids = registry.map((entry) => entry.id);
  const requiredIds = [
    "restarbeitenV2.root",
    "restarbeitenV2.header",
    "restarbeitenV2.header.context",
    "restarbeitenV2.header.status",
    "restarbeitenV2.header.filter",
    "restarbeitenV2.quicklane",
    "restarbeitenV2.quicklane.lock",
    "restarbeitenV2.quicklane.neu",
    "restarbeitenV2.quicklane.filterOffen",
    "restarbeitenV2.quicklane.filterErledigt",
    "restarbeitenV2.quicklane.filterAlle",
    "restarbeitenV2.quicklane.foto",
    "restarbeitenV2.quicklane.diktat",
    "restarbeitenV2.main",
    "restarbeitenV2.main.liste",
    "restarbeitenV2.main.nummer",
    "restarbeitenV2.main.textbereich",
    "restarbeitenV2.main.verortung",
    "restarbeitenV2.main.meta",
    "restarbeitenV2.footer",
    "restarbeitenV2.footer.kurztext",
    "restarbeitenV2.footer.langtext",
    "restarbeitenV2.footer.verortung",
    "restarbeitenV2.footer.meta",
    "restarbeitenV2.footer.fotos",
    "restarbeitenV2.footer.notiz",
  ];
  for (const id of requiredIds) {
    assert.equal(ids.includes(id), true, `missing registry id: ${id}`);
  }

  for (const entry of registry) {
    assert.equal(typeof entry.id, "string");
    assert.equal(typeof entry.label, "string");
    assert.equal(["frame", "field", "control"].includes(entry.kind), true, `invalid kind for ${entry.id}`);
    assert.equal(typeof entry.editable, "boolean", `invalid editable for ${entry.id}`);
    assert.equal(Array.isArray(entry.ops), true, `invalid ops for ${entry.id}`);
    assert.equal(typeof entry.selector, "string", `missing selector for ${entry.id}`);
    assert.equal(entry.ops.every((op) => ["move", "resize", "hide"].includes(op)), true, `invalid op for ${entry.id}`);
    assert.equal(typeof entry.editorCategory, "string", `missing editorCategory for ${entry.id}`);
    if (entry.id !== "restarbeitenV2.root") {
      assert.equal(typeof entry.parentId, "string", `missing parentId for ${entry.id}`);
      assert.equal(ids.includes(entry.parentId), true, `unknown parentId for ${entry.id}`);
    }
  }

  const allowedEditorCategories = new Set([
    "editorStructure",
    "display",
    "devOnly",
    "outsideEditor",
    "separateDomainMode",
    "open",
  ]);
  for (const entry of registry) {
    assert.equal(
      allowedEditorCategories.has(entry.editorCategory),
      true,
      `invalid editorCategory for ${entry.id}: ${String(entry.editorCategory)}`
    );
  }

  const expectedCategories = {
    "restarbeitenV2.root": "editorStructure",
    "restarbeitenV2.header": "editorStructure",
    "restarbeitenV2.header.context": "display",
    "restarbeitenV2.header.status": "display",
    "restarbeitenV2.header.filter": "open",
    "restarbeitenV2.quicklane": "editorStructure",
    "restarbeitenV2.quicklane.lock": "devOnly",
    "restarbeitenV2.quicklane.neu": "separateDomainMode",
    "restarbeitenV2.quicklane.filterAlle": "outsideEditor",
    "restarbeitenV2.quicklane.filterOffen": "outsideEditor",
    "restarbeitenV2.quicklane.filterErledigt": "outsideEditor",
    "restarbeitenV2.quicklane.foto": "devOnly",
    "restarbeitenV2.quicklane.diktat": "devOnly",
    "restarbeitenV2.main": "editorStructure",
    "restarbeitenV2.main.liste": "editorStructure",
    "restarbeitenV2.main.nummer": "display",
    "restarbeitenV2.main.textbereich": "display",
    "restarbeitenV2.main.verortung": "display",
    "restarbeitenV2.main.meta": "open",
    "restarbeitenV2.footer": "editorStructure",
    "restarbeitenV2.footer.kurztext": "open",
    "restarbeitenV2.footer.langtext": "open",
    "restarbeitenV2.footer.verortung": "open",
    "restarbeitenV2.footer.meta": "open",
    "restarbeitenV2.footer.fotos": "display",
    "restarbeitenV2.footer.notiz": "open",
  };

  for (const [id, expectedCategory] of Object.entries(expectedCategories)) {
    assert.equal(byId.has(id), true, `missing registry id for editorCategory check: ${id}`);
    assert.equal(byId.get(id).editorCategory, expectedCategory, `unexpected editorCategory for ${id}`);
  }

  const filteredDefault = filterRestarbeitenV2RegistryForEditor(registry);
  const filteredDefaultIds = new Set(filteredDefault.map((entry) => entry.id));
  assert.equal(filteredDefault.every((entry) => entry.editorCategory === "editorStructure" || entry.editorCategory === "display"), true);
  assert.equal(filteredDefault.some((entry) => entry.editorCategory === "devOnly"), false);
  assert.equal(filteredDefault.some((entry) => entry.editorCategory === "outsideEditor"), false);
  assert.equal(filteredDefault.some((entry) => entry.editorCategory === "separateDomainMode"), false);
  assert.equal(filteredDefault.some((entry) => entry.editorCategory === "open"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.quicklane.neu"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.quicklane.foto"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.quicklane.diktat"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.quicklane.filterAlle"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.quicklane.filterOffen"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.quicklane.filterErledigt"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.footer.kurztext"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.footer.langtext"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.footer.verortung"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.footer.meta"), false);
  assert.equal(filteredDefaultIds.has("restarbeitenV2.footer.notiz"), false);

  const filteredWithOpen = filterRestarbeitenV2RegistryForEditor(registry, { includeOpen: true });
  const filteredWithOpenIds = new Set(filteredWithOpen.map((entry) => entry.id));
  assert.equal(filteredWithOpen.some((entry) => entry.editorCategory === "open"), true);
  assert.equal(filteredWithOpenIds.has("restarbeitenV2.footer.kurztext"), true);
  assert.equal(filteredWithOpenIds.has("restarbeitenV2.footer.langtext"), true);
  assert.equal(filteredWithOpenIds.has("restarbeitenV2.footer.verortung"), true);
  assert.equal(filteredWithOpenIds.has("restarbeitenV2.footer.meta"), true);
  assert.equal(filteredWithOpenIds.has("restarbeitenV2.footer.notiz"), true);

  assert.equal(normalizeEditorV2Registry(registry).length, registry.length);
  const validation = validateEditorV2Registry(registry);
  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);

  for (const entry of registry) {
    assert.equal(getDepthById(registry, entry.id) <= 4, true, `depth too deep for ${entry.id}`);
  }

  assert.equal(source.includes("data-ui-inspector-id"), false);

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  await run("Restarbeiten V2 Registry-Skeleton ist Editor-V2-kompatibel", () => undefined);
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runRestarbeitenV2RegistryTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2Registry.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2RegistryTests };
