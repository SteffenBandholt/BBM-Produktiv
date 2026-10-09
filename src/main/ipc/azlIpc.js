"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { TextDecoder } = require("node:util");
const { dialog } = require("electron");
const { initDatabase } = require("../db/database");
const projectsRepo = require("../db/projectsRepo");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");

let runtimePromise = null;

function fail(error) {
  return {
    ok: false,
    error: error?.message || String(error),
    code: error?.code || null,
  };
}

function toBbmFirmKind(kind) {
  const normalized = String(kind || "").trim();
  if (normalized === "global" || normalized === "global_firm") return "global_firm";
  if (normalized === "project" || normalized === "project_firm") return "project_firm";
  return normalized;
}

function toBbmFirmRef(ref = {}) {
  return {
    ...ref,
    kind: toBbmFirmKind(ref.kind),
  };
}

function createPorts() {
  const firms = getFirmDirectoryService();
  return {
    projectPort: {
      getById(projectId) {
        return projectsRepo.getById(projectId);
      },
    },
    firmsPort: {
      get(payload) {
        const ref = payload?.ref || payload || {};
        return firms.get(toBbmFirmRef(ref));
      },
      listAll(payload) {
        const source = payload || {};
        return firms.listAll({
          ...source,
          kind: toBbmFirmKind(source.kind),
        });
      },
      listProjectParticipants(payload) {
        return firms.listProjectParticipants(payload || {});
      },
      create(payload) {
        const source = payload || {};
        return firms.create({
          ...source,
          kind: toBbmFirmKind(source.kind),
          origin: source.origin || (toBbmFirmKind(source.kind) === "global_firm" ? "firms" : "project_firms"),
        });
      },
      update(payload) {
        const source = payload || {};
        return firms.update({
          ...source,
          ref: toBbmFirmRef(source.ref || {}),
        });
      },
    },
  };
}

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const [
        { AzlRepository },
        { AzlService },
        { AzlListService },
        { ProjectContractService },
        { ReportingService },
        { OrcaFirmImportService },
      ] = await Promise.all([
        import("bbm-azl/src/infrastructure/sqlite/AzlRepository.js"),
        import("bbm-azl/src/application/AzlService.js"),
        import("bbm-azl/src/application/AzlListService.js"),
        import("bbm-azl/src/application/ProjectContractService.js"),
        import("bbm-azl/src/application/ReportingService.js"),
        import("bbm-azl/src/application/OrcaFirmImportService.js"),
      ]);

      const repository = new AzlRepository({ db: initDatabase() });
      const { projectPort, firmsPort } = createPorts();

      return Object.freeze({
        repository,
        azl: new AzlService({ repository }),
        azlList: new AzlListService({ repository }),
        contracts: new ProjectContractService({ projectPort, firmsPort, repository }),
        reporting: new ReportingService({ repository }),
        orca: new OrcaFirmImportService({ firmsPort }),
      });
    })();
  }
  return runtimePromise;
}


function decodeCsvBuffer(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return bytes.subarray(3).toString("utf8");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (_error) {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

async function chooseOrcaCsvFile() {
  const result = await dialog.showOpenDialog({
    title: "ORCA-Firmen CSV auswählen",
    properties: ["openFile"],
    filters: [
      { name: "CSV-Dateien", extensions: ["csv"] },
      { name: "Textdateien", extensions: ["txt"] },
    ],
  });
  if (result.canceled || !result.filePaths?.[0]) return null;
  const filePath = result.filePaths[0];
  const buffer = await fs.promises.readFile(filePath);
  return {
    filePath,
    fileName: path.basename(filePath),
    csvText: decodeCsvBuffer(buffer),
  };
}

function registerAzlIpc({ ipcMain } = {}) {
  if (!ipcMain || typeof ipcMain.handle !== "function") {
    throw new TypeError("ipcMain.handle ist für azL erforderlich.");
  }

  const handle = (channel, operation, resultKey) => {
    ipcMain.handle(channel, async (_event, payload) => {
      try {
        const runtime = await getRuntime();
        const result = await operation(runtime, payload || {});
        return { ok: true, [resultKey]: result };
      } catch (error) {
        return fail(error);
      }
    });
  };

  handle("azl:list", (runtime, data) => runtime.azlList.list(data.projectId), "list");
  handle("azl:get", (runtime, data) => runtime.azl.getById(data.id), "azl");
  handle("azl:createDraft", (runtime, data) => runtime.azl.createDraft(data), "azl");
  handle("azl:update", (runtime, data) => runtime.azl.update(data.id, data.patch || {}), "azl");
  handle("azl:setStatus", (runtime, data) => runtime.azl.setStatus(data.id, data.status), "azl");
  handle("azl:contracts:list", (runtime, data) => runtime.contracts.list(data.projectId), "list");
  handle("azl:contracts:save", (runtime, data) => runtime.contracts.save(data), "result");
  handle("azl:orders:list", (runtime, data) => runtime.contracts.listOrders(data.contractId), "list");
  handle("azl:orders:save", (runtime, data) => runtime.contracts.saveOrder(data), "order");
  handle("azl:orders:delete", (runtime, data) => runtime.contracts.deleteOrder(data.id), "result");
  handle("azl:report:project", (runtime, data) => runtime.reporting.project(data.projectId), "report");
  handle("azl:report:firm", (runtime, data) => runtime.reporting.firm(data.contractId), "report");

  handle("azl:orca:chooseAndPlan", async (runtime) => {
    const selected = await chooseOrcaCsvFile();
    if (!selected) return { canceled: true };
    const plan = await runtime.orca.plan({ csvText: selected.csvText });
    return {
      canceled: false,
      fileName: selected.fileName,
      plan,
    };
  }, "result");

  handle("azl:orca:apply", async (runtime, data) => {
    return await runtime.orca.apply(data.plan);
  }, "result");

  console.log("[main] azL IPC registered");
}

module.exports = Object.freeze({ registerAzlIpc });
