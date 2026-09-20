"use strict";
// Edition staging for the existing scripts/dist.cjs -> electron-builder -> NSIS.
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const APP_ID = "de.bbm.baubesprechungsmanager.protokoll.abnahme";
const PRODUCT_NAME = "BBM Protokoll (Abnahme)";

function hashRuntimeTree(root, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...hashRuntimeTree(root, relative));
    else if (entry.isFile()) files.push({ file: relative.replaceAll(path.sep, "/"), sha256: sha256(fs.readFileSync(path.join(root, relative))) });
    else throw new Error(`Unexpected linked runtime entry: ${relative}`);
  }
  return files.sort((a, b) => a.file.localeCompare(b.file));
}

function copyDirectory(source, destination, extraFilter = () => true) {
  fs.cpSync(source, destination, { recursive: true, dereference: true, filter: (candidate) => {
    const relative = path.relative(source, candidate);
    return !relative.split(path.sep).includes("node_modules") && extraFilter(candidate, relative);
  } });
}

function resolvePackageDirectory(name, fromDirectory) {
  let cursor = fromDirectory;
  while (true) {
    const candidate = path.join(cursor, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(cursor);
    if (parent === cursor) return null;
    cursor = parent;
  }
}

function stageProductionDependencies(repoRoot, appRoot, dependencies) {
  const visited = new Set();
  const pending = Object.keys(dependencies || {}).map((name) => ({ name, from: repoRoot }));
  while (pending.length) {
    const { name, from, optional } = pending.shift();
    const directory = resolvePackageDirectory(name, from);
    if (!directory) { if (optional) continue; throw new Error(`Missing production dependency: ${name}`); }
    if (visited.has(directory)) continue;
    visited.add(directory);
    const metadata = JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8"));
    const destination = path.join(appRoot, path.relative(repoRoot, directory));
    if (!destination.startsWith(appRoot + path.sep)) throw new Error(`Dependency outside stage: ${name}`);
    if (name === "ui-editor-kit") {
      fs.mkdirSync(destination, { recursive: true });
      fs.copyFileSync(path.join(directory, "package.json"), path.join(destination, "package.json"));
      for (const part of ["src", "dist"]) copyDirectory(path.join(directory, part), path.join(destination, part));
      for (const part of ["LICENSE", "LICENSE.txt", "LICENSE.md"]) if (fs.existsSync(path.join(directory, part))) fs.copyFileSync(path.join(directory, part), path.join(destination, part));
    } else copyDirectory(directory, destination);
    for (const dependency of Object.keys(metadata.dependencies || {})) pending.push({ name: dependency, from: directory });
    for (const dependency of Object.keys(metadata.optionalDependencies || {})) pending.push({ name: dependency, from: directory, optional: true });
  }
  return visited.size;
}

function stageMsvcRuntime(repoRoot, env = process.env) {
  const redistRoot = env.BBM_MSVC_REDIST_X64 || "C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Redist/MSVC/14.44.35112/x64";
  const crt = fs.readdirSync(redistRoot).find((name) => /^Microsoft\.VC\d+\.CRT$/i.test(name));
  const openmp = fs.readdirSync(redistRoot).find((name) => /^Microsoft\.VC\d+\.OpenMP$/i.test(name));
  if (!crt || !openmp) throw new Error("MSVC x64 redistributable CRT/OpenMP directory required");
  const destination = path.join(repoRoot, "build/protokoll-msvc-runtime");
  fs.mkdirSync(destination, { recursive: true });
  const files = [];
  for (const directory of [crt, openmp]) for (const name of fs.readdirSync(path.join(redistRoot, directory)).filter((file) => /\.dll$/i.test(file))) {
    const source = path.join(redistRoot, directory, name);
    // Fail on unsigned/non-Microsoft binaries, rather than trust developer PATH.
    const signature = cp.spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "$s=Get-AuthenticodeSignature -LiteralPath $env:BBM_RUNTIME_SIGNATURE_FILE; if($s.Status -ne 'Valid' -or $s.SignerCertificate.Subject -notmatch 'Microsoft Corporation'){exit 1}"], { env: { ...env, BBM_RUNTIME_SIGNATURE_FILE: source }, windowsHide: true });
    if (signature.status !== 0) throw new Error(`Invalid Microsoft redistributable signature: ${name}`);
    const bytes = fs.readFileSync(source);
    fs.writeFileSync(path.join(destination, name), bytes);
    files.push({ file: name, sha256: sha256(bytes) });
  }
  const imported = require("./protokollSetupAudit.cjs").importedDlls;
  for (const entry of files) if (imported(path.join(destination, entry.file)).machine !== "8664") throw new Error(`Non-x64 runtime: ${entry.file}`);
  fs.writeFileSync(path.join(destination, "runtime-manifest.json"), JSON.stringify({ source: redistRoot, files }, null, 2) + "\n");
  return { destination, files };
}

function prepareProtokollBuild({ repoRoot, baseBuild, baseVersion, env = process.env }) {
  const appRoot = fs.mkdtempSync(path.join(repoRoot, "build/protokoll-app-"));
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  for (const part of ["src", "uiEditor"]) copyDirectory(path.join(repoRoot, part), path.join(appRoot, part));
  for (const part of ["ui-editor-target.json", "build/bbm-icon.ico"]) {
    fs.mkdirSync(path.dirname(path.join(appRoot, part)), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, part), path.join(appRoot, part));
  }
  const stagedPackage = { ...pkg };
  delete stagedPackage.build;
  delete stagedPackage.devDependencies;
  delete stagedPackage.scripts;
  // The local junction is materialized below; it is not a runtime dependency.
  stagedPackage.dependencies = { ...pkg.dependencies, "ui-editor-kit": "0.2.0" };
  fs.writeFileSync(path.join(appRoot, "package.json"), JSON.stringify(stagedPackage, null, 2) + "\n");
  const productionPackageCount = stageProductionDependencies(repoRoot, appRoot, pkg.dependencies);
  const kitRuntimeFiles = hashRuntimeTree(path.join(appRoot, "node_modules/ui-editor-kit"));
  const runtime = stageMsvcRuntime(repoRoot, env);
  const trackedRuntime = cp.execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "src", "scripts", "package.json", "package-lock.json", "channel.json", "uiEditor", "ui-editor-target.json", "resources/protokoll-layouts"], { cwd: repoRoot }).toString("utf8").split("\0").filter(Boolean).sort();
  const sourceFiles = trackedRuntime.filter((file) => fs.statSync(path.join(repoRoot, file)).isFile()).map((file) => ({ file, sha256: sha256(fs.readFileSync(path.join(repoRoot, file))) }));
  const provenance = {
    branch: cp.execFileSync("git", ["branch", "--show-current"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    head: cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    workingTree: "includes accepted uncommitted project tiles/meeting-series changes and local setup package",
    sourceFiles, sourceSha256: sha256(JSON.stringify(sourceFiles)), productionPackageCount,
    runtimeFiles: runtime.files, uiEditorKit: { version: "0.2.0", files: kitRuntimeFiles, sha256: sha256(JSON.stringify(kitRuntimeFiles)) }, createdAt: new Date().toISOString(),
  };
  // No personal absolute source/runtime paths in the delivered provenance.
  fs.writeFileSync(path.join(appRoot, "build-provenance.json"), JSON.stringify(provenance, null, 2) + "\n");
  const output = path.join("dist", "protokoll-abnahme");
  fs.mkdirSync(path.join(repoRoot, output), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, output, "build-provenance.json"), JSON.stringify(provenance, null, 2) + "\n");
  return {
    ...baseBuild, appId: APP_ID, productName: PRODUCT_NAME,
    npmRebuild: false, buildDependenciesFromSource: false,
    directories: { ...(baseBuild.directories || {}), app: appRoot, output },
    files: [...baseBuild.files, "build-provenance.json", "!**/*.bbmlic", "!**/*.db-*", "!**/*.sqlite-*", "!**/.env*", "!**/*private*key*", "!**/*credential*"],
    extraMetadata: { ...(baseBuild.extraMetadata || {}), name: "bbm-protokoll-abnahme", distributionId: "protokoll-acceptance", buildWorktreeSha256: provenance.sourceSha256 },
    extraResources: [
      ...baseBuild.extraResources.filter((entry) => entry.to !== "ui-editor" && !String(entry.to).startsWith("license/") && !String(entry.to).startsWith("internal-development-license/")),
      { from: "resources/protokoll-layouts", to: "protokoll-layouts" },
      { from: runtime.destination, to: "audio/whisper", filter: runtime.files.map((entry) => entry.file) },
    ],
    win: { ...baseBuild.win, target: [{ target: "nsis", arch: ["x64"] }], fileAssociations: [] },
    nsis: { ...baseBuild.nsis, shortcutName: "BBM-Protokoll-Abnahme", artifactName: `BBM-Protokoll-${baseVersion}-STABLE-Abnahme-Setup.exe`, perMachine: false, oneClick: true, runAfterFinish: true, deleteAppDataOnUninstall: false },
    publish: null,
  };
}

module.exports = { APP_ID, PRODUCT_NAME, stageProductionDependencies, stageMsvcRuntime, prepareProtokollBuild };
