const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function importEsmFromFile(filePath) {
  const absPath = path.resolve(filePath);
  const code = await fs.readFile(absPath, "utf8");
  const sourceUrl = pathToFileURL(absPath).href;
  const withSourceUrl = `${code}\n//# sourceURL=${sourceUrl}`;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(withSourceUrl, "utf8").toString("base64")}`;
  return import(dataUrl);
}

module.exports = {
  importEsmFromFile,
};
