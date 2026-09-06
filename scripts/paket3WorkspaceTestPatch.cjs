const fs = require("node:fs");
const path = require("node:path");

const filePath = path.join(process.cwd(), "scripts/tests/projektverwaltungModule.test.cjs");
let source = fs.readFileSync(filePath, "utf8");

const replacements = [
  [
`      projectModules: [
        {
          moduleId: "protokoll",
          label: "Protokoll",
          description: "Protokoll im aktuellen Projekt öffnen.",
        },
        {
          moduleId: "projectFirms",
          label: "Firmen im Projekt",
          description: "Projektbezogene Firmen und Mitarbeiter im aktuellen Projekt öffnen.",
        },
      ],`,
`      projectModules: [
        {
          moduleId: "protokoll",
          label: "Protokoll",
          description: "Protokoll im aktuellen Projekt öffnen.",
        },
      ],`,
  ],
  [
`        ["protokoll", "projectFirms"]`,
`        ["protokoll"]`,
  ],
  [
`        ["Protokoll", "Firmen im Projekt"]`,
`        ["Protokoll"]`,
  ],
  [
`      const openedFirms = await screen.openProjectModule("projectFirms");`,
`      assert.deepEqual(
        screen.getAvailableCoreProjectActions().map((item) => item.coreActionId),
        ["projectFirms"]
      );

      const openedFirms = await screen.openCoreProjectAction("projectFirms");`,
  ],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) {
    throw new Error(`Workspace-Test-Patchmuster fehlt:\n${before}`);
  }
  source = source.replace(before, after);
}

fs.writeFileSync(filePath, source, "utf8");
console.log("Projektworkspace-Test auf Core-Aktion umgestellt.");
