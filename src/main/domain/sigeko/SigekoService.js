// Technischer Einstieg. Fachoperationen kommen erst mit ihren eigenen Paketen.
// Autorisierung bleibt am gemeinsamen modularen IPC-Guard.
function createSigekoService() {
  return Object.freeze({
    getModuleInfo() {
      return Object.freeze({ moduleId: "sigeko", moduleType: "project" });
    },
  });
}

module.exports = Object.freeze({ createSigekoService });
