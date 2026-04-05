const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function toDataUrl(absPath, cache) {
  const key = path.resolve(absPath);
  if (cache.has(key)) return cache.get(key);

  let code = await fs.readFile(key, "utf8");
  const baseDir = path.dirname(key);

  const specifiers = Array.from(code.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)).map((m) => m[1]);
  const uniqueSpecs = [...new Set(specifiers)];

  for (const spec of uniqueSpecs) {
    const childPath = path.resolve(baseDir, spec);
    const childUrl = await toDataUrl(childPath, cache);
    const rx = new RegExp(`(from\\s+["'])${escapeRegExp(spec)}(["'])`, "g");
    code = code.replace(rx, `$1${childUrl}$2`);
  }

  const sourceUrl = pathToFileURL(key).href;
  const withSourceUrl = `${code}\n//# sourceURL=${sourceUrl}`;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(withSourceUrl, "utf8").toString("base64")}`;
  cache.set(key, dataUrl);
  return dataUrl;
}

async function importEsmFromFile(filePath) {
  const dataUrl = await toDataUrl(path.resolve(filePath), new Map());
  return import(dataUrl);
}

module.exports = {
  importEsmFromFile,
};
