"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repositoryRoot = path.resolve(__dirname, "..");
const kitRoot = path.resolve(repositoryRoot, "..", "UI-Editor-kit");
const projectPath = path.join(kitRoot, "windows-manager", "src", "UiEditorKit.Manager.Wpf", "UiEditorKit.Manager.Wpf.csproj");
const buildRoot = path.join(repositoryRoot, "build");
const outputPath = path.join(buildRoot, "ui-editor-manager");

if (!fs.existsSync(projectPath)) {
  console.error("Der vertrauenswürdige UI-Editor-Manager-Quellpfad fehlt.");
  process.exit(80);
}
if (path.dirname(outputPath) !== buildRoot || !outputPath.startsWith(`${buildRoot}${path.sep}`)) {
  console.error("Ungültiges UI-Editor-Ausgabeverzeichnis.");
  process.exit(81);
}

fs.rmSync(outputPath, { recursive: true, force: true });
fs.mkdirSync(outputPath, { recursive: true });
const result = spawnSync("dotnet", ["publish", projectPath, "-c", "Release", "--no-restore", "-o", outputPath], {
  cwd: kitRoot,
  encoding: "utf8",
  stdio: "inherit",
  shell: false,
});
if (result.error || result.status !== 0 || !fs.existsSync(path.join(outputPath, "UiEditorManager.exe"))) {
  console.error("Der UI-Editor-Manager konnte nicht für BBM vorbereitet werden.");
  process.exit(typeof result.status === "number" ? result.status : 82);
}
console.log(`UI-Editor-Manager vorbereitet: ${outputPath}`);
