// src/main/ipc/projectsIpc.js
// TECH-CONTRACT (verbindlich): docs/UI-TECH-CONTRACT.md
// CONTRACT-VERSION: 1.0.1
const { ipcMain, app } = require("electron");
const { appSettingsGetMany } = require("../db/appSettingsRepo");
const projectsRepo = require("../db/projectsRepo");
const { buildStoragePreviewPaths } = require("./projectStoragePaths");
const { toLicenseErrorPayload } = require("../licensing/featureGuard");

function _isLicenseError(err) {
  const message = String(err?.message || "");
  return !!err?.licenseError || message.startsWith("LICENSE_") || message.startsWith("FEATURE_NOT_ALLOWED:");
}

function _runProjectTask(task) {
  try {
    return task();
  } catch (err) {
    if (_isLicenseError(err)) {
      return toLicenseErrorPayload(err);
    }
    return { ok: false, error: err?.message || String(err) };
  }
}

function registerProjectsIpc() {
  ipcMain.handle("projects:list", () =>
    _runProjectTask(() => {
      const list = projectsRepo.listAll();
      return { ok: true, list };
    })
  );

  ipcMain.handle("projects:listArchived", () =>
    _runProjectTask(() => {
      const list = projectsRepo.listArchived();
      return { ok: true, list };
    })
  );

  ipcMain.handle("projects:archive", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
      if (!projectId) throw new Error("projectId required");
      const project = projectsRepo.archiveProject(projectId);
      return { ok: true, project };
    })
  );

  ipcMain.handle("projects:unarchive", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
      if (!projectId) throw new Error("projectId required");
      const project = projectsRepo.unarchiveProject(projectId);
      return { ok: true, project };
    })
  );

  ipcMain.handle("projects:deleteForever", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
      if (!projectId) throw new Error("projectId required");
      projectsRepo.deleteForever(projectId);
      return { ok: true };
    })
  );

  // Abwärtskompatibel:
  // - bisher: { name }
  // - neu:    inkl. project_number (Projektnummer)
  ipcMain.handle("projects:create", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};

      const name = (d.name ?? d.bezeichnung ?? "").toString().trim();

      const payload = {
        name,

        // ✅ Projektnummer (snake_case + camelCase + "projektnummer" fallback)
        project_number:
          d.project_number ?? d.projectNumber ?? d.projektnummer ?? d.projektNummer ?? null,

        short: d.short ?? null,
        street: d.street ?? null,
        zip: d.zip ?? null,
        city: d.city ?? null,

        project_lead: d.project_lead ?? d.projectLead ?? null,
        project_lead_phone: d.project_lead_phone ?? d.projectLeadPhone ?? null,

        start_date: d.start_date ?? d.startDate ?? null,
        end_date: d.end_date ?? d.endDate ?? null,

        notes: d.notes ?? null,
      };

      const project = projectsRepo.createProject(payload);
      return { ok: true, project };
    })
  );

  // Update:
  // { projectId|id, patch } oder { projectId|id, ...patchFields }
  ipcMain.handle("projects:update", (_e, data) =>
    _runProjectTask(() => {
      const project = projectsRepo.updateProject(data || {});
      return { ok: true, project };
    })
  );

  ipcMain.handle("projects:storagePreview", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const settings = appSettingsGetMany(["pdf.protocolsDir"]) || {};
      const baseDirRaw = String(settings["pdf.protocolsDir"] || "").trim();
      const baseDir = baseDirRaw || app.getPath("downloads");
      const preview = buildStoragePreviewPaths({
        baseDir,
        project: {
          project_number: d.project_number ?? d.projectNumber ?? d.number ?? "",
          short: d.short ?? "",
          name: d.name ?? "",
        },
      });
      return { ok: true, ...preview };
    })
  );
}

module.exports = { registerProjectsIpc };
