const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenPhotoUiTests(run) {
  const screenPath = path.join(
    __dirname,
    "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"
  );
  const screenSource = fs.readFileSync(screenPath, "utf8");

  await run("Restarbeiten Fotos: UI nutzt die vorhandenen Attachment-Grenzen", () => {
    assert.equal(screenSource.includes("Fotos folgen in einem späteren Paket."), false);
    for (const apiName of [
      "listRestarbeitAttachments",
      "importRestarbeitAttachments",
      "setPrimaryRestarbeitAttachment",
      "deleteRestarbeitAttachment",
    ]) {
      assert.equal(screenSource.includes(`${apiName}(`), true, `${apiName} wird nicht aufgerufen`);
    }
    for (const action of ["close", "import", "primary", "delete"]) {
      assert.equal(
        screenSource.includes(`setAttribute(\"data-bbm-restarbeiten-photo-action\", \"${action}\")`),
        true,
        `Foto-Aktion ${action} fehlt`
      );
    }
    assert.equal(screenSource.includes("Noch keine Fotos vorhanden."), true);
    assert.equal(screenSource.includes("Maximal 3 Fotos"), true);
    assert.equal(screenSource.includes("Hauptfoto"), true);
  });

  await run("Restarbeiten Fotos: Attachment-API liefert Liste, Import, Hauptfoto und Löschen", async () => {
    const previousWindow = globalThis.window;
    const calls = [];
    globalThis.window = {
      bbmDb: {
        async restarbeitenListAttachments(payload) {
          calls.push(["list", payload]);
          return { ok: true, attachments: [{ id: "a-1", is_primary: 1 }] };
        },
        async restarbeitenImportAttachments(payload) {
          calls.push(["import", payload]);
          return { ok: true, attachments: [{ id: "a-2" }] };
        },
        async restarbeitenSetPrimaryAttachment(payload) {
          calls.push(["primary", payload]);
          return { ok: true };
        },
        async restarbeitenDeleteAttachment(payload) {
          calls.push(["delete", payload]);
          return { ok: true, attachments: [], warning: "Datei blieb erhalten." };
        },
      },
    };
    try {
      const dataSource = await importEsmFromFile(
        path.join(__dirname, "../../src/renderer/modules/restarbeiten/data/restarbeitenDataSource.js")
      );
      assert.deepEqual(await dataSource.listRestarbeitAttachments("r-1"), [{ id: "a-1", is_primary: 1 }]);
      assert.deepEqual(await dataSource.importRestarbeitAttachments("r-1", "p-1"), {
        canceled: false,
        attachments: [{ id: "a-2" }],
      });
      assert.equal(await dataSource.setPrimaryRestarbeitAttachment("r-1", "a-2"), true);
      assert.deepEqual(await dataSource.deleteRestarbeitAttachment("r-1", "a-2"), {
        attachments: [],
        warning: "Datei blieb erhalten.",
      });
      assert.deepEqual(calls, [
        ["list", { restarbeitId: "r-1" }],
        ["import", { restarbeitId: "r-1", projectId: "p-1" }],
        ["primary", { restarbeitId: "r-1", attachmentId: "a-2" }],
        ["delete", { restarbeitId: "r-1", attachmentId: "a-2" }],
      ]);
    } finally {
      globalThis.window = previousWindow;
    }
  });
}

module.exports = { runRestarbeitenPhotoUiTests };
