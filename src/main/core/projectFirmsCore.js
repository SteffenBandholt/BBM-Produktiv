// Core-Eigentum fuer projektbezogene Firmen-/Personenzuordnungen.
// Die bestehende Fachlogik bleibt in Service/Repositories; hier wird nur die
// Core-Komposition sichtbar gemacht. Keine zweite Projektfirmenlogik.
const { createProjectFirmsService } = require("../domain/ProjectFirmsService");
const { registerProjectFirmsIpc } = require("../ipc/projectFirmsIpc");

function registerCoreProjectFirmsIpc() {
  return registerProjectFirmsIpc();
}

module.exports = {
  createProjectFirmsService,
  registerCoreProjectFirmsIpc,
};
