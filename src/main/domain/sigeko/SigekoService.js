const { createProjectStorageAccess } = require("../../ipc/projectStoragePaths");

// Technischer Einstieg. Fachoperationen kommen erst mit ihren eigenen Paketen.
// Autorisierung bleibt am gemeinsamen modularen IPC-Guard.
function createSigekoService({ storage = createProjectStorageAccess() } = {}) {
  const input = (payload = {}) => ({ projectId: payload.projectId, baseDir: payload.baseDir, target: payload.target, moduleId: "sigeko" });
  return Object.freeze({
    getStoragePaths(payload) { return storage.resolve(input(payload)); },
    ensureStorageDirectories(payload) { return storage.ensure(input(payload)); },
    openStorageDirectory(payload) { return storage.open(input(payload)); },
    getModuleInfo() {
      return Object.freeze({ moduleId: "sigeko", moduleType: "project" });
    },
  });
}

module.exports = Object.freeze({ createSigekoService });
