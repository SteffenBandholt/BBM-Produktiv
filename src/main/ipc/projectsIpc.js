// src/main/ipc/projectsIpc.js
// TECH-CONTRACT (verbindlich): docs/UI-TECH-CONTRACT.md
// CONTRACT-VERSION: 1.0.1
const { ipcMain, app, shell } = require("electron");
const { appSettingsGetMany } = require("../db/appSettingsRepo");
const projectsRepo = require("../db/projectsRepo");
const { buildStoragePreviewPaths } = require("./projectStoragePaths");
const { toLicenseErrorPayload } = require("../licensing/featureGuard");
const fs = require("fs");
const path = require("path");

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

function _projectStorage(project) {
  const settings = appSettingsGetMany(["pdf.protocolsDir"]) || {};
  const baseDir = String(settings["pdf.protocolsDir"] || "").trim() || app.getPath("downloads");
  const preview = buildStoragePreviewPaths({ baseDir, project: project || {} });
  return {
    rootDir: path.resolve(baseDir, "bbm"),
    projectDir: path.resolve(path.dirname(preview.protocolsDir)),
    preview,
  };
}

function _isInside(rootDir, targetPath, { allowRoot = false } = {}) {
  const root = path.resolve(String(rootDir || ""));
  const target = path.resolve(String(targetPath || ""));
  if (!root || !target) return false;
  if (allowRoot && target === root) return true;
  const relative = path.relative(root, target);
  return !!relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function _removeArchiveFiles({ project, moduleId = null, deletedFilePaths = [] }) {
  const warnings = [];
  const storage = _projectStorage(project);
  const targets = [];

  if (!moduleId) {
    if (path.dirname(storage.projectDir) === storage.rootDir) targets.push(storage.projectDir);
  } else if (moduleId === "protokoll") {
    targets.push(storage.preview.protocolsDir, storage.preview.previewDir);
  } else if (moduleId === "restarbeiten") {
    targets.push(storage.preview.restarbeitenDir);
  }

  for (const filePath of deletedFilePaths || []) {
    const normalized = String(filePath || "").trim();
    if (normalized && _isInside(storage.rootDir, normalized)) targets.push(normalized);
  }

  for (const targetPath of [...new Set(targets.map((value) => path.resolve(value)))]) {
    const isProjectTarget = targetPath === storage.projectDir;
    const safe = isProjectTarget
      ? path.dirname(targetPath) === storage.rootDir
      : _isInside(storage.rootDir, targetPath);
    if (!safe) {
      warnings.push(`Unsicherer Archivpfad wurde nicht gelöscht: ${targetPath}`);
      continue;
    }
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } catch (error) {
      warnings.push(`Archivdateien konnten nicht vollständig gelöscht werden (${targetPath}): ${error?.message || error}`);
    }
  }

  return warnings;
}

function _archiveType(data) {
  const value = String(data?.archiveType ?? data?.archive_type ?? "").trim().toLowerCase();
  if (value !== "project" && value !== "module") throw new Error("archiveType invalid");
  return value;
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

  ipcMain.handle("projects:listArchiveEntries", () =>
    _runProjectTask(() => {
      const list = projectsRepo.listArchiveEntries();
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

  ipcMain.handle("projects:archiveModule", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const project = projectsRepo.archiveModule(
        d.projectId ?? d.project_id ?? d.id ?? null,
        d.moduleId ?? d.module_id ?? null
      );
      return { ok: true, project };
    })
  );

  ipcMain.handle("projects:restoreArchive", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
      const archiveType = _archiveType(d);
      const project = archiveType === "project"
        ? projectsRepo.unarchiveProject(projectId)
        : projectsRepo.unarchiveModule(projectId, d.moduleId ?? d.module_id ?? null);
      return { ok: true, project };
    })
  );

  ipcMain.handle("projects:deleteArchiveForever", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
      const archiveType = _archiveType(d);
      const project = projectsRepo.getById(projectId);
      if (!project) throw new Error("project not found");
      const moduleId = archiveType === "module"
        ? String(d.moduleId ?? d.module_id ?? "").trim().toLowerCase()
        : null;
      const result = archiveType === "project"
        ? projectsRepo.deleteArchivedProject(projectId)
        : projectsRepo.deleteArchivedModule(projectId, moduleId);
      const warnings = _removeArchiveFiles({
        project,
        moduleId,
        deletedFilePaths: result?.deletedFilePaths || [],
      });
      return { ok: true, ...(warnings.length ? { warning: warnings.join(" | ") } : {}) };
    })
  );

  ipcMain.handle("projects:deleteForever", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
      if (!projectId) throw new Error("projectId required");
      const project = projectsRepo.getById(projectId);
      const result = projectsRepo.deleteArchivedProject(projectId);
      const warnings = _removeArchiveFiles({
        project,
        deletedFilePaths: result?.deletedFilePaths || [],
      });
      return { ok: true, ...(warnings.length ? { warning: warnings.join(" | ") } : {}) };
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

  ipcMain.handle("projects:assignModule", (_e, data) =>
    _runProjectTask(() => {
      const d = data && typeof data === "object" ? data : {};
      const project = projectsRepo.assignModule(
        d.projectId ?? d.project_id ?? d.id ?? null,
        d.moduleId ?? d.module_id ?? null
      );
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

  ipcMain.handle("projects:openRestarbeitenDir", async (_e, data) => {
    let dir = "";
    try {
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
      dir = String(preview.restarbeitenDir || "").trim();
      if (!dir) return { ok: false, error: "Ordnerpfad fehlt", dir: "" };
      fs.mkdirSync(dir, { recursive: true });
      const errorText = await shell.openPath(dir);
      if (errorText) return { ok: false, error: String(errorText), dir };
      return { ok: true, dir };
    } catch (err) {
      if (_isLicenseError(err)) {
        return toLicenseErrorPayload(err);
      }
      return { ok: false, error: err?.message || String(err), dir };
    }
  });

}

module.exports = { registerProjectsIpc };
