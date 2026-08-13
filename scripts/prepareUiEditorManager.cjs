"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const repositoryRoot = path.resolve(__dirname, "..");
const kitRoot = path.resolve(repositoryRoot, "..", "UI-Editor-kit");
const projectPath = path.join(kitRoot, "windows-manager", "src", "UiEditorKit.Manager.Wpf", "UiEditorKit.Manager.Wpf.csproj");
const buildRoot = path.join(repositoryRoot, "build");
const outputPath = path.join(buildRoot, "ui-editor-manager");
const buildIdentityFileName = "ui-editor-build.json";

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readGitValue(args, fallback = "unknown") {
  const result = spawnSync("git", ["-C", kitRoot, ...args], { encoding: "utf8", shell: false });
  const value = String(result.stdout || "").trim();
  return result.status === 0 && value ? value : fallback;
}

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
const executablePath = path.join(outputPath, "UiEditorManager.exe");
const assemblyPath = path.join(outputPath, "UiEditorManager.dll");
if (result.error || result.status !== 0 || !fs.existsSync(executablePath) || !fs.existsSync(assemblyPath)) {
  console.error("Der UI-Editor-Manager konnte nicht für BBM vorbereitet werden.");
  process.exit(typeof result.status === "number" ? result.status : 82);
}
const sourceStatus = spawnSync("git", ["-C", kitRoot, "status", "--porcelain"], { encoding: "utf8", shell: false });
const assemblySha256 = sha256File(assemblyPath);
const buildIdentity = Object.freeze({
  schemaVersion: 1,
  buildId: `ui-editor:${assemblySha256.slice(0, 16)}`,
  sourceRepository: "UI-Editor-kit",
  sourceBranch: readGitValue(["branch", "--show-current"]),
  sourceCommit: readGitValue(["rev-parse", "HEAD"]),
  sourceDirty: sourceStatus.status === 0 ? Boolean(String(sourceStatus.stdout || "").trim()) : null,
  managerAssemblySha256: assemblySha256,
});
fs.writeFileSync(path.join(outputPath, buildIdentityFileName), `${JSON.stringify(buildIdentity, null, 2)}\n`, "utf8");
console.log(`UI-Editor-Manager vorbereitet: ${outputPath}`);
console.log(`[ui-editor-build] id=${buildIdentity.buildId} branch=${buildIdentity.sourceBranch} commit=${buildIdentity.sourceCommit} dirty=${buildIdentity.sourceDirty}`);
