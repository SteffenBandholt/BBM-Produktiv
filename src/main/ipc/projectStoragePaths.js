const path = require("path");

function sanitizeDirName(name) {
  const s = String(name || "").trim() || "Projekt";
  return s
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function resolveProjectFolderName(project = {}) {
  const number = String(
    project?.project_number ||
      project?.projectNumber ||
      project?.number ||
      ""
  ).trim();
  const short = String(project?.short || "").trim();
  const name = String(project?.name || "").trim();
  const label = short || name || "Projekt";
  const rawFolder = number ? `${number} - ${label}` : label;
  return sanitizeDirName(rawFolder);
}

function buildStoragePreviewPaths({ baseDir, project, pathApi = path } = {}) {
  const normalizedBase = String(baseDir || "").trim();
  const projectFolder = resolveProjectFolderName(project || {});
  const projectBaseDir = pathApi.join(normalizedBase, "bbm", projectFolder);
  return {
    baseDir: normalizedBase,
    projectFolder,
    protocolsDir: pathApi.join(projectBaseDir, "Protokolle"),
    previewDir: pathApi.join(projectBaseDir, "Vorabzug"),
    listsDir: pathApi.join(projectBaseDir, "Listen"),
    restarbeitenDir: pathApi.join(projectBaseDir, "Restarbeiten"),
  };
}

// Additive Zielregistrierung; bestehende Modulpfade bleiben unveraendert.
const MODULE_STORAGE_TARGETS = Object.freeze({
  sigeko: Object.freeze({ folder: "SiGeKo", targets: Object.freeze([
    "Unterlagen", "SiGePläne", "Zeichnungen", "Berichte",
  ]) }),
});

function storageError(code, message, targetPath) {
  return Object.assign(new Error(message), { code, path: targetPath });
}

function validateStoragePath(value, pathApi) {
  if (!pathApi.isAbsolute(value)) {
    throw storageError("INVALID_STORAGE_PATH", "Speicherpfad muss absolut sein.", value);
  }
  // Windows-Regeln auch bei plattformuebergreifender Pfadpruefung erhalten.
  const root = pathApi.parse(value).root;
  if (pathApi.sep === "\\" && !/^[A-Za-z]:[\\/]$/.test(root) &&
      !/^[\\/]{2}[^<>:"|?*\\/]+[\\/][^<>:"|?*\\/]+[\\/]?$/.test(root)) {
    throw storageError("INVALID_STORAGE_PATH", "Windows-Speicherpfad benoetigt Laufwerk oder UNC-Freigabe.", value);
  }
  const parts = value.slice(root.length).split(pathApi.sep === "\\" ? /[\\/]/ : /\//);
  if (/[\u0000-\u001f]/.test(value) || parts.some((part) =>
    /[<>:"|?*\\]/.test(part) || /[. ]$/.test(part) ||
    /^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\.|$)/i.test(part))) {
    throw storageError("INVALID_STORAGE_PATH", "Speicherpfad enthaelt ungueltige Windows-Pfadbestandteile.", value);
  }
}

// Reine Aufloesung: Vorschau, Anlage und Oeffnen verwenden denselben Pfad.
function buildModuleStoragePaths({ moduleId, baseDir, project, pathApi = path } = {}) {
  const definition = Object.hasOwn(MODULE_STORAGE_TARGETS, moduleId) ? MODULE_STORAGE_TARGETS[moduleId] : null;
  if (!definition) throw storageError("INVALID_STORAGE_MODULE", "Unbekanntes Speichermodul.");
  const normalizedBase = String(baseDir || "").trim();
  validateStoragePath(normalizedBase, pathApi);
  const preview = buildStoragePreviewPaths({ baseDir: normalizedBase, project, pathApi });
  validateStoragePath(`${normalizedBase}${pathApi.sep}${preview.projectFolder}`, pathApi);
  const moduleDir = pathApi.join(pathApi.dirname(preview.protocolsDir), definition.folder);
  validateStoragePath(moduleDir, pathApi);
  return {
    baseDir: normalizedBase, projectFolder: preview.projectFolder, moduleDir,
    targets: Object.fromEntries(definition.targets.map((name) => [name, pathApi.join(moduleDir, name)])),
  };
}

// Gemeinsamer technischer Zugriff, keine Modulsettings oder zweite Pfadverwaltung.
// baseDir bleibt der bestehende aufrufbezogene Basis-Override.
function createProjectStorageAccess({
  getProject = (id) => require("../db/projectsRepo").getById(id),
  getBaseDir = () => {
    const settings = require("../db/appSettingsRepo").appSettingsGetMany(["pdf.protocolsDir"]);
    return String(settings?.["pdf.protocolsDir"] || "").trim() || require("electron").app.getPath("downloads");
  },
  fs = require("node:fs"),
  openPath = (dir) => require("electron").shell.openPath(dir),
  pathApi = path,
} = {}) {
  function resolve({ projectId, moduleId, baseDir } = {}) {
    const id = String(projectId || "").trim();
    if (!id) throw storageError("PROJECT_REQUIRED", "Projekt-ID fehlt.");
    const project = getProject(id);
    if (!project) throw storageError("PROJECT_NOT_FOUND", "Projekt nicht gefunden.");
    return buildModuleStoragePaths({ moduleId, project, baseDir: baseDir ?? getBaseDir(), pathApi });
  }
  function ensureDirectory(dir) {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, require("node:fs").constants.W_OK);
  }
  return Object.freeze({
    resolve,
    ensure(input) {
      const result = resolve(input);
      for (const dir of Object.values(result.targets)) ensureDirectory(dir);
      return result;
    },
    async open(input = {}) {
      const result = resolve(input);
      const dir = Object.hasOwn(result.targets, input.target) ? result.targets[input.target] : null;
      if (!dir) throw storageError("INVALID_STORAGE_TARGET", "Unbekanntes Speicherziel.");
      ensureDirectory(dir);
      const error = await openPath(dir);
      if (error) throw storageError("STORAGE_OPEN_FAILED", String(error), dir);
      return { dir };
    },
  });
}

module.exports = {
  MODULE_STORAGE_TARGETS,
  buildModuleStoragePaths,
  createProjectStorageAccess,
  sanitizeDirName,
  resolveProjectFolderName,
  buildStoragePreviewPaths,
};
