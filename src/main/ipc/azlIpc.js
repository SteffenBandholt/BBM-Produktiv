"use strict";

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
        return firms.get(payload?.ref || payload);
      },
      listAll(payload) {
        return firms.listAll(payload || {});
      },
      listProjectParticipants(payload) {
        return firms.listProjectParticipants(payload || {});
      },
      create(payload) {
        return firms.create(payload || {});
      },
      update(payload) {
        return firms.update(payload || {});
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
      ] = await Promise.all([
        import("bbm-azl/src/infrastructure/sqlite/AzlRepository.js"),
        import("bbm-azl/src/application/AzlService.js"),
        import("bbm-azl/src/application/AzlListService.js"),
        import("bbm-azl/src/application/ProjectContractService.js"),
        import("bbm-azl/src/application/ReportingService.js"),
      ]);

      const repository = new AzlRepository({ db: initDatabase() });
      const { projectPort, firmsPort } = createPorts();

      return Object.freeze({
        repository,
        azl: new AzlService({ repository }),
        azlList: new AzlListService({ repository }),
        contracts: new ProjectContractService({ projectPort, firmsPort, repository }),
        reporting: new ReportingService({ repository }),
      });
    })();
  }
  return runtimePromise;
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
  handle("azl:report:project", (runtime, data) => runtime.reporting.project(data.projectId), "report");
  handle("azl:report:firm", (runtime, data) => runtime.reporting.firm(data.contractId), "report");

  console.log("[main] azL IPC registered");
}

module.exports = Object.freeze({ registerAzlIpc });
