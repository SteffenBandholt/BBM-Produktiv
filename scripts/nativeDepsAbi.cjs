const path = require("node:path");
const { spawnSync } = require("node:child_process");

function commandForAbi(target, { env = process.env } = {}) {
  if (target === "node") {
    const npmCliCandidates = [
      env.npm_execpath,
      path.resolve(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    ].filter(Boolean);
    const npmCli = npmCliCandidates.find((candidate) => require("node:fs").existsSync(candidate));
    if (!npmCli) throw new Error(`npm-cli.js nicht gefunden: ${npmCliCandidates.join(", ")}`);
    return {
      command: process.execPath,
      args: [npmCli, "rebuild", "better-sqlite3", "--runtime=node", `--target=${process.versions.node}`],
      env: { ...env, npm_config_runtime: "node", npm_config_target: process.versions.node },
      label: `Node ${process.versions.node} / ABI ${process.versions.modules}`,
    };
  }
  if (target === "electron") {
    const builder = path.resolve(__dirname, "..", "node_modules", "electron-builder", "cli.js");
    return {
      command: process.execPath,
      args: [builder, "install-app-deps"],
      env: { ...env, ELECTRON_RUN_AS_NODE: "" },
      label: "Electron gemäß package.json",
    };
  }
  throw new Error(`Unbekanntes natives ABI-Ziel: ${target}`);
}

function switchNativeAbi(target, { spawnSyncImpl = spawnSync, log = console } = {}) {
  const command = commandForAbi(target);
  log.log(`[native-abi] START ${command.label}`);
  const result = spawnSyncImpl(command.command, command.args, {
    cwd: path.resolve(__dirname, ".."),
    env: command.env,
    stdio: "inherit",
    windowsHide: true,
  });
  const status = typeof result.status === "number" ? result.status : 1;
  if (status !== 0 || result.error) {
    log.error(`[native-abi] FEHLER ${command.label}: ${result.error?.message || `Exitcode ${status}`}`);
    return status || 1;
  }
  log.log(`[native-abi] OK ${command.label}`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = switchNativeAbi(process.argv[2]);
  } catch (error) {
    process.exitCode = 1;
    console.error(`[native-abi] FEHLER: ${error?.message || error}`);
  }
}

module.exports = { commandForAbi, switchNativeAbi };
