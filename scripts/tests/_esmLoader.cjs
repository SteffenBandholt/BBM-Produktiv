const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const modulePromiseCache = new Map();
const materializationCache = new Map();
const mirrorRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-esm-loader-"));
fs.writeFileSync(path.join(mirrorRoot, "package.json"), '{"type":"module"}\n', "utf8");

function mirrorPath(absPath) {
  const parsed = path.parse(absPath);
  const rootName = parsed.root.replace(/[:\\/]+/g, "_") || "root";
  return path.join(mirrorRoot, rootName, path.relative(parsed.root, absPath));
}

function collectRelativeSpecifiers(code) {
  const patterns = [
    /from\s+["'](\.{1,2}\/[^"']+)["']/g,
    /import\s+["'](\.{1,2}\/[^"']+)["']/g,
  ];
  return patterns.flatMap((pattern) => Array.from(code.matchAll(pattern), (match) => match[1]));
}

function materializeFile(absPath) {
  const sourcePath = path.resolve(absPath);
  let materialization = materializationCache.get(sourcePath);
  if (!materialization) {
    materialization = (async () => {
      const targetPath = mirrorPath(sourcePath);
      const code = await fsp.readFile(sourcePath, "utf8");
      await fsp.mkdir(path.dirname(targetPath), { recursive: true });
      await fsp.writeFile(targetPath, `${code}\n//# sourceURL=${pathToFileURL(sourcePath).href}\n`, "utf8");
      return { sourcePath, targetPath, code };
    })();
    materializationCache.set(sourcePath, materialization);
  }
  return materialization;
}

async function materializeGraph(absPath) {
  const rootPath = path.resolve(absPath);
  const pending = [rootPath];
  const visited = new Set();
  while (pending.length > 0) {
    const sourcePath = pending.shift();
    if (visited.has(sourcePath)) continue;
    visited.add(sourcePath);
    const materialized = await materializeFile(sourcePath);
    const baseDir = path.dirname(sourcePath);
    for (const specifier of collectRelativeSpecifiers(materialized.code)) {
      pending.push(path.resolve(baseDir, specifier));
    }
  }
  return mirrorPath(rootPath);
}

async function importEsmFromFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  let modulePromise = modulePromiseCache.get(resolvedPath);
  if (!modulePromise) {
    modulePromise = materializeGraph(resolvedPath).then((targetPath) => import(pathToFileURL(targetPath).href));
    modulePromiseCache.set(resolvedPath, modulePromise);
  }
  return modulePromise;
}

process.once("exit", () => {
  try {
    fs.rmSync(mirrorRoot, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup during process shutdown.
  }
});

module.exports = { importEsmFromFile };
