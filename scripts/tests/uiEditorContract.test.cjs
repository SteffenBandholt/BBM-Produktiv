const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ALLOWED_UI_EDITOR_KINDS = new Set(["frame", "field", "single"]);
const DEFAULT_ROOT_IDS = new Set(["restarbeiten.root"]);

function readEditorTargetAttributes(node) {
  const getAttribute = typeof node?.getAttribute === "function" ? node.getAttribute.bind(node) : null;
  return {
    node,
    id: String(getAttribute?.("data-ui-inspector-id") || "").trim(),
    kind: String(getAttribute?.("data-ui-editor-kind") || "").trim(),
    label: String(getAttribute?.("data-ui-editor-label") || "").trim(),
    parent: String(getAttribute?.("data-ui-editor-parent") || "").trim(),
    editable: String(getAttribute?.("data-ui-editor-editable") || "").trim(),
    ops: String(getAttribute?.("data-ui-editor-ops") || "").trim(),
  };
}

function collectEditorTargets(root) {
  const nodes = Array.from(root?.querySelectorAll?.("[data-ui-inspector-id]") || []);
  return nodes.map((node) => readEditorTargetAttributes(node));
}

function isRootEditorTarget(target, options = {}) {
  if (typeof options.isRootTarget === "function") {
    return !!options.isRootTarget(target);
  }

  if (target?.id && DEFAULT_ROOT_IDS.has(target.id)) return true;
  if (target?.id && target.id.endsWith(".root")) return true;
  return false;
}

function validateEditorTarget(target, options = {}) {
  const issues = [];
  const id = String(target?.id || "").trim();
  const kind = String(target?.kind || "").trim();
  const label = String(target?.label || "").trim();
  const parent = String(target?.parent || "").trim();
  const editable = String(target?.editable || "").trim();
  const rootTarget = isRootEditorTarget(target, options);

  if (!id) issues.push("missing data-ui-inspector-id");
  if (!kind) issues.push(`missing data-ui-editor-kind on ${id || "<unknown>"}`);
  else if (!ALLOWED_UI_EDITOR_KINDS.has(kind)) issues.push(`invalid data-ui-editor-kind on ${id || "<unknown>"}: ${kind}`);
  if (!label) issues.push(`missing data-ui-editor-label on ${id || "<unknown>"}`);
  if (!editable) issues.push(`missing data-ui-editor-editable on ${id || "<unknown>"}`);
  if (!rootTarget && !parent) issues.push(`missing data-ui-editor-parent on ${id || "<unknown>"}`);

  return {
    id,
    kind,
    label,
    parent,
    editable,
    ops: String(target?.ops || "").trim(),
    rootTarget,
    valid: issues.length === 0,
    issues,
  };
}

function validateEditorTargets(root, options = {}) {
  const targets = collectEditorTargets(root);
  const validatedTargets = targets.map((target) => validateEditorTarget(target, options));
  const issues = validatedTargets.flatMap((target) =>
    target.issues.map((message) => ({
      id: target.id,
      message,
    }))
  );

  return {
    targets: validatedTargets,
    valid: issues.length === 0,
    issues,
  };
}

function createFakeNode(attrs = {}) {
  const attributes = { ...attrs };
  return {
    getAttribute(name) {
      return attributes[name] ?? null;
    },
  };
}

function createFakeRoot(nodes = []) {
  return {
    querySelectorAll(selector) {
      return selector === "[data-ui-inspector-id]" ? nodes : [];
    },
  };
}

function assertDocContains(filePath, requiredSnippets) {
  assert.equal(fs.existsSync(filePath), true, `missing doc file: ${filePath}`);
  const source = fs.readFileSync(filePath, "utf8");
  for (const snippet of requiredSnippets) {
    assert.equal(
      source.includes(snippet),
      true,
      `expected ${path.basename(filePath)} to contain: ${snippet}`
    );
  }
  return source;
}

async function runUiEditorContractTests(run) {
  const contractPath = path.join(__dirname, "../../docs/UI_EDITOR_VERTRAG.md");
  const restarbeitenMapPath = path.join(__dirname, "../../docs/ui-landkarten/RESTARBEITEN.md");

  await run("UI Editor Vertrag: Doku ist vorhanden und nennt die Pflichtbegriffe", () => {
    const source = assertDocContains(contractPath, [
      "data-ui-inspector-id",
      "data-ui-editor-kind",
      "data-ui-editor-label",
      "data-ui-editor-parent",
      "data-ui-editor-editable",
      "data-ui-editor-ops",
      "frame",
      "field",
      "single",
      "Eine Auswahl = genau ein Ziel.",
      "Eine Aenderung = nur dieses Ziel.",
      "Protokoll-UI bleibt unberuehrt",
    ]);

    assert.equal(source.includes("Startbereich fuer den Vertrag ist Restarbeiten"), true);
  });

  await run("Restarbeiten-Rahmenlandkarte: Zielstruktur ist dokumentiert", () => {
    assertDocContains(restarbeitenMapPath, [
      "restarbeiten.root",
      "restarbeiten.main",
      "restarbeiten.filterleiste",
      "restarbeiten.filterleiste.klasse",
      "restarbeiten.filterleiste.verortung",
      "restarbeiten.filterleiste.meta",
      "restarbeiten.liste",
      "restarbeiten.liste.nummernspalte",
      "restarbeiten.liste.textbereich",
      "restarbeiten.liste.metabereich",
      "restarbeiten.editbox",
      "restarbeiten.editbox.header",
      "restarbeiten.editbox.kurztext",
      "restarbeiten.editbox.langtext",
      "restarbeiten.editbox.verortung",
      "restarbeiten.editbox.meta",
    ]);

    const source = fs.readFileSync(restarbeitenMapPath, "utf8");
    assert.equal(source.includes("UI-Editor-Vertrag gilt"), true);
    assert.equal(source.includes("neue oder neu strukturierte UIs"), true);
    assert.equal(source.includes("zuerst Restarbeiten"), true);
    assert.equal(source.includes("Protokoll-UI ist fachlich fertig"), true);
    assert.equal(source.includes("bleibt unber"), true);
    assert.equal(source.includes("Diese Restarbeiten-Rahmenlandkarte"), true);
    assert.equal(source.includes("Protokoll nicht"), true);
  });

  await run("UI-Editor-Hilfslogik: gueltige Targets bestehen die Pruefung", () => {
    const root = createFakeRoot([
      createFakeNode({
        "data-ui-inspector-id": "restarbeiten.root",
        "data-ui-editor-kind": "frame",
        "data-ui-editor-label": "Restarbeiten",
        "data-ui-editor-editable": "false",
      }),
      createFakeNode({
        "data-ui-inspector-id": "restarbeiten.editbox.kurztext",
        "data-ui-editor-kind": "field",
        "data-ui-editor-label": "Kurztext",
        "data-ui-editor-parent": "restarbeiten.editbox",
        "data-ui-editor-editable": "true",
        "data-ui-editor-ops": "move,resize",
      }),
    ]);

    const scan = validateEditorTargets(root);
    assert.equal(scan.valid, true);
    assert.equal(scan.targets.length, 2);
    assert.equal(scan.targets[0].rootTarget, true);
    assert.equal(scan.targets[1].rootTarget, false);
    assert.deepEqual(scan.issues, []);
    assert.deepEqual(
      scan.targets.map((target) => target.kind),
      ["frame", "field"]
    );
  });

  await run("UI-Editor-Hilfslogik: fehlende Pflichtattribute werden erkannt", () => {
    const root = createFakeRoot([
      createFakeNode({
        "data-ui-inspector-id": "restarbeiten.editbox.langtext",
        "data-ui-editor-kind": "single",
        "data-ui-editor-label": "Langtext",
        "data-ui-editor-editable": "true",
      }),
      createFakeNode({
        "data-ui-inspector-id": "restarbeiten.editbox.meta",
        "data-ui-editor-kind": "menu",
        "data-ui-editor-label": "",
        "data-ui-editor-parent": "restarbeiten.editbox",
      }),
    ]);

    const scan = validateEditorTargets(root);
    assert.equal(scan.valid, false);
    assert.equal(scan.targets[0].issues.includes("missing data-ui-editor-parent on restarbeiten.editbox.langtext"), true);
    assert.equal(
      scan.targets[1].issues.some((issue) => issue.includes("invalid data-ui-editor-kind on restarbeiten.editbox.meta")),
      true
    );
    assert.equal(
      scan.targets[1].issues.some((issue) => issue.includes("missing data-ui-editor-label on restarbeiten.editbox.meta")),
      true
    );
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") {
        await out;
      }
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runUiEditorContractTests(run).then(() => {
    if (!process.exitCode) console.log("uiEditorContract.test.cjs passed");
  });
}

module.exports = {
  ALLOWED_UI_EDITOR_KINDS,
  collectEditorTargets,
  readEditorTargetAttributes,
  validateEditorTarget,
  validateEditorTargets,
  runUiEditorContractTests,
};
